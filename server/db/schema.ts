import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Слоты материализуются из правил доступности (ADR-0003/0004)
export const slots = sqliteTable('slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Дата-время начала слота в формате ISO 8601 (UTC)
  startAt: text('startAt').notNull(),
  durationMin: integer('durationMin').notNull().default(30),
})

// Дефолтный тип встречи, на который ссылаются брони без явного типа (MVP: один тип)
export const DEFAULT_EVENT_TYPE_ID = 'default-consultation'

// Типы встреч организатора (ADR-0011)
export const eventTypes = sqliteTable(
  'event_types',
  {
    id: text('id').primaryKey(),
    hostId: text('hostId')
      .notNull()
      .references(() => hosts.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    durationMin: integer('durationMin').notNull().default(30),
    locationType: text('locationType').notNull().default('online'),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex('event_types_host_slug_unique').on(table.hostId, table.slug)],
)

// Бронирования
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slotId: integer('slotId')
    .notNull()
    .references(() => slots.id),
  eventTypeId: text('eventTypeId')
    .notNull()
    .default(DEFAULT_EVENT_TYPE_ID)
    .references(() => eventTypes.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email').notNull(),
  comment: text('comment'),
  // Статус брони: активная занимает слот, отменённая — нет (ADR-0011)
  status: text('status').notNull().default('confirmed'),
  // Причина отмены, если бронь отменена (гостем или организатором)
  cancellationReason: text('cancellationReason'),
  // Снимок времени встречи на момент бронирования (UTC ISO)
  startAt: text('startAt').notNull(),
  endAt: text('endAt').notNull(),
  // Токен для публичной ссылки отмены брони (в ответе на создание брони)
  cancelToken: text('cancelToken').unique(),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// Правила доступности организатора - одна строка на хоста (MVP: одна строка id=1)
export const availabilityRules = sqliteTable('availability_rules', {
  id: integer('id').primaryKey(),
  hostId: text('hostId').references(() => hosts.id),
  // Дни недели из JS (0 - вс .. 6 - сб), JSON-массив
  weekdays: text('weekdays').notNull(),
  windowStartHour: integer('windowStartHour').notNull(),
  windowEndHour: integer('windowEndHour').notNull(),
  slotDurationMin: integer('slotDurationMin').notNull(),
  bufferMin: integer('bufferMin').notNull(),
  minNoticeMin: integer('minNoticeMin').notNull(),
  horizonDays: integer('horizonDays').notNull(),
})

// Диапазоны доступности по дням недели: несколько интервалов на день (ADR-0011)
export const availabilityRanges = sqliteTable('availability_ranges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hostId: text('hostId')
    .notNull()
    .references(() => hosts.id),
  // День недели: 1 - понедельник .. 7 - воскресенье
  weekday: integer('weekday').notNull(),
  // Минуты от полуночи в поясе хоста
  startMinute: integer('startMinute').notNull(),
  endMinute: integer('endMinute').notNull(),
})

// Хосты (мульти-хост). MVP использует дефолтного организатора
export const hosts = sqliteTable('hosts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(datetime('now'))`),
})
