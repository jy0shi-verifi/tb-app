import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload, RotateCcw, ShieldCheck } from 'lucide-react'
import { useSettings } from '../hooks'
import { applyTheme, importBackup, parseBackup, saveSettings } from '../db'
import { downloadBackup } from '../lib/backup'
import {
  KEEP_GUARD,
  KEEP_ROUTINE,
  listSnapshots,
  restoreSnapshot,
  snapshotLabel,
  snapshotWhen,
  takeSnapshot,
} from '../lib/snapshots'
import { Button, Card, SegmentedPicker } from '../components/ui'
import { PROTOCOLS } from '../program'
import { DEFAULT_BAR_SETUP } from '../lib/barbell'

/** Josh's kit — the fallback when no inventory has been saved. */
const DEFAULT_PLATES = DEFAULT_BAR_SETUP.plates.map((p) => p.kg)
import { beginStravaAuth, disconnectStrava, stravaCanWrite, stravaConfigured } from '../lib/strava'
import { syncStrava, importStravaHistory } from '../lib/stravaSync'
import { APP_VERSION } from '../version'
import type { DbIncrement, Snapshot, ThemeMode } from '../types'

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

  const [snaps, setSnaps] = useState<Snapshot[]>([])
  const refreshSnaps = () => void listSnapshots().then(setSnaps)
  useEffect(refreshSnaps, [])

  async function doExport() {
    // A10: a failed export must not claim success, and must not silence the
    // backup nudge for a fortnight.
    try {
      await downloadBackup()
      setMsg('Backup downloaded.')
    } catch (err) {
      setMsg(`Export failed: ${(err as Error).message}`)
    }
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
        // Snapshot BEFORE replacing everything, so an import of the wrong file
        // is as undoable as anything else (A5).
        await takeSnapshot('pre-import')
        await importBackup(text)
        setMsg('Backup restored.')
        refreshSnaps()
      }
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const fieldCls =
    'rounded-field border border-[var(--color-field-border)] bg-[var(--color-surface-sunk)] text-ink px-3.5 py-2.5 font-semibold min-h-[2.75rem]'

  return (
    <div className="stagger space-y-4">
      <Card elev="hero" className="topo-hero text-white border-white/10">
        <p className="eyebrow hero-text text-gold-hi">Tactical Barbell</p>
        <p className="display-hero text-3xl text-white mt-1">SETTINGS</p>
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
          <Row label="Dumbbell increment" hint="Smallest jump your adjustable DBs allow.">
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
            hint="Time the between-set timer counts down. 10 sec is for testing the beep."
          >
            <select
              aria-label="Rest timer"
              value={s.restSec ?? 0}
              onChange={(e) => saveSettings({ restSec: Number(e.target.value) || undefined })}
              className={fieldCls}
            >
              <option value={0}>Auto</option>
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
            label="Programme"
            hint="Beginner stays available as a fallback — for travel, or a week without the rack."
          >
            <select
              aria-label="Programme"
              value={s.currentPhaseId}
              onChange={(e) => saveSettings({ currentPhaseId: e.target.value })}
              className={fieldCls}
            >
              {Object.values(PROTOCOLS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
          <Row label="Block plan" hint="Sequence your 3-week blocks, build your S cluster, set conditioning days.">
            <Link
              to="/plan"
              className="inline-flex items-center justify-center rounded-pill bg-brand/10 text-brand-ink text-[13px] font-bold px-4 min-h-11"
            >
              Open
            </Link>
          </Row>
          <Row label="1RM maxes" hint="Enter a 2–3 rep test set; the app works out every weight (p.63).">
            <Link
              to="/maxes"
              className="inline-flex items-center justify-center rounded-pill bg-brand/10 text-brand-ink text-[13px] font-bold px-4 min-h-11"
            >
              Open
            </Link>
          </Row>
        </div>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-2">Barbell</p>
        <div className="divide-y divide-line/60">
          <Row label="Bar weight" hint="kg. A standard Olympic bar is 20 kg.">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Bar weight"
              value={s.bar?.barKg ?? DEFAULT_BAR_SETUP.barKg}
              onChange={(e) =>
                saveSettings({
                  bar: {
                    barKg: Number(e.target.value.replace(/[^0-9.]/g, '')) || 20,
                    platePairsKg: s.bar?.platePairsKg ?? DEFAULT_PLATES,
                  },
                })
              }
              className={fieldCls}
            />
          </Row>
          <Row
            label="Microplates"
            hint="0.5 kg pairs take the smallest bar jump from 2.5 kg to 1 kg. Optional — the error without them is at most 1.25 kg."
          >
            <input
              type="checkbox"
              aria-label="Microplates"
              className="size-6 accent-[var(--color-brand)]"
              checked={(s.bar?.platePairsKg ?? DEFAULT_PLATES).includes(0.5)}
              onChange={(e) =>
                saveSettings({
                  bar: {
                    barKg: s.bar?.barKg ?? 20,
                    platePairsKg: e.target.checked ? [...DEFAULT_PLATES, 0.5] : DEFAULT_PLATES,
                  },
                })
              }
            />
          </Row>
          <Row label="Bodyweight" hint="kg. Used for weighted pull-ups and dips (MASS p.90).">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Bodyweight"
              value={s.bodyweightKg ?? ''}
              placeholder="—"
              onChange={(e) =>
                saveSettings({
                  bodyweightKg: Number(e.target.value.replace(/[^0-9.]/g, '')) || undefined,
                })
              }
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
              // This wipes real training history and had NO confirm at all —
              // it sat directly below Export and even stamped `lastBackupAt`,
              // so the backup nudge went quiet afterwards (audit A5/code-01 F1).
              if (
                !window.confirm(
                  'Replace everything on this phone with ~4 months of FAKE demo history?\n\n' +
                    'Your real training data will be gone from the app. A snapshot is taken first, ' +
                    'so you can restore it below.',
                )
              )
                return
              setMsg('Loading demo history…')
              await takeSnapshot('pre-demo')
              const m = await import('../dev/seed')
              setMsg(await m.seedFakeData())
              refreshSnaps()
            }}
          >
            Load demo history
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              if (!window.confirm('Wipe all data back to a clean start?')) return
              await takeSnapshot('pre-reset')
              const m = await import('../dev/seed')
              setMsg(await m.clearAll())
              refreshSnaps()
            }}
          >
            Reset to clean
          </Button>
        </div>
      </Card>

      <SnapshotCard snaps={snaps} onChanged={refreshSnaps} setMsg={setMsg} />

      <p className="text-center text-xs text-muted">Tactical Barbell · {APP_VERSION} · on-device</p>
    </div>
  )
}

