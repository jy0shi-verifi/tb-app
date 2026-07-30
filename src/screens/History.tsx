import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Flame, Footprints, Trash2 } from 'lucide-react'
import { useSessions, useSettings } from '../hooks'
import { OPERATOR_LIFTS, PHASES } from '../program'
import { beginnerProgress } from '../beginner'
import { estimate1RM } from '../lib/calc'
import { badges, computeStreak, liftRecords, runStats, weekSummary } from '../lib/stats'
import { db, deleteSession } from '../db'
import { Card, EmptyState, SessionIcon, SESSION_META } from '../components/ui'
import { CoinBadge, PaceTrend, ProgressRing, StrengthTrend } from '../components/dataviz'
import { parseISO, diffDays, today } from '../lib/date'

const SERIES_COLORS = ['var(--color-brand)', 'var(--color-load)', 'var(--color-accent)']
// second (non-colour) channel so the three lift lines are distinguishable for colour-vision deficiency
const SERIES_DASH = ['', '5 3', '1.5 2.5']

/** Coin tier for an earned badge key. */
function tierFor(key: string): 'bronze' | 'steel' | 'gold' | 'black' {
  if (key === 'bb' || key === 'op1' || key === 'streak') return 'gold'
  if (key.startsWith('s') || key.startsWith('km')) {
    const n = parseInt(key.replace(/^\D+/, ''), 10)
    if (n >= 200) return 'black'
    if (n >= 100) return 'gold'
    if (n >= 50) return 'steel'
    return 'bronze'
  }
  return 'bronze'
}

async function confirmDelete(id?: number) {
  if (id == null) return
  if (window.confirm('Delete this logged session?')) await deleteSession(id)
}

