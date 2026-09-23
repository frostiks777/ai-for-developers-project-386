import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import { eq, gte } from 'drizzle-orm'
import Fastify, { type FastifyInstance } from 'fastify'
import { defaultAvailabilityRules } from './availability'
import { db } from './db'
import { bookings, slots } from './db/schema'
import type { BookingWithSlot, TimeSlot } from './types'
import { createBookingSchema } from './validation'

// Фабрика приложения: тесты создают изолированный инстанс без listen()
export async function buildApp(): Promise<FastifyInstance> {
  // В тестах логи Fastify не нужны (vitest выставляет NODE_ENV=test)
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  const minNoticeMs = defaultAvailabilityRules.minNoticeMin * 60 * 1000

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
      .where(gte(slots.startAt, new Date(Date.now() + minNoticeMs).toISOString()))
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
      return reply.code(400).send({ error: message })
    }

    const { slotId, name, phone, email, comment } = parsed.data

    const slot = db.select().from(slots).where(eq(slots.id, slotId)).get()
    if (!slot) {
      return reply.code(404).send({ error: 'Слот не найден' })
    }

    if (slot.startAt < new Date().toISOString()) {
      return reply.code(400).send({ error: 'Слот уже прошёл' })
    }

    if (slot.startAt < new Date(Date.now() + minNoticeMs).toISOString()) {
      return reply.code(400).send({ error: 'Слот уже недоступен' })
    }

    try {
      const created = db
        .insert(bookings)
        .values({ slotId, name, phone: phone ?? null, email, comment: comment ?? null })
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