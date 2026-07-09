// ---- shared domain types ----

export type LoadBasis = 'tm' | '1rm'
export type DbIncrement = 2 | 1
export type SessionType = 'lift' | 'se' | 'run' | 'hic' | 'rest'

/** A single lift in a phase's cluster. Loads are per-dumbbell. */
export interface Lift {
  id: string
  name: string
  short: string
  /** forced-progression step added to the 1RM on a stall/block (kg): upper ~2.5, lower ~5 */
  progressStep?: number
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
  /** cumulative forced-progression added to the est. 1RM (kg per DB), default 0 */
  bumpKg?: number
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
  // completion + conditioning data (run/HIC metrics are populated from Strava)
  done: boolean
  durationMin?: number
  distanceKm?: number
  avgHr?: number
  stravaId?: number
  feel?: 'easy' | 'ok' | 'hard'
  notes?: string
  createdAt: number
}

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  id: 'app'
  dbIncrement: DbIncrement
  loadBasis: LoadBasis
  currentPhaseId: string
  phaseStartDate: string // ISO yyyy-mm-dd (Monday of week 1)
  theme?: ThemeMode
  onboarded?: boolean
  /** which 6-week Operator block since the last retest (1-based); first run = 12 wks before retest */
  operatorBlock?: number
  /** true once the first 12-week Operator run has been retested — after which retest every 6 wks (TB1 p.108) */
  operatorFirstRunDone?: boolean
  /** epoch ms of the last successful Strava sync — throttles auto-sync on app open */
  lastStravaSyncAt?: number
  /** Strava OAuth tokens (on-device only); set after "Connect Strava". */
  strava?: {
    accessToken: string
    refreshToken: string
    expiresAt: number // epoch seconds
    athleteId?: number
    /** OAuth scopes granted at connect (comma-separated); write-back needs activity:write */
    scope?: string
  }
}
