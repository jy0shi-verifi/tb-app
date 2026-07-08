// ---- shared domain types ----

export type LoadBasis = 'tm' | '1rm'
export type DbIncrement = 2 | 1
export type SessionType = 'lift' | 'se' | 'run' | 'hic' | 'rest'

/** A single lift in a phase's cluster. Loads are per-dumbbell. */
export interface Lift {
  id: string
  name: string
  short: string
}

/** Per-week prescription for a wave-based lifting phase (e.g. Operator). */
export interface WaveWeek {
  week: number
  pct: number
  sets: number
  reps: number
  note?: string
}

/** A tested max for one lift: weight-per-DB x reps, from Test Day. */
export interface MaxEntry {
  liftId: string
  testWeight: number // kg per dumbbell
  testReps: number
}

/** One logged set the user actually performed. */
export interface LoggedSet {
  weight?: number // kg per dumbbell (undefined for bodyweight)
  reps: number
  done: boolean
}

/** One logged exercise within a session. */
export interface LoggedExercise {
  name: string
  sets: LoggedSet[]
}

/** A saved workout record. */
export interface SessionLog {
  id?: number
  date: string // ISO yyyy-mm-dd
  phaseId: string
  week: number
  day: number // 0=Mon..6=Sun
  type: SessionType
  title: string
  exercises: LoggedExercise[]
  // for run/hic completion:
  done: boolean
  durationMin?: number
  feel?: 'easy' | 'ok' | 'hard'
  notes?: string
  createdAt: number
}

export interface Settings {
  id: 'app'
  dbIncrement: DbIncrement
  loadBasis: LoadBasis
  currentPhaseId: string
  phaseStartDate: string // ISO yyyy-mm-dd (Monday of week 1)
}
