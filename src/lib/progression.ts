import type { Lift, MaxEntry } from '../types'
import { effective1RM, trainingMax } from './calc'

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
