import { useEffect, useState } from 'react'
import { useSettings, useAllOneRm } from '../hooks'
import { protocolFor, resolvePosition } from '../program'
import { protocolExercises, type Cluster, type ClusterExercise, type Prescription } from '../protocol'
import { GM_GRID, sClusterOf } from '../protocols/greyman'
import type { Settings } from '../types'

/**
 * A protocol's clusters with any user-built parts substituted in. Grey Man's S1
 * and S2 are editable (p.49), so the static `protocol.clusters` is only a
 * default — showing it here is what made custom exercises un-loadable.
 */
function liveClusters(protocol: { id: string; clusters: Record<string, Cluster> }, settings: Settings): Cluster[] {
  return Object.values(protocol.clusters).map((c) => {
    if (protocol.id !== 'gm' || (c.id !== 's1' && c.id !== 's2')) return c
    return { ...c, exercises: sClusterOf(settings, c.id) }
  })
}
import { estimate1RM } from '../lib/calc'
import { loadBar, DEFAULT_BAR_SETUP, targetLoad, type BarSetup } from '../lib/barbell'
import { db } from '../db'
import { Card, Pill } from '../components/ui'
import { today } from '../lib/date'
import type { OneRmEntry } from '../types'

/**
 * 1RM entry.
 *
 * Rebuilds the flow the old Maxes screen had — enter a test set, the app
 * estimates the 1RM and every working weight follows from it — on top of the
 * verified MASS math. Three things changed underneath (docs/mass-design.md §8.4):
 * loads are total-on-the-bar rather than per dumbbell, rounding is nearest with
 * ties down rather than TB1's floor rule, and there is no global training max.
 *
 * The book sanctions estimating rather than truly maxing out:
 *
 *   "There's also no need to test a true 1RM with this protocol. It's acceptable
 *    to perform a 2 or 3RM and determine 1RM using one of the many free online
 *    calculators." (MASS p.90)
 *
 * It names no formula, so Brzycki stays our choice — the same `estimate1RM` that
 * survived the strip with its book-anchored tests.
 */

interface Field {
  w: string
  r: string
  /** Bodyweight movements store max reps instead of a load (p.90). */
  maxReps: string
}

const FIELD =
  'w-full text-center rounded-field bg-[var(--color-surface-sunk)] border border-[var(--color-field-border)] py-2 num-display text-base text-ink placeholder:font-sans placeholder:text-xs placeholder:text-muted'

const EMPTY_FIELD: Field = { w: '', r: '', maxReps: '' }

const isBodyweight = (ex: ClusterExercise) => ex.defaultLoading === 'bodyweightReps'

const barSetupFrom = (plates?: number[], barKg?: number): BarSetup =>
  plates?.length ? { barKg: barKg ?? 20, plates: plates.map((kg) => ({ kg })) } : DEFAULT_BAR_SETUP

