import { randomUUID } from 'node:crypto'
import { and, eq, ne } from 'drizzle-orm'

import { db } from './db'
import { bookings, slots } from './db/schema'

export type BookingRow = typeof bookings.$inferSelect
export type SlotRow = typeof slots.$inferSelect

export type CreateBookingInput = {
  eventTypeId: string
  startAt: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientNotes?: string
}

export function findSlotByStartAt(startAt: string): SlotRow | undefined {
  return db.select().from(slots).where(eq(slots.startAt, startAt)).get()
}

export function findActiveBookingForSlot(slotId: number): BookingRow | undefined {
  return db
    .select()
    .from(bookings)
    .where(and(eq(bookings.slotId, slotId), eq(bookings.status, 'confirmed')))
    .get()
}

export function findBookingByPublicId(id: string): BookingRow | undefined {
  return db.select().from(bookings).where(eq(bookings.cancelToken, id)).get()
}

export function createBookingV1(
  input: CreateBookingInput,
  slot: SlotRow,
  durationMin: number,
): BookingRow {
  const startAt = slot.startAt
  const endAt = new Date(new Date(startAt).getTime() + durationMin * 60_000).toISOString()

  return db
    .insert(bookings)
    .values({
      slotId: slot.id,
      eventTypeId: input.eventTypeId,
      name: input.clientName,
      email: input.clientEmail,
      phone: input.clientPhone ?? null,
      comment: input.clientNotes ?? null,
      status: 'confirmed',
      startAt,
      endAt,
      cancelToken: randomUUID(),
    })
    .returning()
    .get()
}

export function cancelBookingV1(booking: BookingRow): BookingRow {
  return db
    .update(bookings)
    .set({ status: 'cancelled' })
    .where(eq(bookings.id, booking.id))
    .returning()
    .get()
}

export function rescheduleBookingV1(
  booking: BookingRow,
  slot: SlotRow,
  durationMin: number,
): BookingRow {
  const endAt = new Date(
    new Date(slot.startAt).getTime() + durationMin * 60_000,
  ).toISOString()

  return db
    .update(bookings)
    .set({ slotId: slot.id, startAt: slot.startAt, endAt, status: 'confirmed' })
    .where(eq(bookings.id, booking.id))
    .returning()
    .get()
}

// Активная бронь на слоте, кроме указанной (для переноса)
export function findOtherActiveBooking(slotId: number, exceptBookingId: number): BookingRow | undefined {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.status, 'confirmed'),
        ne(bookings.id, exceptBookingId),
      ),
    )
    .get()
}
