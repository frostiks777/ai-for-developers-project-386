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
  status: string
  cancelToken: string | null
  eventTypeId: string
  eventTypeTitle: string | null
}

// Ответ на создание брони: содержит токен для публичной отмены по ссылке
export interface CreatedBooking extends Booking {
  cancelToken: string
}

// Бронирование v1: тип встречи + время начала
export interface CreateBookingV1Body {
  eventTypeId: string
  startAt: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientNotes?: string
}

// Бронь v1: публичный id (UUID), статус, тип встречи
export interface V1Booking {
  id: string
  hostSlug: string
  eventTypeId: string
  startAt: string
  endAt: string
  status: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  clientNotes: string | null
  createdAt: string
}
