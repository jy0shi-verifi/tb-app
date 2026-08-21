// ---- shared domain types ----

export type DbIncrement = 2 | 1
/**
 * 'se' and 'hic' are retained for backward compatibility only: sessions logged
 * under the old Tactical Barbell programme still carry them, and backup files
 * must round-trip unchanged. Nothing generates them any more.
 */
export type SessionType = 'lift' | 'se' | 'run' | 'hic' | 'rest'

/**
 * A tested max for one lift: weight-per-DB x reps.
 *
 * Retained as part of the backup contract — the `maxes` table still round-trips
 * through export/import so v1 backup files stay readable. Nothing writes new
 * entries; the Tactical Barbell max calculator that produced them was removed
 * pending a rebuild from the books.
 */
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
  /** always 'beginner' — coerced at startup. Kept so stored rows and backups round-trip. */
  currentPhaseId: string
  phaseStartDate: string // ISO yyyy-mm-dd (Monday of week 1)
  theme?: ThemeMode
  onboarded?: boolean
  /** Beginner linear-progression state: current working weight (kg/DB) per lift id */
  beginner?: { lifts: Record<string, number> }
  /** epoch ms of the last successful Strava sync — throttles auto-sync on app open */
  lastStravaSyncAt?: number
  /** epoch ms of the last data export (backup) — drives the "back up your data" nudge */
  lastBackupAt?: number
  /** last Strava sync error message (undefined = healthy); surfaced as a banner */
  stravaSyncError?: string
  /** true when a Strava call failed auth (revoked/expired) — prompt a reconnect */
  stravaNeedsReconnect?: boolean
  /** rest-timer seconds override; undefined/0 = Auto */
  restSec?: number
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
