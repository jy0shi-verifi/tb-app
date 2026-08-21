import type { Settings, SessionType } from './types'
import { diffDays, parseISO } from './lib/date'
import { beginnerSessionFor, type Interval } from './beginner'

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
  /** Time-based run/walk intervals, if this session prescribes them. */
  intervals?: Interval[]
}

export interface PhaseMeta {
  id: string
  name: string
  lengthWeeks: number
}

// ---------------------------------------------------------------------------
// Phase registry + resolver
//
// The Tactical Barbell phases (Base Building, Operator) that used to live here
// were removed: they were written without being verified against the books and
// are being rebuilt from scratch. Beginner is the only programme for now.
// ---------------------------------------------------------------------------
export const PHASES: Record<string, PhaseMeta> = {
  // An open-ended on-ramp, so it never "completes".
  beginner: { id: 'beginner', name: 'Beginner', lengthWeeks: 999 },
}

export const DEFAULT_PHASE_ID = 'beginner'

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
  const phaseId = PHASES[settings.currentPhaseId] ? settings.currentPhaseId : DEFAULT_PHASE_ID
  const phase = PHASES[phaseId]
  if (d < 0) return { phaseId, week: 1, day: 0, status: 'before' }
  const week = Math.floor(d / 7) + 1
  const day = ((d % 7) + 7) % 7
  if (week > phase.lengthWeeks) return { phaseId, week: phase.lengthWeeks, day: 6, status: 'complete' }
  return { phaseId, week, day, status: 'active' }
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
 * e.g. "Beginner · Wk2 · Run 2" (the 2nd run of that week). Used to name
 * run days pulled in from Strava (and pushed back to Strava).
 */
export function programSessionName(
  phaseId: string,
  week: number,
  day: number,
  type: SessionType,
  settings: Settings,
): string {
  const parts = [PHASES[phaseId]?.name ?? phaseId, `Wk${week}`]
  // ordinal of this session type within the week (Tue run = 1, Thu run = 2, …)
  let ordinal = 0
  for (let d = 0; d <= day; d++) {
    if (sessionFor(phaseId, week, d, settings).type === type) ordinal++
  }
  parts.push(`${TYPE_LABEL[type]} ${ordinal}`)
  return parts.join(' · ')
}

/** The session plan for a given phase/week/day. */
export function sessionFor(
  _phaseId: string,
  week: number,
  day: number,
  settings: Settings,
): SessionPlan {
  return beginnerSessionFor(week, day, settings)
}
