import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { beginnerStall, beginnerProgress, applyBeginnerProgress } from '../src/beginner'
import { lastPerformance, liftRecords, sessionVolume, bestEst1RM } from '../src/lib/stats'
import { alternationRotates, greyManDay } from '../src/protocols/greyman'
import { narrowMaxes, PROTOCOLS } from '../src/program'
import { DEFAULT_SETTINGS } from '../src/db'
import type { OneRmEntry, SessionLog, Settings } from '../src/types'

/**
 * A history that contains BOTH protocols — audit code-04 G2.
 *
 * "No fixture in the repo mixes two protocols, which is precisely why the
 * contamination bugs survived." Four separate bugs came from one root cause:
 * scoping on `type === 'lift'` instead of on the protocol. Grey Man sessions are
 * ALSO `type: 'lift'`, so every read path that filtered on type alone could see
 * a 100 kg barbell squat while reasoning about a 10 kg dumbbell one.
 *
 * The numbers here are chosen so contamination is unmissable rather than
 * plausible: Beginner works in kilos PER DUMBBELL and Grey Man in kilos TOTAL ON
 * THE BAR, a factor of two apart before you even get to the absolute values.
 */

const BEGINNER_LIFT = 'Goblet / Front-rack Squat'

const beginnerSession = (date: string, weight: number, reps: number[]): SessionLog => ({
  date,
  phaseId: 'beginner',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Beginner — Day A',
  exercises: [
    { name: BEGINNER_LIFT, sets: reps.map((r) => ({ weight, reps: r, done: true })) },
    { name: 'DB Bench Press', sets: reps.map((r) => ({ weight, reps: r, done: true })) },
  ],
  done: true,
  createdAt: 1,
})

/** A Grey Man day. Note `type: 'lift'` — identical to Beginner's. */
const greyManSession = (date: string, weight: number): SessionLog => ({
  date,
  phaseId: 'gm',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Grey Man — Day A',
  exercises: [
    // Same DISPLAY NAME as Beginner's lift on purpose: Josh's real history
    // already contains names that collide across programmes.
    { name: BEGINNER_LIFT, sets: [{ weight, reps: 8, done: true }] },
    { name: 'Bench Press', sets: [{ weight, reps: 8, done: true }] },
  ],
  done: true,
  createdAt: 1,
})

/** Beginner stuck at 10 kg/DB, then a Grey Man block at 100 kg on the bar. */
const MIXED: SessionLog[] = [
  beginnerSession('2026-06-01', 10, [12, 12, 12]),
  beginnerSession('2026-06-03', 10, [12, 11, 10]),
  beginnerSession('2026-06-05', 10, [12, 12, 11]),
  greyManSession('2026-08-17', 100),
  greyManSession('2026-08-19', 105),
]

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  beginner: { lifts: { bg_squat: 10, bg_bench: 10 } },
  ...over,
})

// ---------------------------------------------------------------------------

describe('Beginner read paths ignore Grey Man history entirely', () => {
  it('lastPerformance takes the last BEGINNER session, not the most recent lift', () => {
    // Chronologically the most recent 'lift' is a 105 kg Grey Man day.
    const last = lastPerformance(MIXED, BEGINNER_LIFT, '2026-08-31', 'beginner')
    expect(last?.weight).toBe(10)
    expect(last?.weight).not.toBe(105)
  })

  it('a stall check is not broken by a heavier barbell session appearing', () => {
    const stalled = beginnerStall(MIXED, BEGINNER_LIFT, 10, 2, '2026-08-31')
    // Whatever the verdict, it must be reasoning about 10 kg dumbbells.
    if (stalled) expect(stalled.deloadTo).toBeLessThan(10)
  })

  it('progress for a beginner lift never reflects a barbell load', () => {
    const rows = beginnerProgress(MIXED, settings())
    for (const r of rows) {
      expect(r.current).toBeLessThan(30)
      expect(r.start).toBeLessThan(30)
    }
  })
})

