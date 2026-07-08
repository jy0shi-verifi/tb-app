import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Flame, Footprints, Trash2 } from 'lucide-react'
import { useSessions } from '../hooks'
import { OPERATOR_LIFTS } from '../program'
import { estimate1RM } from '../lib/calc'
import { badges, computeStreak, liftRecords, runStats, weekSummary } from '../lib/stats'
import { deleteSession } from '../db'
import { Card, EmptyState, SessionIcon, SESSION_META } from '../components/ui'
import { parseISO } from '../lib/date'

const LIFT_COLORS: Record<string, string> = {
  Bench: '#2c5578',
  Squat: '#2e7d5b',
  Row: '#c2831f',
}

async function confirmDelete(id?: number) {
  if (id == null) return
  if (window.confirm('Delete this logged session?')) await deleteSession(id)
}

export default function History() {
  const sessions = useSessions()

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

  if (!sessions.length)
    return <EmptyState title="No sessions logged yet" sub="Finish a workout and it'll show up here." />

  const streak = computeStreak(sessions)
  const summary = weekSummary(sessions)
  const week = summary.lifts + summary.runs
  const done = sessions.filter((s) => s.done).length
  const earned = badges(sessions)
  const runs = runStats(sessions)
  const records = liftRecords(sessions, OPERATOR_LIFTS)

  return (
    <div className="space-y-4">
      {/* headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={18} className={streak > 0 ? 'text-orange-500' : 'text-muted'} />
            <p className="text-2xl font-extrabold text-ink tnum">{streak}</p>
          </div>
          <p className="text-[11px] text-muted">streak</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-load tnum">{week}</p>
          <p className="text-[11px] text-muted">this week</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-brand tnum">{done}</p>
          <p className="text-[11px] text-muted">total done</p>
        </Card>
      </div>

      {/* this week */}
      <Card className="p-4">
        <p className="font-bold text-ink mb-2">This week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-extrabold text-brand tnum">{summary.lifts}</p>
            <p className="text-[11px] text-muted">lifts</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-accent tnum">{summary.runs}</p>
            <p className="text-[11px] text-muted">runs</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-load tnum">{summary.volume.toLocaleString()}</p>
            <p className="text-[11px] text-muted">kg volume</p>
          </div>
        </div>
      </Card>

      {/* badges */}
      {earned.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {earned.map((b) => (
            <div
              key={b.key}
              className="shrink-0 rounded-full bg-surface border border-line px-3 py-1.5 flex items-center gap-1.5 text-sm"
            >
              <span>{b.emoji}</span>
              <span className="font-medium text-ink">{b.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* strength chart */}
      {chartData.length >= 2 && (
        <Card className="p-4">
          <p className="font-bold text-ink mb-1">Strength trend</p>
          <p className="text-xs text-muted mb-3">best estimated 1RM to date · kg per dumbbell</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,138,150,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7784' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7784' }} width={40} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              {OPERATOR_LIFTS.map((l) => (
                <Line
                  key={l.short}
                  type="monotone"
                  dataKey={l.short}
                  stroke={LIFT_COLORS[l.short]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {OPERATOR_LIFTS.map((l) => (
              <span key={l.short} className="flex items-center gap-1 text-xs text-muted">
                <span className="inline-block w-3 h-1.5 rounded-full" style={{ background: LIFT_COLORS[l.short] }} />
                {l.short}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted mt-3 text-center">
            On a cut, holding your lifts is a win — any climb is a bonus.
          </p>
        </Card>
      )}

      {/* records */}
      {records.some((r) => r.heaviest > 0) && (
        <Card className="p-4">
          <p className="font-bold text-ink mb-3">Personal records</p>
          <div className="space-y-2.5">
            {records
              .filter((r) => r.heaviest > 0)
              .map((r) => {
                const delta = Math.round((r.latestWeight - r.startWeight) * 10) / 10
                return (
                  <div key={r.short} className="flex items-center justify-between">
                    <span className="font-medium text-ink text-[15px]">{r.name}</span>
                    <span className="text-sm tnum text-right">
                      <b className="text-load">{r.heaviest} kg</b>
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
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Footprints size={18} className="text-accent" />
            <p className="font-bold text-ink">Running &amp; conditioning</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-extrabold text-accent tnum">{runs.count}</p>
              <p className="text-[11px] text-muted">sessions</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-accent tnum">{runs.totalKm}</p>
              <p className="text-[11px] text-muted">total km</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-accent tnum">{runs.totalMin}</p>
              <p className="text-[11px] text-muted">total min</p>
            </div>
          </div>
          <p className="text-[11px] text-muted text-center mt-2">From Strava once connected.</p>
        </Card>
      )}

      {/* session list */}
      <div className="space-y-2">
        {sessions.map((s) => {
          const setCount = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)
          return (
            <Card key={s.id} className="p-3 flex items-center gap-3">
              <SessionIcon type={s.type} size={20} />
              <div className="flex-1 min-w-0">
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
                </p>
              </div>
              {s.done && <span className="text-load text-sm font-semibold">✓</span>}
              <button
                onClick={() => confirmDelete(s.id)}
                className="p-2 -mr-1 text-muted/50 active:text-red-600"
                aria-label="Delete session"
              >
                <Trash2 size={15} />
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
