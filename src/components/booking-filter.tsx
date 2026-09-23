import { cn } from '@/lib/utils'

export type BookingFilterValue = 'all' | 'week' | 'today'

interface BookingFilterProps {
  value: BookingFilterValue
  onChange: (value: BookingFilterValue) => void
}

const options: Array<{ value: BookingFilterValue; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'week', label: 'Неделя' },
  { value: 'today', label: 'Сегодня' },
]

export function BookingFilter({ value, onChange }: BookingFilterProps) {
  return (
    <div role="tablist" aria-label="Период" className="inline-flex rounded-lg bg-secondary p-0.5">
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 rounded-md px-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive ? 'bg-segment-active font-semibold text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
