import { useMaxes, useSettings } from '../hooks'
import { maxesMap, PHASES, resolvePosition, sessionFor } from '../program'
import { addDays, DAY_NAMES, isoDate, parseISO, today } from '../lib/date'
import { Card, Pill, SESSION_META } from '../components/ui'

export default function Program() {
  const settings = useSettings()
  const maxes = useMaxes()
  const now = today()
  const pos = resolvePosition(settings, now)
  const phase = PHASES[pos.phaseId]
  const mm = maxesMap(maxes)

  const week = Math.min(Math.max(pos.week, 1), phase.lengthWeeks)
  const weekStart = addDays(parseISO(settings.phaseStartDate), (week - 1) * 7)
  const todayIso = isoDate(now)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-bold text-ink">
          {phase.name} · Week {week}
        </h2>
        <Pill tone="muted">
          Week {week} of {phase.lengthWeeks}
        </Pill>
      </div>

      <Card className="divide-y divide-line/60">
        {DAY_NAMES.map((dn, day) => {
          const date = addDays(weekStart, day)
          const plan = sessionFor(pos.phaseId, week, day, mm, settings)
          const meta = SESSION_META[plan.type]
          const Icon = meta.icon
          const isToday = isoDate(date) === todayIso
          return (
            <div key={day} className={`flex items-center gap-3 p-3 ${isToday ? 'bg-brand/5' : ''}`}>
              <div className="w-9 text-center">
                <p className="text-[11px] text-muted font-semibold">{dn}</p>
                <p className={`text-lg font-bold tnum ${isToday ? 'text-brand' : 'text-ink'}`}>
                  {date.getDate()}
                </p>
              </div>
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${meta.bg} ${meta.color}`}>
                <Icon size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-[15px]">{plan.title}</p>
                {plan.scheme && <p className="text-xs text-muted">{plan.scheme}</p>}
              </div>
              {isToday && <Pill tone="brand">Today</Pill>}
            </div>
          )
        })}
      </Card>

      <p className="text-center text-xs text-muted px-6">
        Tap-through calendar with per-day logging & the printable view arrive in the next update.
      </p>
    </div>
  )
}
