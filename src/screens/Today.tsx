import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ExternalLink, AlertTriangle, X, Flame } from 'lucide-react'
import { useMaxes, useSettings, useSessions, useSessionByDate } from '../hooks'
import { maxesMap, OPERATOR_LIFTS, PHASES, resolvePosition, sessionFor } from '../program'
import { isoDate, today, prettyDate, parseISO, diffDays, addDays, mondayIndex, nextMonday } from '../lib/date'
import { db, saveSettings, clearProgression } from '../db'
import { beginStravaAuth } from '../lib/strava'
import { shouldNudgeBackup, downloadBackup } from '../lib/backup'
import { suggestBlockProgression, bumpedEntry, blockCompleted, stalledLiftsSinceRetest } from '../lib/progression'
import { computeStreak, longestStreak, sessionsThisWeek } from '../lib/stats'
import { Button, Card, Pill, SessionIcon, SESSION_META, CoinGlyph } from '../components/ui'
import ShareWin from '../components/ShareWin'
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
  const phase = PHASES[pos.phaseId]
  const mm = maxesMap(maxes)

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
    const isBB = phase.id === 'base-building'
    return (
      <div className="space-y-4 stagger">
        <Card elev="hero" pad="lg" className="topo-hero text-white text-center relative overflow-hidden border-white/10">
          <p className="eyebrow hero-text text-gold-hi">{phase.name} starts in</p>
          <p className="num-display text-7xl my-1 hero-text">{days}</p>
          <p className="text-sm text-white/85">
            day{days === 1 ? '' : 's'} — {prettyDate(parseISO(settings.phaseStartDate))}
          </p>
        </Card>

        {isBB && (
          <Card>
            <p className="eyebrow text-muted mb-2">Your first week</p>
            <ul className="text-sm text-ink/90 space-y-1.5">
              <li>💪 2 circuits (Mon · Thu) — light &amp; high-rep</li>
              <li>🏃 3 easy runs (Tue · Wed · Sat) — LSS, flat, 30 min+</li>
              <li>🧘 Recovery Friday · 😴 Rest Sunday</li>
            </ul>
          </Card>
        )}

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

  // ---- phase / block complete ----
  if (pos.status === 'complete') {
    // If the "complete" is really a lay-off that rolled the calendar past the
    // final week (not a finished phase), catch it here rather than pushing an
    // unearned Test Day / block review.
    if (lapsed && (lastDoneSession?.week ?? 0) < phase.lengthWeeks) {
      return (
        <Card className="space-y-2 border-warm-edge/40 bg-warm">
          <p className="font-bold text-ink">Welcome back 👋</p>
          <p className="text-sm text-muted">
            It's been {lapsedDays} days and the calendar ran on without you — you were on week{' '}
            {lastDoneSession?.week}. Pick up there rather than jumping to the finish line.
          </p>
          <button onClick={realign} className="text-brand-ink font-bold text-sm min-h-[44px] inline-flex items-center">
            Resume from week {lastDoneSession?.week} →
          </button>
        </Card>
      )
    }
    if (phase.id === 'base-building') {
      async function startOperator() {
        await saveSettings({ currentPhaseId: 'operator', phaseStartDate: nextMonday(), operatorBlock: 1, operatorFirstRunDone: false })
      }
      return (
        <div className="space-y-4 stagger">
          <Card elev="hero" pad="lg" className="topo-hero text-white text-center space-y-3 relative border-white/10">
            <div className="inline-flex floaty">
              <CoinGlyph size={76} />
            </div>
            <p className="display-hero text-2xl text-white hero-text">Base Building done</p>
            <p className="text-sm text-white/85">
              Eight weeks in the bank and your engine's rebuilt. Do your Test Day, pop the numbers into
              Maxes, then kick off Operator — it'll work out every weight for you.
            </p>
            <Button onClick={() => nav('/maxes')} className="w-full">
              Enter my Test Day maxes
            </Button>
            <button onClick={startOperator} className="w-full text-sm text-white/90 font-bold min-h-[44px] inline-flex items-center justify-center">
              Start Operator (next Monday) →
            </button>
            <div className="pt-1">
              <ShareWin headline="Base Building done" sub="8 weeks banked · engine rebuilt" className="text-white" />
            </div>
          </Card>
        </div>
      )
    }

    // Operator block complete
    const completed = blockCompleted(sessions, settings.phaseStartDate, phase.lengthWeeks)
    const items = suggestBlockProgression(OPERATOR_LIFTS, mm)
    const hasMaxes = items.some((i) => i.hasMax)
    const opBlock = settings.operatorBlock ?? 1
    // TB new-lifter ladder (p.108): the FIRST Operator run is 12 weeks (two 6-wk blocks on
    // the same numbers) before the first retest; retest every 6 wks THEREAFTER. Once the
    // first run has been retested, every later block recommends a retest (not another hold).
    const firstRun = !(settings.operatorFirstRunDone ?? false) && opBlock < 2
    const thisMonday = isoDate(addDays(now, -mondayIndex(now)))
    // Ladder safety net: once past the first run, watch whether any lift's last
    // retest still beat a forced-progression bump. If one stalls, it's time to
    // change rungs — beyond the app's auto-setup — so flag it and send to Claude.
    const stalled = firstRun ? [] : stalledLiftsSinceRetest(items, settings.maxHistory)
    const stalling = stalled.length > 0
    const blockEndIso = isoDate(addDays(parseISO(settings.phaseStartDate), phase.lengthWeeks * 7 - 1))
    const blockCount = sessions.filter(
      (s) => s.done && s.date >= settings.phaseStartDate && s.date <= blockEndIso,
    ).length

    async function forceProgress() {
      for (const it of items) {
        if (!it.hasMax) continue
        const entry = maxes.find((m) => m.liftId === it.liftId)
        if (entry) await db.maxes.put(bumpedEntry(entry, it.step))
      }
      await saveSettings({
        phaseStartDate: thisMonday,
        operatorBlock: opBlock + 1,
        operatorFirstRunDone: true,
      })
    }
    async function repeatBlock() {
      await saveSettings({ phaseStartDate: thisMonday, operatorBlock: opBlock + 1 })
    }
    async function retest() {
      if (
        !window.confirm(
          'Retest resets your progressed maxes back to your test numbers — you’ll re-enter fresh. Continue?',
        )
      )
        return
      // Snapshot each lift's max we're about to replace, so next block-end can
      // measure how much this retest gained per lift (the ladder-rung signal).
      const lifts = Object.fromEntries(items.map((it) => [it.liftId, it.currentOneRM]))
      const history = [...(settings.maxHistory ?? []), { date: isoDate(now), lifts }].slice(-8)
      await clearProgression()
      localStorage.removeItem('tb-testday-celebrated') // re-arm the Test Day reward
      // Mark the first 12-week run done: after a retest the ladder is retest-every-
      // 6-weeks, so don't re-arm the "first run — hold the weights" hold (TB1 p.108).
      await saveSettings({ operatorBlock: 1, operatorFirstRunDone: true, maxHistory: history })
      nav('/maxes')
    }

    return (
      <div className="space-y-4 stagger">
        {stalling && (
          <Card className="border-warm-edge/60 bg-warm space-y-2">
            <p className="font-bold text-ink">⚠️ A lift's retests are slowing down</p>
            <p className="text-sm text-muted">
              {stalled.map((s) => `${s.name} (+${Math.round(s.gain)}kg)`).join(', ')} gained no more
              than a forced-progression bump this time. In Tactical Barbell's ladder (TB1 p109) that's
              the cue to change rungs — retest every 12 weeks, then eventually forced progression —
              which is beyond what the app sets up on its own.
            </p>
            <p className="text-sm font-semibold text-ink">
              Don't just retest again — export your data (Settings → Backup) and check in with Claude
              to set up the next stage.
            </p>
          </Card>
        )}
        <Card elev="hero" className="topo-whisper space-y-3">
          <div className="flex items-center gap-3">
            <CoinGlyph size={44} />
            <p className="display-hero text-xl text-ink">Operator block done</p>
          </div>
          <p className="text-sm text-ink">
            {completed ? '🎉 ' : ''}
            {phase.lengthWeeks} weeks · block {opBlock} · <b className="text-load num-display">{blockCount}</b>{' '}
            sessions logged.
          </p>

          {!hasMaxes ? (
            <>
              <p className="text-sm text-muted">Enter your maxes to set up your next block.</p>
              <Button className="w-full" onClick={() => nav('/maxes')}>
                Go to Maxes
              </Button>
            </>
          ) : !completed ? (
            <>
              <div className="rounded-field bg-warm p-3 text-sm text-ink">
                Looks like you didn't finish the heavy weeks (3 &amp; 6). No drama — <b>don't change
                anything.</b> Run it back at the same weights and nail it this time.
              </div>
              <Button className="w-full" onClick={repeatBlock}>
                Repeat this block (same weights)
              </Button>
              <button onClick={retest} className="w-full text-sm text-muted font-medium min-h-[44px] inline-flex items-center justify-center">
                Retest my maxes instead →
              </button>
            </>
          ) : firstRun ? (
            <>
              <p className="text-sm text-muted">
                Your <b>first Operator run is 12 weeks</b> — bank one more 6-week block on the{' '}
                <b>same weights</b> before you retest. On a cut, holding steady is exactly right.
              </p>
              <Button className="w-full" onClick={repeatBlock}>
                Start next block — same weights
              </Button>
              <button onClick={retest} className="w-full text-sm text-muted font-medium min-h-[44px] inline-flex items-center justify-center">
                Retest my maxes instead →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Past your first 12 weeks — time to <b>retest</b> and cash in your gains (retest
                ~every 6 weeks while they keep coming). Forced progression is the later fallback,
                once retests stop moving.
              </p>
              <Button className="w-full" onClick={retest}>
                Retest my maxes
              </Button>
              <button onClick={forceProgress} className="w-full text-sm text-muted font-medium min-h-[44px] inline-flex items-center justify-center">
                Force-progress a small bump &amp; continue →
              </button>
              <button onClick={repeatBlock} className="w-full text-sm text-muted font-medium min-h-[44px] inline-flex items-center justify-center">
                Repeat the same weights →
              </button>
            </>
          )}

          <div className="border-t border-line/60 pt-2">
            <ShareWin headline="Operator block done" sub={`Block ${opBlock} · ${blockCount} sessions`} className="text-brand-ink" />
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            🧘 Recovery: the every-3rd-week easy weeks cover the regular load. Take a <b>full week
            off every few months</b>, and a light week when you switch phases — TB programs rest at
            the seams.
          </p>
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
  const bestStreak = longestStreak(sessions)
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

  // tomorrow's session (for rest-day peek)
  const tmr = addDays(now, 1)
  const tmrPos = resolvePosition(settings, tmr)
  const tmrPlan =
    tmrPos.status === 'active' ? sessionFor(tmrPos.phaseId, tmrPos.week, tmrPos.day, mm, settings) : null

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
          <Pill tone="soft-brand">
            {phase.name} · Wk {pos.week}/{phase.lengthWeeks}
          </Pill>
        </div>
        <div className="h-1.5 rounded-full bg-line/50 overflow-hidden mt-2">
          <div
            className="h-full glam-gradient transition-all"
            style={{ width: `${(pos.week / phase.lengthWeeks) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted mt-1">
          {phase.lengthWeeks - pos.week > 0
            ? `${phase.lengthWeeks - pos.week} week${phase.lengthWeeks - pos.week === 1 ? '' : 's'} to ${pos.phaseId === 'operator' ? 'block review' : 'Test Day'}`
            : pos.phaseId === 'operator'
              ? 'Final week — block review'
              : 'Final week — Test Day'}
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
              {wavePct != null && (
                <p className="eyebrow text-muted mt-1">
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
                        <span className="num-display text-load text-2xl leading-none">
                          {first.weight}
                          <span className="text-xs font-semibold text-muted"> kg</span>
                          {first.overCeiling && <span className="text-gold-ink"> ⚠︎</span>}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {anyCeiling && (
            <p className="text-xs text-gold-ink mt-2">
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
        <div className="bg-[var(--color-surface-sunk)] px-5 py-4 border-t border-line/60">
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
