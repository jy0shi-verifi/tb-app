import Dexie, { type Table } from 'dexie'
import type { MaxEntry, OneRmEntry, SessionLog, Settings, Snapshot } from './types'
import { nextMonday } from './lib/date'
import { repairDate, rowOfFamily, type SessionFamily } from './lib/sessions'
import { PROTOCOLS, DEFAULT_PHASE_ID } from './program'

export class TBDatabase extends Dexie {
  settings!: Table<Settings, string>
  maxes!: Table<MaxEntry, string>
  sessions!: Table<SessionLog, number>
  oneRm!: Table<OneRmEntry, [string, string]>
  snapshots!: Table<Snapshot, number>

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
    // v3: automatic on-device backups (audit A5, docs/mass-design.md §11.1).
    //
    // Same shape of migration as v2 — ADD ONE STORE, TOUCH NOTHING ELSE — for
    // the same reason: the data it sits beside is irreplaceable.
    //
    // Putting snapshots in their own store is the whole safety property. Every
    // destructive path in this app clears tables BY NAME (`clearAll` and the
    // demo seeder in src/dev/seed.ts, `importBackup` below), so a store none of
    // them names survives all of them without any call site having to remember.
    // That is structural, not a convention — and this codebase has been bitten
    // four times by conventions a call site forgot.
    this.version(3).stores({
      snapshots: '++id, takenAt',
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
  // phase id from before that programme was removed — 'operator', 'base-building'.
  // Those have no generator, so coerce them; otherwise resolvePosition falls back
  // and every screen renders the wrong week.
  //
  // Coerce only ids that DO NOT resolve. The original version pinned this to
  // 'beginner' unconditionally, which would now silently undo a switch to Grey Man
  // on every app open.
  if (!PROTOCOLS[s.currentPhaseId]) {
    await db.settings.put({ ...s, currentPhaseId: DEFAULT_PHASE_ID })
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

/**
 * Merge a patch into the single settings row.
 *
 * The read and the write are inside one `rw` transaction on purpose. As a bare
 * read-modify-write this could lose a concurrent update: Strava's token refresh
 * rotates `strava.refreshToken` in the background, and a settings screen saving
 * a theme from render state a moment later would write back the OLD token —
 * silently breaking the connection until a reconnect (audit code-01 F8). Dexie
 * serialises transactions on the same table, so the read here always sees the
 * previous write.
 */
export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const cur = (await db.settings.get('app')) ?? DEFAULT_SETTINGS
    await db.settings.put({ ...cur, ...patch, id: 'app' })
  })
}

/**
 * The result of asking to remove a logged session.
 *
 * A Strava-linked row is never actually deleted: `stravaSync` re-imports the
 * activity on the next sync, so deleting one makes it resurrect — usually as an
 * un-dismissable ghost the user deletes again. Un-ticking `done` is the
 * behaviour that survives a sync.
 */
export type DeleteSessionResult = 'deleted' | 'unticked' | 'missing'

/**
 * Remove a logged session, honouring the Strava invariant.
 *
 * The invariant used to live ONLY inside `Today.tsx`'s `markDone` — Session and
 * History both called `db.sessions.delete` directly, so a deleted run came
 * straight back on the next sync (audit code-01 F6). Putting it here is the same
 * move `applyBeginnerProgress` and `lastPerformance` already made: a rule that
 * every call site must remember belongs where a call site cannot forget it.
 */
export async function deleteSession(id: number): Promise<DeleteSessionResult> {
  const row = await db.sessions.get(id)
  if (!row) return 'missing'
  if (row.stravaId != null) {
    await db.sessions.update(id, { done: false })
    return 'unticked'
  }
  await db.sessions.delete(id)
  return 'deleted'
}

/**
 * Every session logged on a date, repaired.
 *
 * A date can now hold TWO rows on purpose — one lifting, one conditioning
 * (backlog F1). `sessions.date` was always a non-unique index and this query
 * always returned every match; what changed is that the callers stopped
 * assuming there is one.
 *
 * The repair itself is pure and lives in `src/lib/sessions.ts` (`repairDate`),
 * which merges duplicates WITHIN a family and drops an empty auto-completed
 * rest row once real work shares its date. Rows of different families are never
 * merged — that is the whole point of the change. Writes are serialised, so the
 * duplicates being repaired are only ones an older build left behind (audit A6).
 */
export async function sessionsForDate(date: string): Promise<SessionLog[]> {
  const rows = await db.sessions.where('date').equals(date).toArray()
  const { keep, deleteIds } = repairDate(rows)
  // A merge always retires at least one row and dropping a stale rest row always
  // names one, so an empty `deleteIds` means nothing changed — and this runs on
  // every read of a date, so it must not write on the happy path.
  if (deleteIds.length) {
    await db.transaction('rw', db.sessions, async () => {
      for (const row of keep) await db.sessions.put(row)
      await db.sessions.bulkDelete(deleteIds)
    })
  }
  return keep
}

/**
 * The row holding one kind of work on a date.
 *
 * `family` is what makes a lift and a run coexist: pass `'lift'` and a Strava
 * run on the same date is invisible to you, so writing your lift can no longer
 * overwrite it (audit code-01 F7). Omit it and you get the date's first row,
 * which is what the single-session screens want.
 */
export async function sessionForDate(
  date: string,
  family?: SessionFamily,
): Promise<SessionLog | undefined> {
  const rows = await sessionsForDate(date)
  return family ? rowOfFamily(rows, family) : rows[0]
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
  // The gate used to be `typeof data.version === 'number' && ...`, so a file
  // carrying `"version": "3"` (a string) skipped it entirely and was imported as
  // if it were current — silently reinterpreting a schema this build does not
  // understand. Backup portability is the migration contract (CLAUDE.md), so an
  // unreadable version is a refusal, not a shrug. (audit code-01 F11)
  if (data.version !== undefined && typeof data.version !== 'number')
    throw new Error('Backup has no readable version number — it may be corrupt.')
  if (typeof data.version === 'number' && data.version > BACKUP_VERSION)
    throw new Error('This backup is from a newer app version — update the app first.')
  if (!Array.isArray(data.settings) || !Array.isArray(data.maxes) || !Array.isArray(data.sessions))
    throw new Error('Backup is missing its data tables — it may be truncated.')
  if (!data.settings.some((s) => s?.id === 'app'))
    throw new Error('Backup has no app settings row — it may be corrupt.')
  for (const row of data.sessions) {
    if (!row || typeof row !== 'object' || typeof (row as { date?: unknown }).date !== 'string')
      throw new Error('Backup has a session row the app cannot read — it may be corrupt.')
  }
  for (const row of data.settings) {
    if (!row || typeof row !== 'object' || typeof (row as { id?: unknown }).id !== 'string')
      throw new Error('Backup has a settings row the app cannot read — it may be corrupt.')
  }
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
      // but only the ones that genuinely do not resolve, so importing a v2 backup
      // taken on Grey Man does not silently drop you back to Beginner. The
      // sessions themselves keep their original phaseId for history either way.
      const settings = data.settings.map((s) =>
        s.id === 'app'
          ? {
              ...s,
              strava: currentStrava ?? s.strava,
              currentPhaseId: PROTOCOLS[s.currentPhaseId] ? s.currentPhaseId : DEFAULT_PHASE_ID,
            }
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
