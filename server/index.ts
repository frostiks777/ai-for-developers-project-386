import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import { eq } from 'drizzle-orm'
import Fastify from 'fastify'
import { db } from './db'
import { bookings, slots } from './db/schema'
import type { CreateBookingBody, TimeSlot } from './types'

const app = Fastify({ logger: true })

app.get('/health', () => ({ status: 'ok' }))

// Все слоты с признаком занятости, отсортированные по startAt
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
    .orderBy(slots.startAt)
    .all()

  return rows.map((row) => ({
    id: row.id,
    startAt: row.startAt,
    durationMin: row.durationMin,
    isBooked: row.bookingId !== null,
  }))
})

app.post('/api/bookings', (request, reply) => {
  const body = request.body as Partial<CreateBookingBody> | null | undefined

  // Ручная валидация: slotId — положительное целое, name/phone — непустые строки
  if (
    body == null ||
    typeof body.slotId !== 'number' ||
    !Number.isInteger(body.slotId) ||
    body.slotId <= 0 ||
    typeof body.name !== 'string' ||
    body.name.trim() === '' ||
    typeof body.phone !== 'string' ||
    body.phone.trim() === ''
  ) {
    return reply.code(400).send({ error: 'Невалидное тело запроса' })
  }

  const { slotId, name, phone } = body

  const slot = db.select().from(slots).where(eq(slots.id, slotId)).get()
  if (!slot) {
    return reply.code(404).send({ error: 'Слот не найден' })
  }

  const existingBooking = db.select().from(bookings).where(eq(bookings.slotId, slotId)).get()
  if (existingBooking) {
    return reply.code(409).send({ error: 'Слот уже занят' })
  }

  const created = db
    .insert(bookings)
    .values({ slotId, name: name.trim(), phone: phone.trim() })
    .returning()
    .get()

  return reply.code(201).send(created)
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

// Корректное завершение по сигналам ОС
const shutdown = async (signal: string) => {
  app.log.info(`Получен ${signal}, завершаю работу`)
  await app.close()
  process.exit(0)
}
process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

try {
  const port = Number(process.env.PORT) || 3000
  await app.listen({ port, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}

// Запуск: npm run server:dev (разработка) / npm run start (продакшен)
