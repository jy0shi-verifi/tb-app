# Audit 03 — UI and functional completeness (walked, not read)

**Date:** 2026-08-24 · **Branch:** `mass-extraction` · **Method:** `npm run dev`, driven with Playwright at
a 390×844 phone viewport, clean IndexedDB, then demo history.
Findings tagged **[observed]** were seen in a live browser. **[read]** means code only.

## Verdict

Grey Man *computes* correctly — the loads on Today and the Session screen match the p.51 grid cell for
cell, the A/B letter is right, plate rounding is right, and bodyweight reps are right. What is missing is
almost entirely **the connective tissue around that math**. A brand-new install never hears the words
"Grey Man": onboarding is still pure Beginner-mode copy, there is no protocol choice, and the app drops
you into Beginner. Getting to MASS requires knowing to open Settings and change a dropdown. From there
the two screens that make Grey Man usable — `/maxes` and `/plan` — are reachable only through Settings,
are absent from the tab bar, have no back button, and **disagree with each other about what the S cluster
is**: anything you add in the builder can never be given a 1RM, so it is permanently un-loadable. The
Session screen, the thing Josh touches 24 times a morning, clips the weight to a 14-pixel-wide box — a
102.5 kg deadlift renders as "10". Ranked worst first below.

## Summary

| # | Severity | Title | Screen |
|---|----------|-------|--------|
| F1 | critical | A custom S-cluster exercise can never be given a 1RM — `/maxes` renders the book defaults, not your cluster | Plan → Maxes |
| F2 | critical | Program's week grid is built from `phaseStartDate`, so every date and every tap target is months wrong | Program |
| F3 | critical | When the plan runs out, Today bricks and the "Resume" button does nothing at all | Today |
| F4 | critical | The new-user journey never mentions MASS: onboarding is Beginner-only, with no protocol choice | Onboarding |
| F5 | major | The weight input is 14 px wide — a 102.5 kg deadlift renders as "10" | Session |
| F6 | major | The plate line omits the loaded total and the bar, which the design makes mandatory — and that omission hides a 17.5 kg error when plates run out | Session |
| F7 | major | `/plan` scrolls horizontally at 390 px; the "Add" button is entirely off-screen | Plan |
| F8 | major | An exhausted plate inventory silently prescribes a load 33% over target, with no warning | Session |
| F9 | major | `/maxes` previews S-cluster loads at 70/75/80% — the main-lift row, not S's 55/60/65% | Maxes |
| F10 | major | Bodyweight exercises get a "Weight on the bar" kg field on the Session screen | Session |
| F11 | major | `/maxes` and `/plan` are absent from the tab bar, have no back link and no save/done | Maxes, Plan |
| F12 | major | "Set your 1RM for X" is inert text — no route to the screen that fixes it | Today, Session |
| F13 | major | The bridge "Test day" — the one screen whose whole job is testing 1RMs — does not link to `/maxes` | Session |
| F14 | major | The Guide tab still teaches Base Building and Operator, a programme the app no longer runs | Guide |
| F15 | minor | Finishing a session navigates back through history, not to Today | Session |
| F16 | minor | The 5th set of the 4–5 range is unreachable; there is no add-set control | Session |
| F17 | minor | S-cluster add silently no-ops at 6: disabled button, no reason given, input not cleared | Plan |
| F18 | minor | Emptying S1 or S2 silently restores the book's example instead of honouring the edit | Plan |
| F19 | minor | Deleting a block has no confirmation, and an empty plan turns every day into "Rest" | Plan |
| F20 | minor | Beginner's "Your lifts / +68 kg per DB" panel still leads History 12 weeks into Grey Man | History |
| F21 | minor | The "Barbell strength" panel lists three dumbbell lifts, in "kg/DB" | History |
| F22 | minor | The header pill shows `currentPhaseId`, not the protocol for the day being viewed | all |
| F23 | minor | A flash of `DEFAULT_SETTINGS` ("Wk 7", 13 July) renders before IndexedDB resolves | all |
| F24 | minor | Small tap targets: S-cluster remove 27×27, loading select 108×24, microplates checkbox 24×24 | Plan, Settings |
| F25 | nit | Nav links expose no accessible name in the a11y tree | all |
| F26 | nit | "Bridge Week" is offered as a standalone programme in the Settings dropdown | Settings |
| F27 | nit | S-cluster exercise names truncate ("Incline Dumbbell P…") | Plan |

**Fourteen things were checked and found correct** — the p.51 grid on screen, A/B alternation,
ties-down rounding, below-bar handling, bodyweight reps, both dark-mode blocks, console cleanliness,
`inputMode`, autosave and more. They are listed under **Also verified, and correct** at the end;
do not re-audit them.

---

## The new-user journey, walked

