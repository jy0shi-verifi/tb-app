import type { Settings, SessionType } from './types'
import { addDays, diffDays, isoDate, mondayIndex, parseISO } from './lib/date'
import { BEGINNER_PROTOCOL } from './beginner'
import { GREY_MAN_PROTOCOL } from './protocols/greyman'
import { ALPHA_PROTOCOL } from './protocols/alpha'
import { BRAVO_PROTOCOL } from './protocols/bravo'
import { BRIDGE_PROTOCOL } from './protocols/bridge'
import { conditioningBriefFor, conditioningSessionFor } from './protocols/conditioningPlan'
import type { BlockPosition, Protocol, ProtocolContext, SessionPlan } from './protocol'
import type { OneRmEntry } from './types'
import { PLAN_PRESETS } from './lib/planRules'

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
  alpha: ALPHA_PROTOCOL,
  bravo: BRAVO_PROTOCOL,
  bridge: BRIDGE_PROTOCOL,
}

/** Standalone programmes in Settings. Specificity and Bridge are blocks, not a home programme. */
export const SELECTABLE_PROTOCOLS: Protocol[] = [GREY_MAN_PROTOCOL, BEGINNER_PROTOCOL]

/** What the block planner can append (Bridge is a separate control). */
export const PLAN_BLOCK_PROTOCOLS: Protocol[] = [GREY_MAN_PROTOCOL, ALPHA_PROTOCOL, BRAVO_PROTOCOL]

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
  /**
   * ISO date of week 1, day 0 of the CURRENT block.
   *
   * Screens that lay out a calendar must use this, not `settings.phaseStartDate`
   * — under a plan the latter is a stale leftover, and `Program.tsx` was using it
   * to build its week grid, putting every date and tap target months out.
   */
  blockStartDate: string
}

export interface PlannedBlock {
  protocolId: string
  weeks: number
}

/**
 * The default first cycle — the book's Standard Cycle (p.140), truncated exactly
 * where Specificity would begin.
 *
 * This used to be `gm, gm, bridge, gm, gm`, which moved the bridge to week 7 and
 * dropped the terminal one — an undeclared departure from the printed table
 * (audit A14). It now comes from `PLAN_PRESETS`, so the shape and its page
 * citation live together and a second preset is data rather than a rewrite.
 *
 * The start date is snapped to the Monday on or before the one given: Grey Man's
 * lifting days are fixed at Days 1/3/5 (p.50) and `resolveInPlan` derives the
 * weekday from days-since-start, so a Wednesday start silently rotated the whole
 * training week onto Wed/Fri/Sun while still labelling it "Mon" (audit A16).
 */
export function defaultPlan(startDate: string): NonNullable<Settings['plan']> {
  return { startDate: mondayOnOrBefore(startDate), blocks: [...PLAN_PRESETS[0].blocks] }
}

/**
 * The Monday of the week containing `isoDateStr`.
 *
 * Every plan start goes through this. A plan is a sequence of whole weeks and
 * every protocol names its lifting days by weekday, so a start that is not a
 * Monday does not shift the plan — it rotates it, which is far harder to notice.
 */
export function mondayOnOrBefore(isoDateStr: string): string {
  const d = parseISO(isoDateStr)
  return isoDate(addDays(d, -mondayIndex(d)))
}

/**
 * A block's length, coerced to a whole number of weeks ≥ 1.
 *
 * The planner refuses to SAVE a fractional length (`validatePlan`), but a plan
 * already stored — from an older build, a hand-edited backup, an import — must
 * not be able to blank the app: a 1.5-week block made `week` fractional, and
 * `GM_GRID[1.5]` is `undefined`, so the session screen rendered nothing at all
 * (audit A17). Every read of `weeks` goes through here.
 */
export const blockWeeksOf = (b: PlannedBlock): number => Math.max(1, Math.floor(b.weeks) || 1)

/** Total weeks a plan spans. */
export const planWeeks = (blocks: PlannedBlock[]): number =>
  blocks.reduce((n, b) => n + blockWeeksOf(b), 0)

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
  const base = {
    phaseId,
    blockIndex: -1,
    blockCount: 0,
    blockStartDate: settings.phaseStartDate,
  }
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

  const startOfBlock = (weeksBefore: number): string =>
    isoDate(addDays(parseISO(plan.startDate), weeksBefore * 7))

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
      blockStartDate: startOfBlock(0),
    }
  }

  const weekIndex = Math.floor(d / 7) // 0-based across the whole plan
  let acc = 0
  for (let i = 0; i < blocks.length; i++) {
    const len = blockWeeksOf(blocks[i])
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
        blockStartDate: startOfBlock(acc),
      }
    }
    acc += len
  }

  // Past the end of the plan — hold on its last day rather than falling over.
  const last = blocks[blocks.length - 1]
  const p = protocolFor(last.protocolId)
  const week = blockWeeksOf(last)
  return {
    phaseId: p.id,
    week,
    day: 6,
    liftingOrdinal: liftingOrdinalFor(p, week, 6),
    status: 'complete',
    blockIndex: blocks.length - 1,
    blockCount,
    blockStartDate: startOfBlock(acc - blockWeeksOf(last)),
  }
}

