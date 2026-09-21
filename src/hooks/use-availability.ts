import { useEffect, useState } from 'react'

import { fetchSlots } from '@/api/client'
import type { TimeSlot } from '@/types/booking'

export function useAvailability() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadSlots = async () => {
      try {
        const data = await fetchSlots()
        if (cancelled) return
        setSlots(data)
      } catch {
        if (cancelled) return
        setError('Не удалось загрузить слоты')
      }
      if (!cancelled) setIsLoading(false)
    }

    void loadSlots()

    return () => {
      cancelled = true
    }
  }, [])

  return { slots, isLoading, error }
}
