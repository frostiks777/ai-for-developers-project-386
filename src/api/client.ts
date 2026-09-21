import type { Booking, CreateBookingBody, TimeSlot } from '@/types/booking'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.status}`)
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
