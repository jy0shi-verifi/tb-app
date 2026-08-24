# Backlog

The durable list of outstanding work. **Nothing here is "remembered" anywhere else** — if it is not in
this file it will be forgotten. Add to it rather than relying on a chat thread.

**Last reviewed: 2026-08-24**, after working the eight-agent audit end to end. Evidence for every item
is in `docs/audit/` — `00-summary.md` is the ranked synthesis, the other eight files carry the detail
with page references and `file:line`. Where an item cites an ID like `A4` or `code-03 F7`, that is the
audit's own numbering; go there for the reasoning.

Status: `open` · `blocked` · `done`.

---

## Where things stand

The audit raised ~44 items. **All but the deliberately-deferred ones are now done.** What is left is
listed below in three groups: work that needs Josh, work that is genuinely not started (mostly the
other templates), and a short tail of small things.

**287 unit + 62 e2e green** · typecheck (now covering `src`, `test`, `e2e` **and** `functions`), lint
and build clean · deployed to tb2 as **v41**.

---

## Done — 2026-08-24

### Designed with Josh first, then built

| ID | Item | Commit |
|---|---|---|
| — | **Four design decisions recorded before any code**, per this file's own instruction. `docs/mass-design.md` §11 holds the reasoning and is binding on the implementation. | `762ddd4` |
| **A1** | **Forced Progression — the programme now progresses.** Was *the* critical finding: nothing in `src/` wrote a non-zero `progressedKg`, so block 4 prescribed exactly what block 1 did. Block-boundary prompt at `/progression`, a per-lift "struggled" marker on the Session screen, and the 10% failure drop as an action. Blocks are stamped **by start date**, not index, so re-planning cannot mis-stamp them. | `4b0981c` |
| **A5** | **Automatic on-device backups.** Dexie **v3** `snapshots` store, taken daily on app open and before every destructive action. Safe *by construction*: every destructive path clears tables **by name**, so a store none of them names survives all of them. Retention split 5 routine / 5 guard. Restoring takes a snapshot first. `BACKUP_VERSION` stays **2** — snapshots are never exported. | `d266e61` |
| **A15** | **The guided planner** at `/next-cycle`, replacing the dead "Resume" button. Two-tier guardrails: hard-block what the book states, warn on what it recommends. Presets are a **list** with a mandatory page citation. | `d266e61` |

### Book fidelity

