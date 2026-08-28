/**
 * Year-plan helpers: map sequential blocks onto calendar weeks, and insert
 * time-off so a later block lands on a chosen Monday.
 *
 * Blocks stay an ordered list. A hole in the year is an `off` block, not a
 * second timeline — otherwise resolveInPlan would have nothing to walk.
 */
import { addDays, isoDate, parseISO } from './date'
import { blockWeeksOf, type PlannedBlock } from '../program'

export const protocolColor = (id: string): string => {
  if (id === 'gm') return 'var(--color-brand)'
  if (id === 'alpha') return 'var(--color-load)'
  if (id === 'bravo') return 'var(--color-accent)'
  if (id === 'bridge') return 'var(--color-gold, #c4a574)'
  if (id === 'off') return 'var(--color-line)'
  return 'var(--color-muted)'
}

export const protocolShort = (id: string): string => {
  if (id === 'gm') return 'Grey Man'
  if (id === 'alpha') return 'Alpha'
  if (id === 'bravo') return 'Bravo'
  if (id === 'bridge') return 'Bridge'
  if (id === 'off') return 'Off'
  return id
}

export interface WeekCell {
  weekIndex: number
  monday: string
  blockIndex: number | null
  protocolId: string | null
  /** First week of that block. */
  blockStart: boolean
}

export function weekMonday(startDate: string, weekIndex: number): string {
  return isoDate(addDays(parseISO(startDate), weekIndex * 7))
}

export function weeksCovered(blocks: PlannedBlock[]): number {
  return blocks.reduce((n, b) => n + blockWeeksOf(b), 0)
}

/** One cell per week from plan start through `horizonWeeks` (empty after the last block). */
export function calendarWeeks(
  startDate: string,
  blocks: PlannedBlock[],
  horizonWeeks: number,
): WeekCell[] {
  const cells: WeekCell[] = []
  let acc = 0
  const owners: { blockIndex: number; protocolId: string; start: number }[] = []
  blocks.forEach((b, i) => {
    owners.push({ blockIndex: i, protocolId: b.protocolId, start: acc })
    acc += blockWeeksOf(b)
  })

  for (let w = 0; w < horizonWeeks; w++) {
    let blockIndex: number | null = null
    let protocolId: string | null = null
    let blockStart = false
    let covered = 0
    for (const o of owners) {
      const len = blockWeeksOf(blocks[o.blockIndex])
      if (w >= o.start && w < o.start + len) {
        blockIndex = o.blockIndex
        protocolId = o.protocolId
        blockStart = w === o.start
        break
      }
      covered = o.start + len
    }
    void covered
    cells.push({
      weekIndex: w,
      monday: weekMonday(startDate, w),
      blockIndex,
      protocolId,
      blockStart,
    })
  }
  return cells
}

/** Insert N weeks of time off immediately before block `at`. */
export function insertOffBefore(blocks: PlannedBlock[], at: number, weeks: number): PlannedBlock[] {
  const n = Math.max(1, Math.floor(weeks) || 1)
  const next = [...blocks]
  const i = Math.max(0, Math.min(at, next.length))
  next.splice(i, 0, { protocolId: 'off', weeks: n })
  return next
}

/**
 * Append time off so `then` starts on `targetMonday` (must be a Monday on or
 * after the current plan end). If the target is already the next free week,
 * no off is added.
 */
export function appendStartingOn(
  blocks: PlannedBlock[],
  startDate: string,
  targetMonday: string,
  then: PlannedBlock,
): PlannedBlock[] {
  const covered = weeksCovered(blocks)
  const endMonday = weekMonday(startDate, covered)
  const gapDays = (parseISO(targetMonday).getTime() - parseISO(endMonday).getTime()) / 86_400_000
  const gapWeeks = Math.round(gapDays / 7)
  const next = [...blocks]
  if (gapWeeks > 0) next.push({ protocolId: 'off', weeks: gapWeeks })
  next.push(then)
  return next
}

export function monthsInView(startDate: string, horizonWeeks: number): { label: string; startWeek: number; weeks: number }[] {
  const months: { label: string; startWeek: number; weeks: number }[] = []
  for (let w = 0; w < horizonWeeks; w++) {
    const d = parseISO(weekMonday(startDate, w))
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    const last = months[months.length - 1]
    if (!last || last.label !== label) months.push({ label, startWeek: w, weeks: 1 })
    else last.weeks++
  }
  return months
}
