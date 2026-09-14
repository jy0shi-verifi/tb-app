import { describe, it, expect } from 'vitest'
import {
  ABC_LIFTS,
  abcDayLetter,
  abcLiftsForDay,
  abcProgress,
  abcSessionFor,
  abcStall,
  applyAbcProgress,
  defaultAbcWeights,
  seedAbcWeights,
} from '../src/abc'
import type { LoggedExercise, Settings, SessionLog } from '../src/types'

const base: Settings = {
  id: 'app',
  dbIncrement: 2,
  loadBasis: 'tm',
  currentPhaseId: 'abc',
  phaseStartDate: '2026-09-14',
  programMode: 'abc',
  abc: { lifts: defaultAbcWeights() },
}

describe('abcDayLetter / abcLiftsForDay (weekday mapping)', () => {
  it('maps Mon/Wed/Fri to A/B/C and off-days to null', () => {
    expect(abcDayLetter(0)).toBe('A')
    expect(abcDayLetter(2)).toBe('B')
    expect(abcDayLetter(4)).toBe('C')
    expect(abcDayLetter(1)).toBeNull()
    expect(abcDayLetter(6)).toBeNull()
  })

  it('lists the right exercises per day', () => {
    expect(abcLiftsForDay(0).map((l) => l.name)).toEqual([
      'Bulgarian Split Squat',
      'DB Bench Press',
      '1-Arm DB Row',
      'DB Overhead Press',
    ])
    expect(abcLiftsForDay(2).map((l) => l.name)).toEqual([
      'Bulgarian Split Squat',
      'DB Bench Press',
      '1-Arm DB Row',
      'DB Lateral Raise',
    ])
    expect(abcLiftsForDay(4).map((l) => l.name)).toEqual([
      'DB Overhead Press',
      '1-Arm DB Row',
      'DB Lateral Raise',
      'DB Curl',
    ])
  })
})

describe('abcSessionFor', () => {
  it('Mon is Day A (lift), Tue is a Runna run, Sun is rest', () => {
    const a = abcSessionFor(1, 0, base)
    expect(a.type).toBe('lift')
    expect(a.title).toBe('Strength — Day A')
    expect(a.exercises).toHaveLength(4)

    const tue = abcSessionFor(1, 1, base)
    expect(tue.type).toBe('run')
    expect(tue.exercises).toHaveLength(0)

    const sun = abcSessionFor(1, 6, base)
    expect(sun.type).toBe('rest')
  })

  it('uses each lift’s own rep-range floor and the stored working weight', () => {
    const settings: Settings = { ...base, abc: { lifts: { ...defaultAbcWeights(), abc_bench: 16 } } }
    const b = abcSessionFor(1, 2, settings) // Day B: split, bench, row, lateral raise
    const bench = b.exercises.find((e) => e.name === 'DB Bench Press')!
    const lat = b.exercises.find((e) => e.name === 'DB Lateral Raise')!
    expect(bench.sets.map((s) => s.reps)).toEqual([8, 8, 8]) // 8–12 floor
    expect(bench.sets[0].weight).toBe(16) // stored working weight
    expect(lat.sets.map((s) => s.reps)).toEqual([12, 12, 12]) // 12–15 floor
    expect(lat.sets.every((s) => s.perDumbbell)).toBe(true)
  })
})

describe('applyAbcProgress (double progression)', () => {
  const dayALogged = (benchReps: number): LoggedExercise[] => [
    { name: 'Bulgarian Split Squat', sets: [{ weight: 8, reps: 10, done: true }, { weight: 8, reps: 10, done: true }, { weight: 8, reps: 10, done: true }] },
    { name: 'DB Bench Press', sets: Array.from({ length: 3 }, () => ({ weight: 10, reps: benchReps, done: true })) },
    { name: '1-Arm DB Row', sets: [{ weight: 10, reps: 9, done: true }, { weight: 10, reps: 9, done: true }, { weight: 10, reps: 9, done: true }] },
    { name: 'DB Overhead Press', sets: [{ weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }] },
  ]

  it('bumps a lift +step once all 3 sets hit the top of its range (bench 12)', () => {
    const next = applyAbcProgress(base, 0, dayALogged(12))
    expect(next).not.toBeNull()
    expect(next!.abc_bench).toBe(12) // 10 + 2
  })

  it('never silently deloads when a session is lighter than the stored weight', () => {
    const heavy = { ...base, abc: { lifts: { ...defaultAbcWeights(), abc_bench: 20 } } }
    const lightBench: LoggedExercise[] = [
      { name: 'Bulgarian Split Squat', sets: Array.from({ length: 3 }, () => ({ weight: 8, reps: 10, done: true })) },
      { name: 'DB Bench Press', sets: Array.from({ length: 3 }, () => ({ weight: 12, reps: 8, done: true })) },
      { name: '1-Arm DB Row', sets: Array.from({ length: 3 }, () => ({ weight: 10, reps: 9, done: true })) },
      { name: 'DB Overhead Press', sets: Array.from({ length: 3 }, () => ({ weight: 6, reps: 8, done: true })) },
    ]
    const next = applyAbcProgress(heavy, 0, lightBench)
    // a bad day at 12kg must not roll the stored 20kg back
    expect(next?.abc_bench).toBeUndefined()
  })

  it('lateral raise needs 15 (its own repHi), not 12', () => {
    const at12: LoggedExercise[] = [
      { name: 'DB Overhead Press', sets: Array.from({ length: 3 }, () => ({ weight: 6, reps: 8, done: true })) },
      { name: '1-Arm DB Row', sets: Array.from({ length: 3 }, () => ({ weight: 10, reps: 8, done: true })) },
      { name: 'DB Lateral Raise', sets: Array.from({ length: 3 }, () => ({ weight: 5, reps: 12, done: true })) },
      { name: 'DB Curl', sets: Array.from({ length: 3 }, () => ({ weight: 8, reps: 8, done: true })) },
    ]
    expect(applyAbcProgress(base, 4, at12)).toBeNull() // 12 < 15 → no bump

    const at15: LoggedExercise[] = at12.map((e) =>
      e.name === 'DB Lateral Raise'
        ? { ...e, sets: e.sets.map((s) => ({ ...s, reps: 15 })) }
        : e,
    )
    const next = applyAbcProgress(base, 4, at15)
    expect(next!.abc_lat).toBe(7) // 5 + 2
  })
})

