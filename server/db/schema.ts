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
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  comment: text('comment'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(datetime('now'))`),
})
