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

/**
 * A one-rep max for one exercise under one protocol.
 *
 * Replaces `MaxEntry` for everything new. `MaxEntry` could not be reused: its
 * `testWeight` is kilos *per dumbbell*, which cannot express a barbell load, and
 * it is keyed by `liftId` alone with no protocol scope — so a rebuilt protocol
 * reusing an old id would silently inherit stale progression state
 * (docs/codebase-map.md §8.5). `MaxEntry` is now frozen and read only for backup
 * round-tripping.
 *
 * The scope matters more than it looks. Beginner mode is being kept as a
 * fallback, and its lifts share display names with logged Tactical Barbell
 * history ('DB Bench Press', '1-Arm DB Row', 'DB Romanian Deadlift'). Keying on
 * `(protocolId, exerciseId)` is what stops one protocol's progress feeding
 * another's. See docs/mass-design.md §3.4 and §3.5.
 */
export interface OneRmEntry {
  protocolId: string
  exerciseId: string
  /** Display name at the time of entry — for history, never for lookup. */
  exerciseName: string
  /** Total on the bar, or per-dumbbell — see `unit`. */
  kg: number
  unit: 'total' | 'perDumbbell'
  /**
   * 'tested' = an actual 1RM. 'estimated' = derived from a 2RM/3RM, which the
   * book explicitly sanctions: "no need to test a true 1RM with this protocol"
   * (MASS p.90).
   */
  source: 'tested' | 'estimated'
  /**
   * Bodyweight movements have no load — max reps stands in for the 1RM
   * (MASS p.90). When set, `kg` is 0 and this drives the prescription instead.
   */
  maxReps?: number
  /** ISO yyyy-mm-dd of the test this was derived from. */
  testedAt: string
  /**
   * Cumulative Forced Progression added since that test, in kg. Lets the app
   * show "tested 100, now 105" and lets a retest reset the drift cleanly.
   */
  progressedKg: number
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

/**
 * One leg of a time-based run/walk session (Couch-to-5K, and the book's Green
 * conditioning sessions later). Lives here rather than in `beginner.ts` so the
 * protocol layer can reference it without importing a specific programme.
 */
export interface Interval {
  kind: 'walk' | 'jog'
  sec: number
}

export type ThemeMode = 'system' | 'light' | 'dark'

/**
 * A user-chosen exercise stored in settings. Mirrors `ClusterExercise` in
 * `protocol.ts` but declared here so `Settings` stays free of protocol imports.
 */
export interface ClusterExerciseRef {
  id: string
  name: string
  short?: string
  defaultLoading: 'barbell' | 'dumbbell' | 'bodyweightReps' | 'weightedBodyweight' | 'unloaded'
}

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
  /** Bodyweight in kg. Needed for weighted-bodyweight loads (MASS p.90). */
  bodyweightKg?: number
  /**
   * The bar and plates available. Defaults to a 20 kg bar with standard kg
   * plates (see `DEFAULT_BAR_SETUP`); `platePairsKg` is a list of pair
   * denominations, so adding 0.5 is all microplates need.
   */
  bar?: { barKg: number; platePairsKg: number[] }
  /** MASS state. `sCluster` is the user-built Grey Man supplementary cluster (p.49). */
  mass?: {
    sCluster?: { s1?: ClusterExerciseRef[]; s2?: ClusterExerciseRef[] }
  }
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
