import type { Settings, SessionType } from './types'
import { diffDays, parseISO } from './lib/date'
import { BEGINNER_PROTOCOL } from './beginner'
import type { BlockPosition, Protocol, SessionPlan } from './protocol'

// The resolved plan shapes now live in ./protocol so the protocol layer does not
// depend on any one programme. Re-exported here because screens import them from
// this module.
export type { PlannedSet, PlannedExercise, SessionPlan, Protocol } from './protocol'

// ---------------------------------------------------------------------------
// Protocol registry
//
// Was `PHASES: Record<string, PhaseMeta>` where `PhaseMeta` held only
// `{ id, name, lengthWeeks }`, and `sessionFor()` ignored its phase argument and
// always delegated to Beginner. Neither could survive a second programme:
// docs/codebase-map.md §8.2 records five screens importing a hardcoded lift list
// directly, which structurally locked the app to one cluster shape.
//
// Screens should read `PROTOCOLS[id]` — its name, its clusters, its lifting days
// — rather than importing programme data.
// ---------------------------------------------------------------------------
export const PROTOCOLS: Record<string, Protocol> = {
  beginner: BEGINNER_PROTOCOL,
}

export const DEFAULT_PHASE_ID = 'beginner'

/** The protocol for an id, falling back rather than throwing. */
export function protocolFor(phaseId: string | undefined): Protocol {
  return (phaseId && PROTOCOLS[phaseId]) || PROTOCOLS[DEFAULT_PHASE_ID]
}

export interface Position extends BlockPosition {
  phaseId: string
  status: 'before' | 'active' | 'complete'
}

/**
 * 0-based index of the lifting session on `day` of `week` within the block, or
 * -1 when `day` is not a lifting day.
 *
 * Grey Man's A/B alternation reads this and nothing else — see the note on
 * `BlockPosition.liftingOrdinal` for why day-of-week and week parity are both
 * wrong.
 */
export function liftingOrdinalFor(protocol: Protocol, week: number, day: number): number {
  const idx = protocol.liftingDays.indexOf(day)
  if (idx < 0) return -1
  return (week - 1) * protocol.liftingDays.length + idx
}

/** Where are we in the current phase, given the start date and today? */
export function resolvePosition(settings: Settings, when: Date): Position {
  const start = parseISO(settings.phaseStartDate)
  const d = diffDays(when, start)
  const protocol = protocolFor(settings.currentPhaseId)
  const phaseId = protocol.id
  if (d < 0) return { phaseId, week: 1, day: 0, liftingOrdinal: liftingOrdinalFor(protocol, 1, 0), status: 'before' }
  const week = Math.floor(d / 7) + 1
  const day = ((d % 7) + 7) % 7
  if (week > protocol.blockWeeks) {
    const last = protocol.blockWeeks
    return {
      phaseId,
      week: last,
      day: 6,
      liftingOrdinal: liftingOrdinalFor(protocol, last, 6),
      status: 'complete',
    }
  }
  return { phaseId, week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day), status: 'active' }
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
  const parts = [protocolFor(phaseId).name, `Wk${week}`]
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
  phaseId: string,
  week: number,
  day: number,
  settings: Settings,
): SessionPlan {
  const protocol = protocolFor(phaseId)
  return protocol.sessionFor(
    { week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day) },
    settings,
  )
}
