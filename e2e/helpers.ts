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
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !BENIGN.some((r) => r.test(m.text()))) errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
    await use(errors)
    expect(errors, `console errors / crashes:\n${errors.join('\n')}`).toEqual([])
  },
})

export { expect }

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
