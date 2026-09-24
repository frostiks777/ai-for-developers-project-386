import { z } from 'zod'

// Подгружаем .env в локальной разработке, если файл есть.
// В проде переменные приходят от платформы; уже заданные значения не перезаписываются.
try {
  process.loadEnvFile('.env')
} catch {
  // .env отсутствует — это нормально (прод/CI)
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Строка подключения Postgres (Neon). Пусто/не задано → PGlite (тесты, локальный dev).
  DATABASE_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => value === undefined || /^postgres(ql)?:\/\//.test(value),
      'DATABASE_URL должен быть строкой подключения Postgres',
    ),
})

export const env = envSchema.parse(process.env)
