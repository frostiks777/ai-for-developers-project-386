// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

type Slot = { id: number; startAt: string; durationMin: number; available: boolean }
type Booking = { id: string; status: string; startAt: string; eventTypeId: string }

async function freeSlot(): Promise<Slot> {
  const day = (
    await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
  ).json<{ slots: Slot[] }>()

  const slot = day.slots.find((item) => item.available)
  if (!slot) {
    throw new Error('нет свободных слотов')
  }
  return slot
}

const payload = (slot: Slot, email: string) => ({
  eventTypeId: 'default-consultation',
  startAt: slot.startAt,
  clientName: 'Иван',
  clientEmail: email,
})

describe('POST /api/v1/hosts/:slug/bookings', () => {
  it('создаёт бронь и возвращает 201', async () => {
    const slot = await freeSlot()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'guest1@example.com'),
    })

    expect(response.statusCode).toBe(201)
    const booking = response.json<Booking>()
    expect(booking.status).toBe('confirmed')
    expect(booking.eventTypeId).toBe('default-consultation')
    expect(booking.id).toBeTruthy()
  })

  it('отвечает 409 SLOT_TAKEN на занятый слот (в т.ч. другого типа)', async () => {
    const slot = await freeSlot()

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'guest2@example.com'),
    })
    expect(first.statusCode).toBe(201)

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'guest3@example.com'),
    })
    expect(second.statusCode).toBe(409)
    expect(second.json<{ error: { code: string } }>().error.code).toBe('SLOT_TAKEN')
  })

  it('отвечает 404 на неизвестный тип встречи', async () => {
    const slot = await freeSlot()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: { ...payload(slot, 'guest4@example.com'), eventTypeId: 'missing' },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('Жизненный цикл брони', () => {
  it('отмена освобождает слот, повторная запись проходит', async () => {
    const slot = await freeSlot()
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/bookings',
        payload: payload(slot, 'guest5@example.com'),
      })
    ).json<Booking>()

    const cancel = await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${created.id}/cancel`,
    })
    expect(cancel.statusCode).toBe(200)
    expect(cancel.json<Booking>().status).toBe('cancelled')

    const again = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'guest6@example.com'),
    })
    expect(again.statusCode).toBe(201)
  })

  it('перенос меняет время брони', async () => {
    const first = await freeSlot()
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/bookings',
        payload: payload(first, 'guest7@example.com'),
      })
    ).json<Booking>()

    const day = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
    ).json<{ slots: Slot[] }>()
    const target = day.slots.find((item) => item.available && item.startAt !== first.startAt)
    if (!target) {
      throw new Error('нет второго свободного слота')
    }

    const rescheduled = await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${created.id}/reschedule`,
      payload: { startAt: target.startAt },
    })

    expect(rescheduled.statusCode).toBe(200)
    expect(rescheduled.json<Booking>().startAt).toBe(target.startAt)
  })

  it('отдаёт бронь по публичному id', async () => {
    const slot = await freeSlot()
    const created = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/hosts/default/bookings',
        payload: payload(slot, 'guest8@example.com'),
      })
    ).json<Booking>()

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/bookings/${created.id}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json<Booking>().id).toBe(created.id)
  })
})
