import { exportBackup, saveSettings } from '../db'
import { downloadBlob } from './download'
import type { SessionLog, Settings } from '../types'

/**
 * Export the DB to a downloaded JSON file and record when we last backed up.
 *
 * Two things here were audit A10. The blob URL used to be revoked synchronously
 * right after `a.click()`, which is fragile in an iOS PWA — some browsers start
 * the download asynchronously and hand back an empty file. `downloadBlob` defers
 * the revoke and inserts the anchor into the DOM, so this now goes through it
 * rather than keeping a second, worse copy of the same code.
 *
 * And `lastBackupAt` used to be stamped unconditionally, so a FAILED export
 * silently disarmed the "back up your data" nudge for a fortnight — the one
 * prompt standing between Josh and an unrecoverable loss. It is now stamped only
 * after the export has actually been produced and handed to the browser, and any
 * failure propagates so the caller can say so.
 */
export async function downloadBackup(): Promise<void> {
  const json = await exportBackup()
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(`tb-backup-${new Date().toISOString().slice(0, 10)}.json`, blob)
  await saveSettings({ lastBackupAt: Date.now() })
}

const NUDGE_AFTER_DAYS = 14
const NUDGE_AFTER_SESSIONS = 12

/**
 * Whether to nudge a backup: never backed up (with data to lose), or it's been
 * a while / a chunk of sessions since the last export. Keeps the safety net live
 * for a user who won't export on a schedule.
 */
export function shouldNudgeBackup(settings: Settings, sessions: SessionLog[]): boolean {
  const done = sessions.filter((s) => s.done).length
  if (done === 0) return false
  const last = settings.lastBackupAt
  if (!last) return done >= 3 // has real data but never backed up
  const days = (Date.now() - last) / 86_400_000
  const since = sessions.filter((s) => s.createdAt > last).length
  return days >= NUDGE_AFTER_DAYS || since >= NUDGE_AFTER_SESSIONS
}
