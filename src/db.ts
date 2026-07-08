import Dexie, { type Table } from 'dexie'
import type { MaxEntry, SessionLog, Settings } from './types'
import { nextMonday } from './lib/date'

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
  phaseStartDate: '2026-07-13', // Monday of Base Building week 1 (overridden to next Monday at first launch)
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
  if (!s) await db.settings.put({ ...DEFAULT_SETTINGS, phaseStartDate: nextMonday(), onboarded: false })
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = (await db.settings.get('app')) ?? DEFAULT_SETTINGS
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

/** Zero all accumulated forced-progression bumps (used when retesting fresh). */
export async function clearProgression(): Promise<void> {
  const all = await db.maxes.toArray()
  await db.maxes.bulkPut(all.map((m) => ({ ...m, bumpKg: 0 })))
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
