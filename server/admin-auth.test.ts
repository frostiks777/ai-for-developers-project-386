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
