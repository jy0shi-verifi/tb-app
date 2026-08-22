import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSettings, useSessions } from '../hooks'
import { PROTOCOLS, resolvePosition, sessionFor } from '../program'
import { addDays, DAY_NAMES, isoDate, parseISO, today } from '../lib/date'
import { Card, Pill, SegmentedPicker, SessionIcon, SESSION_META } from '../components/ui'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Program() {
  const settings = useSettings()
  const sessions = useSessions()
  const nav = useNavigate()

  const phase = PROTOCOLS[settings.currentPhaseId] ?? PROTOCOLS.beginner
  const now = today()
  const todayIso = isoDate(now)
  const pos = resolvePosition(settings, now)

  const [view, setView] = useState<'week' | 'block'>('week')
  const [week, setWeek] = useState(pos.week)
  // jump to the real current week when it resolves / changes
  useEffect(() => setWeek(pos.week), [pos.week])

  const doneDates = new Set(sessions.filter((s) => s.done).map((s) => s.date))
  const loggedDates = new Set(sessions.map((s) => s.date))
  // Beginner is open-ended (blockWeeks 999), so the block view shows a rolling
  // window around where you are rather than every week to the horizon. A real
  // MASS block is 3 weeks and shows in full.
  const blockWeeks = Math.min(phase.blockWeeks, Math.max(12, pos.week + 4))

  function loadsLine(plan: ReturnType<typeof sessionFor>): string | null {
    const parts = plan.exercises
      .filter((e) => e.loaded && e.sets[0]?.weight != null)
      .map((e) => `${e.name.replace(/^DB /, '')} ${e.sets[0].weight}`)
    return parts.length ? parts.join(' · ') + ' kg' : null
  }

  return (
    <div className="space-y-4 stagger">
      {/* week / block view toggle */}
      <SegmentedPicker
        label="View"
        value={view}
        onChange={setView}
        options={[
          { v: 'week', label: 'Week' },
          { v: 'block', label: 'Block' },
        ]}
      />

      {view === 'week' ? (
        <>
          {/* week nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeek((w) => Math.max(1, w - 1))}
              disabled={week <= 1}
              aria-label="Previous week"
              className="w-11 h-11 grid place-items-center rounded-field text-brand-ink disabled:opacity-30 active:scale-90 transition"
            >
              <ChevronLeft />
            </button>
            <div className="text-center">
              <p className="eyebrow text-muted">{phase.name}</p>
              <p className="num-display text-xl text-ink leading-tight">Week {week}</p>
            </div>
            <button
              onClick={() => setWeek((w) => Math.min(blockWeeks, w + 1))}
              disabled={week >= blockWeeks}
              aria-label="Next week"
              className="w-11 h-11 grid place-items-center rounded-field text-brand-ink disabled:opacity-30 active:scale-90 transition"
            >
              <ChevronRight />
            </button>
          </div>

          <Card pad="none" className="divide-y divide-line/60 overflow-hidden">
            {DAY_NAMES.map((dn, day) => {
              const date = addDays(parseISO(settings.phaseStartDate), (week - 1) * 7 + day)
              const iso = isoDate(date)
              const plan = sessionFor(settings.currentPhaseId, week, day, settings)
              const isToday = iso === todayIso
              const loads = loadsLine(plan)
              return (
                <button
                  key={day}
                  onClick={() => nav(`/session/${iso}`)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left transition active:bg-brand/5 ${isToday ? 'bg-brand/5' : ''}`}
                >
                  <div className="w-9 text-center shrink-0">
                    <p className="text-[11px] text-muted font-semibold">{dn}</p>
                    <p className={`num-display text-lg leading-tight ${isToday ? 'text-brand-ink' : 'text-ink'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                  <SessionIcon type={plan.type} size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-[15px]">{plan.title}</p>
                    {plan.scheme && <p className="text-xs text-muted">{plan.scheme}</p>}
                    {loads && <p className="num-display text-xs text-load mt-0.5">{loads}</p>}
                  </div>
                  {doneDates.has(iso) ? (
                    <span className="w-7 h-7 rounded-chip gold-gradient text-on-gold grid place-items-center shrink-0">
                      <Check size={15} />
                    </span>
                  ) : isToday ? (
                    <Pill tone="soft-brand">Today</Pill>
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
            <p className="eyebrow text-muted">{phase.name}</p>
            <p className="text-xs text-muted">{blockWeeks} weeks · your programme at a glance</p>
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
              {Array.from({ length: blockWeeks }, (_, wi) => {
                const w = wi + 1
                const weekStart = addDays(parseISO(settings.phaseStartDate), wi * 7)
                return (
                  <div key={w} className="grid grid-cols-[2.4rem_repeat(7,1fr)] gap-1 items-stretch">
                    <button
                      onClick={() => {
                        setWeek(w)
                        setView('week')
                      }}
                      className="flex flex-col items-center justify-center active:scale-90 transition"
                    >
                      <span className="num-display text-[13px] text-brand-ink leading-none">W{w}</span>
                    </button>
                    {Array.from({ length: 7 }, (_, day) => {
                      const date = addDays(weekStart, day)
                      const iso = isoDate(date)
                      const plan = sessionFor(settings.currentPhaseId, w, day, settings)
                      const meta = SESSION_META[plan.type]
                      const Icon = meta.icon
                      const isToday = iso === todayIso
                      return (
                        <button
                          key={day}
                          onClick={() => nav(`/session/${iso}`)}
                          aria-label={`Day ${date.getDate()}, ${meta.label}${doneDates.has(iso) ? ', done' : loggedDates.has(iso) ? ', logged not done' : ''}`}
                          className={`relative rounded-field ${meta.bg} py-1.5 flex flex-col items-center gap-0.5 transition ${
                            isToday ? 'ring-2 ring-brand' : doneDates.has(iso) ? 'ring-2 ring-load/60' : ''
                          }`}
                        >
                          <span className={`num-display text-[12px] leading-none ${isToday ? 'text-brand-ink' : 'text-ink/70'}`}>
                            {date.getDate()}
                          </span>
                          <Icon size={15} className={meta.color} />
                          {doneDates.has(iso) ? (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gold-gradient text-on-gold flex items-center justify-center">
                              <Check size={11} />
                            </span>
                          ) : loggedDates.has(iso) ? (
                            <span
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-accent bg-surface"
                              aria-hidden="true"
                            />
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
