import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  GM_GRID,
  GM_MAIN,
  GM_S1_EXAMPLE,
  GM_S2_EXAMPLE,
  GM_BLOCK_WEEKS,
  GM_LIFTING_DAYS,
  GREY_MAN_PROTOCOL,
  greyManDay,
  S_CLUSTER_MIN,
  S_CLUSTER_MAX,
} from '../src/protocols/greyman'
import { sessionFor, narrowMaxes, liftingOrdinalFor, PROTOCOLS } from '../src/program'
import { DEFAULT_SETTINGS } from '../src/db'
import type { OneRmEntry, Settings } from '../src/types'

/**
 * Book fixtures for Grey Man, MASS pp.48–53 (PDF pages of
 * docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf).
 *
 * The printed tables become the assertions, per the fidelity rule in CLAUDE.md.
 * Where the app had to choose something the book does not give, the test says so
 * and asserts the alternative is NOT what happens.
 */

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  currentPhaseId: 'gm',
  phaseStartDate: '2026-08-17', // a Monday
  ...over,
})

const max = (exerciseId: string, kg: number, over: Partial<OneRmEntry> = {}): OneRmEntry => ({
  protocolId: 'mass',
  exerciseId,
  exerciseName: exerciseId,
  kg,
  unit: 'total',
  source: 'estimated',
  testedAt: '2026-08-22',
  progressedKg: 0,
  ...over,
})

const pctOf = (p: { loading: unknown }) => (p.loading as { percent: number }).percent

// ---------------------------------------------------------------------------

describe('the p.51 programming grid, cell for cell', () => {
  it('main lifts: 4-5 x 8 / 70%, 4-5 x 6 / 75%, 4-5 x 3 / 80%', () => {
    expect([1, 2, 3].map((w) => [GM_GRID[w].main.setsMin, GM_GRID[w].main.setsMax])).toEqual([
      [4, 5],
      [4, 5],
      [4, 5],
    ])
    expect([1, 2, 3].map((w) => GM_GRID[w].main.reps)).toEqual([8, 6, 3])
    expect([1, 2, 3].map((w) => pctOf(GM_GRID[w].main))).toEqual([70, 75, 80])
  })

  it('supplementary: 4 x 12 / 55%, 4 x 10 / 60%, 4 x 8 / 65%', () => {
    // Flat 4 sets, not a range — the range is on the main lifts only.
    expect([1, 2, 3].map((w) => [GM_GRID[w].supp.setsMin, GM_GRID[w].supp.setsMax])).toEqual([
      [4, 4],
      [4, 4],
      [4, 4],
    ])
    expect([1, 2, 3].map((w) => GM_GRID[w].supp.reps)).toEqual([12, 10, 8])
    expect([1, 2, 3].map((w) => pctOf(GM_GRID[w].supp))).toEqual([55, 60, 65])
  })

  it('is a 3-week block and no more', () => {
    expect(GM_BLOCK_WEEKS).toBe(3)
    expect(Object.keys(GM_GRID)).toEqual(['1', '2', '3'])
    // "Both General and Specificity consist of 3-week blocks" (p.40).
    expect(GREY_MAN_PROTOCOL.blockWeeks).toBe(3)
  })

  it('runs percentages off the 1RM — Grey Man never uses a training max', () => {
    // The TM is recommended for the Bulgarian cluster alone (pp.88-89).
    for (const w of [1, 2, 3]) {
      expect(GM_GRID[w].main.basis).toBe('1rm')
      expect(GM_GRID[w].supp.basis).toBe('1rm')
    }
  })

  it('has NO AMRAP and NO peaking markers — unlike the other three templates', () => {
    // Mass Template (p.45), Gladiator (p.55) and Fighter HT (p.60) all print
    // `SQ+ / BP+ / or AMRAP` in week 3. The Grey Man grid prints none.
    const s = sessionFor('gm', 3, 0, settings(), { squat: max('squat', 100) })
    const text = JSON.stringify(s)
    expect(text).not.toMatch(/AMRAP/i)
    expect(text).not.toMatch(/peak/i)
    // Week 3 is simply heavier than week 1.
    expect(pctOf(GM_GRID[3].main)).toBeGreaterThan(pctOf(GM_GRID[1].main))
  })
})

