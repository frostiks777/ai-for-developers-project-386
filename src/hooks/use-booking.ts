import { useState } from 'react'
import { toast } from 'sonner'

import { ApiError, createBooking } from '@/api/client'
import type { CreateBookingBody } from '@/types/booking'

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookSlot = async (body: CreateBookingBody): Promise<boolean> => {
    setIsSubmitting(true)

    try {
      await createBooking(body)
      toast.success('Звонок забронирован')
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось забронировать звонок')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, bookSlot }
}
