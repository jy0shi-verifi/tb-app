import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  GM_FAILURE_DROP_PCT,
  PROGRESSION_DEFAULT_KG,
  PROGRESSION_MAX_KG,
  PROGRESSION_MIN_KG,
  currentMaxKg,
  markedStruggled,
  reviewProgression,
  sessionsInBlock,
  shortSetsInBlock,
  suggestProgression,
  withFailureDrop,
  withProgression,
} from '../src/lib/progression'
import { justFinishedBlock, progressionPending, sessionFor } from '../src/program'
import { GM_MAIN } from '../src/protocols/greyman'
import { DEFAULT_SETTINGS } from '../src/db'
import type { OneRmEntry, SessionLog, Settings } from '../src/types'

/**
 * Forced Progression — MASS p.53, p.90.
 *
 *   "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't
 *    force progression for exercises you struggled with - use the same numbers
 *    for the next block." (p.53)
 *
 * The book's printed numbers are the fixtures, per CLAUDE.md, and each one also
 * asserts the plausible WRONG answer — the pattern that caught the original
 * Brzycki/Epley bug.
 */

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

const session = (
  date: string,
  exercises: { name: string; reps: number[]; struggled?: boolean }[],
): SessionLog => ({
  date,
  phaseId: 'gm',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Grey Man — Day A',
  exercises: exercises.map((e) => ({
    name: e.name,
    sets: e.reps.map((r) => ({ weight: 100, reps: r, done: true })),
    ...(e.struggled ? { struggled: true } : {}),
  })),
  done: true,
  createdAt: 0,
})

/** Four 3-week Grey Man blocks starting Monday 2026-08-17. */
const planned = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  currentPhaseId: 'gm',
  phaseStartDate: '2026-08-17',
  plan: {
    startDate: '2026-08-17',
    blocks: [
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
      { protocolId: 'gm', weeks: 3 },
    ],
  },
  ...over,
})

// ---------------------------------------------------------------------------

describe('the increment, converted from the book’s pounds (p.53)', () => {
  it('brackets 5–10 lb as 2.5–4.5 kg, and does NOT stretch to 5 kg', () => {
    // 5 lb = 2.268 kg, 10 lb = 4.536 kg. A 5 kg jump is 11.02 lb — over the top end.
    expect(PROGRESSION_MIN_KG).toBe(2.5)
    expect(PROGRESSION_MAX_KG).toBe(4.5)
    expect(PROGRESSION_MAX_KG).not.toBe(5)
  })

  it('defaults to the BOTTOM of the range — "DON’T start too heavy" (p.64)', () => {
    expect(PROGRESSION_DEFAULT_KG).toBe(PROGRESSION_MIN_KG)
    expect(PROGRESSION_DEFAULT_KG).not.toBe(PROGRESSION_MAX_KG)
  })

  it('Grey Man’s failure drop is a flat 10% (p.53), not the Mass Template’s 5–10% (p.45)', () => {
    expect(GM_FAILURE_DROP_PCT).toBe(10)
    expect(GM_FAILURE_DROP_PCT).not.toBe(5)
  })
})

describe('moving a stored 1RM', () => {
  it('adds to progressedKg and leaves the tested figure alone', () => {
    const after = withProgression(max('squat', 100), 2.5)
    expect(after.progressedKg).toBe(2.5)
    // The tested number must survive — it is what a re-test is compared against.
    expect(after.kg).toBe(100)
    expect(currentMaxKg(after)).toBe(102.5)
  })

  it('accumulates across blocks rather than replacing', () => {
    let e = max('squat', 100)
    e = withProgression(e, 2.5)
    e = withProgression(e, 2.5)
    e = withProgression(e, 2.5)
    expect(e.progressedKg).toBe(7.5)
    expect(currentMaxKg(e)).toBe(107.5)
    // Not 102.5 — the bug would be treating each block as an absolute set.
    expect(currentMaxKg(e)).not.toBe(102.5)
  })

  it('drops 10% off the CURRENT max, not off the original test', () => {
    // Tested 100, progressed to 110. The book says lower "your 1 rep maximum",
    // which is now 110 → 99. Taking 10% off the tested 100 would give 90 and
    // silently undo far more than 10%.
    const e = withFailureDrop(withProgression(max('squat', 100), 10))
    expect(currentMaxKg(e)).toBe(99)
    expect(currentMaxKg(e)).not.toBe(90)
    expect(e.kg).toBe(100)
    expect(e.progressedKg).toBe(-1)
  })
})

