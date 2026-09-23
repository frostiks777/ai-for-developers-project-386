import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { parseDateKey, startOfDay, toDateKey } from '@/utils/dates'
import { toDateKeyInZone } from '@/utils/timezone'

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthTitleFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

interface MonthCalendarProps {
  slots: TimeSlot[]
  selectedDate: string
  timeZone: string
  onSelectDate: (dateKey: string) => void
}

function buildMonthDays(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  return cells
}

export function MonthCalendar({
  slots,
  selectedDate,
  timeZone,
  onSelectDate,
}: MonthCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateKey(selectedDate))

  useEffect(() => {
    setVisibleMonth(parseDateKey(selectedDate))
  }, [selectedDate])

  const availableDates = new Set(
    slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone)),
  )
  const today = startOfDay(new Date())
  const days = buildMonthDays(visibleMonth)

  const shiftMonth = (offset: number) => {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1))
  }

  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Предыдущий месяц"
          onClick={() => shiftMonth(-1)}
        >
          ←
        </Button>
        <p className="font-medium capitalize">{monthTitleFormatter.format(visibleMonth)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Следующий месяц"
          onClick={() => shiftMonth(1)}
        >
          →
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} />
          }

          const dateKey = toDateKey(date)
          const isAvailable = availableDates.has(dateKey)
          const isPast = date < today
          const isSelected = dateKey === selectedDate

          return (
            <button
              key={dateKey}
              type="button"
              aria-label={dateKey}
              aria-pressed={isSelected}
              disabled={isPast || !isAvailable}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                'relative h-9 rounded-md text-sm transition-colors',
                isSelected && 'bg-primary text-primary-foreground',
                !isSelected && isAvailable && !isPast && 'hover:bg-accent',
                (isPast || !isAvailable) && 'text-muted-foreground opacity-50',
              )}
            >
              {date.getDate()}
              {isAvailable && (
                <span
                  className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}