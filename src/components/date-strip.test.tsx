import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimeSlot } from '@/types/booking'
import { toDateKeyInZone } from '@/utils/timezone'
import { DateStrip } from './date-strip'

const timeZone = 'UTC'

function slotAt(id: number, startAt: string): TimeSlot {
  return { id, startAt, durationMin: 30, isBooked: false }
}

const slots: TimeSlot[] = [
  slotAt(1, '2099-09-24T07:00:00.000Z'),
  slotAt(2, '2099-09-24T08:00:00.000Z'),
  slotAt(3, '2099-09-25T07:00:00.000Z'),
]

const firstKey = toDateKeyInZone(new Date(slots[0].startAt), timeZone)
const secondKey = toDateKeyInZone(new Date(slots[2].startAt), timeZone)

describe('DateStrip', () => {
  it('показывает только даты, на которые есть слоты', () => {
    render(
      <DateStrip slots={slots} selectedDate={firstKey} timeZone={timeZone} onSelectDate={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: firstKey })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: secondKey })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2099-09-26' })).toBeNull()
  })

  it('подписывает день недели по календарной дате, а не по TZ процесса', () => {
    vi.stubEnv('TZ', 'Europe/Moscow')

    try {
      render(
        <DateStrip
          slots={[slotAt(1, '2026-09-28T07:00:00.000Z')]}
          selectedDate="2026-09-28"
          timeZone="UTC"
          onSelectDate={vi.fn()}
        />,
      )

      // 2026-09-28 — понедельник; при вычислении через parseDateKey в Europe/Moscow
      // (UTC+3) полночь смещается на 27 сентября (воскресенье) — это и есть баг
      expect(screen.getByRole('button', { name: '2026-09-28' })).toHaveTextContent('Пн')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('отмечает выбранную дату и вызывает onSelectDate по клику', async () => {
    const onSelectDate = vi.fn()
    const user = userEvent.setup()

    render(
      <DateStrip
        slots={slots}
        selectedDate={firstKey}
        timeZone={timeZone}
        onSelectDate={onSelectDate}
      />,
    )

    expect(screen.getByRole('button', { name: firstKey })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: secondKey })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await user.click(screen.getByRole('button', { name: secondKey }))

    expect(onSelectDate).toHaveBeenCalledWith(secondKey)
  })
})
