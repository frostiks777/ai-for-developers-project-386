import type BetterSqlite3 from 'better-sqlite3'

// Таблицы скелета создаются при старте, если их ещё нет.
// Настоящие миграции — через drizzle-kit (npm run db:generate / db:push).
const createTables = `
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
    cancelToken TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS bookings_slotId_unique ON bookings(slotId);
  CREATE TABLE IF NOT EXISTS availability_rules (
    id INTEGER PRIMARY KEY,
    weekdays TEXT NOT NULL,
    windowStartHour INTEGER NOT NULL,
    windowEndHour INTEGER NOT NULL,
    slotDurationMin INTEGER NOT NULL,
    bufferMin INTEGER NOT NULL,
    minNoticeMin INTEGER NOT NULL,
    horizonDays INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hosts (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`

type BookingColumn = { name: string; notnull: number }

/**
 * Идемпотентные миграции схемы: создаёт недостающие таблицы, досыпает колонки
 * и приводит старые БД к актуальной схеме. Безопасно вызывать при каждом старте.
 */
export function runMigrations(client: BetterSqlite3.Database): void {
  client.exec(createTables)

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

  client.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS bookings_cancelToken_unique ON bookings(cancelToken)`,
  )

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
        cancelToken TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO bookings (id, slotId, name, phone, email, comment, cancelToken, createdAt)
        SELECT id, slotId, name, phone, email, comment, cancelToken, createdAt FROM bookings_old;
      DROP TABLE bookings_old;
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_slotId_unique ON bookings(slotId);
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_cancelToken_unique ON bookings(cancelToken);
    `)
  }
}
