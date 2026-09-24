import { useState } from 'react'
import { toast } from 'sonner'

import type { CreateBookingRequest } from '@/api/generated'
import { toCreatedBooking } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import type { CreatedBooking } from '@/types/booking'

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookSlot = async (
    hostSlug: string,
    body: CreateBookingRequest,
  ): Promise<CreatedBooking | null> => {
    setIsSubmitting(true)

    try {
      const booking = await call(api.hostBookingsClient.createBooking(hostSlug, body))
      toast.success('Звонок забронирован')
      return toCreatedBooking(booking)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось забронировать звонок')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, bookSlot }
}