/**
 * Automatic on-device backups — audit A5, docs/mass-design.md §11.1.
 *
 * These live in their own Dexie store, which is what makes them safe: every
 * destructive path in the app clears tables BY NAME, so a store none of them
 * names survives all of them without any call site having to remember.
 *
 * They are NOT a substitute for Export. A snapshot is on the same device and in
 * the same browser profile as the data it protects, so it defends against a
 * mistaken tap, not against a lost phone. The copy says so.
 */
function SnapshotCard({
  snaps,
  onChanged,
  setMsg,
}: {
  snaps: Snapshot[]
  onChanged: () => void
  setMsg: (m: string) => void
}) {
  const [busy, setBusy] = useState(false)

  async function restore(s: Snapshot) {
    if (
      !window.confirm(
        `Restore the snapshot from ${snapshotWhen(s)} (${s.sessionCount} sessions)?\n\n` +
          'This replaces everything currently in the app. A snapshot of the current state is taken first.',
      )
    )
      return
    setBusy(true)
    try {
      await restoreSnapshot(s.id!)
      setMsg(`Restored the snapshot from ${snapshotWhen(s)}.`)
      onChanged()
    } catch (err) {
      setMsg(`Restore failed: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-load" />
        <p className="eyebrow text-muted">Automatic snapshots</p>
      </div>
      <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">
        Taken once a day when you open the app, and before anything destructive. Keeps the last{' '}
        {KEEP_ROUTINE} daily and {KEEP_GUARD} guard snapshots.{' '}
        <b>These are on this phone only</b> — they undo a mistaken tap, not a lost phone. Keep
        exporting.
      </p>

      {snaps.length === 0 ? (
        <p className="text-xs text-muted">
          None yet. The first one is taken next time you open the app with training logged.
        </p>
      ) : (
        <div className="space-y-1.5">
          {snaps.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-field bg-[var(--color-surface-sunk)] p-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-ink truncate">{snapshotWhen(s)}</p>
                <p className="text-[11px] text-muted">
                  {snapshotLabel(s)} · {s.sessionCount} session{s.sessionCount === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => void restore(s)}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-pill bg-brand/10 text-brand-ink text-[11px] font-bold px-3 min-h-9 disabled:opacity-50"
              >
                <RotateCcw size={13} /> Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
