import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ExternalLink, AlertTriangle, X, Flame, TrendingUp } from 'lucide-react'
import { useSettings, useSessions, useSessionsByDate, useAllOneRm } from '../hooks'
import {
  PROTOCOLS,
  conditioningAlongside,
  narrowMaxes,
  progressionPending,
  protocolFor,
  resolvePosition,
  sessionFor,
} from '../program'
import { isoDate, today, prettyDate, parseISO, diffDays, addDays, mondayIndex } from '../lib/date'
import { db, deleteSession, saveSettings } from '../db'
import { coverFor, familyOf, pulledForwardDates, rowOfFamily, type SessionFamily } from '../lib/sessions'
import { beginStravaAuth } from '../lib/strava'
import { shouldNudgeBackup, downloadBackup } from '../lib/backup'
import { computeStreak, longestStreak, sessionsThisWeek } from '../lib/stats'
import { Button, Card, Pill, SessionIcon, SESSION_META } from '../components/ui'
import ConditioningAlongside from '../components/ConditioningAlongside'
import type { SessionLog } from '../types'
import type { SessionPlan } from '../protocol'

import { PROTOCOL_BLURB, clusterHeading } from '../lib/plainCopy'

export default function Today() {
  const settings = useSettings()
  const sessions = useSessions()
  const nav = useNavigate()
  const now = today()
  const iso = isoDate(now)
  // Every row on today — up to two, one lifting and one conditioning (backlog
  // F1). `undefined` until IndexedDB answers.
  const dayRowsLoading = useSessionsByDate(iso)
  const dayRows = dayRowsLoading ?? []
  const [dismissedDate, setDismissedDate] = useState<string | null>(() =>
    localStorage.getItem('tb-dismiss-missed'),
  )

  // Resolved BEFORE the loading guard below, because `useMaxesFor` is a hook and
  // must run on every render — putting it after an early return changes the hook
  // count between renders and React throws. `resolvePosition` is pure and safe to
  // call against DEFAULT_SETTINGS.
  const pos = resolvePosition(settings, now)
  // Scoped to the RESOLVED protocol, not to settings — under a block plan the
  // two differ, and the wrong scope means every load renders "set your 1RM".
  //
  // Read once and narrowed per position rather than through `useMaxesFor`,
  // because this screen now resolves THREE positions: today, tomorrow (the
  // rest-day peek and the bring-forward offer) and whichever day a pulled-forward
  // session was borrowed from. Those can sit in different blocks, and a pull
  // across a block seam would otherwise be narrowed with the wrong protocol.
  const allOneRm = useAllOneRm()
  const maxesFor = (phaseId: string) => narrowMaxes(allOneRm, protocolFor(phaseId))
  const maxes = maxesFor(pos.phaseId)
  // A block has ended and Forced Progression has not been answered for it. The
  // book calls this the mechanism the protocol works by (p.90), so it is a
  // prompt, not a settings screen the user has to know exists.
  const progression = progressionPending(settings, now)

  // undefined until IndexedDB loads — avoids a flash of the wrong phase on DEFAULT_SETTINGS
  const settingsLoading = useLiveQuery(() => db.settings.get('app'), []) === undefined
  // Wait for the day's rows too. Rendering "Start session" and then flipping it
  // to "Completed" a beat later is the same class of bug as seeding state from
  // data that is still loading (CLAUDE.md) — the screen shows something untrue.
  if (settingsLoading || dayRowsLoading === undefined)
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-24 rounded-card" />
        <div className="skeleton h-40 rounded-card" />
      </div>
    )

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
    const startIso = settings.plan?.startDate ?? settings.phaseStartDate
    const days = diffDays(parseISO(startIso), now)
    const gm = pos.phaseId === 'gm' || protocolFor(pos.phaseId).family === 'general'
    return (
      <div className="space-y-4 stagger">
        <Card elev="hero" pad="lg" className="topo-hero text-white text-center relative overflow-hidden border-white/10">
          <p className="eyebrow hero-text text-gold-hi">{phase.name} starts in</p>
          <p className="num-display text-7xl my-1 hero-text">{days}</p>
          <p className="text-sm text-white/85">
            day{days === 1 ? '' : 's'} — {prettyDate(parseISO(startIso))}
          </p>
        </Card>

        <Card>
          <p className="eyebrow text-muted mb-2">Your first week</p>
          {gm ? (
            <ul className="text-sm text-ink/90 space-y-1.5">
              <li>💪 Mon · Wed · Fri — two big lifts, then accessories</li>
              <li>🚶 Easy conditioning (Green) on the days between — walking is enough</li>
              <li>😴 Recovery is part of the work</li>
            </ul>
          ) : (
            <ul className="text-sm text-ink/90 space-y-1.5">
              <li>💪 3 strength days (Mon · Wed · Fri) — A/B, 3 × 8–12</li>
              <li>🏃 3 runs (Tue · Thu · Sat) — your Runna plan</li>
              <li>😴 Rest Sunday</li>
            </ul>
          )}
        </Card>

        <Card>
          <p className="eyebrow text-muted mb-2">Before you start</p>
          <ul className="text-sm text-ink/90 space-y-1.5">
            {gm ? (
              <>
                <li>• Enter working maxes from a 2–3 rep test (p.63)</li>
                <li>• Accessories default to the book’s examples — change them on Year plan if you want</li>
                <li>• Lay kit out the night before</li>
              </>
            ) : (
              <>
                <li>• Sort your dumbbells &amp; bench</li>
                <li>• Pick your flat run route</li>
                <li>• Lay your kit out the night before</li>
              </>
            )}
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
    // Under a BLOCK PLAN the plan has simply finished, and the book's own answer
    // to that is "reassess and determine if you need to change the ratio"
    // (p.140) — so the planner is what belongs here.
    //
    // `realign` must not be offered in that case: it writes `phaseStartDate`,
    // which `resolveInPlan` never reads, so the old "Resume" button did nothing
    // at all and left Today stuck on "It's been 0 days" (audit A15).
    if (settings.plan?.blocks?.length) {
      return (
        <div className="space-y-4 stagger">
          {progression && (
            <ProgressionBanner blockIndex={progression.index} onOpen={() => nav('/progression')} />
          )}
          <Card className="space-y-2 border-warm-edge/40 bg-warm">
            <p className="font-bold text-ink">This sequence has ended</p>
            <p className="text-sm text-muted">
              The blocks you laid out have run their course — the programme has not. Reassess how
              much time to spend on overall size (General) vs a zoom-in (Specificity) (p.140).
            </p>
            <button
              onClick={() => nav('/next-cycle')}
              className="text-brand-ink font-bold text-sm min-h-[44px] inline-flex items-center"
            >
              Plan the next cycle →
            </button>
          </Card>
        </div>
      )
    }
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
  const plan = sessionFor(pos.phaseId, pos.week, pos.day, settings, maxes)
  const planFamily = familyOf(plan.type)
  // The row this day's own session writes to. Matched BY FAMILY, so a Strava run
  // sitting on the same date is invisible to the lift and vice versa — which is
  // what stopped one overwriting the other (audit code-01 F7, backlog F1).
  const logged = rowOfFamily(dayRows, planFamily)

  // Conditioning the book puts on this LIFTING day: "sessions can be conducted on
  // non-lifting or lifting days" (p.99). It gets a row of its own now, so it can
  // actually be ticked instead of being a note under the lift.
  const condPlan = conditioningAlongside(pos.phaseId, pos.week, pos.day, settings)
  const condRow = condPlan ? rowOfFamily(dayRows, 'cardio') : undefined

  // A session borrowed from a later day and trained today — Josh's way of
  // shortening a week when he is short of time (backlog F1).
  const extraRow = dayRows.find((r) => r.pulledFrom)
  const extraPos = extraRow?.pulledFrom ? resolvePosition(settings, parseISO(extraRow.pulledFrom)) : null
  const extraPlan =
    extraRow && extraPos && extraPos.status === 'active'
      ? sessionFor(extraPos.phaseId, extraPos.week, extraPos.day, settings, maxesFor(extraPos.phaseId))
      : null

  // The reverse: today's own session was trained on an earlier day, so this day
  // is covered and must not nag.
  const coveredBy = coverFor(sessions, iso)
  // Protocol-specific, not hardcoded — this line described Beginner's linear
  // progression and was showing above Grey Man sessions.
  const blurb = PROTOCOL_BLURB[pos.phaseId] ?? PROTOCOL_BLURB.beginner
  const meta = SESSION_META[plan.type]
  // lifts open the session logger; runs (Runna-owned) mark-complete on Today
  const isLoggable = plan.type === 'lift' || plan.type === 'se' || (plan.intervals?.length ?? 0) > 0
  const streak = computeStreak(sessions)
  const bestStreak = longestStreak(sessions)
  const weekCount = sessionsThisWeek(sessions)

  // missed-session catch-up: most recent unlogged lift/SE day in the last week.
  // A day whose session was pulled forward and trained early is NOT missed —
  // that is the whole point of pulling it forward (backlog F1).
  const loggedDates = new Set(sessions.map((s) => s.date))
  const coveredDates = pulledForwardDates(sessions)
  let missed: { date: string; title: string } | null = null
  for (let back = 1; back <= 7 && !missed; back++) {
    const d = addDays(now, -back)
    const p = resolvePosition(settings, d)
    if (p.status !== 'active') continue
    const pl = sessionFor(p.phaseId, p.week, p.day, settings, maxes)
    if (
      (pl.type === 'lift' || pl.type === 'se') &&
      !loggedDates.has(isoDate(d)) &&
      !coveredDates.has(isoDate(d))
    ) {
      missed = { date: isoDate(d), title: pl.title }
    }
  }

  // tomorrow's session (for the rest-day peek, and for bringing it forward)
  const tmr = addDays(now, 1)
  const tmrIso = isoDate(tmr)
  const tmrPos = resolvePosition(settings, tmr)
  const tmrPlan =
    tmrPos.status === 'active'
      ? sessionFor(tmrPos.phaseId, tmrPos.week, tmrPos.day, settings, maxesFor(tmrPos.phaseId))
      : null

  /**
   * Can tomorrow's session be trained today? — backlog F1.
   *
   * Josh, 2026-08-24, on why he wants this: *"Let's say on Wednesday I'm waking
   * up early to travel to the other side of the country, I would want to push the
   * lifting on Wednesday forward to Tuesday, so I'd run in the morning and lift
   * in the night."*
   *
   * The gate is what today already ASKS of him, not just what he has logged: the
   * day's own session, any conditioning riding alongside it (p.99), and anything
   * already on the date. If tomorrow's session is the same kind as one of those,
   * the offer is not made — *"I cannot be allowed to lift twice in one day."*
   */
  const occupied = new Set<SessionFamily>(dayRows.map((r) => familyOf(r.type)))
  occupied.add(planFamily)
  if (condPlan) occupied.add('cardio')
  const tmrFamily = tmrPlan ? familyOf(tmrPlan.type) : null
  const canPullTomorrow =
    tmrPlan != null &&
    tmrFamily != null &&
    tmrFamily !== 'rest' &&
    !occupied.has(tmrFamily) &&
    !coverFor(sessions, tmrIso) &&
    !sessions.some((x) => x.date === tmrIso)

  async function pullTomorrowForward() {
    if (!tmrPlan) return
    // Written as a scheduled-but-unfinished row rather than logged complete:
    // bringing a session forward is a scheduling decision, doing it is not.
    await db.sessions.add({
      date: iso,
      phaseId: tmrPos.phaseId,
      week: tmrPos.week,
      day: tmrPos.day,
      type: tmrPlan.type,
      title: tmrPlan.title,
      exercises: [],
      done: false,
      pulledFrom: tmrIso,
      createdAt: Date.now(),
    })
  }

  async function sendExtraBack() {
    if (extraRow?.id != null) await deleteSession(extraRow.id)
  }

  /**
   * Tick (or un-tick) one of the day's sessions.
   *
   * Takes the plan and the row it belongs to rather than closing over the day's
   * only session, because a day can now hold two: the prescribed one, the
   * conditioning session sharing a lifting day (p.99), and a session pulled
   * forward from a later date. `at` carries the position the session FULFILS,
   * which for a pulled-forward row is the borrowed day, not today.
   */
  async function toggleDone(
    p: SessionPlan,
    row: SessionLog | undefined,
    at: { phaseId: string; week: number; day: number },
    from?: string,
  ) {
    if (row?.id && row.done) {
      // `deleteSession` un-ticks a Strava-linked row rather than removing it.
      // The invariant used to live only here, which is how Session and History
      // came to delete unconditionally (audit code-01 F6).
      await deleteSession(row.id)
      return
    }
    const rec: SessionLog = {
      date: iso,
      phaseId: at.phaseId,
      week: at.week,
      day: at.day,
      type: p.type,
      title: row?.stravaId ? (row.title ?? p.title) : p.title,
      exercises: [],
      done: true,
      // keep any Strava-synced conditioning data
      durationMin: row?.durationMin,
      distanceKm: row?.distanceKm,
      avgHr: row?.avgHr,
      stravaId: row?.stravaId,
      ...(from ?? row?.pulledFrom ? { pulledFrom: from ?? row?.pulledFrom } : {}),
      createdAt: row?.createdAt ?? Date.now(),
    }
    await db.sessions.put(row?.id ? { ...rec, id: row.id } : rec)
  }
  const markDone = () => toggleDone(plan, logged, pos)

  return (
    <div className="space-y-4 stagger">
      {progression && <ProgressionBanner blockIndex={progression.index} onOpen={() => nav('/progression')} />}

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
        <p className="text-[11px] text-muted mt-2">{blurb}</p>
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
          {!settings.plan?.blocks?.length && (
            <button onClick={realign} className="text-brand-ink font-bold text-sm mt-1 min-h-[44px] inline-flex items-center">
              Resume from week {lastDoneSession?.week} →
            </button>
          )}
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

          {plan.conditioning && (
            <ConditioningAlongside
              c={plan.conditioning}
              done={condRow?.done ?? false}
              onToggle={
                condPlan ? () => toggleDone(condPlan, condRow, pos) : undefined
              }
            />
          )}

          {/* F13: the one day whose whole purpose is testing 1RMs had no route
              to the 1RM screen. */}
          {plan.testDay && (
            <button
              onClick={() => nav('/maxes')}
              className="mt-3 inline-flex items-center rounded-pill bg-brand/10 text-brand-ink text-[13px] font-bold px-4 min-h-11"
            >
              Test your 1RMs →
            </button>
          )}

          {plan.exercises.length > 0 && (
            <div className="mt-4 divide-y divide-line/60">
              {plan.exercises.map((ex, i) => {
                const first = ex.sets[0]
                const heading = clusterHeading(ex.cluster)
                const prev = i > 0 ? clusterHeading(plan.exercises[i - 1]?.cluster) : null
                return (
                  <div key={i}>
                    {heading && heading !== prev && (
                      <p className="eyebrow text-muted pt-3 pb-1">{heading}</p>
                    )}
                    <div className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink text-[15px]">{ex.name}</p>
                      {/* F12: "Set your 1RM for X" was inert text with no route to
                          the one screen that fixes it. */}
                      {ex.note &&
                        (/1RM|max reps|bodyweight in Settings/i.test(ex.note) ? (
                          <button
                            onClick={() =>
                              nav(/bodyweight in Settings/i.test(ex.note!) ? '/settings' : '/maxes')
                            }
                            className="text-xs text-brand-ink font-semibold text-left"
                          >
                            {ex.note} →
                          </button>
                        ) : (
                          <p className="text-xs text-muted">{ex.note}</p>
                        ))}
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
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* action bar */}
        <div className="bg-[var(--color-surface-sunk)] px-5 py-4 border-t border-line/60">
          {coveredBy ? (
            /* Trained early, on purpose (backlog F1). Showing "Start session"
               here would ask him to do it twice — the opposite of shortening
               the week. */
            <div className="text-center">
              <p className="text-sm text-ink font-semibold">
                {coveredBy.done ? 'Done' : 'Scheduled'} on {prettyDate(parseISO(coveredBy.date))}
              </p>
              <p className="text-xs text-muted mt-0.5">
                You brought this session forward{coveredBy.done ? '' : ' — it is waiting on that day'}.
              </p>
            </div>
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

      {/* A session borrowed from a later day (backlog F1). Its own card, because
          it is genuinely a second session — not a note on the first one. */}
      {extraRow && extraPlan && (
        <Card pad="none" className="overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <SessionIcon type={extraPlan.type} size={26} />
              <div className="flex-1">
                <p className="eyebrow text-brand-ink">
                  Brought forward from {prettyDate(parseISO(extraRow.pulledFrom!))}
                </p>
                <h2 className="display-hero text-xl text-ink leading-tight">{extraPlan.title}</h2>
                {extraPlan.scheme && (
                  <p className={`text-sm font-bold ${SESSION_META[extraPlan.type].color}`}>
                    {extraPlan.scheme}
                  </p>
                )}
              </div>
              {extraRow.done && <CheckCircle2 className="text-load" />}
            </div>
          </div>
          <div className="bg-[var(--color-surface-sunk)] px-5 py-4 border-t border-line/60 space-y-2">
            {extraPlan.exercises.length > 0 ? (
              <Button
                className="w-full"
                variant={extraRow.done ? 'secondary' : 'primary'}
                onClick={() => nav(`/session/${iso}?from=${extraRow.pulledFrom}`)}
              >
                {extraRow.done
                  ? 'Review session'
                  : extraRow.exercises.length
                    ? 'Continue session'
                    : 'Start session'}
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={extraRow.done ? 'secondary' : 'primary'}
                onClick={() =>
                  toggleDone(extraPlan, extraRow, extraPos!, extraRow.pulledFrom)
                }
              >
                {extraRow.done ? 'Completed' : 'Mark complete'}
              </Button>
            )}
            {!extraRow.done && (
              <button
                onClick={sendExtraBack}
                className="w-full text-xs text-muted min-h-[44px]"
              >
                Put it back on {prettyDate(parseISO(extraRow.pulledFrom!))}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Short of time? Bring tomorrow's session forward. Deliberately quiet and
          deliberately last: Josh asked for this as an escape hatch — "I will only
          ever reschedule my week like that if I am genuinely struggling for time"
          — so the app must never look like it is proposing a double day. */}
      {canPullTomorrow && tmrPlan && (
        <button
          onClick={pullTomorrowForward}
          className="w-full text-xs text-muted min-h-[44px] px-6"
        >
          Short of time tomorrow? Do {tmrPlan.title} today as well →
        </button>
      )}

      <p className="text-center text-xs text-muted px-6">
        Consistency is the whole program. One session at a time.
      </p>
    </div>
  )
}

/**
 * The Forced Progression prompt: "Every 3 to 6 weeks, add 5-10lbs to 1RMs.
 * Recalculate and repeat." (MASS p.53)
 *
 * On Today rather than buried in Settings because it is the mechanism the whole
 * protocol runs on (p.90) — an app that hides it is an app that never gets
 * heavier, which is exactly the state this one was in.
 */
function ProgressionBanner({ blockIndex, onOpen }: { blockIndex: number; onOpen: () => void }) {
  return (
    <Card className="border-warm-edge/40 bg-warm">
      <div className="flex items-start gap-3">
        <TrendingUp size={20} className="text-brand-ink mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink">Block {blockIndex + 1} is done — add weight</p>
          <p className="text-sm text-muted mt-0.5">
            Forced Progression: add 5–10 lb to your 1RMs and every working weight follows (p.53).
            Skip anything you struggled with.
          </p>
          <button
            onClick={onOpen}
            className="text-brand-ink font-bold text-sm min-h-[44px] inline-flex items-center"
          >
            Review your maxes →
          </button>
        </div>
      </div>
    </Card>
  )
}
