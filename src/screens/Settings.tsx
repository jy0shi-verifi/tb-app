import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useSettings } from '../hooks'
import { applyTheme, importBackup, parseBackup, saveSettings } from '../db'
import { downloadBackup } from '../lib/backup'
import { PHASES } from '../program'
import { Button, Card } from '../components/ui'
import { beginStravaAuth, disconnectStrava, stravaCanWrite, stravaConfigured } from '../lib/strava'
import { syncStrava, importStravaHistory, devTagLatestAsOperatorRun } from '../lib/stravaSync'
import { APP_VERSION } from '../version'
import type { DbIncrement, LoadBasis, ThemeMode } from '../types'

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-xl bg-canvas p-1 gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            value === o.value ? 'bg-brand text-white shadow-sm' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <p className="font-semibold text-ink text-[15px]">{label}</p>
      {hint && <p className="text-xs text-muted mb-2">{hint}</p>}
      {children}
    </div>
  )
}

export default function Settings() {
  const s = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string>('')

  async function doExport() {
    await downloadBackup()
    setMsg('Backup downloaded.')
  }

  async function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const b = parseBackup(text) // validates shape before we touch anything
      const ok = window.confirm(
        `Restore this backup?\n\n${b.sessions.length} sessions · ${b.maxes.length} maxes` +
          `\nfrom ${b.exportedAt.slice(0, 10)}\n\nThis REPLACES all data currently on this phone.`,
      )
      if (ok) {
        await importBackup(text)
        setMsg('Backup restored.')
      }
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <Card className="px-4 divide-y divide-line/60">
        <Row label="Appearance" hint="Dark follows your phone at 6am.">
          <Segmented<ThemeMode>
            value={s.theme ?? 'system'}
            options={[
              { label: 'System', value: 'system' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
            onChange={(v) => {
              applyTheme(v)
              saveSettings({ theme: v })
            }}
          />
        </Row>
        <Row label="Dumbbell increment" hint="Smallest jump your adjustable DBs allow. Loads floor-round to this.">
          <Segmented<DbIncrement>
            value={s.dbIncrement}
            options={[
              { label: '2 kg', value: 2 },
              { label: '1 kg (magnets)', value: 1 },
            ]}
            onChange={(v) => saveSettings({ dbIncrement: v })}
          />
        </Row>
        <Row
          label="Rest timer"
          hint="Time the between-set timer counts down. Auto uses the book's rests (longer on the heavy weeks) — recommended on a cut. 10 sec is for testing the beep."
        >
          <select
            value={s.restSec ?? 0}
            onChange={(e) => saveSettings({ restSec: Number(e.target.value) || undefined })}
            className="rounded-lg border border-line bg-surface text-ink px-3 py-2 font-semibold"
          >
            <option value={0}>Auto (book)</option>
            <option value={180}>3 min</option>
            <option value={150}>2½ min</option>
            <option value={120}>2 min</option>
            <option value={90}>90 sec</option>
            <option value={60}>60 sec</option>
            <option value={10}>10 sec (test)</option>
          </select>
        </Row>
        <Row label="Load basis" hint="Advanced — weights compute off 90% Training Max (the TB standard) or your true 1RM.">
          <Segmented<LoadBasis>
            value={s.loadBasis}
            options={[
              { label: '90% TM', value: 'tm' },
              { label: 'True 1RM', value: '1rm' },
            ]}
            onChange={(v) => {
              if (v !== s.loadBasis && window.confirm('Change how every weight is worked out? This rescales all your loads.'))
                saveSettings({ loadBasis: v })
            }}
          />
        </Row>
        <Row label="Current phase" hint="Advanced — the app normally moves you between phases at the right time.">
          <Segmented<string>
            value={s.currentPhaseId}
            options={Object.values(PHASES).map((p) => ({ label: p.name, value: p.id }))}
            onChange={(v) => {
              if (v !== s.currentPhaseId && window.confirm('Switch phase? This changes your plan and where you are in it.'))
                saveSettings({ currentPhaseId: v })
            }}
          />
        </Row>
        <Row label="Phase start date" hint="The Monday your current phase's week 1 began.">
          <input
            type="date"
            value={s.phaseStartDate}
            onChange={(e) => saveSettings({ phaseStartDate: e.target.value })}
            className="rounded-lg border border-line bg-surface text-ink px-3 py-2 font-semibold"
          />
        </Row>
      </Card>

      <Card className="p-4">
        <p className="font-semibold text-ink">Strava</p>
        <p className="text-xs text-muted mb-3">
          Auto-tick your runs &amp; HICs — distance, pace and heart rate flow in from Strava automatically.
        </p>
        {!stravaConfigured() ? (
          <p className="text-xs text-muted">Coming soon.</p>
        ) : s.strava ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  setMsg('Syncing…')
                  try {
                    setMsg(`Synced ${await syncStrava()} activities from Strava.`)
                  } catch (e) {
                    setMsg(`Sync failed: ${(e as Error)?.message ?? 'unknown error'}`)
                  }
                }}
              >
                Sync now
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await disconnectStrava()
                  setMsg('Strava disconnected.')
                }}
              >
                Disconnect
              </Button>
            </div>
            <button
              onClick={async () => {
                setMsg('Importing past runs…')
                try {
                  setMsg(`Imported ${await importStravaHistory()} past runs from Strava.`)
                } catch (e) {
                  setMsg(`Import failed: ${(e as Error)?.message ?? 'unknown error'}`)
                }
              }}
              className="w-full text-sm text-brand font-medium py-1"
            >
              Import my past runs (one-off) →
            </button>
            {!stravaCanWrite(s) && (
              <button
                onClick={beginStravaAuth}
                className="w-full text-xs text-muted py-1"
              >
                Reconnect to let the app name your runs on Strava →
              </button>
            )}
            {import.meta.env.DEV && (
              <button
                onClick={async () => {
                  setMsg('Tagging latest run…')
                  setMsg(await devTagLatestAsOperatorRun())
                }}
                className="w-full text-xs text-brand py-1"
              >
                Test: tag my latest run as an Operator run day →
              </button>
            )}
          </div>
        ) : (
          <Button className="w-full" onClick={beginStravaAuth}>
            Connect Strava
          </Button>
        )}
      </Card>

      <Card className="p-4">
        <p className="font-semibold text-ink">Backup</p>
        <p className="text-xs text-muted mb-3">
          Your data lives only on this phone. Export regularly — keep the file safe.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={doExport}>
            <Download size={18} className="inline -mt-0.5 mr-1" /> Export
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload size={18} className="inline -mt-0.5 mr-1" /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={doImport} />
        </div>
        {msg && <p className="text-xs text-load mt-2 font-medium">{msg}</p>}
      </Card>

      {import.meta.env.DEV && (
        <Card className="p-4">
          <p className="font-semibold text-ink">Sample data (dev)</p>
          <p className="text-xs text-muted mb-3">
            Populate ~4 months of fake history to review the UI, or wipe back to a clean start.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                const m = await import('../dev/seed')
                setMsg(await m.seedFakeData())
              }}
            >
              Load sample history
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={async () => {
                if (!window.confirm('Wipe all data back to a clean start?')) return
                const m = await import('../dev/seed')
                setMsg(await m.clearAll())
              }}
            >
              Clear all data
            </Button>
          </div>
        </Card>
      )}

      <p className="text-center text-xs text-muted">Tactical Barbell · {APP_VERSION} · on-device</p>
    </div>
  )
}
