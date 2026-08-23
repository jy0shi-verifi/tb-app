// Dev-only: generate a realistic training history so the UI can be reviewed with data.
// Reuses the real program logic, so seeded sessions are exactly what the app would
// have produced on the day — including the plate math and the A/B alternation.
import { db } from '../db'
import { sessionFor, narrowMaxes, protocolFor } from '../program'
import { ALL_BEGINNER_LIFTS, beginnerDayLetter, LP_A, LP_B, REP_LO, REP_HI } from '../beginner'
import { GM_S1_EXAMPLE, GM_S2_EXAMPLE } from '../protocols/greyman'
import { addDays, diffDays, isoDate, mondayIndex, nextMonday, today } from '../lib/date'
import type { OneRmEntry, SessionLog, Settings } from '../types'

const rand = () => Math.random()
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]

// ---------------------------------------------------------------------------
// Shape of the demo timeline
//
// Six months on Beginner, then four Grey Man blocks with a bridge week in the
// middle — and today lands mid-way through the last one, so the app shows a
// block in progress rather than a tidy boundary.
// ---------------------------------------------------------------------------

const BEGINNER_WEEKS = 26 // ~6 months
const MASS_BLOCKS = [
  { protocolId: 'gm', weeks: 3 },
  { protocolId: 'gm', weeks: 3 },
  { protocolId: 'bridge', weeks: 1 },
  { protocolId: 'gm', weeks: 3 },
  { protocolId: 'gm', weeks: 3 },
] as const

/** Week 2 of the final block — comfortably mid-block. */
const CURRENT_BLOCK_INDEX = MASS_BLOCKS.length // +1 for the beginner block at index 0
const WEEK_IN_CURRENT_BLOCK = 2

/** Starting barbell 1RMs after six months of dumbbell work — deliberately modest. */
const START_1RM: Record<string, number> = {
  bench: 62.5,
  squat: 80,
  ohp: 40,
  deadlift: 100,
  s_front_squat: 60,
}
/** Per-dumbbell 1RM for the dumbbell supplementary lifts. */
const START_1RM_DB: Record<string, number> = {
  s_incline_db_press: 22,
  s_db_shrugs: 30,
  s_db_row: 26,
}
/**
 * "Every 3 to 6 weeks, add 5-10lbs to 1RMs" (MASS p.90) — 2.5 kg a block on the
 * bar. Dumbbell lifts get half that, because their max is PER DUMBBELL: adding
 * the same 2.5 kg to each hand every block would climb absurdly fast.
 */
const PROGRESSION_PER_BLOCK = 2.5
const PROGRESSION_PER_BLOCK_DB = 1.25

const LIFT_NOTES = [
  'Bench moving well',
  'Grip gave out last set',
  'Strong session',
  'Legs heavy but got it',
  'Last set was a grind',
  'Felt light today',
]
const RUN_NOTES = ['Legs felt fresh', 'Kept it easy, nose-breathing', 'Cold one, good pace']

// ---------------------------------------------------------------------------

function baseSettings(over: Partial<Settings> = {}): Settings {
  return {
    id: 'app',
    dbIncrement: 2,
    currentPhaseId: 'beginner',
    phaseStartDate: nextMonday(),
    ...over,
  }
}

