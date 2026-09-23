const fallbackTimeZones = [
  'UTC',
  'Europe/Moscow',
  'Europe/Berlin',
  'Asia/Almaty',
  'Asia/Tbilisi',
  'America/New_York',
]

export const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export const timeZoneOptions = Array.from(new Set([defaultTimeZone, ...fallbackTimeZones]))

export function toDateKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function timeZoneOptionLabel(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value

  return offset ? `${timeZone} (${offset})` : timeZone
}