import { describe, expect, it } from 'vitest'
import { isNewThisMonth } from '../app/utils/isNewThisMonth.ts'

describe('isNewThisMonth', () => {
  it('is true when the premiere falls in the page month', () => {
    expect(isNewThisMonth('2026-10-03', '2026-10')).toBe(true)
  })

  it('accepts a longer ISO timestamp', () => {
    expect(isNewThisMonth('2026-10-03T00:00:00.000Z', '2026-10')).toBe(true)
  })

  it('is false for another month (Gentlemen premiered 2024-03)', () => {
    expect(isNewThisMonth('2024-03-07', '2026-10')).toBe(false)
    expect(isNewThisMonth('2026-09-30', '2026-10')).toBe(false)
  })

  it('is false when firstAirDate is null or undefined', () => {
    expect(isNewThisMonth(null, '2026-10')).toBe(false)
    expect(isNewThisMonth(undefined, '2026-10')).toBe(false)
  })

  it('is false for non-string dates instead of coercing them', () => {
    expect(isNewThisMonth(new Date('2026-10-03'), '2026-10')).toBe(false)
    expect(isNewThisMonth(202610, '2026-10')).toBe(false)
  })

  it('is false for a missing or malformed month slug', () => {
    expect(isNewThisMonth('2026-10-03', undefined)).toBe(false)
    expect(isNewThisMonth('2026-10-03', null)).toBe(false)
    expect(isNewThisMonth('2026-10-03', '')).toBe(false)
    expect(isNewThisMonth('2026-10-03', '2026-1')).toBe(false)
    expect(isNewThisMonth('2026-10-03', '2026-10-03')).toBe(false)
    expect(isNewThisMonth('2026-10', 'october')).toBe(false)
  })
})
