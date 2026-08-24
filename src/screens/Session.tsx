import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { createPortal } from 'react-dom'
import { Check, Timer, X, Plus, Minus, Smile, Meh, Frown, ChevronDown } from 'lucide-react'
import { narrowMaxes, protocolFor, resolvePosition, sessionFor, type SessionPlan } from '../program'
import { EXERCISE_INFO } from '../exerciseInfo'
import ExerciseDetail from '../components/ExerciseDetail'
import { isoDate, parseISO, prettyDate, today } from '../lib/date'
import { db, DEFAULT_SETTINGS, saveSettings } from '../db'
import IntervalTimer from '../components/IntervalTimer'
import { applyBeginnerProgress, beginnerDayLetter, beginnerLiftId, beginnerStall, REP_HI } from '../beginner'
import { estimate1RM } from '../lib/calc'
import { GM_FAILURE_DROP_PCT, currentMaxKg, withFailureDrop } from '../lib/progression'
import { bestEst1RM, lastPerformance } from '../lib/stats'
import { Button, Card, SegmentedPicker, SetCheck, SessionIcon } from '../components/ui'
import Celebration, { type CelebrationContent } from '../components/Celebration'
import ConditioningAlongside from '../components/ConditioningAlongside'
import ShareWin from '../components/ShareWin'
import type { LoggedExercise, OneRmEntry, SessionLog } from '../types'

interface SetState {
  weight: string
  reps: string
  done: boolean
}
interface ExState {
  name: string
  /**
   * Stable id, when the plan carries one. Needed to find this exercise's stored
   * 1RM — history is keyed by display NAME, but a max is keyed by id.
   */
  exerciseId?: string
  note?: string
  loaded: boolean
  sets: SetState[]
  /**
   * "Don't force progression for exercises you struggled with" (MASS p.53).
   * The book's test is the lifter's judgement, so this is a tick he sets, not
   * something inferred from the numbers. Read at the block boundary by
   * `markedStruggled` in `src/lib/progression.ts`.
   */
  struggled: boolean
  /**
   * How this exercise is loaded. The screen used to hardcode "kg/DB" under every
   * weight, which is wrong by a factor of two for a barbell lift.
   */
  perDumbbell: boolean
  /** Plate breakdown for one side of the bar, when the plan computed one. */
  perSide?: { kg: number; count: number }[]
  /** The exact percentage target before rounding — shown next to the loaded weight. */
  targetKg?: number
  /** Target is lighter than the empty bar (MASS p.31). */
  belowBar?: boolean
  /** Plate inventory could not reach the target. */
  exhausted?: boolean
  /**
   * The weight the PLAN prescribed. Distinct from `sets[].weight`, which is what
   * the user has typed — the plate breakdown describes the prescription and must
   * not re-compute itself as you edit a logged value.
   */
  plannedKg?: number
}
interface MetaState {
  done: boolean
  duration: string
  feel: '' | 'easy' | 'ok' | 'hard'
  notes: string
}

function restSeconds(plan: SessionPlan, override?: number): number {
  if (override && override > 0) return override // user-set rest (Settings)
  if (plan.type === 'se') return 120 // between rounds
  return 120
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

// A short audible beep for the rest-timer end — vibrate alone doesn't survive a
// pocketed/locked phone. Unlocked on a user gesture (startRest) so it can fire.
let audioCtx: AudioContext | null = null
function primeAudio() {
  try {
    audioCtx = audioCtx ?? new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    /* no audio */
  }
}
function beep() {
  try {
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    const t = audioCtx.currentTime
    for (const at of [0, 0.28]) {
      const o = audioCtx.createOscillator()
      const g = audioCtx.createGain()
      o.connect(g)
      g.connect(audioCtx.destination)
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, t + at)
      g.gain.exponentialRampToValueAtTime(0.35, t + at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.22)
      o.start(t + at)
      o.stop(t + at + 0.24)
    }
  } catch {
    /* no audio */
  }
}

// Rest timer end-time is persisted so a refresh mid-rest resumes it.
const REST_KEY = 'tb-rest-end'

// Steppers sized for cold, one-handed, low-light taps (44px hit area).
const STEP =
  'w-11 h-11 grid place-items-center text-brand-ink shrink-0 active:scale-90 active:bg-brand/10 transition-transform'

/**
 * One set's row. Hoisted to MODULE scope (not defined inside Session) so its component
 * identity is stable across Session re-renders — otherwise every render (incl. the rest
 * timer ticking 4x/sec) would remount the row and blur the weight/reps input mid-keystroke.
 */
