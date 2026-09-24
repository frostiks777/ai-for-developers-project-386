import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { runMigrations } from './migrate'

describe('runMigrations', () => {
  it('создаёт таблицы скелета и идемпотентна при повторном запуске', () => {
    const client = new Database(':memory:')

    runMigrations(client)
    runMigrations(client)

    const tables = (
      client.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string
      }[]
    ).map((row) => row.name)

    expect(tables).toEqual(
      expect.arrayContaining(['slots', 'bookings', 'availability_rules', 'hosts']),
    )

    client.close()
  })
})
