import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from './db'
import type { MaxEntry, SessionLog, Settings } from './types'

export function useSettings(): Settings {
  return useLiveQuery(
    async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS,
    [],
    DEFAULT_SETTINGS,
  )
}

export function useMaxes(): MaxEntry[] {
  return useLiveQuery(() => db.maxes.toArray(), [], [] as MaxEntry[])
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
