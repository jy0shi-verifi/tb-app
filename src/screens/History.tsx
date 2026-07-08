import { useSessions } from '../hooks'
import { Card, EmptyState, SessionIcon, SESSION_META } from '../components/ui'
import { parseISO } from '../lib/date'

export default function History() {
  const sessions = useSessions()
  if (!sessions.length)
    return <EmptyState title="No sessions logged yet" sub="Finish a workout and it'll show up here." />

  return (
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
              </p>
            </div>
            {s.done && <span className="text-load text-sm font-semibold">✓</span>}
          </Card>
        )
      })}
    </div>
  )
}
