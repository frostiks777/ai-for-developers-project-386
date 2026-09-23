import { eq, gte, inArray } from 'drizzle-orm'

import {
  defaultAvailabilityRules,
  generateSlotStarts,
  rulesFromRow,
  rulesToRow,
  type AvailabilityRules,
} from './availability'
import { db } from './db'
import { availabilityRules, bookings, slots } from './db/schema'

// MVP: один организатор — правила хранятся одной строкой с фиксированным id
const RULES_ID = 1

export function loadAvailabilityRules(): AvailabilityRules {
  const row = db.select().from(availabilityRules).where(eq(availabilityRules.id, RULES_ID)).get()

  return row ? rulesFromRow(row) : defaultAvailabilityRules
}

export function saveAvailabilityRules(rules: AvailabilityRules): void {
  const row = rulesToRow(rules)

  db.insert(availabilityRules)
    .values({ id: RULES_ID, ...row })
    .onConflictDoUpdate({ target: availabilityRules.id, set: row })
    .run()
}

// Пересобирает будущие слоты под новые правила, не трогая занятые слоты:
// удаляет свободные будущие слоты и добавляет недостающие по новому расписанию
export function regenerateFutureSlots(rules: AvailabilityRules): void {
  const now = new Date()
  const nowIso = now.toISOString()

  const futureSlots = db
    .select({ id: slots.id, bookingId: bookings.id })
    .from(slots)
    .leftJoin(bookings, eq(bookings.slotId, slots.id))
    .where(gte(slots.startAt, nowIso))
    .all()

  const freeIds = futureSlots.filter((slot) => slot.bookingId === null).map((slot) => slot.id)

  if (freeIds.length > 0) {
    db.delete(slots).where(inArray(slots.id, freeIds)).run()
  }

  const existingStarts = new Set(
    db
      .select({ startAt: slots.startAt })
      .from(slots)
      .where(gte(slots.startAt, nowIso))
      .all()
      .map((slot) => slot.startAt),
  )

  const newStarts = generateSlotStarts(now, rules).filter((startAt) => !existingStarts.has(startAt))

  if (newStarts.length > 0) {
    db.insert(slots)
      .values(newStarts.map((startAt) => ({ startAt, durationMin: rules.slotDurationMin })))
      .run()
  }
}
