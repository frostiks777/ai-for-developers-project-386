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
  findBookingByIdempotencyKey,
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
import {
  createTimeBlock,
  deleteTimeBlock,
  isBlocked,
  listBlockIntervals,
  listTimeBlocks,
} from './time-blocks'
import type { BookingWithSlot, TimeSlot } from './types'
import {
  availabilityRulesSchema,
  availabilitySettingsSchema,
  cancelBookingSchema,
  createBookingSchema,
  createEventTypeSchema,
  createTimeBlockSchema,
  rescheduleBookingSchema,
  updateEventTypeSchema,
  v1CancelBookingSchema,
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

// Код нарушения уникального индекса в PostgreSQL
const PG_UNIQUE_VIOLATION = '23505'

// Drizzle оборачивает ошибки драйвера в DrizzleQueryError с полем cause,
// поэтому код ошибки Postgres ищем по цепочке cause.
function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error

  for (let depth = 0; depth < 5 && current; depth += 1) {
    const code = (current as { code?: string }).code
    if (code) return code
    current = (current as { cause?: unknown }).cause
  }

  return undefined
}

const isUniqueViolation = (error: unknown) => pgErrorCode(error) === PG_UNIQUE_VIOLATION

// Фабрика приложения: тесты создают изолированный инстанс без listen()
export async function buildApp(): Promise<FastifyInstance> {
  // В тестах логи Fastify не нужны (vitest выставляет NODE_ENV=test)
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })

  const minNoticeMs = async () => (await loadAvailabilityRules()).minNoticeMin * 60 * 1000

  // Читает хост по slug; undefined, если не найден (роуты отвечают 404)
  const findHost = async (slug: string) =>
    (await db.select().from(hosts).where(eq(hosts.slug, slug)).limit(1))[0]

  // MVP: единственный хост (дефолтный организатор)
  const defaultHost = async () => (await db.select().from(hosts).limit(1))[0]

  app.get('/health', () => ({ status: 'ok' }))

  // Слоты в будущем с признаком занятости, отсортированные по startAt.
  // Слоты, пересекающиеся с ручными блокировками, не выдаются.
  const selectFutureSlots = async (): Promise<TimeSlot[]> => {
    const host = await defaultHost()
    const blocks = host ? await listBlockIntervals(host.id) : []

    const rows = await db
      .select({
        id: slots.id,
        startAt: slots.startAt,
        durationMin: slots.durationMin,
        bookingId: bookings.id,
      })
      .from(slots)
      .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, 'confirmed')))
      .where(gte(slots.startAt, new Date(Date.now() + (await minNoticeMs())).toISOString()))
      .orderBy(slots.startAt)

    return rows
      .map((row) => ({
        id: row.id,
        startAt: row.startAt,
        durationMin: row.durationMin,
        isBooked: row.bookingId !== null,
      }))
      .filter(
        (slot) =>
          !isBlocked(
            {
              startAt: slot.startAt,
              endAt: new Date(
                new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
              ).toISOString(),
            },
            blocks,
          ),
      )
  }

  app.get('/api/slots', async (): Promise<TimeSlot[]> => selectFutureSlots())

  // Список броней с данными слота (для панели организатора), по времени начала
  app.get('/api/bookings', async (): Promise<BookingWithSlot[]> => {
    return db
      .select(bookingWithSlotColumns)
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .orderBy(slots.startAt)
  })

  app.post('/api/bookings', async (request, reply) => {
    const parsed = createBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    const { slotId, name, phone, email, comment } = parsed.data

    const slotRows = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1)
    const slot = slotRows[0]
    if (!slot) {
      return reply.code(404).send({ error: 'Слот не найден' })
    }

    if (slot.startAt < new Date().toISOString()) {
      return reply.code(400).send({ error: 'Слот уже прошёл' })
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs())).toISOString()) {
      return reply.code(400).send({ error: 'Слот уже недоступен' })
    }

    try {
      const created = (
        await db
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
      )[0]

      return reply.code(201).send(created)
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: 'Слот уже занят' })
      }

      throw error
    }
  })

  // Отмена брони организатором — слот снова становится свободным
  app.delete('/api/bookings/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id)

    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send({ error: 'Некорректный id брони' })
    }

    const deleted = await db.delete(bookings).where(eq(bookings.id, id)).returning()

    if (deleted.length === 0) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Публичная отмена брони по токену из ссылки на экране успеха
  app.post('/api/bookings/cancel', async (request, reply) => {
    const parsed = cancelBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Укажите токен отмены'
      return reply.code(422).send({ error: message })
    }

    const deleted = await db
      .delete(bookings)
      .where(eq(bookings.cancelToken, parsed.data.token))
      .returning()

    if (deleted.length === 0) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Бронь по токену (для страницы переноса): отдаёт текущее время слота
  app.get('/api/bookings/by-token/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    const booking = (
      await db
        .select(bookingWithSlotColumns)
        .from(bookings)
        .innerJoin(slots, eq(bookings.slotId, slots.id))
        .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(eq(bookings.cancelToken, token))
        .limit(1)
    )[0]

    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return booking
  })

  // Перенос брони на другой слот по токену; старый слот освобождается
  app.post('/api/bookings/reschedule', async (request, reply) => {
    const parsed = rescheduleBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидный запрос переноса'
      return reply.code(400).send({ error: message })
    }

    const { token, slotId } = parsed.data

    const booking = (
      await db.select().from(bookings).where(eq(bookings.cancelToken, token)).limit(1)
    )[0]
    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    const slot = (await db.select().from(slots).where(eq(slots.id, slotId)).limit(1))[0]
    if (!slot) {
      return reply.code(404).send({ error: 'Слот не найден' })
    }

    if (slot.startAt < new Date().toISOString()) {
      return reply.code(400).send({ error: 'Слот уже прошёл' })
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs())).toISOString()) {
      return reply.code(400).send({ error: 'Слот уже недоступен' })
    }

    if (booking.slotId !== slotId) {
      try {
        await db
          .update(bookings)
          .set({
            slotId,
            startAt: slot.startAt,
            endAt: new Date(
              new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
            ).toISOString(),
          })
          .where(eq(bookings.id, booking.id))
      } catch (error) {
        if (isUniqueViolation(error)) {
          return reply.code(409).send({ error: 'Слот уже занят' })
        }

        throw error
      }
    }

    return (
      await db
        .select(bookingWithSlotColumns)
        .from(bookings)
        .innerJoin(slots, eq(bookings.slotId, slots.id))
        .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(eq(bookings.id, booking.id))
        .limit(1)
    )[0]
  })

  // Текущие правила доступности организатора
  app.get('/api/availability', async () => loadAvailabilityRules())

  // Обновление правил: сохраняем и пересобираем будущие свободные слоты
  app.put('/api/availability', async (request, reply) => {
    const parsed = availabilityRulesSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные правила доступности'
      return reply.code(422).send({ error: message })
    }

    await saveAvailabilityRules(parsed.data)
    await regenerateFutureSlots(parsed.data)

    return loadAvailabilityRules()
  })

  // ── API v1: мульти-хост ──────────────────────────────────────────────
  // Формат ошибки контракта v1
  const v1Error = (code: string, message: string) => ({ error: { code, message } })

  // Публичное представление брони (id = cancelToken — UUID для ссылок отмены/переноса)
  const toBooking = (row: typeof bookings.$inferSelect, slug: string, timeZone: string) => ({
    id: row.cancelToken ?? '',
    hostSlug: slug,
    eventTypeId: row.eventTypeId,
    startAt: row.startAt,
    endAt: row.endAt,
    timeZone,
    status: row.status,
    clientName: row.name,
    clientEmail: row.email,
    clientPhone: row.phone,
    clientNotes: row.comment,
    clientGuests: row.guests ? (JSON.parse(row.guests) as string[]) : null,
    consentAccepted: row.consentAccepted,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
  })

  // Публичные настройки хоста по контракту HostSettings
  app.get('/api/v1/hosts/:slug/settings', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    return { slug: host.slug, name: host.name, timeZone: host.timezone }
  })

  // Слоты хоста; необязательные ?date=YYYY-MM-DD, ?timezone=IANA, ?eventTypeId=
  app.get('/api/v1/hosts/:slug/slots', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

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
      const eventType = await findEventType(host.id, eventTypeId)

      if (!eventType) {
        return reply.code(404).send({ error: 'Тип встречи не найден' })
      }

      durationMin = eventType.durationMin
    }

    const slots = (await selectFutureSlots())
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
  app.get('/api/v1/hosts/:slug/availability', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    return loadAvailabilitySettings(host.id, host.timezone)
  })

  app.put('/api/v1/hosts/:slug/availability', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = availabilitySettingsSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные настройки доступности'
      return reply.code(422).send({ error: message })
    }

    await saveAvailabilitySettings(host.id, parsed.data)

    return loadAvailabilitySettings(host.id, host.timezone)
  })

  // ── API v1: типы встреч ──────────────────────────────────────────────
  app.get('/api/v1/hosts/:slug/event-types', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    return listEventTypes(host.id)
  })

  app.post('/api/v1/hosts/:slug/event-types', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = createEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    try {
      return reply.code(201).send(await createEventType(host.id, parsed.data))
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: 'Тип с таким slug уже существует' })
      }

      throw error
    }
  })

  app.patch('/api/v1/hosts/:slug/event-types/:eventTypeId', async (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = updateEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    const updated = await updateEventType(host.id, eventTypeId, parsed.data)
    if (!updated) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return updated
  })

  app.delete('/api/v1/hosts/:slug/event-types/:eventTypeId', async (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    if (!(await deleteEventType(host.id, eventTypeId))) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return reply.code(204).send()
  })

  // ── API v1: брони ────────────────────────────────────────────────────
  app.get('/api/v1/hosts/:slug/bookings', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const rows = await db.select().from(bookings).orderBy(bookings.startAt)

    return rows.map((row) => toBooking(row, host.slug, host.timezone))
  })

  app.post('/api/v1/hosts/:slug/bookings', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const idempotencyKey =
      typeof request.headers['idempotency-key'] === 'string'
        ? request.headers['idempotency-key']
        : undefined

    if (idempotencyKey) {
      const existing = await findBookingByIdempotencyKey(idempotencyKey)

      if (existing) {
        return reply.code(201).send(toBooking(existing, host.slug, host.timezone))
      }
    }

    const parsed = v1CreateBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const eventType = await findEventType(host.id, parsed.data.eventTypeId)
    if (!eventType) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Тип встречи не найден'))
    }

    if (Number.isNaN(Date.parse(parsed.data.startAt))) {
      return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный формат времени'))
    }

    const slot = await findSlotByStartAt(parsed.data.startAt)
    if (!slot) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs())).toISOString()) {
      return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
    }

    if (await findActiveBookingForSlot(slot.id)) {
      return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
    }

    const slotInterval = {
      startAt: slot.startAt,
      endAt: new Date(
        new Date(slot.startAt).getTime() + eventType.durationMin * 60_000,
      ).toISOString(),
    }

    if (isBlocked(slotInterval, await listBlockIntervals(host.id))) {
      return reply.code(409).send(v1Error('CONFLICT', 'Время заблокировано организатором'))
    }

    const created = await createBookingV1(
      { ...parsed.data, idempotencyKey },
      slot,
      eventType.durationMin,
    )

    return reply.code(201).send(toBooking(created, host.slug, host.timezone))
  })

  // ── API v1: блокировки времени ───────────────────────────────────────
  app.get('/api/v1/hosts/:slug/blocks', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    return listTimeBlocks(host.id)
  })

  app.post('/api/v1/hosts/:slug/blocks', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const parsed = createTimeBlockSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const created = await createTimeBlock(host.id, {
      startAt: new Date(parsed.data.startAt).toISOString(),
      endAt: new Date(parsed.data.endAt).toISOString(),
      reason: parsed.data.reason,
    })

    return reply.code(201).send(created)
  })

  app.delete('/api/v1/hosts/:slug/blocks/:blockId', async (request, reply) => {
    const { slug, blockId } = request.params as { slug: string; blockId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const id = Number(blockId)
    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send(v1Error('VALIDATION_ERROR', 'Некорректный id блокировки'))
    }

    if (!(await deleteTimeBlock(host.id, id))) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Блокировка не найдена'))
    }

    return reply.code(204).send()
  })

  app.get('/api/v1/bookings/:bookingId', async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const host = await defaultHost()

    return toBooking(booking, host?.slug ?? '', host?.timezone ?? 'UTC')
  })

  app.post('/api/v1/bookings/:bookingId/cancel', async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const parsed = v1CancelBookingSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const host = await defaultHost()

    if (booking.status === 'cancelled') {
      return toBooking(booking, host?.slug ?? '', host?.timezone ?? 'UTC')
    }

    return toBooking(
      await cancelBookingV1(booking, parsed.data.reason),
      host?.slug ?? '',
      host?.timezone ?? 'UTC',
    )
  })

  app.post('/api/v1/bookings/:bookingId/reschedule', async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

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

    const slot = await findSlotByStartAt(parsed.data.startAt)
    if (!slot) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs())).toISOString()) {
      return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
    }

    if (await findOtherActiveBooking(slot.id, booking.id)) {
      return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
    }

    const eventType = await findEventTypeById(booking.eventTypeId)
    const durationMin = eventType?.durationMin ?? 30
    const host = await defaultHost()

    const slotInterval = {
      startAt: slot.startAt,
      endAt: new Date(new Date(slot.startAt).getTime() + durationMin * 60_000).toISOString(),
    }

    if (host && isBlocked(slotInterval, await listBlockIntervals(host.id))) {
      return reply.code(409).send(v1Error('CONFLICT', 'Время заблокировано организатором'))
    }

    const updated = await rescheduleBookingV1(booking, slot, durationMin)

    return toBooking(updated, host?.slug ?? '', host?.timezone ?? 'UTC')
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

