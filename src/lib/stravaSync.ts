import { db } from '../db'
import { maxesMap, resolvePosition, sessionFor } from '../program'
import { fetchStravaActivities, getStravaAccessToken } from './strava'
import { parseISO } from './date'
import type { SessionLog } from '../types'

// Strava activity types we treat as a run/HIC (the plan decides run vs HIC by day).
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike'])

/**
 * Pull recent Strava activities and auto-tick the matching run/HIC days — pulling
 * duration, distance and heart rate in. Strava is the source of truth for cardio;
 * the plan supplies which day is a run vs a HIC. Returns how many were synced.
 * Never overwrites a logged lift/SE, or a day already synced from Strava.
 */
export async function syncStrava(): Promise<number> {
  const settings = await db.settings.get('app')
  if (!settings?.strava) return 0
  const token = await getStravaAccessToken(settings)
  if (!token) return 0

  const start = parseISO(settings.phaseStartDate)
  const afterEpoch = Math.floor(start.getTime() / 1000) - 86400
  const activities = await fetchStravaActivities(token, afterEpoch)

  const maxes = maxesMap(await db.maxes.toArray())
  const byDate = new Map((await db.sessions.toArray()).map((s) => [s.date, s]))

  let synced = 0
  for (const a of activities) {
    const isRun = RUN_TYPES.has(a.type) || (a.sport_type ? RUN_TYPES.has(a.sport_type) : false)
    if (!isRun) continue

    const date = a.start_date_local.slice(0, 10)
    const pos = resolvePosition(settings, parseISO(date))
    if (pos.status !== 'active') continue

    const plan = sessionFor(pos.phaseId, pos.week, pos.day, maxes, settings)
    if (plan.type !== 'run' && plan.type !== 'hic') continue

    const prev = byDate.get(date)
    if (prev?.stravaId) continue // already synced this day
    if (prev && (prev.type === 'lift' || prev.type === 'se')) continue // don't clobber a logged lift

    const rec: SessionLog = {
      ...(prev?.id ? { id: prev.id } : {}),
      date,
      phaseId: pos.phaseId,
      week: pos.week,
      day: pos.day,
      type: plan.type,
      title: plan.title,
      exercises: [],
      done: true,
      durationMin: Math.round(a.moving_time / 60),
      distanceKm: Math.round((a.distance / 1000) * 10) / 10,
      avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : undefined,
      stravaId: a.id,
      createdAt: Date.now(),
    }
    await db.sessions.put(rec)
    byDate.set(date, rec)
    synced++
  }
  return synced
}
