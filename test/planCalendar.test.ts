import { describe, it, expect } from 'vitest'
import { appendStartingOn, calendarWeeks, insertOffBefore, weeksCovered } from '../src/lib/planCalendar'

const gm = () => ({ protocolId: 'gm', weeks: 3 })
const bridge = () => ({ protocolId: 'bridge', weeks: 1 })

describe('plan calendar', () => {
  it('maps sequential blocks onto Mondays', () => {
    const cells = calendarWeeks('2026-08-17', [gm(), bridge()], 5)
    expect(cells[0]).toMatchObject({ protocolId: 'gm', blockStart: true, monday: '2026-08-17' })
    expect(cells[3]).toMatchObject({ protocolId: 'bridge', blockStart: true, monday: '2026-09-07' })
    expect(cells[4].protocolId).toBeNull()
  })

  it('inserts time off before a block so later dates shift', () => {
    const next = insertOffBefore([gm(), gm()], 1, 2)
    expect(next.map((b) => b.protocolId)).toEqual(['gm', 'off', 'gm'])
    expect(weeksCovered(next)).toBe(8)
  })

  it('fills the gap with time off when placing a block on a later Monday', () => {
    const next = appendStartingOn([gm()], '2026-08-17', '2026-09-14', bridge())
    expect(next).toEqual([gm(), { protocolId: 'off', weeks: 1 }, bridge()])
  })
})
