import { describe, expect, it } from 'vitest'

import {
  defaultAvailabilityRules,
  generateSlotStarts,
  generateSlotStartsFromRanges,
  type AvailabilitySettings,
} from './availability'

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

describe('generateSlotStartsFromRanges: пояс хоста', () => {
  const mondayRanges = [{ weekday: 1, startMinute: 600, endMinute: 660 }]

  const settings = (timeZone: string): AvailabilitySettings => ({
    timeZone,
    slotDurationMin: 40,
    bufferBeforeMin: 0,
    bufferAfterMin: 0,
    minNoticeMin: 0,
    horizonDays: 1,
    ranges: mondayRanges,
  })

  it('в UTC 10:00 локального пояса — это 10:00Z', () => {
    // 2026-09-28 — понедельник
    const starts = generateSlotStartsFromRanges(new Date('2026-09-28T00:00:00.000Z'), settings('UTC'))

    expect(starts).toEqual(['2026-09-28T10:00:00.000Z'])
  })

  it('в Europe/Moscow 10:00 — это 07:00Z', () => {
    const starts = generateSlotStartsFromRanges(
      new Date('2026-09-27T21:00:00.000Z'),
      settings('Europe/Moscow'),
    )

    expect(starts).toEqual(['2026-09-28T07:00:00.000Z'])
  })

  it('день недели считается в поясе хоста', () => {
    // 2026-09-27T22:00Z — это уже понедельник в Москве (01:00 28-го)
    const starts = generateSlotStartsFromRanges(
      new Date('2026-09-27T22:00:00.000Z'),
      settings('Europe/Moscow'),
    )

    expect(starts[0]).toBe('2026-09-28T07:00:00.000Z')
  })

  it('переход на летнее время в Europe/Berlin не даёт дублей и пропусков', () => {
    // 2026-03-29 — переход на летнее время; 02:00–03:00 локального времени не существует.
    const berlin = {
      ...settings('Europe/Berlin'),
      slotDurationMin: 60,
      ranges: [{ weekday: 7, startMinute: 60, endMinute: 300 }],
    }
    const starts = generateSlotStartsFromRanges(new Date('2026-03-29T00:00:00.000Z'), berlin)

    expect(new Set(starts).size).toBe(starts.length)
    expect(starts).toContain('2026-03-29T00:00:00.000Z') // 01:00 CET
    expect(starts.every((startAt) => startAt.endsWith('Z'))).toBe(true)
  })
})