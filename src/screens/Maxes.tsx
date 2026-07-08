import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../hooks'
import { OPERATOR_LIFTS, OPERATOR_WAVE } from '../program'
import { estimate1RM, maxToBasis, trainingMax, workingLoad } from '../lib/calc'
import { db } from '../db'
import { Card, Pill } from '../components/ui'
import type { MaxEntry } from '../types'

interface Field {
  w: string
  r: string
}

export default function Maxes() {
  const settings = useSettings()
  // raw query (undefined until IndexedDB has loaded) so we init from real data
  const maxes = useLiveQuery(() => db.maxes.toArray(), [])
  const [fields, setFields] = useState<Record<string, Field> | null>(null)

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

  if (!fields) return <p className="text-muted text-sm">Loading…</p>

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
    <div className="space-y-4">
      {settings.currentPhaseId === 'base-building' && (
        <Card className="p-4 bg-warm border-warm-edge/30">
          <p className="text-sm text-ink">
            <b>Nothing to do here yet.</b> You'll test these on <b>Test Day</b> at the end of Base
            Building, then enter them here — and Operator works out every weight for you.
          </p>
        </Card>
      )}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Operator maxes</h2>
          <Pill tone={settings.loadBasis === 'tm' ? 'load' : 'brand'}>
            {settings.loadBasis === 'tm' ? '90% Training Max' : 'True 1RM'}
          </Pill>
        </div>
        <p className="text-xs text-muted mt-1">
          Enter your Test Day result — the weight per dumbbell and the reps you got (about 5, leaving
          1–2 in the tank). Loads round to your {settings.dbIncrement} kg increment.
        </p>

        <div className="mt-3 space-y-3">
          {OPERATOR_LIFTS.map((l) => {
            const f = fields[l.id]
            const w = Number(f.w)
            const r = Number(f.r)
            const bump = maxes?.find((m) => m.liftId === l.id)?.bumpKg ?? 0
            const oneRM = w > 0 && r > 0 ? estimate1RM(w, r) + bump : 0
            const tm = trainingMax(oneRM)
            return (
              <div key={l.id} className="rounded-xl bg-canvas p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink text-[15px]">{l.name}</p>
                  {oneRM > 0 && (
                    <p className="text-xs text-muted tnum">
                      1RM ~{oneRM.toFixed(1)} · TM {tm.toFixed(1)} kg
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="flex items-center gap-1">
                    <input
                      inputMode="decimal"
                      placeholder="kg"
                      value={f.w}
                      onChange={(e) => setField(l.id, { w: e.target.value })}
                      className="w-20 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                    />
                    <span className="text-xs text-muted">kg/DB</span>
                  </label>
                  <span className="text-muted">×</span>
                  <label className="flex items-center gap-1">
                    <input
                      inputMode="numeric"
                      placeholder="reps"
                      value={f.r}
                      onChange={(e) => setField(l.id, { r: e.target.value })}
                      className="w-16 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                    />
                    <span className="text-xs text-muted">reps</span>
                  </label>
                </div>
                {oneRM > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60">
                    <span className="text-xs text-muted">
                      {bump > 0 ? `Progressed +${bump} kg on 1RM` : 'No progression yet'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => bumpBy(l.id, -(l.progressStep ?? 2.5))}
                        className="w-8 h-8 rounded-lg bg-white border border-line text-brand font-bold"
                        aria-label="Reduce progression"
                      >
                        −
                      </button>
                      <button
                        onClick={() => bumpBy(l.id, l.progressStep ?? 2.5)}
                        className="w-8 h-8 rounded-lg bg-brand text-white font-bold"
                        aria-label="Add progression"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* wave table */}
      <Card className="p-4">
        <h2 className="font-bold text-ink mb-1">Operator working weights</h2>
        <p className="text-xs text-muted mb-3">kg per dumbbell · ⚠︎ = over the 60 kg ceiling</p>
        {!anyMax ? (
          <p className="text-sm text-muted py-4 text-center">
            Enter your maxes above to see every week's loads.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-semibold py-1.5 pl-1">Wk</th>
                  <th className="text-left font-semibold py-1.5">Scheme</th>
                  {OPERATOR_LIFTS.map((l) => (
                    <th key={l.id} className="text-right font-semibold py-1.5 pr-1">
                      {l.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPERATOR_WAVE.map((wk) => (
                  <tr key={wk.week} className="border-t border-line/60">
                    <td className="py-2 pl-1 font-semibold text-ink">{wk.week}</td>
                    <td className="py-2 text-muted whitespace-nowrap">
                      {wk.sets}×{wk.reps} @ {wk.pct}%
                    </td>
                    {OPERATOR_LIFTS.map((l) => {
                      const f = fields[l.id]
                      const w = Number(f.w)
                      const r = Number(f.r)
                      if (!(w > 0 && r > 0))
                        return (
                          <td key={l.id} className="py-2 pr-1 text-right text-line">
                            —
                          </td>
                        )
                      const basis = maxToBasis({ liftId: l.id, testWeight: w, testReps: r }, settings.loadBasis)
                      const lr = workingLoad(basis, wk.pct, settings.dbIncrement)
                      return (
                        <td key={l.id} className="py-2 pr-1 text-right font-bold text-load tnum">
                          {lr.kg}
                          {lr.overCeiling && <span className="text-warm-edge"> ⚠︎</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
