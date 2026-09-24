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

export async function loadAvailabilityRules(): Promise<AvailabilityRules> {
  const rows = await db.select().from(availabilityRules).where(eq(availabilityRules.id, RULES_ID)).limit(1)
  const row = rows[0]

  return row ? rulesFromRow(row) : defaultAvailabilityRules
}

export async function saveAvailabilityRules(rules: AvailabilityRules): Promise<void> {
  const row = rulesToRow(rules)

  await db
    .insert(availabilityRules)
    .values({ id: RULES_ID, ...row })
    .onConflictDoUpdate({ target: availabilityRules.id, set: row })
}

// Пересобирает будущие слоты под новые правила, не трогая занятые слоты:
// удаляет свободные будущие слоты и добавляет недостающие по новому расписанию
export async function regenerateFutureSlots(rules: AvailabilityRules): Promise<void> {
  const now = new Date()
  const nowIso = now.toISOString()

  const futureSlots = await db
    .select({ id: slots.id, bookingId: bookings.id })
    .from(slots)
    .leftJoin(bookings, eq(bookings.slotId, slots.id))
    .where(gte(slots.startAt, nowIso))

  const freeIds = futureSlots.filter((slot) => slot.bookingId === null).map((slot) => slot.id)

  if (freeIds.length > 0) {
    await db.delete(slots).where(inArray(slots.id, freeIds))
  }

  const existingStarts = new Set(
    (
      await db
        .select({ startAt: slots.startAt })
        .from(slots)
        .where(gte(slots.startAt, nowIso))
    ).map((slot) => slot.startAt),
  )

  const newStarts = generateSlotStarts(now, rules).filter((startAt) => !existingStarts.has(startAt))

  if (newStarts.length > 0) {
    await db
      .insert(slots)
      .values(newStarts.map((startAt) => ({ startAt, durationMin: rules.slotDurationMin })))
  }
}
