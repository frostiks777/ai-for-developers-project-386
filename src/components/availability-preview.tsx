import { useMemo } from 'react'

import type { TimeSlot } from '@/types/booking'
import { defaultTimeZone, formatTimeInZone } from '@/utils/timezone'

interface AvailabilityPreviewProps {
  slots: TimeSlot[]
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']

// «Неделя глазами гостя»: тепловая сетка Пн–Пт × времена начала
export function AvailabilityPreview({ slots }: AvailabilityPreviewProps) {
  const { days, times, freeSet } = useMemo(() => {
    const daySet = new Set<string>()
    const timeSet = new Set<string>()
    const free = new Set<string>()

    for (const slot of slots) {
      const date = new Date(slot.startAt)
      const weekday = new Intl.DateTimeFormat('ru-RU', {
        timeZone: defaultTimeZone,
        weekday: 'short',
      }).format(date)
      const label = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace('.', '')

      if (!WEEKDAYS.includes(label)) {
        continue
      }

      const time = formatTimeInZone(slot.startAt, defaultTimeZone)
      daySet.add(label)
      timeSet.add(time)

      if (!slot.isBooked) {
        free.add(`${label}:${time}`)
      }
    }

    return {
      days: WEEKDAYS.filter((day) => daySet.has(day)),
      times: Array.from(timeSet).sort().slice(0, 20),
      freeSet: free,
    }
  }, [slots])

  if (days.length === 0 || times.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных для превью</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-[12px]">
        <thead>
          <tr>
            <th />
            {days.map((day) => (
              <th key={day} className="px-1 text-muted-foreground">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td className="pr-1 text-right tabular-nums text-muted-foreground">{time}</td>
              {days.map((day) => (
                <td
                  key={`${day}:${time}`}
                  className={
                    freeSet.has(`${day}:${time}`)
                      ? 'size-4 rounded-[3px] bg-accent'
                      : 'size-4 rounded-[3px] bg-secondary/40'
                  }
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
