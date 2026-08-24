/**
 * Automatic on-device backups — audit A5, docs/mass-design.md §11.1.
 *
 * Josh's direction (2026-08-24): rather than only putting a confirm on the demo
 * button, back up automatically so the blast radius of ANY destructive action is
 * small. If a recent snapshot always exists on device, no single mistake is
 * unrecoverable — which also softens A10 (a failed export silently disarming the
 * nudge) and A11 (the untested import rollback).
 *
 * The safety property lives in `src/db.ts`, not here: `snapshots` is its own
 * store, and every destructive path in the app clears tables BY NAME, so a store
 * none of them names survives all of them by construction.
 */
import { db, exportBackup, importBackup } from '../db'
import type { Snapshot } from '../types'

/**
 * How many to keep, by kind.
 *
 * Split on purpose. Routine app-open snapshots are the many; the ones taken
 * immediately before a destructive action are the few that actually matter, and
 * a simple "keep the last N" would let a busy fortnight of app opens push the
 * pre-demo snapshot out of the window exactly when it is needed.
 */
export const KEEP_ROUTINE = 5
export const KEEP_GUARD = 5

/** At most one routine snapshot per day — the app is opened every morning. */
const ROUTINE_INTERVAL_MS = 20 * 60 * 60 * 1000

const isRoutine = (s: Snapshot): boolean => s.reason === 'app-open'

/**
 * Write a snapshot of everything `exportBackup` covers.
 *
 * Never throws: a backup that breaks the thing it is protecting is worse than no
 * backup. Callers about to do something destructive still get a boolean so they
 * can warn.
 */
export async function takeSnapshot(reason: Snapshot['reason']): Promise<boolean> {
  try {
    const json = await exportBackup()
    const sessionCount = await db.sessions.count()
    await db.snapshots.add({
      takenAt: Date.now(),
      reason,
      json,
      sessionCount,
      bytes: json.length,
    })
    await prune()
    return true
  } catch {
    return false
  }
}

/**
 * The app-open snapshot, throttled.
 *
 * Skipped entirely when there is nothing to lose — a fresh install would
 * otherwise fill its retention window with snapshots of an empty database and
 * push out nothing useful, but also gains nothing.
 */
export async function snapshotOnOpen(): Promise<void> {
  try {
    if ((await db.sessions.count()) === 0) return
    const last = await db.snapshots.orderBy('takenAt').last()
    if (last && Date.now() - last.takenAt < ROUTINE_INTERVAL_MS) return
    await takeSnapshot('app-open')
  } catch {
    /* never let a backup break the app open */
  }
}

/** Newest first. */
export async function listSnapshots(): Promise<Snapshot[]> {
  return (await db.snapshots.orderBy('takenAt').reverse().toArray()) ?? []
}

/**
 * Restore one, taking a snapshot of the CURRENT state first.
 *
 * That last part is the point: restoring the wrong snapshot is itself a
 * destructive action, and it should be as undoable as the one it is undoing.
 */
export async function restoreSnapshot(id: number): Promise<void> {
  const snap = await db.snapshots.get(id)
  if (!snap) throw new Error('That snapshot is no longer on this device.')
  await takeSnapshot('pre-restore')
  await importBackup(snap.json)
}

/** Drop the oldest of each kind past its retention. */
async function prune(): Promise<void> {
  const all = await listSnapshots() // newest first
  const doomed: number[] = []
  let routine = 0
  let guard = 0
  for (const s of all) {
    if (isRoutine(s)) {
      routine++
      if (routine > KEEP_ROUTINE && s.id != null) doomed.push(s.id)
    } else {
      guard++
      if (guard > KEEP_GUARD && s.id != null) doomed.push(s.id)
    }
  }
  if (doomed.length) await db.snapshots.bulkDelete(doomed)
}

const REASON_LABEL: Record<Snapshot['reason'], string> = {
  'app-open': 'app open',
  'pre-demo': 'before demo data',
  'pre-reset': 'before reset',
  'pre-import': 'before import',
  'pre-restore': 'before restore',
  manual: 'manual',
}

export const snapshotLabel = (s: Snapshot): string => REASON_LABEL[s.reason] ?? s.reason

/** "Today 07:12" / "Yesterday 06:58" / "22 Aug 07:04", in local time. */
export function snapshotWhen(s: Snapshot, now: Date = new Date()): string {
  const d = new Date(s.takenAt)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.floor((midnight.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000)
  if (days === 0) return `Today ${time}`
  if (days === 1) return `Yesterday ${time}`
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${time}`
}
