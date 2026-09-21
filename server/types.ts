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
}

export interface Booking {
  id: number
  slotId: number
  name: string
  phone: string
  createdAt: string
}
