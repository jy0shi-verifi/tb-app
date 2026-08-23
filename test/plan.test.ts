import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { resolvePosition, sessionFor, defaultPlan, planWeeks, PROTOCOLS } from '../src/program'
import {
  GREEN_SESSIONS,
  BLACK_SESSIONS,
  GREEN_PER_WEEK,
  BLACK_PER_WEEK,
  conditioningById,
} from '../src/protocols/conditioning'
import { conditioningDaysFor } from '../src/protocols/conditioningPlan'
import { DEFAULT_SETTINGS } from '../src/db'
import type { Settings } from '../src/types'

/** Monday 17 Aug 2026. */
const MON = new Date(2026, 7, 17)
const on = (offsetDays: number) => new Date(2026, 7, 17 + offsetDays)

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  currentPhaseId: 'gm',
  phaseStartDate: '2026-08-17',
  ...over,
})

const withPlan = (blocks: { protocolId: string; weeks: number }[], over: Partial<Settings> = {}) =>
  settings({ plan: { startDate: '2026-08-17', blocks }, ...over })

// ---------------------------------------------------------------------------

describe('block plans (MASS p.40, p.140)', () => {
  it('falls back to the single-phase behaviour when there is no plan', () => {
    const p = resolvePosition(settings(), on(8))
    expect(p).toMatchObject({ phaseId: 'gm', week: 2, day: 1, blockIndex: -1, blockCount: 0 })
  })

  it('walks the block sequence and reports which block you are in', () => {
    const s = withPlan([
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
      { protocolId: 'gm', weeks: 3 },
    ])
    expect(resolvePosition(s, MON)).toMatchObject({ phaseId: 'gm', week: 1, blockIndex: 0 })
    expect(resolvePosition(s, on(14))).toMatchObject({ phaseId: 'gm', week: 3, blockIndex: 0 })
    // Week 4 is the bridge week.
    expect(resolvePosition(s, on(21))).toMatchObject({ phaseId: 'bridge', week: 1, blockIndex: 1 })
    // Week 5 restarts Grey Man at week 1 of the next block.
    expect(resolvePosition(s, on(28))).toMatchObject({ phaseId: 'gm', week: 1, blockIndex: 2 })
  })

  it('restarts the A/B alternation at the top of every block', () => {
    const s = withPlan([
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
    ])
    // Both blocks open on A (liftingOrdinal 0), even though block 1 ended on A.
    expect(resolvePosition(s, MON).liftingOrdinal).toBe(0)
    expect(resolvePosition(s, on(21)).liftingOrdinal).toBe(0)
    expect(sessionFor('gm', 1, 0, s).title).toContain('Day A')
  })

  it('holds on the last day rather than falling over past the end', () => {
    const s = withPlan([{ protocolId: 'gm', weeks: 3 }])
    const p = resolvePosition(s, on(200))
    expect(p.status).toBe('complete')
    expect(p.phaseId).toBe('gm')
    expect(p.blockIndex).toBe(0)
  })

  it('reports "before" ahead of the start date', () => {
    expect(resolvePosition(withPlan([{ protocolId: 'gm', weeks: 3 }]), on(-7)).status).toBe('before')
  })

  it('the starter plan is 13 weeks of 3-week blocks plus one bridge', () => {
    const plan = defaultPlan('2026-08-17')
    expect(plan.blocks.map((b) => b.weeks)).toEqual([3, 3, 1, 3, 3])
    expect(planWeeks(plan.blocks)).toBe(13)
    // Every training block is 3 weeks — "Both General and Specificity consist of
    // 3-week blocks" (p.40). Only the bridge week is not.
    for (const b of plan.blocks) {
      if (b.protocolId !== 'bridge') expect(b.weeks).toBe(3)
    }
  })
})