describe('"Don’t force progression for exercises you struggled with" (p.53)', () => {
  const block = [
    session('2026-08-17', [
      { name: 'Bench Press', reps: [8, 8, 8, 8] },
      { name: 'Squat', reps: [8, 8, 6, 5] },
    ]),
    session('2026-08-19', [{ name: 'Overhead Press', reps: [8, 8, 8, 8], struggled: true }]),
  ]

  it('reads the lifter’s explicit mark', () => {
    expect(markedStruggled(block, 'Overhead Press')).toBe(true)
    expect(markedStruggled(block, 'Bench Press')).toBe(false)
  })

  it('counts sets logged short of the best set of their own session', () => {
    // Squat: 8,8,6,5 — two sets below the session's best of 8.
    expect(shortSetsInBlock(block, 'Squat')).toBe(2)
    expect(shortSetsInBlock(block, 'Bench Press')).toBe(0)
  })

  it('suggests progressing a clean lift and NOT one that struggled', () => {
    const maxes = {
      bench: max('bench', 100, { exerciseName: 'Bench Press' }),
      squat: max('squat', 140, { exerciseName: 'Squat' }),
      ohp: max('ohp', 60, { exerciseName: 'Overhead Press' }),
    }
    const exercises = [
      { id: 'bench', name: 'Bench Press', defaultLoading: 'barbell' as const },
      { id: 'squat', name: 'Squat', defaultLoading: 'barbell' as const },
      { id: 'ohp', name: 'Overhead Press', defaultLoading: 'barbell' as const },
    ]
    const { candidates } = reviewProgression(exercises, maxes, block)
    const by = (n: string) => candidates.find((c) => c.exerciseName === n)!

    expect(suggestProgression(by('Bench Press'))).toBe(true)
    // Explicitly marked — the book's own instruction.
    expect(suggestProgression(by('Overhead Press'))).toBe(false)
    // Missed reps in the log — the derived hint.
    expect(suggestProgression(by('Squat'))).toBe(false)
  })

  it('refuses to invent a rep increment for bodyweight work (p.90)', () => {
    const exercises = [{ id: 'pullup', name: 'Pull-up', defaultLoading: 'bodyweightReps' as const }]
    const maxes = { pullup: max('pullup', 0, { maxReps: 12 }) }
    const { candidates } = reviewProgression(exercises, maxes, [])
    expect(candidates[0].blocked).toMatch(/max reps/)
    expect(suggestProgression(candidates[0])).toBe(false)
  })

  it('lists an exercise with no stored max as missing rather than hiding it', () => {
    const exercises = [{ id: 'squat', name: 'Squat', defaultLoading: 'barbell' as const }]
    const { candidates, missing } = reviewProgression(exercises, {}, [])
    expect(candidates).toHaveLength(0)
    expect(missing).toEqual(['Squat'])
  })
})

describe('block boundaries', () => {
  it('reports nothing before the plan starts', () => {
    expect(justFinishedBlock(planned(), new Date(2026, 7, 10))).toBeNull()
  })

  it('reports nothing during the first block — nothing has finished yet', () => {
    // Week 2 of block 1.
    expect(justFinishedBlock(planned(), new Date(2026, 7, 26))).toBeNull()
  })

  it('reports block 1 once block 2 has begun, with the dates block 1 spanned', () => {
    const b = justFinishedBlock(planned(), new Date(2026, 8, 7)) // Mon 2026-09-07, block 2 wk 1
    expect(b).not.toBeNull()
    expect(b!.index).toBe(0)
    expect(b!.startDate).toBe('2026-08-17')
    // Exclusive end: three weeks later, which is also block 2's first day.
    expect(b!.endDateExclusive).toBe('2026-09-07')
  })

  it('never reports a Bridge Week — it trains nothing (p.92)', () => {
    // 2026-10-05 is the Monday after the bridge, i.e. block 4 week 1.
    const b = justFinishedBlock(planned(), new Date(2026, 9, 5))
    expect(b).toBeNull()
  })

  it('returns null without a plan — Beginner has its own progression', () => {
    const noPlan: Settings = { ...DEFAULT_SETTINGS, plan: undefined }
    expect(justFinishedBlock(noPlan, new Date(2026, 8, 7))).toBeNull()
  })

  it('stops asking once the block has been answered', () => {
    const when = new Date(2026, 8, 7)
    expect(progressionPending(planned(), when)).not.toBeNull()
    const answered = planned({ mass: { progressedBlocks: ['2026-08-17'] } })
    expect(progressionPending(answered, when)).toBeNull()
  })

  it('keys on the block start date, not the index, so re-planning cannot mis-stamp', () => {
    // Same stamp, a plan whose blocks have been reordered around it.
    const s = planned({ mass: { progressedBlocks: ['2026-08-17'] } })
    expect(progressionPending(s, new Date(2026, 8, 7))).toBeNull()
  })
})

