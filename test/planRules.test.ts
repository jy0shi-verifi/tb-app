import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  PLAN_PRESETS,
  planHasErrors,
  presetBlocks,
  validatePlan,
  type PlanProblem,
} from '../src/lib/planRules'
import { blockWeeksOf, defaultPlan, mondayOnOrBefore, planWeeks, protocolFor, resolvePosition } from '../src/program'
import { DEFAULT_SETTINGS } from '../src/db'
import { parseISO } from '../src/lib/date'
import type { Settings } from '../src/types'

/**
 * The block planner's guardrails — MASS p.40, p.41, p.67, p.92, p.93, pp.140–142.
 *
 * Two tiers, and the tier is decided by whether the book states a FACT or gives
 * ADVICE (docs/mass-design.md §11.4). These tests assert the tier as much as the
 * message, because getting that wrong in either direction is the failure mode:
 * warn on a fact and the app ships a broken plan; block on advice and the app
 * invents a law the author did not write.
 */

const check = (blocks: { protocolId: string; weeks: number }[]): PlanProblem[] =>
  validatePlan(blocks, (id) => protocolFor(id))

const gm = (weeks = 3) => ({ protocolId: 'gm', weeks })
const bridge = () => ({ protocolId: 'bridge', weeks: 1 })

// ---------------------------------------------------------------------------

describe('the default plan is ongoing Grey Man bulk (p.93)', () => {
  it('is four Grey Man + Bridge, four times — a suggested year, not the truncated Standard Cycle', () => {
    const p = defaultPlan('2026-08-17')
    expect(planWeeks(p.blocks)).toBe(52)
    expect(p.blocks.filter((b) => b.protocolId === 'gm')).toHaveLength(16)
    expect(p.blocks.filter((b) => b.protocolId === 'bridge')).toHaveLength(4)
  })

  it('is NOT the old shape, which moved the bridge and dropped the terminal one', () => {
    const p = defaultPlan('2026-08-17')
    expect(p.blocks.map((b) => b.protocolId)).not.toEqual(['gm', 'gm', 'bridge', 'gm', 'gm'])
  })

  it('every preset carries a page citation — a preset without one is an opinion', () => {
    for (const preset of PLAN_PRESETS) {
      expect(preset.cite).toMatch(/p\.\d+/)
      const spec = preset.specChoice ? 'alpha' : undefined
      expect(check(presetBlocks(preset, spec)).filter((p) => p.level === 'error')).toEqual([])
    }
  })

  it('never auto-picks Alpha or Bravo (p.69)', () => {
    const withSpec = PLAN_PRESETS.filter((p) => p.specChoice)
    expect(withSpec.length).toBeGreaterThan(0)
    for (const preset of withSpec) {
      expect(() => presetBlocks(preset)).toThrow(/p\.69/)
      expect(presetBlocks(preset, 'alpha').some((b) => b.protocolId === 'alpha')).toBe(true)
      expect(presetBlocks(preset, 'bravo').some((b) => b.protocolId === 'bravo')).toBe(true)
    }
  })

  it('is a LIST, so a second goal is data rather than a rewrite (Josh, 2026-08-24)', () => {
    expect(Array.isArray(PLAN_PRESETS)).toBe(true)
    expect(PLAN_PRESETS.length).toBeGreaterThanOrEqual(3)
  })
})

describe('the plan start snaps to a Monday (audit A16)', () => {
  it('moves a Wednesday back to its Monday', () => {
    // 2026-08-19 is a Wednesday.
    expect(mondayOnOrBefore('2026-08-19')).toBe('2026-08-17')
    expect(mondayOnOrBefore('2026-08-19')).not.toBe('2026-08-19')
  })

  it('leaves a Monday alone', () => {
    expect(mondayOnOrBefore('2026-08-17')).toBe('2026-08-17')
  })

  it('handles a Sunday, which is the far end of the week', () => {
    // 2026-08-23 is a Sunday — mondayIndex 6, so it belongs to the 17th's week.
    expect(mondayOnOrBefore('2026-08-23')).toBe('2026-08-17')
  })

  it('stops the whole training week rotating', () => {
    // The actual symptom: with a Wednesday start, Grey Man's Day 1 lands on a
    // Wednesday but `pos.day` still reads 0, so the app calls it Monday.
    const rotated: Settings = {
      ...DEFAULT_SETTINGS,
      plan: { startDate: '2026-08-19', blocks: [gm()] },
    }
    expect(resolvePosition(rotated, new Date(2026, 7, 19)).day).toBe(0) // Wednesday called "Mon"

    const snapped: Settings = {
      ...DEFAULT_SETTINGS,
      plan: { startDate: mondayOnOrBefore('2026-08-19'), blocks: [gm()] },
    }
    // After snapping, day 0 really is Monday the 17th.
    expect(resolvePosition(snapped, new Date(2026, 7, 17)).day).toBe(0)
    expect(resolvePosition(snapped, new Date(2026, 7, 19)).day).toBe(2)
  })
})

