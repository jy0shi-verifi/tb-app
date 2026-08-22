import Dexie, { type Table } from 'dexie'
import type { MaxEntry, OneRmEntry, SessionLog, Settings } from './types'
import { nextMonday } from './lib/date'

export class TBDatabase extends Dexie {
  settings!: Table<Settings, string>
  maxes!: Table<MaxEntry, string>
  sessions!: Table<SessionLog, number>
  oneRm!: Table<OneRmEntry, [string, string]>

  constructor() {
    super('tb-app')
    this.version(1).stores({
      settings: 'id',
      maxes: 'liftId',
      sessions: '++id, date, phaseId',
    })
    // v2 (MASS rebuild): add `oneRm`. This is the first migration this project
    // has ever had, and the data it sits next to is irreplaceable, so it is kept
    // as small as a migration can be — ADD ONE STORE, TOUCH NOTHING ELSE.
    //
    // Only the new store is listed on purpose. Dexie treats `.stores()` on a new
    // version as a delta and inherits everything unlisted, so re-declaring the
    // existing three would buy nothing and risks a typo silently redefining a
    // live index. `maxes` in particular must keep its exact v1 shape: nothing
    // writes it any more, but v1 backups still round-trip through it.
    this.version(2).stores({
      oneRm: '[protocolId+exerciseId]',
    })
  }
}

export const db = new TBDatabase()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  dbIncrement: 2,
  currentPhaseId: 'beginner',
  phaseStartDate: '2026-07-13', // overridden to next Monday at first launch
  theme: 'system',
}

/** Apply the colour theme by toggling classes on <html>. */
export function applyTheme(mode: Settings['theme']): void {
  const el = document.documentElement
  el.classList.remove('dark', 'light')
  if (mode === 'dark') el.classList.add('dark')
  else if (mode === 'light') el.classList.add('light')
  // 'system' / undefined → no class, CSS media query decides
}

export async function ensureSeeded(): Promise<void> {
  const s = await db.settings.get('app')
  // first launch: start = upcoming Monday (never a hardcoded past date), and show onboarding
  if (!s) {
    await db.settings.put({ ...DEFAULT_SETTINGS, phaseStartDate: nextMonday(), onboarded: false })
    return
  }
  // Existing installs (and restored backups) may still carry a Tactical Barbell
  // phase id from before that programme was removed. There is no plan generator
  // for those any more, so coerce to the only phase that exists — otherwise
  // resolvePosition falls back and every screen renders the wrong week.
  if (s.currentPhaseId !== 'beginner') {
    await db.settings.put({ ...s, currentPhaseId: 'beginner' })
  }
}

/**
 * Ask the browser to make our IndexedDB persistent so it isn't silently evicted
 * (iOS/Safari can clear best-effort storage after ~7 days idle — and this is the
 * only copy of Josh's training data). Safe/no-op where unsupported. Returns the
 * granted state so the UI can nudge a backup if the browser refused.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = (await db.settings.get('app')) ?? DEFAULT_SETTINGS
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

// ---- backup ----
/**
 * v1 → v2 adds `oneRm` (the MASS rebuild's protocol-scoped maxes).
 *
 * Reading a v1 file MUST keep working: `parseBackup` fills a missing `oneRm`
 * with `[]`, which is exactly right — a v1 file predates MASS and has no 1RMs to
 * carry. Nothing about v1's `settings`/`maxes`/`sessions` is reinterpreted.
 *
 * Note the migration only runs one way: a v2 file will NOT load into the live
 * app at tb.joshua-birch.co.uk, because its `parseBackup` refuses
 * `version > BACKUP_VERSION`. That is intended — the two apps are separate
 * origins — but it means taking a fresh v1 export before switching over.
 */
export const BACKUP_VERSION = 2

export interface Backup {
  app: 'tb-app'
  version: number
  exportedAt: string
  settings: Settings[]
  maxes: MaxEntry[]
  sessions: SessionLog[]
  /** Added in v2. Absent in v1 files; normalised to `[]` by `parseBackup`. */
  oneRm: OneRmEntry[]
}