// ---------------------------------------------------------------------------
// Block boundaries — where Forced Progression fires
// ---------------------------------------------------------------------------

/**
 * A block that has finished, and the dates it spanned.
 *
 * `startDate` is the identity used to record that its progression has been
 * handled. The block INDEX is not, because a plan can be appended to and
 * re-planned, whereas the Monday a block began is a fact that never moves.
 */
export interface FinishedBlock {
  index: number
  protocolId: string
  startDate: string
  /** The Monday AFTER the block — exclusive, so it is also the next block's start. */
  endDateExclusive: string
  weeks: number
}

/**
 * The block that has just ended, if one has.
 *
 * Only meaningful under a block plan: without one there is a single open-ended
 * phase and no boundary to fire on. That is Beginner's mode and it has its own
 * progression (double progression, `src/beginner.ts`), which is why this returns
 * null rather than inventing a boundary for it.
 *
 * A Bridge Week is never reported. It trains nothing (p.92), so there is nothing
 * to progress off the back of — and the block before it already fired when the
 * bridge itself began.
 */
export function justFinishedBlock(settings: Settings, when: Date): FinishedBlock | null {
  const plan = settings.plan
  if (!plan?.blocks?.length) return null

  const pos = resolvePosition(settings, when)
  if (pos.status === 'before') return null

  // Past the end of the plan the last block is the one that finished; inside it,
  // the finished block is the one before the current position.
  const index = pos.status === 'complete' ? pos.blockIndex : pos.blockIndex - 1
  if (index < 0) return null

  const b = plan.blocks[index]
  if (!b) return null
  const protocol = protocolFor(b.protocolId)
  if (protocol.liftingDays.length === 0) return null

  let weeksBefore = 0
  for (let i = 0; i < index; i++) weeksBefore += blockWeeksOf(plan.blocks[i])
  const weeks = blockWeeksOf(b)
  const start = addDays(parseISO(plan.startDate), weeksBefore * 7)

  return {
    index,
    protocolId: b.protocolId,
    startDate: isoDate(start),
    endDateExclusive: isoDate(addDays(start, weeks * 7)),
    weeks,
  }
}

/**
 * Whether the block-boundary progression prompt is still outstanding.
 *
 * Recorded per block start date in `settings.mass.progressedBlocks`, which is
 * stamped whether he progressed every lift or none of them: the prompt is a
 * decision point, and "I looked and chose not to" is an answer. Only an explicit
 * "not now" leaves it unstamped.
 */
export function progressionPending(settings: Settings, when: Date): FinishedBlock | null {
  const finished = justFinishedBlock(settings, when)
  if (!finished) return null
  const done = settings.mass?.progressedBlocks ?? []
  return done.includes(finished.startDate) ? null : finished
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
  // Conditioning is a property of the block (p.20). A protocol carrying a colour
  // fills its rest days with the matching session rather than leaving them
  // blank, and — for Green — ALSO rides alongside a lift when the user has put
  // one on a lifting day:
  //
  //   "Sessions can be conducted on non-lifting or lifting days." (p.99, Green)
  //   "Perform Black sessions on non-lifting days."               (p.99, Black)
  //
  // The rest-day branch alone used to be the whole rule, which structurally
  // forbade what the book explicitly permits and made the Plan screen's day
  // picker lie — Grey Man's Mon/Wed/Fri could be lit and produce nothing (A4).
  if (protocol.conditioning === 'none') return plan
  if (plan.type === 'rest') return conditioningSessionFor(protocol, pos, settings) ?? plan
  const alongside = conditioningBriefFor(protocol, pos, settings)
  return alongside ? { ...plan, conditioning: alongside } : plan
}

/**
 * The conditioning session sharing a LIFTING day, as a session plan of its own.
 *
 * `sessionFor` attaches this day's conditioning to the lift as a
 * `ConditioningBrief` — informational, because until backlog F1 the app could
 * store only one row per date and so the Green session had nowhere of its own to
 * be ticked. Two rows per date fixes that, and this is how the second one gets
 * its plan: same session the book prescribes, resolved as a full plan so it can
 * be completed and matched to a Strava activity like any other run.
 *
 * Returns undefined on a rest day, where the conditioning session IS the day's
 * session and `sessionFor` already returns it.
 */
export function conditioningAlongside(
  phaseId: string,
  week: number,
  day: number,
  settings: Settings,
): SessionPlan | undefined {
  const protocol = protocolFor(phaseId)
  if (protocol.conditioning === 'none') return undefined
  const pos = { week, day, liftingOrdinal: liftingOrdinalFor(protocol, week, day) }
  // Gate on the brief, not on the session: `conditioningBriefFor` is what
  // enforces the colour rule ("perform Black sessions on non-lifting days",
  // p.99) and the lifting-day test. Calling the session builder directly would
  // put a Black session alongside a lift.
  if (!conditioningBriefFor(protocol, pos, settings)) return undefined
  return conditioningSessionFor(protocol, pos, settings)
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
