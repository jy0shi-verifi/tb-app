import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { maxesMap, resolvePosition, sessionFor, PHASES } from '../program'
import { isoDate, today } from '../lib/date'
import { db, DEFAULT_SETTINGS } from '../db'
import { Button, Card } from '../components/ui'
import type { LoggedExercise, SessionLog } from '../types'

interface SetState {
  weight: string
  reps: string
  done: boolean
}
interface ExState {
  name: string
  note?: string
  loaded: boolean
  sets: SetState[]
}

export default function Session() {
  const nav = useNavigate()
  const iso = isoDate(today())

  // raw queries: undefined === still loading (so we never init from defaults)
  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS, [])
  const maxes = useLiveQuery(() => db.maxes.toArray(), [])
  const logged = useLiveQuery(
    async () => (await db.sessions.where('date').equals(iso).first()) ?? null,
    [iso],
  )

  const [state, setState] = useState<ExState[] | null>(null)

  const ready = settings !== undefined && maxes !== undefined && logged !== undefined
  const pos = ready ? resolvePosition(settings, today()) : null
  const plan = ready && pos ? sessionFor(pos.phaseId, pos.week, pos.day, maxesMap(maxes), settings) : null

  useEffect(() => {
    if (!ready || !plan || state !== null) return
    const fromLog = logged && logged.exercises.length > 0
    setState(
      plan.exercises.map((ex, i) => {
        const saved = fromLog ? logged!.exercises[i] : undefined
        return {
          name: ex.name,
          note: ex.note,
          loaded: ex.loaded,
          sets: ex.sets.map((s, j) => {
            const ss = saved?.sets[j]
            return {
              weight:
                ss?.weight != null ? String(ss.weight) : s.weight != null ? String(s.weight) : '',
              reps: ss ? String(ss.reps) : String(s.reps),
              done: ss?.done ?? false,
            }
          }),
        }
      }),
    )
  }, [ready, plan, logged, state])

  if (!ready || !state || !plan || !pos) return <p className="text-muted text-sm">Loading…</p>

  const update = (ei: number, si: number, patch: Partial<SetState>) => {
    setState((prev) =>
      prev!.map((ex, i) =>
        i === ei ? { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : ex,
      ),
    )
  }

  const totalSets = state.reduce((n, ex) => n + ex.sets.length, 0)
  const doneSets = state.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)

  async function save() {
    const exercises: LoggedExercise[] = state!.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((s) => ({
        weight: s.weight === '' ? undefined : Number(s.weight),
        reps: Number(s.reps) || 0,
        done: s.done,
      })),
    }))
    const rec: SessionLog = {
      date: iso,
      phaseId: pos!.phaseId,
      week: pos!.week,
      day: pos!.day,
      type: plan!.type,
      title: plan!.title,
      exercises,
      done: doneSets === totalSets && totalSets > 0,
      createdAt: Date.now(),
    }
    await db.sessions.put(logged?.id ? { ...rec, id: logged.id } : rec)
    nav('/')
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-xl font-bold text-ink">{plan.title}</h2>
        <p className="text-sm text-muted">
          {PHASES[pos.phaseId].name} · Week {pos.week}
          {plan.scheme ? ` · ${plan.scheme}` : ''}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-line/60 overflow-hidden">
          <div
            className="h-full bg-load transition-all"
            style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {state.map((ex, ei) => (
        <Card key={ei} className="p-4">
          <div className="mb-2">
            <p className="font-semibold text-ink">{ex.name}</p>
            {ex.note && <p className="text-xs text-muted">{ex.note}</p>}
          </div>
          <div className="space-y-2">
            {ex.sets.map((s, si) => (
              <div
                key={si}
                className={`flex items-center gap-2 rounded-xl p-2 ${s.done ? 'bg-load-soft' : 'bg-canvas'}`}
              >
                <span className="w-6 text-center text-sm font-semibold text-muted">{si + 1}</span>
                {ex.loaded && (
                  <label className="flex items-center gap-1">
                    <input
                      inputMode="decimal"
                      value={s.weight}
                      onChange={(e) => update(ei, si, { weight: e.target.value })}
                      className="w-16 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                    />
                    <span className="text-xs text-muted">kg</span>
                  </label>
                )}
                <label className="flex items-center gap-1">
                  <input
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => update(ei, si, { reps: e.target.value })}
                    className="w-14 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                  />
                  <span className="text-xs text-muted">reps</span>
                </label>
                <button
                  onClick={() => update(ei, si, { done: !s.done })}
                  className={`ml-auto w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    s.done ? 'bg-load text-white' : 'bg-white border border-line text-line'
                  }`}
                  aria-label="Mark set done"
                >
                  <Check size={20} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={() => nav('/')}>
          Cancel
        </Button>
        <Button className="flex-[2]" onClick={save}>
          Save session
        </Button>
      </div>
    </div>
  )
}
