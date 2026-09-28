import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BookingWizard } from './booking-wizard'
import type { EventType } from '@/api/generated'
import type { TimeSlot } from '@/types/booking'

const eventType: EventType = {
  id: 'type-1',
  slug: 'consultation',
  title: 'Консультация',
  description: null,
  durationMin: 30,
  locationType: 'online' as EventType['locationType'],
  isActive: true,
}

const slots: TimeSlot[] = [
  { id: 1, startAt: '2026-09-28T10:00:00.000Z', durationMin: 30, isBooked: false },
  { id: 2, startAt: '2026-09-29T15:00:00.000Z', durationMin: 30, isBooked: false },
]

function renderWizard(overrides: Partial<Parameters<typeof BookingWizard>[0]> = {}) {
  return render(
    <BookingWizard
      slots={slots}
      timeZone="UTC"
      onTimeZoneChange={vi.fn()}
      eventTypes={[eventType]}
      selectedTypeId="type-1"
      onSelectType={vi.fn()}
      selectedTypeTitle="Консультация"
      hostSlug="default"
      hostName="Организатор"
      selectedSlot={null}
      onSelectSlot={vi.fn()}
      onBooked={vi.fn()}
      onConflict={vi.fn()}
      {...overrides}
    />,
  )
}

describe('BookingWizard', () => {
  it('шаг 1: показывает «Ближайшее свободное» и список дней', () => {
    renderWizard()

    expect(screen.getByText('ШАГ 1 ИЗ 3 · ДЕНЬ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выбрать это время' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2026-09-28' })).toBeInTheDocument()
  })

  it('по дню переходит ко времени и к контактам', async () => {
    const onSelectSlot = vi.fn()
    const user = userEvent.setup()
    renderWizard({ onSelectSlot })

    await user.click(screen.getByRole('button', { name: '2026-09-28' }))

    expect(screen.getByText('ШАГ 2 ИЗ 3 · ВРЕМЯ')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '10:00' }))
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0])
  })

  it('«Ближайшее свободное» ведёт сразу к контактам', async () => {
    const onSelectSlot = vi.fn()
    const user = userEvent.setup()
    renderWizard({ onSelectSlot })

    await user.click(screen.getByRole('button', { name: 'Выбрать это время' }))

    expect(screen.getByText('ШАГ 3 ИЗ 3 · КОНТАКТЫ')).toBeInTheDocument()
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0])
    expect(screen.getByRole('form', { name: 'Ваши данные' })).toBeInTheDocument()
  })
})
