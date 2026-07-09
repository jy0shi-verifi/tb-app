import type { Lift, MaxEntry, SessionLog } from '../types'
import { effective1RM, trainingMax } from './calc'
import { addDays, isoDate, parseISO } from './date'

/**
 * Did the athlete actually complete the block? TB only progresses if the block
 * was finished — we require the heavy weeks (3 & 6) AND the final week to have
 * logged, done lifts (not just the final week).
 */
export function blockCompleted(
  sessions: SessionLog[],
  phaseStartDate: string,
  lengthWeeks: number,
): boolean {
  const start = parseISO(phaseStartDate)
  const liftDoneInWeek = (wk: number) => {
    const s = isoDate(addDays(start, (wk - 1) * 7))
    const e = isoDate(addDays(start, wk * 7 - 1))
    return sessions.some((x) => x.type === 'lift' && x.done && x.date >= s && x.date <= e)
  }
  const finalWeekStart = isoDate(addDays(start, (lengthWeeks - 1) * 7))
  const finalWeekEnd = isoDate(addDays(start, lengthWeeks * 7 - 1))
  const doneLifts = sessions.filter(
    (s) =>
      s.type === 'lift' &&
      s.done &&
      s.date >= finalWeekStart &&
      s.date <= finalWeekEnd,
  )
  // TB: only "earned" if the block was actually run — including the heavy weeks
  // (3 & 6), not just the final week.
  return liftDoneInWeek(3) && liftDoneInWeek(6) && doneLifts.length >= 2
}

export interface ProgressionItem {
  liftId: string
  name: string
  step: number
  hasMax: boolean
  currentOneRM: number
  nextOneRM: number
  currentTM: number
  nextTM: number
}

/**
 * Forced-progression suggestion at the end of an Operator block:
 * add each lift's step (upper ~2.5, lower ~5 kg) to its effective 1RM.
 * TB-faithful: small increment to the true 1RM, recompute TM off it.
 */
export function suggestBlockProgression(
  lifts: Lift[],
  maxes: Record<string, MaxEntry>,
): ProgressionItem[] {
  return lifts.map((l) => {
    const entry = maxes[l.id]
    const step = l.progressStep ?? 2.5
    const cur = entry ? effective1RM(entry) : 0
    const next = cur + step
    return {
      liftId: l.id,
      name: l.name,
      step,
      hasMax: !!entry,
      currentOneRM: cur,
      nextOneRM: next,
      currentTM: trainingMax(cur),
      nextTM: trainingMax(next),
    }
  })
}

/** The new bumpKg for a lift after applying one block's progression. */
export function bumpedEntry(entry: MaxEntry, step: number): MaxEntry {
  return { ...entry, bumpKg: (entry.bumpKg ?? 0) + step }
}

export interface StalledLift {
  liftId: string
  name: string
  gain: number
  step: number
}

/**
 * TB1 p109 ladder: retest every 6 wks while newbie gains flow; when a lift's
 * retest stops out-gaining what a forced-progression bump would give, that lift
 * has hit the next rung (retest→12wk→forced progression) — which is beyond the
 * app's auto-setup. Compares each lift's est-1RM now vs the last retest snapshot;
 * returns the lifts whose gain was ≤ their own forced-progression step. Empty
 * until there's a prior retest to compare against.
 */
export function stalledLiftsSinceRetest(
  items: ProgressionItem[],
  history: { lifts: Record<string, number> }[] | undefined,
): StalledLift[] {
  if (!history?.length) return []
  const prev = history[history.length - 1].lifts
  const out: StalledLift[] = []
  for (const it of items) {
    if (!it.hasMax) continue
    const before = prev[it.liftId]
    if (before == null) continue
    const gain = it.currentOneRM - before
    if (gain <= it.step) out.push({ liftId: it.liftId, name: it.name, gain, step: it.step })
  }
  return out
}