describe('clusters (pp.48–49)', () => {
  it('the main cluster is Bench, Squat, OHP, Deadlift and is not editable', () => {
    expect(GM_MAIN.map((e) => e.name)).toEqual(['Bench Press', 'Squat', 'Overhead Press', 'Deadlift'])
    // "The Main cluster is standard across the board, the same for everyone" (p.48).
    expect(GREY_MAN_PROTOCOL.clusters.main.editable).toBe(false)
  })

  it('the S clusters are editable and seeded with the book’s own example', () => {
    // p.49 image is titled "S CLUSTER (Example)" — a starting point, not a rule.
    expect(GREY_MAN_PROTOCOL.clusters.s1.editable).toBe(true)
    expect(GREY_MAN_PROTOCOL.clusters.s2.editable).toBe(true)
    expect(GM_S1_EXAMPLE.map((e) => e.name)).toEqual(['Dips', 'Incline Dumbbell Press', 'Front Squat'])
    expect(GM_S2_EXAMPLE.map((e) => e.name)).toEqual(['Dumbbell Shrugs', 'Dumbbell Row'])
  })

  it('the example S cluster obeys the book’s own 4–6 limit', () => {
    // "Use no more than 4 to 6" (p.49). The example splits 3 / 2.
    const total = GM_S1_EXAMPLE.length + GM_S2_EXAMPLE.length
    expect(total).toBeGreaterThanOrEqual(S_CLUSTER_MIN)
    expect(total).toBeLessThanOrEqual(S_CLUSTER_MAX)
    expect([GM_S1_EXAMPLE.length, GM_S2_EXAMPLE.length]).toEqual([3, 2])
  })

  it('cites the book for every cluster, so the UI can show where it came from', () => {
    for (const c of Object.values(GREY_MAN_PROTOCOL.clusters)) {
      expect(c.sourceNote).toMatch(/MASS p\.\d+/)
    }
  })
})

describe('the A/B schedule (p.50)', () => {
  it('trains Days 1/3/5 — Mon, Wed, Fri — and rests the other four', () => {
    expect(GM_LIFTING_DAYS).toEqual([0, 2, 4])
    const s = settings()
    expect([0, 2, 4].map((d) => sessionFor('gm', 1, d, s).type)).toEqual(['lift', 'lift', 'lift'])
    expect([1, 3, 5, 6].map((d) => sessionFor('gm', 1, d, s).type)).toEqual([
      'rest',
      'rest',
      'rest',
      'rest',
    ])
  })

  it('A is Bench + Squat, B is Overhead Press + Deadlift', () => {
    const s = settings()
    const maxes = {
      bench: max('bench', 80),
      squat: max('squat', 100),
      ohp: max('ohp', 50),
      deadlift: max('deadlift', 120),
    }
    const a = sessionFor('gm', 1, 0, s, maxes)
    const b = sessionFor('gm', 1, 2, s, maxes)
    expect(a.title).toBe('Grey Man — Day A')
    expect(b.title).toBe('Grey Man — Day B')
    expect(a.exercises.slice(0, 2).map((e) => e.name)).toEqual(['Bench Press', 'Squat'])
    expect(b.exercises.slice(0, 2).map((e) => e.name)).toEqual(['Overhead Press', 'Deadlift'])
  })

  it('pairs S1 with A and S2 with B', () => {
    const s = settings()
    const a = sessionFor('gm', 1, 0, s)
    const b = sessionFor('gm', 1, 2, s)
    expect(a.exercises.slice(2).map((e) => e.name)).toEqual(GM_S1_EXAMPLE.map((e) => e.name))
    expect(b.exercises.slice(2).map((e) => e.name)).toEqual(GM_S2_EXAMPLE.map((e) => e.name))
  })

  it('alternates A B A / B A B / A B A across the block, exactly as printed', () => {
    const gm = PROTOCOLS.gm
    const letters = [
      [1, 0], [1, 2], [1, 4],
      [2, 0], [2, 2], [2, 4],
      [3, 0], [3, 2], [3, 4],
    ].map(([w, d]) => greyManDay(liftingOrdinalFor(gm, w, d)))
    expect(letters).toEqual(['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A'])
  })

  it('gives five A days and four B days per block', () => {
    const gm = PROTOCOLS.gm
    const letters = [1, 2, 3].flatMap((w) =>
      GM_LIFTING_DAYS.map((d) => greyManDay(liftingOrdinalFor(gm, w, d))),
    )
    expect(letters.filter((l) => l === 'A')).toHaveLength(5)
    expect(letters.filter((l) => l === 'B')).toHaveLength(4)
  })

  it('is NOT day-of-week: Monday is A in week 1 but B in week 2', () => {
    const s = settings()
    expect(sessionFor('gm', 1, 0, s).title).toContain('Day A')
    expect(sessionFor('gm', 2, 0, s).title).toContain('Day B')
  })
})