Clean IndexedDB, 390×844, `npm run dev`. Step by step, this is what actually happens.

1. **Cold open.** A full-screen "Be a fucking pro" strike animation, then a two-step onboarding.
2. **Onboarding step 1** is headed *"Your training, handled."* and says: *"Running: your own plan — follow
   your Runna plan"* and *"Lifting: three days a week — two dumbbell sessions that alternate, 3 sets of
   8–12."* This is Beginner mode, verbatim. The words *MASS*, *Grey Man*, *barbell* and *1RM* do not appear.
3. **Onboarding step 2** asks two questions: start date, and *"What's the smallest jump on your
   dumbbells?"* (2 kg / 1 kg magnets). There is no protocol picker, no bar weight, no plate inventory,
   no 1RM prompt. **There is no path from onboarding to Grey Man at all.**
4. **Land on Today** → "Beginner · Wk 1", a dumbbell A/B session. A new user's journey ends here unless
   they go looking.
5. **Settings** is the only door. Scroll past Appearance, Dumbbell increment and Rest timer to a
   *Programme* dropdown holding `Beginner | Grey Man | Bridge Week`. ("Bridge Week" being offered as a
   standalone programme is itself odd — a bridge is a block inside a plan, not a programme you run.)
   Switch it to Grey Man and Today immediately shows the correct Grey Man Day A.
6. **Today with no 1RMs** reads, five times over: *"Set your 1RM for Bench Press to see the working weight
   (70%)."* Correct, honest — and **inert**. It is not a link. The set-weight screen is `/maxes`, which is
   not in the tab bar and is only reachable from Settings → *1RM maxes* → *Open*. Nothing on Today points
   there. A user who does not scroll Settings never finds it.
