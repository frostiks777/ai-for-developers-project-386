import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import { and, eq, gte } from 'drizzle-orm'
import Fastify, { type FastifyInstance } from 'fastify'
import { db } from './db'
import { bookings, eventTypes, hosts, slots } from './db/schema'
import {
  cancelBookingV1,
  createBookingV1,
  findActiveBookingForSlot,
  findBookingByPublicId,
  findOtherActiveBooking,
  findSlotByStartAt,
  rescheduleBookingV1,
} from './bookings-v1'
import { loadAvailabilitySettings, saveAvailabilitySettings } from './availability-settings'
import {
  createEventType,
  deleteEventType,
  findEventType,
  findEventTypeById,
  listEventTypes,
  updateEventType,
} from './event-types'
import { dateKeyInZone, dateKeyPattern, isValidTimeZone } from './hosts'
import { loadAvailabilityRules, regenerateFutureSlots, saveAvailabilityRules } from './rules'
import type { BookingWithSlot, HostSettings, TimeSlot } from './types'
import {
  availabilityRulesSchema,
  availabilitySettingsSchema,
  cancelBookingSchema,
  createBookingSchema,
  createEventTypeSchema,
  rescheduleBookingSchema,
  updateEventTypeSchema,
  v1CreateBookingSchema,
  v1RescheduleBookingSchema,
} from './validation'

// Единый набор колонок для выборок «бронь + данные слота»
const bookingWithSlotColumns = {
  id: bookings.id,
  slotId: bookings.slotId,
  name: bookings.name,
  phone: bookings.phone,
  email: bookings.email,
  comment: bookings.comment,
  status: bookings.status,
  cancelToken: bookings.cancelToken,
  eventTypeId: bookings.eventTypeId,
  eventTypeTitle: eventTypes.title,
  createdAt: bookings.createdAt,
  startAt: slots.startAt,
  durationMin: slots.durationMin,
}