describe('seedAbcWeights (carry over recent weights on switch)', () => {
  const liftSession = (date: string, exercises: LoggedExercise[]): SessionLog => ({
    date,
    phaseId: 'operator',
    week: 1,
    day: 0,
    type: 'lift',
    title: 'Operator',
    done: true,
    createdAt: 1,
    exercises,
  })

  it('carries over shared movements from the log (scaled to the 8–12 range) and defaults the rest', () => {
    const sessions = [
      // older, heavier bench that should be ignored in favour of the most recent
      liftSession('2026-08-01', [
        { name: 'DB Bench Press', sets: [{ weight: 30, reps: 5, done: true }] },
      ]),
      // most recent session — these weights should seed A/B/C. They're heavy low-rep
      // Operator sets, so the seed backs them off to a doable ~10-rep weight.
      liftSession('2026-09-10', [
        { name: 'DB Bench Press', sets: [{ weight: 24, reps: 6, done: true }, { weight: 24, reps: 6, done: true }] },
        { name: '1-Arm DB Row', sets: [{ weight: 22, reps: 8, done: true }] },
        { name: 'DB Overhead Press', sets: [{ weight: 16, reps: 8, done: true }] },
      ]),
    ]
    const seeded = seedAbcWeights(sessions)
    // 24×6 → est 1RM ~27.9 → ~10-rep weight ~20.9 → floor to 20 (uses the most recent
    // set, not the older 30×5 which would seed 24)
    expect(seeded.abc_bench).toBe(20)
    expect(seeded.abc_row).toBe(20)
    expect(seeded.abc_ohp).toBe(14)
    // always lighter than the raw logged weight — scaled for the higher rep range
    expect(seeded.abc_bench).toBeLessThan(24)
    // movements with no history keep their light defaults
    const d = defaultAbcWeights()
    expect(seeded.abc_split).toBe(d.abc_split)
    expect(seeded.abc_lat).toBe(d.abc_lat)
    expect(seeded.abc_curl).toBe(d.abc_curl)
  })

  it('returns the plain defaults when there is no history', () => {
    expect(seedAbcWeights([])).toEqual(defaultAbcWeights())
  })
})

describe('abcStall / abcProgress', () => {
  const benchSession = (date: string, reps: number): SessionLog => ({
    date,
    phaseId: 'abc',
    week: 1,
    day: 0,
    type: 'lift',
    title: 'Strength — Day A',
    done: true,
    createdAt: 1,
    exercises: [{ name: 'DB Bench Press', sets: [{ weight: 20, reps, done: true }, { weight: 20, reps, done: true }, { weight: 20, reps, done: true }] }],
  })

  it('flags a stall (3 sessions stuck below the top) with a deload target', () => {
    const sessions = [benchSession('2026-09-01', 9), benchSession('2026-09-03', 9), benchSession('2026-09-05', 9)]
    const stall = abcStall(sessions, 'DB Bench Press', 20, 2)
    expect(stall).not.toBeNull()
    expect(stall!.deloadTo).toBe(18) // 20 - max(2, round(2/2)*2)=2
  })

  it('reports start → current per lift', () => {
    const settings: Settings = { ...base, abc: { lifts: { ...defaultAbcWeights(), abc_bench: 14 } } }
    const sessions = [benchSession('2026-09-01', 10)] // logged at 20 historically
    const prog = abcProgress(sessions, settings)
    const bench = prog.find((p) => p.id === 'abc_bench')!
    expect(bench.start).toBe(20)
    expect(bench.current).toBe(14)
    expect(ABC_LIFTS).toHaveLength(6)
  })
})