/** Turn a planned session into a logged one, with a little human noise. */
function logFromPlan(
  date: Date,
  phaseId: string,
  week: number,
  day: number,
  plan: ReturnType<typeof sessionFor>,
  opts: { repsOverride?: number; skipRate?: number } = {},
): SessionLog {
  const exercises = plan.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map((s) => {
      let reps = opts.repsOverride ?? s.reps
      // The odd dropped rep on the back sets, as happens in real life.
      if (reps > 3 && rand() < 0.1) reps -= 1
      return { weight: s.weight, reps, done: true }
    }),
  }))

  let durationMin: number | undefined
  let distanceKm: number | undefined
  let avgHr: number | undefined
  let feel: SessionLog['feel']
  let notes: string | undefined

  if (plan.type === 'run') {
    durationMin = 28 + Math.floor(rand() * 12)
    distanceKm = Math.round((durationMin / 7) * 10) / 10 // ~7 min/km easy
    avgHr = 128 + Math.floor(rand() * 18)
    feel = 'easy'
    if (rand() < 0.3) notes = pick(RUN_NOTES)
  } else if (plan.type === 'lift') {
    feel = rand() < 0.6 ? 'ok' : rand() < 0.5 ? 'easy' : 'hard'
    if (rand() < 0.3) notes = pick(LIFT_NOTES)
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

// ---------------------------------------------------------------------------

/**
 * Six months of Beginner, then four Grey Man blocks, landing mid-block today.
 *
 * The Beginner half walks the working weights up through double progression
 * exactly as the app does — climb 8 → 12 reps, then add the lift's step and drop
 * back to 8 — with progress deliberately slowing in the second half, because a
 * novice who never stalls for six months is not realistic.
 *
 * The Grey Man half runs the real `sessionFor`, so every logged weight is the
 * one the plate math would have prescribed from the 1RMs of the day, and the
 * 1RMs step by 2.5 kg between blocks (Forced Progression, p.90).
 */
export async function seedFakeData(): Promise<string> {
  const now = today()
  const blocks = [{ protocolId: 'beginner', weeks: BEGINNER_WEEKS }, ...MASS_BLOCKS]

  // Anchor the plan so that today is week `WEEK_IN_CURRENT_BLOCK` of the last block.
  const weeksBeforeCurrent = blocks
    .slice(0, CURRENT_BLOCK_INDEX)
    .reduce((n, b) => n + b.weeks, 0)
  const weeksIntoPlan = weeksBeforeCurrent + (WEEK_IN_CURRENT_BLOCK - 1)
  const thisMonday = addDays(now, -mondayIndex(now))
  const startDate = addDays(thisMonday, -weeksIntoPlan * 7)
  const startIso = isoDate(startDate)

  const plan: NonNullable<Settings['plan']> = { startDate: startIso, blocks: [...blocks] }

  const sessions: SessionLog[] = []

  // ---- Beginner: six months of double progression -------------------------
  const dbWeights: Record<string, number> = Object.fromEntries(
    ALL_BEGINNER_LIFTS.map((l) => [l.id, l.startKg]),
  )
  const repState: Record<string, number> = Object.fromEntries(
    ALL_BEGINNER_LIFTS.map((l) => [l.id, REP_LO]),
  )

  for (let w = 0; w < BEGINNER_WEEKS; w++) {
    const week = w + 1
    // Later on, progress stalls more often — the reps don't always go up.
    const stallChance = w < 10 ? 0.05 : w < 18 ? 0.18 : 0.3
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d)
      if (diffDays(date, now) > 0) break
      const s = baseSettings({ phaseStartDate: startIso, beginner: { lifts: dbWeights } })
      const p = sessionFor('beginner', week, d, s)
      if (p.type === 'rest') continue
      if (rand() > 0.94) continue // the odd missed session

      if (p.type === 'lift') {
        const lifts = beginnerDayLetter(week, d) === 'A' ? LP_A : LP_B
        sessions.push(
          logFromPlan(date, 'beginner', week, d, p, { repsOverride: repState[lifts[0].id] }),
        )
        for (const l of lifts) {
          if (repState[l.id] >= REP_HI) {
            dbWeights[l.id] += l.step
            repState[l.id] = REP_LO
          } else if (rand() > stallChance) {
            repState[l.id] += 1
          }
        }
      } else {
        sessions.push(logFromPlan(date, 'beginner', week, d, p))
      }
    }
  }

  // ---- Grey Man: four blocks, 1RMs stepping between them -------------------
  const oneRm: OneRmEntry[] = []
  const mkMax = (id: string, name: string, kg: number, perDb: boolean, bumped: number): OneRmEntry => ({
    protocolId: 'mass',
    exerciseId: id,
    exerciseName: name,
    kg,
    unit: perDb ? 'perDumbbell' : 'total',
    source: 'estimated',
    testedAt: startIso,
    progressedKg: bumped,
  })

  const sExercises = [...GM_S1_EXAMPLE, ...GM_S2_EXAMPLE]
  const nameOf = (id: string) =>
    sExercises.find((e) => e.id === id)?.name ??
    ({ bench: 'Bench Press', squat: 'Squat', ohp: 'Overhead Press', deadlift: 'Deadlift' }[id] ?? id)

  let bumped = 0
  let weekCursor = BEGINNER_WEEKS

  for (let bi = 1; bi < blocks.length; bi++) {
    const block = blocks[bi]
    if (block.protocolId === 'bridge') {
      weekCursor += block.weeks
      continue // a bridge week logs nothing — it is a week off (p.92)
    }

    const maxRows: OneRmEntry[] = [
      ...Object.entries(START_1RM).map(([id, kg]) => mkMax(id, nameOf(id), kg, false, bumped)),
      ...Object.entries(START_1RM_DB).map(([id, kg]) =>
        mkMax(id, nameOf(id), kg, true, (bumped / PROGRESSION_PER_BLOCK) * PROGRESSION_PER_BLOCK_DB),
      ),
      // Dips are bodyweight: max reps stands in for the 1RM (p.90).
      { ...mkMax('s_dips', 'Dips', 0, false, 0), maxReps: 12 + Math.floor(bumped / PROGRESSION_PER_BLOCK) },
    ]
    const s = baseSettings({ currentPhaseId: 'gm', phaseStartDate: startIso, plan })
    const maxes = narrowMaxes(maxRows, protocolFor('gm'))

    for (let w = 0; w < block.weeks; w++) {
      const week = w + 1
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, (weekCursor + w) * 7 + d)
        if (diffDays(date, now) > 0) break
        const p = sessionFor('gm', week, d, s, maxes)
        if (p.type === 'rest') continue
        if (rand() > 0.93) continue
        sessions.push(logFromPlan(date, 'gm', week, d, p))
      }
    }

    weekCursor += block.weeks
    // Forced Progression between blocks (p.90).
    if (bi < blocks.length - 1) bumped += PROGRESSION_PER_BLOCK
  }

  // The maxes as they stand today, after the blocks that have completed.
  oneRm.push(
    ...Object.entries(START_1RM).map(([id, kg]) => mkMax(id, nameOf(id), kg, false, bumped)),
    ...Object.entries(START_1RM_DB).map(([id, kg]) =>
      mkMax(id, nameOf(id), kg, true, (bumped / PROGRESSION_PER_BLOCK) * PROGRESSION_PER_BLOCK_DB),
    ),
    { ...mkMax('s_dips', 'Dips', 0, false, 0), maxReps: 12 + Math.floor(bumped / PROGRESSION_PER_BLOCK) },
  )

  await db.transaction('rw', db.settings, db.maxes, db.sessions, db.oneRm, async () => {
    await Promise.all([db.sessions.clear(), db.maxes.clear(), db.oneRm.clear()])
    await db.sessions.bulkAdd(sessions)
    await db.oneRm.bulkPut(oneRm)
    await db.settings.put(
      baseSettings({
        currentPhaseId: 'gm',
        phaseStartDate: startIso,
        plan,
        beginner: { lifts: dbWeights },
        bodyweightKg: 82,
        onboarded: true, // skip the welcome flow for a clean demo
        lastBackupAt: now.getTime(), // suppress the "back up your data" nudge
      }),
    )
  })

  const lifted = sessions.filter((s) => s.type === 'lift').length
  return `seeded ${sessions.length} sessions — ${BEGINNER_WEEKS} weeks of Beginner, then ${
    MASS_BLOCKS.filter((b) => b.protocolId === 'gm').length
  } Grey Man blocks (${lifted} lifting days). Now mid-block, week ${WEEK_IN_CURRENT_BLOCK}.`
}

export async function clearAll(): Promise<string> {
  await db.transaction('rw', db.settings, db.maxes, db.sessions, db.oneRm, async () => {
    await Promise.all([db.sessions.clear(), db.maxes.clear(), db.oneRm.clear()])
    await db.settings.put(baseSettings())
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
