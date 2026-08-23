import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from './db'
import { narrowMaxes, protocolFor } from './program'
import type { MaxEntry, OneRmEntry, SessionLog, Settings } from './types'

export function useSettings(): Settings {
  return useLiveQuery(
    async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS,
    [],
    DEFAULT_SETTINGS,
  )
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

export function useSessionByDate(date: string): SessionLog | undefined {
  return useLiveQuery(() => db.sessions.where('date').equals(date).first(), [date], undefined)
}
