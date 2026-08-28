# Specialist review stack — paste this entire file into a new chat

Josh, 2026-08-28: **the v46 year calendar is not good enough.** Do not defend it. Token cost is
not a constraint — thoroughness is. Do not implement until Phase 2 is on screen and Josh has
answered the book-facing questions.

---

You are working on **tb-app**, git branch **`mass-extraction`**, live preview
**https://tb2.joshua-birch.co.uk** (footer must read **v46**; if it does not, hard-refresh / kill
the PWA cache). Sole user: **Josh**. Phone-first PWA. Offline-first. No auth.

Read first, in this order, before launching anyone:

1. `CLAUDE.md`
2. `HANDOFF.md`
3. `docs/BACKLOG.md` section **NEXT**
4. `docs/mass-design.md` **§11.4** (planRules two-tier) and **§14.5**
5. This file

Book claims need page numbers from `docs/MASS/` (extraction, not the gitignored PDF). The book
wins over taste. Do not invent coaching, rounding rules, or templates. Do not touch `master`.
Do not `npm run deploy` (production). Data loss is the highest-severity failure.

This is a **new** chat. Zero memory of the previous tab except what is on disk.

---

## What Josh actually wants

After a short setup (programme, working maxes, clusters, a plan), the app **takes over** each
morning: what to do, every weight, plates, rest. He must also be able to **lay out a year**
without already knowing MASS vocabulary.

His own words for the planner (2026-08-28):

> I want a calendar view, where I enter my start date (or end date of my current plan) and then
> I can click / drag blocks into the calendar in real time so I can see exactly where each
> block lands in the year.
>
> It might be August, end of summer and I want to bulk over the winter but have a holiday
> booked in May. I would plan as many mass cycles as I can, and then 6 weeks worth of Operator
> (once in, not in right now so use this example loosely) before my holiday to cut down the fat.
>
> Essentially, I want the entire plan process to be intuitive instead of a wall of text and
> numbers.

He then tried v46’s calendar and said **it isn’t very good**.

Operator / Tactical Barbell I is **not in this pass** (backlog E7). Time off / a gap before a
holiday **is** in this pass. Specificity is Alpha **or** Bravo — he chooses, **never auto-pick**
(MASS p.69). Bridge about every 2–3 months is **advice** (p.93) → `planRules` WARNED, never
BLOCKED. Grey Man / Spec blocks are **3 weeks** (p.40, p.67) — that is a fact; the UI must make
3-week units easy to place, not pretend they can be 1-week Grey Man.

`plan.blocks` stays an ordered list of `{ protocolId, weeks }`. Holes in the year are `off`
blocks (`src/protocols/off.ts`), not a second timeline and not a fake Bridge.

---

## How you will run this chat (mandatory process)

### Phase 1 — diagnose only. No edits. No restyle. No deploy.

Launch **all twelve specialists in one turn**, in parallel, via the Task tool
(`subagent_type: "generalPurpose"` unless noted, `model: "inherit"`). Do **not** batch them
into one agent. Do **not** skip any. Do **not** summarise them into a short list in your own
head and skip the launch.

Each specialist prompt must be **self-contained**. They cannot see this chat. Paste into every
prompt: workspace path, branch, tb2 URL, v46, phone viewport **390×844**, the copy rule
(plain English first, book name second), the product facts at the bottom of this file, and
their profession-specific brief.

**Every specialist must actually use the app**, not only grep:

- Browser tools against `https://tb2.joshua-birch.co.uk` **and/or** `npm run dev` at
  `http://localhost:5173`, locked to 390×844.
- If the origin is empty: Settings → **Load demo history** (it confirms; snapshots first) so
  Grey Man + a plan exist. If you cannot load demo, seed via Playwright `seedState` in `e2e/helpers.ts`.
- Click. Scroll. Try to drag. Try to place a May holiday. Open a session. Open Program. Open
  History. Do not stop at a screenshot of the first paint.

**Return format (every specialist, no exceptions).** Ranked list. Each finding:

