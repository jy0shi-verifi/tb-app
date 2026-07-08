import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { maxesMap, resolvePosition, sessionFor } from '../program'
import { isoDate, parseISO, prettyDate, today } from '../lib/date'
import { db, DEFAULT_SETTINGS } from '../db'
import { Button, Card, SessionIcon } from '../components/ui'
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
interface MetaState {
  done: boolean
  duration: string
  feel: '' | 'easy' | 'ok' | 'hard'
  notes: string
}

export default function Session() {
  const nav = useNavigate()
  const params = useParams()
  const iso = params.date ?? isoDate(today())
  const when = parseISO(iso)

  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS, [])
  const maxes = useLiveQuery(() => db.maxes.toArray(), [])
  const logged = useLiveQuery(
    async () => (await db.sessions.where('date').equals(iso).first()) ?? null,
    [iso],
  )

  const [ex, setEx] = useState<ExState[] | null>(null)
  const [meta, setMeta] = useState<MetaState>({ done: false, duration: '', feel: '', notes: '' })

  const ready = settings !== undefined && maxes !== undefined && logged !== undefined
  const pos = ready ? resolvePosition(settings, when) : null
  const plan = ready && pos ? sessionFor(pos.phaseId, pos.week, pos.day, maxesMap(maxes), settings) : null

  useEffect(() => {
    if (!ready || !plan || ex !== null) return
    const fromLog = logged && logged.exercises.length > 0
    setEx(
      plan.exercises.map((e, i) => {
        const saved = fromLog ? logged!.exercises[i] : undefined
        return {
          name: e.name,
          note: e.note,
          loaded: e.loaded,
          sets: e.sets.map((s, j) => {
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
    if (logged) {
      setMeta({
        done: logged.done,
        duration: logged.durationMin != null ? String(logged.durationMin) : '',
        feel: logged.feel ?? '',
        notes: logged.notes ?? '',
      })
    }
  }, [ready, plan, logged, ex])

  if (!ready || ex === null || !plan || !pos)
    return <p className="text-muted text-sm">Loading…</p>

  const isLifting = plan.exercises.length > 0
  const isRest = plan.type === 'rest'

  const update = (ei: number, si: number, patch: Partial<SetState>) => {
    setEx((prev) =>
      prev!.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    )
  }

  const totalSets = ex.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = ex.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  async function save() {
    const exercises: LoggedExercise[] = ex!.map((e) => ({
      name: e.name,
      sets: e.sets.map((s) => ({
        weight: s.weight === '' ? undefined : Number(s.weight),
        reps: Number(s.reps) || 0,
        done: s.done,
      })),
    }))
    const done = isLifting ? doneSets === totalSets && totalSets > 0 : meta.done
    const rec: SessionLog = {
      date: iso,
      phaseId: pos!.phaseId,
      week: pos!.week,
      day: pos!.day,
      type: plan!.type,
      title: plan!.title,
      exercises,
      done,
      durationMin: meta.duration === '' ? undefined : Number(meta.duration),
      feel: meta.feel === '' ? undefined : meta.feel,
      notes: meta.notes || undefined,
      createdAt: Date.now(),
    }
    await db.sessions.put(logged?.id ? { ...rec, id: logged.id } : rec)
    nav(-1)
  }

  async function removeLog() {
    if (!logged?.id) return
    if (!window.confirm('Delete this logged session? This can’t be undone.')) return
    await db.sessions.delete(logged.id)
    setEx(null)
    setMeta({ done: false, duration: '', feel: '', notes: '' })
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="flex items-center gap-2">
          <SessionIcon type={plan.type} size={20} />
          <div>
            <h2 className="text-xl font-bold text-ink leading-tight">{plan.title}</h2>
            <p className="text-sm text-muted">
              {prettyDate(when)}
              {plan.scheme ? ` · ${plan.scheme}` : ''}
            </p>
          </div>
        </div>
        {isLifting && (
          <div className="mt-3 h-1.5 rounded-full bg-line/60 overflow-hidden">
            <div
              className="h-full bg-load transition-all"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        )}
        {plan.detail && !isLifting && <p className="text-sm text-muted mt-2">{plan.detail}</p>}
      </div>

      {/* lifting logger */}
      {isLifting &&
        ex.map((e, ei) => (
          <Card key={ei} className="p-4">
            <div className="mb-2">
              <p className="font-semibold text-ink">{e.name}</p>
              {e.note && <p className="text-xs text-muted">{e.note}</p>}
            </div>
            <div className="space-y-2">
              {e.sets.map((s, si) => (
                <div
                  key={si}
                  className={`flex items-center gap-2 rounded-xl p-2 ${s.done ? 'bg-load-soft' : 'bg-canvas'}`}
                >
                  <span className="w-6 text-center text-sm font-semibold text-muted">{si + 1}</span>
                  {e.loaded && (
                    <label className="flex items-center gap-1">
                      <input
                        inputMode="decimal"
                        value={s.weight}
                        onChange={(ev) => update(ei, si, { weight: ev.target.value })}
                        className="w-16 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                      />
                      <span className="text-xs text-muted">kg</span>
                    </label>
                  )}
                  <label className="flex items-center gap-1">
                    <input
                      inputMode="numeric"
                      value={s.reps}
                      onChange={(ev) => update(ei, si, { reps: ev.target.value })}
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

      {/* cardio / rest completion */}
      {!isLifting && (
        <Card className="p-4 space-y-4">
          <button
            onClick={() => setMeta((m) => ({ ...m, done: !m.done }))}
            className={`w-full rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition ${
              meta.done ? 'bg-load text-white' : 'bg-canvas text-ink border border-line'
            }`}
          >
            <Check size={22} /> {meta.done ? 'Done' : isRest ? 'Mark rest taken' : 'Mark done'}
          </button>

          {!isRest && (
            <>
              <div>
                <p className="text-sm font-semibold text-ink mb-1">Duration</p>
                <label className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    value={meta.duration}
                    onChange={(e) => setMeta((m) => ({ ...m, duration: e.target.value }))}
                    placeholder="30"
                    className="w-20 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                  />
                  <span className="text-sm text-muted">minutes</span>
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink mb-1">How did it feel?</p>
                <div className="flex rounded-xl bg-canvas p-1 gap-1">
                  {(['easy', 'ok', 'hard'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMeta((m) => ({ ...m, feel: m.feel === f ? '' : f }))}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                        meta.feel === f ? 'bg-brand text-white' : 'text-muted'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-sm font-semibold text-ink mb-1">Notes</p>
            <textarea
              value={meta.notes}
              onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))}
              rows={2}
              placeholder="Optional…"
              className="w-full rounded-lg border border-line bg-white p-2 text-sm"
            />
          </div>
        </Card>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={() => nav(-1)}>
          Cancel
        </Button>
        <Button className="flex-[2]" onClick={save}>
          Save session
        </Button>
      </div>

      {logged?.id && (
        <button onClick={removeLog} className="w-full text-sm text-red-600 font-medium py-2">
          Delete this log
        </button>
      )}
    </div>
  )
}
