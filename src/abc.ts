// Dumbbell A/B/C — a minimalist 3-day full-body dumbbell split (Mon/Wed/Fri),
// double progression per lift (StrengthLog-style), with running owned by Runna on
// the off days. Mirrors the shape of beginner.ts so it plugs into the same screens.
import type { LoggedExercise, Settings, SessionLog } from './types'
import type { PlannedExercise, SessionPlan } from './program'
import { lastPerformance } from './lib/stats'

export interface AbcLift {
  id: string
  name: string
  short: string
  startKg: number // per dumbbell
  step: number // kg added when the top of the rep range is cleared on all sets
  repLo: number
  repHi: number
  /** per-limb note shown under the exercise (e.g. "each leg") */
  unit?: 'leg' | 'arm'
}

// The six movements. Each is a single tracked lift id, so its working weight is
// shared across every day it appears (bench progresses whether logged on A or B).
const SPLIT: AbcLift = { id: 'abc_split', name: 'Bulgarian Split Squat', short: 'Split Sq', startKg: 8, step: 2, repLo: 8, repHi: 12, unit: 'leg' }
const BENCH: AbcLift = { id: 'abc_bench', name: 'DB Bench Press', short: 'Bench', startKg: 10, step: 2, repLo: 8, repHi: 12 }
const ROW: AbcLift = { id: 'abc_row', name: '1-Arm DB Row', short: 'Row', startKg: 10, step: 2, repLo: 8, repHi: 12, unit: 'arm' }
const OHP: AbcLift = { id: 'abc_ohp', name: 'DB Overhead Press', short: 'OHP', startKg: 6, step: 2, repLo: 8, repHi: 12 }
const LAT: AbcLift = { id: 'abc_lat', name: 'DB Lateral Raise', short: 'Lat Raise', startKg: 5, step: 2, repLo: 12, repHi: 15 }
const CURL: AbcLift = { id: 'abc_curl', name: 'DB Curl', short: 'Curl', startKg: 8, step: 2, repLo: 8, repHi: 12 }

// Day templates (by weekday): A=Mon, B=Wed, C=Fri.
const DAY_A: AbcLift[] = [SPLIT, BENCH, ROW, OHP]
const DAY_B: AbcLift[] = [SPLIT, BENCH, ROW, LAT]
const DAY_C: AbcLift[] = [OHP, ROW, LAT, CURL]

export const ABC_LIFTS: AbcLift[] = [SPLIT, BENCH, ROW, OHP, LAT, CURL]

// Mon/Wed/Fri = strength (A/B/C); Tue/Thu/Sat = Runna run; Sun = rest.
const LIFT_DAYS: Record<number, 'A' | 'B' | 'C'> = { 0: 'A', 2: 'B', 4: 'C' }
const RUN_DAYS = [1, 3, 5] // Tue Thu Sat

export function defaultAbcWeights(): Record<string, number> {
  return Object.fromEntries(ABC_LIFTS.map((l) => [l.id, l.startKg]))
}

/**
 * Starting working weights when switching INTO A/B/C: for any movement already in the
 * training log (bench, row, overhead press carry over from Operator/Beginner), start
 * from the most recent weight actually lifted — it's the same lift, so it should be
 * liftable. Movements with no history (split squat, lateral raise, curl) fall back to
 * their light defaults.
 */
export function seedAbcWeights(sessions: SessionLog[]): Record<string, number> {
  const out = defaultAbcWeights()
  for (const l of ABC_LIFTS) {
    const perf = lastPerformance(sessions, l.name, '9999-12-31')
    if (perf?.weight && perf.weight > 0) out[l.id] = perf.weight
  }
  return out
}

/** Working weight (kg/DB) for a lift — the stored LP weight, or its start default. */
export function abcWorkingKg(l: AbcLift, settings: Settings): number {
  return settings.abc?.lifts?.[l.id] ?? l.startKg
}

/** Which strength day (A/B/C) a weekday is, or null for a non-lift day. */
export function abcDayLetter(day: number): 'A' | 'B' | 'C' | null {
  return LIFT_DAYS[day] ?? null
}

/** The lifts (in order) for a given weekday's strength session, or [] if none. */
export function abcLiftsForDay(day: number): AbcLift[] {
  const letter = LIFT_DAYS[day]
  return letter === 'A' ? DAY_A : letter === 'B' ? DAY_B : letter === 'C' ? DAY_C : []
}

function schemeFor(lifts: AbcLift[]): string {
  const ranges = lifts.map((l) => `${l.repLo}–${l.repHi}`)
  if (ranges.every((r) => r === ranges[0])) return `3 × ${ranges[0]}`
  const lo = Math.min(...lifts.map((l) => l.repLo))
  const hi = Math.max(...lifts.map((l) => l.repHi))
  return `3 sets · ${lo}–${hi} reps`
}