```
ID: <profession-prefix>-<n>
Route: /path  (and component file:line)
What I did: <the click path that surfaced this>
What is wrong: <quote visible copy; describe the interaction failure>
Who it hurts: first-run | daily morning | year-plan | a11y | data
Proposed code change: <concrete — files, components, interaction, not “make it nicer”>
Book: p.<n>  OR  UX only / no book claim
Severity: P0 blocks the job  |  P1 daily pain  |  P2 polish
Confidence: observed in running app  |  code-only  |  both
```

Minimum **8 findings** per specialist unless they honestly exhaust the surface (then say so
and list what they walked). Include **at least two things that are fine** under “Do not
change” so we do not re-litigate the engine.

Forbidden in Phase 1: writing src/, restyling, adding templates, inventing EXERCISE_INFO
cues, promoting WARNED planRules to BLOCKED, auto-picking Alpha vs Bravo.

### Phase 2 — one synthesis, still no code

When all twelve have returned, **you** (parent) merge:

1. Dedupe. One finding, many witnesses → keep the best evidence.
2. Kill taste-only conflicts (two fonts, two calendar metaphors). Pick **one** planner
   interaction model and say why it matches Josh’s paragraph.
3. Rank: **year-calendar P0** first (already rejected), then first-run P0, then daily P0/P1,
   then polish.
4. Split the merged list into:
   - **Do now** (needs code in this chat after Josh answers)
   - **Ask Josh** (book-facing or irreversible IA)
   - **Backlog** (real, not this week)
   - **Not a bug** (engine / book facts that look wrong)

Put the merged list on screen. **Stop.** Use a structured question tool if you have one.
Do not start Phase 3 until Josh answers at least:

- A) Calendar metaphor: month grid with week rows vs horizontal year timeline vs list+mini-map
- B) Placing a block: chip-then-tap a week vs drag from a tray vs “add N Grey Mans until date D”
- C) Holiday: time-off weeks you stretch, vs “I am away these dates” which inserts `off`
- D) Anything that would auto-insert Bridges, hide Alpha/Bravo, or split a 3-week Grey Man

### Phase 3 — one implementer (only after Josh answers)

One visual language. One calendar. Rebuild `PlanYear` / `/plan` to the chosen model. Keep
`PlannedBlock[]` + `off`. Phone viewport verification, `npm run typecheck`, unit tests,
relevant e2e. Bump `APP_VERSION` by hand. `npm run deploy:v2`. Update `HANDOFF.md` and
`docs/BACKLOG.md`. Beginner must keep working.

---

## The twelve specialists

Copy each brief in full. Add to every brief:

Workspace: the tb-app repo on `mass-extraction`. Preview: tb2.joshua-birch.co.uk (v46).
Phone: 390×844. Book: `docs/MASS/`. Engine files you must not “fix”: Grey Man grid
(`src/protocols/greyman.ts`), plate math (`src/lib/barbell.ts`), `planRules` tiers.
Calendar files: `src/components/PlanYear.tsx`, `src/lib/planCalendar.ts`, `src/screens/Plan.tsx`,
`src/lib/planRules.ts`, `src/protocols/off.ts`, `src/screens/NextCycle.tsx`.

### 1. Lead interaction designer — year planner

Profession: senior product designer who has shipped **phone** calendar/timeline editors
(training plans, Fantastical-style month, Linear cycles). You are not a developer who
“adds a date picker”.

Job: prove whether a person can do Josh’s May-holiday scenario in under two minutes without
a briefing. Start date (or “continue from plan end”). See **months**, not a bag of 3-week
chips. Click or drag **on a phone**. Watch the later blocks **move in real time**.

Walk: `/plan` empty, `/plan` with a year painted, `/next-cycle`, Settings → Year plan.
Attempt: HTML5 drag; tap empty week; “Empty week places”; Apply preset (does it blow away
the year?); insert time off before a selected block; drop a block mid-Grey-Man (3-week
units cannot split — is that explained or just an alert?).

