import { Label } from '@/components/ui/label'
import { timeZoneOptionLabel, timeZoneOptions } from '@/utils/timezone'

interface TimeZoneSelectProps {
  value: string
  onChange: (timeZone: string) => void
}

export function TimeZoneSelect({ value, onChange }: TimeZoneSelectProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="timezone">Часовой пояс</Label>
      <select
        id="timezone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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