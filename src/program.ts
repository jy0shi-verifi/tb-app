import type { Lift, MaxEntry, Settings, SessionType, WaveWeek } from './types'
import { maxToBasis, workingLoad } from './lib/calc'
import { diffDays, parseISO } from './lib/date'

// ---------------------------------------------------------------------------
// Resolved plan shapes (what a screen renders)
// ---------------------------------------------------------------------------
export interface PlannedSet {
  reps: number
  weight?: number // kg per dumbbell
  perDumbbell?: boolean
  overCeiling?: boolean
  underFloor?: boolean
}
export interface PlannedExercise {
  name: string
  note?: string
  loaded: boolean
  sets: PlannedSet[]
}
export interface SessionPlan {
  type: SessionType
  title: string
  scheme?: string
  detail?: string
  exercises: PlannedExercise[]
}

export interface PhaseMeta {
  id: string
  name: string
  lengthWeeks: number
  lifts: Lift[]
  wave?: WaveWeek[]
}

// ---------------------------------------------------------------------------
// Operator (Phase 2)
// ---------------------------------------------------------------------------
export const OPERATOR_LIFTS: Lift[] = [
  { id: 'op_bench', name: 'DB Bench Press', short: 'Bench', progressStep: 2.5 },
  { id: 'op_squat', name: 'Two-DB Front-rack Squat', short: 'Squat', progressStep: 5 },
  { id: 'op_row', name: '1-Arm DB Row', short: 'Row', progressStep: 2.5 },
]

export const OPERATOR_WAVE: WaveWeek[] = [
  { week: 1, pct: 70, sets: 3, reps: 5 },
  { week: 2, pct: 80, sets: 3, reps: 5 },
  { week: 3, pct: 90, sets: 3, reps: 3, note: 'heavy week — rest 3–5 min; easy conditioning week' },
  { week: 4, pct: 75, sets: 3, reps: 5 },
  { week: 5, pct: 85, sets: 3, reps: 3 },
  { week: 6, pct: 95, sets: 3, reps: 2, note: 'heavy week — rest 3–5 min; easy conditioning week' },
]

const mk = (n: number, reps: number, perDumbbell: boolean): PlannedSet[] =>
  Array.from({ length: n }, () => ({ reps, ...(perDumbbell ? { perDumbbell: true } : {}) }))

function operatorLift(
  week: number,
  maxes: Record<string, MaxEntry>,
  settings: Settings,
): SessionPlan {
  const w = OPERATOR_WAVE[(week - 1) % OPERATOR_WAVE.length]
  const exercises: PlannedExercise[] = OPERATOR_LIFTS.map((l) => {
    const entry = maxes[l.id]
    let weight: number | undefined
    let over = false
    let under = false
    if (entry) {
      const bm = maxToBasis(entry, settings.loadBasis)
      const lr = workingLoad(bm, w.pct, settings.dbIncrement)
      weight = lr.kg
      over = lr.overCeiling
      under = lr.underFloor
    }
    return {
      name: l.name,
      loaded: true,
      sets: Array.from({ length: w.sets }, () => ({
        reps: w.reps,
        weight,
        perDumbbell: true,
        overCeiling: over,
        underFloor: under,
      })),
    }
  })
  return {
    type: 'lift',
    title: `Operator — Week ${week}`,
    scheme: `${w.sets}×${w.reps} @ ${w.pct}%`,
    detail: w.note
      ? `Same weight all sets. ${w.note}.`
      : 'Same weight all sets. Rest 2–3 min between sets.',
    exercises,
  }
}

const opRun = (easy = false): SessionPlan => ({
  type: 'run',
  title: 'Easy Run',
  detail: easy
    ? 'Short easy run (easy week). Conversational pace — keep the engine ticking.'
    : 'Easy conversational pace (LSS) — keep the engine ticking.',
  exercises: [],
})
const opHic = (easy = false): SessionPlan => ({
  type: 'hic',
  title: easy ? 'HIC — Easy Week' : 'HIC — Conditioning',
  detail: easy
    ? 'Easy week: halve the rounds / effort. This lands on your heavy lifting week — keep it light.'
    : 'Short Hills / 600m Resets / Fast-5 Tempo. Run each at its prescribed effort; obey the rest.',
  exercises: [],
})
const rest = (): SessionPlan => ({
  type: 'rest',
  title: 'Rest',
  detail: 'Recovery is training too.',
  exercises: [],
})