/** A quick shape check used by both import and the pre-import confirmation. */
export function parseBackup(json: string): Backup {
  let data: Partial<Backup>
  try {
    data = JSON.parse(json) as Partial<Backup>
  } catch {
    throw new Error('That file isn’t valid JSON — is it a TB backup?')
  }
  if (data.app !== 'tb-app') throw new Error('Not a Tactical Barbell backup file.')
  if (typeof data.version === 'number' && data.version > BACKUP_VERSION)
    throw new Error('This backup is from a newer app version — update the app first.')
  if (!Array.isArray(data.settings) || !Array.isArray(data.maxes) || !Array.isArray(data.sessions))
    throw new Error('Backup is missing its data tables — it may be truncated.')
  if (!data.settings.some((s) => s?.id === 'app'))
    throw new Error('Backup has no app settings row — it may be corrupt.')
  // Upgrade path for v1 files: the table simply did not exist yet. A present but
  // non-array `oneRm` is corruption, not an old file, so it is rejected.
  if (data.oneRm === undefined) data.oneRm = []
  else if (!Array.isArray(data.oneRm))
    throw new Error('Backup’s 1RM table is malformed — it may be corrupt.')
  return data as Backup
}

export async function exportBackup(): Promise<string> {
  const [settings, maxes, sessions, oneRm] = await Promise.all([
    db.settings.toArray(),
    db.maxes.toArray(),
    db.sessions.toArray(),
    db.oneRm.toArray(),
  ])
  const backup: Backup = {
    app: 'tb-app',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // Never write live Strava OAuth tokens into a file the user is told to keep
    // safe / may email themselves. On restore we keep the on-device connection.
    settings: settings.map((s) => ({ ...s, strava: undefined })),
    maxes,
    sessions,
    oneRm,
  }
  return JSON.stringify(backup, null, 2)
}

export async function importBackup(json: string): Promise<void> {
  const data = parseBackup(json) // validates BEFORE we touch anything

  // Preserve the current on-device Strava connection (it's stripped from exports).
  const currentStrava = (await db.settings.get('app'))?.strava
  // Snapshot for rollback if the write fails partway.
  const snapshot = await exportBackup()

  try {
    await db.transaction('rw', db.settings, db.maxes, db.sessions, db.oneRm, async () => {
      await Promise.all([
        db.settings.clear(),
        db.maxes.clear(),
        db.sessions.clear(),
        db.oneRm.clear(),
      ])
      // A v1 backup may have been taken while the old Tactical Barbell programme
      // was active. Its phase ids no longer resolve, so normalise on the way in —
      // the sessions themselves keep their original phaseId for history.
      // TODO(mass): once MASS protocols are registered, this must coerce to a
      // phase that EXISTS rather than always to 'beginner'. See docs/mass-design.md §3.3.
      const settings = data.settings.map((s) =>
        s.id === 'app'
          ? { ...s, strava: currentStrava ?? s.strava, currentPhaseId: 'beginner' }
          : s,
      )
      await db.settings.bulkPut(settings)
      if (data.maxes.length) await db.maxes.bulkPut(data.maxes)
      if (data.sessions.length) await db.sessions.bulkPut(data.sessions)
      if (data.oneRm.length) await db.oneRm.bulkPut(data.oneRm)
    })
  } catch (err) {
    // Roll back to the snapshot so a failed restore never leaves him with less.
    const snap = JSON.parse(snapshot) as Backup
    await db.transaction('rw', db.settings, db.maxes, db.sessions, db.oneRm, async () => {
      await Promise.all([
        db.settings.clear(),
        db.maxes.clear(),
        db.sessions.clear(),
        db.oneRm.clear(),
      ])
      await db.settings.bulkPut(snap.settings.map((s) => (s.id === 'app' ? { ...s, strava: currentStrava } : s)))
      await db.maxes.bulkPut(snap.maxes)
      await db.sessions.bulkPut(snap.sessions)
      await db.oneRm.bulkPut(snap.oneRm ?? [])
    })
    throw new Error(`Restore failed — kept your existing data. (${(err as Error).message})`)
  }
}
