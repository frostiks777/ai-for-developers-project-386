import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { AvailabilitySettings } from '@/types/availability-settings'
import { AvailabilitySettingsForm } from './availability-settings-form'

const settings: AvailabilitySettings = {
  timeZone: 'UTC',
  slotDurationMin: 30,
  bufferMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
  ranges: [
    { weekday: 1, startMinute: 540, endMinute: 780 },
    { weekday: 1, startMinute: 840, endMinute: 1080 },
  ],
}

describe('AvailabilitySettingsForm', () => {
  it('показывает по кнопке удаления на каждый интервал дня', () => {
    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    expect(screen.getByLabelText('Убрать интервал: Пн 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Убрать интервал: Пн 2')).toBeInTheDocument()
  })

  it('удаляет выбранный интервал, не трогая остальные', async () => {
    const user = userEvent.setup()

    render(<AvailabilitySettingsForm settings={settings} isSaving={false} onSave={vi.fn()} />)

    await user.click(screen.getByLabelText('Убрать интервал: Пн 1'))

    expect(screen.getAllByRole('button', { name: /Убрать интервал/ })).toHaveLength(1)
    expect(screen.getByLabelText('Пн: начало 1')).toHaveValue('14:00')
  })
})
