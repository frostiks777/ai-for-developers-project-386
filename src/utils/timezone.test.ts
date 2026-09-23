import { describe, expect, it } from 'vitest'

import { formatDateTimeInZone, toDateKeyInZone } from './timezone'

describe('toDateKeyInZone', () => {
  it('возвращает дату в UTC', () => {
    expect(toDateKeyInZone(new Date('2026-09-23T22:00:00.000Z'), 'UTC')).toBe('2026-09-23')
  })

  it('учитывает сдвиг часового пояса', () => {
    expect(toDateKeyInZone(new Date('2026-09-23T22:00:00.000Z'), 'Europe/Moscow')).toBe(
      '2026-09-24',
    )
  })
})

describe('formatDateTimeInZone', () => {
  it('показывает время в выбранном поясе', () => {
    expect(formatDateTimeInZone('2026-09-24T07:00:00.000Z', 'UTC')).toContain('07:00')
  })

  it('пересчитывает время при другом поясе', () => {
    expect(formatDateTimeInZone('2026-09-24T07:00:00.000Z', 'Europe/Moscow')).toContain('10:00')
  })
})