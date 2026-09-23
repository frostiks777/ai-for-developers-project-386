import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import { eq, gte } from 'drizzle-orm'
import Fastify, { type FastifyInstance } from 'fastify'
import { db } from './db'
import { bookings, slots } from './db/schema'
import { loadAvailabilityRules, regenerateFutureSlots, saveAvailabilityRules } from './rules'
import type { BookingWithSlot, TimeSlot } from './types'
import { availabilityRulesSchema, cancelBookingSchema, createBookingSchema } from './validation'

// Фабрика приложения: тесты создают изолированный инстанс без listen()
export async function buildApp(): Promise<FastifyInstance> {
  // В тестах логи Fastify не нужны (vitest выставляет NODE_ENV=test)
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  const minNoticeMs = () => loadAvailabilityRules().minNoticeMin * 60 * 1000

  app.get('/health', () => ({ status: 'ok' }))

  // Слоты в будущем с признаком занятости, отсортированные по startAt
  app.get('/api/slots', (): TimeSlot[] => {
    const rows = db
      .select({
        id: slots.id,
        startAt: slots.startAt,
        durationMin: slots.durationMin,
        bookingId: bookings.id,
      })
      .from(slots)
      .leftJoin(bookings, eq(bookings.slotId, slots.id))
      .where(gte(slots.startAt, new Date(Date.now() + minNoticeMs()).toISOString()))
      .orderBy(slots.startAt)
      .all()

    return rows.map((row) => ({
      id: row.id,
      startAt: row.startAt,
      durationMin: row.durationMin,
      isBooked: row.bookingId !== null,
    }))
  })

  // Список броней с данными слота (для панели организатора), по времени начала
  app.get('/api/bookings', (): BookingWithSlot[] => {
    return db
      .select({
        id: bookings.id,
        slotId: bookings.slotId,
        name: bookings.name,
        phone: bookings.phone,
        email: bookings.email,
        comment: bookings.comment,
        createdAt: bookings.createdAt,
        startAt: slots.startAt,
        durationMin: slots.durationMin,
      })
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .orderBy(slots.startAt)
      .all()
  })

  app.post('/api/bookings', (request, reply) => {
    const parsed = createBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    const { slotId, name, phone, email, comment } = parsed.data

    const slot = db.select().from(slots).where(eq(slots.id, slotId)).get()
    if (!slot) {
      return reply.code(404).send({ error: 'Слот не найден' })
    }

    if (slot.startAt < new Date().toISOString()) {
      return reply.code(400).send({ error: 'Слот уже прошёл' })
    }

    if (slot.startAt < new Date(Date.now() + minNoticeMs()).toISOString()) {
      return reply.code(400).send({ error: 'Слот уже недоступен' })
    }

    try {
      const created = db
        .insert(bookings)
        .values({
          slotId,
          name,
          phone: phone ?? null,
          email,
          comment: comment ?? null,
          cancelToken: randomUUID(),
        })
        .returning()
        .get()

      return reply.code(201).send(created)
    } catch (error) {
      if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.code(409).send({ error: 'Слот уже занят' })
      }

      throw error
    }
  })

  // Отмена брони организатором — слот снова становится свободным
  app.delete('/api/bookings/:id', (request, reply) => {
    const id = Number((request.params as { id: string }).id)

    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send({ error: 'Некорректный id брони' })
    }

    const deleted = db.delete(bookings).where(eq(bookings.id, id)).returning().get()

    if (!deleted) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Публичная отмена брони по токену из ссылки на экране успеха
  app.post('/api/bookings/cancel', (request, reply) => {
    const parsed = cancelBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Укажите токен отмены'
      return reply.code(422).send({ error: message })
    }

    const deleted = db
      .delete(bookings)
      .where(eq(bookings.cancelToken, parsed.data.token))
      .returning()
      .get()

    if (!deleted) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Текущие правила доступности организатора
  app.get('/api/availability', () => loadAvailabilityRules())

  // Обновление правил: сохраняем и пересобираем будущие свободные слоты
  app.put('/api/availability', (request, reply) => {
    const parsed = availabilityRulesSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные правила доступности'
      return reply.code(422).send({ error: message })
    }

    saveAvailabilityRules(parsed.data)
    regenerateFutureSlots(parsed.data)

    return loadAvailabilityRules()
  })

  // В продакшене Fastify отдаёт собранный Vite-фронтенд из dist/
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const distDir = path.resolve(currentDir, '..', 'dist')

  if (existsSync(distDir)) {
    await app.register(fastifyStatic, { root: distDir, prefix: '/' })

    // SPA fallback: любой GET вне /api отдаёт index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }

      return reply.code(404).send({ error: 'Не найдено' })
    })
  }

  return app
}