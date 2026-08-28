import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, sessionsForDate } from './db'
import { narrowMaxes, protocolFor } from './program'
import { rowOfFamily, type SessionFamily } from './lib/sessions'
import type { MaxEntry, OneRmEntry, SessionLog, Settings } from './types'

export function useSettings(): Settings {
  const row = useLiveQuery(
    async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS,
    [],
    undefined as Settings | undefined,
  )
  return row ?? DEFAULT_SETTINGS
}

/** False until IndexedDB has answered — do not paint DEFAULT_SETTINGS as truth. */
export function useSettingsReady(): boolean {
  return useLiveQuery(() => db.settings.get('app').then((r) => r ?? true), []) !== undefined
}

/** The frozen v1 table. Nothing writes it; kept for backup round-tripping. */
export function useLegacyMaxes(): MaxEntry[] {
  return useLiveQuery(() => db.maxes.toArray(), [], [] as MaxEntry[])
}

/** Every stored 1RM, across all protocols. */
export function useAllOneRm(): OneRmEntry[] {
  return useLiveQuery(() => db.oneRm.toArray(), [], [] as OneRmEntry[])
}

/**
 * The 1RMs for one protocol, keyed by exercise id — the shape `sessionFor`
 * wants. Narrowing by `maxScope` here is what stops Beginner's per-dumbbell
 * maxes ever reaching a barbell calculation.
 */
export function useMaxesFor(phaseId: string | undefined): Record<string, OneRmEntry> {
  const rows = useAllOneRm()
  return narrowMaxes(rows, protocolFor(phaseId))
}

export function useSessions(): SessionLog[] {
  return useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    [],
    [] as SessionLog[],
  )
}

/**
 * Every session logged on a date — up to two, one lifting and one conditioning
 * (backlog F1).
 *
 * Returns `undefined` while IndexedDB answers, deliberately: a screen that
 * cannot tell "no sessions" from "not loaded yet" renders the empty state first
 * and then flickers, and this project has a standing rule against seeding state
 * from data that is still loading (CLAUDE.md).
 */
export function useSessionsByDate(date: string): SessionLog[] | undefined {
  return useLiveQuery(() => sessionsForDate(date), [date], undefined)
}

/**
 * The row holding one kind of work on a date.
 *
 * Pass the family of the session you mean. Without it you get the date's first
 * row, which since F1 may be the OTHER session of the day — so every caller that
 * knows what it is looking at should say so.
 */
export function useSessionByDate(date: string, family?: SessionFamily): SessionLog | undefined {
  const rows = useSessionsByDate(date)
  if (!rows) return undefined
  return family ? rowOfFamily(rows, family) : rows[0]
}
