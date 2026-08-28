# Specialist review pass — prompt for a new chat

Paste the block below into a **new** Cursor chat on branch `mass-extraction`. Keep this file; the tab
will vanish.

Josh, 2026-08-28: he **tried the v46 year calendar and it is not good enough**. Do not defend it.
Diagnose, then (only after a merged list) rebuild the planner UX. The engine and `plan.blocks`
model stay.

---

You are working on **tb-app**, branch **`mass-extraction`**, preview **tb2.joshua-birch.co.uk (v46)**.
Sole user: **Josh**. Phone-first PWA. Offline-first. No auth.

Read first, in order: `CLAUDE.md`, `HANDOFF.md`, `docs/BACKLOG.md` (section **NEXT**),
`docs/mass-design.md` §14.5, this file. Book claims need page numbers from `docs/MASS/`. The book
wins over taste. Do not invent coaching, rounding rules, or templates.

This chat is **high-signal review then one implementer**. Context from the v46 UX pass is in the
repo, not in the previous tab. Do not re-derive MASS from scratch.

## The job

v46 shipped a first year calendar (`src/components/PlanYear.tsx`, helpers in
`src/lib/planCalendar.ts`). Josh used it. His verdict: **it isn’t very good**. His original bar
(2026-08-28) still stands:

> A calendar where I enter a start date (or the end of my current plan) and click / drag blocks
> so I can see exactly where each block lands in the year. Example: it is August, I want to bulk
> over winter, holiday booked in May — plan as many MASS cycles as fit, then something else
> before the holiday (Operator was the example; **Operator is not in this pass**). The whole plan
> process should be intuitive instead of a wall of text and numbers.

Also still true: after setup, Today runs the plan automatically; Grey Man loops; Bridge about
every 2–3 months (p.93, WARNED not BLOCKED); Spec is Alpha **or** Bravo, never auto-pick (p.69);
`planRules` two-tier stays.

**Headline:** replace or radically redesign the calendar interaction until a phone user can lay
out a year and *see the dates*. Secondary: walk the rest of the app and mark anything that still
needs code.

## How to run this chat

**Phase 1 — read-only specialists in parallel** (Task/subagents). Each has a profession. Each
must **use the running app** (browser at phone viewport 390px, or Playwright) **and** the code —
not screenshots of code comments. Each returns a ranked list only:

- route / component
- what’s wrong (quote UI; file:line)
- proposed **code** change (concrete, not “improve the UX”)
- book page **or** “UX only / no book claim”
- severity: blocks year-plan | blocks first-run | daily | polish

Do **not** restyle the brand (Oswald/Inter, existing dark mode). Do **not** start E2/E7.

Specialists (launch all):

1. **Interaction designer — year calendar (lead).** Profession: product designer who has shipped
   phone calendars / timeline editors (Fantastical, Linear cycle, training-plan apps). Drive
   `/plan` as Josh would: start date, drop Grey Man, park a holiday in May as time off, insert
   Alpha or Bravo without knowing “block vs cycle”. Judge HTML5 drag on a phone, week cells,
   month wrapping, “Empty week places”, preset Apply replacing the year, inability to split a
   3-week unit (book: blocks are 3 weeks, p.40 — that’s a fact, not a UI excuse to be unusable).
   Propose one interaction model (e.g. month grid with real week rows, chip-then-tap, handle
   resize of *time off only*, list+timeline dual view). Keep `PlannedBlock[]` sequential; holes
   are `off` weeks.

2. **Mobile PWA / touch.** Profession: iOS-style PWA. 44px targets, one-handed, no hover, no
   desktop drag. Settings, Plan cluster builders, Session, tab bar. F22 header pill still
   shows *today’s* protocol when viewing another date.

3. **First-run without the book.** Onboarding → maxes → `/plan` → first Today. Plain English
   first, book name second. Flag leftover jargon. Short walk was the chosen Consolidation
   shape (not the full p.147 list).

4. **Daily loop.** Today, Session (main vs S already split — check if it actually reads),
   Program week, pull-forward, Green-on-lift as Today-tick-only, Forced Progression banner.

5. **Book-fidelity of the planner (not the grids).** Presets vs p.140 / p.142 / p.93; never
   auto-pick Alpha/Bravo; two-tier `planRules`; time off is not a Bridge (pp.92–93). Do not
   invent a holiday protocol beyond “nothing prescribed”.

6. **Accessibility + visual QA.** Existing identity. Contrast, a11y names, truncation, History
   on Grey Man, DEFAULT_SETTINGS flash leftovers. `EXERCISE_INFO` has no barbell lifts — do
   **not** invent form cues; only flag the gap.

**Phase 2 — one synthesis.** Merge. Kill taste-only conflicts. Rank: year-calendar blockers
first (Josh already rejected v46), then first-run, then daily, then polish. **Ask Josh before**
changing book-facing behaviour (auto-inserting Bridges, hiding Alpha/Bravo, splitting a 3-week
Grey Man into 1+2).

**Phase 3 — one implementer.** Rebuild the planner UI to the merged spec. Browser + phone
viewport. `npm run typecheck`, unit tests, relevant e2e. Bump `APP_VERSION` by hand. 
`npm run deploy:v2` (never `npm run deploy`). Update `HANDOFF.md` + `docs/BACKLOG.md`.

## Product facts the review must not break

- Dates local `YYYY-MM-DD`; plan start snaps to Monday or the week **rotates**.
- Under a plan, `currentPhaseId` / `phaseStartDate` are stale — `resolvePosition()`.
- `protocol.exercisesFor(settings)`; MASS 1RMs `maxScope: 'mass'`.
- One lift-family row and one cardio-family row per date. Never two lifts.
- Green may share a lift day; Black must not.
- `off` is a registered protocol (`src/protocols/off.ts`) so unknown ids cannot fall through
  to Beginner.
- Data loss is highest severity. Do not touch `master`. Beginner must keep working.

## Out of scope

Mass Template, Gladiator, Fighter HT (E2); Operator / TB1 (E7); named H clusters; H2-Saturday;
extra DL sets; intensity-tactics UI; MacroFactor (E4); Base Building (skip, p.18, p.151).

## Done when

Josh can, on a phone, lay out “bulk through winter, time off in May, Spec where I choose” and
**see the months**, then Today runs it. The calendar no longer feels like a coloured chip grid
with desktop drag. Findings that need code are in BACKLOG if not fixed in the same chat.

---
