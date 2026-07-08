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
  { week: 3, pct: 90, sets: 3, reps: 3, note: 'heavy week — rest 3–5 min, drop HIC' },
  { week: 4, pct: 75, sets: 3, reps: 5 },
  { week: 5, pct: 85, sets: 3, reps: 3 },
  { week: 6, pct: 95, sets: 3, reps: 2, note: 'heavy week — rest 3–5 min, drop HIC' },
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

const opRun = (): SessionPlan => ({
  type: 'run',
  title: 'Easy Run',
  detail: 'Easy conversational pace — Black endurance-lean. Keep the engine ticking.',
  exercises: [],
})
const opHic = (): SessionPlan => ({
  type: 'hic',
  title: 'HIC — Conditioning',
  detail: 'Hill sprints / 600m resets / tempo. Hard but short. (Dropped on heavy weeks.)',
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
  const heavy = week === 3 || week === 6
  switch (day) {
    case 0: // Mon
    case 2: // Wed
    case 4: // Fri
      return operatorLift(week, maxes, settings)
    case 1: // Tue
      return heavy ? opRun() : opHic()
    case 3: // Thu
      return opRun()
    case 5: // Sat
      return heavy ? opRun() : opHic()
    default: // Sun
      return rest()
  }
}

// ---------------------------------------------------------------------------
// Base Building (Phase 1)
// ---------------------------------------------------------------------------
const BB_RUN: Record<number, { jog: string; total: string }> = {
  1: { jog: 'Jog 2 min / walk 1 min', total: '30 min' },
  2: { jog: 'Jog 2 min / walk 1 min', total: '30 min' },
  3: { jog: 'Jog 4 min / walk 1 min', total: '30–35 min' },
  4: { jog: 'Jog 4 min / walk 1 min', total: '30–35 min' },
  5: { jog: 'Jog 8–10 min / walk 1–2 min', total: '35 min' },
  6: { jog: 'Jog 8–10 min / walk 1–2 min', total: '35 min' },
  7: { jog: '20–30 min continuous easy jog', total: '~35 min' },
  8: { jog: 'Benchmark: 30 min continuous — record distance', total: '30 min' },
}
const SE_REPS: Record<number, { reps: number; note?: string }> = {
  1: { reps: 10 },
  2: { reps: 20 },
  3: { reps: 30 },
  4: { reps: 20, note: 'shorter rest' },
  5: { reps: 30, note: 'shorter rest' },
}
const SE_MOVES: { name: string; loaded: boolean; note?: string }[] = [
  { name: 'Push-ups', loaded: false },
  { name: 'Bodyweight squats', loaded: false, note: 'or light goblet, one DB' },
  { name: 'Inverted rows on the beam', loaded: false },
  { name: 'DB Romanian Deadlift', loaded: true, note: 'the DBs — one weight, set once' },
  { name: 'Plank + core', loaded: false, note: '30–60s hold' },
]

const bbRun = (week: number): SessionPlan => {
  const r = BB_RUN[week] ?? BB_RUN[8]
  return {
    type: 'run',
    title: 'Easy Run',
    detail: `${r.jog} · ${r.total}. Flat park only, conversational pace — walk whenever you need to.`,
    exercises: [],
  }
}
const bbSe = (week: number): SessionPlan => {
  const { reps, note } = SE_REPS[week] ?? { reps: 30 }
  return {
    type: 'se',
    title: 'SE Circuit',
    scheme: `3 rounds × ${reps}${note ? ` (${note})` : ''}`,
    detail:
      'One weight, set once. Circuit style: one set of each move, short rests (30–90s), 2 min between rounds, 3 rounds.',
    exercises: SE_MOVES.map((m) => ({
      name: m.name,
      note: m.note,
      loaded: m.loaded,
      sets: Array.from({ length: 3 }, () => ({ reps, ...(m.loaded ? { perDumbbell: true } : {}) })),
    })),
  }
}
const bbStrengthIntro = (): SessionPlan => ({
  type: 'lift',
  title: 'Light Strength Intro',
  scheme: '3 × 8, comfortable',
  detail: 'Relearn the lifts light, ready to test at the end of the phase.',
  exercises: [
    { name: 'DB Bench Press', loaded: true, sets: mk(3, 8, true) },
    { name: 'Two-DB Front-rack Squat', loaded: true, sets: mk(3, 8, true) },
    { name: '1-Arm DB Row', loaded: true, sets: mk(3, 8, true) },
    { name: 'Pull-up progression', loaded: false, note: 'beam negatives / inverted rows', sets: mk(3, 8, false) },
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
  detail: 'First taste of the hill. Short efforts, walk down to recover.',
  exercises: [],
})
const bbOptional = (): SessionPlan => ({
  type: 'run',
  title: 'Optional easy run / rest',
  detail: 'A longer easy run (30–45 min) or a full rest — your call.',
  exercises: [],
})

function baseBuildingDay(week: number, day: number): SessionPlan {
  if (week <= 5) {
    switch (day) {
      case 0:
      case 2:
      case 4:
        return bbRun(week)
      case 1:
      case 3:
        return bbSe(week)
      case 5:
        return bbOptional()
      default:
        return rest()
    }
  }
  // weeks 6–8
  switch (day) {
    case 0:
    case 2:
    case 4:
      return bbRun(week)
    case 1:
      return week === 8 ? bbTestDay() : bbStrengthIntro()
    case 3:
      return week >= 7 ? bbHic() : bbRun(week)
    case 5:
      return bbOptional()
    default:
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
