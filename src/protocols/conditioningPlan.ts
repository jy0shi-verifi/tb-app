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
import type { BlockPosition, Protocol, SessionPlan } from '../protocol'
import {
  conditioningById,
  defaultConditioningDays,
  perWeekFor,
  sessionsFor,
  type ConditioningSession,
} from './conditioning'

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

/** Which named session runs on a given weekday. */
export function conditioningPickFor(
  protocol: Protocol,
  settings: Settings,
  day: number,
): ConditioningSession | undefined {
  const options = sessionsFor(protocol.conditioning)
  if (!options.length) return undefined
  const id = settings.mass?.conditioningPick?.[day]
  return (id && conditioningById(id)) || options[0]
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
