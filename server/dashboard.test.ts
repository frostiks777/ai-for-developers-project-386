// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import type { AvailabilityRules } from './availability'
import { buildApp } from './app'
import { db } from './db'
import { slots } from './db/schema'
import type { Booking, BookingWithSlot, CreatedBooking, TimeSlot } from './types'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

function createFutureSlot() {
  return db
    .insert(slots)
    .values({
      startAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      durationMin: 30,
    })
    .returning()
    .get()
}

describe('GET /api/bookings + DELETE /api/bookings/:id', () => {
  it('отменяет бронь, освобождает слот и отвечает 204', async () => {
    const slot = createFutureSlot()

    const created = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: slot.id, name: 'Иван', email: 'ivan@example.com' },
    })
    expect(created.statusCode).toBe(201)
    const booking = created.json<Booking>()

    const cancelled = await app.inject({ method: 'DELETE', url: `/api/bookings/${booking.id}` })
    expect(cancelled.statusCode).toBe(204)

    const list = (await app.inject({ method: 'GET', url: '/api/bookings' })).json<BookingWithSlot[]>()
    expect(list.some((item) => item.id === booking.id)).toBe(false)

    const updatedSlot = (await app.inject({ method: 'GET', url: '/api/slots' }))
      .json<TimeSlot[]>()
      .find((item) => item.id === slot.id)
    expect(updatedSlot?.isBooked).toBe(false)
  })

  it('отвечает 404 на отмену несуществующей брони', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/api/bookings/999999' })
    expect(response.statusCode).toBe(404)
  })

  it('отвечает 400 на некорректный id', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/api/bookings/abc' })
    expect(response.statusCode).toBe(400)
  })
})

describe('POST /api/bookings/cancel', () => {
  it('создание брони возвращает токен отмены', async () => {
    const slot = createFutureSlot()

    const created = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: slot.id, name: 'Иван', email: 'ivan@example.com' },
    })

    expect(created.statusCode).toBe(201)
    const booking = created.json<CreatedBooking>()
    expect(typeof booking.cancelToken).toBe('string')
    expect(booking.cancelToken.length).toBeGreaterThan(0)

    // убираем бронь, чтобы не влиять на другие тесты в файле
    await app.inject({
      method: 'POST',
      url: '/api/bookings/cancel',
      payload: { token: booking.cancelToken },
    })
  })

  it('отменяет бронь по токену и освобождает слот', async () => {
    const slot = createFutureSlot()

    const created = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: slot.id, name: 'Иван', email: 'ivan@example.com' },
    })
    const { cancelToken } = created.json<CreatedBooking>()

    const cancelled = await app.inject({
      method: 'POST',
      url: '/api/bookings/cancel',
      payload: { token: cancelToken },
    })
    expect(cancelled.statusCode).toBe(204)

    const list = (await app.inject({ method: 'GET', url: '/api/bookings' })).json<
      BookingWithSlot[]
    >()
    expect(list.some((item) => item.slotId === slot.id)).toBe(false)

    const freedSlot = (await app.inject({ method: 'GET', url: '/api/slots' }))
      .json<TimeSlot[]>()
      .find((item) => item.id === slot.id)
    expect(freedSlot?.isBooked).toBe(false)
  })

  it('отвечает 404 на неизвестный токен', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings/cancel',
      payload: { token: 'unknown-token' },
    })

    expect(response.statusCode).toBe(404)
  })

  it('отвечает 422 без токена', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings/cancel',
      payload: {},
    })

    expect(response.statusCode).toBe(422)
  })
})

describe('GET/PUT /api/availability', () => {
  it('по умолчанию отдаёт дефолтные правила', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/availability' })

    expect(response.statusCode).toBe(200)
    const rules = response.json<AvailabilityRules>()
    expect(rules.weekdays).toEqual([1, 2, 3, 4, 5])
    expect(rules.slotDurationMin).toBe(30)
  })

  it('сохраняет обновлённые правила и пересобирает будущие слоты', async () => {
    const updated: AvailabilityRules = {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStartHour: 9,
      windowEndHour: 10,
      slotDurationMin: 60,
      bufferMin: 0,
      minNoticeMin: 0,
      horizonDays: 2,
    }

    const response = await app.inject({ method: 'PUT', url: '/api/availability', payload: updated })
    expect(response.statusCode).toBe(200)
    expect(response.json<AvailabilityRules>()).toEqual(updated)

    const persisted = (
      await app.inject({ method: 'GET', url: '/api/availability' })
    ).json<AvailabilityRules>()
    expect(persisted).toEqual(updated)

    const generated = (await app.inject({ method: 'GET', url: '/api/slots' })).json<TimeSlot[]>()
    expect(generated.length).toBeGreaterThan(0)
    expect(generated.every((slot) => slot.durationMin === 60)).toBe(true)
    expect(generated.every((slot) => new Date(slot.startAt).getUTCHours() === 9)).toBe(true)
  })

  it('отвечает 422, если не выбран ни один рабочий день', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: {
        weekdays: [],
        windowStartHour: 10,
        windowEndHour: 18,
        slotDurationMin: 30,
        bufferMin: 10,
        minNoticeMin: 120,
        horizonDays: 14,
      },
    })

    expect(response.statusCode).toBe(422)
  })

  it('отвечает 422, если конец окна раньше начала', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/availability',
      payload: {
        weekdays: [1],
        windowStartHour: 18,
        windowEndHour: 10,
        slotDurationMin: 30,
        bufferMin: 10,
        minNoticeMin: 120,
        horizonDays: 14,
      },
    })

    expect(response.statusCode).toBe(422)
  })
})