/**
 * Shows how the prescribed weight was arrived at: the exact percentage target,
 * the weight actually loaded, and the plates per side.
 *
 * This is not decoration. The book gives NO rounding rule (see
 * src/lib/barbell.ts), so the rounding is ours — and a deviation we chose has to
 * stay visible and auditable against the book rather than being absorbed
 * silently into a single number.
 */
function PlateLine({ ex }: { ex: ExState }) {
  if (ex.belowBar) {
    return (
      <p className="text-[11px] text-muted mt-1">
        Target is under the empty bar — lift the bar, or swap in dumbbells.
      </p>
    )
  }
  if (!ex.perSide?.length) return null
  const plates = ex.perSide.map((p) => (p.count > 1 ? `${p.count}×${p.kg}` : `${p.kg}`)).join(' + ')
  const target = ex.targetKg
  // The PRESCRIBED weight, not the typed one.
  const loaded = ex.plannedKg ?? 0
  const off = target != null && Math.abs(loaded - target) >= 0.05
  return (
    <p className="text-[11px] text-muted mt-1">
      {/* The loaded total is shown first and always: the rounding is our
          deviation from the book, so what you actually put on the bar has to be
          on screen next to the exact target. */}
      <span className="num-display text-ink">{loaded}</span> kg ·{' '}
      <span className="num-display text-ink">{plates}</span> per side
      {target != null && (
        <>
          {' · '}
          {off ? (
            <>
              target <span className="num-display">{target}</span> kg
            </>
          ) : (
            'exact'
          )}
        </>
      )}
      {ex.exhausted && (
        <span className="block text-brand-ink font-semibold">
          Not enough plates to reach the target — check your plate inventory in Settings.
        </span>
      )}
    </p>
  )
}

