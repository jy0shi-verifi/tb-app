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
  totalKm: number
}
export function runStats(sessions: SessionLog[]): RunStats {
  const runs = sessions.filter((s) => (s.type === 'run' || s.type === 'hic') && s.done)
  return {
    count: runs.length,
    totalMin: runs.reduce((n, s) => n + (s.durationMin ?? 0), 0),
    longest: runs.reduce((m, s) => Math.max(m, s.durationMin ?? 0), 0),
    totalKm: Math.round(runs.reduce((n, s) => n + (s.distanceKm ?? 0), 0) * 10) / 10,
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

/** Volume load for one lift session = Σ weight × reps over done sets (kg, relative trend metric). */
export function sessionVolume(s: SessionLog): number {
  if (s.type !== 'lift') return 0
  let v = 0
  for (const e of s.exercises)
    for (const set of e.sets) if (set.done && set.weight) v += set.weight * set.reps
  return Math.round(v)
}

export interface WeekSummary {
  lifts: number
  runs: number
  volume: number
}
export function weekSummary(sessions: SessionLog[]): WeekSummary {
  const monday = addDays(today(), -mondayIndex(today()))
  const from = isoDate(monday)
  const to = isoDate(addDays(monday, 6))
  const wk = sessions.filter((s) => s.done && s.date >= from && s.date <= to)
  return {
    lifts: wk.filter((s) => s.type === 'lift' || s.type === 'se').length,
    runs: wk.filter((s) => s.type === 'run' || s.type === 'hic').length,
    volume: wk.reduce((n, s) => n + sessionVolume(s), 0),
  }
}

export interface LiftRecord {
  short: string
  name: string
  bestE1RM: number
  heaviest: number
  startWeight: number
  latestWeight: number
}
export function liftRecords(
  sessions: SessionLog[],
  lifts: { name: string; short: string }[],
): LiftRecord[] {
  const lift = sessions
    .filter((s) => s.type === 'lift')
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  return lifts.map((l) => {
    let bestE1RM = 0
    let heaviest = 0
    let startWeight = 0
    let latestWeight = 0
    for (const s of lift) {
      const ex = s.exercises.find((e) => e.name === l.name)
      if (!ex) continue
      let topW = 0
      for (const set of ex.sets) {
        if (!set.weight || set.reps <= 0) continue
        bestE1RM = Math.max(bestE1RM, estimate1RM(set.weight, set.reps))
        heaviest = Math.max(heaviest, set.weight)
        topW = Math.max(topW, set.weight)
      }
      if (topW > 0) {
        if (startWeight === 0) startWeight = topW
        latestWeight = topW
      }
    }
    return { short: l.short, name: l.name, bestE1RM, heaviest, startWeight, latestWeight }
  })
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
