// Типы API-контракта, зеркалятся фронтендом — менять только согласованно

export interface TimeSlot {
  id: number
  startAt: string
  durationMin: number
  isBooked: boolean
}

export interface CreateBookingBody {
  slotId: number
  name: string
  phone: string
  email: string
}

export interface Booking {
  id: number
  slotId: number
  name: string
  phone: string
  email: string
  createdAt: string
}

// Бронь вместе с данными слота — для панели организатора
export interface BookingWithSlot extends Booking {
  startAt: string
  durationMin: number
}
