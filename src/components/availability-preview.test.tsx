import { render, screen } from '@testing-library/react'

import type { AvailabilitySettings } from '@/types/availability-settings'
import type { TimeSlot } from '@/types/booking'
import { AvailabilityPreview } from './availability-preview'

const settings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  bufferAfterMin: 0,
  minNoticeMin: 0,
  horizonDays: 14,
  ranges: [{ weekday: 1, startMinute: 600, endMinute: 660 }],
}

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: true },
  { id: 2, startAt: '2026-09-28T10:30:00.000Z', durationMin: 30, isBooked: false },
]

describe('AvailabilityPreview', () => {
  it('помечает занятые окна как встречи, свободные — как свободные', () => {
    const { container } = render(<AvailabilityPreview settings={settings} slots={slots} />)

    const meetings = container.querySelectorAll('[data-state="meeting"]')
    expect(meetings).toHaveLength(1)
    expect(container.querySelectorAll('[data-state="free"]')).toHaveLength(1)
  })

  it('без слотов показывает только свободные окна', () => {
    const { container } = render(<AvailabilityPreview settings={settings} />)

    expect(container.querySelectorAll('[data-state="meeting"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-state="free"]')).toHaveLength(2)
  })

  it('показывает сообщение при отсутствии данных', () => {
    render(<AvailabilityPreview settings={{ ...settings, ranges: [] }} />)

    expect(screen.getByText('Нет данных для превью')).toBeInTheDocument()
  })
})
