# User-testing round 2 — synthesis (v2 app + TB veteran)

7 agents: 6 Josh-personas re-reviewing v2 + one experienced TB athlete/coach auditing the programming. Deduped + ranked.

## Convergent winners (flagged by multiple testers)
1. **Streak punishes rest days** (6am + motivation, both #1). `computeStreak` counts calendar days and breaks after >2 gaps — programmed Sunday rest / dropped-HIC weeks can reset it. Punishing plan-adherence is the exact quit-trigger. → Count *scheduled sessions completed*; never count a planned rest day as a miss.
2. **Lapse handling is missing** (trust #1 + veteran + 6am). `resolvePosition` is pure date math — miss two weeks and it silently marches you into a 90% heavy week cold. The missed-nudge + streak both go blind past 2 days, so a whole missed week is invisible. → Detect a gap (>~10 days no logged sessions) → offer ease-back / repeat week / retest instead of advancing the calendar. Widen the catch-up nudge to the block.
3. **Maxes +/- bump buttons are a "loaded gun"** (trust + onboarding). Unlabelled, and the app already auto-progresses at block end. A curious tap silently reprices every load. → Hide behind an "Advanced" disclosure with a plain explanation, or remove.
4. **Jargon undefined where it matters** (onboarding + trust). "Operator", "TM", "%", "wave", "HIC", "block", "est 1RM" appear with no plain-English. "90% week" reads as *almost done* when it's the *hardest*. Today doesn't even show the % week that Program does. → Plain captions / a "?" glossary; label weeks by feel ("heavy"/"lighter build"); surface week+% on Today.

## The TB veteran's programming verdict (real training changes — need Josh's nod)
The load engine is trustworthy (wave, TM, Epley, floor-rounding, per-DB clamp all book-faithful; 2kg granularity is fine). But:
- **[MUST] No deloads anywhere.** Back-to-back Operator blocks + heavy 90/95% weeks + concurrent HIC on a *deficit* = stall/tweak risk. → Insert a 1-week deload between blocks (2×5 @ 60–65%, easy conditioning), surfaced at block-complete.
- **[MUST] "Black" conditioning is mislabelled and too HIC-heavy for a cut.** Implemented = HIC Tue **and** Sat (2/week). Real Black is LSS-dominant with sparse HIC. Two weekly HICs + 3×/wk lifting in a deficit eats recovery. → 2–3 easy runs + **one** HIC/week (already drops on heavy weeks), bias to LSS. Or rename honestly.
- **[SHOULD] Base Building wks 6–8 are strength-starved (Josh's catch, confirmed).** Weeks 6–8 = Mon/Wed/Fri runs + only **one** strength day (Tue); week 6 Thu falls through to a run → 4 runs + 1 lift. Should *ramp toward* Operator's 3×/wk, not sit at 1×/wk. → 2 strength days (Tue + Fri) in wks 6–8, convert a weekday run. Also gives Test Day 3+ lift exposures instead of ~2 (softens the honeymoon-block estimate).
- **[SHOULD] Block-completion gating too loose.** `blockCompleted` passes on ≥2 lifts in the final week — someone who skipped week 3 gets the "earned the bump" screen. → Require the heavy weeks (wk3 & wk6) logged & done.
- **[SHOULD] Forced progression drifts forever, no retest trigger.** +2.5/+5 every block off a soft estimate compounds; after 3–4 blocks the % outruns reality. → Recommend a retest every 2–3 blocks (plumbing exists) or after a missed heavy week.
- **[NICE] 60kg ceiling advice is wrong** ("add reps" isn't how you progress a strength wave). → Steer to tempo/pause/unilateral, and "this lift has outgrown the DBs — barbell signal."
- **[NICE] HIC undifferentiated** (static text, no type/tracking) and **SE ladder hardcoded** — fine for v1.

## App / UX / bug fixes (just do)
**Bugs:**
- **Rest timer fires on every SE circuit move** (should be between *rounds* only) — logging.
- **Dark-mode chart broken** — axis/tooltip/line colours hardcoded light; muddy on dark — visual.
- **Orange HIC/Strava colours don't theme** (raw tailwind, look off in dark) — visual.
- **Missed-nudge re-nags every app open** (dismissal not persisted) — 6am.
- **Blank reps silently save as 0**, poisoning PR/1RM math — logging.

**Logging friction:**
- **Off-target sets take 3+ taps** (pencil + confirm). → Inline ±/stepper for reps & weight (2kg increments) right on the row; beating/missing the target is one tap. (logging #1)
- **Completion + PR gated on ALL sets done** — heavy 3×2 weeks where you grind 2/3 never get the payoff. → Fire PR on any top set beating best; allow "done for now" to still celebrate. Show the actual number ("Bench 28→30kg").
- **No total/loading helper** — show "18 kg/DB" (kill per-hand-vs-total doubt). Test Day → Maxes needs the same "one dumbbell, not both" sanity note.

**Retention / goal:**
- **No finish line** — add block progress ("Week 4/6 · 2 sessions to the bump") on Today; a target line on the strength chart. (6am + motivation)
- **Running section flat** — surface longest run (already computed), a trend, the Wk8 benchmark as a hero (mostly resolved by Strava M3).
- **Best-1RM-only-ratchets hides a cut slide** — plot current est-1RM alongside best-ever.
- **Cut isn't the headline** — "held your lifts across N weeks cutting" as a record. **Badges all-time/un-losable** — show next-rung progress + per-block badges.
- **Rest day dead-end** — show tomorrow + a "rest taken" tap; a gentle "not feeling it?" off-ramp.

**Visual polish:**
- Distinctive numeric font for hero figures (the premium tell); roomier block grid (fill done tiles, % into the week gutter); less spreadsheet-y stat/record cards; more micro-motion (card stagger, streak tick, set-done spring); nicer empty states; a depleting ring on the rest timer.

**Safety / language:**
- Guard the load-basis toggle like phase; warn before "Retest" wipes progression; expand HIC once ("hard conditioning"); define "Operator/TM/block" in plain English.

## Recommended handling
Two buckets: **(A) program changes** that alter Josh's actual training (deloads, less HIC, stronger BB wks 6–8, stricter progression) — these want his sign-off; and **(B) app/UX/bug fixes** — just build. Suggest: adopt all of (A) (they're well-justified for a cut) + do all of (B).
