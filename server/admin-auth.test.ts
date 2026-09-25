// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { env } from './env'

let app: FastifyInstance

const basic = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`

beforeAll(async () => {
  env.ADMIN_PASSWORD = 'secret'
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
  env.ADMIN_PASSWORD = undefined
})

describe('Basic-auth панели организатора', () => {
  it('отдаёт 401 без заголовка и просит авторизацию', async () => {
    const response = await app.inject({ method: 'GET', url: '/dashboard' })

    expect(response.statusCode).toBe(401)
    expect(response.headers['www-authenticate']).toContain('Basic realm="admin"')
  })

  it('отдаёт 401 при неверном пароле', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/admin/availability',
      headers: { authorization: basic('admin', 'wrong') },
    })

    expect(response.statusCode).toBe(401)
  })

  it('пускает в /dashboard и /admin/* с верным паролем', async () => {
    for (const url of ['/dashboard', '/admin/availability', '/admin/event-types']) {
      const response = await app.inject({
        method: 'GET',
        url,
        headers: { authorization: basic('admin', 'secret') },
      })

      expect(response.statusCode).not.toBe(401)
    }
  })

  it('не трогает публичные маршруты и API', async () => {
    expect((await app.inject({ method: 'GET', url: '/' })).statusCode).not.toBe(401)
    expect((await app.inject({ method: 'GET', url: '/api/slots' })).statusCode).toBe(200)
  })

  it('не требует авторизацию, когда ADMIN_PASSWORD не задан', async () => {
    const saved = env.ADMIN_PASSWORD
    env.ADMIN_PASSWORD = undefined

    try {
      const response = await app.inject({ method: 'GET', url: '/dashboard' })
      expect(response.statusCode).not.toBe(401)
    } finally {
      env.ADMIN_PASSWORD = saved
    }
  })
})

describe('Basic-auth административных API', () => {
  it('закрывает изменение настроек, типов и блокировок без пароля', async () => {
    const requests = [
      { method: 'PUT' as const, url: '/api/v1/hosts/default/availability', payload: {} },
      { method: 'POST' as const, url: '/api/v1/hosts/default/event-types', payload: {} },
      { method: 'PATCH' as const, url: '/api/v1/hosts/default/event-types/x', payload: {} },
      { method: 'DELETE' as const, url: '/api/v1/hosts/default/event-types/x' },
      { method: 'POST' as const, url: '/api/v1/hosts/default/blocks', payload: {} },
      { method: 'DELETE' as const, url: '/api/v1/hosts/default/blocks/1' },
      { method: 'GET' as const, url: '/api/v1/hosts/default/blocks' },
      { method: 'PUT' as const, url: '/api/availability', payload: {} },
      { method: 'GET' as const, url: '/api/bookings' },
      { method: 'POST' as const, url: '/api/v1/hosts', payload: {} },
    ]

    for (const request of requests) {
      const response = await app.inject(request)
      expect(response.statusCode, `${request.method} ${request.url}`).toBe(401)
    }
  })

  it('пропускает административные запросы с верным паролем', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/hosts/default/availability',
      payload: {},
      headers: { authorization: basic('admin', 'secret') },
    })

    // Валидация тела — 422, но гейт пропустил запрос (не 401)
    expect(response.statusCode).toBe(422)
  })

  it('не закрывает публичные чтения гостя', async () => {
    const publicRequests = [
      { method: 'GET' as const, url: '/api/v1/hosts' },
      { method: 'GET' as const, url: '/api/v1/hosts/default/availability' },
      { method: 'GET' as const, url: '/api/v1/hosts/default/event-types' },
      { method: 'GET' as const, url: '/api/v1/hosts/default/bookings' },
    ]

    for (const request of publicRequests) {
      const response = await app.inject(request)
      expect(response.statusCode, `${request.method} ${request.url}`).not.toBe(401)
    }
  })
})