describe('working loads', () => {
  const s = settings()

  it('computes a barbell load from the percentage and shows the plates', () => {
    const plan = sessionFor('gm', 1, 0, s, { squat: max('squat', 100) })
    const squat = plan.exercises.find((e) => e.name === 'Squat')!
    // Week 1 main is 70% (p.51). 70% of 100 = 70 kg.
    expect(squat.sets[0].weight).toBe(70)
    expect(squat.sets[0].targetKg).toBe(70)
    expect(squat.sets[0].perSide).toEqual([{ kg: 25, count: 1 }])
    expect(squat.sets).toHaveLength(4)
    expect(squat.sets[0].reps).toBe(8)
  })

  it('steps the load across the three weeks', () => {
    // Squat is an A-day lift, and A does not fall on the same weekday each week:
    // week 1 Mon, week 2 Wed, week 3 Mon. Asking for Monday every week would find
    // no squat in week 2 at all — which is exactly the alternation working.
    const A_DAYS: [number, number][] = [
      [1, 0],
      [2, 2],
      [3, 0],
    ]
    const w = (week: number, day: number) =>
      sessionFor('gm', week, day, s, { squat: max('squat', 100) }).exercises.find(
        (e) => e.name === 'Squat',
      )!.sets[0]
    const sets = A_DAYS.map(([week, day]) => w(week, day))
    expect(sets.map((x) => x.weight)).toEqual([70, 75, 80])
    expect(sets.map((x) => x.reps)).toEqual([8, 6, 3])
  })

  it('a lift simply does not appear on the other cluster’s day', () => {
    // Week 2 Monday is a B day, so there is no squat to find.
    const b = sessionFor('gm', 2, 0, s, { squat: max('squat', 100) })
    expect(b.exercises.find((e) => e.name === 'Squat')).toBeUndefined()
    expect(b.exercises.map((e) => e.name).slice(0, 2)).toEqual(['Overhead Press', 'Deadlift'])
  })

  it('applies Forced Progression on top of the tested max (p.90)', () => {
    const plan = sessionFor('gm', 1, 0, s, {
      squat: max('squat', 100, { progressedKg: 5 }),
    })
    // 70% of 105 = 73.5 -> nearest loadable is 72.5 (delta 1) over 75 (delta 1.5).
    const set = plan.exercises.find((e) => e.name === 'Squat')!.sets[0]
    expect(set.targetKg).toBe(73.5)
    expect(set.weight).toBe(72.5)
  })

  it('says so honestly when a 1RM is missing, rather than inventing a load', () => {
    const plan = sessionFor('gm', 1, 0, s, {})
    const squat = plan.exercises.find((e) => e.name === 'Squat')!
    expect(squat.sets[0].weight).toBeUndefined()
    expect(squat.note).toMatch(/Set your 1RM/)
    expect(squat.note).toContain('70%')
  })

  it('flags a light overhead press that falls under the empty bar', () => {
    // Day B, week 1: 70% of a 25 kg OHP is 17.5 kg — under a 20 kg bar.
    const plan = sessionFor('gm', 1, 2, s, { ohp: max('ohp', 25) })
    const ohp = plan.exercises.find((e) => e.name === 'Overhead Press')!
    expect(ohp.sets[0].belowBar).toBe(true)
    expect(ohp.sets[0].weight).toBe(20)
  })

  it('handles a dumbbell supplementary exercise per hand, rounding ties down', () => {
    const plan = sessionFor('gm', 1, 0, s, {
      s_incline_db_press: max('s_incline_db_press', 20, { unit: 'perDumbbell' }),
    })
    const inc = plan.exercises.find((e) => e.name === 'Incline Dumbbell Press')!
    // 55% of 20 = 11 kg. On 2 kg increments, 11 is an exact tie -> 10.
    expect(inc.sets[0].targetKg).toBe(11)
    expect(inc.sets[0].weight).toBe(10)
    expect(inc.sets[0].perDumbbell).toBe(true)
    expect(inc.sets[0].reps).toBe(12)
  })

  it('treats a bodyweight exercise as a percentage of MAX REPS (p.90)', () => {
    const plan = sessionFor('gm', 1, 0, s, {
      s_dips: max('s_dips', 0, { maxReps: 10 }),
    })
    const dips = plan.exercises.find((e) => e.name === 'Dips')!
    // 55% of a 10-rep max = 5.5 -> ties down -> 5. And no weight is prescribed.
    expect(dips.sets[0].reps).toBe(5)
    expect(dips.sets[0].weight).toBeUndefined()
    // NOT the naive reading, which would keep the prescribed 12 reps.
    expect(dips.sets[0].reps).not.toBe(12)
  })

  it('respects a custom plate inventory', () => {
    const micro = settings({ bar: { barKg: 20, platePairsKg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5] } })
    const plan = sessionFor('gm', 1, 0, micro, { squat: max('squat', 97) })
    // 70% of 97 = 67.9. With microplates, 68 is reachable; without, 67.5.
    expect(plan.exercises.find((e) => e.name === 'Squat')!.sets[0].weight).toBe(68)
    const std = sessionFor('gm', 1, 0, s, { squat: max('squat', 97) })
    expect(std.exercises.find((e) => e.name === 'Squat')!.sets[0].weight).toBe(67.5)
  })

  it('defaults to the low end of the printed set range', () => {
    // "4-5 x 8" (p.51) — the app prescribes 4 and leaves the 5th to the user.
    const plan = sessionFor('gm', 1, 0, s, { squat: max('squat', 100) })
    expect(plan.exercises.find((e) => e.name === 'Squat')!.sets).toHaveLength(4)
    expect(GM_GRID[1].main.setsMax).toBe(5)
  })
})

