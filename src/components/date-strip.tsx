import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/booking'
import { parseDateKey } from '@/utils/dates'
import { toDateKeyInZone } from '@/utils/timezone'

interface DateStripProps {
  slots: TimeSlot[]
  selectedDate: string
  timeZone: string
  onSelectDate: (dateKey: string) => void
}

export function DateStrip({ slots, selectedDate, timeZone, onSelectDate }: DateStripProps) {
  const dateKeys = Array.from(
    new Set(slots.map((slot) => toDateKeyInZone(new Date(slot.startAt), timeZone))),
  ).sort()
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [selectedDate])

  return (
    <div className="flex snap-x gap-2 overflow-x-auto pb-1">
      {dateKeys.map((dateKey) => {
        const isSelected = dateKey === selectedDate
        const weekday = new Intl.DateTimeFormat('ru-RU', {
          weekday: 'short',
          timeZone: 'UTC',
        }).format(parseDateKey(dateKey))
        const weekdayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1)

        return (
          <button
            key={dateKey}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            aria-label={dateKey}
            aria-pressed={isSelected}
            onClick={() => onSelectDate(dateKey)}
            className={cn(
              'flex h-[72px] w-16 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-accent',
            )}
          >
            <span className="text-xs font-semibold">{weekdayLabel}</span>
            <span className="text-[22px] font-bold leading-none">
              {parseDateKey(dateKey).getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
