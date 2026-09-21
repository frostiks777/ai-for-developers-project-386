import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// ESM: __dirname недоступен, вычисляем пути от import.meta.url
const currentDir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(currentDir, '..', 'data')
const dbPath = path.join(dataDir, 'app.db')

mkdirSync(dataDir, { recursive: true })

const client = new Database(dbPath)

// Скелет работает без миграций: создаём таблицы при старте, если их ещё нет.
// Настоящие миграции — через drizzle-kit (npm run db:generate / db:push)
client.exec(`
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startAt TEXT NOT NULL,
    durationMin INTEGER NOT NULL DEFAULT 30
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slotId INTEGER NOT NULL REFERENCES slots(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export const db = drizzle(client, { schema })

// Сидирование: если слотов нет — создаём 8 штук:
// ближайшие 4 дня, 10:00 и 15:00, длительность 30 минут
const existingSlots = db.select().from(schema.slots).all()

if (existingSlots.length === 0) {
  const now = new Date()
  const seedSlots = [0, 1, 2, 3].flatMap((dayOffset) =>
    [10, 15].map((hour) => {
      const startAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + dayOffset,
        hour,
        0,
        0,
        0,
      )
      return { startAt: startAt.toISOString(), durationMin: 30 }
    }),
  )

  db.insert(schema.slots).values(seedSlots).run()
}
