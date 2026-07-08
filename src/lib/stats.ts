import type { SessionLog } from '../types'
import { addDays, isoDate, mondayIndex, today } from './date'
import { estimate1RM } from './calc'

const doneDates = (sessions: SessionLog[]) =>
  new Set(sessions.filter((s) => s.done).map((s) => s.date))

/** Consecutive done-days ending today, tolerating up to 2 gap days (rest/weekend). */
export function computeStreak(sessions: SessionLog[]): number {
  const set = doneDates(sessions)
  let streak = 0
  let misses = 0
  let d = today()
  for (let i = 0; i < 365; i++) {
    if (set.has(isoDate(d))) {
      streak++
      misses = 0
    } else {
      misses++
      if (misses > 2) break
    }
    d = addDays(d, -1)
  }
  return streak
}

export function sessionsThisWeek(sessions: SessionLog[]): number {
  const monday = addDays(today(), -mondayIndex(today()))
  const from = isoDate(monday)
  const to = isoDate(addDays(monday, 6))
  return sessions.filter((s) => s.done && s.date >= from && s.date <= to).length
}

export interface RunStats {
  count: number
  totalMin: number
  longest: number
}
export function runStats(sessions: SessionLog[]): RunStats {
  const runs = sessions.filter((s) => (s.type === 'run' || s.type === 'hic') && s.done)
  return {
    count: runs.length,
    totalMin: runs.reduce((n, s) => n + (s.durationMin ?? 0), 0),
    longest: runs.reduce((m, s) => Math.max(m, s.durationMin ?? 0), 0),
  }
}

/** Best estimated 1RM for a named lift across sessions (optionally excluding a date). */
export function bestEst1RM(sessions: SessionLog[], liftName: string, excludeDate?: string): number {
  let best = 0
  for (const s of sessions) {
    if (s.type !== 'lift' || s.date === excludeDate) continue
    const ex = s.exercises.find((e) => e.name === liftName)
    if (!ex) continue
    for (const set of ex.sets) {
      if (set.weight && set.reps > 0) best = Math.max(best, estimate1RM(set.weight, set.reps))
    }
  }
  return best
}

export interface Badge {
  key: string
  label: string
  emoji: string
}
/** Earned milestone badges, most recent first. */
export function badges(sessions: SessionLog[]): Badge[] {
  const out: Badge[] = []
  const done = sessions.filter((s) => s.done)
  const bbDone = done.some((s) => s.phaseId === 'base-building' && s.week >= 8)
  if (bbDone) out.push({ key: 'bb', label: 'Base Building complete', emoji: '🏁' })
  // count distinct completed operator blocks by week-6 done lifts
  const opWk6 = done.filter((s) => s.phaseId === 'operator' && s.type === 'lift' && s.week === 6)
  if (opWk6.length >= 1) out.push({ key: 'op1', label: 'First Operator block', emoji: '💪' })
  const total = done.length
  for (const m of [100, 50, 25, 10]) {
    if (total >= m) {
      out.push({ key: `s${m}`, label: `${m} sessions`, emoji: '⭐' })
      break
    }
  }
  const streak = computeStreak(sessions)
  if (streak >= 7) out.push({ key: 'streak', label: `${streak}-day streak`, emoji: '🔥' })
  return out
}
