import { exportBackup, saveSettings } from '../db'
import type { SessionLog, Settings } from '../types'

/** Export the DB to a downloaded JSON file and record when we last backed up. */
export async function downloadBackup(): Promise<void> {
  const json = await exportBackup()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tb-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
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