Deliver: **one** recommended interaction model with ASCII wireframes for (a) year overview
(b) one month (c) placing a 3-week Grey Man (d) placing a 2-week holiday. Then the ranked
findings list. Name every current control that should die.

### 2. Mobile PWA / touch engineer

Profession: iOS PWA. Thumb zone, 44×44, no hover, no desktop `draggable`, safe areas,
one-handed gym use.

Walk every route at 390×844: `/` `/program` `/history` `/guide` `/settings` `/maxes` `/plan`
`/progression` `/next-cycle` `/session/:date`. Measure tap targets on PlanYear week cells,
cluster remove, loading `<select>`, tab bar. HTML5 drag on iPhone: does it even start?
Horizontal overflow on `/plan`. Keyboard on date inputs.

F22: header pill is `resolvePosition(today)` — view a past session and report what the
chrome says.

### 3. New-user researcher — never read MASS

Profession: user researcher. You have never heard of Grey Man, Bridge, S/MS/H, 1RM, Green,
block vs cycle. Pretend.

Walk a **new install** if you can (or read Onboarding + Maxes + Plan + Today as if first
open). Flag every label that requires the book. Copy rule: plain English first, book name
in parentheses. Short walk was chosen (not the full p.147 ten steps). Onboarding must not
sell Beginner/Runna while Grey Man is the default.

### 4. Daily-use coach — morning loop

Profession: strength coach who is **not** allowed to invent prescriptions. You only check
whether the app tells Josh what to do tomorrow morning.

Walk: Today (lift + Green alongside), Session (main vs accessories headings — v46 claimed
book-01 F5; verify it **reads** as two structures, not two labels on one column), rest
timer copy, plates, 5th set only on main, drop-1RM only on main, Program week, pull-forward,
Forced Progression banner at a block seam (`/progression`), plan-complete → `/next-cycle`.

Alpha/Bravo days: “heavy strength (MS)” vs “hypertrophy (H)” — or still “H1”?

### 5. MASS book-fidelity auditor — planner only

Profession: the person who would have caught the last rebuild’s invented rules. You do
**not** re-audit the p.51 grid (it is pinned by tests). You audit **planning**.

Read: `docs/MASS/extract/09-block-programming-faqs.md`, `src/lib/planRules.ts`, presets,
`off` vs Bridge (`src/protocols/bridge.ts` vs `off.ts`). Check: p.40 3-week fact; p.69 no
auto-pick; p.93 Bridge advice not law; p.140 Standard Cycle shape; p.142 Example 3 = 2:1;
p.141 author counts Bridge as a cycle slot. Time off must never be labelled Bridge.
Applying a Spec preset must ask Alpha **or** Bravo.

### 6. Information architect / copy chief

Profession: IA. Name things by what Josh controls. Kill dual vocab (Block plan vs Year
plan vs Next cycle vs Programme). Glossary: block = 3-week unit; cycle = a sequence;
Bridge = recovery week the book names; time off = nothing prescribed.

Walk nav labels, ScreenHeaders, Settings rows, Guide first accordion, Today blurbs,
preset names. Propose a **single** glossary the whole app will use. Flag walls of
quoted book text that should be one sentence + a cite.

### 7. Visual designer — existing brand only

Profession: visual designer. Identity is **already** Oswald + Inter, topo header, ember
accent, dark mode. **Do not reinvent. Do not ship AI-SaaS glassmorphism.** Judge whether
PlanYear looks like a calendar or like a CSS grid of pills. Contrast of week cells.
Month labels. Colour meaning (GM / Bridge / Alpha / Bravo / off) with a legend. Empty
weeks. Dark mode duplication in `src/index.css` is a maintenance risk — report, don’t
restyle yet.

### 8. Accessibility specialist

Profession: a11y. Keyboard, screen reader, `aria-label` / `aria-current` on tabs (v46
added labels — verify in the a11y tree, don’t trust the PR). Calendar: are week cells
buttons with names (“week of 4 May, Grey Man, week 2 of 3”) or nameless coloured
divs? Focus order. Confirm dialogs. Date inputs. Reduced motion.

