import type { AvailabilityRules } from '@/types/availability'
import type {
  BookingWithSlot,
  CreateBookingBody,
  CreatedBooking,
  TimeSlot,
} from '@/types/booking'

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

  if (
    body !== null &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string' &&
    body.error.trim() !== ''
  ) {
    return body.error
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

export function createBooking(body: CreateBookingBody): Promise<CreatedBooking> {
  return request<CreatedBooking>('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
