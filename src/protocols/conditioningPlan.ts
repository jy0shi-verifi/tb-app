/**
 * Placing conditioning sessions in the week.
 *
 * The catalogue lives in `./conditioning`; this decides which days carry one.
 *
 * The book fixes the count and the placement rule but not the specific days:
 *
 *   Green — "Perform 1 to 3 conditioning sessions per week. No more than 3.
 *   Sessions can be conducted on non-lifting or lifting days." (p.99)
 *   Black — "Perform 1 to 2 conditioning sessions per week. No more than 2.
 *   Perform Black sessions on non-lifting days." (p.99)
 *
 * So the app supplies a default inside the book's range and lets the user move
 * it. Two rules are enforced rather than suggested, because the book states them
 * as limits: the weekly count is capped, and a Black session never lands on a
 * lifting day.
 */
import type { Settings } from '../types'
import type { BlockPosition, ConditioningBrief, Protocol, SessionPlan } from '../protocol'
import {
  RECOVERY_RUN_EXEMPT_MIN,
  conditioningById,
  defaultConditioningDays,
  perWeekFor,
  sessionsFor,
  type ConditioningSession,
} from './conditioning'
import type { SessionLog } from '../types'

/** The days this protocol carries conditioning on, clamped to the book's cap. */
export function conditioningDaysFor(protocol: Protocol, settings: Settings): number[] {
  const colour = protocol.conditioning
  if (colour === 'none') return []
  const chosen = settings.mass?.conditioningDays ?? defaultConditioningDays(colour)
  const cap = perWeekFor(colour).max
  const legal =
    colour === 'black' ? chosen.filter((d) => !protocol.liftingDays.includes(d)) : chosen
  return [...new Set(legal)].sort((a, b) => a - b).slice(0, cap)
}

/**
 * Which named session runs on a given weekday.
 *
 * The stored pick is validated against the BLOCK's colour, not just looked up.
 * "Use the Green sessions with General Mass. Use the Black sessions with
 * Specificity" (p.98, p.111) — and a pick survives a change of block, so an id
 * chosen during Specificity would otherwise render a Black session inside a
 * General block (audit A13). A pick of the wrong colour falls back to the
 * colour's first session rather than being honoured.
 */
export function conditioningPickFor(
  protocol: Protocol,
  settings: Settings,
  day: number,
): ConditioningSession | undefined {
  const options = sessionsFor(protocol.conditioning)
  if (!options.length) return undefined
  const id = settings.mass?.conditioningPick?.[day]
  const picked = id ? conditioningById(id) : undefined
  if (picked && picked.colour === protocol.conditioning) return picked
  return options[0]
}

/**
 * The conditioning scheduled for a LIFTING day, or `undefined`.
 *
 * Green may share a day with a lift — "Sessions can be conducted on non-lifting
 * or lifting days" (p.99) — and until this existed the app forbade what the book
 * permits, because `sessionFor` only reached for conditioning when the day
 * resolved to `rest` (audit A4).
 *
 * Black never may: "Perform Black sessions on non-lifting days" (p.99).
 * `conditioningDaysFor` already filters those out, and this re-states the rule
 * rather than trusting that — a colour rule the book prints as a limit should be
 * enforced where it is read, not only where it is written.
 */
export function conditioningBriefFor(
  protocol: Protocol,
  pos: BlockPosition,
  settings: Settings,
): ConditioningBrief | undefined {
  if (protocol.conditioning !== 'green') return undefined
  if (!protocol.liftingDays.includes(pos.day)) return undefined
  if (!conditioningDaysFor(protocol, settings).includes(pos.day)) return undefined
  const s = conditioningPickFor(protocol, settings, pos.day)
  if (!s) return undefined
  return {
    id: s.id,
    name: s.name,
    scheme: s.card.join(' · '),
    detail: s.detail,
    colour: 'green',
  }
}

/**
 * The plan for a conditioning day, or `undefined` if today is not one.
 *
 * Returns `type: 'run'` so the session slots into the existing Strava matching
 * and completion flow — every Green session is a walk, ruck or run, and Josh's
 * runs already arrive from Strava.
 */
export function conditioningSessionFor(
  protocol: Protocol,
  pos: BlockPosition,
  settings: Settings,
): SessionPlan | undefined {
  if (!conditioningDaysFor(protocol, settings).includes(pos.day)) return undefined
  const s = conditioningPickFor(protocol, settings, pos.day)
  if (!s) return undefined
  const colour = protocol.conditioning === 'black' ? 'Black' : 'Green'
  return {
    type: 'run',
    title: s.name,
    scheme: s.card.join(' · '),
    detail: `${colour} conditioning. ${s.detail}${s.alternatives ? ` Alternatives: ${s.alternatives}.` : ''}`,
    exercises: [],
  }
}

// ---------------------------------------------------------------------------
// The weekly allowance — MASS p.99, p.102, p.110, p.111
// ---------------------------------------------------------------------------

export interface ConditioningLoad {
  /** Days in this week the plan puts a conditioning session on. */
  scheduled: number
  /**
   * Sessions the week already contains that the plan did NOT schedule —
   * Josh's Runna work, arriving through `stravaSync`.
   */
  extraCurricular: number
  /** Recovery-run-length efforts excluded by p.102. */
  exempt: number
  /** `scheduled + extraCurricular`. */
  used: number
  min: number
  max: number
  /** True when the week exceeds what the book allows. */
  overCap: boolean
}

/**
 * How much of the week's conditioning allowance is already spoken for.
 *
 * The book counts activity, not intentions:
 *
 *   "Treat any extra activity as conditioning. Anytime you do that
 *    extra-curricular activity it counts as one conditioning session. Cross off
 *    one Green/Black session for that week. You may have to drop Green/Black
 *    completely. So be it." (p.110)
 *
 * This matters more to Josh than to anyone: his running is programmed by Runna
 * and auto-logged from Strava, so his real week could quietly run at double the
 * book's cap while the app showed a tidy two-session plan (audit A12 — the
 * finding the auditors called the one with the most real-world bite for him).
 *
 * The p.102 exemption is honoured: a Recovery-Run-length effort of ten minutes
 * or less, of the kind used either side of a lift, does not count — "two of them
 * still count as zero sessions".
 *
 * Counted by ACTIVITY, not by `type === 'run'` alone, and only for sessions the
 * plan did not already schedule, so a scheduled Green session that Strava then
 * enriches is not double-counted.
 */
export function conditioningLoad(
  protocol: Protocol,
  settings: Settings,
  weekSessions: SessionLog[],
): ConditioningLoad {
  const days = conditioningDaysFor(protocol, settings)
  const cap = perWeekFor(protocol.conditioning)

  let extraCurricular = 0
  let exempt = 0
  for (const s of weekSessions) {
    // Only cardio-shaped work counts against a conditioning allowance.
    if (s.type !== 'run' && s.type !== 'hic') continue
    if (!s.done) continue
    // Already part of the plan for that day — counted in `scheduled`.
    if (days.includes(s.day)) continue
    if (s.durationMin != null && s.durationMin <= RECOVERY_RUN_EXEMPT_MIN) {
      exempt++
      continue
    }
    extraCurricular++
  }

  const scheduled = days.length
  const used = scheduled + extraCurricular
  return {
    scheduled,
    extraCurricular,
    exempt,
    used,
    min: cap.min,
    max: cap.max,
    overCap: used > cap.max,
  }
}
