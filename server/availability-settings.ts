import { eq, gte, inArray } from 'drizzle-orm'

import {
  defaultAvailabilityRules,
  generateSlotStartsFromRanges,
  rangesFromRules,
  windowFromRanges,
  type AvailabilitySettings,
} from './availability'
import { db } from './db'
import { availabilityRanges, bookings, slots } from './db/schema'
import { loadAvailabilityRules, saveAvailabilityRules } from './rules'

export function loadAvailabilitySettings(hostId: string, timeZone: string): AvailabilitySettings {
  const rules = loadAvailabilityRules()
  const rows = db
    .select()
    .from(availabilityRanges)
    .where(eq(availabilityRanges.hostId, hostId))
    .orderBy(availabilityRanges.weekday, availabilityRanges.startMinute)
    .all()

  const ranges =
    rows.length > 0
      ? rows.map((row) => ({
          weekday: row.weekday,
          startMinute: row.startMinute,
          endMinute: row.endMinute,
        }))
      : rangesFromRules(rules)

  return {
    timeZone,
    slotDurationMin: rules.slotDurationMin,
    bufferMin: rules.bufferMin,
    minNoticeMin: rules.minNoticeMin,
    horizonDays: rules.horizonDays,
    ranges,
  }
}

export function saveAvailabilitySettings(hostId: string, settings: AvailabilitySettings): void {
  const window = windowFromRanges(settings.ranges, defaultAvailabilityRules)

  saveAvailabilityRules({
    ...window,
    slotDurationMin: settings.slotDurationMin,
    bufferMin: settings.bufferMin,
    minNoticeMin: settings.minNoticeMin,
    horizonDays: settings.horizonDays,
  })

  db.delete(availabilityRanges).where(eq(availabilityRanges.hostId, hostId)).run()

  if (settings.ranges.length > 0) {
    db.insert(availabilityRanges)
      .values(settings.ranges.map((range) => ({ hostId, ...range })))
      .run()
  }

  regenerateFutureSlotsForSettings(settings)
}

// Пересобирает будущие слоты под настройки, не трогая занятые слоты
export function regenerateFutureSlotsForSettings(settings: AvailabilitySettings): void {
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

  const newStarts = generateSlotStartsFromRanges(now, settings).filter(
    (startAt) => !existingStarts.has(startAt),
  )

  if (newStarts.length > 0) {
    db.insert(slots)
      .values(newStarts.map((startAt) => ({ startAt, durationMin: settings.slotDurationMin })))
      .run()
  }
}
