import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { resolvePosition, sessionFor, defaultPlan, planWeeks, PROTOCOLS } from '../src/program'
import {
  GREEN_SESSIONS,
  BLACK_SESSIONS,
  GREEN_PER_WEEK,
  BLACK_PER_WEEK,
  GREEN_CAP_MIN,
  BLACK_CAP_MIN,
  RECOVERY_RUN_EXEMPT_MIN,
  HARDGAINER_CAP_MIN,
  conditioningById,
  effectiveCapMin,
} from '../src/protocols/conditioning'
import {
  conditioningBriefFor,
  conditioningDaysFor,
  conditioningLoad,
  conditioningPickFor,
} from '../src/protocols/conditioningPlan'
import { DEFAULT_SETTINGS } from '../src/db'
import type { SessionLog, Settings } from '../src/types'

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

  it('the starter plan is a suggested Grey Man year with Bridges (p.93)', () => {
    const plan = defaultPlan('2026-08-17')
    expect(plan.blocks.filter((b) => b.protocolId === 'gm')).toHaveLength(16)
    expect(plan.blocks.filter((b) => b.protocolId === 'bridge')).toHaveLength(4)
    expect(planWeeks(plan.blocks)).toBe(52)
    expect(plan.blocks.map((b) => b.weeks)).not.toEqual([3, 3, 1, 3, 3])
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

  // -------------------------------------------------------------------------
  // A4: "Sessions can be conducted on non-lifting OR LIFTING days" (p.99)
  // -------------------------------------------------------------------------

  it('lets Green share a lifting day — the book explicitly permits it (p.99)', () => {
    const s = settings({ mass: { conditioningDays: [0, 2, 4] } })
    const plan = sessionFor('gm', 1, 0, s) // Monday: a lifting day

    // Alongside, not instead of. The lift is untouched...
    expect(plan.type).toBe('lift')
    expect(plan.exercises.length).toBeGreaterThan(0)
    // ...and the conditioning rides with it.
    expect(plan.conditioning).toBeDefined()
    expect(plan.conditioning!.colour).toBe('green')
    // The bug A4 exists for: conditioning was only ever injected into a `rest`
    // day, so a lit Mon/Wed/Fri produced nothing at all.
    expect(plan.conditioning).not.toBeUndefined()
  })

  it('does NOT attach conditioning to a lifting day that was not picked', () => {
    const s = settings({ mass: { conditioningDays: [1, 3, 5] } }) // Tue/Thu/Sat
    expect(sessionFor('gm', 1, 0, s).conditioning).toBeUndefined()
  })

  it('a rest day still carries the conditioning as the day’s own session', () => {
    const s = settings({ mass: { conditioningDays: [1] } })
    const plan = sessionFor('gm', 1, 1, s)
    expect(plan.type).toBe('run')
    // On a rest day the session IS the conditioning, so there is nothing to
    // hang alongside — the brief stays undefined rather than duplicating it.
    expect(plan.conditioning).toBeUndefined()
  })

  it('honours the pick, not just the day', () => {
    const s = settings({
      mass: { conditioningDays: [0], conditioningPick: { 0: 'ruck' } },
    })
    expect(sessionFor('gm', 1, 0, s).conditioning!.name).toBe('Ruck')
    expect(sessionFor('gm', 1, 0, s).conditioning!.name).not.toBe('Walk')
  })

  it('refuses to put Black on a lifting day — "Perform Black sessions on non-lifting days" (p.99)', () => {
    // No Specificity protocol exists yet, so this exercises the rule directly on
    // a Black-carrying protocol shaped like the ones that will.
    const black = { ...PROTOCOLS.gm, conditioning: 'black' as const }
    const s = settings({ mass: { conditioningDays: [0, 2, 4] } })
    const pos = { week: 1, day: 0, liftingOrdinal: 0 }
    expect(conditioningBriefFor(black, pos, s)).toBeUndefined()
    // And Green in the same position DOES attach — so the test is discriminating
    // between the colours, not just returning undefined for everything.
    expect(conditioningBriefFor(PROTOCOLS.gm, pos, s)).toBeDefined()
  })

  it('still counts a lifting-day session against the weekly cap', () => {
    // Four requested across lifting and rest days; Green is "No more than 3".
    const s = settings({ mass: { conditioningDays: [0, 1, 2, 3] } })
    expect(conditioningDaysFor(PROTOCOLS.gm, s)).toEqual([0, 1, 2])
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

// ---------------------------------------------------------------------------
// A12 / A13 — the weekly allowance and the duration caps
// ---------------------------------------------------------------------------

const run = (day: number, over: Partial<SessionLog> = {}): SessionLog => ({
  date: '2026-08-17',
  phaseId: 'gm',
  week: 1,
  day,
  type: 'run',
  title: 'Runna easy 5k',
  exercises: [],
  done: true,
  durationMin: 35,
  createdAt: 1,
  ...over,
})

describe('duration caps (p.111, and each session’s own page) — audit A13', () => {
  it('carries the recap’s flat caps', () => {
    // "Green Sessions shouldn't exceed 60 minutes. Black Sessions shouldn't
    // exceed 20 minutes." (p.111)
    expect(GREEN_CAP_MIN).toBe(60)
    expect(BLACK_CAP_MIN).toBe(20)
    expect(BLACK_CAP_MIN).not.toBe(60)
  })

  it('uses the TIGHTER of the session’s cap and its colour’s', () => {
    // Hill Sprints stops at 15 min or 10 sprints, whichever comes first (p.106),
    // which is tighter than Black's flat 20 (p.111).
    expect(effectiveCapMin(conditioningById('hill-sprints')!)).toBe(15)
    // Recovery Run is 30 (p.102), tighter than Green's 60.
    expect(effectiveCapMin(conditioningById('recovery-run')!)).toBe(30)
    // A Walk has no tighter cap, so it takes the colour's.
    expect(effectiveCapMin(conditioningById('walk')!)).toBe(60)
  })

  it('falls back to the colour cap for a session the book gives none (p.104)', () => {
    // Anabolic Sprints has a round count and no time cap at all.
    expect(conditioningById('anabolic-sprints')!.capMin).toBeUndefined()
    expect(effectiveCapMin(conditioningById('anabolic-sprints')!)).toBe(BLACK_CAP_MIN)
  })

  it('keeps the hardgainer caps the book gives (p.102, p.103)', () => {
    expect(HARDGAINER_CAP_MIN['recovery-run']).toBe(20)
    expect(HARDGAINER_CAP_MIN['endurance-predator']).toBe(30)
    // Endurance Predator's was not even in the card text before (book-03 F8).
    expect(conditioningById('endurance-predator')!.detail).toMatch(/hardgainer/i)
  })
})

describe('a stored pick is validated against the block’s colour — audit A13', () => {
  it('refuses a Black session inside a General block (p.98, p.111)', () => {
    // A pick survives a change of block, so without this a Specificity-era
    // choice would render Black work in the middle of General Mass.
    const s = settings({ mass: { conditioningDays: [1], conditioningPick: { 1: 'hill-sprints' } } })
    const got = conditioningPickFor(PROTOCOLS.gm, s, 1)
    expect(got!.colour).toBe('green')
    expect(got!.id).not.toBe('hill-sprints')
  })

  it('honours a pick of the right colour', () => {
    const s = settings({ mass: { conditioningDays: [1], conditioningPick: { 1: 'ruck' } } })
    expect(conditioningPickFor(PROTOCOLS.gm, s, 1)!.id).toBe('ruck')
  })
})

describe('extra-curricular activity eats the allowance (p.110) — audit A12', () => {
  const s = () => settings({ mass: { conditioningDays: [1, 5] } })

  it('counts the scheduled sessions', () => {
    const load = conditioningLoad(PROTOCOLS.gm, s(), [])
    expect(load.scheduled).toBe(2)
    expect(load.used).toBe(2)
    expect(load.overCap).toBe(false)
  })

  it('counts a run the plan did NOT schedule — "it counts as one conditioning session"', () => {
    // Josh's Runna work arrives through stravaSync on whatever day he ran.
    const load = conditioningLoad(PROTOCOLS.gm, s(), [run(2), run(3)])
    expect(load.extraCurricular).toBe(2)
    expect(load.used).toBe(4)
    // Green is "No more than 3" (p.99, p.111).
    expect(load.overCap).toBe(true)
  })

  it('does not double-count a scheduled day that Strava then enriched', () => {
    const load = conditioningLoad(PROTOCOLS.gm, s(), [run(1), run(5)])
    expect(load.extraCurricular).toBe(0)
    expect(load.used).toBe(2)
  })

  it('exempts a short recovery run either side of a lift (p.102)', () => {
    // "A 10-minute run either side of a lift does NOT count as a session… two of
    // them still count as zero."
    const load = conditioningLoad(PROTOCOLS.gm, s(), [
      run(0, { durationMin: RECOVERY_RUN_EXEMPT_MIN }),
      run(0, { durationMin: RECOVERY_RUN_EXEMPT_MIN }),
    ])
    expect(load.exempt).toBe(2)
    expect(load.extraCurricular).toBe(0)
    expect(load.used).toBe(2) // still just the two scheduled
  })

  it('counts an 11-minute run — the exemption is 10, not "short-ish"', () => {
    const load = conditioningLoad(PROTOCOLS.gm, s(), [run(2, { durationMin: 11 })])
    expect(load.extraCurricular).toBe(1)
    expect(load.exempt).toBe(0)
  })

  it('ignores lifting and rest days, and anything not finished', () => {
    const load = conditioningLoad(PROTOCOLS.gm, s(), [
      run(2, { type: 'lift' }),
      run(3, { done: false }),
    ])
    expect(load.extraCurricular).toBe(0)
  })
})
