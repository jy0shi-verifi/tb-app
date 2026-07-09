// Dev-only: generate a realistic training history so the UI can be reviewed with data.
// Reuses the real program/load logic so seeded sessions match what the app would produce.
import { db } from '../db'
import { sessionFor } from '../program'
import { addDays, diffDays, isoDate, nextMonday, parseISO, today } from '../lib/date'
import type { MaxEntry, SessionLog, Settings } from '../types'

const rand = () => Math.random()

function baseSettings(phaseId: string, startIso: string): Settings {
  return {
    id: 'app',
    dbIncrement: 2,
    loadBasis: 'tm',
    currentPhaseId: phaseId,
    phaseStartDate: startIso,
  }
}

function makeLog(
  date: Date,
  phaseId: string,
  week: number,
  day: number,
  plan: ReturnType<typeof sessionFor>,
): SessionLog {
  const exercises = plan.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map((s) => {
      let reps = s.reps
      if (reps > 2 && rand() < 0.08) reps -= 1 // occasional missed rep
      return { weight: s.weight, reps, done: true }
    }),
  }))
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
  } else if (plan.type === 'hic') {
    durationMin = 20 + Math.floor(rand() * 10)
    distanceKm = Math.round((durationMin / 6) * 10) / 10
    avgHr = 158 + Math.floor(rand() * 20)
    feel = rand() < 0.6 ? 'hard' : 'ok'
    if (rand() < 0.35) notes = pick(['Hill sprints — brutal', '600m resets, hung on', 'Fast-5 tempo, redlined'])
  } else if (plan.type === 'se') {
    durationMin = 30 + Math.floor(rand() * 12)
    feel = rand() < 0.5 ? 'ok' : 'hard'
  } else if (plan.type === 'lift') {
    feel = rand() < 0.65 ? 'ok' : rand() < 0.5 ? 'easy' : 'hard'
    if (rand() < 0.3) notes = pick(['Bench moving well', 'Grip gave out last set', 'Strong session', 'Legs heavy but got it', 'New rep PR feel'])
  }
  return {
    date: isoDate(date),
    phaseId,
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

function genSegment(
  phaseId: string,
  startIso: string,
  weeks: number,
  maxes: Record<string, MaxEntry>,
  stopBefore?: Date,
): SessionLog[] {
  const settings = baseSettings(phaseId, startIso)
  const start = parseISO(startIso)
  const out: SessionLog[] = []
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      if (stopBefore && diffDays(date, stopBefore) >= 0) return out // leave today+future open
      const plan = sessionFor(phaseId, w + 1, d, maxes, settings)
      if (plan.type === 'rest') continue
      const optional = plan.title.startsWith('Optional')
      const attend = optional ? rand() < 0.4 : rand() < 0.93
      if (!attend) continue
      out.push(makeLog(date, phaseId, w + 1, d, plan))
    }
  }
  return out
}

const mx = (liftId: string, w: number, r: number, bump = 0): MaxEntry => ({
  liftId,
  testWeight: w,
  testReps: r,
  bumpKg: bump,
})

/**
 * Seed ~4 months of history ending mid-way through a second Operator block:
 * Base Building (8wk) done → Operator block 1 (6wk) done → Operator block 2 (in progress).
 */
export async function seedFakeData(): Promise<string> {
  const now = today()

  // current Operator block (block 2): start so today ≈ week 4
  const block2Start = '2026-06-15'
  const block1Start = isoDate(addDays(parseISO(block2Start), -42)) // 6 wks earlier
  const bbStart = isoDate(addDays(parseISO(block1Start), -56)) // 8 wks earlier

  // tested at end of Base Building
  const testBench = 22,
    testSquat = 28,
    testRow = 18
  const block1Maxes = {
    op_bench: mx('op_bench', testBench, 5, 0),
    op_squat: mx('op_squat', testSquat, 5, 0),
    op_row: mx('op_row', testRow, 5, 0),
  }
  // one forced-progression bump applied at block1→block2
  const block2Maxes = {
    op_bench: mx('op_bench', testBench, 5, 2.5),
    op_squat: mx('op_squat', testSquat, 5, 5),
    op_row: mx('op_row', testRow, 5, 2.5),
  }

  const sessions: SessionLog[] = [
    ...genSegment('base-building', bbStart, 8, {}),
    ...genSegment('operator', block1Start, 6, block1Maxes),
    ...genSegment('operator', block2Start, 6, block2Maxes, now),
  ]

  await db.transaction('rw', db.settings, db.maxes, db.sessions, async () => {
    await db.sessions.clear()
    await db.maxes.clear()
    await db.sessions.bulkAdd(sessions)
    await db.maxes.bulkPut(Object.values(block2Maxes))
    await db.settings.put({
      ...baseSettings('operator', block2Start),
      operatorBlock: 2,
      operatorFirstRunDone: true,
      onboarded: true, // skip the welcome flow for a clean demo
      lastBackupAt: now.getTime(), // suppress the "back up your data" nudge
    })
  })

  return `seeded ${sessions.length} sessions (BB done → Op block 1 done → mid Op block 2)`
}

export async function clearAll(): Promise<string> {
  await db.transaction('rw', db.settings, db.maxes, db.sessions, async () => {
    await db.sessions.clear()
    await db.maxes.clear()
    await db.settings.put(baseSettings('base-building', nextMonday()))
  })
  return 'cleared'
}
