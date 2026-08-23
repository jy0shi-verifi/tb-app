import type { Settings, SessionType } from './types'
import { diffDays, parseISO } from './lib/date'
import { BEGINNER_PROTOCOL } from './beginner'
import { GREY_MAN_PROTOCOL } from './protocols/greyman'
import { BRIDGE_PROTOCOL } from './protocols/bridge'
import { conditioningSessionFor } from './protocols/conditioningPlan'
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
  bridge: BRIDGE_PROTOCOL,
}

/** Protocols a user can actually choose to run, in a sensible order. */
export const SELECTABLE_PROTOCOLS: Protocol[] = [GREY_MAN_PROTOCOL, BEGINNER_PROTOCOL]

export const DEFAULT_PHASE_ID = 'beginner'

/** The protocol for an id, falling back rather than throwing. */
export function protocolFor(phaseId: string | undefined): Protocol {
  return (phaseId && PROTOCOLS[phaseId]) || PROTOCOLS[DEFAULT_PHASE_ID]
}

export interface Position extends BlockPosition {
  phaseId: string
  status: 'before' | 'active' | 'complete'
  /** Index into `settings.plan.blocks`, or -1 when running without a plan. */
  blockIndex: number
  /** How many blocks the plan holds; 0 without a plan. */
  blockCount: number
}

export interface PlannedBlock {
  protocolId: string
  weeks: number
}

/** The default first cycle: four 3-week Grey Man blocks, bridged, then repeat. */
export function defaultPlan(startDate: string): NonNullable<Settings['plan']> {
  return {
    startDate,
    blocks: [
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
    ],
  }
}

/** Total weeks a plan spans. */
export const planWeeks = (blocks: PlannedBlock[]): number =>
  blocks.reduce((n, b) => n + Math.max(1, b.weeks), 0)

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

/**
 * Where are we today?
 *
 * Two modes. With `settings.plan` we walk the block sequence — that is what MASS
 * needs, because a phase is several 3-week blocks with bridge weeks between
 * them. Without a plan we fall back to the original single open-ended phase,
 * which is what Beginner has always used and what every existing install and
 * e2e fixture still carries.
 */
export function resolvePosition(settings: Settings, when: Date): Position {
  const plan = settings.plan
  if (plan?.blocks?.length) return resolveInPlan(plan, when)

  const start = parseISO(settings.phaseStartDate)
  const d = diffDays(when, start)
  const protocol = protocolFor(settings.currentPhaseId)
  const phaseId = protocol.id
  const base = { phaseId, blockIndex: -1, blockCount: 0 }
  if (d < 0)
    return { ...base, week: 1, day: 0, liftingOrdinal: liftingOrdinalFor(protocol, 1, 0), status: 'before' }
  const week = Math.floor(d / 7) + 1
  const day = ((d % 7) + 7) % 7
  if (week > protocol.blockWeeks) {
    const last = protocol.blockWeeks
    return {
      ...base,
      week: last,
      day: 6,
      liftingOrdinal: liftingOrdinalFor(protocol, last, 6),
      status: 'complete',
    }
  }
  return { ...base, week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day), status: 'active' }
}

function resolveInPlan(plan: NonNullable<Settings['plan']>, when: Date): Position {
  const blocks = plan.blocks
  const d = diffDays(when, parseISO(plan.startDate))
  const day = ((d % 7) + 7) % 7
  const blockCount = blocks.length

  if (d < 0) {
    const p = protocolFor(blocks[0].protocolId)
    return {
      phaseId: p.id,
      week: 1,
      day: 0,
      liftingOrdinal: liftingOrdinalFor(p, 1, 0),
      status: 'before',
      blockIndex: 0,
      blockCount,
    }
  }

  const weekIndex = Math.floor(d / 7) // 0-based across the whole plan
  let acc = 0
  for (let i = 0; i < blocks.length; i++) {
    const len = Math.max(1, blocks[i].weeks)
    if (weekIndex < acc + len) {
      const p = protocolFor(blocks[i].protocolId)
      const week = weekIndex - acc + 1
      return {
        phaseId: p.id,
        week,
        day,
        liftingOrdinal: liftingOrdinalFor(p, week, day),
        status: 'active',
        blockIndex: i,
        blockCount,
      }
    }
    acc += len
  }

  // Past the end of the plan — hold on its last day rather than falling over.
  const last = blocks[blocks.length - 1]
  const p = protocolFor(last.protocolId)
  const week = Math.max(1, last.weeks)
  return {
    phaseId: p.id,
    week,
    day: 6,
    liftingOrdinal: liftingOrdinalFor(p, week, 6),
    status: 'complete',
    blockIndex: blocks.length - 1,
    blockCount,
  }
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
  const pos = { week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day) }
  const plan = protocol.sessionFor(pos, ctx)
  // Conditioning is a property of the block (p.20). A protocol that carries a
  // colour fills its rest days with the matching session rather than leaving
  // them blank — but never displaces a lifting day.
  if (plan.type === 'rest' && protocol.conditioning !== 'none') {
    return conditioningSessionFor(protocol, pos, settings) ?? plan
  }
  return plan
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
