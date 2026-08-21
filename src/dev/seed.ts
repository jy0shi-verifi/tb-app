// Dev-only: generate a realistic training history so the UI can be reviewed with data.
// Reuses the real program logic so seeded sessions match what the app would produce.
import { db } from '../db'
import { sessionFor } from '../program'
import { ALL_BEGINNER_LIFTS, beginnerDayLetter, LP_A, LP_B, REP_LO, REP_HI } from '../beginner'
import { addDays, diffDays, isoDate, nextMonday, parseISO, today } from '../lib/date'
import type { SessionLog, Settings } from '../types'

const rand = () => Math.random()

function baseSettings(startIso: string, lifts?: Record<string, number>): Settings {
  return {
    id: 'app',
    dbIncrement: 2,
    currentPhaseId: 'beginner',
    phaseStartDate: startIso,
    ...(lifts ? { beginner: { lifts } } : {}),
  }
}

function makeLog(
  date: Date,
  week: number,
  day: number,
  plan: ReturnType<typeof sessionFor>,
  weights: Record<string, number>,
  reps: number,
): SessionLog {
  const letter = beginnerDayLetter(week, day)
  const lifts = letter === 'A' ? LP_A : LP_B
  const exercises = plan.exercises.map((ex, i) => {
    const lift = lifts[i]
    const w = lift ? weights[lift.id] : ex.sets[0]?.weight
    return {
      name: ex.name,
      sets: ex.sets.map(() => {
        let r = reps
        if (r > REP_LO && rand() < 0.12) r -= 1 // occasional missed rep on the last sets
        return { weight: w, reps: r, done: true }
      }),
    }
  })

  let durationMin: number | undefined
  let distanceKm: number | undefined
  let avgHr: number | undefined
  let feel: SessionLog['feel']
  let notes: string | undefined
  const pick = (xs: string[]) => xs[Math.floor(rand() * xs.length)]
  if (plan.type === 'run') {
    durationMin = 28 + Math.floor(rand() * 10)
    distanceKm = Math.round((durationMin / 7) * 10) / 10 // ~7 min/km easy
    avgHr = 132 + Math.floor(rand() * 16)
    feel = 'easy'
    if (rand() < 0.3) notes = pick(['Legs felt fresh', 'Kept it easy, nose-breathing', 'Cold one, good pace'])
  } else if (plan.type === 'lift') {
    feel = rand() < 0.65 ? 'ok' : rand() < 0.5 ? 'easy' : 'hard'
    if (rand() < 0.3)
      notes = pick(['Bench moving well', 'Grip gave out last set', 'Strong session', 'Legs heavy but got it'])
  }

  return {
    date: isoDate(date),
    phaseId: 'beginner',
    week,
    day,
    type: plan.type,
    title: plan.title,
    exercises,
    done: true,
    durationMin,
    distanceKm,
    avgHr,
    feel,
    notes,
    createdAt: date.getTime(),
  }
}

/**
 * Seed ~10 weeks of beginner history ending today, walking the working weights up
 * through double progression exactly as the app would: climb 8 → 12 reps, then add
 * the lift's step and drop back to 8.
 */
export async function seedFakeData(): Promise<string> {
  const now = today()
  const weeks = 10
  const start = addDays(now, -(weeks * 7 - 1))
  // anchor to a Monday so week/day line up with the template
  const startIso = isoDate(addDays(start, -((start.getDay() + 6) % 7)))

  // current reps-in-range and working weight per lift, advanced as we generate
  const weights: Record<string, number> = Object.fromEntries(
    ALL_BEGINNER_LIFTS.map((l) => [l.id, l.startKg]),
  )
  const repState: Record<string, number> = Object.fromEntries(
    ALL_BEGINNER_LIFTS.map((l) => [l.id, REP_LO]),
  )

  const sessions: SessionLog[] = []
  const startDate = parseISO(startIso)
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      if (diffDays(date, now) > 0) break // leave the future open
      const week = w + 1
      const settings = baseSettings(startIso, weights)
      const plan = sessionFor('beginner', week, d, settings)
      if (plan.type === 'rest') continue
      if (rand() > 0.93) continue // the odd missed session

      if (plan.type === 'lift') {
        const letter = beginnerDayLetter(week, d)
        const lifts = letter === 'A' ? LP_A : LP_B
        const reps = repState[lifts[0].id]
        sessions.push(makeLog(date, week, d, plan, weights, reps))
        // double progression: hit the top of the range → +step, back to the bottom
        for (const l of lifts) {
          if (repState[l.id] >= REP_HI) {
            weights[l.id] += l.step
            repState[l.id] = REP_LO
          } else {
            repState[l.id] += 1
          }
        }
      } else {
        sessions.push(makeLog(date, week, d, plan, weights, 0))
      }
    }
  }

  await db.transaction('rw', db.settings, db.maxes, db.sessions, async () => {
    await db.sessions.clear()
    await db.maxes.clear()
    await db.sessions.bulkAdd(sessions)
    await db.settings.put({
      ...baseSettings(startIso, weights),
      onboarded: true, // skip the welcome flow for a clean demo
      lastBackupAt: now.getTime(), // suppress the "back up your data" nudge
    })
  })

  return `seeded ${sessions.length} sessions across ${weeks} weeks of linear progression`
}

export async function clearAll(): Promise<string> {
  await db.transaction('rw', db.settings, db.maxes, db.sessions, async () => {
    await db.sessions.clear()
    await db.maxes.clear()
    await db.settings.put(baseSettings(nextMonday()))
  })
  // also reset one-shot reward flags so a clean reset re-arms first-time celebrations
  for (const k of ['tb-testday-celebrated', 'tb-seen-coins', 'tb-dismiss-missed', 'tb-rest-end', 'tb-no-splash']) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
  return 'cleared'
}