/** Average pace as "m:ss /km" from minutes + km, or null if either is missing. */
function paceLabel(min?: number, km?: number): string | null {
  if (!min || !km) return null
  const perKm = min / km
  const m = Math.floor(perKm)
  const s = Math.round((perKm - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

export default function History() {
  const sessions = useSessions()
  const settings = useSettings()
  const [openId, setOpenId] = useState<number | null>(null)
  // undefined until IndexedDB has loaded — lets us show a skeleton instead of flashing
  // "No sessions yet" at an established user on a cold start.
  const loading = useLiveQuery(() => db.sessions.count(), []) === undefined

  // "Just earned" pulse: a coin earned since the last History visit pops once, then settles.
  const earnedKeys = useMemo(() => badges(sessions).map((b) => b.key), [sessions])
  const seenCoins = useMemo(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem('tb-seen-coins') || '[]'))
    } catch {
      return new Set<string>()
    }
  }, [])
  useEffect(() => {
    if (!earnedKeys.length) return
    try {
      localStorage.setItem('tb-seen-coins', JSON.stringify(earnedKeys))
    } catch {
      /* private mode — the pulse is cosmetic */
    }
  }, [earnedKeys])

  // conditioning pace trend (min/km over time) — the cardio counterpart to the
  // strength chart; the half he's rebuilding post-RAF finally gets a trend line.
  const paceData = useMemo(
    () =>
      sessions
        .filter((s) => (s.type === 'run' || s.type === 'hic') && s.durationMin && s.distanceKm)
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((s) => ({
          date: parseISO(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          pace: Math.round((s.durationMin! / s.distanceKm!) * 100) / 100,
        })),
    [sessions],
  )

  const chartData = useMemo(() => {
    const rows: Record<string, number | string>[] = []
    const lifts = sessions
      .filter((s) => s.type === 'lift')
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
    const best: Record<string, number> = {}
    for (const s of lifts) {
      const row: Record<string, number | string> = {
        date: parseISO(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      }
      let any = false
      for (const l of OPERATOR_LIFTS) {
        const ex = s.exercises.find((e) => e.name === l.name)
        if (ex) {
          const b = Math.max(
            0,
            ...ex.sets.filter((x) => x.weight && x.reps > 0).map((x) => estimate1RM(x.weight!, x.reps)),
          )
          if (b > (best[l.short] ?? 0)) best[l.short] = b
        }
        if (best[l.short]) {
          row[l.short] = Math.round(best[l.short] * 10) / 10
          any = true
        }
      }
      if (any) rows.push(row)
    }
    return rows
  }, [sessions])

  if (loading)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading history">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-56 rounded-card" />
      </div>
    )

  if (!sessions.length)
    return <EmptyState title="No sessions logged yet" sub="Log your first session and it lands here." />

  const isBeginner = settings.programMode === 'beginner'
  const prog = isBeginner ? beginnerProgress(sessions, settings) : []
  const totalAdded = Math.round(prog.reduce((n, p) => n + Math.max(0, p.delta), 0) * 10) / 10
  const streak = computeStreak(sessions)
  const summary = weekSummary(sessions)
  const week = summary.lifts + summary.runs
  const done = sessions.filter((s) => s.done).length
  const earned = badges(sessions)
  const runs = runStats(sessions)
  const records = liftRecords(sessions, OPERATOR_LIFTS)
  const cutWeeks = Math.round(
    sessions.filter((s) => s.phaseId === 'operator' && s.type === 'lift' && s.done).length / 3,
  )
  const nextMs = [10, 25, 50, 100, 200].find((m) => done < m)
  // Operator "hold" progress — a moving metric while the strength chart is
  // deliberately flat across the 12-week hold (banked sessions = the real win).
  const opTargetLifts = PHASES.operator.lengthWeeks * 3
  const opProgress =
    settings.currentPhaseId === 'operator'
      ? {
          block: settings.operatorBlock ?? 1,
          lifts: sessions.filter(
            (s) => s.type === 'lift' && s.done && s.date >= settings.phaseStartDate,
          ).length,
          week: Math.min(
            PHASES.operator.lengthWeeks,
            Math.max(1, Math.floor(diffDays(today(), parseISO(settings.phaseStartDate)) / 7) + 1),
          ),
        }
      : null

  // strength trend — one line per Operator lift, sharing the date axis
  const labels = chartData.map((r) => String(r.date))
  const series = OPERATOR_LIFTS.map((l, idx) => ({
    key: l.short,
    label: l.short,
    color: SERIES_COLORS[idx],
    dash: SERIES_DASH[idx],
    points: chartData
      .map((r, i) => (r[l.short] != null ? { i, v: Number(r[l.short]) } : null))
      .filter((p): p is { i: number; v: number } => p !== null),
  }))

  return (
    <div className="space-y-4 stagger">
      {/* headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card pad="sm" className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame
              size={18}
              className={`${streak > 0 ? 'text-brand-ink' : 'text-muted'} ${streak >= 7 ? 'flicker' : ''}`}
            />
            <p className="num-display text-3xl text-ink">{streak}</p>
          </div>
          <p className="eyebrow text-muted mt-1">streak</p>
        </Card>
        <Card pad="sm" className="text-center">
          <p className="num-display text-3xl text-load">{week}</p>
          <p className="eyebrow text-muted mt-1">this week</p>
        </Card>
        <Card pad="sm" className="text-center">
          <p className="num-display text-3xl text-brand-ink">{done}</p>
          <p className="eyebrow text-muted mt-1">total done</p>
        </Card>
      </div>

      {/* this week */}
      <Card>
        <p className="eyebrow text-muted mb-3">This week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="num-display text-2xl text-brand-ink">{summary.lifts}</p>
            <p className="eyebrow text-muted mt-1">lifts</p>
          </div>
          <div>
            <p className="num-display text-2xl text-accent-ink">{summary.runs}</p>
            <p className="eyebrow text-muted mt-1">runs</p>
          </div>
          <div>
            <p className="num-display text-2xl text-load">{summary.volume.toLocaleString()}</p>
            <p className="eyebrow text-muted mt-1">kg volume</p>
          </div>
        </div>
      </Card>

      {/* operator hold progress — the ONE hero card */}
      {opProgress && (
        <Card elev="hero" pad="lg" className="topo-hero text-white text-center border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="eyebrow hero-text text-gold-hi">
              Operator · Block {opProgress.block}
            </p>
            <span className="text-xs text-white/80">
              week {opProgress.week}/{PHASES.operator.lengthWeeks}
            </span>
          </div>
          <div className="flex justify-center my-3">
            <ProgressRing value={opProgress.lifts} target={opTargetLifts} label="banked" />
          </div>
          <p className="text-xs text-white/85">
            <b className="num-display text-gold-hi">{opProgress.lifts}</b> / {opTargetLifts} lift sessions banked
            this block — holding your numbers through a cut is the win.
          </p>
        </Card>
      )}

      {/* badges → challenge-coin shelf */}
      {(earned.length > 0 || nextMs) && (
        <div>
          <p className="eyebrow text-muted mb-2">Challenge coins</p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {earned.map((b) => (
              <CoinBadge
                key={b.key}
                emoji={b.emoji}
                label={b.label}
                earned
                tier={tierFor(b.key)}
                justEarned={!seenCoins.has(b.key)}
              />
            ))}
            {nextMs && (
              <CoinBadge
                emoji="🎯"
                label={`${nextMs} sessions`}
                earned={false}
                lockedText={`${nextMs - done} to go`}
              />
            )}
          </div>
        </div>
      )}

      {/* beginner progress — start → current working weight per LP lift */}
      {isBeginner && (
        <Card>
          <p className="eyebrow text-muted mb-3">Your lifts</p>
          <div className="space-y-2.5">
            {prog.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink text-[15px] min-w-0 truncate">{p.name}</span>
                <span className="text-sm text-right num-display shrink-0">
                  {p.start === p.current ? (
                    <b className="text-ink">{p.current} kg</b>
                  ) : (
                    <>
                      <span className="text-muted">{p.start} → </span>
                      <b className="text-load">{p.current} kg</b>
                    </>
                  )}
                  {p.delta > 0 && <span className="text-load font-semibold"> +{p.delta}</span>}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted text-center mt-3">
            {totalAdded > 0 ? (
              <>
                <b className="text-load">+{totalAdded} kg/DB</b> added across your lifts since you started. Slow and
                steady wins.
              </>
            ) : (
              'Add reps each session; once you hit 3×12, the weight goes up. This is where it shows.'
            )}
          </p>
        </Card>
      )}

      {/* strength chart */}
      {!isBeginner && chartData.length >= 2 && (
        <Card>
          <p className="eyebrow text-muted">Strength trend</p>
          <p className="text-xs text-muted mt-1 mb-3">best estimated 1RM to date · kg per dumbbell</p>
          <StrengthTrend labels={labels} series={series} />
          <div className="flex justify-center gap-4 mt-2">
            {OPERATOR_LIFTS.map((l, idx) => (
              <span key={l.short} className="flex items-center gap-1 text-xs text-muted">
                <svg width="16" height="6" aria-hidden="true">
                  <line
                    x1="0"
                    y1="3"
                    x2="16"
                    y2="3"
                    stroke={SERIES_COLORS[idx]}
                    strokeWidth="2.5"
                    strokeDasharray={SERIES_DASH[idx] || undefined}
                    strokeLinecap="round"
                  />
                </svg>
                {l.short}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted mt-3 text-center">
            {cutWeeks >= 2
              ? `You've held your lifts across ~${cutWeeks} weeks of cutting — that's the win. Any climb is a bonus.`
              : 'On a cut, holding your lifts is a win — any climb is a bonus.'}
          </p>
        </Card>
      )}

      {/* records */}
      {!isBeginner && records.some((r) => r.heaviest > 0) && (
        <Card>
          <p className="eyebrow text-muted mb-3">Personal records</p>
          <div className="space-y-2.5">
            {records
              .filter((r) => r.heaviest > 0)
              .map((r) => {
                const delta = Math.round((r.latestWeight - r.startWeight) * 10) / 10
                return (
                  <div key={r.short} className="flex items-center justify-between">
                    <span className="font-medium text-ink text-[15px]">{r.name}</span>
                    <span className="text-sm text-right">
                      <b className="num-display text-load">{r.heaviest} kg</b>
                      <span className="text-muted"> · ~{r.bestE1RM.toFixed(0)} 1RM</span>
                      {delta > 0 && <span className="text-load font-semibold"> · +{delta} since start</span>}
                    </span>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

      {/* running */}
      {runs.count > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Footprints size={18} className="text-accent-ink" />
            <p className="eyebrow text-muted">Running &amp; conditioning</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="num-display text-2xl text-accent-ink">{runs.count}</p>
              <p className="eyebrow text-muted mt-1">sessions</p>
            </div>
            <div>
              <p className="num-display text-2xl text-accent-ink">{runs.totalKm}</p>
              <p className="eyebrow text-muted mt-1">total km</p>
            </div>
            <div>
              <p className="num-display text-2xl text-accent-ink">{runs.totalMin}</p>
              <p className="eyebrow text-muted mt-1">total min</p>
            </div>
          </div>
          <p className="text-[11px] text-muted text-center mt-2">From Strava once connected.</p>
        </Card>
      )}

      {/* conditioning pace trend */}
      {paceData.length >= 2 && (
        <Card>
          <p className="eyebrow text-muted">Conditioning trend</p>
          <p className="text-xs text-muted mt-1 mb-3">avg pace · the line climbs as you get faster</p>
          <PaceTrend labels={paceData.map((p) => p.date)} values={paceData.map((p) => p.pace)} color="var(--color-accent)" />
        </Card>
      )}

      {/* session list */}
      <div className="space-y-2">
        {sessions.map((s) => {
          const setCount = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)
          const hasCardio = s.distanceKm != null || s.avgHr != null
          const hasDetail = !!(s.stravaId || hasCardio || s.feel || s.notes)
          const open = openId === s.id
          const pace = paceLabel(s.durationMin, s.distanceKm)
          const feelLabel = s.feel === 'easy' ? '😌 Easy' : s.feel === 'ok' ? '💪 Solid' : s.feel === 'hard' ? '🥵 Hard' : null
          return (
            <Card key={s.id} pad="sm">
              <div className="flex items-center gap-3">
                <SessionIcon type={s.type} size={20} />
                <button
                  type="button"
                  disabled={!hasDetail}
                  aria-expanded={hasDetail ? open : undefined}
                  onClick={() => setOpenId(open ? null : (s.id ?? null))}
                  className="flex-1 min-w-0 text-left disabled:cursor-default"
                >
                  <p className="font-semibold text-ink text-[15px] truncate">{s.title}</p>
                  <p className="text-xs text-muted">
                    {parseISO(s.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {SESSION_META[s.type].label}
                    {setCount > 0 && ` · ${setCount} sets`}
                    {s.durationMin ? ` · ${s.durationMin} min` : ''}
                    {hasDetail && <span className="text-brand-ink font-medium"> · {open ? 'less' : 'details'}</span>}
                  </p>
                </button>
                {s.done && <Check size={16} className="text-load shrink-0" />}
                <button
                  onClick={() => confirmDelete(s.id)}
                  className="w-11 h-11 -mr-1 grid place-items-center text-muted/80 active:text-danger shrink-0"
                  aria-label="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {open && hasDetail && (
                <div className="mt-3 pt-3 border-t border-line/60 space-y-3">
                  {hasCardio && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="num-display text-lg text-accent-ink">{s.distanceKm ?? '—'}</p>
                        <p className="eyebrow text-muted mt-0.5">km</p>
                      </div>
                      <div>
                        <p className="num-display text-lg text-accent-ink">{pace ?? '—'}</p>
                        <p className="eyebrow text-muted mt-0.5">avg pace</p>
                      </div>
                      <div>
                        <p className="num-display text-lg text-accent-ink">{s.avgHr ?? '—'}</p>
                        <p className="eyebrow text-muted mt-0.5">avg bpm</p>
                      </div>
                    </div>
                  )}
                  {(feelLabel || s.notes) && (
                    <div className="text-sm">
                      {feelLabel && <span className="font-semibold text-ink">{feelLabel}</span>}
                      {s.notes && <p className="text-muted mt-0.5 whitespace-pre-wrap">{s.notes}</p>}
                    </div>
                  )}
                  {s.stravaId && (
                    <a
                      href={`https://www.strava.com/activities/${s.stravaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-strava-ink active:opacity-70 min-h-[44px]"
                    >
                      View on Strava →
                    </a>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
