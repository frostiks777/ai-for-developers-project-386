import { mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { gte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { defaultAvailabilityRules, generateSlotStarts, rulesFromRow } from '../availability'
import { defaultHost } from '../hosts'
import { runMigrations } from './migrate'
import * as schema from './schema'

// ESM: __dirname недоступен, вычисляем пути от import.meta.url
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(currentDir, '..', 'data')
// DATABASE_PATH=:memory: — изоляция БД в интеграционных тестах
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, 'app.db')

if (dbPath !== ':memory:') {
  mkdirSync(dataDir, { recursive: true })
}

const client = new Database(dbPath)

// Схема приводится к актуальной идемпотентными миграциями при каждом старте.
runMigrations(client)

export const db = drizzle(client, { schema })

// Сидирование дефолтного хоста для /api/v1 (мульти-хост в MVP не используется)
if (!db.select().from(schema.hosts).get()) {
  db.insert(schema.hosts)
    .values({ id: randomUUID(), ...defaultHost })
    .run()
}

// Сидирование: если будущих слотов нет — генерируем по правилам доступности
// (рабочие дни и окно, шаг «длительность + буфер», minNotice, горизонт).
// Правила берём из таблицы, если организатор их сохранял, иначе — дефолтные.
const storedRules = db.select().from(schema.availabilityRules).get()
const rules = storedRules ? rulesFromRow(storedRules) : defaultAvailabilityRules

const hasFutureSlots = db
  .select()
  .from(schema.slots)
  .where(gte(schema.slots.startAt, new Date().toISOString()))
  .get()

if (!hasFutureSlots) {
  const slotStarts = generateSlotStarts(new Date(), rules)

  db.insert(schema.slots)
    .values(
      slotStarts.map((startAt) => ({
        startAt,
        durationMin: rules.slotDurationMin,
      })),
    )
    .run()
}