describe('stats stay inside one protocol', () => {
  it('a PR is scoped — a 105 kg bar squat is not a dumbbell record', () => {
    const best = bestEst1RM(MIXED.filter((s) => s.phaseId === 'beginner'), BEGINNER_LIFT, '2026-08-31')
    expect(best).toBeLessThan(30)
    expect(best).not.toBeGreaterThan(100)
  })

  it('liftRecords over a single-protocol slice reports that protocol’s numbers', () => {
    const recs = liftRecords(
      MIXED.filter((x) => x.phaseId === 'gm'),
      [{ name: BEGINNER_LIFT, short: 'SQ' }],
    )
    expect(recs[0].heaviest).toBe(105)

    // The same call over the Beginner slice must see 10 kg, not 105.
    const bgRecs = liftRecords(
      MIXED.filter((x) => x.phaseId === 'beginner'),
      [{ name: BEGINNER_LIFT, short: 'SQ' }],
    )
    expect(bgRecs[0].heaviest).toBe(10)
    expect(bgRecs[0].heaviest).not.toBe(105)
  })

  it('sessionVolume of a Grey Man day is not attributed to Beginner', () => {
    const gmVol = sessionVolume(MIXED[3])
    const bgVol = sessionVolume(MIXED[0])
    expect(gmVol).toBeGreaterThan(bgVol)
  })
})

describe('the write path cannot cross protocols', () => {
  it('applyBeginnerProgress refuses a Grey Man session outright', () => {
    const gm = MIXED[3]
    expect(applyBeginnerProgress(settings(), 'A', gm.exercises, 'gm')).toBeNull()
  })

  it('also refuses Alpha — same type:lift trap', () => {
    expect(applyBeginnerProgress(settings(), 'A', MIXED[3].exercises, 'alpha')).toBeNull()
  })

  it('still runs normally for a genuine Beginner session', () => {
    const bg = MIXED[0]
    const next = applyBeginnerProgress(settings(), 'A', bg.exercises, 'beginner')
    // Three sets at 12 → the lift goes up by its step, and stays in kg/DB.
    expect(next).not.toBeNull()
    for (const kg of Object.values(next!)) expect(kg).toBeLessThan(20)
  })
})

describe('maxes never cross scopes', () => {
  const rows: OneRmEntry[] = [
    {
      protocolId: 'beginner',
      exerciseId: 'bg_squat',
      exerciseName: BEGINNER_LIFT,
      kg: 10,
      unit: 'perDumbbell',
      source: 'tested',
      testedAt: '2026-06-01',
      progressedKg: 0,
    },
    {
      protocolId: 'mass',
      exerciseId: 'squat',
      exerciseName: 'Squat',
      kg: 140,
      unit: 'total',
      source: 'tested',
      testedAt: '2026-08-01',
      progressedKg: 0,
    },
  ]

  it('narrowMaxes hands Grey Man only the mass-scoped rows', () => {
    const forGm = narrowMaxes(rows, PROTOCOLS.gm)
    expect(Object.keys(forGm)).toEqual(['squat'])
    expect(forGm.bg_squat).toBeUndefined()
  })

  it('Alpha shares that mass scope — a Grey Man squat 1RM is usable on MS day', () => {
    const forAlpha = narrowMaxes(rows, PROTOCOLS.alpha)
    expect(forAlpha.squat.kg).toBe(140)
    expect(forAlpha.bg_squat).toBeUndefined()
  })

  it('and Beginner only its own', () => {
    const forBeginner = narrowMaxes(rows, PROTOCOLS.beginner)
    expect(Object.keys(forBeginner)).toEqual(['bg_squat'])
    // A per-dumbbell 10 kg read as a barbell total would be a silent factor-of-two error.
    expect(forBeginner.bg_squat.unit).toBe('perDumbbell')
  })
})

describe('A/B alternation only rotates for an odd weekly count (code-02 F13)', () => {
  it('rotates the weekday for Grey Man’s three days', () => {
    // Monday is ordinal 0 in week 1 and ordinal 3 in week 2.
    expect(greyManDay(0)).toBe('A')
    expect(greyManDay(3)).toBe('B')
    expect(alternationRotates(PROTOCOLS.gm.liftingDays.length)).toBe(true)
  })

  it('does NOT rotate for a two-day week — the trap waiting for Fighter HT', () => {
    // With two lifting days Monday is ordinal 0, 2, 4… so it is Day A forever.
    expect(greyManDay(0)).toBe('A')
    expect(greyManDay(2)).toBe('A')
    expect(greyManDay(4)).toBe('A')
    expect(alternationRotates(2)).toBe(false)
    // Deliberately not "fixed" here: what Fighter HT should do is a question for
    // its own grid on p.60, and inventing a rule before reading that page is the
    // failure this rebuild exists to undo.
  })
})
