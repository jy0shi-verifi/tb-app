import { useNavigate } from 'react-router-dom'
import { useMaxes, useSettings, useSessions } from '../hooks'
import { maxesMap, PHASES, resolvePosition, sessionFor } from '../program'
import { addDays, isoDate, parseISO, today } from '../lib/date'
import { Card, SESSION_META } from '../components/ui'
import { Check } from 'lucide-react'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Program() {
  const settings = useSettings()
  const maxes = useMaxes()
  const sessions = useSessions()
  const nav = useNavigate()

  const phase = PHASES[settings.currentPhaseId]
  const mm = maxesMap(maxes)
  const now = today()
  const todayIso = isoDate(now)
  const pos = resolvePosition(settings, now)

  const doneDates = new Set(sessions.filter((s) => s.done).map((s) => s.date))
  const loggedDates = new Set(sessions.map((s) => s.date))

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="font-bold text-ink">{phase.name}</h2>
        <p className="text-xs text-muted">
          {phase.lengthWeeks} weeks · tap any day to view or log it
        </p>
      </div>

      <Card className="p-2">
        {/* header */}
        <div className="grid grid-cols-[1.6rem_repeat(7,1fr)] gap-1 mb-1">
          <span />
          {DAY_LETTERS.map((d, i) => (
            <span key={i} className="text-center text-[11px] font-semibold text-muted">
              {d}
            </span>
          ))}
        </div>

        {/* weeks */}
        <div className="space-y-1">
          {Array.from({ length: phase.lengthWeeks }, (_, wi) => {
            const week = wi + 1
            const weekStart = addDays(parseISO(settings.phaseStartDate), wi * 7)
            return (
              <div key={week} className="grid grid-cols-[1.6rem_repeat(7,1fr)] gap-1 items-stretch">
                <span className="flex items-center justify-center text-[11px] font-bold text-brand">
                  {week}
                </span>
                {Array.from({ length: 7 }, (_, day) => {
                  const date = addDays(weekStart, day)
                  const iso = isoDate(date)
                  const plan = sessionFor(settings.currentPhaseId, week, day, mm, settings)
                  const meta = SESSION_META[plan.type]
                  const Icon = meta.icon
                  const isToday = iso === todayIso
                  const done = doneDates.has(iso)
                  const logged = loggedDates.has(iso)
                  return (
                    <button
                      key={day}
                      onClick={() => nav(`/session/${iso}`)}
                      className={`relative rounded-lg ${meta.bg} py-1.5 flex flex-col items-center gap-0.5 ${
                        isToday ? 'ring-2 ring-brand' : ''
                      }`}
                    >
                      <span className={`text-[11px] font-semibold ${isToday ? 'text-brand' : 'text-ink/70'} tnum`}>
                        {date.getDate()}
                      </span>
                      <Icon size={15} className={meta.color} />
                      {done ? (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-load text-white flex items-center justify-center">
                          <Check size={11} />
                        </span>
                      ) : logged ? (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Card>

      {/* legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted">
        {(['lift', 'se', 'run', 'hic', 'rest'] as const).map((t) => {
          const m = SESSION_META[t]
          const Icon = m.icon
          return (
            <span key={t} className="flex items-center gap-1">
              <Icon size={13} className={m.color} /> {m.label}
            </span>
          )
        })}
      </div>

      {pos.status === 'before' && (
        <p className="text-center text-xs text-muted px-6">
          Phase starts {parseISO(settings.phaseStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
        </p>
      )}
    </div>
  )
}
