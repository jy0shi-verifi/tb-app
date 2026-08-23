import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { appendFileSync } from 'node:fs'
import Dexie from 'dexie'

const OUT = 'C:/Users/JOSHBI~1/AppData/Local/Temp/claude/C--Users-Josh-Birch-OneDrive---joshua-birch-Claude-Projects-tb-app/5a30346a-8db8-4a68-9828-0e92d82e4daa/scratchpad/probe.txt'
const LOG = (...a: unknown[]) => appendFileSync(OUT, a.map(String).join(' ') + '\n')

describe('stale v1 build opens a v2 database', () => {
  it('probe', async () => {
    const cur = new Dexie('downgrade-probe')
    cur.version(1).stores({ settings: 'id', maxes: 'liftId', sessions: '++id, date, phaseId' })
    cur.version(2).stores({ oneRm: '[protocolId+exerciseId]' })
    await cur.open()
    await cur.table('sessions').bulkPut([{ date: '2026-08-01', phaseId: 'gm', week: 1, day: 0, type: 'lift', title: 'x', exercises: [], done: true, createdAt: 1 }])
    await cur.table('oneRm').put({ protocolId: 'gm', exerciseId: 'squat', kg: 100 })
    LOG('v2 verno', cur.verno, 'sessions', await cur.table('sessions').count())
    cur.close()

    const old = new Dexie('downgrade-probe')
    old.version(1).stores({ settings: 'id', maxes: 'liftId', sessions: '++id, date, phaseId' })
    try {
      await old.open()
      LOG('OLD BUILD OPENED OK verno=', old.verno, 'sessions=', await old.table('sessions').count(), 'tables=', old.tables.map((t) => t.name).join('/'))
    } catch (e) {
      LOG('OLD BUILD open() FAILED:', (e as Error).name, '|', (e as Error).message)
    }
    try {
      LOG('post-failure read:', await old.table('sessions').count())
    } catch (e) {
      LOG('post-failure read threw:', (e as Error).name, (e as Error).message)
    }
    try {
      await old.table('sessions').add({ date: '2026-08-02', phaseId: 'gm', week: 1, day: 1, type: 'lift', title: 'y', exercises: [], done: true, createdAt: 2 })
      LOG('old build WROTE a session')
    } catch (e) {
      LOG('old build write threw:', (e as Error).name, (e as Error).message)
    }
    old.close()

    const again = new Dexie('downgrade-probe')
    again.version(1).stores({ settings: 'id', maxes: 'liftId', sessions: '++id, date, phaseId' })
    again.version(2).stores({ oneRm: '[protocolId+exerciseId]' })
    await again.open()
    LOG('after reopen at v2: verno', again.verno, 'sessions', await again.table('sessions').count(), 'oneRm', await again.table('oneRm').count())
    again.close()
    expect(true).toBe(true)
  })
})
