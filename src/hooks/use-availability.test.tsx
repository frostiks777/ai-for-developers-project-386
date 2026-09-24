import { renderHook, waitFor } from '@testing-library/react'

import { useAvailability } from './use-availability'
import type { TimeSlot } from '@/types/booking'

const pastSlot: TimeSlot = {
  id: 1,
  startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

const futureSlot: TimeSlot = {
  id: 2,
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

function stubSlotsResponse(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

describe('useAvailability', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('отбрасывает прошедшие слоты', async () => {
    stubSlotsResponse([pastSlot, futureSlot])

    const { result } = renderHook(() => useAvailability('default'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.slots).toEqual([futureSlot])
    expect(result.current.error).toBeNull()
  })

  it('показывает ошибку при неудачном запросе', async () => {
    stubSlotsResponse({ error: 'Внутренняя ошибка' }, 500)

    const { result } = renderHook(() => useAvailability('default'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Не удалось загрузить слоты')
    expect(result.current.slots).toEqual([])
  })
})