describe('protocol registration', () => {
  it('is registered as a General Mass template with Green conditioning', () => {
    expect(PROTOCOLS.gm).toBe(GREY_MAN_PROTOCOL)
    expect(GREY_MAN_PROTOCOL.family).toBe('general')
    // "Use Green sessions when training General Mass blocks" (p.20).
    expect(GREY_MAN_PROTOCOL.conditioning).toBe('green')
  })

  it('shares its max scope with the other MASS templates, not with Beginner', () => {
    expect(GREY_MAN_PROTOCOL.maxScope).toBe('mass')
    expect(PROTOCOLS.beginner.maxScope).toBe('beginner')
  })

  it('narrowMaxes keeps the two scopes apart', () => {
    const rows: OneRmEntry[] = [
      max('bench', 80),
      { ...max('bg_bench', 24, { unit: 'perDumbbell' }), protocolId: 'beginner' },
    ]
    const forGm = narrowMaxes(rows, GREY_MAN_PROTOCOL)
    expect(Object.keys(forGm)).toEqual(['bench'])
    const forBeginner = narrowMaxes(rows, PROTOCOLS.beginner)
    expect(Object.keys(forBeginner)).toEqual(['bg_bench'])
  })

  it('does not let a per-dumbbell max leak into a barbell load', () => {
    // The failure this scoping exists to prevent: a 24 kg/DB bench max being
    // read as a 24 kg barbell 1RM, or vice versa.
    const rows: OneRmEntry[] = [
      { ...max('bench', 24, { unit: 'perDumbbell' }), protocolId: 'beginner' },
    ]
    const plan = sessionFor('gm', 1, 0, settings(), narrowMaxes(rows, GREY_MAN_PROTOCOL))
    expect(plan.exercises.find((e) => e.name === 'Bench Press')!.note).toMatch(/Set your 1RM/)
  })
})

describe('execution notes carry the book’s rules (pp.50–53)', () => {
  const plan = sessionFor('gm', 1, 0, settings(), { squat: max('squat', 100) })

  it('tells you main lifts come first', () => {
    expect(plan.detail).toMatch(/Main lifts first/i)
  })

  it('carries the rest intervals and the 10% failure rule', () => {
    expect(plan.detail).toMatch(/2–5 min/)
    expect(plan.detail).toMatch(/1–2 min/)
    // Grey Man says a flat 10% (p.53), where Mass Template says 5-10% (p.45).
    expect(plan.detail).toMatch(/10%/)
    expect(plan.detail).not.toMatch(/5–10%/)
  })

  it('summarises the week in the scheme line', () => {
    expect(plan.scheme).toBe('4–5 × 8 @ 70% · S 4 × 12 @ 55%')
  })
})