describe('BLOCKED — things the book states', () => {
  it('refuses a plan already stored with a mid-week start (A16)', () => {
    const mi = (d: string) => (parseISO(d).getDay() + 6) % 7
    // 2026-08-19 is a Wednesday. New writes snap, but a plan from a backup or an
    // older build can still carry one, and it rotates the whole training week.
    const bad = validatePlan([gm()], (id) => protocolFor(id), '2026-08-19', mi)
    expect(planHasErrors(bad)).toBe(true)
    expect(bad.some((p) => /mid-week/.test(p.message))).toBe(true)

    const good = validatePlan([gm()], (id) => protocolFor(id), '2026-08-17', mi)
    expect(good.some((p) => /mid-week/.test(p.message))).toBe(false)
  })

  it('refuses a General block that is not 3 weeks (p.40, p.67)', () => {
    const problems = check([gm(4)])
    expect(planHasErrors(problems)).toBe(true)
    expect(problems[0].message).toMatch(/3-week blocks/)
    // And a 3-week one is fine, so the rule is discriminating.
    expect(planHasErrors(check([gm(3)]))).toBe(false)
  })

  it('refuses a Bridge that is not one week (p.92)', () => {
    expect(planHasErrors(check([{ protocolId: 'bridge', weeks: 2 }]))).toBe(true)
    expect(planHasErrors(check([bridge()]))).toBe(false)
  })

  it('refuses a fractional block length — it blanks the session screen (A17)', () => {
    const problems = check([gm(1.5)])
    expect(planHasErrors(problems)).toBe(true)
    expect(problems[0].message).toMatch(/whole number/)
  })

  it('refuses an empty plan', () => {
    expect(planHasErrors(check([]))).toBe(true)
  })
})

describe('WARNED — things the book advises', () => {
  it('warns about a long run with no bridge week, without refusing it (p.93)', () => {
    // Five 3-week blocks back to back = 15 weeks, past "two to three months".
    const problems = check([gm(), gm(), gm(), gm(), gm()])
    expect(planHasErrors(problems)).toBe(false)
    expect(problems.some((p) => p.level === 'warning' && /bridge week/.test(p.message))).toBe(true)
  })

  it('does not warn when a bridge resets the run', () => {
    const problems = check([gm(), gm(), gm(), gm(), bridge(), gm()])
    expect(problems.filter((p) => /bridge week/.test(p.message))).toEqual([])
  })

  it('reports a long run once, not once per block after the threshold', () => {
    const problems = check([gm(), gm(), gm(), gm(), gm(), gm(), gm()])
    expect(problems.filter((p) => /no bridge week/.test(p.message))).toHaveLength(1)
  })

  it('warns about excluding General completely, but permits it (p.41)', () => {
    // Reachable only once Specificity exists; the rule is in place for then.
    const spec = { ...protocolFor('gm'), id: 'spec-alpha', family: 'specificity' as const }
    const problems = validatePlan([{ protocolId: 'spec-alpha', weeks: 3 }], (id) =>
      id === 'spec-alpha' ? spec : protocolFor(id),
    )
    expect(planHasErrors(problems)).toBe(false)
    expect(problems.some((p) => /don’t recommend excluding General/.test(p.message))).toBe(true)
  })

  it('a Grey Man then Bravo plan is valid, and warns with no General', () => {
    const ok = check([gm(), { protocolId: 'bravo', weeks: 3 }])
    expect(ok.filter((p) => p.level === 'error')).toEqual([])
    const noGeneral = check([{ protocolId: 'alpha', weeks: 3 }])
    expect(noGeneral.some((p) => /No General/.test(p.message))).toBe(true)
  })

  it('warns when the ratio favours Specificity (pp.141–142), and not when it favours General', () => {
    const favoursSpec = check([gm(), { protocolId: 'alpha', weeks: 3 }, { protocolId: 'bravo', weeks: 3 }])
    expect(favoursSpec.some((p) => /favours Specificity/.test(p.message))).toBe(true)

    const balanced = check([gm(), gm(), { protocolId: 'alpha', weeks: 3 }])
    expect(balanced.some((p) => /favours Specificity/.test(p.message))).toBe(false)
  })

  it('sorts errors above warnings', () => {
    const problems = check([gm(4), gm(), gm(), gm(), gm(), gm()])
    expect(problems[0].level).toBe('error')
  })
})

describe('blockWeeksOf — a stored bad plan must not blank the app (A17)', () => {
  it('coerces a fractional length rather than propagating it', () => {
    expect(blockWeeksOf({ protocolId: 'gm', weeks: 1.5 })).toBe(1)
    expect(blockWeeksOf({ protocolId: 'gm', weeks: 3 })).toBe(3)
  })

  it('never returns zero or negative', () => {
    expect(blockWeeksOf({ protocolId: 'gm', weeks: 0 })).toBe(1)
    expect(blockWeeksOf({ protocolId: 'gm', weeks: -2 })).toBe(1)
    expect(blockWeeksOf({ protocolId: 'gm', weeks: NaN })).toBe(1)
  })

  it('keeps the week integral all the way to the session, so GM_GRID resolves', () => {
    const bad: Settings = {
      ...DEFAULT_SETTINGS,
      currentPhaseId: 'gm',
      plan: { startDate: '2026-08-17', blocks: [gm(1.5), gm()] },
    }
    const pos = resolvePosition(bad, new Date(2026, 7, 26))
    expect(Number.isInteger(pos.week)).toBe(true)
  })
})