### 9. Data-safety engineer

Profession: someone who treats IndexedDB as the only copy of a life. Walk plan writes:
empty plan, delete last block, clear plan, apply preset over a live year, change start
date (Monday snap / week rotate), `off` id must resolve (`protocolFor('off')` must not
be Beginner). `parseBackup` row shape (v46 F9). Snapshots before destructive actions.
No Dexie version bump unless you can prove you need one — prefer not.

### 10. Exploratory QA on the live site

Profession: exploratory tester. tb2 v46, demo history. Charter: “Can I plan a year and
then do tomorrow?” Time-box **a real session** of clicking, not a code review. Log bugs
with reproduction steps. Include Program vs pulled-forward session, Green tick vs
Session read-only, History leading with MASS vs Beginner, onboarding if you reset.

### 11. Frontend engineer — PlanYear implementation

Profession: React engineer reviewing a failed v1. Read `PlanYear.tsx` + `planCalendar.ts`
end to end. HTML5 drag, `window.alert` on illegal drop, `window.prompt` (gone?) ,
preset Apply replacing blocks, `placing` state, 6-column month wrap, `HORIZON = 52`.
List structural reasons the UI cannot meet Josh’s paragraph **even if we restyle it**.
Propose the data helpers the next UI needs (e.g. `insertOffCoveringDates(start,end)`,
`blockStartingMonday`, `snapDropToBlockBoundary`). Keep sequential `PlannedBlock[]`.

### 12. End-to-end flow producer — setup to week 1

Profession: you design first-run checklists. Walk: pick MASS → maxes (2–3 reps, no true
single, p.63) → accessories (book examples vs builder) → year calendar → first Today.
Is there a hole (Back from maxes → Settings)? Does defaultPlan paint 52 weeks before he
has seen the calendar? Should onboarding land on `/plan` after maxes? Consolidation
p.147 items 1–5 stay skipped (nutrition / Base Building). Do not build the ten-step
wizard unless the merged list says the short walk is still failing.

---

## Product facts nobody may break

- Dates are local `YYYY-MM-DD`. A non-Monday plan start **rotates** the week, it does not
  shift it. Writes snap to Monday (`mondayOnOrBefore`).
- Under a plan, `settings.currentPhaseId` and `phaseStartDate` are stale leftovers. Screens
  use `resolvePosition()` and `pos.blockStartDate`.
- Real exercise list: `protocol.exercisesFor(settings)`. MASS 1RMs: `maxScope: 'mass'`
  (never mix with Beginner per-dumbbell).
- One lift-family row and one cardio-family row per date. Never two lifts. Lookup by
  family, never `.first()` on a date.
- Green may share a lifting day (p.99). Black must not.
- Alpha: same lift on MS and H is wanted. Bravo: same compound on consecutive days is a
  **warning**, not a hard block.
- Deadlift override is conventional `id === 'deadlift'` only.
- Forced Progression is block-to-block (p.53, p.90), increment 4.5 kg lower / 2.5 kg
  upper (labelled deviation, `docs/mass-design.md` §12).

## Out of scope (do not start, do not “just add”)

E2 Mass / Gladiator / Fighter HT. E7 Operator. Named H clusters (Camp Drvar, etc.).
H2-on-Saturday. Extra DL sets. Intensity-tactics UI. MacroFactor / food (E4). Base
Building (skip, p.18, p.151). Invented EXERCISE_INFO for Bench/Squat/OHP/Deadlift.

## Done when

Phase 1+2 are complete in **this** chat: twelve ranked lists, one merged list, Josh has
answered A–D. Phase 3 (if he says go) ships a planner he can demo on a phone: bulk through
winter, **see May**, drop time off, Spec only when he picks Alpha or Bravo, then Today
runs it. Footer version bumped. tb2 deployed with `npm run deploy:v2`.

---