| ID | Item | Commit |
|---|---|---|
| A4 | Green conditioning can share a lifting day (p.99), rendered alongside the lift. Black still refused on lifting days. | `fc351b2` |
| A9 | The 5th set is reachable — the book's only sanctioned outlet for surplus energy (p.51, pp.64–65). | `d3e0ad3` |
| A12 | Extra-curricular activity consumes the conditioning allowance (p.110). The finding with most real-world bite for Josh: his Runna running auto-logs from Strava. | `d3e0ad3` |
| A13 | Duration caps reach the screen (p.111 + each session's own page); hardgainer caps restored; a stored pick is validated against the block's colour. | `d3e0ad3` |
| A14 | `defaultPlan()` is now the p.140 Standard Cycle truncated where Specificity would begin. | `d266e61` |
| — | Rest is per cluster — 2–5 min main, 1–2 min S (pp.52–53) — not a flat 120 s for everything. | `d3e0ad3` |
| — | The failure ladder is in the book's **order**: lengthen rest first, drop 10% only if still failing. | `4b0981c` |
| — | The 10-minute Recovery Run exemption (p.102). | `d3e0ad3` |
| — | Test-set range corrected to **2–3** (p.63, p.90); p.63's post-test rest surfaced. | `d3e0ad3` |
| — | Core work no longer eats an S-cluster slot (p.65). | `d3e0ad3` |
| D1 | **The Guide rewritten from the extraction.** It taught Base Building, Operator, the Golden Rule and a training max — two of which Mass Protocol explicitly contradicts (p.63, p.65). | `1ecbccf` |

### Correctness and data safety

| ID | Item | Commit |
|---|---|---|
| A6 | Autosave could write two rows for one date. Saves are serialised; `sessionForDate` merges any duplicates **field by field** (a test caught why: the duplicate carrying the Strava link is usually the one with no logged sets). | `678156a` |
| A8 | Maxes keystroke-delete destroyed `progressedKg`. Clearing is now explicit and confirmed. | `4b0981c` |
| A10 | A failed export no longer stamps `lastBackupAt` and disarms the nudge for a fortnight. | `d266e61` |
| A11 | The `importBackup` rollback branch — "the highest-value missing test in the repo" — now tested. | `d266e61` |
| A16 | Plan starts snap to a Monday; a *stored* mid-week start is reported as an error. | `d266e61` |
| A17 | `blockWeeksOf` coerces every read, so a fractional block can no longer blank the session screen. | `d266e61` |
| — | The Strava delete invariant lives in `deleteSession`, where a call site cannot forget it. | `678156a` |
| — | `saveSettings` is transactional, so a rotated Strava token can't be reverted by a stale render. | `678156a` |
| — | `perSide` and `totalKg` agree on off-grid plate sizes. | `678156a` |
| — | **OAuth `state` parameter** and a **same-origin check** on `POST /api/strava/token`. | `9e49e5f` |
| — | `functions/` is typechecked (`tsconfig.functions.json`), which immediately found a dead guard. | `9e49e5f` |
| — | `underFloor` is surfaced — a weighted-bodyweight target below bodyweight means *assistance*, not load (p.90). It rendered a bare "0 kg". | `1ecbccf` |

### UI and journey

| ID | Item | Commit |
|---|---|---|
| code-03 F4 | A new install now hears the words "Grey Man" — onboarding offers a programme and lands on `/maxes`. | `7842e04` |
| code-03 F11 | `/maxes`, `/plan`, `/progression`, `/next-cycle` have a back link. They were dead ends on a phone. | `7842e04` |
| code-03 F12/F13 | "Set your 1RM for X" is a link; Bridge Test Day links to `/maxes`. | `7842e04` |
| code-03 F7 | `/plan` no longer scrolls sideways at 390 px (verified: `scrollWidth === clientWidth === 390`). | `d266e61` |
| code-03 F10 | Bodyweight exercises no longer get a "Weight on the bar" kg field. | `7842e04` |
| code-03 F15 | Finishing a session goes to Today, not back through history. | `7842e04` |
| code-03 F17/F18 | S-cluster add says *why* it refuses at 6; an emptied list says the book's example is running. | `d266e61` |
| book-04 F6/F14 | Ratio guidance and the no-General guardrail, folded into A15. | `d266e61` |

### Tests

| ID | Item | Commit |
|---|---|---|
| code-04 G2 | **The mixed-protocol fixture** the audit called "precisely why the contamination bugs survived". Writing it found a real hole — see the lesson below. | `1ecbccf` |
| code-04 G4 | Migration covered one of five states; fresh/empty and settings-only now covered too. | `1ecbccf` |
| code-02 F13 | `ordinal % 2` only rotates for an **odd** weekly count. Named (`alternationRotates`) and pinned by a test rather than "fixed" — see below. | `1ecbccf` |
| D2 | `e2e/COVERAGE.md` rewritten: it claimed 39 tests (there are 62) and still said `/maxes` didn't exist. | `1ecbccf` |
| — | The design's §7 fixture list is complete. | `4b0981c` |

---

## Three things worth carrying forward

**1. The bug that proves "verify in the running app".** The progression tick boxes were seeded from
`suggestProgression` inside a `useEffect`, but `useSessions()` and `useAllOneRm()` both return `[]`
while IndexedDB loads — so every lift came back ticked, **including ones explicitly marked
"struggled"**. Every unit test passed. The screen showed it in one look. The state is now *derived*
rather than copied, which makes the bug unrepresentable, and `e2e/progression.spec.ts` asserts the
ticks against seeded history because unit tests structurally cannot.

**2. A result that looks like a bug and is not.** Four blocks of +2.5 kg give `[70, 72.5, 72.5, 75]` kg
on the bar. 2.5 kg on the 1RM is only 1.75 kg at 70%, below what the plates can express, so some blocks
repeat. The book has the same property in pounds and never mentions it. Forced Progression guarantees
**non-decreasing per block and strictly heavier across the span** — not a jump every block.
`test/progression.test.ts` says so explicitly so nobody "fixes" it by rounding up.

**3. A name check is not a protocol check.** `applyBeginnerProgress`'s "defence in depth" compared
exercise names against LP_A/LP_B — but names collide across programmes *by design*: a Grey Man S
cluster may legitimately contain `Goblet / Front-rack Squat`, which is also LP_A's first lift. A
colliding name walked straight past the guard. It now takes `phaseId` as a **required** argument, the
same fix `lastPerformance` already had. **Scope by protocol, never by anything else.**

---

## Blocked on Josh

| ID | Item |
|---|---|
| B1 | **Second Strava API app for `tb2`.** Register at `strava.com/settings/api` with callback domain `tb2.joshua-birch.co.uk`; send the **client ID** (the secret goes in the `tb-app-v2` Pages env, never the repo). The client ID must then come from build config so the two variants can differ. **Until this exists, Strava does not work on tb2 at all** — which is also why the new OAuth `state` and same-origin checks are unit-tested rather than verified end to end. |

---

## Required before the app is "finished" — Josh, 2026-08-24

| ID | Item |
|---|---|
| E1 | **Specificity Alpha and Bravo.** Josh: *"We need to add Specificity before this app is finished."* The app cannot run the book's Standard Cycle (p.140) or any General:Specificity ratio (pp.141–142) without it, and today's default plan stops at the bridge because of its absence (`docs/mass-design.md` §11.3). Extracted in sections 05 and 06. Alpha has separate MS and H grids plus a deadlift override (pp.74–75). This is where `tm90` and the Bulgarian cluster finally matter. The planner's ratio and no-General warnings are already written and waiting for it. |
| E6 | **A second plan preset once Specificity exists.** Josh: *"we can have more than one default (depending on current goal)."* `PLAN_PRESETS` is a list holding one entry; add the full p.140 Standard Cycle and a 2:1 preset (p.142). Every preset carries a page citation — see §11.5. |

---

## Not built (deliberate) — the model accommodates all of these

| ID | Item |
|---|---|
| E2 | **Mass Template, Gladiator, Fighter HT** — extracted (sections 03, 04). Each is one file under `src/protocols/` plus registration. All three need AMRAP and peaking, which Grey Man does not have. **Fighter HT trains twice a week, so it hits the `alternationRotates` limitation** — read p.60 before deciding what it should do. |
| E3 | **Base Building** — skipped by choice, and **book-sanctioned** for a runner (p.18, p.151), not a deviation. Extracted in section 02. Its real argument is connective-tissue preparation for heavy barbell work, not cardio. |
| E4 | **Nutrition and supplements** — extracted (section 08). Two calorie/macro formulas the app could compute (pp.120–121). The Guide points at the book and MacroFactor instead. |
| E5 | **OMS Protocol** (pp.144–145) — its 3–6 week blocks are the one book-sanctioned non-3 block length, and would need the planner's hard block-length rule relaxed for that protocol. |

---

## Small and open

| Item |
|---|
| **Conditioning sharing a day with a lift is informational only.** One session row per date leaves it nowhere to be ticked. Giving it one means allowing two rows per date — the same change A6 was about, now that duplicates are merged rather than prevented at the schema level. `sessions.date` is still not a unique index. |
| **`EXERCISE_INFO` has no barbell lifts.** The Guide's form-video section filters them out, so Bench/Squat/OHP/Deadlift have no form content. Adding it means sourcing real coaching content — not inventing it. |
| **`Maxes.tsx` hardcodes `[70,75,80]`** in one place as a second copy of `GM_GRID`. `WorkingPreview` already reads the grid properly; this is the remaining literal. |
| **One genuinely flaky e2e** — `greyman.spec.ts` died once on `page.goto` with `net::ERR_ABORTED` and passed on retry. With no CI, that trains "just re-run it". |
| **Rate limiting on `/api/strava/token`.** The same-origin check stops cross-site abuse from other websites; it cannot stop a determined caller with curl, and nothing shipped in a public SPA can. Rate limiting is the next step if it is ever seen being hit. |
| **Dark mode is defined twice** in `src/index.css` (`.dark` and the `prefers-color-scheme` block) — ~40 duplicated lines that must be kept in sync. |

---

## Questions the book itself does not answer

- **Forced Progression against a training max** — does the increment apply to the true 1RM or the TM?
  Silent. Only bites once Specificity's Bulgarian cluster exists.
- **Conditioning day placement** — the book fixes the count, not the days. Declared deviation.
- **Weight rounding** — no rule anywhere in 160 pages. **The audit confirmed this across the whole
  book**, so our nearest-with-ties-down deviation rests on a verified premise.
- **No absolute load is printed for Grey Man anywhere.** Every prescription in pp.48–53 is a
  percentage, and the p.52 worked example is percentages and reps too. So there is no printed
  pound-denominated working weight to use as a fixture — `test/greyman.test.ts` asserts instead that
  the arithmetic is unit-agnostic, which is what the concern was really about.
