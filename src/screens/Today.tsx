import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ExternalLink, AlertTriangle, X, Flame } from 'lucide-react'
import { useSettings, useSessions, useSessionByDate } from '../hooks'
import { PROTOCOLS, resolvePosition, sessionFor } from '../program'
import { isoDate, today, prettyDate, parseISO, diffDays, addDays, mondayIndex } from '../lib/date'
import { db, saveSettings } from '../db'
import { beginStravaAuth } from '../lib/strava'
import { shouldNudgeBackup, downloadBackup } from '../lib/backup'
import { computeStreak, longestStreak, sessionsThisWeek } from '../lib/stats'
import { Button, Card, Pill, SessionIcon, SESSION_META } from '../components/ui'
import type { SessionLog } from '../types'

export default function Today() {
  const settings = useSettings()
  const sessions = useSessions()
  const nav = useNavigate()
  const now = today()
  const iso = isoDate(now)
  const logged = useSessionByDate(iso)
  const [dismissedDate, setDismissedDate] = useState<string | null>(() =>
    localStorage.getItem('tb-dismiss-missed'),
  )

  // undefined until IndexedDB loads — avoids a flash of the wrong phase on DEFAULT_SETTINGS
  const settingsLoading = useLiveQuery(() => db.settings.get('app'), []) === undefined
  if (settingsLoading)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-40 rounded-card" />
      </div>
    )

  const pos = resolvePosition(settings, now)
  const phase = PROTOCOLS[pos.phaseId]

  // lapse detection (hoisted so it can guard the phase-complete branch too):
  // been away a while → don't silently advance into heavier weeks, and never
  // roll a mid-phase lay-off past the finish line onto a "you're done" screen.
  // (ignore auto-completed rest days so they can't mask a real training lapse)
  const lastDoneSession = sessions.find((s) => s.done && s.type !== 'rest')
  const lapsedDays = lastDoneSession ? diffDays(now, parseISO(lastDoneSession.date)) : 0
  const lapsed = lastDoneSession != null && lapsedDays > 10
  async function realign() {
    const lastWk = lastDoneSession?.week ?? 1
    const thisMon = addDays(now, -mondayIndex(now))
    await saveSettings({ phaseStartDate: isoDate(addDays(thisMon, -(lastWk - 1) * 7)) })
  }

  // ---- before the phase starts ----
  if (pos.status === 'before') {
    const days = diffDays(parseISO(settings.phaseStartDate), now)
    return (
      <div className="space-y-4 stagger">
        <Card elev="hero" pad="lg" className="topo-hero text-white text-center relative overflow-hidden border-white/10">
          <p className="eyebrow hero-text text-gold-hi">{phase.name} starts in</p>
          <p className="num-display text-7xl my-1 hero-text">{days}</p>
          <p className="text-sm text-white/85">
            day{days === 1 ? '' : 's'} — {prettyDate(parseISO(settings.phaseStartDate))}
          </p>
        </Card>

        <Card>
          <p className="eyebrow text-muted mb-2">Your first week</p>
          <ul className="text-sm text-ink/90 space-y-1.5">
            <li>💪 3 strength days (Mon · Wed · Fri) — A/B, 3 × 8–12</li>
            <li>🏃 3 runs (Tue · Thu · Sat) — your Runna plan</li>
            <li>😴 Rest Sunday</li>
          </ul>
        </Card>

        <Card>
          <p className="eyebrow text-muted mb-2">Before you start</p>
          <ul className="text-sm text-ink/90 space-y-1.5">
            <li>• Sort your dumbbells &amp; bench</li>
            <li>• Pick your flat run route</li>
            <li>• Lay your kit out the night before</li>
          </ul>
        </Card>
      </div>
    )
  }

  // ---- phase complete ----
  // Beginner is open-ended (999 weeks), so this only fires if the calendar ran
  // far past a lay-off. Offer to pick up where he left off rather than stranding
  // him on a finished-phase screen.
  if (pos.status === 'complete') {
    return (
      <Card className="space-y-2 border-warm-edge/40 bg-warm">
        <p className="font-bold text-ink">Welcome back 👋</p>
        <p className="text-sm text-muted">
          {lastDoneSession
            ? `It's been ${lapsedDays} days and the calendar ran on without you — you were on week ${lastDoneSession.week}.`
            : 'The calendar has run past your programme.'}{' '}
          Pick up where you left off.
        </p>
        <button onClick={realign} className="text-brand-ink font-bold text-sm min-h-[44px] inline-flex items-center">
          Resume from week {lastDoneSession?.week ?? 1} →
        </button>
      </Card>
    )
  }

  // ---- an active training day ----
  const plan = sessionFor(pos.phaseId, pos.week, pos.day, settings)
  const meta = SESSION_META[plan.type]
  // lifts open the session logger; runs (Runna-owned) mark-complete on Today
  const isLoggable = plan.type === 'lift' || plan.type === 'se' || (plan.intervals?.length ?? 0) > 0
  const streak = computeStreak(sessions)
  const bestStreak = longestStreak(sessions)
  const weekCount = sessionsThisWeek(sessions)

  // missed-session catch-up: most recent unlogged lift/SE day in the last week
  const loggedDates = new Set(sessions.map((s) => s.date))
  let missed: { date: string; title: string } | null = null
  for (let back = 1; back <= 7 && !missed; back++) {
    const d = addDays(now, -back)
    const p = resolvePosition(settings, d)
    if (p.status !== 'active') continue
    const pl = sessionFor(p.phaseId, p.week, p.day, settings)
    if ((pl.type === 'lift' || pl.type === 'se') && !loggedDates.has(isoDate(d))) {
      missed = { date: isoDate(d), title: pl.title }
    }
  }

  // tomorrow's session (for rest-day peek)
  const tmr = addDays(now, 1)
  const tmrPos = resolvePosition(settings, tmr)
  const tmrPlan =
    tmrPos.status === 'active' ? sessionFor(tmrPos.phaseId, tmrPos.week, tmrPos.day, settings) : null

  async function markDone() {
    if (logged?.id && logged.done) {
      // don't destroy a Strava-enriched row — just un-tick it
      if (logged.stravaId != null) await db.sessions.update(logged.id, { done: false })
      else await db.sessions.delete(logged.id)
      return
    }
    const rec: SessionLog = {
      date: iso,
      phaseId: pos.phaseId,
      week: pos.week,
      day: pos.day,
      type: plan.type,
      title: logged?.stravaId ? (logged.title ?? plan.title) : plan.title,
      exercises: [],
      done: true,
      // keep any Strava-synced conditioning data
      durationMin: logged?.durationMin,
      distanceKm: logged?.distanceKm,
      avgHr: logged?.avgHr,
      stravaId: logged?.stravaId,
      createdAt: logged?.createdAt ?? Date.now(),
    }
    await db.sessions.put(logged?.id ? { ...rec, id: logged.id } : rec)
  }

  return (
    <div className="space-y-4 stagger">
      {/* streak strip */}
      <div className="flex items-center gap-3">
        <Card pad="sm" className="flex-1 flex items-center gap-2.5">
          <Flame size={22} className={`${streak > 0 ? 'text-brand-ink' : 'text-muted'} ${streak >= 7 ? 'flicker' : ''}`} />
          <div>
            <p className="num-display text-2xl text-ink leading-none">{streak}</p>
            <p className="eyebrow text-muted">
              session streak{bestStreak > streak ? ` · best ${bestStreak}` : ''}
            </p>
          </div>
        </Card>
        <Card pad="sm" className="flex-1 flex items-center gap-2.5">
          <CheckCircle2 size={22} className="text-load" />
          <div>
            <p className="num-display text-2xl text-ink leading-none">{weekCount}</p>
            <p className="eyebrow text-muted">done this week</p>
          </div>
        </Card>
      </div>

      {/* context strip + block progress */}
      <div className="px-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{prettyDate(now)}</span>
          <Pill tone="soft-brand">{`${phase.name} · Wk ${pos.week}`}</Pill>
        </div>
        <p className="text-[11px] text-muted mt-2">
          Linear Progression, plus your own running from Runna. Add weight when you earn it; the runs build the engine.
        </p>
      </div>

      {/* data-safety: Strava connection trouble + backup nudge */}
      {settings.stravaNeedsReconnect ? (
        <Card pad="sm" className="border-warm-edge/40 bg-warm">
          <p className="font-semibold text-ink text-sm">Strava needs reconnecting</p>
          <p className="text-xs text-muted mt-0.5">
            Your runs stopped syncing. Reconnect to start pulling them in again.
          </p>
          <button onClick={beginStravaAuth} className="text-brand-ink font-bold text-sm mt-1 min-h-[44px] inline-flex items-center">
            Reconnect Strava →
          </button>
        </Card>
      ) : settings.stravaSyncError ? (
        <Card pad="sm" className="border-warm-edge/40 bg-warm">
          <p className="font-semibold text-ink text-sm">Couldn’t reach Strava</p>
          <p className="text-xs text-muted mt-0.5">
            The last sync didn’t go through — it’ll retry when you reopen, or sync from Settings.
          </p>
        </Card>
      ) : null}

      {shouldNudgeBackup(settings, sessions) && (
        <Card pad="sm" className="flex items-center gap-3 border-warm-edge/40 bg-warm">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-ink">Back up your data</p>
            <p className="text-xs text-muted">It lives only on this phone — export a copy to be safe.</p>
          </div>
          <button
            onClick={() => downloadBackup()}
            className="text-brand-ink font-bold text-sm shrink-0 min-h-[44px] inline-flex items-center"
          >
            Export →
          </button>
        </Card>
      )}

      {/* lapse (welcome back) takes priority over a single missed nudge */}
      {lapsed ? (
        <Card pad="sm" className="border-warm-edge/40 bg-warm">
          <p className="font-semibold text-ink text-sm">Welcome back 👋</p>
          <p className="text-xs text-muted mt-0.5">
            It's been {lapsedDays} days — don't jump ahead into heavier weeks. Pick up where you left
            off and ease back in.
          </p>
          <button onClick={realign} className="text-brand-ink font-bold text-sm mt-1 min-h-[44px] inline-flex items-center">
            Resume from week {lastDoneSession?.week} →
          </button>
        </Card>
      ) : missed && dismissedDate !== missed.date ? (
        <Card pad="sm" className="flex items-center gap-3 border-warm-edge/40 bg-warm">
          <AlertTriangle size={20} className="text-gold-ink shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-ink">Missed {missed.title}</p>
            <button onClick={() => nav(`/session/${missed!.date}`)} className="text-brand-ink font-bold min-h-[44px] inline-flex items-center">
              Log it now →
            </button>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('tb-dismiss-missed', missed!.date)
              setDismissedDate(missed!.date)
            }}
            aria-label="Dismiss"
            className="text-muted w-11 h-11 -mr-2 grid place-items-center shrink-0"
          >
            <X size={16} />
          </button>
        </Card>
      ) : null}

      {/* main session card */}
      <Card elev="hero" pad="none" className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <SessionIcon type={plan.type} size={26} />
            <div className="flex-1">
              <h2 className="display-hero text-2xl text-ink leading-tight">{plan.title}</h2>
              {plan.scheme && <p className={`text-sm font-bold ${meta.color}`}>{plan.scheme}</p>}
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
                        <span className="num-display text-load text-2xl leading-none">
                          {first.weight}
                          <span className="text-xs font-semibold text-muted"> kg</span>
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
        <div className="bg-[var(--color-surface-sunk)] px-5 py-4 border-t border-line/60">
          {isLoggable ? (
            <>
              <Button className="w-full text-lg" onClick={() => nav(`/session/${iso}`)}>
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
              <p className="text-sm text-muted">
                {plan.title === 'Recovery'
                  ? 'Recovery — mobility or an easy walk. Keep it genuinely light.'
                  : 'Rest day — recovery is training too.'}
              </p>
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
                {logged?.done ? 'Completed' : 'Mark complete'}
              </Button>
              {(plan.type === 'run' || plan.type === 'hic') && (
                <a
                  href="https://www.strava.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-pill px-4 font-bold bg-strava/12 text-strava-ink flex items-center gap-1 min-h-[3rem]"
                >
                  Strava <ExternalLink size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-muted px-6">
        Consistency is the whole program. One session at a time.
      </p>
    </div>
  )
}
