export type LocationType = 'online' | 'offline' | 'phone'

export interface EventType {
  id: string
  hostId: string
  slug: string
  title: string
  description: string | null
  durationMin: number
  locationType: LocationType
  isActive: boolean
  createdAt: string
}

export interface CreateEventTypeBody {
  slug: string
  title: string
  description?: string
  durationMin: number
  locationType: LocationType
  isActive?: boolean
}

export type UpdateEventTypeBody = Partial<Omit<CreateEventTypeBody, 'slug'>>
