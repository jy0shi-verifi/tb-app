/**
 * Bridge Week — MASS pp.92–93.
 *
 *   "Bridge Week or bridging is simply taking a week off in between Blocks. Also
 *    known as deloading/deload week." (p.92)
 *
 * It serves two purposes (p.92): recovery/supercompensation, and an opportunity
 * to test 1RMs for the upcoming block — "if required".
 */
import type { BlockPosition, Protocol, SessionPlan } from '../protocol'

export const BRIDGE_WEEKS = 1

/**
 * The p.92 layout: `Rest Rest Rest Test Test Rest Rest`.
 *
 * "You can test 1RMs on Day 4, Day 5, or both. If testing is required… If no 1RM
 *  testing is required than Test Days become Rest Days." (p.93)
 *
 * Testing is rarely required — "only required once before you start the protocol,
 * and maybe before your first Specificity block" (p.93) — so the app offers the
 * test days rather than demanding them.
 */
const TEST_DAYS = [3, 4] // Day 4 and Day 5, in 0=Mon..6=Sun

const ALLOWED =
  'Walking, hiking, swimming, yoga and stretching are all good-to-go. Easy bodyweight circuits are allowed. Avoid weights, HIC and E. (p.93)'

export function bridgeSessionFor(pos: BlockPosition): SessionPlan {
  if (TEST_DAYS.includes(pos.day)) {
    return {
      type: 'rest',
      title: 'Bridge — test day (optional)',
      detail: `Test 1RMs for the next block if you need to. Testing is only required before you start the protocol, and maybe before your first Specificity block (p.93) — otherwise this is a rest day. ${ALLOWED}`,
      exercises: [],
    }
  }
  return {
    type: 'rest',
    title: 'Bridge — rest',
    detail: `A week off between blocks, so the work you have put in can come to fruition (p.92). ${ALLOWED}`,
    exercises: [],
  }
}

export const BRIDGE_PROTOCOL: Protocol = {
  id: 'bridge',
  name: 'Bridge Week',
  family: 'base',
  // A bridge week trains nothing, so it needs no maxes; it shares the MASS scope
  // so a test taken during it lands where the next block will look for it.
  maxScope: 'mass',
  blockWeeks: BRIDGE_WEEKS,
  liftingDays: [],
  conditioning: 'none',
  clusters: {},
  sessionFor: bridgeSessionFor,
}
