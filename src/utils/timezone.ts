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

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// День календаря не зависит от пояса: собираем дату из ключа и форматируем в UTC
export function formatDayTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Короткий заголовок дня для мобильной панели: «Чт, 24 сентября»
export function formatDayShortTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Дата для диалога брони с годом: «Чт, 24 сентября 2026»
export function formatDialogDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const raw = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  const withoutYearSuffix = raw.replace(/\s*г\.?$/, '')
  return withoutYearSuffix.charAt(0).toUpperCase() + withoutYearSuffix.slice(1)
}

export function formatTimeRange(
  slot: { startAt: string; durationMin: number },
  timeZone: string,
): string {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60_000)

  return `${formatTimeInZone(start.toISOString(), timeZone)} – ${formatTimeInZone(end.toISOString(), timeZone)}`
}

export function timeZoneOptionLabel(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value

  return offset ? `${timeZone} (${offset})` : timeZone
}