function operatorDay(
  week: number,
  day: number,
  maxes: Record<string, MaxEntry>,
  settings: Settings,
): SessionPlan {
  // Weeks 3 & 6 are the every-3rd-week EASY conditioning weeks (they land on the
  // heavy 90/95% strength weeks) — the HICs stay but go easy; they are NOT dropped.
  const easy = week === 3 || week === 6
  switch (day) {
    case 0: // Mon lift
    case 2: // Wed lift
    case 4: // Fri lift
      return operatorLift(week, maxes, settings)
    case 1: // Tue HIC
      return opHic(easy)
    case 3: // Thu easy run
      return opRun(easy)
    case 5: // Sat HIC
      return opHic(easy)
    default: // Sun rest
      return rest()
  }
}

// ---------------------------------------------------------------------------
// Base Building (Phase 1) — the book's 7-day TB2 template
//   wks 1–5: Mon SE(3) · Tue E · Wed E · Thu SE(2) · Fri Recovery · Sat long E · Sun Rest
//   wks 6–8: Mon Strength · Tue HIC · Wed Recovery · Thu Strength(/Test) · Fri HIC · Sat E · Sun Rest
// ---------------------------------------------------------------------------
// Easy-run durations (LSS, by time): weekday E vs the deliberate long Saturday E.
const BB_E_WEEKDAY: Record<number, string> = {
  1: '30 min', 2: '40 min', 3: '50 min', 4: '60 min', 5: '45–60 min',
}
const BB_E_LONG: Record<number, string> = {
  1: '35 min', 2: '45 min', 3: '55 min', 4: '60 min', 5: '45–60 min',
}
// SE circuit rep target per week (per exercise). Reps ramp 20 → 50.
const SE_REPS: Record<number, number> = { 1: 20, 2: 30, 3: 40, 4: 50, 5: 50 }
const SE_MOVES: { name: string; loaded: boolean; note?: string }[] = [
  { name: 'Push-ups', loaded: false },
  { name: 'Bodyweight squats', loaded: false, note: 'or light DB goblet' },
  { name: 'Inverted rows on the beam', loaded: false },
  { name: 'DB Romanian Deadlift', loaded: true, note: 'the DBs — light, set once' },
  { name: 'Back extensions / Supermans', loaded: false },
  { name: 'Bicycle crunches', loaded: false, note: 'or a plank hold' },
]

const bbRun = (durLabel: string, long = false): SessionPlan => ({
  type: 'run',
  title: long ? 'Long Easy Run' : 'Easy Run',
  detail: `LSS ${durLabel} — flat, conversational (120–150 bpm). Run-walk as needed; work for time, not distance.${
    long ? ' The deliberate long one.' : ''
  }`,
  exercises: [],
})
const bbSe = (week: number, rounds: number): SessionPlan => {
  const reps = SE_REPS[week] ?? 50
  return {
    type: 'se',
    title: 'SE Circuit',
    scheme: `${rounds} round${rounds > 1 ? 's' : ''} × ${reps}`,
    detail:
      'Circuit: one set of each move in order, short rests (30–120s), ~2 min between rounds. One token weight, set once. Rest-pause to finish the reps.',
    exercises: SE_MOVES.map((m) => ({
      name: m.name,
      note: m.note,
      loaded: m.loaded,
      sets: Array.from({ length: rounds }, () => ({ reps, ...(m.loaded ? { perDumbbell: true } : {}) })),
    })),
  }
}
const bbRecovery = (): SessionPlan => ({
  type: 'rest',
  title: 'Recovery',
  detail: 'Light — mobility, easy walk, stretch, or easy bike/swim. Or just extra rest. Keep it genuinely easy.',
  exercises: [],
})
const bbStrengthIntro = (): SessionPlan => ({
  type: 'lift',
  title: 'Strength Intro',
  scheme: '3 × 5, comfortable',
  detail:
    'Light re-acclimation of your 3 lifts (the book’s weeks 6–8 max-strength is 3–5×5). Comfortable weight, leave 2+ in the tank — groove the movement, ready to test.',
  exercises: [
    { name: 'DB Bench Press', loaded: true, sets: mk(3, 5, true) },
    { name: 'Two-DB Front-rack Squat', loaded: true, sets: mk(3, 5, true) },
    { name: '1-Arm DB Row', loaded: true, sets: mk(3, 5, true) },
    { name: 'Pull-up progression', loaded: false, note: 'beam negatives / inverted rows', sets: mk(3, 5, false) },
  ],
})
const bbTestDay = (): SessionPlan => ({
  type: 'lift',
  title: 'Test Day',
  scheme: 'find your ~5-rep max',
  detail:
    'The big day. For each lift: warm up, then work up to a weight you can do about 5 clean reps on, leaving 1–2 in the tank — stop before form breaks. Note the weight per dumbbell × reps, then enter them in Maxes to unlock Operator.',
  exercises: OPERATOR_LIFTS.map((l) => ({
    name: l.name,
    loaded: true,
    note: 'work up to ~5 hard reps',
    sets: [{ reps: 5, perDumbbell: true }],
  })),
})
const bbHic = (): SessionPlan => ({
  type: 'hic',
  title: 'HIC — Easy Hills',
  detail: 'HIC #1–10 only (aerobic-compatible): easy hills / tempo / resets. Short efforts, walk down to recover.',
  exercises: [],
})

