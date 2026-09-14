import { describe, it, expect } from 'vitest'
import { addDays, diffDays, isoDate, parseISO } from '../src/lib/date'

describe('diffDays is calendar-date math (DST-safe)', () => {
  it('counts whole local calendar days, not elapsed hours', () => {
    const a = new Date(2026, 2, 28) // 28 Mar
    const b = new Date(2026, 2, 30) // 30 Mar
    expect(diffDays(b, a)).toBe(2)
    expect(diffDays(a, b)).toBe(-2)
  })

  it('stays ±1 across the UK spring-forward (2026-03-29)', () => {
    // BST starts 29 Mar 2026 at 01:00 — the 29th→30th local-midnight span is 23h.
    const sat = new Date(2026, 2, 28)
    const sun = new Date(2026, 2, 29)
    const mon = new Date(2026, 2, 30)
    expect(diffDays(sun, sat)).toBe(1)
    expect(diffDays(mon, sun)).toBe(1)
    expect(diffDays(mon, sat)).toBe(2)
  })

  it('stays ±1 across the UK fall-back (2026-10-25)', () => {
    const sat = new Date(2026, 9, 24)
    const sun = new Date(2026, 9, 25)
    const mon = new Date(2026, 9, 26)
    expect(diffDays(sun, sat)).toBe(1)
    expect(diffDays(mon, sun)).toBe(1)
  })

  it('isoDate / parseISO round-trip', () => {
    expect(isoDate(parseISO('2026-07-13'))).toBe('2026-07-13')
    expect(isoDate(addDays(parseISO('2026-07-13'), 7))).toBe('2026-07-20')
  })
})
