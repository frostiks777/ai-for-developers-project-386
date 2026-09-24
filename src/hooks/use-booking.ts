import { useState } from 'react'
import { toast } from 'sonner'

import { ApiError, createBookingV1 } from '@/api/client'
import type { CreateBookingV1Body, CreatedBooking } from '@/types/booking'

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookSlot = async (
    hostSlug: string,
    body: CreateBookingV1Body,
  ): Promise<CreatedBooking | null> => {
    setIsSubmitting(true)

    try {
      const booking = await createBookingV1(hostSlug, body)
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
