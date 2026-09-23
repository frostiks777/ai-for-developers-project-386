import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Слоты времени, доступные для бронирования
export const slots = sqliteTable('slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Дата-время начала слота в формате ISO 8601
  startAt: text('startAt').notNull(),
  durationMin: integer('durationMin').notNull().default(30),
})

// Бронирования слотов
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slotId: integer('slotId')
    .notNull()
    .unique()
    .references(() => slots.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email').notNull(),
  comment: text('comment'),
  // Токен для публичной отмены брони по ссылке (у старых броней может быть null)
  cancelToken: text('cancelToken').unique(),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// Правила доступности организатора — одна строка с id = 1 (MVP: один хост)
export const availabilityRules = sqliteTable('availability_rules', {
  id: integer('id').primaryKey(),
  // Дни недели по JS (0 — вс … 6 — сб), JSON-массив
  weekdays: text('weekdays').notNull(),
  windowStartHour: integer('windowStartHour').notNull(),
  windowEndHour: integer('windowEndHour').notNull(),
  slotDurationMin: integer('slotDurationMin').notNull(),
  bufferMin: integer('bufferMin').notNull(),
  minNoticeMin: integer('minNoticeMin').notNull(),
  horizonDays: integer('horizonDays').notNull(),
})

// Хосты (мульти-хост). MVP заводит одного дефолтного организатора
export const hosts = sqliteTable('hosts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(datetime('now'))`),
})
