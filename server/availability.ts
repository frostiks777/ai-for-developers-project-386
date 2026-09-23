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