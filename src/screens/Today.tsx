import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ExternalLink, TrendingUp, AlertTriangle, X, Flame } from 'lucide-react'
import { useMaxes, useSettings, useSessions, useSessionByDate } from '../hooks'
import { maxesMap, OPERATOR_LIFTS, PHASES, resolvePosition, sessionFor } from '../program'
import { isoDate, today, prettyDate, parseISO, diffDays, addDays, mondayIndex, nextMonday } from '../lib/date'
import { db, saveSettings, clearProgression } from '../db'
import { suggestBlockProgression, bumpedEntry, blockCompleted } from '../lib/progression'
import { computeStreak, sessionsThisWeek } from '../lib/stats'
import { Button, Card, Pill, SessionIcon, SESSION_META } from '../components/ui'
import type { SessionLog } from '../types'

export default function Today() {
  const settings = useSettings()
  const maxes = useMaxes()
  const sessions = useSessions()
  const nav = useNavigate()
  const now = today()
  const iso = isoDate(now)
  const logged = useSessionByDate(iso)
  const [dismissedDate, setDismissedDate] = useState<string | null>(() =>
    localStorage.getItem('tb-dismiss-missed'),
  )

  const pos = resolvePosition(settings, now)
  const phase = PHASES[pos.phaseId]
  const mm = maxesMap(maxes)

  // ---- before the phase starts ----
  if (pos.status === 'before') {
    const days = diffDays(parseISO(settings.phaseStartDate), now)
    const isBB = phase.id === 'base-building'
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">{phase.name} starts in</p>
          <p className="text-6xl font-extrabold text-brand my-2 tnum">{days}</p>
          <p className="text-sm text-muted">
            day{days === 1 ? '' : 's'} — {prettyDate(parseISO(settings.phaseStartDate))}
          </p>
        </Card>

        {isBB && (
          <Card className="p-4">
            <p className="font-semibold text-ink mb-2">Your first week</p>
            <ul className="text-sm text-muted space-y-1.5">
              <li>🏃 3 easy runs (Mon · Wed · Fri) — jog/walk ~30 min, flat</li>
              <li>🔁 2 light circuits (Tue · Thu)</li>
              <li>😴 Rest Sunday</li>
            </ul>
          </Card>
        )}

        <Card className="p-4">
          <p className="font-semibold text-ink mb-2">Before you start</p>
          <ul className="text-sm text-muted space-y-1.5">
            <li>• Sort your dumbbells &amp; bench</li>
            <li>• Pick your flat run route</li>
            <li>• Lay your kit out the night before</li>
          </ul>
        </Card>
      </div>
    )
  }

  // ---- phase / block complete ----
  if (pos.status === 'complete') {
    if (phase.id === 'base-building') {
      async function startOperator() {
        await saveSettings({ currentPhaseId: 'operator', phaseStartDate: nextMonday() })
      }
      return (
        <Card className="p-6 text-center space-y-3">
          <p className="text-2xl">🎉</p>
          <p className="text-lg font-bold text-brand">Base Building done</p>
          <p className="text-sm text-muted">
            Eight weeks in the bank and your engine's rebuilt. Do your Test Day, pop the numbers into
            Maxes, then kick off Operator — it'll work out every weight for you.
          </p>
          <Button onClick={() => nav('/maxes')} className="w-full">
            Enter my Test Day maxes
          </Button>
          <button onClick={startOperator} className="w-full text-sm text-brand font-semibold py-1">
            Start Operator (next Monday) →
          </button>
        </Card>
      )
    }

    // Operator block complete
    const completed = blockCompleted(sessions, settings.phaseStartDate, phase.lengthWeeks)
    const items = suggestBlockProgression(OPERATOR_LIFTS, mm)
    const hasMaxes = items.some((i) => i.hasMax)
    const thisMonday = isoDate(addDays(now, -mondayIndex(now)))
    const blockEndIso = isoDate(addDays(parseISO(settings.phaseStartDate), phase.lengthWeeks * 7 - 1))
    const blockCount = sessions.filter(
      (s) => s.done && s.date >= settings.phaseStartDate && s.date <= blockEndIso,
    ).length

    async function startNextBlock() {
      for (const it of items) {
        if (!it.hasMax) continue
        const entry = maxes.find((m) => m.liftId === it.liftId)
        if (entry) await db.maxes.put(bumpedEntry(entry, it.step))
      }
      await saveSettings({ phaseStartDate: thisMonday })
    }
    async function repeatBlock() {
      await saveSettings({ phaseStartDate: thisMonday })
    }
    async function retest() {
      if (
        !window.confirm(
          'Retest resets your progressed maxes back to your test numbers — you’ll re-enter fresh. Continue?',
        )
      )
        return
      await clearProgression()
      nav('/maxes')
    }

    return (
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-load" />
            <p className="text-lg font-bold text-brand">Operator block done</p>
          </div>
          <p className="text-sm text-ink">
            {completed ? '🎉 ' : ''}
            {phase.lengthWeeks} weeks · <b className="text-load tnum">{blockCount}</b> sessions logged.
          </p>

          {!hasMaxes ? (
            <>
              <p className="text-sm text-muted">Enter your maxes to progress into the next block.</p>
              <Button className="w-full" onClick={() => nav('/maxes')}>
                Go to Maxes
              </Button>
            </>
          ) : completed ? (
            <>
              <p className="text-sm text-muted">
                You finished every heavy week — you've earned the bump. New weights for your next
                6-week block:
              </p>
              <div className="divide-y divide-line/60">
                {items.map((it) => (
                  <div key={it.liftId} className="flex items-center justify-between py-2">
                    <span className="font-medium text-ink text-[15px]">{it.name}</span>
                    <span className="text-sm tnum">
                      <span className="text-muted">TM {it.currentTM.toFixed(1)}</span>
                      <span className="text-load font-bold"> → {it.nextTM.toFixed(1)} kg</span>
                      <span className="text-muted"> (+{it.step})</span>
                    </span>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={startNextBlock}>
                Confirm &amp; start next block
              </Button>
              <button onClick={retest} className="w-full text-sm text-muted font-medium py-1">
                Retest instead →
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-warm p-3 text-sm text-ink">
                Looks like you didn't finish the heavy weeks of this block. No drama — <b>don't add
                weight yet.</b> Run it back at the same loads and nail it this time.
              </div>
              <Button className="w-full" onClick={repeatBlock}>
                Repeat this block (same weights)
              </Button>
              <button onClick={retest} className="w-full text-sm text-muted font-medium py-1">
                Retest my maxes instead →
              </button>
            </>
          )}
        </Card>
      </div>
    )
  }

  // ---- an active training day ----
  const plan = sessionFor(pos.phaseId, pos.week, pos.day, mm, settings)
  const meta = SESSION_META[plan.type]
  const isLoggable = plan.type === 'lift' || plan.type === 'se'
  const isTestDay = plan.title === 'Test Day'
  const needsMaxes = plan.type === 'lift' && pos.phaseId === 'operator' && maxes.length === 0
  const anyCeiling = plan.exercises.some((e) => e.sets[0]?.overCeiling)
  const anyFloor = plan.exercises.some((e) => e.sets[0]?.underFloor)
  const streak = computeStreak(sessions)
  const weekCount = sessionsThisWeek(sessions)

  // intensity / feel of the current week
  const wavePct = phase.wave ? phase.wave[(pos.week - 1) % phase.wave.length].pct : null
  const weekFeel =
    wavePct == null ? null : wavePct >= 90 ? 'heavy — earn it' : wavePct >= 80 ? 'building' : 'lighter — move it well'

  // missed-session catch-up: most recent unlogged lift/SE day in the last week
  const loggedDates = new Set(sessions.map((s) => s.date))
  let missed: { date: string; title: string } | null = null
  for (let back = 1; back <= 7 && !missed; back++) {
    const d = addDays(now, -back)
    const p = resolvePosition(settings, d)
    if (p.status !== 'active') continue
    const pl = sessionFor(p.phaseId, p.week, p.day, mm, settings)
    if ((pl.type === 'lift' || pl.type === 'se') && !loggedDates.has(isoDate(d))) {
      missed = { date: isoDate(d), title: pl.title }
    }
  }

  // lapse: been away a while → don't silently advance into heavier weeks
  // (ignore auto-completed rest days so they can't mask a real training lapse)
  const lastDoneSession = sessions.find((s) => s.done && s.type !== 'rest')
  const lapsedDays = lastDoneSession ? diffDays(now, parseISO(lastDoneSession.date)) : 0
  const lapsed = lastDoneSession != null && lapsedDays > 10
  async function realign() {
    const lastWk = lastDoneSession?.week ?? 1
    const thisMon = addDays(now, -mondayIndex(now))
    await saveSettings({ phaseStartDate: isoDate(addDays(thisMon, -(lastWk - 1) * 7)) })
  }

  // tomorrow's session (for rest-day peek)
  const tmr = addDays(now, 1)
  const tmrPos = resolvePosition(settings, tmr)
  const tmrPlan =
    tmrPos.status === 'active' ? sessionFor(tmrPos.phaseId, tmrPos.week, tmrPos.day, mm, settings) : null

  async function markDone() {
    if (logged?.id && logged.done) {
      await db.sessions.delete(logged.id)
      return
    }
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
      {/* streak strip */}
      <div className="flex items-center gap-3">
        <Card className="flex-1 p-3 flex items-center gap-2">
          <Flame size={22} className={streak > 0 ? 'text-orange-500' : 'text-muted'} />
          <div>
            <p className="text-xl font-extrabold text-ink tnum leading-none">{streak}</p>
            <p className="text-[11px] text-muted">session streak</p>
          </div>
        </Card>
        <Card className="flex-1 p-3 flex items-center gap-2">
          <CheckCircle2 size={22} className="text-load" />
          <div>
            <p className="text-xl font-extrabold text-ink tnum leading-none">{weekCount}</p>
            <p className="text-[11px] text-muted">done this week</p>
          </div>
        </Card>
      </div>

      {/* context strip + block progress */}
      <div className="px-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{prettyDate(now)}</span>
          <Pill tone="brand">
            {phase.name} · Wk {pos.week}/{phase.lengthWeeks}
          </Pill>
        </div>
        <div className="h-1.5 rounded-full bg-line/50 overflow-hidden mt-2">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${(pos.week / phase.lengthWeeks) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted mt-1">
          {phase.lengthWeeks - pos.week > 0
            ? `${phase.lengthWeeks - pos.week} week${phase.lengthWeeks - pos.week === 1 ? '' : 's'} to ${pos.phaseId === 'operator' ? 'the next bump' : 'Test Day'}`
            : pos.phaseId === 'operator'
              ? 'Final week — earn the bump'
              : 'Final week — Test Day'}
        </p>
      </div>

      {/* lapse (welcome back) takes priority over a single missed nudge */}
      {lapsed ? (
        <Card className="p-3 border-warm-edge/40 bg-warm">
          <p className="font-semibold text-ink text-sm">Welcome back 👋</p>
          <p className="text-xs text-muted mt-0.5">
            It's been {lapsedDays} days — don't jump ahead into heavier weeks. Pick up where you left
            off and ease back in.
          </p>
          <button onClick={realign} className="text-brand font-semibold text-sm mt-1">
            Resume from week {lastDoneSession?.week} →
          </button>
        </Card>
      ) : missed && dismissedDate !== missed.date ? (
        <Card className="p-3 flex items-center gap-3 border-warm-edge/40 bg-warm">
          <AlertTriangle size={20} className="text-warm-edge shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-ink">Missed {missed.title}</p>
            <button onClick={() => nav(`/session/${missed!.date}`)} className="text-brand font-semibold">
              Log it now →
            </button>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('tb-dismiss-missed', missed!.date)
              setDismissedDate(missed!.date)
            }}
            aria-label="Dismiss"
            className="text-muted p-1"
          >
            <X size={16} />
          </button>
        </Card>
      ) : null}

      {/* main session card */}
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <SessionIcon type={plan.type} size={24} />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink">{plan.title}</h2>
              {plan.scheme && <p className={`text-sm font-semibold ${meta.color}`}>{plan.scheme}</p>}
              {wavePct != null && (
                <p className="text-xs text-muted">
                  Week {pos.week} · {wavePct}% · {weekFeel}
                </p>
              )}
            </div>
            {logged?.done && <CheckCircle2 className="text-load" />}
          </div>

          {plan.detail && <p className="text-sm text-muted mt-3 leading-relaxed">{plan.detail}</p>}

          {plan.exercises.length > 0 && (
            <div className="mt-4 divide-y divide-line/60">
              {plan.exercises.map((ex, i) => {
                const first = ex.sets[0]
                return (
                  <div key={i} className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink text-[15px]">{ex.name}</p>
                      {ex.note && <p className="text-xs text-muted">{ex.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted block">
                        {ex.sets.length}×{first.reps}
                      </span>
                      {ex.loaded && first.weight != null && (
                        <span className="font-extrabold text-load text-xl tnum leading-none">
                          {first.weight}
                          <span className="text-xs font-semibold text-muted"> kg</span>
                          {first.overCeiling && <span className="text-warm-edge"> ⚠︎</span>}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {anyCeiling && (
            <p className="text-xs text-warm-edge mt-2">
              ⚠︎ Past your 60 kg dumbbell — hold here and add reps.
            </p>
          )}
          {anyFloor && (
            <p className="text-xs text-muted mt-2">
              Rounds below your lightest load — just do it clean and controlled.
            </p>
          )}
        </div>

        {/* action bar */}
        <div className="bg-canvas/70 px-5 py-4 border-t border-line/60">
          {isTestDay ? (
            <Button variant="secondary" className="w-full" onClick={() => nav('/maxes')}>
              Enter your results in Maxes <ChevronRight className="inline -mt-0.5" size={18} />
            </Button>
          ) : needsMaxes ? (
            <Button variant="secondary" className="w-full" onClick={() => nav('/maxes')}>
              Enter your maxes first <ChevronRight className="inline -mt-0.5" size={18} />
            </Button>
          ) : isLoggable ? (
            <>
              <Button className="w-full text-lg py-4" onClick={() => nav(`/session/${iso}`)}>
                {logged?.exercises?.length ? 'Continue session' : 'Start session'}
              </Button>
              {!logged?.done && (
                <p className="text-center text-[11px] text-muted mt-2">
                  Can't face it? Just do the first set — showing up beats skipping.
                </p>
              )}
            </>
          ) : plan.type === 'rest' ? (
            <div className="text-center">
              <p className="text-sm text-muted">Rest day — recovery is training too.</p>
              {tmrPlan && (
                <p className="text-xs text-muted mt-1">
                  Tomorrow: <span className="font-semibold text-ink">{tmrPlan.title}</span>
                </p>
              )}
            </div>
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
                  className="rounded-xl px-4 py-3 font-semibold bg-orange-500/15 text-orange-500 flex items-center gap-1"
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
