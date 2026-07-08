import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMaxes, useSettings, useSessions } from '../hooks'
import { maxesMap, OPERATOR_LIFTS, PHASES, resolvePosition, sessionFor } from '../program'
import { addDays, DAY_NAMES, isoDate, parseISO, today } from '../lib/date'
import { Card, Pill, SESSION_META } from '../components/ui'

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

  const [view, setView] = useState<'week' | 'block'>('week')
  const [week, setWeek] = useState(pos.week)
  // jump to the real current week when it resolves / changes
  useEffect(() => setWeek(pos.week), [pos.week])

  const doneDates = new Set(sessions.filter((s) => s.done).map((s) => s.date))
  const loggedDates = new Set(sessions.map((s) => s.date))
  const wavePct = (w: number) => (phase.wave ? phase.wave[(w - 1) % phase.wave.length].pct : null)
  const feelWord = (pct: number | null) =>
    pct == null ? '' : pct >= 90 ? 'heavy' : pct >= 80 ? 'building' : 'lighter'

  function loadsLine(plan: ReturnType<typeof sessionFor>): string | null {
    const parts = plan.exercises
      .filter((e) => e.loaded && e.sets[0]?.weight != null)
      .map((e) => {
        const short = OPERATOR_LIFTS.find((l) => l.name === e.name)?.short ?? e.name
        return `${short} ${e.sets[0].weight}`
      })
    return parts.length ? parts.join(' · ') + ' kg' : null
  }

  return (
    <div className="space-y-4">
      {/* toggle */}
      <div className="flex rounded-xl bg-canvas p-1 gap-1">
        {(['week', 'block'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
              view === v ? 'bg-brand text-white shadow-sm' : 'text-muted'
            }`}
          >
            {v} view
          </button>
        ))}
      </div>

      {view === 'week' ? (
        <>
          {/* week nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeek((w) => Math.max(1, w - 1))}
              disabled={week <= 1}
              className="p-2 rounded-lg text-brand disabled:opacity-30"
            >
              <ChevronLeft />
            </button>
            <div className="text-center">
              <p className="font-bold text-ink">
                {phase.name} · Week {week}
              </p>
              {wavePct(week) != null && (
                <p className="text-xs font-semibold text-load">
                  {feelWord(wavePct(week))} · {wavePct(week)}%
                </p>
              )}
            </div>
            <button
              onClick={() => setWeek((w) => Math.min(phase.lengthWeeks, w + 1))}
              disabled={week >= phase.lengthWeeks}
              className="p-2 rounded-lg text-brand disabled:opacity-30"
            >
              <ChevronRight />
            </button>
          </div>

          <Card className="divide-y divide-line/60">
            {DAY_NAMES.map((dn, day) => {
              const date = addDays(parseISO(settings.phaseStartDate), (week - 1) * 7 + day)
              const iso = isoDate(date)
              const plan = sessionFor(settings.currentPhaseId, week, day, mm, settings)
              const meta = SESSION_META[plan.type]
              const Icon = meta.icon
              const isToday = iso === todayIso
              const loads = loadsLine(plan)
              return (
                <button
                  key={day}
                  onClick={() => nav(`/session/${iso}`)}
                  className={`w-full flex items-center gap-3 p-3 text-left ${isToday ? 'bg-brand/5' : ''}`}
                >
                  <div className="w-9 text-center shrink-0">
                    <p className="text-[11px] text-muted font-semibold">{dn}</p>
                    <p className={`text-lg font-bold tnum ${isToday ? 'text-brand' : 'text-ink'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${meta.bg} ${meta.color}`}>
                    <Icon size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-[15px]">{plan.title}</p>
                    {plan.scheme && <p className="text-xs text-muted">{plan.scheme}</p>}
                    {loads && <p className="text-xs font-semibold text-load tnum mt-0.5">{loads}</p>}
                  </div>
                  {doneDates.has(iso) ? (
                    <span className="w-6 h-6 rounded-full bg-load text-white flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </span>
                  ) : isToday ? (
                    <Pill tone="brand">Today</Pill>
                  ) : null}
                </button>
              )
            })}
          </Card>
          <p className="text-center text-xs text-muted">Tap any day to view or log it.</p>
        </>
      ) : (
        <>
          <div className="px-1">
            <h2 className="font-bold text-ink">{phase.name}</h2>
            <p className="text-xs text-muted">{phase.lengthWeeks} weeks · the whole block at a glance</p>
          </div>
          <Card className="p-2">
            <div className="grid grid-cols-[2.4rem_repeat(7,1fr)] gap-1 mb-1">
              <span />
              {DAY_LETTERS.map((d, i) => (
                <span key={i} className="text-center text-[11px] font-semibold text-muted">
                  {d}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              {Array.from({ length: phase.lengthWeeks }, (_, wi) => {
                const w = wi + 1
                const weekStart = addDays(parseISO(settings.phaseStartDate), wi * 7)
                const pct = wavePct(w)
                return (
                  <div key={w} className="grid grid-cols-[2.4rem_repeat(7,1fr)] gap-1 items-stretch">
                    <button
                      onClick={() => {
                        setWeek(w)
                        setView('week')
                      }}
                      className="flex flex-col items-center justify-center"
                    >
                      <span className="text-[11px] font-bold text-brand">W{w}</span>
                      {pct != null && <span className="text-[9px] text-load font-semibold">{pct}%</span>}
                    </button>
                    {Array.from({ length: 7 }, (_, day) => {
                      const date = addDays(weekStart, day)
                      const iso = isoDate(date)
                      const plan = sessionFor(settings.currentPhaseId, w, day, mm, settings)
                      const meta = SESSION_META[plan.type]
                      const Icon = meta.icon
                      const isToday = iso === todayIso
                      return (
                        <button
                          key={day}
                          onClick={() => nav(`/session/${iso}`)}
                          className={`relative rounded-lg ${meta.bg} py-1.5 flex flex-col items-center gap-0.5 ${
                            isToday ? 'ring-2 ring-brand' : doneDates.has(iso) ? 'ring-1 ring-load/60' : ''
                          }`}
                        >
                          <span className={`text-[11px] font-semibold ${isToday ? 'text-brand' : 'text-ink/70'} tnum`}>
                            {date.getDate()}
                          </span>
                          <Icon size={15} className={meta.color} />
                          {doneDates.has(iso) ? (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-load text-white flex items-center justify-center">
                              <Check size={11} />
                            </span>
                          ) : loggedDates.has(iso) ? (
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
        </>
      )}
    </div>
  )
}
