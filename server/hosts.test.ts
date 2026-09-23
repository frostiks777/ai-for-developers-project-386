// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { dateKeyInZone } from './hosts'
import type { HostSettings, TimeSlot } from './types'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('GET /api/v1/hosts/:slug/settings', () => {
  it('отдаёт дефолтного хоста с правилами доступности', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/settings' })

    expect(response.statusCode).toBe(200)
    const settings = response.json<HostSettings>()
    expect(settings.slug).toBe('default')
    expect(settings.name).toBe('Организатор')
    expect(settings.timezone).toBe('UTC')
    expect(typeof settings.availability.minNoticeMin).toBe('number')
    expect(Array.isArray(settings.availability.weekdays)).toBe(true)
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/unknown/settings' })

    expect(response.statusCode).toBe(404)
  })
})

describe('GET /api/v1/hosts/:slug/slots', () => {
  it('отдаёт список будущих слотов хоста', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })

    expect(response.statusCode).toBe(200)
    const slots = response.json<TimeSlot[]>()
    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        startAt: expect.any(String),
        durationMin: expect.any(Number),
        isBooked: expect.any(Boolean),
      }),
    )
  })

  it('фильтрует слоты по дате в заданном поясе', async () => {
    const all = (await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' }))
      .json<TimeSlot[]>()
    const date = dateKeyInZone(all[0].startAt, 'UTC')

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/hosts/default/slots?date=${date}&timezone=UTC`,
    })

    expect(response.statusCode).toBe(200)
    const filtered = response.json<TimeSlot[]>()
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((slot) => dateKeyInZone(slot.startAt, 'UTC') === date)).toBe(true)
  })

  it('отвечает 400 на некорректную дату', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots?date=24-09-2026',
    })

    expect(response.statusCode).toBe(400)
  })

  it('отвечает 400 на неизвестный часовой пояс', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots?timezone=Unknown/Zone',
    })

    expect(response.statusCode).toBe(400)
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/unknown/slots' })

    expect(response.statusCode).toBe(404)
  })
})
