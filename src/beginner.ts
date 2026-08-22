// Beginner Mode — a proven novice on-ramp: dumbbell Linear Progression (double
// progression, StrengthLog-style A/B full body) + Couch-to-5K (canonical Josh Clark
// 9-week schedule). Runs are time-based intervals (no watch needed).
import type { Interval, LoggedExercise, Settings, SessionLog } from './types'
import type { ClusterExercise, PlannedExercise, Protocol, SessionPlan } from './protocol'

export type { Interval }

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

// Running is owned by Runna — the app just tracks it. A run day is a simple slot
// that auto-fills from Strava once Runna syncs the run (no in-app plan/timer).
// (The C25K interval machinery below stays available but is no longer prescribed.)
function runPlan(): SessionPlan {
  return {
    type: 'run',
    title: 'Run',
    detail:
      'Your run for today — follow your Runna plan. It logs here automatically once it syncs from Strava, or tap Mark complete.',
    exercises: [],
  }
}

export function beginnerSessionFor(week: number, day: number, settings: Settings): SessionPlan {
  if (LIFT_DAYS.includes(day)) return liftPlan(week, day, settings)
  if (RUN_DAYS.includes(day)) return runPlan()
  return { type: 'rest', title: 'Rest', detail: 'Recovery is training too.', exercises: [] }
}

/** The beginner-lift id for an exercise name (or undefined if it isn't an LP lift). */
export function beginnerLiftId(name: string): string | undefined {
  return ALL_BEGINNER_LIFTS.find((l) => l.name === name)?.id
}

/** Per-set summary (weight used + best reps) of a logged exercise, newest-first. */
function liftHistory(sessions: SessionLog[], liftName: string, before?: string) {
  return sessions
    .filter((s) => s.type === 'lift' && (before ? s.date < before : true))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
    .map((s) => s.exercises.find((e) => e.name === liftName))
    .filter((e): e is LoggedExercise => !!e)
    .map((e) => {
      const done = e.sets.filter((x) => x.reps > 0)
      return {
        weight: Math.max(0, ...done.map((x) => x.weight ?? 0)),
        bestReps: Math.max(0, ...done.map((x) => x.reps)),
      }
    })
    .filter((r) => r.weight > 0)
}

/**
 * A beginner lift has STALLED when its last `window` logged sessions were all at the
 * current working weight and the top-set reps stopped improving (and never reached the
 * top of the range, which would instead earn a +2 kg bump). Returns a suggested deload
 * weight (~10% off, rounded to the DB increment, ≥ one increment), or null. The other
 * half of double progression: when you can't go up, drop back and rebuild.
 */
export function beginnerStall(
  sessions: SessionLog[],
  liftName: string,
  workingKg: number,
  inc: number,
  before?: string,
  window = 3,
): { count: number; deloadTo: number } | null {
  if (workingKg <= 0) return null
  const hist = liftHistory(sessions, liftName, before)
  if (hist.length < window) return null
  const win = hist.slice(0, window)
  if (!win.every((r) => r.weight === workingKg)) return null // not a clean run at this weight
  if (win[0].bestReps > win[window - 1].bestReps) return null // still adding reps → not stalled
  if (win[0].bestReps >= REP_HI) return null // at the top → it bumps, not stalls
  const drop = Math.max(inc, Math.round((workingKg * 0.1) / inc) * inc)
  const deloadTo = Math.max(inc, workingKg - drop)
  if (deloadTo >= workingKg) return null
  return { count: window, deloadTo }
}

export interface BeginnerLiftProgress {
  id: string
  short: string
  name: string
  start: number
  current: number
  delta: number
}

/** Start → current working weight (+delta) per LP lift, for the beginner progress view. */
export function beginnerProgress(sessions: SessionLog[], settings: Settings): BeginnerLiftProgress[] {
  const lifts = sessions.filter((s) => s.type === 'lift').slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  return ALL_BEGINNER_LIFTS.map((l) => {
    const current = settings.beginner?.lifts?.[l.id] ?? l.startKg
    let start = current // fall back to current (delta 0) until there's a logged session
    for (const s of lifts) {
      const ex = s.exercises.find((e) => e.name === l.name)
      const weights = ex?.sets.map((x) => x.weight ?? 0).filter((x) => x > 0)
      if (weights && weights.length) {
        start = Math.max(...weights)
        break
      }
    }
    return { id: l.id, short: l.short, name: l.name, start, current, delta: Math.round((current - start) * 10) / 10 }
  })
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

// ---------------------------------------------------------------------------
// Protocol registration
//
// Beginner is kept as an unadvertised fallback once MASS lands (Josh, 2026-08-22:
// "keep it as a fallback only"), so this is not dead weight. Registering it here
// rather than special-casing it in `program.ts` is the point of the protocol
// layer: dispatch stops being "always call beginnerSessionFor".
//
// Behaviour is unchanged — `sessionFor` below just forwards to the same function
// the app has always called. test/protocol.test.ts pins that.
// ---------------------------------------------------------------------------

const toClusterExercise = (l: BeginnerLift): ClusterExercise => ({
  id: l.id,
  name: l.name,
  short: l.short,
  defaultLoading: 'dumbbell',
})

export const BEGINNER_PROTOCOL: Protocol = {
  id: 'beginner',
  name: 'Beginner',
  family: 'legacy',
  // Open-ended on-ramp: it never "completes", so it has no real block length.
  blockWeeks: 999,
  liftingDays: LIFT_DAYS,
  conditioning: 'none',
  clusters: {
    a: { id: 'a', label: 'Workout A', exercises: LP_A.map(toClusterExercise), editable: false },
    b: { id: 'b', label: 'Workout B', exercises: LP_B.map(toClusterExercise), editable: false },
  },
  sessionFor: (pos, settings) => beginnerSessionFor(pos.week, pos.day, settings),
}