export default function Maxes() {
  const settings = useSettings()
  const rows = useAllOneRm()
  // The protocol actually running today. Under a block plan `currentPhaseId` is
  // a stale leftover, so keying off it edited the wrong scope and left every MASS
  // lift permanently blank.
  const protocol = protocolFor(resolvePosition(settings, today()).phaseId)
  // The exercises actually prescribed for THIS user — a protocol may let the
  // user build part of its cluster, and reading `protocol.clusters` meant a
  // custom S exercise could never be given a 1RM.
  const exercises = protocol.exercisesFor?.(settings) ?? protocolExercises(protocol)
  const clusters = liveClusters(protocol, settings)
  const [fields, setFields] = useState<Record<string, Field> | null>(null)
  // Which protocol the current `fields` were built for. `useSettings` returns
  // DEFAULT_SETTINGS before IndexedDB has loaded, so the first render is always
  // Beginner — without this the form would stay seeded with Beginner's exercise
  // ids while rendering Grey Man's, and every lookup would be undefined.
  const [seededFor, setSeededFor] = useState<string | null>(null)

  useEffect(() => {
    if (fields !== null && seededFor === protocol.id) return
    const map: Record<string, Field> = {}
    for (const ex of exercises) {
      const e = rows.find((r) => r.protocolId === protocol.maxScope && r.exerciseId === ex.id)
      map[ex.id] = {
        w: e && e.source === 'tested' ? String(round1(e.kg)) : '',
        r: '',
        maxReps: e?.maxReps != null ? String(e.maxReps) : '',
      }
      // An estimated entry came from a test set we no longer store verbatim;
      // show the resulting 1RM so the number on screen matches what drives loads.
      if (e && e.source === 'estimated') map[ex.id].w = String(round1(e.kg))
    }
    setFields(map)
    setSeededFor(protocol.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, protocol.id])

  if (!fields || seededFor !== protocol.id)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading maxes">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-56 rounded-card" />
      </div>
    )

  const stored = (id: string) =>
    rows.find((r) => r.protocolId === protocol.maxScope && r.exerciseId === id)

  /**
   * The only path that removes a stored max. Confirmed, because the row carries
   * `progressedKg` — every increment Forced Progression has added since the test
   * — and losing that silently rewinds the programme to where it started.
   */
  async function clearMax(ex: ClusterExercise) {
    if (!window.confirm(`Forget your ${ex.name} max? Any progression added since the test goes with it.`))
      return
    await db.oneRm.delete([protocol.maxScope, ex.id])
    setFields({ ...fields!, [ex.id]: EMPTY_FIELD })
  }

  async function write(ex: ClusterExercise, patch: Partial<Field>) {
    const next = { ...(fields![ex.id] ?? EMPTY_FIELD), ...patch }
    setFields({ ...fields!, [ex.id]: next })

    if (isBodyweight(ex)) {
      const reps = Number(next.maxReps)
      // An empty or zero field is someone part-way through retyping, NOT an
      // instruction to forget the max. Deleting here destroyed `progressedKg` —
      // the only record of accumulated Forced Progression — and `testedAt` with
      // it (audit A8). Clearing a max is now an explicit act; see `clearMax`.
      if (!(reps > 0)) return
      await db.oneRm.put({
        protocolId: protocol.maxScope,
        exerciseId: ex.id,
        exerciseName: ex.name,
        kg: 0,
        unit: 'total',
        source: 'tested',
        maxReps: reps,
        testedAt: new Date().toISOString().slice(0, 10),
        // A fresh test supersedes accumulated Forced Progression.
        progressedKg: 0,
      })
      return
    }

    const w = Number(next.w)
    const r = Number(next.r)
    // Same as above: mid-edit is not a delete instruction (audit A8).
    if (!(w > 0)) return
    // Reps blank or 1 => the number typed IS the 1RM. Otherwise estimate it.
    const kg = r > 1 ? estimate1RM(w, r) : w
    const entry: OneRmEntry = {
      protocolId: protocol.maxScope,
      exerciseId: ex.id,
      exerciseName: ex.name,
      kg: round1(kg),
      unit: ex.defaultLoading === 'dumbbell' ? 'perDumbbell' : 'total',
      source: r > 1 ? 'estimated' : 'tested',
      testedAt: new Date().toISOString().slice(0, 10),
      // A fresh test supersedes accumulated Forced Progression.
      progressedKg: 0,
    }
    await db.oneRm.put(entry)
  }

  const bar = barSetupFrom(settings.bar?.platePairsKg, settings.bar?.barKg)

  return (
    <div className="space-y-4 stagger">
      <Card elev="1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-muted">Test day</p>
            <h2 className="display-hero text-xl text-ink">{protocol.name} maxes</h2>
          </div>
          <Pill tone="soft-brand">True 1RM</Pill>
        </div>
        <p className="text-xs text-muted mt-2">
          Enter a <b>2–5 rep</b> test set and the app works out your 1RM, then every working weight
          from it. You never have to attempt a true single — the book says so explicitly (p.90).
        </p>
        <p className="text-[11px] text-muted mt-1">
          Leave reps blank if the weight you typed <i>is</i> your one-rep max. Start conservative:
          <i> “DON’T start too heavy or overestimate your 1RMs”</i> (p.64).
        </p>
      </Card>

      {clusters.map((cluster) => (
        <Card key={cluster.id}>
          <div className="mb-2">
            <p className="font-bold text-ink">{cluster.label}</p>
            {cluster.sourceNote && <p className="text-[11px] text-muted">{cluster.sourceNote}</p>}
          </div>
          <div className="space-y-3">
            {cluster.exercises.map((ex) => {
              const f = fields[ex.id] ?? EMPTY_FIELD
              const e = stored(ex.id)
              const bw = isBodyweight(ex)
              return (
                <div key={ex.id} className="rounded-field bg-[var(--color-surface-sunk)] p-3">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <p className="font-medium text-ink text-[15px]">{ex.name}</p>
                    {e && (
                      <span className="text-[11px] num-display text-load flex items-baseline gap-1">
                        {/* Show the drift, not just the total: the tested number and
                            what Forced Progression has made of it are different facts
                            and the book treats them as such (p.90). */}
                        {!bw && e.progressedKg !== 0 && (
                          <span className="text-muted">{round1(e.kg)} →</span>
                        )}
                        {bw ? `${e.maxReps} rep max` : `1RM ${round1(e.kg + e.progressedKg)} kg`}
                        <button
                          type="button"
                          onClick={() => void clearMax(ex)}
                          aria-label={`Clear ${ex.name} max`}
                          className="text-muted font-sans font-bold px-1"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>

                  {bw ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={FIELD}
                        placeholder="max reps"
                        aria-label={`${ex.name} max reps`}
                        value={f.maxReps}
                        onChange={(ev) =>
                          void write(ex, { maxReps: ev.target.value.replace(/[^0-9]/g, '') })
                        }
                      />
                      <p className="text-[11px] text-muted flex-1">
                        Bodyweight: your max reps stand in for the 1RM (p.90).
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={FIELD}
                          placeholder={ex.defaultLoading === 'dumbbell' ? 'kg / DB' : 'kg on bar'}
                          aria-label={`${ex.name} test weight`}
                          value={f.w}
                          onChange={(ev) =>
                            void write(ex, {
                              w: ev.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                            })
                          }
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          className={FIELD}
                          placeholder="reps"
                          aria-label={`${ex.name} test reps`}
                          value={f.r}
                          onChange={(ev) =>
                            void write(ex, { r: ev.target.value.replace(/[^0-9]/g, '') })
                          }
                        />
                      </div>
                      {e && ex.defaultLoading === 'barbell' && (
                        <WorkingPreview
                          oneRm={e.kg + e.progressedKg}
                          bar={bar}
                          main={cluster.id === 'main'}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      <Card elev="1">
        <p className="text-xs text-muted">
          Percentages run off your <b>1RM</b>. {protocol.name} never uses a training max — the book
          recommends one for the Bulgarian cluster alone (pp.88–89).
        </p>
      </Card>
    </div>
  )
}

/**
 * What this 1RM produces across the three weeks of the block.
 *
 * The percentages come from `GM_GRID`, and the SUPPLEMENTARY row is different
 * from the main one (55/60/65 vs 70/75/80, p.51). This used to hardcode the main
 * row for everything, so every S lift previewed a weight ~27% too heavy.
 */
function WorkingPreview({ oneRm, bar, main }: { oneRm: number; bar: BarSetup; main: boolean }) {
  const pctOf = (p: Prescription) => ('percent' in p.loading ? (p.loading.percent ?? 0) : 0)
  const weeks = [1, 2, 3].map((w) => pctOf(main ? GM_GRID[w].main : GM_GRID[w].supp))
  return (
    <div className="flex gap-2 mt-2">
      {weeks.map((pct, i) => {
        const loaded = loadBar(targetLoad(oneRm, pct), bar)
        return (
          <div key={pct} className="flex-1 text-center rounded-field bg-surface py-1.5">
            <p className="text-[10px] text-muted leading-none">Wk {i + 1} · {pct}%</p>
            <p className="num-display text-ink text-sm leading-tight mt-0.5">{loaded.totalKg}</p>
            {loaded.belowBar && <p className="text-[9px] text-muted leading-none">bar only</p>}
          </div>
        )
      })}
    </div>
  )
}

const round1 = (n: number): number => Math.round(n * 10) / 10