function SetRow({
  s,
  loaded,
  index,
  inc,
  unit,
  onSet,
  onToggle,
}: {
  s: SetState
  loaded: boolean
  index: number
  inc: number
  unit: string
  onSet: (patch: Partial<SetState>) => void
  onToggle: () => void
}) {
  const w = Number(s.weight) || 0
  const r = Number(s.reps) || 0
  const bumpW = (d: number) => onSet({ weight: String(Math.max(0, Math.round((w + d) * 10) / 10)) })
  const bumpR = (d: number) => onSet({ reps: String(Math.max(0, r + d)) })
  return (
    <div className={`flex items-center gap-2 rounded-field p-2 transition ${s.done ? 'bg-load-soft' : 'bg-[var(--color-surface-sunk)]'}`}>
      <span className="w-4 text-center text-xs font-bold text-muted shrink-0 num-display">{index + 1}</span>
      {loaded && (
        <div className="flex items-center rounded-pill bg-surface elev-sunk overflow-hidden">
          <button onClick={() => bumpW(-inc)} className={STEP} aria-label="Less weight">
            <Minus size={15} />
          </button>
          {/* w-16 AND shrink-0: barbell totals run to five characters ("102.5"),
              and the dumbbell-era w-12 clipped them to "10". Without shrink-0 the
              flex row squeezes the cell back down and the clipping returns. */}
          <div className="w-16 shrink-0 text-center border-x border-line">
            <input
              type="text"
              inputMode="decimal"
              value={s.weight}
              onChange={(e) => onSet({ weight: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') })}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="0"
              aria-label={unit === 'kg/DB' ? 'Weight per dumbbell' : 'Weight on the bar'}
              className="w-full text-center num-display text-ink text-[15px] leading-none bg-transparent outline-none focus:text-brand-ink"
            />
            <span className="text-[10px] text-muted block leading-none">{unit}</span>
          </div>
          <button onClick={() => bumpW(inc)} className={STEP} aria-label="More weight">
            <Plus size={15} />
          </button>
        </div>
      )}
      <div className="flex items-center rounded-pill bg-surface elev-sunk overflow-hidden">
        <button onClick={() => bumpR(-1)} className={STEP} aria-label="Fewer reps">
          <Minus size={15} />
        </button>
        <div className="w-10 text-center border-x border-line">
          <input
            type="text"
            inputMode="numeric"
            value={s.reps}
            onChange={(e) => onSet({ reps: e.target.value.replace(/[^0-9]/g, '') })}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Reps"
            className="w-full text-center num-display text-ink text-[15px] leading-none bg-transparent outline-none focus:text-brand-ink"
          />
          <span className="text-[10px] text-muted block leading-none">reps</span>
        </div>
        <button onClick={() => bumpR(1)} className={STEP} aria-label="More reps">
          <Plus size={15} />
        </button>
      </div>
      <div className="ml-auto shrink-0">
        <SetCheck done={s.done} onToggle={onToggle} label="Mark set done" />
      </div>
    </div>
  )
}

export default function Session() {
  const nav = useNavigate()
  const params = useParams()
  const iso = params.date ?? isoDate(today())
  const when = parseISO(iso)

  const settings = useLiveQuery(async () => (await db.settings.get('app')) ?? DEFAULT_SETTINGS, [])
  // Protocol-scoped 1RMs. `narrowMaxes` keeps Beginner's per-dumbbell maxes away
  // from MASS's total-on-the-bar ones.
  const oneRm = useLiveQuery(() => db.oneRm.toArray(), [])
  const logged = useLiveQuery(
    async () => (await db.sessions.where('date').equals(iso).first()) ?? null,
    [iso],
  )
  const allSessions = useLiveQuery(() => db.sessions.toArray(), [], [])

  const [ex, setEx] = useState<ExState[] | null>(null)
  const [meta, setMeta] = useState<MetaState>({ done: false, duration: '', feel: '', notes: '' })
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [celebration, setCelebration] = useState<CelebrationContent | null>(null)
  const [openInfo, setOpenInfo] = useState<string | null>(null)
  const celebrated = useRef<Set<string>>(new Set())
  const touched = useRef(false)

  const ready = settings !== undefined && oneRm !== undefined && logged !== undefined
  const pos = ready ? resolvePosition(settings, when) : null
  const maxes = ready && pos ? narrowMaxes(oneRm, protocolFor(pos.phaseId)) : {}
  const plan = ready && pos ? sessionFor(pos.phaseId, pos.week, pos.day, settings, maxes) : null

  // hydrate once from an existing log or the plan
  useEffect(() => {
    if (!ready || !plan || ex !== null) return
    const fromLog = logged && logged.exercises.length > 0
    // Scope by PROTOCOL, not just by type. Grey Man sessions are also
    // `type: 'lift'`, and CLAUDE.md warns that a `type === 'lift'` test lets one
    // programme's progression logic bleed into another's — the beginner
    // double-progression prefill and badge did exactly that until this gate.
    const beginnerLift = pos?.phaseId === 'beginner' && plan.type === 'lift'
    setEx(
      plan.exercises.map((e, i) => {
        const saved = fromLog ? logged!.exercises[i] : undefined
        // Beginner double progression: pre-fill last time's reps (so the natural move
        // is to beat them), UNLESS a +2 kg bump just raised the working weight — then
        // keep the range floor the plan already set (reps reset on a weight bump).
        const working = e.sets[0]?.weight
        const last = beginnerLift && !fromLog ? lastPerformance(allSessions, e.name, iso, pos.phaseId) : null
        const prefill = last && last.weight === working ? last.reps : null
        const first = e.sets[0]
        return {
          name: e.name,
          exerciseId: e.exerciseId,
          note: e.note,
          loaded: e.loaded,
          struggled: saved?.struggled ?? false,
          perDumbbell: first?.perDumbbell === true,
          perSide: first?.perSide,
          targetKg: first?.targetKg,
          belowBar: first?.belowBar,
          exhausted: first?.exhausted,
          plannedKg: first?.weight,
          sets: e.sets.map((s, j) => {
            const ss = saved?.sets[j]
            return {
              weight: ss?.weight != null ? String(ss.weight) : s.weight != null ? String(s.weight) : '',
              reps: ss ? String(ss.reps) : String(prefill?.[j] ?? s.reps),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, plan, logged, ex, allSessions])

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

  // resume a rest timer that was running before a refresh
  useEffect(() => {
    const saved = Number(localStorage.getItem(REST_KEY))
    if (saved && saved > Date.now()) {
      setRestEnd(saved)
      const left = Math.max(0, Math.round((saved - Date.now()) / 1000))
      setRemaining(left)
      setRestTotal(left)
    } else if (saved) {
      localStorage.removeItem(REST_KEY)
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
        beep()
        localStorage.removeItem(REST_KEY)
        setRestEnd(null)
      }
    }, 250)
    return () => clearInterval(id)
  }, [restEnd])

  // autosave after the first interaction
  useEffect(() => {
    if (!touched.current || !ready || !plan || !pos || !ex) return
    const save = async () => {
      // Re-read the freshest row at write time — an auto-sync may have merged
      // Strava HR/duration into it since this component rendered; using a stale
      // `logged` closure here would silently clobber that enrichment.
      const existing = await db.sessions.where('date').equals(iso).first()
      const exercises: LoggedExercise[] = ex.map((e) => ({
        name: e.name,
        sets: e.sets.map((s) => ({
          weight: s.weight === '' || !Number.isFinite(Number(s.weight)) ? undefined : Number(s.weight),
          reps: Number(s.reps) || 0,
          done: s.done,
        })),
        // Only written when true, so a session logged before this existed and one
        // where he simply didn't tick it stay indistinguishable in the file.
        ...(e.struggled ? { struggled: true } : {}),
      }))
      const total = ex.reduce((n, e) => n + e.sets.length, 0)
      const done = ex.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
      const isLift = ex.length > 0
      const rec: SessionLog = {
        ...(existing?.id ? { id: existing.id } : {}),
        date: iso,
        phaseId: pos.phaseId,
        week: pos.week,
        day: pos.day,
        type: plan.type,
        title: existing?.stravaId ? (existing.title ?? plan.title) : plan.title,
        exercises,
        done: isLift ? total > 0 && done === total : meta.done,
        // preserve Strava-populated conditioning data from the freshest row
        durationMin: meta.duration === '' ? existing?.durationMin : Number(meta.duration),
        distanceKm: existing?.distanceKm,
        avgHr: existing?.avgHr,
        stravaId: existing?.stravaId,
        feel: meta.feel === '' ? undefined : meta.feel,
        notes: meta.notes === '' ? undefined : meta.notes,
        createdAt: existing?.createdAt ?? Date.now(),
      }
      await db.sessions.put(rec)
    }
    save()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex, meta])

  if (!ready || ex === null || !plan || !pos)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading session">
        <div className="skeleton h-16 rounded-card" />
        <div className="skeleton h-40 rounded-card" />
        <div className="skeleton h-40 rounded-card" />
      </div>
    )

  const isLifting = plan.exercises.length > 0
  const isRest = plan.type === 'rest'
  const isSE = plan.type === 'se'
  const restSec = restSeconds(plan, settings.restSec)
  const inc = settings.dbIncrement
  // Smallest change you can actually make to a loaded bar: twice the lightest
  // plate pair you own. 2.5 kg on a standard kg set, 1 kg with microplates.
  const barStep = 2 * Math.min(...(settings.bar?.platePairsKg?.length ? settings.bar.platePairsKg : [1.25]))
  // See the note at the other `beginnerLift` above: protocol-scoped, not type-scoped.
  const beginnerLift = pos?.phaseId === 'beginner' && plan.type === 'lift'
  /**
   * A lift under a protocol whose loads come from a stored 1RM — which is what
   * Forced Progression acts on. Scoped by PROTOCOL, never by `type === 'lift'`:
   * Grey Man and Beginner sessions are both `type: 'lift'`, and that single
   * conflation is the root cause behind four separate bugs in this codebase, one
   * of which rewrote Beginner's real training weights from barbell totals.
   */
  const massLift = plan.type === 'lift' && protocolFor(pos?.phaseId).family !== 'legacy'

  const setSet = (ei: number, si: number, patch: Partial<SetState>) => {
    touched.current = true
    setEx((prev) =>
      prev!.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    )
  }

  /**
   * "Don't force progression for exercises you struggled with" (MASS p.53).
   *
   * Recorded here, at the moment he knows, and read back at the block boundary by
   * the Forced Progression prompt — asking three weeks later "which of these was
   * hard?" would be asking him to remember something the app could have written
   * down.
   */
  const toggleStruggled = (ei: number) => {
    touched.current = true
    setEx((prev) => prev!.map((e, i) => (i === ei ? { ...e, struggled: !e.struggled } : e)))
  }

  /**
   * The failure remedy, as an action rather than prose: "lower your 1 rep
   * maximum by 10% and recalculate" (p.53).
   *
   * The book puts a step BEFORE this one and the app used to skip it — pp.52-53
   * say to lengthen the rest interval to five minutes or more first, and only
   * drop the max "if you're still failing consistently". The confirm carries that
   * order, because a 10% cut taken on a bad day is a month of progress undone.
   */
  async function dropMax(exerciseId?: string) {
    if (!exerciseId) return
    const entry = maxes[exerciseId]
    if (!entry) return
    const now = currentMaxKg(entry)
    const next = currentMaxKg(withFailureDrop(entry))
    const ok = window.confirm(
      `The book says lengthen your rest to 5 minutes or more first, and only drop the max if you are STILL failing consistently (p.53).

Drop ${entry.exerciseName} by ${GM_FAILURE_DROP_PCT}%, from ${Math.round(now * 10) / 10} kg to ${Math.round(next * 10) / 10} kg?`,
    )
    if (!ok) return
    await db.oneRm.put(withFailureDrop(entry))
  }
  // Deload a stalled beginner lift: drop this session's sets to the lighter weight AND
  // persist it as the new working weight, so LP resumes building from there.
  const applyDeload = (ei: number, liftId: string, toKg: number) => {
    touched.current = true
    setEx((prev) =>
      prev!.map((e, i) => (i === ei ? { ...e, sets: e.sets.map((s) => ({ ...s, weight: String(toKg) })) } : e)),
    )
    saveSettings({ beginner: { lifts: { ...(settings.beginner?.lifts ?? {}), [liftId]: toKg } } })
  }
  const startRest = () => {
    primeAudio() // unlock audio within this tap so the end-beep can sound
    const end = Date.now() + restSec * 1000
    setRestEnd(end)
    setRemaining(restSec)
    setRestTotal(restSec)
    localStorage.setItem(REST_KEY, String(end))
  }
  const bumpRest = (ms: number) => {
    const end = (restEnd ?? Date.now()) + ms
    setRestEnd(end)
    setRestTotal((s) => s + ms / 1000)
    localStorage.setItem(REST_KEY, String(end))
  }
  const clearRest = () => {
    localStorage.removeItem(REST_KEY)
    setRestEnd(null)
  }
  // Fire the confetti moment the instant a set becomes a fresh all-time PR.
  const maybeCelebratePR = (ei: number, si: number) => {
    if (iso !== isoDate(today())) return // don't re-fire when editing a past PR session
    const e = ex[ei]
    if (!e.loaded) return
    const w = Number(e.sets[si].weight)
    const r = Number(e.sets[si].reps)
    if (!(w > 0 && r > 0)) return
    const cur = estimate1RM(w, r)
    const prev = bestEst1RM(allSessions, e.name, iso)
    if (prev > 0 && cur > prev && !celebrated.current.has(e.name)) {
      celebrated.current.add(e.name)
      setCelebration({
        title: 'New PR',
        sub: `${e.name}: ${prev.toFixed(0)} → ${cur.toFixed(0)} kg estimated 1RM. Banked.`,
        icon: 'trophy',
        share: { headline: 'New PR', sub: `${e.name} · ~${cur.toFixed(0)} kg est. 1RM` },
      })
    }
  }
  const toggleDone = (ei: number, si: number) => {
    const cur = ex[ei].sets[si].done
    setSet(ei, si, { done: !cur })
    if (cur) return
    buzz(30)
    maybeCelebratePR(ei, si)
    // circuits rest between ROUNDS only (when the round's last move is ticked)
    const roundComplete = ex.every((e, i) => i === ei || e.sets[si].done)
    if (!isSE || roundComplete) startRest()
  }

  const setMetaTouched = (patch: Partial<MetaState>) => {
    touched.current = true
    setMeta((m) => ({ ...m, ...patch }))
  }

  // Leaving a session: run the LP double-progression off what was actually
  // logged (bump a lift 2 kg once all 3 sets hit 12), then go back.
  async function finish() {
    // Beginner's linear progression must only ever run on a BEGINNER session.
    // Gating on `plan.type === 'lift'` alone let a Grey Man session through, and
    // `applyBeginnerProgress` maps logged exercises onto LP_A/LP_B *by position* —
    // so finishing a Grey Man day wrote barbell totals into the per-dumbbell
    // beginner weights (bench 55 kg on the bar became a 55 kg/DB goblet squat).
    if (settings && plan?.type === 'lift' && pos?.phaseId === 'beginner' && pos && ex) {
      const loggedEx = ex.map((e) => ({
        name: e.name,
        sets: e.sets.map((s) => ({
          weight: s.weight === '' || !Number.isFinite(Number(s.weight)) ? undefined : Number(s.weight),
          reps: Number(s.reps) || 0,
          done: s.done,
        })),
      }))
      const next = applyBeginnerProgress(settings, beginnerDayLetter(pos.week, pos.day), loggedEx)
      if (next) await saveSettings({ beginner: { lifts: next } })
    }
    nav(-1)
  }

  const totalSets = ex.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = ex.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const allDone = totalSets > 0 && doneSets === totalSets
  // PRs from any DONE set that beats the previous best — not gated on finishing everything
  const prs = ex
    .filter((e) => e.loaded)
    .map((e) => {
      const cur = Math.max(
        0,
        ...e.sets
          .filter((s) => s.done && s.weight !== '' && Number(s.reps) > 0)
          .map((s) => estimate1RM(Number(s.weight), Number(s.reps))),
      )
      const prev = bestEst1RM(allSessions, e.name, iso)
      return cur > 0 && prev > 0 && cur > prev ? { name: e.name, prev, cur } : null
    })
    .filter((x): x is { name: string; prev: number; cur: number } => x != null)

  // Weight/reps steppers — editable inputs kept (e2e fills them); styled as sunk wells.
  return (
    <div className="space-y-4 pb-24 stagger">
      <div className="px-1">
        <div className="flex items-center gap-2">
          <SessionIcon type={plan.type} size={22} />
          <div>
            <h2 className="display-hero text-2xl text-ink leading-tight">{plan.title}</h2>
            <p className="text-sm text-muted">
              {prettyDate(when)}
              {plan.scheme ? ` · ${plan.scheme}` : ''}
            </p>
          </div>
        </div>
        {isLifting && (
          <div className="mt-3 h-1.5 rounded-full bg-line/60 overflow-hidden">
            <div
              className="h-full gold-gradient transition-all duration-300"
              style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
            />
          </div>
        )}
        {plan.detail && !isLifting && <p className="text-sm text-muted mt-2">{plan.detail}</p>}
        {isLifting && plan.detail && <p className="text-xs text-muted mt-2">{plan.detail}</p>}
        {plan.conditioning && <ConditioningAlongside c={plan.conditioning} />}
      </div>

      {/* completion / PR moment — PRs show as soon as a top set beats your best */}
      {(doneSets > 0 || prs.length > 0) && (
        <Card className="pop text-center bg-load-soft border-load/40 space-y-1">
          {allDone ? (
            <>
              <p className="text-3xl">✅</p>
              <p className="font-bold text-load">
                Session done — {doneSets}/{totalSets} sets
              </p>
            </>
          ) : doneSets > 0 ? (
            <>
              <p className="text-3xl">💪</p>
              <p className="font-bold text-load">
                Logged — you showed up ({doneSets}/{totalSets} sets)
              </p>
              <p className="text-xs text-muted">
                That's work in the bank. Every set you log counts.
              </p>
            </>
          ) : null}
          {prs.map((pr) => (
            <p key={pr.name} className="text-sm text-ink">
              🏆 {pr.name} est. 1RM: {pr.prev.toFixed(0)} → <b>{pr.cur.toFixed(0)} kg</b>
            </p>
          ))}
          {allDone && (
            <div className="pt-1">
              <ShareWin headline="Session done" sub={`${totalSets} sets banked`} className="text-load" />
            </div>
          )}
        </Card>
      )}

      {/* SE = round-by-round; other lifts = per-exercise */}
      {isSE ? (
        <>
        <Card>
          <p className="eyebrow text-muted mb-1">The circuit — tap a move for form &amp; muscles</p>
          <div className="divide-y divide-line">
            {ex.map((e, ei) => {
              const info = EXERCISE_INFO[e.name]
              const open = openInfo === e.name
              return (
                <div key={ei}>
                  <button
                    onClick={() => info && setOpenInfo(open ? null : e.name)}
                    className="w-full flex items-center gap-1.5 py-2 text-left min-h-11"
                    aria-expanded={open}
                    disabled={!info}
                  >
                    <span className="text-[15px] font-medium text-ink">{e.name}</span>
                    {info && (
                      <ChevronDown size={15} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                    )}
                    {info && <span className="ml-auto text-[11px] font-bold text-brand-ink">Form ▸</span>}
                  </button>
                  {info && open && (
                    <div className="pb-3">
                      <ExerciseDetail name={e.name} info={info} embed />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
        {Array.from({ length: ex[0]?.sets.length ?? 0 }, (_, round) => (
          <Card key={round}>
            <p className="eyebrow text-muted mb-2">Round {round + 1}</p>
            <div className="space-y-2">
              {ex.map((e, ei) => (
                <div
                  key={ei}
                  className={`flex items-center gap-2 rounded-field p-2 ${e.sets[round].done ? 'bg-load-soft' : 'bg-[var(--color-surface-sunk)]'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-[15px] truncate">{e.name}</p>
                    <p className="text-xs text-muted">{e.sets[round].reps} reps</p>
                  </div>
                  <SetCheck done={e.sets[round].done} onToggle={() => toggleDone(ei, round)} label="Mark done" />
                </div>
              ))}
            </div>
          </Card>
        ))}
        </>
      ) : isLifting ? (
        ex.map((e, ei) => {
          const info = EXERCISE_INFO[e.name]
          const open = openInfo === e.name
          return (
          <Card key={ei}>
            <div className="mb-2">
              {info ? (
                <button
                  onClick={() => setOpenInfo(open ? null : e.name)}
                  className="w-full flex items-center gap-1.5 text-left min-h-11"
                  aria-expanded={open}
                >
                  <span className="font-bold text-ink">{e.name}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                  <span className="ml-auto text-[11px] font-bold text-brand-ink">Form ▸</span>
                </button>
              ) : (
                <p className="font-bold text-ink">{e.name}</p>
              )}
              {e.note && <p className="text-xs text-muted mt-0.5">{e.note}</p>}
              <PlateLine ex={e} />
            </div>
            {beginnerLift &&
              (() => {
                const last = lastPerformance(allSessions, e.name, iso, pos.phaseId)
                const liftId = beginnerLiftId(e.name)
                const working = liftId ? settings.beginner?.lifts?.[liftId] ?? 0 : 0
                const stall = liftId ? beginnerStall(allSessions, e.name, working, inc, iso) : null
                const atTop = e.sets.filter((s) => s.done && Number(s.reps) >= REP_HI).length
                const need = e.sets.length - atTop
                return (
                  <div className="-mt-1 mb-2 space-y-1.5">
                    {last && (
                      <p className="text-xs text-muted">
                        Last time:{' '}
                        <b className="text-ink font-semibold">
                          {last.weight != null ? `${last.weight}kg × ` : ''}
                          {last.reps.join(', ')}
                        </b>{' '}
                        {stall ? '' : '— aim higher'}
                      </p>
                    )}
                    {stall ? (
                      <div className="rounded-field bg-warm border border-warm-edge/40 p-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink flex-1 min-w-[60%]">
                          ⚠ Stalled — stuck at {working}kg for {stall.count} sessions. Drop to{' '}
                          <b>{stall.deloadTo}kg</b> and build back up.
                        </span>
                        <button
                          onClick={() => applyDeload(ei, liftId!, stall.deloadTo)}
                          className="ml-auto rounded-pill bg-brand/10 text-brand-ink text-[11px] font-bold px-3 min-h-9 active:bg-brand/20"
                        >
                          Deload to {stall.deloadTo}kg
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-pill ${
                          need <= 0 ? 'bg-load-soft text-load' : 'bg-[var(--color-surface-sunk)] text-muted'
                        }`}
                      >
                        {need <= 0
                          ? '✓ +2 kg next session'
                          : `${need} more ${need === 1 ? 'set' : 'sets'} at ${REP_HI} → +2 kg`}
                      </span>
                    )}
                  </div>
                )
              })()}
            {info && open && (
              <div className="mb-3">
                <ExerciseDetail name={e.name} info={info} embed />
              </div>
            )}
            <div className="space-y-2">
              {e.sets.map((_, si) => (
                <SetRow
                  key={si}
                  index={si}
                  s={e.sets[si]}
                  loaded={e.loaded}
                  // Dumbbells step by the user's pair increment; a bar steps by the
                  // smallest pair of plates they own (2.5 kg by default).
                  inc={e.perDumbbell ? inc : barStep}
                  unit={e.perDumbbell ? 'kg/DB' : 'kg'}
                  onSet={(patch) => setSet(ei, si, patch)}
                  onToggle={() => toggleDone(ei, si)}
                />
              ))}
            </div>
            {massLift && (
              <StruggleControls
                struggled={e.struggled}
                onToggle={() => toggleStruggled(ei)}
                entry={e.exerciseId ? maxes[e.exerciseId] : undefined}
                onDrop={() => void dropMax(e.exerciseId)}
              />
            )}
          </Card>
          )
        })
      ) : (
        // cardio / rest — a C25K interval timer (beginner runs) then mark complete
        <>
        {plan.intervals && plan.intervals.length > 0 && (
          <IntervalTimer intervals={plan.intervals} onComplete={() => setMetaTouched({ done: true })} />
        )}
        <Card className="space-y-3">
          <button
            onClick={() => setMetaTouched({ done: !meta.done })}
            className={`w-full rounded-field py-4 font-bold text-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${
              meta.done ? 'gold-gradient text-on-gold' : 'bg-[var(--color-surface-sunk)] text-ink border border-line'
            }`}
          >
            <Check size={22} /> {meta.done ? 'Completed' : isRest ? 'Mark rest taken' : 'Mark complete'}
          </button>
          {!isRest && !plan.intervals &&
            (logged && (logged.durationMin != null || logged.distanceKm != null) ? (
              <div className="flex justify-around text-center pt-1">
                {logged.distanceKm != null && (
                  <div>
                    <p className="num-display text-xl text-accent-ink">{logged.distanceKm}</p>
                    <p className="text-[11px] text-muted">km</p>
                  </div>
                )}
                {logged.durationMin != null && (
                  <div>
                    <p className="num-display text-xl text-accent-ink">{logged.durationMin}</p>
                    <p className="text-[11px] text-muted">min</p>
                  </div>
                )}
                {logged.avgHr != null && (
                  <div>
                    <p className="num-display text-xl text-accent-ink">{logged.avgHr}</p>
                    <p className="text-[11px] text-muted">avg bpm</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted text-center">
                Distance, pace &amp; heart rate populate from Strava once your run syncs.
              </p>
            ))}
        </Card>
        </>
      )}

      {/* rest timer */}
      {restEnd != null &&
        createPortal(
          <div className="fixed bottom-20 inset-x-0 px-4 z-20 timer-in">
          <div className="max-w-xl mx-auto rounded-field reward-panel text-white elev-2 hero-text overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3">
              <Timer size={22} />
              <div className="flex-1">
                <p className="text-xs text-white/80">Rest</p>
                <p className="num-display text-2xl leading-none">
                  {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={() => bumpRest(30_000)}
                className="rounded-pill bg-white/15 px-3 min-h-11 text-sm font-bold flex items-center gap-1 active:bg-white/25"
              >
                <Plus size={14} />
                30s
              </button>
              <button onClick={clearRest} className="rounded-pill bg-white/15 w-11 h-11 grid place-items-center active:bg-white/25" aria-label="Skip rest">
                <X size={18} />
              </button>
            </div>
            <div className="h-1 bg-white/20">
              <div
                className="h-full bg-white/85 transition-all duration-200"
                style={{ width: `${Math.min(100, restTotal ? (remaining / restTotal) * 100 : 0)}%` }}
              />
            </div>
          </div>
          </div>,
          document.body,
        )}

      {/* how it felt + notes (journaling) */}
      {!isRest && (
        <Card className="space-y-3">
          <div>
            <p className="text-sm font-bold text-ink mb-2">How did it feel?</p>
            <SegmentedPicker<'easy' | 'ok' | 'hard'>
              label="How did it feel?"
              value={meta.feel as 'easy' | 'ok' | 'hard'}
              onChange={(f) => setMetaTouched({ feel: meta.feel === f ? '' : f })}
              toneMode="fill"
              options={[
                { v: 'easy', label: 'Easy', tone: 'green', Icon: Smile },
                { v: 'ok', label: 'Solid', tone: 'amber', Icon: Meh },
                { v: 'hard', label: 'Hard', tone: 'red', Icon: Frown },
              ]}
            />
          </div>
          <input
            value={meta.notes}
            onChange={(e) => setMetaTouched({ notes: e.target.value })}
            aria-label="Session notes"
            placeholder="Notes (optional) — how it went, tweaks, niggles…"
            className="w-full rounded-field border border-[var(--color-field-border)] bg-[var(--color-surface-sunk)] text-ink px-3 py-2.5 text-sm placeholder:text-muted"
          />
        </Card>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1" onClick={finish}>
          {isLifting ? 'Back' : 'Cancel'}
        </Button>
        <Button className="flex-[2]" onClick={finish}>
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
          className="w-full text-sm text-danger font-medium py-2"
        >
          Delete this log
        </button>
      )}

      {celebration && <Celebration content={celebration} onClose={() => setCelebration(null)} />}
    </div>
  )
}

/**
 * The two things MASS asks a lifter to record about a hard set, both from p.53.
 *
 * Hoisted to module scope for the same reason `SetRow` is (see the note there):
 * an inlined component remounts on every render, and the rest timer re-renders
 * this screen four times a second.
 */
function StruggleControls({
  struggled,
  onToggle,
  entry,
  onDrop,
}: {
  struggled: boolean
  onToggle: () => void
  entry?: OneRmEntry
  onDrop: () => void
}) {
  return (
    <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={struggled}
        className={`rounded-pill text-[11px] font-bold px-3 min-h-9 ${
          struggled ? 'bg-brand/15 text-brand-ink' : 'bg-[var(--color-surface-sunk)] text-muted'
        }`}
      >
        {struggled ? '✓ Struggled with this' : 'Struggled with this'}
      </button>
      {entry && (
        <button
          type="button"
          onClick={onDrop}
          className="rounded-pill bg-[var(--color-surface-sunk)] text-muted text-[11px] font-bold px-3 min-h-9"
        >
          Failing? Drop 1RM {GM_FAILURE_DROP_PCT}%
        </button>
      )}
      {struggled && (
        <p className="text-[11px] text-muted basis-full">
          Its 1RM will be left alone at the end of the block — “use the same numbers for the next
          block” (p.53).
        </p>
      )}
    </div>
  )
}
