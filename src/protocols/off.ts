/**
 * Time off — not a MASS template. A holiday or a gap you put on the year
 * calendar so later blocks land on the dates you want.
 *
 * It is rest every day. It is not a Bridge Week (pp.92–93): no test days, no
 * deload prescription. resolvePosition must never fall through to Beginner
 * for an unknown id, so this is a real protocol in the registry.
 */
import type { Protocol, SessionPlan } from '../protocol'

export function offSessionFor(): SessionPlan {
  return {
    type: 'rest',
    title: 'Time off',
    detail: 'Nothing prescribed — a gap you placed on the plan so the next block starts when you want.',
    exercises: [],
  }
}

export const OFF_PROTOCOL: Protocol = {
  id: 'off',
  name: 'Time off',
  family: 'off',
  maxScope: 'mass',
  blockWeeks: 0,
  liftingDays: [],
  conditioning: 'none',
  clusters: {},
  sessionFor: offSessionFor,
}