function baseBuildingDay(week: number, day: number): SessionPlan {
  if (week <= 5) {
    // Mon SE(3) · Tue E · Wed E · Thu SE(2) · Fri Recovery · Sat long E · Sun Rest
    switch (day) {
      case 0: // Mon — SE, 3 rounds (1 round on wk4's 50-rep jump)
        return bbSe(week, week === 4 ? 1 : 3)
      case 1: // Tue — easy run
      case 2: // Wed — easy run
        return bbRun(BB_E_WEEKDAY[week] ?? '30–40 min')
      case 3: // Thu — SE, 2 rounds (1 on wk4)
        return bbSe(week, week === 4 ? 1 : 2)
      case 4: // Fri — recovery
        return bbRecovery()
      case 5: // Sat — the long easy run
        return bbRun(BB_E_LONG[week] ?? '45–60 min', true)
      default: // Sun — rest
        return rest()
    }
  }
  // weeks 6–8 (the bridge)
  switch (day) {
    case 0: // Mon — strength
      return bbStrengthIntro()
    case 1: // Tue — HIC #1–10
    case 4: // Fri — HIC #1–10
      return bbHic()
    case 2: // Wed — recovery
      return bbRecovery()
    case 3: // Thu — strength (wk8 = Test Day)
      return week === 8 ? bbTestDay() : bbStrengthIntro()
    case 5: // Sat — easy run
      return bbRun('30–60 min')
    default: // Sun — rest
      return rest()
  }
}

// ---------------------------------------------------------------------------
// Phase registry + resolver
// ---------------------------------------------------------------------------
export const PHASES: Record<string, PhaseMeta> = {
  'base-building': { id: 'base-building', name: 'Base Building', lengthWeeks: 8, lifts: [] },
  operator: { id: 'operator', name: 'Operator', lengthWeeks: 6, lifts: OPERATOR_LIFTS, wave: OPERATOR_WAVE },
}

export function maxesMap(entries: MaxEntry[]): Record<string, MaxEntry> {
  return Object.fromEntries(entries.map((e) => [e.liftId, e]))
}

export interface Position {
  phaseId: string
  week: number // 1-based
  day: number // 0=Mon..6=Sun
  status: 'before' | 'active' | 'complete'
}

/** Where are we in the current phase, given the start date and today? */
export function resolvePosition(settings: Settings, when: Date): Position {
  const start = parseISO(settings.phaseStartDate)
  const d = diffDays(when, start)
  const phase = PHASES[settings.currentPhaseId]
  if (d < 0) return { phaseId: settings.currentPhaseId, week: 1, day: 0, status: 'before' }
  const week = Math.floor(d / 7) + 1
  const day = ((d % 7) + 7) % 7
  if (week > phase.lengthWeeks)
    return { phaseId: settings.currentPhaseId, week: phase.lengthWeeks, day: 6, status: 'complete' }
  return { phaseId: settings.currentPhaseId, week, day, status: 'active' }
}

const TYPE_LABEL: Record<SessionType, string> = {
  lift: 'Lift',
  se: 'SE',
  run: 'Run',
  hic: 'HIC',
  rest: 'Rest',
}

/**
 * A descriptive name that places a synced activity in the programme —
 * e.g. "Operator · Block 1 · Wk2 · HIC 2" (the 2nd HIC of that week). Used to
 * name run/HIC days pulled in from Strava (and pushed back to Strava).
 */
export function programSessionName(
  phaseId: string,
  week: number,
  day: number,
  type: SessionType,
  settings: Settings,
): string {
  const parts = [PHASES[phaseId]?.name ?? phaseId]
  if (phaseId === 'operator' && settings.operatorBlock) parts.push(`Block ${settings.operatorBlock}`)
  parts.push(`Wk${week}`)
  // ordinal of this session type within the week (Tue HIC = 1, Sat HIC = 2, …)
  let ordinal = 0
  for (let d = 0; d <= day; d++) {
    if (sessionFor(phaseId, week, d, {}, settings).type === type) ordinal++
  }
  parts.push(`${TYPE_LABEL[type]} ${ordinal}`)
  return parts.join(' · ')
}

/** The session plan for a given phase/week/day. */
export function sessionFor(
  phaseId: string,
  week: number,
  day: number,
  maxes: Record<string, MaxEntry>,
  settings: Settings,
): SessionPlan {
  if (phaseId === 'operator') return operatorDay(week, day, maxes, settings)
  return baseBuildingDay(week, day)
}
