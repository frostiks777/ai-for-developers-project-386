import type { Booking, CreateBookingBody, TimeSlot } from '@/types/booking'

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

export function fetchSlots(): Promise<TimeSlot[]> {
  return request<TimeSlot[]>('/api/slots')
}

export function createBooking(body: CreateBookingBody): Promise<Booking> {
  return request<Booking>('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
