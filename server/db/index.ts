import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { gte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { defaultAvailabilityRules, generateSlotStarts } from '../availability'
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
    phone TEXT,
    email TEXT NOT NULL,
    comment TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS bookings_slotId_unique ON bookings(slotId);
`)

// Обратная совместимость: приводим старые БД к актуальной схеме
type BookingColumn = { name: string; notnull: number }
const bookingColumns = () => client.pragma('table_info(bookings)') as BookingColumn[]

// email появился позже — добавляем колонку, если её нет
if (!bookingColumns().some((column) => column.name === 'email')) {
  client.exec(`ALTER TABLE bookings ADD COLUMN email TEXT NOT NULL DEFAULT ''`)
}

// comment появился позже — колонка nullable
if (!bookingColumns().some((column) => column.name === 'comment')) {
  client.exec(`ALTER TABLE bookings ADD COLUMN comment TEXT`)
}

// phone стал необязательным: SQLite не умеет снимать NOT NULL, пересобираем таблицу
if (bookingColumns().find((column) => column.name === 'phone')?.notnull === 1) {
  client.exec(`
    ALTER TABLE bookings RENAME TO bookings_old;
    DROP INDEX IF EXISTS bookings_slotId_unique;
    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slotId INTEGER NOT NULL REFERENCES slots(id),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      comment TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO bookings (id, slotId, name, phone, email, comment, createdAt)
      SELECT id, slotId, name, phone, email, comment, createdAt FROM bookings_old;
    DROP TABLE bookings_old;
    CREATE UNIQUE INDEX IF NOT EXISTS bookings_slotId_unique ON bookings(slotId);
  `)
}

export const db = drizzle(client, { schema })

// Сидирование: если будущих слотов нет — генерируем по правилам доступности
// (рабочие дни и окно, шаг «длительность + буфер», minNotice, горизонт)
const hasFutureSlots = db
  .select()
  .from(schema.slots)
  .where(gte(schema.slots.startAt, new Date().toISOString()))
  .get()

if (!hasFutureSlots) {
  const slotStarts = generateSlotStarts(new Date())

  db.insert(schema.slots)
    .values(
      slotStarts.map((startAt) => ({
        startAt,
        durationMin: defaultAvailabilityRules.slotDurationMin,
      })),
    )
    .run()
}
