import Dexie, { type Table } from 'dexie'
import type { MaxEntry, SessionLog, Settings } from './types'

export class TBDatabase extends Dexie {
  settings!: Table<Settings, string>
  maxes!: Table<MaxEntry, string>
  sessions!: Table<SessionLog, number>

  constructor() {
    super('tb-app')
    this.version(1).stores({
      settings: 'id',
      maxes: 'liftId',
      sessions: '++id, date, phaseId',
    })
  }
}

export const db = new TBDatabase()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  dbIncrement: 2,
  loadBasis: 'tm',
  currentPhaseId: 'base-building',
  phaseStartDate: '2026-07-13', // Monday of Base Building week 1
}

export async function ensureSeeded(): Promise<void> {
  const s = await db.settings.get('app')
  if (!s) await db.settings.put(DEFAULT_SETTINGS)
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = (await db.settings.get('app')) ?? DEFAULT_SETTINGS
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

// ---- backup ----
export interface Backup {
  app: 'tb-app'
  version: number
  exportedAt: string
  settings: Settings[]
  maxes: MaxEntry[]
  sessions: SessionLog[]
}

export async function exportBackup(): Promise<string> {
  const [settings, maxes, sessions] = await Promise.all([
    db.settings.toArray(),
    db.maxes.toArray(),
    db.sessions.toArray(),
  ])
  const backup: Backup = {
    app: 'tb-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    maxes,
    sessions,
  }
  return JSON.stringify(backup, null, 2)
}

export async function importBackup(json: string): Promise<void> {
  const data = JSON.parse(json) as Partial<Backup>
  if (data.app !== 'tb-app') throw new Error('Not a Tactical Barbell backup file.')
  await db.transaction('rw', db.settings, db.maxes, db.sessions, async () => {
    await Promise.all([db.settings.clear(), db.maxes.clear(), db.sessions.clear()])
    if (data.settings?.length) await db.settings.bulkPut(data.settings)
    if (data.maxes?.length) await db.maxes.bulkPut(data.maxes)
    if (data.sessions?.length) await db.sessions.bulkPut(data.sessions)
  })
}
