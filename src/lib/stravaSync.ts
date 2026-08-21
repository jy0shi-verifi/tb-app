import { db, saveSettings } from '../db'
import { programSessionName, resolvePosition } from '../program'
import {
  fetchStravaActivities,
  getStravaAccessToken,
  stravaCanWrite,
  updateStravaActivityName,
} from './strava'
import { parseISO } from './date'
import { musclesForExercises } from '../exerciseInfo'
import type { LoggedExercise, SessionLog } from '../types'

// Strava activity types we treat as a run.
const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun', 'Walk', 'Hike'])
// Strava types we treat as a strength session (matched to a logged lift).
const LIFT_TYPES = new Set(['WeightTraining', 'Workout', 'Crossfit'])

/** A weight-free line for a logged lift (reps only), e.g. "DB Bench Press — 8, 9, 8". */
function beginnerLiftLine(ex: LoggedExercise): string {
  const done = ex.sets.filter((s) => s.done && s.reps > 0)
  if (!done.length) return ''
  return `${ex.name} — ${done.map((s) => s.reps).join(', ')}`
}

/**
 * Compose the Strava activity description for a logged lift session: sets/reps
 * only (no weight) plus the muscles worked. The "Muscles:" line stands in for
 * Strava's native muscle map, which the public API can't populate.
 */
export function liftDescription(s: SessionLog): string {
  const lines = s.exercises.map(beginnerLiftLine).filter(Boolean)
  const muscles = musclesForExercises(s.exercises.map((e) => e.name))
  const out = [...lines]
  if (muscles.length) out.push(`Muscles: ${muscles.join(' · ')}`)
  out.push('via Tactical Barbell')
  return out.join('\n')
}

/**
 * Pull recent Strava activities and reconcile them with the plan. Runs/HICs:
 * Strava is the source of truth — auto-tick the matching day with duration/
 * distance/HR. Gym uploads (WeightTraining/Workout): the APP owns the sets, so
 * we enrich the logged lift/SE with Strava's duration/HR and push the full
 * set/rep breakdown back onto the activity (name + description). Both name-back
 * and description-back need activity:write. Returns how many days were touched.
 */
export async function syncStrava(): Promise<number> {
  const settings = await db.settings.get('app')
  if (!settings?.strava) return 0
  const token = await getStravaAccessToken(settings)
  if (!token) return 0

  const start = parseISO(settings.phaseStartDate)
  const nowEpoch = Math.floor(Date.now() / 1000)
  // Fetch since the phase start, but never ask Strava for a FUTURE `after`
  // (the plan may not have started yet) — Strava rejects future dates.
  const afterEpoch = Math.min(Math.floor(start.getTime() / 1000) - 86400, nowEpoch - 86400)
  const activities = await fetchStravaActivities(token, afterEpoch)

  const byDate = new Map((await db.sessions.toArray()).map((s) => [s.date, s]))
  const canWrite = stravaCanWrite(settings)

  let synced = 0
  for (const a of activities) {
    const type = a.type
    const sport = a.sport_type
    const isRun = RUN_TYPES.has(type) || (sport ? RUN_TYPES.has(sport) : false)
    const isLift = LIFT_TYPES.has(type) || (sport ? LIFT_TYPES.has(sport) : false)

    // A gym upload from the watch: enrich the lift/SE you already logged in-app
    // (Strava carries duration/HR; the app owns the sets) and push the full
    // set/rep breakdown back onto Strava so it shows in the feed.
    if (isLift) {
      const date = a.start_date_local.slice(0, 10)
      const logged = byDate.get(date)
      if (!logged?.id || (logged.type !== 'lift' && logged.type !== 'se') || !logged.exercises.length)
        continue

      const patch: Partial<SessionLog> = {}
      if (logged.stravaId == null) patch.stravaId = a.id
      if (logged.durationMin == null) patch.durationMin = Math.round(a.moving_time / 60)
      if (logged.avgHr == null && a.average_heartrate) patch.avgHr = Math.round(a.average_heartrate)
      if (Object.keys(patch).length) {
        await db.sessions.update(logged.id, patch)
        byDate.set(date, { ...logged, ...patch })
        synced++
      }

      // Push name + description back — but skip if this activity is already
      // linked and named (so auto-sync on every app open doesn't re-hit Strava).
      const name = programSessionName(logged.phaseId, logged.week, logged.day, logged.type, settings)
      if (canWrite && !(logged.stravaId === a.id && a.name === name)) {
        const desc = liftDescription(logged)
        try {
          await updateStravaActivityName(token, a.id, name, desc)
        } catch {
          /* leave the Strava-side activity as-is; the local log is already correct */
        }
      }
      continue
    }

    if (!isRun) continue

    const date = a.start_date_local.slice(0, 10)
    const pos = resolvePosition(settings, parseISO(date))
    if (pos.status !== 'active') continue

    const prev = byDate.get(date)
    if (prev?.stravaId) continue // already synced this day
    if (prev && (prev.type === 'lift' || prev.type === 'se')) continue // don't clobber a logged lift

    // Running is owned by Runna: log ANY run (whatever day it lands on) and keep
    // Runna's own activity name — never rename it on Strava.
    const recType: 'run' | 'hic' = 'run'
    const name = a.name?.trim() || 'Run'

    const rec: SessionLog = {
      ...(prev?.id ? { id: prev.id } : {}),
      date,
      phaseId: pos.phaseId,
      week: pos.week,
      day: pos.day,
      type: recType,
      title: name,
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
    // Never rename a run on Strava — Runna owns those names.
  }
  await saveSettings({ lastStravaSyncAt: Date.now() })
  return synced
}

/**
 * One-off: import ALL your historical Strava runs (e.g. an old C25K block) as
 * standalone run logs, so the History / running stats show real data even though
 * they aren't part of the current programme. Deduped by Strava activity id.
 */
export async function importStravaHistory(): Promise<number> {
  const settings = await db.settings.get('app')
  if (!settings?.strava) return 0
  const token = await getStravaAccessToken(settings)
  if (!token) return 0

  const nowEpoch = Math.floor(Date.now() / 1000)
  const activities = await fetchStravaActivities(token, nowEpoch - 730 * 86400) // last ~2 years

  const seen = new Set(
    (await db.sessions.toArray()).map((s) => s.stravaId).filter((x): x is number => x != null),
  )

  const toAdd: SessionLog[] = []
  for (const a of activities) {
    const isRun = RUN_TYPES.has(a.type) || (a.sport_type ? RUN_TYPES.has(a.sport_type) : false)
    if (!isRun || seen.has(a.id)) continue
    toAdd.push({
      date: a.start_date_local.slice(0, 10),
      phaseId: 'history',
      week: 0,
      day: 0,
      type: 'run',
      title: a.name?.trim() || 'Run',
      exercises: [],
      done: true,
      durationMin: Math.round(a.moving_time / 60),
      distanceKm: Math.round((a.distance / 1000) * 10) / 10,
      avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : undefined,
      stravaId: a.id,
      createdAt: Date.now(),
    })
  }
  if (toAdd.length) await db.sessions.bulkAdd(toAdd)
  return toAdd.length
}
