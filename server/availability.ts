// Правила доступности организатора.
// До появления таблиц hosts/availability_rules правила живут в коде и заданы в UTC.
export interface AvailabilityRules {
  // Дни недели по JS: 0 — воскресенье, 1 — понедельник, … 6 — суббота
  weekdays: number[]
  windowStartHour: number
  windowEndHour: number
  slotDurationMin: number
  bufferMin: number
  minNoticeMin: number
  horizonDays: number
}

export const defaultAvailabilityRules: AvailabilityRules = {
  weekdays: [1, 2, 3, 4, 5],
  windowStartHour: 10,
  windowEndHour: 18,
  slotDurationMin: 30,
  bufferMin: 10,
  minNoticeMin: 120,
  horizonDays: 14,
}

// Строка таблицы availability_rules: weekdays хранятся как JSON-массив
export interface AvailabilityRulesRow {
  weekdays: string
  windowStartHour: number
  windowEndHour: number
  slotDurationMin: number
  bufferMin: number
  minNoticeMin: number
  horizonDays: number
}

function parseWeekdays(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (day): day is number => Number.isInteger(day) && day >= 0 && day <= 6,
      )
    }
  } catch {
    // повреждённое значение — вернём пустой список, вызывающий код отбросит правило
  }

  return []
}

export function rulesFromRow(row: AvailabilityRulesRow): AvailabilityRules {
  return {
    weekdays: parseWeekdays(row.weekdays),
    windowStartHour: row.windowStartHour,
    windowEndHour: row.windowEndHour,
    slotDurationMin: row.slotDurationMin,
    bufferMin: row.bufferMin,
    minNoticeMin: row.minNoticeMin,
    horizonDays: row.horizonDays,
  }
}

export function rulesToRow(rules: AvailabilityRules): AvailabilityRulesRow {
  return {
    weekdays: JSON.stringify([...new Set(rules.weekdays)].sort((a, b) => a - b)),
    windowStartHour: rules.windowStartHour,
    windowEndHour: rules.windowEndHour,
    slotDurationMin: rules.slotDurationMin,
    bufferMin: rules.bufferMin,
    minNoticeMin: rules.minNoticeMin,
    horizonDays: rules.horizonDays,
  }
}

const MS_PER_MINUTE = 60 * 1000

// Генерирует ISO-времена начал слотов от now на горизонт вперёд.
// Слот попадает в результат, если он целиком укладывается в рабочее окно,
// начинается не раньше now + minNotice и день входит в рабочие дни.
export function generateSlotStarts(
  now: Date,
  rules: AvailabilityRules = defaultAvailabilityRules,
): string[] {
  const starts: string[] = []
  const earliest = now.getTime() + rules.minNoticeMin * MS_PER_MINUTE
  const stepMin = rules.slotDurationMin + rules.bufferMin
  const windowEndMin = rules.windowEndHour * 60

  for (let dayOffset = 0; dayOffset < rules.horizonDays; dayOffset += 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset),
    )

    if (!rules.weekdays.includes(day.getUTCDay())) {
      continue
    }

    for (
      let minute = rules.windowStartHour * 60;
      minute + rules.slotDurationMin <= windowEndMin;
      minute += stepMin
    ) {
      const startAt = Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        0,
        minute,
      )

      if (startAt < earliest) {
        continue
      }

      starts.push(new Date(startAt).toISOString())
    }
  }

  return starts
}

// ── v1: диапазоны по дням недели (ADR-0011) ──────────────────────────────

// День недели: 1 — понедельник … 7 — воскресенье; минуты от полуночи (пояс хоста)
export interface AvailabilityRange {
  weekday: number
  startMinute: number
  endMinute: number
}

export interface AvailabilitySettings {
  timeZone: string
  slotDurationMin: number
  bufferMin: number
  minNoticeMin: number
  horizonDays: number
  ranges: AvailabilityRange[]
}

const jsDayToIso = (jsDay: number): number => (jsDay === 0 ? 7 : jsDay)

// Преобразует одно окно из легаси-правил в набор диапазонов (по дню недели)
export function rangesFromRules(rules: AvailabilityRules): AvailabilityRange[] {
  return rules.weekdays
    .map((jsDay) => ({
      weekday: jsDayToIso(jsDay),
      startMinute: rules.windowStartHour * 60,
      endMinute: rules.windowEndHour * 60,
    }))
    .sort((a, b) => a.weekday - b.weekday)
}

// Обратное преобразование: диапазоны → рабочие дни и окно для легаси-схемы
export function windowFromRanges(
  ranges: AvailabilityRange[],
  fallback: AvailabilityRules = defaultAvailabilityRules,
): Pick<AvailabilityRules, 'weekdays' | 'windowStartHour' | 'windowEndHour'> {
  if (ranges.length === 0) {
    return {
      weekdays: fallback.weekdays,
      windowStartHour: fallback.windowStartHour,
      windowEndHour: fallback.windowEndHour,
    }
  }

  const weekdays = [...new Set(ranges.map((range) => range.weekday % 7))].sort((a, b) => a - b)
  const startMinute = Math.min(...ranges.map((range) => range.startMinute))
  const endMinute = Math.max(...ranges.map((range) => range.endMinute))

  return {
    weekdays,
    windowStartHour: Math.floor(startMinute / 60),
    windowEndHour: Math.ceil(endMinute / 60),
  }
}

export function defaultAvailabilitySettings(timeZone: string): AvailabilitySettings {
  return {
    timeZone,
    slotDurationMin: defaultAvailabilityRules.slotDurationMin,
    bufferMin: defaultAvailabilityRules.bufferMin,
    minNoticeMin: defaultAvailabilityRules.minNoticeMin,
    horizonDays: defaultAvailabilityRules.horizonDays,
    ranges: rangesFromRules(defaultAvailabilityRules),
  }
}

// Генерирует ISO-времена начал слотов по диапазонам дней недели.
export function generateSlotStartsFromRanges(now: Date, settings: AvailabilitySettings): string[] {
  const starts: string[] = []
  const earliest = now.getTime() + settings.minNoticeMin * MS_PER_MINUTE
  const stepMin = settings.slotDurationMin + settings.bufferMin

  for (let dayOffset = 0; dayOffset < settings.horizonDays; dayOffset += 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset),
    )
    const weekday = jsDayToIso(day.getUTCDay())
    const ranges = settings.ranges
      .filter((range) => range.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute)

    for (const range of ranges) {
      for (
        let minute = range.startMinute;
        minute + settings.slotDurationMin <= range.endMinute;
        minute += stepMin
      ) {
        const startAt = Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          0,
          minute,
        )

        if (startAt < earliest) {
          continue
        }

        starts.push(new Date(startAt).toISOString())
      }
    }
  }

  return starts
}