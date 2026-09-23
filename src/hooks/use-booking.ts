import { useState } from 'react'
import { toast } from 'sonner'

import { ApiError, createBooking } from '@/api/client'
import type { Booking, CreateBookingBody } from '@/types/booking'

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookSlot = async (body: CreateBookingBody): Promise<Booking | null> => {
    setIsSubmitting(true)

    try {
      const booking = await createBooking(body)
      toast.success('Звонок забронирован')
      return booking
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось забронировать звонок')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, bookSlot }
}
