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
import { useSessions } from '../hooks'
import { OPERATOR_LIFTS } from '../program'
import { estimate1RM } from '../lib/calc'
import { Card, EmptyState, SessionIcon, SESSION_META } from '../components/ui'
import { parseISO } from '../lib/date'

const LIFT_COLORS: Record<string, string> = {
  Bench: '#2c5578',
  Squat: '#2e7d5b',
  Row: '#c2831f',
}

export default function History() {
  const sessions = useSessions()

  const chartData = useMemo(() => {
    const rows: Record<string, number | string>[] = []
    const lifts = sessions
      .filter((s) => s.type === 'lift')
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
    for (const s of lifts) {
      const row: Record<string, number | string> = {
        date: parseISO(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      }
      for (const l of OPERATOR_LIFTS) {
        const ex = s.exercises.find((e) => e.name === l.name)
        if (!ex) continue
        const best = Math.max(
          0,
          ...ex.sets.filter((x) => x.weight && x.reps > 0).map((x) => estimate1RM(x.weight!, x.reps)),
        )
        if (best > 0) row[l.short] = Math.round(best * 10) / 10
      }
      if (Object.keys(row).length > 1) rows.push(row)
    }
    return rows
  }, [sessions])

  const doneCount = sessions.filter((s) => s.done).length

  if (!sessions.length)
    return <EmptyState title="No sessions logged yet" sub="Finish a workout and it'll show up here." />

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-brand tnum">{sessions.length}</p>
          <p className="text-xs text-muted">sessions logged</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-load tnum">{doneCount}</p>
          <p className="text-xs text-muted">completed</p>
        </Card>
      </div>

      {/* lift progress chart */}
      {chartData.length >= 2 && (
        <Card className="p-4">
          <p className="font-bold text-ink mb-1">Estimated 1RM trend</p>
          <p className="text-xs text-muted mb-3">kg per dumbbell, from your logged top sets</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
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
                <span
                  className="inline-block w-3 h-1.5 rounded-full"
                  style={{ background: LIFT_COLORS[l.short] }}
                />
                {l.short}
              </span>
            ))}
          </div>
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
            </Card>
          )
        })}
      </div>
    </div>
  )
}
