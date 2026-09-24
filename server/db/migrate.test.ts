import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { runMigrations } from './migrate'

const tableNames = (client: Database.Database) =>
  (
    client.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
      name: string
    }[]
  ).map((row) => row.name)

describe('runMigrations', () => {
  it('создаёт таблицы скелета и идемпотентна при повторном запуске', () => {
    const client = new Database(':memory:')

    runMigrations(client)
    runMigrations(client)

    expect(tableNames(client)).toEqual(
      expect.arrayContaining([
        'slots',
        'bookings',
        'hosts',
        'event_types',
        'availability_rules',
        'availability_ranges',
      ]),
    )

    const indexes = (
      client.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as {
        name: string
      }[]
    ).map((row) => row.name)
    expect(indexes).toContain('bookings_slotId_active_unique')

    expect(client.prepare('SELECT slug FROM event_types WHERE id = ?').get('default-consultation')).toBeTruthy()

    client.close()
  })

  it('пересобирает старую таблицу броней с бэкфиллом статуса, типа и времени', () => {
    const client = new Database(':memory:')
    client.exec(`
      CREATE TABLE slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startAt TEXT NOT NULL,
        durationMin INTEGER NOT NULL DEFAULT 30
      );
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
      CREATE UNIQUE INDEX bookings_slotId_unique ON bookings(slotId);
    `)

    const startAt = '2026-10-01T10:00:00.000Z'
    client.prepare('INSERT INTO slots (startAt, durationMin) VALUES (?, ?)').run(startAt, 30)
    client
      .prepare('INSERT INTO bookings (slotId, name, email, phone) VALUES (?, ?, ?, ?)')
      .run(1, 'Иван', 'ivan@example.com', null)

    runMigrations(client)

    const row = client.prepare('SELECT * FROM bookings WHERE id = 1').get() as {
      status: string
      eventTypeId: string
      startAt: string
      endAt: string
    }
    expect(row.status).toBe('confirmed')
    expect(row.eventTypeId).toBe('default-consultation')
    expect(row.startAt).toBe(startAt)
    expect(row.endAt).toBe('2026-10-01T10:30:00.000Z')

    // Отменённая бронь не блокирует слот (partial unique index)
    client.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = 1").run()
    expect(() =>
      client
        .prepare(
          'INSERT INTO bookings (slotId, name, email, startAt, endAt) VALUES (?, ?, ?, ?, ?)',
        )
        .run(1, 'Пётр', 'petr@example.com', startAt, '2026-10-01T10:30:00.000Z'),
    ).not.toThrow()

    client.close()
  })

  it('досыпает hostId в старую availability_rules', () => {
    const client = new Database(':memory:')
    client.exec(`
      CREATE TABLE availability_rules (
        id INTEGER PRIMARY KEY,
        weekdays TEXT NOT NULL,
        windowStartHour INTEGER NOT NULL,
        windowEndHour INTEGER NOT NULL,
        slotDurationMin INTEGER NOT NULL,
        bufferMin INTEGER NOT NULL,
        minNoticeMin INTEGER NOT NULL,
        horizonDays INTEGER NOT NULL
      );
    `)
    client
      .prepare(
        'INSERT INTO availability_rules (id, weekdays, windowStartHour, windowEndHour, slotDurationMin, bufferMin, minNoticeMin, horizonDays) VALUES (1, ?, 10, 18, 30, 10, 120, 14)',
      )
      .run('[1,2,3,4,5]')

    runMigrations(client)

    const row = client.prepare('SELECT hostId FROM availability_rules WHERE id = 1').get() as {
      hostId: string | null
    }
    expect(row.hostId).toBeTruthy()

    client.close()
  })
})