describe('Bridge Week (pp.92–93)', () => {
  const s = withPlan([{ protocolId: 'bridge', weeks: 1 }])

  it('is one week and trains nothing', () => {
    expect(PROTOCOLS.bridge.blockWeeks).toBe(1)
    expect(PROTOCOLS.bridge.liftingDays).toEqual([])
    for (let d = 0; d <= 6; d++) expect(sessionFor('bridge', 1, d, s).type).toBe('rest')
  })

  it('offers test days on Day 4 and Day 5, and rests the others', () => {
    // "You can test 1RMs on Day 4, Day 5, or both… If no 1RM testing is required
    // than Test Days become Rest Days." (p.93)
    const titles = [0, 1, 2, 3, 4, 5, 6].map((d) => sessionFor('bridge', 1, d, s).title)
    expect(titles[3]).toContain('test day')
    expect(titles[4]).toContain('test day')
    expect([titles[0], titles[1], titles[2], titles[5], titles[6]]).toEqual([
      'Bridge — rest',
      'Bridge — rest',
      'Bridge — rest',
      'Bridge — rest',
      'Bridge — rest',
    ])
  })

  it('carries no conditioning — the book says avoid weights, HIC and E (p.93)', () => {
    expect(PROTOCOLS.bridge.conditioning).toBe('none')
  })
})

describe('conditioning (pp.98–99)', () => {
  it('has four Green and four Black sessions', () => {
    expect(GREEN_SESSIONS.map((s) => s.name)).toEqual([
      'Walk',
      'Ruck',
      'Recovery Run',
      'Endurance Predator',
    ])
    expect(BLACK_SESSIONS.map((s) => s.name)).toEqual([
      'Anabolic Sprints',
      'Reset-20',
      'Hill Sprints',
      'Fobbits',
    ])
  })

  it('carries the book’s weekly caps', () => {
    expect(GREEN_PER_WEEK).toEqual({ min: 1, max: 3 })
    expect(BLACK_PER_WEEK).toEqual({ min: 1, max: 2 })
  })

  it('reproduces the prescription cards verbatim', () => {
    expect(conditioningById('walk')!.card).toEqual(['Walk x 30-60 Minutes'])
    expect(conditioningById('reset-20')!.card).toEqual([
      'Sprint x 20 Seconds',
      'Rest 2-5 Minutes',
      'x 3-5 rounds',
    ])
    expect(conditioningById('fobbits')!.card).toEqual([
      'LSS x 2 Mins',
      'Kettlebell Swings x 10',
      'x 15-20 minutes',
    ])
  })

  it('pairs Green with General Mass and Black with Specificity (p.20)', () => {
    expect(PROTOCOLS.gm.conditioning).toBe('green')
    expect(GREEN_SESSIONS.every((s) => s.colour === 'green')).toBe(true)
    expect(BLACK_SESSIONS.every((s) => s.colour === 'black')).toBe(true)
  })

  it('fills Grey Man’s non-lifting days with a Green session', () => {
    const s = settings()
    const plan = sessionFor('gm', 1, 1, s) // Tuesday
    expect(plan.type).toBe('run')
    expect(plan.detail).toContain('Green conditioning')
  })

  it('never displaces a lifting day', () => {
    const s = settings({ mass: { conditioningDays: [0, 2, 4] } })
    for (const d of PROTOCOLS.gm.liftingDays) {
      expect(sessionFor('gm', 1, d, s).type).toBe('lift')
    }
  })

  it('caps the week at the book’s maximum', () => {
    // Six requested, but Green is "No more than 3" (p.99).
    const s = settings({ mass: { conditioningDays: [1, 3, 5, 6, 0, 2] } })
    expect(conditioningDaysFor(PROTOCOLS.gm, s)).toHaveLength(GREEN_PER_WEEK.max)
  })

  it('keeps Black sessions off lifting days, as the book requires', () => {
    const blackish = { ...PROTOCOLS.gm, conditioning: 'black' as const }
    const s = settings({ mass: { conditioningDays: [0, 1, 2] } })
    const days = conditioningDaysFor(blackish, s)
    expect(days).not.toContain(0)
    expect(days).not.toContain(2)
    expect(days).toContain(1)
    expect(days.length).toBeLessThanOrEqual(BLACK_PER_WEEK.max)
  })

  it('honours a chosen session per day', () => {
    const s = settings({ mass: { conditioningDays: [1], conditioningPick: { 1: 'ruck' } } })
    expect(sessionFor('gm', 1, 1, s).title).toBe('Ruck')
  })

  it('leaves Beginner alone — it has no conditioning colour', () => {
    const s = settings({ currentPhaseId: 'beginner' })
    expect(PROTOCOLS.beginner.conditioning).toBe('none')
    // Beginner's own run days are unchanged.
    expect(sessionFor('beginner', 1, 1, s).title).toBe('Run')
  })
})