describe('sessionsInBlock', () => {
  it('takes the start date and excludes the end date', () => {
    const all = [
      session('2026-08-16', []), // the Sunday before
      session('2026-08-17', []), // block start
      session('2026-09-06', []), // last day of the block
      session('2026-09-07', []), // next block's first day
    ]
    const got = sessionsInBlock(all, '2026-08-17', '2026-09-07').map((s) => s.date)
    expect(got).toEqual(['2026-08-17', '2026-09-06'])
  })
})

// ---------------------------------------------------------------------------
// The fixture docs/mass-design.md §7 item #5 asks for, and the reason A1 exists.
// ---------------------------------------------------------------------------

describe('the programme actually progresses (the whole point — p.90)', () => {
  const weightOf = (s: Settings, maxes: Record<string, OneRmEntry>, week: number): number => {
    // Week `week`, Monday = an A day: Bench then Squat.
    const plan = sessionFor('gm', week, 0, s, maxes)
    const bench = plan.exercises.find((e) => e.exerciseId === GM_MAIN[0].id)
    return bench!.sets[0].weight!
  }

  it('block 2 prescribes MORE than block 1 once progression is applied', () => {
    const s = planned()
    const before = { [GM_MAIN[0].id]: max(GM_MAIN[0].id, 100) }
    const after = { [GM_MAIN[0].id]: withProgression(before[GM_MAIN[0].id], 2.5) }

    const b1 = weightOf(s, before, 1)
    const b2 = weightOf(s, after, 1)

    // 70% of 100 = 70; 70% of 102.5 = 71.75 → 72.5 on a standard kg bar.
    expect(b1).toBe(70)
    expect(b2).toBeGreaterThan(b1)
    // The bug this test exists for: without Forced Progression the two are equal.
    expect(b2).not.toBe(b1)
  })

  it('four blocks of +2.5 kg compound — block 4 is not block 1', () => {
    const s = planned()
    let entry = max(GM_MAIN[0].id, 100)
    const week1Loads = [entry]
    for (let i = 0; i < 3; i++) {
      entry = withProgression(entry, 2.5)
      week1Loads.push(entry)
    }
    const loads = week1Loads.map((e) => weightOf(s, { [GM_MAIN[0].id]: e }, 1))

    // 1RM 100 / 102.5 / 105 / 107.5, at 70% = 70 / 71.75 / 73.5 / 75.25 kg,
    // loaded on a bar that moves in 2.5 kg steps.
    //
    // Blocks 2 and 3 land on the SAME bar weight, and that is correct rather
    // than a bug: 2.5 kg on the 1RM is only 1.75 kg at 70%, which is smaller
    // than the smallest change the plates can express. The book has the same
    // property in pounds (5 lb on the 1RM is 3.5 lb at 70%, against 5 lb bar
    // steps) and says nothing about it. So the guarantee Forced Progression
    // gives is NON-DECREASING block to block and strictly heavier across the
    // span — not a jump every single block. Do not "fix" this by rounding up.
    expect(loads).toEqual([70, 72.5, 72.5, 75])
    for (let i = 1; i < loads.length; i++) expect(loads[i]).toBeGreaterThanOrEqual(loads[i - 1])
    expect(currentMaxKg(week1Loads[3])).toBe(107.5)
    // The bug A1 exists for: with no progression at all every entry would be 70.
    expect(loads[3]).toBeGreaterThan(loads[0])
    expect(loads).not.toEqual([70, 70, 70, 70])
  })

  it('a struggling lift is left exactly where it was (p.53)', () => {
    const s = planned()
    const entry = max(GM_MAIN[0].id, 100)
    // Struggled → not progressed → identical prescription next block.
    const b1 = weightOf(s, { [GM_MAIN[0].id]: entry }, 1)
    const b2 = weightOf(s, { [GM_MAIN[0].id]: entry }, 1)
    expect(b2).toBe(b1)
  })
})