7. **`/maxes`** is good: main cluster and S1/S2, a weight+reps pair per lift, Brzycki applied live, page
   references cited. Entering 80×3 for Bench yields "1RM 84.7 kg" and a three-cell week preview. Two
   problems appear immediately — the preview uses 70/75/80% for **S-cluster** lifts too (Front Squat 74.1
   kg previews as 52.5, when Today correctly prescribes 40 kg at the S row's 55%), and there is no Save,
   no Done and no Back: the only exit is the tab bar.
8. **`/plan`** (Settings → *Block plan* → *Open*) does three jobs on one page: block sequence, S-cluster
   builder, conditioning days. *Create a starter plan* produces GM / GM / Bridge / GM / GM, 13 weeks —
   a good default. The S builder enforces the book's 4–6 and quotes p.49.
9. **The dead end.** I added "Barbell Curl" to S1. Today and the Session screen both immediately
   prescribed it, saying *"Set your 1RM for Barbell Curl."* I went to `/maxes` — **Barbell Curl is not
   there.** `/maxes` renders `protocolExercises(protocol)`, which reads the static book cluster, while the
   session generator reads `settings.mass.sCluster`. Anything you add in the builder is permanently
   un-loadable, and anything you remove still appears on `/maxes`.
10. **Doing the session.** Weights are prefilled and correct. Ticking all 24 sets flips the header to
    "Session done — 24/24 sets" and the button to "Finish ✓". Pressing Finish navigated me to **`/plan`** —
    the screen I happened to have visited before — not to Today.
11. **Back on Today**, streak 1, a tick badge on the card, and "Continue session". That part works.

---

## Findings

### F1. A custom S-cluster exercise can never be given a 1RM
- **Severity:** critical
- **Where:** `/plan` then `/maxes`. Add any exercise to S1 or S2 and open `/maxes`. `src/screens/Maxes.tsx:51`
  (`protocolExercises(protocol)`) vs `src/protocols/greyman.ts:284-288` (`sClusterOf`, which reads
  `ctx.settings.mass.sCluster`).
- **What happens:** **[observed]** I added "Barbell Curl" to S1. Today and the Session screen immediately
  prescribed it — `Barbell Curl · 4×12 · "Set your 1RM for Barbell Curl to see the working weight (55%)."`
  I opened `/maxes` and Barbell Curl was **not on the page**. `/maxes` builds its list from
  `protocol.clusters`, which is the static book example; the session generator builds its list from
  `settings.mass.sCluster`. The two screens disagree about what the S cluster is. It breaks both ways:
  anything you add is permanently un-loadable — it renders "Set your 1RM…" forever with no way to set one —
  and anything you remove still appears on `/maxes` soliciting a 1RM nothing will ever use. That makes the
  S-cluster builder, the feature the book insists is user-owned (p.49), a dead end for its main purpose.
- **Rectify:** give `Maxes.tsx` the same resolved cluster the session generator uses. Either fold the
  settings merge into `protocolFor`/`protocolExercises` so every screen sees one resolved protocol, or
  export a `resolveClusters(protocol, settings)` and call it from both. The former is better — it also
  fixes `Program.tsx` and anything added later. Add a test that adds an S exercise and asserts it appears
  in `protocolExercises`.

### F2. Program's week grid is built from `phaseStartDate`, so every date is wrong
- **Severity:** critical
- **Where:** `/program`, Week view, with demo history loaded. `src/screens/Program.tsx:81`
  (`addDays(parseISO(settings.phaseStartDate), (week - 1) * 7 + day)`) and `:19`
  (`PROTOCOLS[settings.currentPhaseId]`).
- **What happens:** **[observed]** Today is Monday **24 August 2026**. On the current week, `/program`
  showed `Mon 15 · Tue 16 · Wed 17 … Sun 21`. I tapped the Monday row and landed on
  **`/session/2025-12-15`** — eight months in the past. The screen ignores `settings.plan` entirely and
  lays its calendar out from `phaseStartDate`, which the demo seed leaves at `2025-12-08` (the start of the
  Beginner run) while the plan puts today in Grey Man block 4. Worse, the two screens then contradict each
  other about the same date: `/program` labelled 15 Dec 2025 **"Grey Man — Day B, 4–5 × 6 @ 75%, Overhead
  Press 35 · Deadlift 80"**, while `/session/2025-12-15` correctly resolved it as **"Strength — Day B,
  3 × 8–12"** Beginner work. Every prescription on Program comes from `settings.currentPhaseId` rather than
  the block that owns that week.
- **Rectify:** derive both the date and the protocol from the plan. Compute the week's Monday from
  `plan.startDate` when a plan exists (falling back to `phaseStartDate` only when it does not), and for
  each day call `resolvePosition(settings, thatDate)` and use the `phaseId` it returns instead of
  `settings.currentPhaseId`. This is `code-04-test-gaps.md` G3 — not a latent risk but live and
  reproducible on the demo seed in two taps.

### F3. When the plan runs out, Today bricks and the "Resume" button does nothing
- **Severity:** critical
- **Where:** `/`, with a `settings.plan` whose blocks end before today.
  `src/screens/Today.tsx:56-60` (`realign`) and `:100-115`; `src/program.ts:99-100` and `:162-175`.
- **What happens:** **[observed]** I shortened the demo plan so it ended before today. Today's entire
  content collapsed to one card: *"Welcome back 👋 — It's been 0 days and the calendar ran on without you —
  you were on week 2. Pick up where you left off."* with a **"Resume from week 2 →"** button. No session,
  no exercises, and no hint that the block plan is what ran out. I clicked Resume and **nothing happened** —
  the screen was byte-identical afterwards. The reason is in the code: `realign()` writes only
  `phaseStartDate`, but `resolvePosition` short-circuits into `resolveInPlan` whenever `plan.blocks.length`
  is truthy and never reads `phaseStartDate` again. The user is stuck on this card permanently and the one
  button offered is a no-op. Meanwhile `/plan` reported the last block as *"3 weeks · now, week 3"* — it
  does not agree the plan has ended and gives no warning that it is about to. The copy is wrong too: "It's
  been 0 days" on a day he trained.
- **Rectify:** three things. (a) When `status === 'complete'` and a plan exists, say so — *"Your block plan
  ended on <date>"* — and make the primary action a link to `/plan`, not `realign`. (b) Make `realign`
  plan-aware: append a block, or shift `plan.startDate`, whichever matches intent. (c) Warn on Today
  during the final week of a plan, before the cliff.

### F4. The new-user journey never mentions MASS
- **Severity:** critical
- **Where:** first run on a clean IndexedDB. `src/screens/Onboarding.tsx`; `src/screens/Today.tsx:63-94`.
- **What happens:** **[observed]** the full walkthrough is in the section above. In short: onboarding is two
  steps of pure Beginner copy ("*two dumbbell sessions that alternate, 3 sets of 8–12*", "*follow your Runna
  plan*"), the only configuration question is the dumbbell increment, and it lands you in Beginner mode.
  The words *MASS*, *Grey Man*, *barbell* and *1RM* appear nowhere. Grey Man exists only behind a dropdown
  two-thirds of the way down Settings. `docs/mass-design.md` §6 states the intent exactly backwards from
  what ships: "MASS is the default. Beginner stays reachable but unadvertised."
- **Rectify:** add a protocol step to onboarding — Grey Man (default) or Beginner — and branch the copy on
  it. For Grey Man, replace the dumbbell-increment question with bar weight and microplates, then hand off
  to `/maxes` for the four main-cluster 3RMs and to `/plan` for the starter block sequence, as explicit
  next steps rather than places to discover. The "before the phase starts" card at `Today.tsx:63-94` is
  also hardcoded Beginner ("*3 strength days … 3 × 8–12*", "*3 runs — your Runna plan*", "*Sort your
  dumbbells & bench*") and needs the same treatment — **[read]** for that card, everything else observed.

### F5. The weight input is 14 px wide — "102.5" renders as "10"
- **Severity:** major
- **Where:** every Session screen. `src/screens/Session.tsx`, the `SetRow` weight field
  (`class="w-full text-center num-display …"` inside a column that shrink-wraps to its caption).
- **What happens:** **[observed]** the weight `<input>` is `w-full` inside a container sized by the "kg"
  caption below it, so it computes to **13.5 px wide and 22 px tall**. Measured live: with value `"102.5"`,
  `clientWidth` 14 and `scrollWidth` 33 — the field displays "10" and clips the rest. Confirmed visually as
  well. Even two-digit values overflow slightly (`60` and `40` give scrollWidth 16 against clientWidth 14),
  which is why the digits visibly collide with the "kg" caption in a screenshot. This is not hypothetical
  for MASS: week 3 deadlift at 80% of a 127 kg 1RM is 102.5 kg, and every main lift crosses 100 kg
  eventually. It is also the app's primary tap target, hit 24 times a session, at 14×22 px against a 44 px
  guideline. Beginner mode hid it because its loads are two digits.
- **Rectify:** give the weight and reps columns a fixed minimum (`min-w-[4.5ch]`, or a `ch` width driven by
  value length) so three-to-five character values fit, and expand the hit area to 44 px with padding
  rather than shrinking the box to the caption. The reps column only looks fine because the word "reps"
  happens to be wider than "kg" — that accident is holding the layout up.

### F6. The plate line omits the loaded total and the bar
- **Severity:** major
- **Where:** every barbell exercise on the Session screen. `src/screens/Session.tsx:110-135` (`PlateLine`).
- **What happens:** **[observed]** what renders is `25 + 2.5 per side · target 74.13 kg`, or when the
  rounding lands exactly, `15 + 1.25 per side · exact`. `docs/mass-design.md` §4 makes the three-part
  display a rule, not decoration — *"the UI always shows all three of: the exact percentage target, the
  loaded total, and the per-side breakdown"* — with the worked example `Squat — 70% of 100 kg = 70.0 → load
  70 kg · 20 bar + 25 per side`. **The loaded total and the bar weight are both missing.** Because the
  rounding is a documented deviation from the book, the total is the number that keeps it auditable, and
  it is the number Josh needs to sanity-check what he has just stacked. F8 is the proof this matters: the
  missing total is exactly what hides a 17.5 kg error.
- **Rectify:** render the line the design specifies — target, arrow, loaded total, bar + per side. Add a
  test asserting all three components are present for a rounded load, an exact load and a below-bar load.

### F7. `/plan` scrolls horizontally at 390 px and the "Add" button is off-screen
- **Severity:** major
- **Where:** `/plan` at a 390 px viewport, S-cluster and conditioning sections. `src/screens/Plan.tsx`.
- **What happens:** **[observed]** `<main>` measures `scrollWidth` 456 against `clientWidth` 375 — the page
  scrolls sideways by 81 px. Three elements sit past the right edge: the **"Add" button** (left 363, right
  434 — entirely off-screen and un-tappable in the resting scroll position) and the **Tue and Sat
  conditioning `<select>`s** (right 456 and 454, so their dropdown arrows are cut off). Confirmed in
  screenshots: at rest you see a sliver of the orange Add pill at the screen edge, and scrolling to reach
  it slides the whole column of exercise names out of view. The offender is the `flex items-center gap-2`
  row holding the name input, the S1/S2 select and the Add button, with no `min-w-0` and no wrap.
- **Rectify:** let the add row wrap (`flex-wrap`) or give the text input `min-w-0 flex-1`; give the
  conditioning `<select>`s `w-full min-w-0` inside their row. Then assert `main.scrollWidth <=
  main.clientWidth` at 390 px for every route in e2e — a one-line guard that would have caught this.

### F8. An exhausted plate inventory silently prescribes 33% over target
- **Severity:** major
- **Where:** Session screen with a restricted plate set. `src/lib/barbell.ts:177` computes `exhausted` and
  nothing renders it; `src/screens/Settings.tsx:186-204` exposes no inventory editor.
- **What happens:** **[observed]** I set `settings.bar.platePairsKg` to `[25]` and opened a Grey Man
  session. Bench Press displayed **"25 per side · target 52.5 kg"** and prefilled the weight field with
  **70**. A 20 kg bar plus 25 per side is 70 kg — **17.5 kg, or 33%, over the prescription** — stated as
  the plan with no warning at all. Squat did the same (target 65.63, loaded 70). `loadBar` is behaving
  correctly by its own nearest-total rule (70 is nearer 52.5 than the bare 20 kg bar) and it does set
  `exhausted`, but nothing in the UI reads that flag. Because the loaded total is never printed (F6), there
  is no way to notice from the screen that "25 per side" is not 52.5 kg. Two smaller points fall out of the
  same test: the design promises "*Plate inventory is user-configurable*" (`mass-design.md` §1) but Settings
  offers only a bar weight and a microplates on/off toggle — there is no way to say how many of each pair
  you own, even though `BarSetup.plates[].pairs` supports it; and Front Squat rendered **no plate line at
  all** in this state rather than an explanatory one.
- **Rectify:** surface `exhausted` — and any `|deltaKg|` larger than the smallest available jump — as a
  visible warning on the set, in the same place the below-bar warning already appears. That one is handled
  well and should be the model. Then build the plate-inventory editor Settings is missing.

### F9. `/maxes` previews S-cluster loads at the main-lift percentages
- **Severity:** major
- **Where:** `/maxes`, any barbell exercise in S1 or S2. `src/screens/Maxes.tsx:245`
  (`const weeks = [70, 75, 80]`), applied at `:224`.
- **What happens:** **[observed]** Front Squat is an S1 exercise. With a 74.1 kg 1RM, `/maxes` previewed
  *Wk 1 · 70% → 52.5 · Wk 2 · 75% → 55 · Wk 3 · 80% → 60*. Today, correctly, prescribed **40 kg** for the
  same lift in the same week, because the S row of the p.51 grid is 55/60/65%, not 70/75/80%. The two
  screens state different weights for the same exercise and the one on `/maxes` is wrong. Three different
  behaviours coexist there, which is confusing in itself: main lifts get a correct preview, barbell S lifts
  get a **wrong** preview, and dumbbell S lifts get **no** preview at all (the
  `ex.defaultLoading === 'barbell'` guard at `:223`).
- **Rectify:** drive `WorkingPreview` from `GM_GRID` and the exercise's own cluster row instead of a
  hardcoded triple, and extend it to the dumbbell branch so every lift previews. This is
  `code-04-test-gaps.md` G9, now confirmed as a live wrong number rather than a coupling smell.

### F10. Bodyweight exercises get a "Weight on the bar" kg field
- **Severity:** major
- **Where:** Session screen, any `bodyweightReps` exercise — Dips, in the book's default S1.
- **What happens:** **[observed]** Today renders Dips correctly as `4×5` with no weight: 55% of a 10-rep
  max, rounded ties-down, exactly per p.90. The Session screen then gives Dips **four set rows each with an
  empty weight input captioned "kg" and `aria-label="Weight on the bar"`**, alongside correctly prefilled
  reps. The app is asking for a bar load on a bodyweight movement, and a screen reader announces it as a
  barbell field. `/maxes` gets this right — it shows Dips a "max reps" field and the p.90 note — so the
  inconsistency is confined to the screen actually used during training.
- **Rectify:** in `SetRow`, branch on the set's loading mode: `bodyweightReps` renders reps only with a
  "bodyweight" caption, `weightedBodyweight` renders "added kg". The mechanism already exists — the same
  call site correctly switches "kg" to "kg/DB" for dumbbell sets.

### F11. `/maxes` and `/plan` are not in the tab bar and have no way out
- **Severity:** major
- **Where:** `/maxes`, `/plan`.
- **What happens:** **[observed]** neither route appears in the five-tab bar (Today · Program · History ·
  Guide · Settings). Both are reachable only by scrolling Settings to the *Program* section and tapping
  "Open". Once there, `/maxes` contains **no `<a>` or `<button>` other than the five nav tabs** — no back,
  no save, no done. `/plan` is the same. `/session`, the app's other detail screen, does have a "Back"
  button. These two screens hold the 1RMs, the S cluster, the block sequence and the conditioning days —
  everything that makes Grey Man work.
- **Rectify:** give both a back link in the position `/session` uses, and surface them where they are
  needed rather than only in Settings — from the Today card when a 1RM is missing (F12), from the bridge
  test day (F13), and from a "Plan" affordance on Program.

### F12. "Set your 1RM for X" is inert text
- **Severity:** major
- **Where:** Today and Session, any exercise with no stored 1RM. Observed on a clean Grey Man switch and
  again after adding a new S exercise.
- **What happens:** **[observed]** on a fresh switch to Grey Man, Today reads "Set your 1RM for Bench Press
  to see the working weight (70%)" five times over. The message is honest and well written — and it is a
  `<p>`. I enumerated every `<a>` and `<button>` on the page: `Start session` and the five nav tabs. There
  is nothing to tap. The app tells the user exactly what is wrong and then gives them no way to fix it. The
  same message appears mid-session for a newly added S exercise, which is precisely when the book says a
  new cluster entry needs testing (pp.90, 93).
- **Rectify:** make the note a link to `/maxes`, ideally anchored to that exercise. On Today, replace the
  per-lift repetition with a single prominent "Set your 1RMs →" call to action whenever any prescribed
  exercise is missing one.

### F13. The bridge "Test day" does not link to `/maxes`
- **Severity:** major
- **Where:** `/session/<a bridge Thu or Fri>`. `src/protocols/bridge.ts`.
- **What happens:** **[observed]** the card reads "BRIDGE — TEST DAY (OPTIONAL) … Test 1RMs for the next
  block if you need to", quotes p.93 properly, and offers exactly two controls: "Completed" and "Cancel".
  The one screen in the app whose stated purpose is *go and test your 1RMs* has no link to the 1RM screen.
  At 6 am the user has to remember the route lives behind Settings.
- **Rectify:** add a primary "Enter your test results →" link to `/maxes` on bridge test days.

### F14. The Guide tab still teaches Base Building and Operator
- **Severity:** major
- **Where:** `/guide`. `src/screens/Guide.tsx`.
- **What happens:** **[observed]** one of the app's five tabs opens on "YOUR TB GUIDE" and states: *"This
  app runs the two TB phases you need right now: Base Building then Operator."* The topic list reads *Base
  Building — what & how · How to run an SE circuit · Test Day (end of Base Building) · Operator — the
  strength engine · Conditioning: runs (E) & HIC · Your pull: row now, pull-ups later*. None of it
  describes what the app does. Base Building is a deliberate, recorded omission (`mass-design.md` §8.1);
  Operator was removed on `strip-tb`. Twenty per cent of the app's navigation currently teaches the wrong
  programme, and the fidelity rule in `CLAUDE.md` makes that a correctness problem, not a copy problem.
- **Rectify:** rewrite from `docs/MASS/MASS-extraction.md` with page references, in the citation style
  `/plan` and `/maxes` already use. This is backlog D1; the point here is only that its severity is higher
  than "content" suggests, because it is a whole tab.

### F15. Finishing a session navigates back through history, not to Today
- **Severity:** minor
- **Where:** Session screen, "Finish ✓".
- **What happens:** **[observed]** I ticked all 24 sets — the header correctly flipped to "Session done —
  24/24 sets" and offered "Share this win" — pressed **Finish ✓**, and landed on **`/plan`**, because that
  was the previous history entry. Whatever screen you came from is where finishing a workout dumps you.
- **Rectify:** navigate explicitly to `/` on finish.

### F16. The 5th set of the 4–5 range is unreachable
- **Severity:** minor
- **Where:** every Grey Man main lift.
- **What happens:** **[observed]** the session header states the prescription as "4–5 × 8 @ 70%", and the
  book means it as a real range (`mass-design.md` §2.3: "`4-5` is a genuine range, not a typo — the user
  picks 4 or 5 sets"). Four set rows render and there is no add-set control anywhere; I enumerated the
  buttons. The app advertises a choice it does not offer.
- **Rectify:** an "+ Add set" affordance on main-lift cards capped at `setsMax`, or a per-block "4 or 5
  sets" preference on `/plan`.

### F17. S-cluster add silently no-ops at six
- **Severity:** minor
- **Where:** `/plan`, S-cluster builder at 6 exercises.
- **What happens:** **[observed]** at six, the Add button is `disabled` but the text input stays enabled. I
  typed "Calf Raise", pressed Enter, and nothing happened — no message, no shake, and **the text stayed in
  the field**. The only signal is a small "6 of 4–6" counter above. Correct behaviour (p.49 says "no
  more"), silent delivery.
- **Rectify:** show the reason inline — "6 of 6 — remove one to add another" — beside the disabled button,
  and disable the input too.

### F18. Emptying S1 or S2 silently restores the book's example
- **Severity:** minor
- **Where:** `/plan` then any session. `src/protocols/greyman.ts:284-288`.
- **What happens:** **[observed]** I removed both S2 exercises. `settings.mass.sCluster.s2` was correctly
  stored as `[]` — and the very next Day B session prescribed **Dumbbell Shrugs and Dumbbell Row** again,
  because `sClusterOf` treats an empty array as "unset" and falls back to `GM_S2_EXAMPLE`. The edit is
  silently discarded and nothing on `/plan` says so. You cannot run an S1-only cluster, and worse, you
  cannot tell that the app has overruled you.
- **Rectify:** distinguish "never customised" (`undefined`) from "deliberately empty" (`[]`) — the stored
  shape already does. Honour `[]`, and if an empty list is disallowed, say so on `/plan` rather than
  reverting behind the user's back.

### F19. Deleting a block has no confirmation; an empty plan turns every day into "Rest"
- **Severity:** minor
- **Where:** `/plan`, block sequence.
- **What happens:** **[observed]** each block row carries up, down and trash icons — reorder and delete do
  exist and work. The trash is a single unconfirmed tap. I emptied the sequence and the plan persisted as
  `{ startDate: …, blocks: [] }`, at which point `resolvePosition`'s `plan?.blocks?.length` guard treats it
  as "no plan", falls back to `phaseStartDate` + `currentPhaseId`, overruns Grey Man's three-week length
  and returns `status: 'complete'`. Every date in the app then renders **"Rest — Recovery is training
  too"**, and Today shows the same dead "Welcome back" card as F3. "Clear plan" likewise wipes the whole
  sequence with no confirmation.
- **Rectify:** confirm destructive plan edits (or offer undo), and treat `blocks: []` as an error state
  with a message and a route back to building one, not as "no plan".

### F20. Beginner's dumbbell progress panel still leads History
- **Severity:** minor
- **Where:** `/history` with demo data — 26 weeks of Beginner then 12 weeks of Grey Man.
- **What happens:** **[observed]** the first progress block on History is **"YOUR LIFTS"** — the six
  Beginner dumbbell lifts with their `10 → 22 kg +12` deltas and the footer *"+68 kg/DB added across your
  lifts since you started. Slow and steady wins."* It sits above "BARBELL STRENGTH", which is the current
  programme. Twelve weeks into Grey Man, the headline number on the progress screen belongs to a programme
  the user has stopped running and none of it has moved in three months.
- **Rectify:** order the panels by active protocol and collapse the inactive one behind a "Beginner
  history" disclosure, or hide it once the current protocol has data of its own.

### F21. "Barbell strength" lists three dumbbell lifts
- **Severity:** minor
- **Where:** `/history`, "BARBELL STRENGTH" panel.
- **What happens:** **[observed]** the panel lists Deadlift, Squat, Bench Press, Front Squat and Overhead
  Press in kg — then Dumbbell Shrugs, Dumbbell Row and Incline Dumbbell Press, each suffixed **"kg/DB"**.
  The heading is wrong for a third of its contents, and mixing total-on-the-bar with per-dumbbell numbers
  in one list invites exactly the misreading `maxScope` was introduced to prevent.
- **Rectify:** retitle to "Grey Man 1RMs" (or the active protocol's name), or split barbell and dumbbell
  entries into two sub-lists.

### F22. The header pill shows the current phase, not the day being viewed
- **Severity:** minor
- **Where:** the app header, on any screen showing a date outside the current block.
- **What happens:** **[observed]** three times. Viewing a Beginner session from December 2025: header says
  "GREY MAN · WK 2". Viewing a bridge-week test day in July: "GREY MAN · WK 2". Viewing a week-3 session on
  31 August: "GREY MAN · WK 2", while the card itself correctly reads "4–5 × 3 @ 80%".
- **Rectify:** resolve the pill from the date in view, or drop the week number when the view is not today.

### F23. A flash of `DEFAULT_SETTINGS` renders before IndexedDB resolves
- **Severity:** minor
- **Where:** every screen, on load and on hard navigation.
- **What happens:** **[observed]** immediately after onboarding wrote `phaseStartDate: 2026-08-24`, the
  Settings screen's first paint showed the header "BEGINNER · WK 7" and a phase start date of
  **2026-07-13** — the `DEFAULT_SETTINGS` values — before correcting to Wk 1 / 2026-08-24 a moment later.
  The stored row was correct throughout; this is purely the pre-hydration render. `/maxes` already carries
  a `seededFor` guard and a skeleton for exactly this reason (`Maxes.tsx:53-56`), and a crash at
  `Maxes.tsx:279` from the same hazard sits in a console log left by an earlier audit session, so it is a
  known failure mode. On a data app, a wrong date and a wrong week number flashing on screen undermines
  trust in everything else on it, and any handler firing inside that window writes against the wrong
  baseline.
- **Rectify:** have `useSettings` return an explicit loading state rather than `DEFAULT_SETTINGS`, and let
  screens render the skeleton pattern `/maxes` already uses.

### F24. Small tap targets on Plan and Settings
- **Severity:** minor
- **Where:** `/plan` and `/settings` at 390 px. All measured live.
- **What happens:** **[observed]** the S-cluster **remove** buttons are **27×27 px** — destructive, and well
  under the 44 px guideline; the per-exercise **loading `<select>`** is 108×**24** px; the **microplates
  checkbox** is **24×24**; the conditioning day toggles are 38×46, short on width only. For contrast every
  control on the Session screen — ±, tick, RPE, Back, Done — measures 44×44 or larger, so the pattern
  already exists in the codebase.
- **Rectify:** apply the Session screen's 44 px minimum to the Plan and Settings controls, expanding the
  hit area with padding rather than the visual size.

### F25. Nav links expose no accessible name
- **Severity:** nit
- **Where:** the bottom tab bar, every screen.
- **What happens:** **[observed]** the accessibility snapshot renders all five tabs as bare
  `link: /url: /program` with no name, even though visible text labels sit under the icons. Something in
  the markup is hiding the label from the a11y tree.
- **Rectify:** check for an `aria-hidden` on the label span, and add `aria-label` to each `NavLink`.

### F26. "Bridge Week" is offered as a standalone programme
- **Severity:** nit
- **Where:** Settings, Programme dropdown.
- **What happens:** **[observed]** the options are `Beginner | Grey Man | Bridge Week`. A bridge is a
  one-week block inside a plan (pp.92–93), not a programme to run indefinitely; selecting it would leave
  the app in a permanent rest-and-test loop. It appears because `PROTOCOLS` is enumerated directly.
- **Rectify:** filter the dropdown on a `selectableAsPhase` flag (or `family !== 'bridge'`).

### F27. S-cluster exercise names truncate
- **Severity:** nit
- **Where:** `/plan`, S-cluster rows at 390 px.
- **What happens:** **[observed]** "Incline Dumbbell Press" renders as "Incline Dumbbell P…", partly a
  consequence of F7's overflow.
- **Rectify:** falls out of fixing F7; let the name wrap to two lines.

---

## Also verified, and correct

Recorded so nobody spends budget re-checking. All **[observed]**.

- **Grey Man's math is right on screen.** Week 1 `4–5 × 8 @ 70% · S 4 × 12 @ 55%`, week 2 `6 @ 75% ·
  S 10 @ 60%`, week 3 `3 @ 80% · S 8 @ 65%` — the p.51 grid cell for cell, live. A/B alternation is right
  (Mon B, Wed A, Fri B mid-block — not day-of-week). Front Squat at 55% of 74.1 kg renders 40 kg; Deadlift
  at 80% of 107.5 renders 85, so 86 rounds down and ties-down is honoured.
- **Below-bar handling is exemplary and should be the model for F8.** Overhead Press with a 22 kg 1RM
  showed *"Target is under the empty bar — lift the bar, or swap in dumbbells"*, prefilled 20 kg, and
  matched p.31 and the recorded deviation. `/maxes` showed "20 / bar only" in all three week cells.
- **Bodyweight reps.** 55% of a 10-rep max renders `4×5` — 5.5 ties down, per p.90.
- **Dark mode.** The two definitions in `src/index.css` — `.dark` at line 95 and
  `@media (prefers-color-scheme: dark) html:not(.light)` at line 136 — are **in perfect sync**: 38 custom
  properties each, identical names, identical values, verified by parsing the file. Rendered dark on Today,
  Session, Settings, Plan, Maxes and History: nothing unreadable, contrast good, the gold "session done"
  panel and the ember accents both hold up.
- **No console errors** from the app in any state I drove, including the plan-exhausted state, the
  empty-plan state, the exhausted-plate state, the below-bar state, and a session with no 1RMs at all.
- **No page-level horizontal scroll** on `/`, `/program`, `/history`, `/guide`, `/settings`, `/maxes` or
  `/session` at 390 px. `/plan` is the sole exception (F7).
- **`inputMode`** is `decimal` on every weight field and `numeric` on every reps field, so phones raise a
  number pad rather than a keyboard.
- **Session autosave works** — a value typed into a set row survived a full page reload.
- **Missed-session nudge works:** Today showed "Missed Grey Man — Day A · Log it now →" for a lifting day
  skipped earlier in the week.
- **Completion state on Today is clear:** the streak increments, a tick badge appears on the session card,
  and the button changes to "Continue session".
- **Conditioning days render properly** — "WALK · Walk x 30-60 Minutes · Green conditioning. 'Self
  explanatory.' (p.100)", with a Mark complete button and a Strava note.
- **Block sequence editing** on `/plan` supports move-up, move-down and delete per block as icon buttons,
  plus "+ Grey Man" and "+ Bridge week". "Create a starter plan" produces GM / GM / Bridge / GM / GM.
- **Microplates default to off**, correctly matching the recorded 2.5 kg smallest jump.

## Not investigated

- Strava connect — blocked on backlog B1, there is no second API app for `tb2`.
- Backup export and import round-trip — covered by `code-01-data-integrity.md`.
- Any viewport other than 390×844, and any real iOS or Android rendering.
- The seeded 26-week Beginner history was only skimmed; this pass concentrated on MASS.
