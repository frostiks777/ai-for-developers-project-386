import type { AvailabilityRules } from '@/types/availability'
import type {
  AvailabilitySettings,
} from '@/types/availability-settings'
import type { HostSettings } from '@/types/host'
import type {
  BookingWithSlot,
  CreateBookingBody,
  CreateBookingV1Body,
  CreatedBooking,
  TimeSlot,
  V1Booking,
} from '@/types/booking'
import type {
  CreateEventTypeBody,
  EventType,
  UpdateEventTypeBody,
} from '@/types/event-type'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null)

  if (body !== null && typeof body === 'object' && 'error' in body) {
    const error = (body as { error: unknown }).error

    if (typeof error === 'string' && error.trim() !== '') {
      return error
    }

    if (
      error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message
    }
  }

  return `Ошибка запроса: ${response.status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  return response.json() as Promise<T>
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
}

export function fetchSlots(): Promise<TimeSlot[]> {
  return request<TimeSlot[]>('/api/slots')
}

export function fetchHostSettings(slug: string): Promise<HostSettings> {
  return request<HostSettings>(`/api/v1/hosts/${encodeURIComponent(slug)}/settings`)
}

export function fetchHostSlots(slug: string, eventTypeId?: string): Promise<TimeSlot[]> {
  const query = eventTypeId ? `?eventTypeId=${encodeURIComponent(eventTypeId)}` : ''

  return request<{
    timeZone: string
    date: string | null
    slots: { id: number; startAt: string; durationMin: number; available: boolean }[]
  }>(`/api/v1/hosts/${encodeURIComponent(slug)}/slots${query}`).then((data) =>
    data.slots.map((slot) => ({
      id: slot.id,
      startAt: slot.startAt,
      durationMin: slot.durationMin,
      isBooked: !slot.available,
    })),
  )
}

export function createBooking(body: CreateBookingBody): Promise<CreatedBooking> {
  return request<CreatedBooking>('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// Создание брони через API v1: по типу встречи и времени начала
export async function createBookingV1(
  slug: string,
  body: CreateBookingV1Body,
): Promise<CreatedBooking> {
  const row = await request<V1Booking>(
    `/api/v1/hosts/${encodeURIComponent(slug)}/bookings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  return {
    id: 0,
    slotId: 0,
    name: row.clientName,
    phone: row.clientPhone,
    email: row.clientEmail,
    comment: row.clientNotes,
    createdAt: row.createdAt,
    cancelToken: row.id,
  }
}

export function fetchBookingV1(id: string): Promise<V1Booking> {
  return request<V1Booking>(`/api/v1/bookings/${encodeURIComponent(id)}`)
}

export function cancelBookingV1(id: string): Promise<V1Booking> {
  return request<V1Booking>(`/api/v1/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  })
}

export function rescheduleBookingV1(id: string, startAt: string): Promise<V1Booking> {
  return request<V1Booking>(`/api/v1/bookings/${encodeURIComponent(id)}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startAt }),
  })
}

export function fetchBookings(): Promise<BookingWithSlot[]> {
  return request<BookingWithSlot[]>('/api/bookings')
}

export function cancelBooking(id: number): Promise<void> {
  return requestVoid(`/api/bookings/${id}`, { method: 'DELETE' })
}

export function cancelBookingByToken(token: string): Promise<void> {
  return requestVoid('/api/bookings/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })
}

export function fetchBookingByToken(token: string): Promise<BookingWithSlot> {
  return request<BookingWithSlot>(`/api/bookings/by-token/${encodeURIComponent(token)}`)
}

export function rescheduleBookingByToken(token: string, slotId: number): Promise<BookingWithSlot> {
  return request<BookingWithSlot>('/api/bookings/reschedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, slotId }),
  })
}

export function fetchAvailability(): Promise<AvailabilityRules> {
  return request<AvailabilityRules>('/api/availability')
}

export function updateAvailability(rules: AvailabilityRules): Promise<AvailabilityRules> {
  return request<AvailabilityRules>('/api/availability', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rules),
  })
}

export function fetchAvailabilitySettings(slug: string): Promise<AvailabilitySettings> {
  return request<AvailabilitySettings>(
    `/api/v1/hosts/${encodeURIComponent(slug)}/availability`,
  )
}

export function updateAvailabilitySettings(
  slug: string,
  settings: AvailabilitySettings,
): Promise<AvailabilitySettings> {
  return request<AvailabilitySettings>(
    `/api/v1/hosts/${encodeURIComponent(slug)}/availability`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    },
  )
}

export function fetchEventTypes(slug: string): Promise<EventType[]> {
  return request<EventType[]>(`/api/v1/hosts/${encodeURIComponent(slug)}/event-types`)
}

export function createEventType(slug: string, body: CreateEventTypeBody): Promise<EventType> {
  return request<EventType>(`/api/v1/hosts/${encodeURIComponent(slug)}/event-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export function updateEventType(
  slug: string,
  id: string,
  body: UpdateEventTypeBody,
): Promise<EventType> {
  return request<EventType>(
    `/api/v1/hosts/${encodeURIComponent(slug)}/event-types/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
}

export function deleteEventType(slug: string, id: string): Promise<void> {
  return requestVoid(
    `/api/v1/hosts/${encodeURIComponent(slug)}/event-types/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
}
