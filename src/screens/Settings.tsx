import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useSettings } from '../hooks'
import { applyTheme, importBackup, parseBackup, saveSettings } from '../db'
import { downloadBackup } from '../lib/backup'
import { PHASES } from '../program'
import { defaultBeginnerWeights } from '../beginner'
import { isoDate, today, addDays, mondayIndex } from '../lib/date'
import { Button, Card, SegmentedPicker } from '../components/ui'
import { beginStravaAuth, disconnectStrava, stravaCanWrite, stravaConfigured } from '../lib/strava'
import { syncStrava, importStravaHistory, devTagLatestAsOperatorRun } from '../lib/stravaSync'
import { APP_VERSION } from '../version'
import type { DbIncrement, LoadBasis, ThemeMode } from '../types'

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="font-bold text-ink text-[15px]">{label}</p>
      {hint && <p className="text-xs text-muted mt-0.5 mb-3 leading-relaxed">{hint}</p>}
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

  const fieldCls =
    'rounded-field border border-[var(--color-field-border)] bg-[var(--color-surface-sunk)] text-ink px-3.5 py-2.5 font-semibold min-h-[2.75rem]'

  const isBeginner = s.programMode === 'beginner'
  async function switchToBeginner() {
    if (
      !window.confirm(
        'Switch to Beginner mode?\n\nThis swaps your plan to Linear Progression + Couch-to-5K — a gentler on-ramp. Your Tactical Barbell setup is kept; you can switch back any time.',
      )
    )
      return
    const mon = isoDate(addDays(today(), -mondayIndex(today())))
    await saveSettings({
      programMode: 'beginner',
      currentPhaseId: 'beginner',
      phaseStartDate: mon,
      beginner: { lifts: defaultBeginnerWeights() },
    })
    setMsg('Beginner mode on — Linear Progression + Couch-to-5K.')
  }
  async function switchToTB() {
    if (!window.confirm('Switch back to Tactical Barbell (Base Building → Operator)?')) return
    await saveSettings({ programMode: 'tb', currentPhaseId: 'base-building' })
    setMsg('Tactical Barbell mode.')
  }

  return (
    <div className="stagger space-y-4">
      <Card elev="hero" className="topo-hero text-white border-white/10">
        <p className="eyebrow hero-text text-gold-hi">Tactical Barbell</p>
        <p className="display-hero text-3xl text-white mt-1">SETTINGS</p>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-2">Program mode</p>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          {isBeginner
            ? 'You’re on Beginner mode — Linear Progression (dumbbell A/B) + Couch-to-5K. Build a base, then step up to Tactical Barbell.'
            : 'Tactical Barbell (Base Building → Operator). New to training? Beginner mode is a gentler on-ramp.'}
        </p>
        {isBeginner ? (
          <Button variant="secondary" className="w-full" onClick={switchToTB}>
            Switch to Tactical Barbell
          </Button>
        ) : (
          <Button className="w-full" onClick={switchToBeginner}>
            Switch to Beginner mode (LP + C25K)
          </Button>
        )}
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-2">Preferences</p>
        <div className="divide-y divide-line/60">
          <Row label="Appearance" hint="Dark follows your phone at 6am.">
            <SegmentedPicker<ThemeMode>
              label="Appearance"
              value={s.theme ?? 'system'}
              options={[
                { v: 'system', label: 'System' },
                { v: 'light', label: 'Light' },
                { v: 'dark', label: 'Dark' },
              ]}
              onChange={(v) => {
                applyTheme(v)
                saveSettings({ theme: v })
              }}
            />
          </Row>
          <Row label="Dumbbell increment" hint="Smallest jump your adjustable DBs allow. Loads floor-round to this.">
            <SegmentedPicker<string>
              label="Dumbbell increment"
              value={String(s.dbIncrement)}
              options={[
                { v: '2', label: '2 kg' },
                { v: '1', label: '1 kg (magnets)' },
              ]}
              onChange={(v) => saveSettings({ dbIncrement: Number(v) as DbIncrement })}
            />
          </Row>
          <Row
            label="Rest timer"
            hint="Time the between-set timer counts down. Auto uses the book's rests (longer on the heavy weeks) — recommended on a cut. 10 sec is for testing the beep."
          >
            <select
              aria-label="Rest timer"
              value={s.restSec ?? 0}
              onChange={(e) => saveSettings({ restSec: Number(e.target.value) || undefined })}
              className={fieldCls}
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
        </div>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-2">Program</p>
        <div className="divide-y divide-line/60">
          <Row
            label="Load basis"
            hint="How every weight is worked out. K. Black recommends the 90% Training Max for high-frequency templates like Operator — you grease the groove and can hit every session, even on a bad day. True 1RM is heavier, for advanced lifters who find the TM too light."
          >
            <SegmentedPicker<LoadBasis>
              label="Load basis"
              value={s.loadBasis}
              options={[
                { v: 'tm', label: 'Training Max (90%)' },
                { v: '1rm', label: 'True 1RM' },
              ]}
              onChange={(v) => {
                if (v !== s.loadBasis && window.confirm('Change how every weight is worked out? This rescales all your loads.'))
                  saveSettings({ loadBasis: v })
              }}
            />
          </Row>
          <Row label="Current phase" hint="Advanced — the app normally moves you between phases at the right time.">
            <SegmentedPicker<string>
              label="Current phase"
              value={s.currentPhaseId}
              options={Object.values(PHASES).map((p) => ({ v: p.id, label: p.name }))}
              onChange={(v) => {
                if (v !== s.currentPhaseId && window.confirm('Switch phase? This changes your plan and where you are in it.'))
                  saveSettings({ currentPhaseId: v })
              }}
            />
          </Row>
          <Row label="Phase start date" hint="The Monday your current phase's week 1 began.">
            <input
              type="date"
              aria-label="Phase start date"
              value={s.phaseStartDate}
              onChange={(e) => saveSettings({ phaseStartDate: e.target.value })}
              className={fieldCls}
            />
          </Row>
        </div>
      </Card>

      <Card>
        <p className="eyebrow text-muted">Strava</p>
        <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">
          Auto-tick your runs &amp; conditioning sessions — distance, pace and heart rate flow in from Strava automatically.
        </p>
        {!stravaConfigured() ? (
          <p className="text-xs text-muted">Not set up on this build yet.</p>
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
              className="w-full text-sm text-brand-ink font-semibold min-h-[44px] inline-flex items-center justify-center"
            >
              Import my past runs (one-off) →
            </button>
            {!stravaCanWrite(s) && (
              <button onClick={beginStravaAuth} className="w-full text-xs text-muted py-1">
                Reconnect to let the app name your runs on Strava →
              </button>
            )}
            {import.meta.env.DEV && (
              <button
                onClick={async () => {
                  setMsg('Tagging latest run…')
                  setMsg(await devTagLatestAsOperatorRun())
                }}
                className="w-full text-xs text-brand-ink py-1"
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

      <Card>
        <p className="eyebrow text-muted">Backup</p>
        <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">
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
        <p role="status" aria-live="polite" className="text-xs text-load mt-3 font-semibold empty:hidden">
          {msg}
        </p>
      </Card>

      <Card>
        <p className="eyebrow text-muted">Demo data</p>
        <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">
          Fill the app with ~4 months of realistic history to show it off, then reset back to a clean
          start whenever you're ready to train for real.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={async () => {
              setMsg('Loading demo history…')
              const m = await import('../dev/seed')
              setMsg(await m.seedFakeData())
            }}
          >
            Load demo history
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
            Reset to clean
          </Button>
        </div>
      </Card>

      <p className="text-center text-xs text-muted">Tactical Barbell · {APP_VERSION} · on-device</p>
    </div>
  )
}
