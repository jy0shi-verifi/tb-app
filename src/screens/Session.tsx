import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Pencil, Timer, X, Plus } from 'lucide-react'
import { maxesMap, resolvePosition, sessionFor, type SessionPlan } from '../program'
import { isoDate, parseISO, prettyDate, today } from '../lib/date'
import { db, DEFAULT_SETTINGS } from '../db'
import { estimate1RM } from '../lib/calc'
import { bestEst1RM } from '../lib/stats'
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

function restSeconds(plan: SessionPlan, week: number): number {
  if (plan.type === 'se') return 60
  if (plan.type === 'lift' && plan.title.startsWith('Operator')) {
    return week === 3 || week === 6 ? 240 : 150
  }
  return 120
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
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
  const allSessions = useLiveQuery(() => db.sessions.toArray(), [], [])

  const [ex, setEx] = useState<ExState[] | null>(null)
  const [meta, setMeta] = useState<MetaState>({ done: false, duration: '', feel: '', notes: '' })
  const [editing, setEditing] = useState<Set<string>>(new Set())
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const touched = useRef(false)

  const ready = settings !== undefined && maxes !== undefined && logged !== undefined
  const pos = ready ? resolvePosition(settings, when) : null
  const plan = ready && pos ? sessionFor(pos.phaseId, pos.week, pos.day, maxesMap(maxes), settings) : null

  // hydrate once from an existing log or the plan
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
              weight: ss?.weight != null ? String(ss.weight) : s.weight != null ? String(s.weight) : '',
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

  // keep the screen awake while logging
  useEffect(() => {
    let sentinel: { release: () => void } | null = null
    const req = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sentinel = await (navigator as any).wakeLock?.request('screen')
      } catch {
        /* unsupported / denied */
      }
    }
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      try {
        sentinel?.release()
      } catch {
        /* ignore */
      }
    }
  }, [])

  // rest-timer ticker
  useEffect(() => {
    if (restEnd == null) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((restEnd - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        buzz([120, 60, 120])
        setRestEnd(null)
      }
    }, 250)
    return () => clearInterval(id)
  }, [restEnd])

  // autosave after the first interaction
  useEffect(() => {
    if (!touched.current || !ready || !plan || !pos || !ex) return
    const exercises: LoggedExercise[] = ex.map((e) => ({
      name: e.name,
      sets: e.sets.map((s) => ({
        weight: s.weight === '' ? undefined : Number(s.weight),
        reps: Number(s.reps) || 0,
        done: s.done,
      })),
    }))
    const total = ex.reduce((n, e) => n + e.sets.length, 0)
    const done = ex.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    const isLift = ex.length > 0
    const rec: SessionLog = {
      date: iso,
      phaseId: pos.phaseId,
      week: pos.week,
      day: pos.day,
      type: plan.type,
      title: plan.title,
      exercises,
      done: isLift ? total > 0 && done === total : meta.done,
      durationMin: meta.duration === '' ? undefined : Number(meta.duration),
      feel: meta.feel === '' ? undefined : meta.feel,
      notes: meta.notes || undefined,
      createdAt: logged?.createdAt ?? Date.now(),
    }
    db.sessions.put(logged?.id ? { ...rec, id: logged.id } : rec)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex, meta])

  if (!ready || ex === null || !plan || !pos) return <p className="text-muted text-sm">Loading…</p>

  const isLifting = plan.exercises.length > 0
  const isRest = plan.type === 'rest'
  const isSE = plan.type === 'se'
  const restSec = restSeconds(plan, pos.week)

  const setSet = (ei: number, si: number, patch: Partial<SetState>) => {
    touched.current = true
    setEx((prev) =>
      prev!.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    )
  }

  const toggleDone = (ei: number, si: number) => {
    const cur = ex[ei].sets[si].done
    setSet(ei, si, { done: !cur })
    if (!cur) {
      buzz(30)
      setRestEnd(Date.now() + restSec * 1000)
      setRemaining(restSec)
    }
  }

  const setMetaTouched = (patch: Partial<MetaState>) => {
    touched.current = true
    setMeta((m) => ({ ...m, ...patch }))
  }

  const editKey = (ei: number, si: number) => `${ei}-${si}`
  const toggleEdit = (ei: number, si: number) => {
    setEditing((prev) => {
      const next = new Set(prev)
      const k = editKey(ei, si)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })
  }

  const totalSets = ex.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = ex.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const allDone = totalSets > 0 && doneSets === totalSets
  const prs = allDone
    ? ex
        .filter((e) => e.loaded)
        .map((e) => {
          const cur = Math.max(
            0,
            ...e.sets
              .filter((s) => s.weight !== '' && Number(s.reps) > 0)
              .map((s) => estimate1RM(Number(s.weight), Number(s.reps))),
          )
          const prev = bestEst1RM(allSessions, e.name, iso)
          return cur > 0 && prev > 0 && cur > prev ? e.name : null
        })
        .filter((x): x is string => x != null)
    : []

  function SetRow({ ei, si }: { ei: number; si: number }) {
    const s = ex![ei].sets[si]
    const loaded = ex![ei].loaded
    const isEditing = editing.has(editKey(ei, si))
    return (
      <div
        className={`flex items-center gap-2 rounded-xl p-2 transition ${s.done ? 'bg-load-soft' : 'bg-canvas'}`}
      >
        <span className="w-5 text-center text-sm font-semibold text-muted">{si + 1}</span>
        {isEditing ? (
          <>
            {loaded && (
              <label className="flex items-center gap-1">
                <input
                  inputMode="decimal"
                  value={s.weight}
                  onChange={(e) => setSet(ei, si, { weight: e.target.value })}
                  className="w-16 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                />
                <span className="text-xs text-muted">kg</span>
              </label>
            )}
            <label className="flex items-center gap-1">
              <input
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => setSet(ei, si, { reps: e.target.value })}
                className="w-14 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
              />
              <span className="text-xs text-muted">reps</span>
            </label>
            <button onClick={() => toggleEdit(ei, si)} className="ml-auto text-muted p-2" aria-label="Done editing">
              <Check size={18} />
            </button>
          </>
        ) : (
          <>
            <span className="font-semibold text-ink tnum">
              {loaded && s.weight !== '' ? `${s.weight} kg × ${s.reps}` : `${s.reps} reps`}
            </span>
            <button onClick={() => toggleEdit(ei, si)} className="text-muted/60 p-1" aria-label="Edit set">
              <Pencil size={14} />
            </button>
            <button
              onClick={() => toggleDone(ei, si)}
              className={`ml-auto w-12 h-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
                s.done ? 'bg-load text-white' : 'bg-white border border-line text-line'
              }`}
              aria-label="Mark set done"
            >
              <Check size={22} />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
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
              className="h-full bg-load transition-all duration-300"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        )}
        {plan.detail && !isLifting && <p className="text-sm text-muted mt-2">{plan.detail}</p>}
        {isLifting && plan.detail && <p className="text-xs text-muted mt-2">{plan.detail}</p>}
      </div>

      {/* completion moment */}
      {allDone && (
        <Card className="p-4 text-center bg-load-soft border-load/40">
          <p className="text-3xl">✅</p>
          <p className="font-bold text-load mt-1">
            Session complete — {doneSets}/{totalSets} sets
          </p>
          {prs.length > 0 && (
            <p className="text-sm text-ink mt-1">🏆 New best on {prs.join(', ')}!</p>
          )}
        </Card>
      )}

      {/* SE = round-by-round; other lifts = per-exercise */}
      {isSE ? (
        Array.from({ length: ex[0]?.sets.length ?? 0 }, (_, round) => (
          <Card key={round} className="p-4">
            <p className="font-semibold text-ink mb-2">Round {round + 1}</p>
            <div className="space-y-2">
              {ex.map((e, ei) => (
                <div
                  key={ei}
                  className={`flex items-center gap-2 rounded-xl p-2 ${e.sets[round].done ? 'bg-load-soft' : 'bg-canvas'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-[15px] truncate">{e.name}</p>
                    <p className="text-xs text-muted">{e.sets[round].reps} reps</p>
                  </div>
                  <button
                    onClick={() => toggleDone(ei, round)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
                      e.sets[round].done ? 'bg-load text-white' : 'bg-white border border-line text-line'
                    }`}
                    aria-label="Mark done"
                  >
                    <Check size={22} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))
      ) : isLifting ? (
        ex.map((e, ei) => (
          <Card key={ei} className="p-4">
            <div className="mb-2">
              <p className="font-semibold text-ink">{e.name}</p>
              {e.note && <p className="text-xs text-muted">{e.note}</p>}
            </div>
            <div className="space-y-2">
              {e.sets.map((_, si) => (
                <SetRow key={si} ei={ei} si={si} />
              ))}
            </div>
          </Card>
        ))
      ) : (
        // cardio / rest
        <Card className="p-4 space-y-4">
          <button
            onClick={() => setMetaTouched({ done: !meta.done })}
            className={`w-full rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${
              meta.done ? 'bg-load text-white' : 'bg-canvas text-ink border border-line'
            }`}
          >
            <Check size={22} /> {meta.done ? 'Done' : isRest ? 'Mark rest taken' : 'Mark done'}
          </button>
          {!isRest && (
            <>
              <div>
                <p className="text-sm font-semibold text-ink mb-1">Duration</p>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    value={meta.duration}
                    onChange={(e) => setMetaTouched({ duration: e.target.value })}
                    placeholder="30"
                    className="w-20 text-center rounded-lg border border-line bg-white py-2 font-semibold tnum"
                  />
                  <span className="text-sm text-muted">min</span>
                  {[20, 30, 40].map((d) => (
                    <button
                      key={d}
                      onClick={() => setMetaTouched({ duration: String(d) })}
                      className="rounded-lg bg-canvas border border-line px-3 py-2 text-sm font-semibold text-muted"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink mb-1">How did it feel?</p>
                <div className="flex rounded-xl bg-canvas p-1 gap-1">
                  {(['easy', 'ok', 'hard'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMetaTouched({ feel: meta.feel === f ? '' : f })}
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
              onChange={(e) => setMetaTouched({ notes: e.target.value })}
              rows={2}
              placeholder="Optional…"
              className="w-full rounded-lg border border-line bg-white p-2 text-sm"
            />
          </div>
        </Card>
      )}

      {/* rest timer */}
      {restEnd != null && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-20">
          <div className="max-w-xl mx-auto rounded-2xl bg-brand text-white shadow-lg px-4 py-3 flex items-center gap-3">
            <Timer size={22} />
            <div className="flex-1">
              <p className="text-xs text-white/70">Rest</p>
              <p className="text-2xl font-bold tnum leading-none">
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </p>
            </div>
            <button
              onClick={() => {
                setRestEnd(Date.now() + (restEnd - Date.now()) + 30_000)
              }}
              className="rounded-lg bg-white/15 px-2 py-2 text-sm font-semibold flex items-center gap-1"
            >
              <Plus size={14} />
              30s
            </button>
            <button onClick={() => setRestEnd(null)} className="rounded-lg bg-white/15 p-2" aria-label="Skip rest">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={() => nav(-1)}>
          {isLifting ? 'Back' : 'Cancel'}
        </Button>
        <Button className="flex-[2]" onClick={() => nav(-1)}>
          {allDone ? 'Finish ✓' : 'Done for now'}
        </Button>
      </div>

      {logged?.id && (
        <button
          onClick={async () => {
            if (!window.confirm('Delete this logged session?')) return
            await db.sessions.delete(logged.id!)
            nav(-1)
          }}
          className="w-full text-sm text-red-600 font-medium py-2"
        >
          Delete this log
        </button>
      )}
    </div>
  )
}
