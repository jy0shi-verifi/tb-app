# User-testing round 1 — synthesis

Six persona-agents, each embodying Josh (22, ADHD, 6am trainer, returning-beginner who wants the app to think for him), each critiquing a different lens after reading the real source. Deduped + ranked below.

## The three things every tester circled
1. **Catch me when I slip.** A missed 6am silently desyncs the whole week (pure date-math) — the app says nothing at the exact moment a program-quitter looks for an excuse.
2. **Reward me when I show up.** No streak, no completion moment, no celebration for finishing a hard session or a whole block. Consistency isn't visible or "loseable."
3. **Don't silently do the wrong thing.** Forced progression bumps every block regardless of whether reps were hit; retest keeps old bumps; no deloads.

## Two real bugs (fix regardless)
- **Retest inflates loads.** `setField` in Maxes preserves the old `bumpKg` when you re-enter fresh maxes → new honest 1RM gets silently inflated by all past progression bumps. Retest must zero `bumpKg`.
- **Hardcoded start date.** `db.ts` defaults `phaseStartDate` to a literal `2026-07-13`; installed after that date, `resolvePosition` throws you mid-phase or into a false "Base Building complete". Default should compute the *next Monday* at first launch.

---

## Pass 1 — Correctness & safety (trust the numbers)
- **Conditional forced progression** — only suggest the bump if the block was actually completed at the prescribed reps; else suggest repeat/retest. (`progression.ts` + Today block-done card)
- **Fix retest `bumpKg`** and **next-Monday default** (the two bugs above).
- **Missed-session handling** — detect a gap of unlogged scheduled sessions; offer one-tap "do it today / shift my start date / let it go" instead of silently rolling forward.
- **Deload / easy week** — offer an optional deload at block end before the next wave.
- **Real Test Day session** at end of Base Building (submax protocol + guidance) → one-tap "Start Operator" that sets phase + Monday (no manual Settings flip).
- **Surface `underFloor`** like the ceiling flag; add a one-line note at the 60kg ceiling ("maxed the dumbbell — hold and add reps").

## Pass 2 — Retention & reward (keep me for months)
- **Streak / consistency** front and centre on Today + History ("🔥 12-day streak", "Week 4 · 3/3 lifts done", longest-ever). Loss-aversion is the retention engine.
- **Session-complete moment** on save (not a silent `nav(-1)`) — "done ✓ · 9/9 sets", call out a **PR** when a top set beats the previous best.
- **Block-completion celebration** *before* the progression admin — weeks trained, sessions, total volume, each lift's start→end TM.
- **Surface running progress** — total km/min, longest run, the Base-Building Week-8 benchmark tracked over time. (It's the part he loves and it's currently invisible.)
- **Milestones / story** — badges in the timeline (phase/block done, session-count, PRs); a small trophy shelf.
- **Cut-framing** — one line: "You're on a cut — holding your lifts is a win," so a flat chart doesn't read as failure. Reference MacroFactor, don't rebuild it.
- Make **delete** less prominent than achievements (swipe/long-press, not a red trash on every row).

## Pass 3 — In-workout logging (effortless mid-set)
- **Rest timer** that auto-starts on ticking a set, counts the scheme's rest (2–3 min, 3–5 on heavy weeks), buzzes when done. (#1 logging ask.)
- **Wake lock** — keep the screen awake while logging (`navigator.wakeLock`); it currently sleeps between sets.
- **One-tap sets** — show target as plain text ("18 kg × 5") with a big check as the primary action; only reveal editable inputs on an explicit edit tap, so a sweaty thumb doesn't pop the keyboard over the check button.
- **SE circuit round-by-round** — the circuit is performed as rounds (one set of all 5 moves, rest, ×3) but the logger groups by exercise; offer a "Round 1 of 3" view.
- **Haptics + auto-advance + a "done" flourish**; bigger check target (48px+).
- **Autosave on every tick** (don't lose ticks if the app closes); Save becomes "finish".
- Let a session count as done past a threshold (bailed one set short still = showed up).

## Pass 4 — Onboarding & language (guided, not dropped in)
- **First-run welcome + minimal setup** — plain-English "what this is + Base Building is easy runs before lifting", then ask the 2 things a beginner can answer: start date (default next Monday) and DB increment (1/2 kg). Skip jargon like load-basis.
- **Empty-state coaching** per tab; on empty Maxes: "You'll fill this in on Test Day (~8 weeks) — nothing to do yet."
- **Plain-language labels + tooltips/glossary** — "Conditioning (HIC)", "Bodyweight Circuit (SE)"; hide Operator-only stuff during Base Building.
- **Settings guardrails** — confirm before a phase/date change that resets position; treat phase-switch as guided, not a raw toggle.
- Countdown days: show a Week-1 peek + tiny prep checklist.

## Pass 5 — Premium feel (an app I want to open)
- **Dark mode** that follows system (near-black canvas, green popping) — he trains at 6am in the dark; ranked #1 by the design lens.
- **Hero-size the load number** on the session card (big, tabular, green — the app's signature) instead of a tiny right-edge figure.
- **Rework the header** — drop the repeated "TACTICAL BARBELL" wordmark for a monogram or the phase/week.
- **Distinctive numerals** (a tabular display/grotesk face for loads/reps/stats) instead of plain system font.
- **Completion animation** — spring/checkmark-draw on the final set; a real "session complete" beat.
- **Calendar density** — bigger cells / colour-fill done days instead of stacking date+icon+badge; or a scrollable week-strip with today centred.
- **Tactile buttons** (`active:scale`), richer shadow on the main card, one confident signature colour.

---

## Recommended order
Pass 1 (cheap + trust) → Pass 3 (daily friction) → Pass 2 (retention) → Pass 5 (dark mode + feel) → Pass 4 (onboarding, best done once the rest settles). Dark mode can jump forward — it's contained and high-impact for 6am.
