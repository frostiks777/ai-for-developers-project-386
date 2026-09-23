import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { availabilityRulesSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { AvailabilityRules } from '@/types/availability'
import { defaultTimeZone } from '@/utils/timezone'
import { pluralRu } from '@/utils/plural'

interface AvailabilityFormProps {
  rules: AvailabilityRules
  isSaving: boolean
  onSave: (rules: AvailabilityRules) => Promise<boolean>
}

const weekdayOptions = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
]

const durationOptions = [15, 30, 45, 60]

interface FormState {
  weekdays: number[]
  windowStartHour: string
  windowEndHour: string
  slotDurationMin: string
  bufferMin: string
  minNoticeMin: string
  horizonDays: string
}

function toFormState(rules: AvailabilityRules): FormState {
  return {
    weekdays: rules.weekdays,
    windowStartHour: String(rules.windowStartHour),
    windowEndHour: String(rules.windowEndHour),
    slotDurationMin: String(rules.slotDurationMin),
    bufferMin: String(rules.bufferMin),
    minNoticeMin: String(rules.minNoticeMin),
    horizonDays: String(rules.horizonDays),
  }
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function utcHourToLocalLabel(hour: number, timeZone: string): string {
  const date = new Date(Date.UTC(2026, 0, 1, hour, 0, 0))

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function estimateSlotsPerDay(
  windowStartHour: number,
  windowEndHour: number,
  slotDurationMin: number,
  bufferMin: number,
): number {
  if (
    !Number.isFinite(windowStartHour) ||
    !Number.isFinite(windowEndHour) ||
    !Number.isFinite(slotDurationMin) ||
    !Number.isFinite(bufferMin) ||
    windowEndHour <= windowStartHour ||
    slotDurationMin <= 0
  ) {
    return 0
  }

  return Math.max(
    0,
    Math.floor(
      ((windowEndHour - windowStartHour) * 60 - slotDurationMin) / (slotDurationMin + bufferMin),
    ) + 1,
  )
}

export function AvailabilityForm({ rules, isSaving, onSave }: AvailabilityFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(rules))

  useEffect(() => {
    setForm(toFormState(rules))
  }, [rules])

  const candidate: AvailabilityRules = {
    weekdays: form.weekdays,
    windowStartHour: Number(form.windowStartHour),
    windowEndHour: Number(form.windowEndHour),
    slotDurationMin: Number(form.slotDurationMin),
    bufferMin: Number(form.bufferMin),
    minNoticeMin: Number(form.minNoticeMin),
    horizonDays: Number(form.horizonDays),
  }

  const parsed = availabilityRulesSchema.safeParse(candidate)
  const errorMessage = parsed.success ? null : (parsed.error.issues[0]?.message ?? 'Проверьте поля')

  const toggleWeekday = (value: number, checked: boolean) => {
    setForm((current) => ({
      ...current,
      weekdays: checked
        ? [...current.weekdays, value]
        : current.weekdays.filter((day) => day !== value),
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!parsed.success) {
      return
    }

    await onSave(parsed.data)
  }

  const currentDuration = Number(form.slotDurationMin)
  const visibleDurations =
    Number.isFinite(currentDuration) && !durationOptions.includes(currentDuration)
      ? [...durationOptions, currentDuration]
      : durationOptions

  const startHourNum = Number(form.windowStartHour)
  const endHourNum = Number(form.windowEndHour)
  const localHint =
    Number.isFinite(startHourNum) && Number.isFinite(endHourNum)
      ? `= ${utcHourToLocalLabel(startHourNum, defaultTimeZone)}–${utcHourToLocalLabel(endHourNum, defaultTimeZone)} по ${defaultTimeZone}`
      : null

  const slotsPerDay = estimateSlotsPerDay(
    Number(form.windowStartHour),
    Number(form.windowEndHour),
    Number(form.slotDurationMin),
    Number(form.bufferMin),
  )
  const slotsHint = `≈ ${slotsPerDay} ${pluralRu(slotsPerDay, ['слот', 'слота', 'слотов'])} в рабочий день`

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <fieldset className="grid gap-2">
        <legend className="pb-1 text-[13px] font-medium text-muted-foreground">
          Рабочие дни
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {weekdayOptions.map((option) => {
            const checked = form.weekdays.includes(option.value)

            return (
              <label
                key={option.value}
                className={cn(
                  'flex size-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                  checked
                    ? 'border border-primary bg-primary text-primary-foreground'
                    : 'border border-input text-muted-foreground',
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(event) => toggleWeekday(option.value, event.target.checked)}
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-muted-foreground">
          Рабочее окно (UTC)
        </span>
        <div className="flex items-center gap-2">
          <Label htmlFor="rules-window-start" className="sr-only">
            Начало окна
          </Label>
          <select
            id="rules-window-start"
            aria-label="Начало окна"
            value={form.windowStartHour}
            onChange={(event) =>
              setForm((current) => ({ ...current, windowStartHour: event.target.value }))
            }
            className="h-11 min-h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={String(hour)}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="text-muted-foreground">
            —
          </span>
          <Label htmlFor="rules-window-end" className="sr-only">
            Конец окна
          </Label>
          <select
            id="rules-window-end"
            aria-label="Конец окна"
            value={form.windowEndHour}
            onChange={(event) =>
              setForm((current) => ({ ...current, windowEndHour: event.target.value }))
            }
            className="h-11 min-h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
              <option key={hour} value={String(hour)}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </select>
        </div>
        {localHint && <span className="text-xs text-muted-foreground">{localHint}</span>}
      </div>

      <div className="grid gap-1.5">
        <span id="slot-duration-label" className="text-[13px] font-medium text-muted-foreground">
          Длительность встречи, мин
        </span>
        <div
          role="radiogroup"
          aria-label="Длительность встречи, мин"
          className="grid grid-cols-4 gap-1 rounded-lg bg-secondary p-0.5"
        >
          {visibleDurations.map((duration) => {
            const checked = currentDuration === duration

            return (
              <label
                key={duration}
                className={cn(
                  'flex h-11 min-h-11 cursor-pointer items-center justify-center rounded-md px-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
                  checked
                    ? 'bg-segment-active font-semibold text-primary shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <input
                  type="radio"
                  name="slot-duration"
                  value={String(duration)}
                  checked={checked}
                  onChange={() =>
                    setForm((current) => ({ ...current, slotDurationMin: String(duration) }))
                  }
                  className="sr-only"
                />
                {duration}
              </label>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="rules-buffer" className="text-[13px] font-medium text-muted-foreground">
            Буфер
          </Label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
            <input
              id="rules-buffer"
              type="number"
              min={0}
              max={480}
              value={form.bufferMin}
              onChange={(event) =>
                setForm((current) => ({ ...current, bufferMin: event.target.value }))
              }
              className="w-full border-0 bg-transparent text-[15px] focus-visible:outline-none"
            />
            <span className="shrink-0 text-[13px] text-muted-foreground">мин</span>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rules-min-notice" className="text-[13px] font-medium text-muted-foreground">
            Не позже чем за
          </Label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
            <input
              id="rules-min-notice"
              type="number"
              min={0}
              max={10080}
              value={form.minNoticeMin}
              onChange={(event) =>
                setForm((current) => ({ ...current, minNoticeMin: event.target.value }))
              }
              className="w-full border-0 bg-transparent text-[15px] focus-visible:outline-none"
            />
            <span className="shrink-0 text-[13px] text-muted-foreground">мин</span>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rules-horizon" className="text-[13px] font-medium text-muted-foreground">
            Открыто на
          </Label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3">
            <input
              id="rules-horizon"
              type="number"
              min={1}
              max={90}
              value={form.horizonDays}
              onChange={(event) =>
                setForm((current) => ({ ...current, horizonDays: event.target.value }))
              }
              className="w-full border-0 bg-transparent text-[15px] focus-visible:outline-none"
            />
            <span className="shrink-0 text-[13px] text-muted-foreground">дней</span>
          </div>
        </div>
      </div>

      <p className="rounded-lg bg-accent px-3 py-2.5 text-[13px] text-accent-foreground">
        {slotsHint}
      </p>

      {errorMessage && <p className="text-[13px] text-destructive">{errorMessage}</p>}

      <div>
        <Button type="submit" disabled={!parsed.success || isSaving} className="h-[46px] w-full">
          {isSaving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}
