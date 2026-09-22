import { useCallback, useEffect, useState } from 'react'

import { fetchSlots } from '@/api/client'
import type { TimeSlot } from '@/types/booking'

export function useAvailability() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSlots = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await fetchSlots()
      // Бэкенд тоже фильтрует, но вкладка могла быть открыта долго — не показываем прошедшее
      setSlots(data.filter((slot) => new Date(slot.startAt).getTime() >= Date.now()))
      setError(null)
    } catch {
      setError('Не удалось загрузить слоты')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  return { slots, isLoading, error, refetch: loadSlots }
}
