import type { AvailabilitySettings } from '@/types/availability-settings'
import type { TimeSlot } from '@/types/booking'
import { weekdayAndMinuteInZone } from '@/utils/timezone'

interface AvailabilityPreviewProps {
  settings: AvailabilitySettings
  slots?: TimeSlot[]
}

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
]

const minuteToLabel = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`

// «Неделя глазами гостя»: сетка Пн–Пт × времена начал по черновику правил.
// Часы показаны в поясе правил (settings.timeZone). Если переданы слоты,
// занятые окна (isBooked) помечаются как встречи.
export function AvailabilityPreview({ settings, slots = [] }: AvailabilityPreviewProps) {
  const step =
    settings.slotDurationMin + settings.bufferBeforeMin + settings.bufferAfterMin

  const times = new Set<string>()

  for (const range of settings.ranges) {
    for (
      let minute = range.startMinute;
      minute + settings.slotDurationMin <= range.endMinute;
      minute += step
    ) {
      times.add(minuteToLabel(minute))
    }
  }

  const timeLabels = Array.from(times).sort()

  if (timeLabels.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных для превью</p>
  }

  const meetings = new Set<string>()

  for (const slot of slots) {
    if (!slot.isBooked) {
      continue
    }

    const { weekday, minute } = weekdayAndMinuteInZone(slot.startAt, settings.timeZone)
    meetings.add(`${weekday}:${minuteToLabel(minute)}`)
  }

  const hasFree = (weekday: number, timeLabel: string): boolean =>
    settings.ranges.some((range) => {
      const [hours, minutes] = timeLabel.split(':').map(Number)
      const minute = hours * 60 + minutes

      return (
        range.weekday === weekday &&
        minute >= range.startMinute &&
        minute + settings.slotDurationMin <= range.endMinute
      )
    })

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-[12px]">
        <thead>
          <tr>
            <th />
            {WEEKDAYS.map((day) => (
              <th key={day.value} className="px-1 text-muted-foreground">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((timeLabel) => (
            <tr key={timeLabel}>
              <td className="pr-1 text-right tabular-nums text-muted-foreground">{timeLabel}</td>
              {WEEKDAYS.map((day) => {
                const key = `${day.value}:${timeLabel}`
                const state = meetings.has(key)
                  ? 'meeting'
                  : hasFree(day.value, timeLabel)
                    ? 'free'
                    : 'off'

                return (
                  <td
                    key={key}
                    data-state={state}
                    className={
                      state === 'meeting'
                        ? 'size-4 rounded-[3px] bg-primary'
                        : state === 'free'
                          ? 'size-4 rounded-[3px] bg-accent'
                          : 'size-4 rounded-[3px] bg-secondary/40'
                    }
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
