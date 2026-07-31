import { test as base, expect, type Page } from '@playwright/test'

// Console noise that isn't a real defect (dev-server / platform chatter).
const BENIGN = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  /ResizeObserver loop/i,
  /manifest/i,
]

/**
 * Base test extended to FAIL if the app logs a console error or throws an
 * uncaught exception during the test — the class of runtime bug static review
 * misses. `errors` is exposed so a test can additionally assert on it.
 */
export const test = base.extend<{ errors: string[]; _noSplash: void }>({
  // Auto: suppress the cold-open intro splash so it never covers the app under test.
  _noSplash: [
    async ({ page }, provide) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('tb-no-splash', '1')
        } catch {
          /* no-op */
        }
      })
      await provide()
    },
    { auto: true },
  ],
  errors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !BENIGN.some((r) => r.test(m.text()))) errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
    await provide(errors)
    expect(errors, `console errors / crashes:\n${errors.join('\n')}`).toEqual([])
  },
})

export { expect }

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** YYYY-MM-DD for today + `days` (local time). */
export function isoOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return iso(d)
}
/** The Monday of the week `weeks` away from this week (0 = this Monday). */
export function mondayOffset(weeks: number): string {
  const d = new Date()
  const mi = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - mi + weeks * 7)
  return iso(d)
}

/** Seeded Operator test maxes (per-DB test weight x reps). */
export const OP_MAXES = [
  { liftId: 'op_bench', testWeight: 22, testReps: 5, bumpKg: 0 },
  { liftId: 'op_squat', testWeight: 28, testReps: 5, bumpKg: 0 },
  { liftId: 'op_row', testWeight: 18, testReps: 5, bumpKg: 0 },
]

/** Lift sessions in weeks 3, 6, 6 → makes blockCompleted() true for a -42d start. */
export function completedBlockSessions() {
  const lift = (date: string, week: number, day: number, createdAt: number) => ({
    date,
    phaseId: 'operator',
    week,
    day,
    type: 'lift',
    title: `Operator — Week ${week}`,
    exercises: [],
    done: true,
    createdAt,
  })
  return [lift(isoOffset(-27), 3, 0, 1), lift(isoOffset(-6), 6, 0, 2), lift(isoOffset(-4), 6, 2, 3)]
}

type SeedState = {
  settings?: Record<string, unknown>
  sessions?: Record<string, unknown>[]
  maxes?: Record<string, unknown>[]
}

/** Inject an arbitrary starting state (settings/sessions/maxes) and reload. */
export async function seedState(page: Page, state: SeedState): Promise<void> {
  await page.goto('/')
  await waitForDb(page)
  await page.evaluate(
    (s) =>
      new Promise<void>((res, rej) => {
        const open = indexedDB.open('tb-app')
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction(['settings', 'sessions', 'maxes'], 'readwrite')
          tx.objectStore('settings').clear()
          tx.objectStore('sessions').clear()
          tx.objectStore('maxes').clear()
          tx.objectStore('settings').put({
            id: 'app',
            dbIncrement: 2,
            loadBasis: 'tm',
            currentPhaseId: 'base-building',
            phaseStartDate: '2026-01-05',
            onboarded: true,
            theme: 'light',
            ...(s.settings ?? {}),
          })
          for (const m of s.maxes ?? []) tx.objectStore('maxes').put(m)
          for (const ses of s.sessions ?? []) tx.objectStore('sessions').add(ses)
          tx.oncomplete = () => res()
          tx.onerror = () => rej(tx.error)
        }
        open.onerror = () => rej(open.error)
      }),
    state,
  )
  await page.reload()
}

/** YYYY-MM-DD of an ISO date + n days. */
export function plusDays(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return iso(new Date(y, m - 1, d + n))
}

async function readStore(page: Page, store: string): Promise<Record<string, unknown>[]> {
  return page.evaluate(
    (name) =>
      new Promise((res, rej) => {
        const open = indexedDB.open('tb-app')
        open.onsuccess = () => {
          const req = open.result.transaction(name).objectStore(name).getAll()
          req.onsuccess = () => res(req.result)
          req.onerror = () => rej(req.error)
        }
        open.onerror = () => rej(open.error)
      }),
    store,
  )
}

/** Read the sessions table (to assert what autosave/sync actually wrote). */
export async function readSessions(page: Page) {
  return readStore(page, 'sessions')
}
/** Read the maxes table. */
export async function readMaxes(page: Page) {
  return readStore(page, 'maxes')
}
/** Read the single settings row. */
export async function readSettings(page: Page): Promise<Record<string, unknown> | undefined> {
  return (await readStore(page, 'settings'))[0]
}

/** Wait until the app's Dexie DB exists with its object stores created. */
async function waitForDb(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((res) => {
        const o = indexedDB.open('tb-app')
        o.onsuccess = () => {
          const ok = o.result.objectStoreNames.contains('settings')
          o.result.close()
          res(ok)
        }
        o.onerror = () => res(false)
      }),
    undefined,
    { timeout: 15_000 },
  )
}

/**
 * Put the app into an active Operator week whose Monday is a lift day, robust to
 * whatever "today" is. Returns that Monday's ISO date (an unlogged lift session).
 */
export async function setupOperator(page: Page): Promise<string> {
  await page.goto('/')
  await waitForDb(page)
  const monIso = await page.evaluate(
    () =>
      new Promise<string>((res, rej) => {
        const now = new Date()
        const mi = (now.getDay() + 6) % 7 // days since Monday
        const mon = new Date(now)
        mon.setDate(now.getDate() - mi)
        const iso = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`
        const open = indexedDB.open('tb-app')
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction(['settings', 'sessions', 'maxes'], 'readwrite')
          tx.objectStore('sessions').clear()
          tx.objectStore('settings').put({
            id: 'app',
            dbIncrement: 2,
            loadBasis: 'tm',
            currentPhaseId: 'operator',
            phaseStartDate: iso,
            operatorBlock: 2,
            operatorFirstRunDone: true,
            theme: 'light',
            onboarded: true,
          })
          for (const [liftId, w] of [
            ['op_bench', 22],
            ['op_squat', 28],
            ['op_row', 18],
          ] as const) {
            tx.objectStore('maxes').put({ liftId, testWeight: w, testReps: 5, bumpKg: 0 })
          }
          tx.oncomplete = () => res(iso)
          tx.onerror = () => rej(tx.error)
        }
        open.onerror = () => rej(open.error)
      }),
  )
  await page.reload()
  return monIso
}
