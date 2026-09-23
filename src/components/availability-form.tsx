import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { availabilityRulesSchema } from '@/lib/validation'
import type { AvailabilityRules } from '@/types/availability'

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

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Рабочие дни</legend>
        <div className="flex flex-wrap gap-4">
          {weekdayOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                checked={form.weekdays.includes(option.value)}
                onChange={(event) => toggleWeekday(option.value, event.target.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rules-window-start">Начало окна (UTC, ч)</Label>
          <Input
            id="rules-window-start"
            type="number"
            min={0}
            max={23}
            value={form.windowStartHour}
            onChange={(event) =>
              setForm((current) => ({ ...current, windowStartHour: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rules-window-end">Конец окна (UTC, ч)</Label>
          <Input
            id="rules-window-end"
            type="number"
            min={1}
            max={24}
            value={form.windowEndHour}
            onChange={(event) =>
              setForm((current) => ({ ...current, windowEndHour: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rules-slot-duration">Длительность слота (мин)</Label>
          <Input
            id="rules-slot-duration"
            type="number"
            min={5}
            max={480}
            value={form.slotDurationMin}
            onChange={(event) =>
              setForm((current) => ({ ...current, slotDurationMin: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rules-buffer">Буфер между слотами (мин)</Label>
          <Input
            id="rules-buffer"
            type="number"
            min={0}
            max={480}
            value={form.bufferMin}
            onChange={(event) =>
              setForm((current) => ({ ...current, bufferMin: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rules-min-notice">Предупреждение (мин)</Label>
          <Input
            id="rules-min-notice"
            type="number"
            min={0}
            max={10080}
            value={form.minNoticeMin}
            onChange={(event) =>
              setForm((current) => ({ ...current, minNoticeMin: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rules-horizon">Горизонт генерации (дней)</Label>
          <Input
            id="rules-horizon"
            type="number"
            min={1}
            max={90}
            value={form.horizonDays}
            onChange={(event) =>
              setForm((current) => ({ ...current, horizonDays: event.target.value }))
            }
          />
        </div>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div>
        <Button type="submit" disabled={!parsed.success || isSaving}>
          {isSaving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}
