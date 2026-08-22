import type { Settings, SessionType } from './types'
import { diffDays, parseISO } from './lib/date'
import { BEGINNER_PROTOCOL } from './beginner'
import { GREY_MAN_PROTOCOL } from './protocols/greyman'
import type { BlockPosition, Protocol, ProtocolContext, SessionPlan } from './protocol'
import type { OneRmEntry } from './types'

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
  gm: GREY_MAN_PROTOCOL,
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

/**
 * The session plan for a given phase/week/day.
 *
 * `maxes` is optional so the many existing call sites keep working: a protocol
 * that prescribes percentages (Grey Man) renders honest "set your 1RM" gaps when
 * it is absent, rather than inventing a load. Beginner ignores it entirely — its
 * loads are a linear progression held in `settings.beginner.lifts`.
 *
 * Callers pass the maxes for the protocol's OWN `maxScope`; `narrowMaxes` does
 * that narrowing.
 */
export function sessionFor(
  phaseId: string,
  week: number,
  day: number,
  settings: Settings,
  maxes: Record<string, OneRmEntry> = {},
): SessionPlan {
  const protocol = protocolFor(phaseId)
  const ctx: ProtocolContext = { settings, maxes }
  return protocol.sessionFor(
    { week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day) },
    ctx,
  )
}

/**
 * Narrow a flat list of stored 1RMs to one protocol's scope, keyed by exercise
 * id — the shape `sessionFor` wants.
 *
 * This is where the protocol scoping is actually enforced. Beginner's maxes are
 * kilos per dumbbell and MASS's are total on the bar; handing one to the other
 * would be a silent factor-of-two error on every set.
 */
export function narrowMaxes(rows: OneRmEntry[], protocol: Protocol): Record<string, OneRmEntry> {
  const out: Record<string, OneRmEntry> = {}
  for (const r of rows) if (r.protocolId === protocol.maxScope) out[r.exerciseId] = r
  return out
}
