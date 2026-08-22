import { db } from '../db'
import { PROTOCOLS, resolvePosition, sessionFor } from '../program'
import { addDays, diffDays, isoDate, parseISO, today } from './date'
import type { SessionLog } from '../types'

/**
 * A rest is a rest — auto-mark rest days complete so a forgotten tap doesn't
 * break the streak. Rules: any PAST rest day that's unlogged is completed; today's
 * rest day is completed only after 23:55 (so you can still log a hike/swim on it first).
 * Never overwrites a day you've already logged.
 */
export async function autoCompleteRestDays(): Promise<void> {
  const settings = await db.settings.get('app')
  if (!settings) return
  const phase = PROTOCOLS[settings.currentPhaseId]
  if (!phase) return

  const now = today()
  const nowIso = isoDate(now)
  const clock = new Date()
  const past2355 = clock.getHours() === 23 && clock.getMinutes() >= 55

  const logged = new Set((await db.sessions.toArray()).map((s) => s.date))
  const start = parseISO(settings.phaseStartDate)
  // scan from the phase start (capped to the last 90 days) up to today
  const scanFrom = diffDays(now, start) > 90 ? addDays(now, -90) : start

  const toAdd: SessionLog[] = []
  for (let d = scanFrom; diffDays(d, now) <= 0; d = addDays(d, 1)) {
    const iso = isoDate(d)
    if (logged.has(iso)) continue
    const p = resolvePosition(settings, d)
    if (p.status !== 'active') continue
    const plan = sessionFor(p.phaseId, p.week, p.day, settings)
    if (plan.type !== 'rest') continue
    const isPast = iso < nowIso
    const isTodayLate = iso === nowIso && past2355
    if (!isPast && !isTodayLate) continue
    toAdd.push({
      date: iso,
      phaseId: p.phaseId,
      week: p.week,
      day: p.day,
      type: 'rest',
      title: plan.title,
      exercises: [],
      done: true,
      createdAt: Date.now(),
    })
  }
  if (toAdd.length) await db.sessions.bulkAdd(toAdd)
}
