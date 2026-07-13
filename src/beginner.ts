// Beginner Mode — a proven novice on-ramp: dumbbell Linear Progression (double
// progression, StrengthLog-style A/B full body) + Couch-to-5K (canonical Josh Clark
// 9-week schedule). Runs are time-based intervals (no watch needed).
import type { LoggedExercise, Settings } from './types'
import type { PlannedExercise, SessionPlan } from './program'

export interface BeginnerLift {
  id: string
  name: string
  short: string
  startKg: number // per dumbbell
  step: number // kg added when the top of the rep range is cleared on all sets
}

// StrengthLog beginner dumbbell program, adapted (verified proven — see chat sources)
export const LP_A: BeginnerLift[] = [
  { id: 'bg_squat', name: 'Goblet / Front-rack Squat', short: 'Squat', startKg: 10, step: 2 },
  { id: 'bg_bench', name: 'DB Bench Press', short: 'Bench', startKg: 8, step: 2 },
  { id: 'bg_row', name: '1-Arm DB Row', short: 'Row', startKg: 8, step: 2 },
]
export const LP_B: BeginnerLift[] = [
  { id: 'bg_rdl', name: 'DB Romanian Deadlift', short: 'RDL', startKg: 10, step: 2 },
  { id: 'bg_lunge', name: 'DB Reverse Lunge', short: 'Lunge', startKg: 8, step: 2 },
  { id: 'bg_ohp', name: 'DB Overhead Press', short: 'OHP', startKg: 6, step: 2 },
]
export const ALL_BEGINNER_LIFTS = [...LP_A, ...LP_B]
export const REP_LO = 8
export const REP_HI = 12

export function defaultBeginnerWeights(): Record<string, number> {
  return Object.fromEntries(ALL_BEGINNER_LIFTS.map((l) => [l.id, l.startKg]))
}

/** Working weight (kg/DB) for a lift — the stored LP weight, or its start default. */
export function workingKg(l: BeginnerLift, settings: Settings): number {
  return settings.beginner?.lifts?.[l.id] ?? l.startKg
}

// ---------------------------------------------------------------------------
// Couch-to-5K — canonical Josh Clark schedule. Each workout = a 5-min brisk-walk
// warm-up then a sequence of jog/walk intervals (seconds).
// ---------------------------------------------------------------------------
export interface Interval {
  kind: 'walk' | 'jog'
  sec: number
}
const WARMUP: Interval = { kind: 'walk', sec: 300 }
const jog = (sec: number): Interval => ({ kind: 'jog', sec })
const walk = (sec: number): Interval => ({ kind: 'walk', sec })
const rep = (n: number, ...seq: Interval[]): Interval[] => Array.from({ length: n }, () => seq).flat()

// weeks 1–4 & 7–9: all three runs identical; weeks 5–6 differ per run (index 0/1/2)
const C25K: Record<number, Interval[] | Interval[][]> = {
  1: [WARMUP, ...rep(8, jog(60), walk(90))],
  2: [WARMUP, ...rep(6, jog(90), walk(120))],
  3: [WARMUP, ...rep(2, jog(90), walk(90), jog(180), walk(180))],
  4: [WARMUP, jog(180), walk(90), jog(300), walk(150), jog(180), walk(90), jog(300)],
  5: [
    [WARMUP, jog(300), walk(180), jog(300), walk(180), jog(300)],
    [WARMUP, jog(480), walk(300), jog(480)],
    [WARMUP, jog(1200)],
  ],
  6: [
    [WARMUP, jog(300), walk(180), jog(480), walk(180), jog(300)],
    [WARMUP, jog(600), walk(180), jog(600)],
    [WARMUP, jog(1500)],
  ],
  7: [WARMUP, jog(1500)],
  8: [WARMUP, jog(1680)],
  9: [WARMUP, jog(1800)],
}

/** The C25K workout for a given programme week (1+) and run-of-the-week (0,1,2). */
export function c25kWorkout(week: number, runIndex: number): Interval[] {
  if (week > 9) return [WARMUP, jog(1800)] // graduated — hold a 30-min easy run
  const w = C25K[Math.max(1, week)]
  return Array.isArray(w[0]) ? (w as Interval[][])[runIndex] : (w as Interval[])
}