function liftPlan(day: number, settings: Settings): SessionPlan {
  const letter = LIFT_DAYS[day]!
  const lifts = abcLiftsForDay(day)
  const exercises: PlannedExercise[] = lifts.map((l) => ({
    name: l.name,
    note: l.unit ? `each ${l.unit} · aim ${l.repLo}–${l.repHi} reps` : `aim ${l.repLo}–${l.repHi} reps`,
    loaded: true,
    sets: Array.from({ length: 3 }, () => ({ reps: l.repLo, weight: abcWorkingKg(l, settings), perDumbbell: true })),
  }))
  return {
    type: 'lift',
    title: `Strength — Day ${letter}`,
    scheme: schemeFor(lifts),
    detail:
      'Double progression: add reps each session; once you hit the top of a lift’s range on all 3 sets, add one dumbbell increment next time and drop back to the bottom. Rest ~2 min between sets.',
    exercises,
  }
}

// Running is owned by Runna — the app just tracks it. A run day auto-fills from
// Strava once Runna syncs the run (no in-app plan/timer), mirroring beginner mode.
function runPlan(): SessionPlan {
  return {
    type: 'run',
    title: 'Run',
    detail:
      'Your run for today — follow your Runna plan. It logs here automatically once it syncs from Strava, or tap Mark complete.',
    exercises: [],
  }
}

export function abcSessionFor(_week: number, day: number, settings: Settings): SessionPlan {
  if (LIFT_DAYS[day]) return liftPlan(day, settings)
  if (RUN_DAYS.includes(day)) return runPlan()
  return { type: 'rest', title: 'Rest', detail: 'Recovery is training too.', exercises: [] }
}

/** The A/B/C lift meta for an exercise name (or undefined if it isn't one). */
export function abcLiftMeta(name: string): AbcLift | undefined {
  return ABC_LIFTS.find((l) => l.name === name)
}

/** The A/B/C lift id for an exercise name (or undefined if it isn't an LP lift). */
export function abcLiftId(name: string): string | undefined {
  return abcLiftMeta(name)?.id
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
 * An A/B/C lift has STALLED when its last `window` logged sessions were all at the
 * current working weight and the top-set reps stopped improving (and never reached the
 * top of that lift's range, which would instead earn a +step bump). Returns a suggested
 * deload weight (~10% off, rounded to the DB increment), or null.
 */
export function abcStall(
  sessions: SessionLog[],
  liftName: string,
  workingKg: number,
  inc: number,
  before?: string,
  window = 3,
): { count: number; deloadTo: number } | null {
  const meta = abcLiftMeta(liftName)
  if (!meta || workingKg <= 0) return null
  const hist = liftHistory(sessions, liftName, before)
  if (hist.length < window) return null
  const win = hist.slice(0, window)
  if (!win.every((r) => r.weight === workingKg)) return null // not a clean run at this weight
  if (win[0].bestReps > win[window - 1].bestReps) return null // still adding reps → not stalled
  if (win[0].bestReps >= meta.repHi) return null // at the top → it bumps, not stalls
  const drop = Math.max(inc, Math.round((workingKg * 0.1) / inc) * inc)
  const deloadTo = Math.max(inc, workingKg - drop)
  if (deloadTo >= workingKg) return null
  return { count: window, deloadTo }
}

/**
 * Apply double progression after a finished A/B/C session: keep the weight the athlete
 * actually used, and bump it by the lift's step once every set hit the top of that
 * lift's range. Returns the new working-weights map (or null if nothing to do).
 */
export function applyAbcProgress(
  settings: Settings,
  day: number,
  logged: LoggedExercise[],
): Record<string, number> | null {
  const lifts = abcLiftsForDay(day)
  if (!lifts.length) return null
  const next: Record<string, number> = { ...(settings.abc?.lifts ?? defaultAbcWeights()) }
  let changed = false
  logged.forEach((ex, i) => {
    const l = lifts[i]
    if (!l) return
    const doneSets = ex.sets.filter((s) => s.done && s.reps > 0)
    if (doneSets.length === 0) return
    // the weight actually used (most recent non-empty set) — respects mid-session edits
    const used = doneSets[doneSets.length - 1].weight ?? abcWorkingKg(l, settings)
    const clearedTop = doneSets.length >= 3 && doneSets.every((s) => s.reps >= l.repHi)
    const nk = clearedTop ? used + l.step : used
    if (nk !== next[l.id]) {
      next[l.id] = nk
      changed = true
    }
  })
  return changed ? next : null
}

export interface AbcLiftProgress {
  id: string
  short: string
  name: string
  start: number
  current: number
  delta: number
}

/** Start → current working weight (+delta) per A/B/C lift, for the History progress view. */
export function abcProgress(sessions: SessionLog[], settings: Settings): AbcLiftProgress[] {
  const lifts = sessions.filter((s) => s.type === 'lift').slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  return ABC_LIFTS.map((l) => {
    const current = settings.abc?.lifts?.[l.id] ?? l.startKg
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
