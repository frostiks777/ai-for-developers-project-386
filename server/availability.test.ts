import { describe, expect, it } from 'vitest'

import { defaultAvailabilityRules, generateSlotStarts } from './availability'

const now = new Date('2026-09-23T06:00:00.000Z')

describe('generateSlotStarts', () => {
  it('генерирует слоты по окну с шагом «длительность + буфер»', () => {
    const starts = generateSlotStarts(now, defaultAvailabilityRules)
    const firstDay = starts.filter((startAt) => startAt.startsWith('2026-09-23'))

    expect(firstDay[0]).toBe('2026-09-23T10:00:00.000Z')
    expect(firstDay[1]).toBe('2026-09-23T10:40:00.000Z')
    expect(firstDay.at(-1)).toBe('2026-09-23T17:20:00.000Z')
  })

  it('не генерирует выходные дни', () => {
    const starts = generateSlotStarts(now, defaultAvailabilityRules)

    expect(starts.some((startAt) => startAt.startsWith('2026-09-26'))).toBe(false)
    expect(starts.some((startAt) => startAt.startsWith('2026-09-27'))).toBe(false)
  })

  it('не выходит за горизонт', () => {
    const starts = generateSlotStarts(now, defaultAvailabilityRules)

    expect(starts.some((startAt) => startAt.startsWith('2026-10-06'))).toBe(true)
    expect(starts.some((startAt) => startAt.startsWith('2026-10-07'))).toBe(false)
  })

  it('исключает слоты в пределах minNotice', () => {
    const starts = generateSlotStarts(new Date('2026-09-23T09:00:00.000Z'), defaultAvailabilityRules)

    expect(starts[0]).toBe('2026-09-23T11:20:00.000Z')
  })

  it('учитывает bufferBefore при расчёте шага', () => {
    const rules = { ...defaultAvailabilityRules, bufferBeforeMin: 10, bufferAfterMin: 10 }
    const starts = generateSlotStarts(now, rules).filter((startAt) =>
      startAt.startsWith('2026-09-23'),
    )

    expect(starts[1]).toBe('2026-09-23T10:50:00.000Z')
  })
})