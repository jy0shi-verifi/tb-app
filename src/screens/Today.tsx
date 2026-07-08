import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ExternalLink, TrendingUp } from 'lucide-react'
import { useMaxes, useSettings, useSessionByDate } from '../hooks'
import { maxesMap, OPERATOR_LIFTS, PHASES, resolvePosition, sessionFor } from '../program'
import { isoDate, today, prettyDate, parseISO, diffDays, addDays, mondayIndex } from '../lib/date'
import { db, saveSettings } from '../db'
import { suggestBlockProgression, bumpedEntry } from '../lib/progression'
import { Button, Card, Pill, SessionIcon, SESSION_META } from '../components/ui'
import type { SessionLog } from '../types'

export default function Today() {
  const settings = useSettings()
  const maxes = useMaxes()
  const nav = useNavigate()
  const now = today()
  const iso = isoDate(now)
  const logged = useSessionByDate(iso)

  const pos = resolvePosition(settings, now)
  const phase = PHASES[pos.phaseId]

  if (pos.status === 'before') {
    const days = diffDays(parseISO(settings.phaseStartDate), now)
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">{phase.name} starts in</p>
          <p className="text-5xl font-bold text-brand my-2 tnum">{days}</p>
          <p className="text-sm text-muted">day{days === 1 ? '' : 's'} — {prettyDate(parseISO(settings.phaseStartDate))}</p>
          <p className="mt-4 text-sm text-ink">Lay your kit out the night before. The only job is to show up.</p>
        </Card>
      </div>
    )
  }

  if (pos.status === 'complete') {
    if (phase.id === 'base-building') {
      return (
        <Card className="p-6 text-center space-y-2">
          <p className="text-lg font-bold text-brand">Base Building complete 🎉</p>
          <p className="text-sm text-muted">
            Time for Test Day — head to Maxes to enter your tested lifts, then switch to Operator in
            Settings.
          </p>
          <Button onClick={() => nav('/maxes')} className="mt-2">
            Go to Maxes
          </Button>
        </Card>
      )
    }

    // Operator block complete → forced-progression suggestion
    const items = suggestBlockProgression(OPERATOR_LIFTS, maxesMap(maxes))
    const hasMaxes = items.some((i) => i.hasMax)

    async function startNextBlock() {
      for (const it of items) {
        if (!it.hasMax) continue
        const entry = maxes.find((m) => m.liftId === it.liftId)
        if (entry) await db.maxes.put(bumpedEntry(entry, it.step))
      }
      const monday = addDays(now, -mondayIndex(now))
      await saveSettings({ phaseStartDate: isoDate(monday) })
    }

    return (
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-load" />
            <p className="text-lg font-bold text-brand">Operator block done</p>
          </div>
          {hasMaxes ? (
            <>
              <p className="text-sm text-muted">
                Nice work. Forced progression — bump each lift and start a fresh 6-week block:
              </p>
              <div className="divide-y divide-line/60">
                {items.map((it) => (
                  <div key={it.liftId} className="flex items-center justify-between py-2">
                    <span className="font-medium text-ink text-[15px]">{it.name}</span>
                    {it.hasMax ? (
                      <span className="text-sm tnum">
                        <span className="text-muted">TM {it.currentTM.toFixed(1)}</span>
                        <span className="text-load font-bold"> → {it.nextTM.toFixed(1)} kg</span>
                        <span className="text-muted"> (+{it.step})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">no max set</span>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={startNextBlock}>
                Confirm &amp; start next block
              </Button>
              <button
                onClick={() => nav('/maxes')}
                className="w-full text-sm text-muted font-medium py-1"
              >
                Retest instead →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Enter your maxes to progress into the next block.</p>
              <Button className="w-full" onClick={() => nav('/maxes')}>
                Go to Maxes
              </Button>
            </>
          )}
        </Card>
      </div>
    )
  }

  const plan = sessionFor(pos.phaseId, pos.week, pos.day, maxesMap(maxes), settings)
  const meta = SESSION_META[plan.type]
  const isLoggable = plan.type === 'lift' || plan.type === 'se'
  const needsMaxes = plan.type === 'lift' && pos.phaseId === 'operator' && maxes.length === 0

  async function markDone() {
    const rec: SessionLog = {
      date: iso,
      phaseId: pos.phaseId,
      week: pos.week,
      day: pos.day,
      type: plan.type,
      title: plan.title,
      exercises: [],
      done: true,
      createdAt: Date.now(),
    }
    await db.sessions.put(logged?.id ? { ...rec, id: logged.id } : rec)
  }

  return (
    <div className="space-y-4">
      {/* context strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-muted">{prettyDate(now)}</span>
        <Pill tone="brand">
          {phase.name} · Wk {pos.week}/{phase.lengthWeeks}
        </Pill>
      </div>

      {/* main session card */}
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <SessionIcon type={plan.type} size={24} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ink">{plan.title}</h2>
              </div>
              {plan.scheme && <p className={`text-sm font-semibold ${meta.color}`}>{plan.scheme}</p>}
            </div>
            {logged?.done && <CheckCircle2 className="text-load" />}
          </div>

          {plan.detail && <p className="text-sm text-muted mt-3 leading-relaxed">{plan.detail}</p>}

          {/* exercise preview with loads */}
          {plan.exercises.length > 0 && (
            <div className="mt-4 divide-y divide-line/60">
              {plan.exercises.map((ex, i) => {
                const first = ex.sets[0]
                return (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-ink text-[15px]">{ex.name}</p>
                      {ex.note && <p className="text-xs text-muted">{ex.note}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted">
                        {ex.sets.length}×{first.reps}
                      </span>
                      {ex.loaded && (
                        <span className="ml-2 font-bold text-load tnum">
                          {first.weight != null ? `${first.weight} kg` : '—'}
                          {first.overCeiling && ' ⚠︎'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* action bar */}
        <div className="bg-canvas/70 px-5 py-4 border-t border-line/60">
          {needsMaxes ? (
            <Button variant="secondary" className="w-full" onClick={() => nav('/maxes')}>
              Enter your maxes first <ChevronRight className="inline -mt-0.5" size={18} />
            </Button>
          ) : isLoggable ? (
            <Button className="w-full text-lg py-4" onClick={() => nav(`/session/${iso}`)}>
              {logged?.exercises?.length ? 'Continue session' : 'Start session'}
            </Button>
          ) : plan.type === 'rest' ? (
            <p className="text-center text-sm text-muted">Nothing scheduled — enjoy the recovery.</p>
          ) : (
            <div className="flex gap-2">
              <Button
                variant={logged?.done ? 'secondary' : 'primary'}
                className="flex-1"
                onClick={markDone}
              >
                {logged?.done ? 'Done ✓' : 'Mark done'}
              </Button>
              {(plan.type === 'run' || plan.type === 'hic') && (
                <a
                  href="https://www.strava.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl px-4 py-3 font-semibold bg-orange-100 text-orange-700 flex items-center gap-1"
                >
                  Strava <ExternalLink size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-muted px-6">
        Show up in the morning. A bad session done beats a good one skipped.
      </p>
    </div>
  )
}
