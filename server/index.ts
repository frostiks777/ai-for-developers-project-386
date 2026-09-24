import { buildApp } from './app'
import { env } from './env'

const app = await buildApp()

// Корректное завершение по сигналам ОС
const shutdown = async (signal: string) => {
  app.log.info(`Получен ${signal}, завершаю работу`)
  await app.close()
  process.exit(0)
}
process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

try {
  const port = env.PORT
  await app.listen({ port, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}

// Запуск: npm run server:dev (разработка) / npm run start (продакшен)