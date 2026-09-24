import { randomUUID } from 'node:crypto'
import type BetterSqlite3 from 'better-sqlite3'
import { defaultHost } from '../hosts'
import { DEFAULT_EVENT_TYPE_ID } from './schema'

// Таблицы скелета создаются при старте, если их ещё нет.
// Настоящие миграции — через drizzle-kit (npm run db:generate / db:push).
const createTables = `
  CREATE TABLE IF NOT EXISTS hosts (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startAt TEXT NOT NULL,
    durationMin INTEGER NOT NULL DEFAULT 30
  );
  CREATE TABLE IF NOT EXISTS event_types (
    id TEXT PRIMARY KEY,
    hostId TEXT NOT NULL REFERENCES hosts(id),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    durationMin INTEGER NOT NULL DEFAULT 30,
    locationType TEXT NOT NULL DEFAULT 'online',
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS event_types_host_slug_unique ON event_types(hostId, slug);
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slotId INTEGER NOT NULL REFERENCES slots(id),
    eventTypeId TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_TYPE_ID}' REFERENCES event_types(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    startAt TEXT NOT NULL,
    endAt TEXT NOT NULL,
    cancelToken TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS availability_rules (
    id INTEGER PRIMARY KEY,
    hostId TEXT REFERENCES hosts(id),
    weekdays TEXT NOT NULL,
    windowStartHour INTEGER NOT NULL,
    windowEndHour INTEGER NOT NULL,
    slotDurationMin INTEGER NOT NULL,
    bufferMin INTEGER NOT NULL,
    minNoticeMin INTEGER NOT NULL,
    horizonDays INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS availability_ranges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostId TEXT NOT NULL REFERENCES hosts(id),
    weekday INTEGER NOT NULL,
    startMinute INTEGER NOT NULL,
    endMinute INTEGER NOT NULL
  );
`

type BookingColumn = { name: string; notnull: number }

type LegacyBookingRow = {  id: number
  slotId: number
  name: string
  phone: string | null
  email: string
  comment: string | null
  cancelToken: string | null
  createdAt: string
  slotStartAt: string | null
  slotDurationMin: number | null
}

/** Гарантирует наличие дефолтного хоста и возвращает его id. */
function ensureDefaultHost(client: BetterSqlite3.Database): string {
  const existing = client.prepare('SELECT id FROM hosts LIMIT 1').get() as
    | { id: string }
    | undefined
  if (existing) return existing.id

  const id = randomUUID()
  client
    .prepare('INSERT INTO hosts (id, slug, name, timezone) VALUES (?, ?, ?, ?)')
    .run(id, defaultHost.slug, defaultHost.name, defaultHost.timezone)
  return id
}

/** Гарантирует наличие дефолтного типа встречи для бэкфилла броней. */
function ensureDefaultEventType(client: BetterSqlite3.Database, hostId: string): void {
  client
    .prepare(
      `INSERT OR IGNORE INTO event_types (id, hostId, slug, title, description, durationMin, locationType, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(DEFAULT_EVENT_TYPE_ID, hostId, 'consultation', 'Звонок-консультация', null, 30, 'online', 1)
}

/** Пересобирает брони под схему v1 (статус, тип встречи, снимок времени). */
function rebuildBookingsToV1(client: BetterSqlite3.Database): void {
  const rows = client
    .prepare(
      `SELECT b.id, b.slotId, b.name, b.phone, b.email, b.comment, b.cancelToken, b.createdAt,
              s.startAt AS slotStartAt, s.durationMin AS slotDurationMin
       FROM bookings b
       LEFT JOIN slots s ON s.id = b.slotId`,
    )
    .all() as LegacyBookingRow[]

  client.exec(`
    ALTER TABLE bookings RENAME TO bookings_old;
    DROP INDEX IF EXISTS bookings_slotId_unique;
    DROP INDEX IF EXISTS bookings_cancelToken_unique;
    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slotId INTEGER NOT NULL REFERENCES slots(id),
      eventTypeId TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_TYPE_ID}' REFERENCES event_types(id),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      startAt TEXT NOT NULL,
      endAt TEXT NOT NULL,
      cancelToken TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const insert = client.prepare(
    `INSERT INTO bookings
       (id, slotId, eventTypeId, name, phone, email, comment, status, startAt, endAt, cancelToken, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
  )

  const migrate = client.transaction((records: LegacyBookingRow[]) => {
    for (const row of records) {
      const startAt = row.slotStartAt ?? row.createdAt
      const durationMin = row.slotDurationMin ?? 30
      const endAt = new Date(new Date(startAt).getTime() + durationMin * 60_000).toISOString()
      insert.run(
        row.id,
        row.slotId,
        DEFAULT_EVENT_TYPE_ID,
        row.name,
        row.phone,
        row.email,
        row.comment,
        startAt,
        endAt,
        row.cancelToken,
        row.createdAt,
      )
    }
  })
  migrate(rows)

  client.exec(`DROP TABLE bookings_old`)
}

/**
 * Идемпотентные миграции схемы: создаёт недостающие таблицы, досыпает колонки
 * и приводит старые БД к актуальной схеме. Безопасно вызывать при каждом старте.
 */
export function runMigrations(client: BetterSqlite3.Database): void {
  client.exec(createTables)

  const hostId = ensureDefaultHost(client)
  ensureDefaultEventType(client, hostId)

  // availability_rules получила hostId позже — досыпаем колонку и привязываем к хосту
  const rulesColumns = () => client.pragma('table_info(availability_rules)') as BookingColumn[]
  if (!rulesColumns().some((column) => column.name === 'hostId')) {
    client.exec(`ALTER TABLE availability_rules ADD COLUMN hostId TEXT REFERENCES hosts(id)`)
    client
      .prepare('UPDATE availability_rules SET hostId = ? WHERE hostId IS NULL')
      .run(hostId)
  }

  const bookingColumns = () => client.pragma('table_info(bookings)') as BookingColumn[]

  // email появился позже — добавляем колонку, если её нет
  if (!bookingColumns().some((column) => column.name === 'email')) {
    client.exec(`ALTER TABLE bookings ADD COLUMN email TEXT NOT NULL DEFAULT ''`)
  }

  // comment появился позже — колонка nullable
  if (!bookingColumns().some((column) => column.name === 'comment')) {
    client.exec(`ALTER TABLE bookings ADD COLUMN comment TEXT`)
  }

  // cancelToken появился позже — колонка nullable (у старых броней токена нет)
  if (!bookingColumns().some((column) => column.name === 'cancelToken')) {
    client.exec(`ALTER TABLE bookings ADD COLUMN cancelToken TEXT`)
  }

  // Колонки v1 (status/eventTypeId/startAt/endAt) добавляются пересборкой таблицы
  if (!bookingColumns().some((column) => column.name === 'status')) {
    rebuildBookingsToV1(client)
  }

  // Уникальность слота — только для активных броней (ADR-0011)
  client.exec(`
    DROP INDEX IF EXISTS bookings_slotId_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS bookings_slotId_active_unique
      ON bookings(slotId) WHERE status != 'cancelled';
    CREATE UNIQUE INDEX IF NOT EXISTS bookings_cancelToken_unique ON bookings(cancelToken);
  `)
}
