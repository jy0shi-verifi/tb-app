import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../hooks'
import { OPERATOR_LIFTS, OPERATOR_WAVE } from '../program'
import { estimate1RM, maxToBasis, trainingMax, workingLoad } from '../lib/calc'
import { db } from '../db'
import { Card, Pill, Stepper } from '../components/ui'
import Celebration, { type CelebrationContent } from '../components/Celebration'
import type { MaxEntry } from '../types'

interface Field {
  w: string
  r: string
}

const FIELD_CLASS =
  'text-center rounded-field bg-[var(--color-surface-sunk)] border border-[var(--color-field-border)] py-2 num-display text-lg text-ink placeholder:font-sans placeholder:text-sm placeholder:text-muted transition-shadow'

export default function Maxes() {
  const settings = useSettings()
  // raw query (undefined until IndexedDB has loaded) so we init from real data
  const maxes = useLiveQuery(() => db.maxes.toArray(), [])
  const [fields, setFields] = useState<Record<string, Field> | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationContent | null>(null)

  useEffect(() => {
    if (fields !== null || maxes === undefined) return
    const map: Record<string, Field> = {}
    for (const l of OPERATOR_LIFTS) {
      const e = maxes.find((m) => m.liftId === l.id)
      map[l.id] = { w: e ? String(e.testWeight) : '', r: e ? String(e.testReps) : '' }
    }
    setFields(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxes])

  if (!fields)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading maxes">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-56 rounded-card" />
      </div>
    )

  const setField = async (liftId: string, patch: Partial<Field>) => {
    const next = { ...fields[liftId], ...patch }
    setFields({ ...fields, [liftId]: next })
    const w = Number(next.w)
    const r = Number(next.r)
    if (w > 0 && r > 0) {
      // a fresh test supersedes accumulated forced-progression — reset the bump when the numbers change
      const existing = maxes?.find((m) => m.liftId === liftId)
      const changed = !existing || existing.testWeight !== w || existing.testReps !== r
      const bumpKg = changed ? 0 : (existing?.bumpKg ?? 0)
      const entry: MaxEntry = { liftId, testWeight: w, testReps: r, bumpKg }
      await db.maxes.put(entry)
      // Test Day reward: fire once when this entry completes the full set of maxes.
      const merged = { ...fields, [liftId]: next }
      const allSet = OPERATOR_LIFTS.every((l) => Number(merged[l.id]?.w) > 0 && Number(merged[l.id]?.r) > 0)
      if (allSet && !localStorage.getItem('tb-testday-celebrated')) {
        try {
          localStorage.setItem('tb-testday-celebrated', '1')
        } catch {
          /* private mode — reward is cosmetic */
        }
        setCelebration({
          title: 'Test Day banked',
          sub: 'Your Operator numbers are set — every weight is dialled in.',
          icon: 'trophy',
          share: { headline: 'Test Day', sub: 'Operator maxes locked in' },
        })
      }
    } else {
      await db.maxes.delete(liftId)
    }
  }

  const bumpBy = async (liftId: string, delta: number) => {
    const entry = maxes?.find((m) => m.liftId === liftId)
    if (!entry) return
    const bumpKg = Math.max(0, (entry.bumpKg ?? 0) + delta)
    await db.maxes.put({ ...entry, bumpKg })
  }

  const anyMax = OPERATOR_LIFTS.some((l) => {
    const f = fields[l.id]
    return Number(f.w) > 0 && Number(f.r) > 0
  })

  return (
    <div className="space-y-4 stagger">
      {settings.currentPhaseId === 'base-building' && (
        <Card elev="1" className="bg-warm border-warm-edge/30">
          <p className="text-sm text-ink">
            <b>Nothing to do here yet.</b> You'll test these on <b>Test Day</b> at the end of Base
            Building, then enter them here — and Operator works out every weight for you.
          </p>
        </Card>
      )}

      <Card elev="1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-muted">Test Day</p>
            <h2 className="display-hero text-xl text-ink">Operator maxes</h2>
          </div>
          <Pill tone={settings.loadBasis === 'tm' ? 'gold' : 'soft-brand'}>
            {settings.loadBasis === 'tm' ? '90% Training Max' : 'True 1RM'}
          </Pill>
        </div>
        <p className="text-xs text-muted mt-2">
          Enter your Test Day result — the weight on <b>one dumbbell</b> (not both) and the reps you
          got (about 5, leaving 1–2 in the tank). Loads round to your {settings.dbIncrement} kg
          increment.
        </p>
        <p className="text-[11px] text-muted mt-1">
          <b>TM (Training Max)</b> = the number your weights are based on — a safe 90% of your best,
          so you always keep gas in the tank.
        </p>

        <div className="mt-4 space-y-3">
          {OPERATOR_LIFTS.map((l) => {
            const f = fields[l.id]
            const w = Number(f.w)
            const r = Number(f.r)
            const bump = maxes?.find((m) => m.liftId === l.id)?.bumpKg ?? 0
            const oneRM = w > 0 && r > 0 ? estimate1RM(w, r) + bump : 0
            const tm = trainingMax(oneRM)
            return (
              <div key={l.id} className="rounded-card bg-[var(--color-surface-sunk)] elev-sunk p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-ink text-[15px]">{l.name}</p>
                  {oneRM > 0 && (
                    <Pill tone="soft-brand">
                      <span className="num-display">1RM ~{oneRM.toFixed(1)}</span>
                      <span className="opacity-50">·</span>
                      <span className="num-display">TM {tm.toFixed(1)} kg</span>
                    </Pill>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label className="flex items-center gap-1.5">
                    <input
                      inputMode="decimal"
                      aria-label={`${l.name} test weight (kg per dumbbell)`}
                      placeholder="kg"
                      value={f.w}
                      onChange={(e) => setField(l.id, { w: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') })}
                      className={`w-20 ${FIELD_CLASS}`}
                    />
                    <span className="text-xs text-muted">kg/DB</span>
                  </label>
                  <span className="text-muted num-display">×</span>
                  <label className="flex items-center gap-1.5">
                    <input
                      inputMode="numeric"
                      aria-label={`${l.name} test reps`}
                      placeholder="reps"
                      value={f.r}
                      onChange={(e) => setField(l.id, { r: e.target.value.replace(/[^0-9]/g, '') })}
                      className={`w-16 ${FIELD_CLASS}`}
                    />
                    <span className="text-xs text-muted">reps</span>
                  </label>
                </div>
                {oneRM > 0 && (bump > 0 || advanced) && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line/60">
                    <span className="text-xs text-muted">
                      {bump > 0 ? (
                        <>
                          Progressed <span className="num-display text-load">+{bump} kg</span> on 1RM
                        </>
                      ) : (
                        'No progression yet'
                      )}
                    </span>
                    {advanced && (
                      <Stepper
                        value={<span className="text-load">+{bump}</span>}
                        onDec={() => bumpBy(l.id, -(l.progressStep ?? 2.5))}
                        onInc={() => bumpBy(l.id, l.progressStep ?? 2.5)}
                        labelDec="Reduce progression"
                        labelInc="Add progression"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <button
          onClick={() => setAdvanced((a) => !a)}
          className="text-xs text-accent-ink font-bold mt-4"
        >
          {advanced ? 'Hide manual adjust' : 'Advanced: adjust manually'}
        </button>
        {advanced && (
          <p className="text-[11px] text-muted mt-1">
            The app bumps these for you after each block — only use ± if you're manually correcting.
          </p>
        )}
      </Card>

      {/* wave table */}
      <Card elev="1">
        <p className="eyebrow text-muted">Every week's loads</p>
        <h2 className="display-hero text-xl text-ink mt-0.5">Operator working weights</h2>
        <p className="text-xs text-muted mt-1 mb-3">kg per dumbbell · ⚠︎ = over the 60 kg ceiling</p>
        {!anyMax ? (
          <p className="text-sm text-muted py-4 text-center">
            Enter your maxes above to see every week's loads.
          </p>
        ) : (
          <Card elev="sunk" pad="sm" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left eyebrow text-muted py-1.5 pl-1">Wk</th>
                  <th className="text-left eyebrow text-muted py-1.5">Scheme</th>
                  {OPERATOR_LIFTS.map((l) => (
                    <th key={l.id} className="text-right eyebrow text-muted py-1.5 pr-1">
                      {l.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPERATOR_WAVE.map((wk) => (
                  <tr key={wk.week} className="border-t border-line/60">
                    <td className="py-2 pl-1 num-display text-ink">{wk.week}</td>
                    <td className="py-2 text-muted whitespace-nowrap">
                      <span className="num-display">{wk.sets}×{wk.reps}</span> @{' '}
                      <span className="num-display">{wk.pct}%</span>
                    </td>
                    {OPERATOR_LIFTS.map((l) => {
                      const f = fields[l.id]
                      const w = Number(f.w)
                      const r = Number(f.r)
                      if (!(w > 0 && r > 0))
                        return (
                          <td key={l.id} className="py-2 pr-1 text-right text-muted/60">
                            —
                          </td>
                        )
                      // use the STORED entry so forced-progression bumps (bumpKg)
                      // are included — matches the per-lift header and Operator loads
                      const entry: MaxEntry = maxes?.find((m) => m.liftId === l.id) ?? {
                        liftId: l.id,
                        testWeight: w,
                        testReps: r,
                        bumpKg: 0,
                      }
                      const basis = maxToBasis(entry, settings.loadBasis)
                      const lr = workingLoad(basis, wk.pct, settings.dbIncrement)
                      return (
                        <td key={l.id} className="py-2 pr-1 text-right num-display text-load">
                          {lr.kg}
                          {lr.overCeiling && <span className="text-gold-ink"> ⚠︎</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Card>
      {celebration && <Celebration content={celebration} onClose={() => setCelebration(null)} />}
    </div>
  )
}
