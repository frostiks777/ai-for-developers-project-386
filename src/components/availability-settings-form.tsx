import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AvailabilityRange, AvailabilitySettings } from '@/types/availability-settings'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
]

const DEFAULT_INTERVAL: AvailabilityRange = { weekday: 0, startMinute: 600, endMinute: 1080 }

const minuteToTime = (minute: number): string =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`

const timeToMinute = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

interface AvailabilitySettingsFormProps {
  settings: AvailabilitySettings
  isSaving: boolean
  onSave: (settings: AvailabilitySettings) => Promise<boolean>
}

export function AvailabilitySettingsForm({
  settings,
  isSaving,
  onSave,
}: AvailabilitySettingsFormProps) {
  const [draft, setDraft] = useState<AvailabilitySettings>(settings)

  const rangesFor = (weekday: number) =>
    draft.ranges
      .filter((range) => range.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)

  const toggleDay = (weekday: number) => {
    setDraft((prev) => {
      const hasDay = prev.ranges.some((range) => range.weekday === weekday)

      return {
        ...prev,
        ranges: hasDay
          ? prev.ranges.filter((range) => range.weekday !== weekday)
          : [...prev.ranges, { ...DEFAULT_INTERVAL, weekday }],
      }
    })
  }

  const addInterval = (weekday: number) => {
    setDraft((prev) => ({
      ...prev,
      ranges: [...prev.ranges, { ...DEFAULT_INTERVAL, weekday }],
    }))
  }

  const updateInterval = (weekday: number, position: number, patch: Partial<AvailabilityRange>) => {
    setDraft((prev) => {
      let seen = -1

      return {
        ...prev,
        ranges: prev.ranges.map((range) => {
          if (range.weekday !== weekday) {
            return range
          }

          seen += 1
          return seen === position ? { ...range, ...patch } : range
        }),
      }
    })
  }

  const removeInterval = (weekday: number, position: number) => {
    setDraft((prev) => {
      let seen = -1

      return {
        ...prev,
        ranges: prev.ranges.filter((range) => {
          if (range.weekday !== weekday) {
            return true
          }

          seen += 1
          return seen !== position
        }),
      }
    })
  }

  const hasAnyDay = draft.ranges.length > 0

  const firstRange = [...draft.ranges].sort(
    (a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute,
  )[0]
  const slotsPerDay = firstRange
    ? Math.max(
        0,
        Math.floor(
          (firstRange.endMinute - firstRange.startMinute) /
            (draft.slotDurationMin + draft.bufferMin),
        ),
      )
    : 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!hasAnyDay) {
      return
    }

    await onSave(draft)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {WEEKDAYS.map(({ value, label }) => {
          const ranges = rangesFor(value)
          const isEnabled = ranges.length > 0

          return (
            <div key={value} className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleDay(value)}
                  className="size-4 rounded border-input"
                />
                {label}
              </label>

              {ranges.map((range, position) => (
                <div key={position} className="ml-6 flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${label}: начало ${position + 1}`}
                    value={minuteToTime(range.startMinute)}
                    onChange={(event) =>
                      updateInterval(value, position, {
                        startMinute: timeToMinute(event.target.value),
                      })
                    }
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    type="time"
                    aria-label={`${label}: конец ${position + 1}`}
                    value={minuteToTime(range.endMinute)}
                    onChange={(event) =>
                      updateInterval(value, position, {
                        endMinute: timeToMinute(event.target.value),
                      })
                    }
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInterval(value, position)}
                  >
                    Убрать
                  </Button>
                </div>
              ))}

              {isEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-6 self-start"
                  onClick={() => addInterval(value)}
                >
                  Добавить интервал
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="slot-duration">Слот, мин</Label>
          <Input
            id="slot-duration"
            type="number"
            min={5}
            max={480}
            value={draft.slotDurationMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, slotDurationMin: Number(event.target.value) }))
            }
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="buffer-min">Буфер, мин</Label>
          <Input
            id="buffer-min"
            type="number"
            min={0}
            max={480}
            value={draft.bufferMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, bufferMin: Number(event.target.value) }))
            }
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="min-notice">Не позже чем за, мин</Label>
          <Input
            id="min-notice"
            type="number"
            min={0}
            max={10080}
            value={draft.minNoticeMin}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, minNoticeMin: Number(event.target.value) }))
            }
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="horizon-days">Открыто на, дней</Label>
          <Input
            id="horizon-days"
            type="number"
            min={1}
            max={90}
            value={draft.horizonDays}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, horizonDays: Number(event.target.value) }))
            }
          />
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">
        ≈ {slotsPerDay} слотов в рабочий день
      </p>

      {!hasAnyDay && <p className="text-destructive">Выберите хотя бы один рабочий день</p>}

      <Button type="submit" disabled={isSaving || !hasAnyDay}>
        Сохранить
      </Button>
    </form>
  )
}
