export interface TimeSlot {
  id: number
  startAt: string // ISO 8601
  durationMin: number
  isBooked: boolean
}

export interface CreateBookingBody {
  slotId: number
  name: string
  phone?: string
  email: string
  comment?: string
}

export interface Booking {
  id: number
  slotId: number
  name: string
  phone: string | null
  email: string
  comment: string | null
  createdAt: string
}

// Бронь вместе с данными слота — зеркало server/types.ts
export interface BookingWithSlot extends Booking {
  startAt: string
  durationMin: number
}

// Ответ на создание брони: содержит токен для публичной отмены по ссылке
export interface CreatedBooking extends Booking {
  cancelToken: string
}
