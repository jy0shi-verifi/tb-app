import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveSettings } from './db'
import { handleStravaRedirect } from './lib/strava'
import { syncStrava } from './lib/stravaSync'
import Layout from './components/Layout'
import UpdatePrompt from './components/UpdatePrompt'
import Onboarding from './screens/Onboarding'
import Today from './screens/Today'
import Session from './screens/Session'
import Program from './screens/Program'
import History from './screens/History'
import Maxes from './screens/Maxes'
import Settings from './screens/Settings'
import Guide from './screens/Guide'

// Don't auto-sync more than once per this window (covers app reopens / remounts).
const AUTO_SYNC_THROTTLE_MS = 10 * 60 * 1000
let autoSyncRan = false

/** Run a sync and persist its outcome so the UI can surface a failure/reconnect. */
async function runSync(): Promise<void> {
  try {
    await syncStrava()
    await saveSettings({ stravaSyncError: undefined, stravaNeedsReconnect: false })
  } catch (e) {
    const msg = (e as Error)?.message ?? 'unknown error'
    // A failed token refresh means the connection was revoked/expired.
    const needsReconnect = /token|refresh|401|invalid/i.test(msg)
    await saveSettings({ stravaSyncError: msg.slice(0, 140), stravaNeedsReconnect: needsReconnect })
  }
}

export default function App() {
  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? null, [])

  // On load: handle the Strava OAuth callback (?code=…) then sync; otherwise
  // auto-sync in the background for an already-connected user (throttled, so
  // reopening the app repeatedly doesn't hammer Strava). Makes sync hands-off.
  useEffect(() => {
    if (autoSyncRan) return
    autoSyncRan = true
    handleStravaRedirect()
      .then(async (connected) => {
        if (connected) return runSync()
        const s = await db.settings.get('app')
        if (s?.strava && Date.now() - (s.lastStravaSyncAt ?? 0) > AUTO_SYNC_THROTTLE_MS) return runSync()
      })
      .catch(() => {})
  }, [])

  if (settings === undefined || settings === null) return null // loading / seeding
  if (settings.onboarded === false) return <Onboarding />

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Today />} />
          <Route path="/session" element={<Session />} />
          <Route path="/session/:date" element={<Session />} />
          <Route path="/program" element={<Program />} />
          <Route path="/history" element={<History />} />
          <Route path="/maxes" element={<Maxes />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <UpdatePrompt />
    </>
  )
}
