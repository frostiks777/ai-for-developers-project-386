import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { timeZoneOptionLabel, timeZoneOptions } from '@/utils/timezone'

interface TimeZoneSelectProps {
  value: string
  onChange: (timeZone: string) => void
  labelIcon?: ReactNode
  hideLabel?: boolean
  className?: string
}

export function TimeZoneSelect({
  value,
  onChange,
  labelIcon,
  hideLabel = false,
  className,
}: TimeZoneSelectProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor="timezone" className={cn('flex items-center gap-2', hideLabel && 'sr-only')}>
        {labelIcon}
        Часовой пояс
      </Label>
      <select
        id="timezone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {timeZoneOptions.map((timeZone) => (
          <option key={timeZone} value={timeZone}>
            {timeZoneOptionLabel(timeZone)}
          </option>
        ))}
      </select>
    </div>
  )
}
