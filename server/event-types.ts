import { randomUUID } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { db } from './db'
import { eventTypes } from './db/schema'

export type EventType = typeof eventTypes.$inferSelect

export type CreateEventTypeInput = {
  slug: string
  title: string
  description?: string
  durationMin: number
  locationType: string
  isActive?: boolean
}

export type UpdateEventTypeInput = {
  title?: string
  description?: string | null
  durationMin?: number
  locationType?: string
  isActive?: boolean
}

export function listEventTypes(hostId: string): EventType[] {
  return db
    .select()
    .from(eventTypes)
    .where(eq(eventTypes.hostId, hostId))
    .orderBy(asc(eventTypes.slug))
    .all()
}

export function findEventType(hostId: string, id: string): EventType | undefined {
  return db
    .select()
    .from(eventTypes)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .get()
}

export function findEventTypeById(id: string): EventType | undefined {
  return db.select().from(eventTypes).where(eq(eventTypes.id, id)).get()
}

export function createEventType(hostId: string, input: CreateEventTypeInput): EventType {
  return db
    .insert(eventTypes)
    .values({
      id: randomUUID(),
      hostId,
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      durationMin: input.durationMin,
      locationType: input.locationType,
      isActive: input.isActive ?? true,
    })
    .returning()
    .get()
}

export function updateEventType(
  hostId: string,
  id: string,
  patch: UpdateEventTypeInput,
): EventType | undefined {
  if (!findEventType(hostId, id)) {
    return undefined
  }

  return db
    .update(eventTypes)
    .set(patch)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .returning()
    .get()
}

export function deleteEventType(hostId: string, id: string): boolean {
  const deleted = db
    .delete(eventTypes)
    .where(and(eq(eventTypes.hostId, hostId), eq(eventTypes.id, id)))
    .returning()
    .get()

  return Boolean(deleted)
}
