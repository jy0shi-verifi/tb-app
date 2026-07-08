import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useSettings } from '../hooks'
import { applyTheme, exportBackup, importBackup, saveSettings } from '../db'
import { PHASES } from '../program'
import { Button, Card } from '../components/ui'
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
    const json = await exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tb-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup downloaded.')
  }

  async function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(await file.text())
      setMsg('Backup restored.')
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
        <Row label="Load basis" hint="Operator loads compute off 90% Training Max (TB standard) or your true 1RM.">
          <Segmented<LoadBasis>
            value={s.loadBasis}
            options={[
              { label: '90% TM', value: 'tm' },
              { label: 'True 1RM', value: '1rm' },
            ]}
            onChange={(v) => saveSettings({ loadBasis: v })}
          />
        </Row>
        <Row label="Current phase">
          <Segmented<string>
            value={s.currentPhaseId}
            options={Object.values(PHASES).map((p) => ({ label: p.name, value: p.id }))}
            onChange={(v) => saveSettings({ currentPhaseId: v })}
          />
        </Row>
        <Row label="Phase start date" hint="The Monday your current phase's week 1 began.">
          <input
            type="date"
            value={s.phaseStartDate}
            onChange={(e) => saveSettings({ phaseStartDate: e.target.value })}
            className="rounded-lg border border-line bg-white px-3 py-2 font-semibold"
          />
        </Row>
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

      <p className="text-center text-xs text-muted">Tactical Barbell · v1 · on-device</p>
    </div>
  )
}