function intervalSummary(iv: Interval[]): string {
  const jogTotal = iv.filter((i) => i.kind === 'jog').reduce((n, i) => n + i.sec, 0)
  const total = iv.reduce((n, i) => n + i.sec, 0)
  const cont = iv.length === 2 && iv[1].kind === 'jog'
  return cont
    ? `5-min walk, then a ${Math.round(iv[1].sec / 60)}-min continuous run.`
    : `5-min brisk-walk warm-up, then ${Math.round(jogTotal / 60)} min of jogging in intervals (~${Math.round(total / 60)} min total). Keep the jog easy — you should be able to talk.`
}

// ---------------------------------------------------------------------------
// Weekly template: Mon/Wed/Fri = strength (A/B alternating), Tue/Thu/Sat = C25K,
// Sun = rest.
// ---------------------------------------------------------------------------
const LIFT_DAYS = [0, 2, 4] // Mon Wed Fri
const RUN_DAYS = [1, 3, 5] // Tue Thu Sat

/** Which strength day (A or B) — alternates across every lift session (StrengthLog). */
export function beginnerDayLetter(week: number, day: number): 'A' | 'B' {
  const posInWeek = LIFT_DAYS.indexOf(day) // 0,1,2
  const liftIndex = (week - 1) * 3 + Math.max(0, posInWeek)
  return liftIndex % 2 === 0 ? 'A' : 'B'
}

function liftPlan(week: number, day: number, settings: Settings): SessionPlan {
  const letter = beginnerDayLetter(week, day)
  const lifts = letter === 'A' ? LP_A : LP_B
  const exercises: PlannedExercise[] = lifts.map((l) => ({
    name: l.name,
    loaded: true,
    sets: Array.from({ length: 3 }, () => ({ reps: REP_LO, weight: workingKg(l, settings), perDumbbell: true })),
  }))
  return {
    type: 'lift',
    title: `Strength — Day ${letter}`,
    scheme: '3 × 8–12',
    detail:
      'Double progression: add reps each session; once you hit 12 on all 3 sets, add 2 kg per dumbbell next time and drop back to 8. Rest ~2 min between sets.',
    exercises,
  }
}

function runPlan(week: number, day: number): SessionPlan {
  const runIndex = Math.max(0, RUN_DAYS.indexOf(day))
  const c25kWeek = Math.min(week, 9)
  const iv = c25kWorkout(week, runIndex)
  const graduated = week > 9
  return {
    type: 'run',
    title: graduated ? 'Easy Run' : `C25K · Week ${c25kWeek} · Run ${runIndex + 1}`,
    scheme: graduated ? '30 min easy' : undefined,
    detail: graduated
      ? "You've finished Couch-to-5K 🎉 — hold a 30-min easy run, or ask Claude to set up an advanced running plan."
      : intervalSummary(iv),
    intervals: iv,
    exercises: [],
  }
}

export function beginnerSessionFor(week: number, day: number, settings: Settings): SessionPlan {
  if (LIFT_DAYS.includes(day)) return liftPlan(week, day, settings)
  if (RUN_DAYS.includes(day)) return runPlan(week, day)
  return { type: 'rest', title: 'Rest', detail: 'Recovery is training too.', exercises: [] }
}

/**
 * Apply double progression after a finished strength session: keep the weight the
 * athlete actually used, and bump it by the lift's step once every set hit the top
 * of the range (12). Returns the new working-weights map (or null if nothing to do).
 */
export function applyBeginnerProgress(
  settings: Settings,
  letter: 'A' | 'B',
  logged: LoggedExercise[],
): Record<string, number> | null {
  const lifts = letter === 'A' ? LP_A : LP_B
  const next: Record<string, number> = { ...(settings.beginner?.lifts ?? defaultBeginnerWeights()) }
  let changed = false
  logged.forEach((ex, i) => {
    const l = lifts[i]
    if (!l) return
    const doneSets = ex.sets.filter((s) => s.done && s.reps > 0)
    if (doneSets.length === 0) return
    // the weight actually used (most recent non-empty set) — respects mid-session edits
    const used = doneSets[doneSets.length - 1].weight ?? workingKg(l, settings)
    const clearedTop = doneSets.length >= 3 && doneSets.every((s) => s.reps >= REP_HI)
    const nk = clearedTop ? used + l.step : used
    if (nk !== next[l.id]) {
      next[l.id] = nk
      changed = true
    }
  })
  return changed ? next : null
}