// Фабрика приложения: тесты создают изолированный инстанс без listen()
export async function buildApp(): Promise<FastifyInstance> {
  // В тестах логи Fastify не нужны (vitest выставляет NODE_ENV=test)
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  const minNoticeMs = () => loadAvailabilityRules().minNoticeMin * 60 * 1000

  app.get('/health', () => ({ status: 'ok' }))

  // Слоты в будущем с признаком занятости, отсортированные по startAt
  const selectFutureSlots = (): TimeSlot[] => {
    const rows = db
      .select({
        id: slots.id,
        startAt: slots.startAt,
        durationMin: slots.durationMin,
        bookingId: bookings.id,
      })
      .from(slots)
      .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, 'confirmed')))
      .where(gte(slots.startAt, new Date(Date.now() + minNoticeMs()).toISOString()))
      .orderBy(slots.startAt)
      .all()

    return rows.map((row) => ({
      id: row.id,
      startAt: row.startAt,
      durationMin: row.durationMin,
      isBooked: row.bookingId !== null,
    }))
  }

  app.get('/api/slots', (): TimeSlot[] => selectFutureSlots())

  // Список броней с данными слота (для панели организатора), по времени начала
  app.get('/api/bookings', (): BookingWithSlot[] => {
    return db
      .select(bookingWithSlotColumns)
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
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
          startAt: slot.startAt,
          endAt: new Date(
            new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
          ).toISOString(),
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

  // Бронь по токену (для страницы переноса): отдаёт текущее время слота
  app.get('/api/bookings/by-token/:token', (request, reply) => {
    const { token } = request.params as { token: string }

    const booking = db
      .select(bookingWithSlotColumns)
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.cancelToken, token))
      .get()

    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return booking
  })

  // Перенос брони на другой слот по токену; старый слот освобождается
  app.post('/api/bookings/reschedule', (request, reply) => {
    const parsed = rescheduleBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидный запрос переноса'
      return reply.code(400).send({ error: message })
    }

    const { token, slotId } = parsed.data

    const booking = db.select().from(bookings).where(eq(bookings.cancelToken, token)).get()
    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

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

    if (booking.slotId !== slotId) {
      try {
        db.update(bookings)
          .set({
            slotId,
            startAt: slot.startAt,
            endAt: new Date(
              new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
            ).toISOString(),
          })
          .where(eq(bookings.id, booking.id))
          .run()
      } catch (error) {
        if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return reply.code(409).send({ error: 'Слот уже занят' })
        }

        throw error
      }
    }

    return db
      .select(bookingWithSlotColumns)
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.id, booking.id))
      .get()
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

  // ── API v1: мульти-хост ──────────────────────────────────────────────
  // Читает хост по slug; null, если не найден (роуты отвечают 404)
  const findHost = (slug: string) => db.select().from(hosts).where(eq(hosts.slug, slug)).get()

  // Формат ошибки контракта v1
  const v1Error = (code: string, message: string) => ({ error: { code, message } })

  // Публичное представление брони (id = cancelToken — UUID для ссылок отмены/переноса)
  const toBooking = (row: typeof bookings.$inferSelect, slug: string) => ({
    id: row.cancelToken ?? '',
    hostSlug: slug,
    eventTypeId: row.eventTypeId,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status,
    clientName: row.name,
    clientEmail: row.email,
    clientPhone: row.phone,
    clientNotes: row.comment,
    createdAt: row.createdAt,
  })

  // Настройки хоста и его правила доступности
  app.get('/api/v1/hosts/:slug/settings', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const settings: HostSettings = { ...host, availability: loadAvailabilityRules() }

    return settings
  })

  // Слоты хоста; необязательные ?date=YYYY-MM-DD, ?timezone=IANA, ?eventTypeId=
  app.get('/api/v1/hosts/:slug/slots', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const { date, timezone, eventTypeId } = request.query as {
      date?: string
      timezone?: string
      eventTypeId?: string
    }
    const timeZone = timezone ?? host.timezone

    if (!isValidTimeZone(timeZone)) {
      return reply.code(400).send({ error: 'Неверный часовой пояс' })
    }

    if (date && !dateKeyPattern.test(date)) {
      return reply.code(400).send({ error: 'Неверный формат даты, ожидается YYYY-MM-DD' })
    }

    let durationMin = 30

    if (eventTypeId) {
      const eventType = findEventType(host.id, eventTypeId)

      if (!eventType) {
        return reply.code(404).send({ error: 'Тип встречи не найден' })
      }

      durationMin = eventType.durationMin
    }

    const slots = selectFutureSlots()
      .filter((slot) => !date || dateKeyInZone(slot.startAt, timeZone) === date)
      .map((slot) => ({
        id: slot.id,
        startAt: slot.startAt,
        durationMin,
        available: !slot.isBooked,
      }))

    return { timeZone, date: date ?? null, slots }
  })

  // ── API v1: диапазоны доступности ────────────────────────────────────
  app.get('/api/v1/hosts/:slug/availability', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    return loadAvailabilitySettings(host.id, host.timezone)
  })

  app.put('/api/v1/hosts/:slug/availability', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = availabilitySettingsSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные настройки доступности'
      return reply.code(422).send({ error: message })
    }

    saveAvailabilitySettings(host.id, parsed.data)

    return loadAvailabilitySettings(host.id, host.timezone)
  })

  // ── API v1: типы встреч ──────────────────────────────────────────────
  app.get('/api/v1/hosts/:slug/event-types', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    return listEventTypes(host.id)
  })

  app.post('/api/v1/hosts/:slug/event-types', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = createEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    try {
      return reply.code(201).send(createEventType(host.id, parsed.data))
    } catch (error) {
      if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.code(409).send({ error: 'Тип с таким slug уже существует' })
      }

      throw error
    }
  })

  app.patch('/api/v1/hosts/:slug/event-types/:eventTypeId', (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = updateEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    const updated = updateEventType(host.id, eventTypeId, parsed.data)
    if (!updated) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return updated
  })

  app.delete('/api/v1/hosts/:slug/event-types/:eventTypeId', (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    if (!deleteEventType(host.id, eventTypeId)) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return reply.code(204).send()
  })

  // ── API v1: брони ────────────────────────────────────────────────────
  app.get('/api/v1/hosts/:slug/bookings', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    return db
      .select()
      .from(bookings)
      .orderBy(bookings.startAt)
      .all()
      .map((row) => toBooking(row, host.slug))
  })

  app.post('/api/v1/hosts/:slug/bookings', (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const parsed = v1CreateBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const eventType = findEventType(host.id, parsed.data.eventTypeId)
    if (!eventType) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Тип встречи не найден'))
    }

    if (Number.isNaN(Date.parse(parsed.data.startAt))) {
      return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный формат времени'))
    }

    const slot = findSlotByStartAt(parsed.data.startAt)
    if (!slot) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
    }

    if (slot.startAt < new Date(Date.now() + minNoticeMs()).toISOString()) {
      return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
    }

    if (findActiveBookingForSlot(slot.id)) {
      return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
    }

    const created = createBookingV1(parsed.data, slot, eventType.durationMin)

    return reply.code(201).send(toBooking(created, host.slug))
  })

  app.get('/api/v1/bookings/:bookingId', (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const host = db.select().from(hosts).get()

    return toBooking(booking, host?.slug ?? '')
  })

  app.post('/api/v1/bookings/:bookingId/cancel', (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const host = db.select().from(hosts).get()

    if (booking.status === 'cancelled') {
      return toBooking(booking, host?.slug ?? '')
    }

    return toBooking(cancelBookingV1(booking), host?.slug ?? '')
  })

  app.post('/api/v1/bookings/:bookingId/reschedule', (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const parsed = v1RescheduleBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидный запрос переноса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    if (Number.isNaN(Date.parse(parsed.data.startAt))) {
      return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный формат времени'))
    }

    const slot = findSlotByStartAt(parsed.data.startAt)
    if (!slot) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
    }

    if (slot.startAt < new Date(Date.now() + minNoticeMs()).toISOString()) {
      return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
    }

    if (findOtherActiveBooking(slot.id, booking.id)) {
      return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
    }

    const eventType = findEventTypeById(booking.eventTypeId)
    const durationMin = eventType?.durationMin ?? 30

    const updated = rescheduleBookingV1(booking, slot, durationMin)
    const host = db.select().from(hosts).get()

    return toBooking(updated, host?.slug ?? '')
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