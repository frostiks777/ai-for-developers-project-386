// Правила доступности организатора — зеркало server/availability.ts
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
