# Backlog

The durable list of outstanding work. **Nothing here is "remembered" anywhere else** — if it is not in
this file it will be forgotten. Add to it rather than relying on a chat thread.

**Last reviewed: 2026-08-24** (F1 closed the same day), after working the eight-agent audit end to end and then re-reading all
eight reports finding by finding to make sure nothing was quietly dropped. IDs like `code-03 F7` are the
audit's own numbering — `docs/audit/` has the evidence, with page references and `file:line`.

**Status: 322 unit + 68 e2e green** · typecheck (covering `src`, `test`, `e2e` **and** `functions`),
lint and build clean · deployed to tb2 as **v44**.

---

## How to read this

The audit's ranked summary listed ~44 items. The individual reports contain **more than that** —
`code-03` alone has 27. **Every ranked item is done.** The "Still open" section below is the honest
remainder, re-derived by walking all eight reports rather than trusting the summary.

---

## Done — 2026-08-24

### Designed with Josh first, then built

| ID | Item | Commit |
|---|---|---|
| — | **Four design decisions recorded before any code.** `docs/mass-design.md` §11, binding on the implementation. | `762ddd4` |
| **A1** | **Forced Progression — the programme now progresses.** *The* critical finding: nothing in `src/` wrote a non-zero `progressedKg`, so block 4 prescribed exactly what block 1 did. Block-boundary prompt, per-lift "struggled" marker, 10% failure drop as an action. Blocks stamped **by start date**, not index. | `4b0981c` |
| — | **Forced Progression, second pass.** Increment sized by lift (4.5 kg lower / 2.5 kg upper) and a three-way `full / eased / hold` decision. The full argument — what the book does and does not say — is `docs/mass-design.md` **§12**. | `984657b` |
| **A5** | **Automatic on-device backups.** Dexie **v3** `snapshots` store, daily on app open and before every destructive action. Safe *by construction*: every destructive path clears tables **by name**. Retention 5 routine / 5 guard. Restoring snapshots first. `BACKUP_VERSION` stays **2**. | `d266e61` |
| **A15** | **The guided planner** at `/next-cycle`, replacing the dead "Resume" button. Two-tier guardrails; presets are a **list** with mandatory page citations. | `d266e61` |
| **F1** | **Two sessions in one day.** A date now holds one lift-family row and one cardio-family row — never two lifts, which is Josh's own rule and therefore the discriminator, so there is no slot index. Closes **code-01 F7** properly (a Strava run and an evening lift coexist) and gives same-day Green conditioning somewhere to be ticked (p.99). Adds pulling tomorrow's session forward, with the borrowed day showing as covered. **No Dexie migration** — `sessions.date` was already non-unique and the assumption lived in the reads; a unique compound index was rejected because it populates over existing rows and one stray duplicate would stop the database opening. `docs/mass-design.md` §13. | *this session* |

### Book fidelity

| ID | Item | Commit |
|---|---|---|
| book-03 F1 (A4) | Green conditioning can share a lifting day (p.99). Black still refused on lifting days. | `fc351b2` |
| book-01 F2 / book-02 F6 (A9) | The 5th set is reachable — the book's only sanctioned outlet for surplus energy (p.51, pp.64–65). | `d3e0ad3` |
| book-01 F3 | Rest is per cluster — 2–5 min main, 1–2 min S (pp.52–53) — not a flat 120 s. | `d3e0ad3` |
| book-01 F4 / book-02 F13 | The failure ladder is in the book's **order**: rest first, 10% only if still failing. | `4b0981c` |
| book-01 F6 | A bodyweight exercise with no `maxReps` no longer plans zero reps. | `b31f5b3` |
| book-01 F7 / book-04 F1, F10 | Doc corrections: the 3-week decision is book-cited; the "two-week grid" wording; the A/B comment. | `278c5d9`, `984657b` |
| book-01 F10 | The dead en-dash assertion, plus the execution notes now assert the failure ladder's order. | `d3e0ad3` |
| book-02 F4, F5 (A7, A1c) | Weighted bodyweight: bodyweight is inside the sum, and a missing one refuses rather than defaulting to 0. | `eff85ef` |
| book-02 F7, F8 | Test-set range corrected to **2–3** (p.63, p.90); p.63's post-test rest surfaced. | `d3e0ad3` |
| book-02 F9 | Skipping Base Building is book-sanctioned (p.18, p.151), not a deviation. | `278c5d9` |
| book-02 F11 | Exercise order is the trainee's choice (p.63) — the Guide says so. | `1ecbccf` |
| book-02 F12 / book-03 F12 | Core work no longer eats an S-cluster slot (p.65). | `d3e0ad3` |
| book-02 F14 / book-04 F3, F4 (A14) | `defaultPlan()` is the p.140 Standard Cycle truncated where Specificity would begin. | `d266e61` |
| book-03 F2 (A12) | Extra-curricular activity consumes the conditioning allowance (p.110), counted from whatever Strava sends. | `d3e0ad3` |
| book-03 F3, F6, F8 (A13) | Duration caps reach the screen (p.111 + each session's page); hardgainer caps restored; `capMin` is read. | `d3e0ad3` |
| book-03 F4, F11 (A13) | A stored pick is validated against the block's colour. | `d3e0ad3` |
| book-03 F5 | The 10-minute Recovery Run exemption (p.102). | `d3e0ad3` |
| book-03 F7 / code-02 F10 | The over-cap warning can now actually fire — it reads real weekly load. | `d3e0ad3` |
| book-04 F6, F14 | Ratio guidance and the no-General guardrail, in the planner. | `d266e61` |
| book-04 F9 (A15) | End of plan is the planner, not a dead button. | `d266e61` |
| book-04 F15 | Consecutive blocks are no longer identical. | `4b0981c` |
| code-03 F14 (D1) | **The Guide rewritten from the extraction.** It taught Base Building, Operator, the Golden Rule and a training max — two of which Mass Protocol explicitly contradicts (p.63, p.65). | `1ecbccf` |

### Correctness and data safety

| ID | Item | Commit |
|---|---|---|
| code-01 F1 (A5) | "Load demo history" wiped real history with no confirmation. | `d266e61` |
| code-01 F2 (A6) | Autosave could write two rows for one date. Saves serialised; `sessionForDate` merges duplicates **field by field**. | `678156a` |
| code-01 F3 (A10) | A failed export no longer stamps `lastBackupAt` and disarms the nudge for a fortnight. | `d266e61` |
| code-01 F4 (A8) | Maxes keystroke-delete destroyed `progressedKg`. | `4b0981c` |
| code-01 F5 (A11) | The `importBackup` rollback branch — "the highest-value missing test in the repo" — tested, and **mitigated**: a `pre-import` snapshot now lives in the DB, not just a local variable. | `d266e61` |
| code-01 F6 | The Strava delete invariant lives in `deleteSession`, where a call site cannot forget it. | `678156a` |
| **code-01 F7** | **A Strava run row is no longer overwritten into a lift row.** First by refusing the save, visibly; then **properly**, by letting both rows exist (F1 above). Under MASS this is a normal week — Green *is* the running — not a corner case. | `0a8bf9f`, *this session* |
| code-01 F8 | `saveSettings` is transactional. | `678156a` |
| code-01 F10 | Duplicate dates no longer double-count — `sessionForDate` collapses them. | `678156a` |
| **code-01 F11** | **`parseBackup` skipped the version gate when `version` was not a number** — a file with `"version": "3"` imported as if current. Now refused. | `0a8bf9f` |
| code-02 F1 (A1b) | An S-cluster loading-kind change could reinterpret a stored 1RM. | `eff85ef` |
| code-02 F3 (A16) | Plan starts snap to a Monday; a *stored* mid-week start is reported as an error. | `d266e61` |
| code-02 F4, F6, F7 (A17) | Three ways a session rendered nonsense; `blockWeeksOf` coerces every read. | `b31f5b3`, `d266e61` |
| code-02 F5 (A18) | `exhausted` is surfaced; so is `underFloor`, which means "you need assistance" and rendered a bare 0 kg. | `b31f5b3`, `1ecbccf` |
| code-02 F9 | `perSide` and `totalKg` agree on off-grid plate sizes. | `678156a` |
| code-02 F13 | The A/B rule only rotates for an **odd** weekly count. Named (`alternationRotates`) and pinned by a test rather than "fixed" — see below. | `1ecbccf` |
| code-02 F14 | Dead code: `overCeiling` removed; `exhausted`/`underFloor`/`capMin` now read; `deltaKg`, `findExercise`, `sets()` kept — real API with test coverage. | `1ecbccf` |
| code-02 F16 | `NaN`/`Infinity` are guarded in `loadBar`. | *(pre-existing)* |
| — | **OAuth `state` parameter** and a **same-origin check** on `POST /api/strava/token`. | `9e49e5f` |
| — | `functions/` typechecked (`tsconfig.functions.json`) — which immediately found a dead guard. | `9e49e5f` |

### UI and journey

| ID | Item | Commit |
|---|---|---|
| code-03 F1, F9 | A custom S exercise can be given a 1RM; S previews use S percentages. | `b31f5b3` |
| code-03 F2 (A3) | `Program.tsx` reads the resolved position, not stale settings. | `b31f5b3` |
| code-03 F3 (A15) | Today no longer bricks at the end of a plan. | `d266e61` |
| code-03 F4 | **A new install now hears the words "Grey Man"** — onboarding offers a programme and lands on `/maxes`. | `7842e04` |
| code-03 F5, F6, F8 | The weight input; the plate line's loaded total; an exhausted inventory. | `b31f5b3` |
| code-03 F7 | `/plan` no longer scrolls sideways at 390 px (verified `scrollWidth === clientWidth === 390`). | `d266e61` |
| code-03 F10 | Bodyweight exercises no longer get a "Weight on the bar" kg field. | `7842e04` |
| code-03 F11 | `/maxes`, `/plan`, `/progression`, `/next-cycle` have a back link. | `7842e04` |
| code-03 F12, F13 | "Set your 1RM for X" is a link; Bridge Test Day links to `/maxes`. | `7842e04` |
| code-03 F15 | Finishing a session goes to Today. | `7842e04` |
| code-03 F16 | The 5th set. | `d3e0ad3` |
| code-03 F17, F18 | S-cluster add says why it refuses at 6; an emptied list says the example is running. | `d266e61` |
| **code-03 F26** | **"Bridge Week" was offered as a standalone programme** in Settings. It is a block you put in a plan (p.92), not a thing you run. | `0a8bf9f` |

### Tests

| ID | Item | Commit |
|---|---|---|
| code-04 G1 | The import rollback path. | `d266e61` |
| code-04 G2 | **The mixed-protocol fixture** — "precisely why the contamination bugs survived". Writing it found a real hole; see below. | `1ecbccf` |
| code-04 G3 | `Program.tsx` reads the plan (assertions still thin — still open). | `b31f5b3` |
| code-04 G4 | Migration covered one state of five; fresh/empty and settings-only added. | `1ecbccf` |
| code-04 G6 | §7 fixtures 5 and 6 are arithmetic now, not prose. | `4b0981c` |
| code-04 G13 | DST/year-boundary date fixtures. | *(confirmed sound in the audit)* |
| code-04 G14 | The Guide. | `1ecbccf` |
| code-04 G15 | `test/__tmp_downgrade.test.ts` removed. | *(gone)* |
| code-04 G16 | `e2e/COVERAGE.md` rewritten — it claimed 39 tests; there are 64. | `1ecbccf` |

---

## Three things worth carrying forward

**1. The bug that proves "verify in the running app".** The progression choices were seeded from the
suggestion inside a `useEffect`, but `useSessions()` and `useAllOneRm()` both return `[]` while
IndexedDB loads — so every lift proposed a full increment, **including ones marked "struggled"**. Every
unit test passed. The screen showed it in one look. The state is now *derived*, never copied, and
`e2e/progression.spec.ts` asserts against seeded history because unit tests structurally cannot.

**2. A result that looks like a bug and is not.** A 2.5 kg increment is only 1.75 kg at 70%, below what
the plates can express, so the bar sometimes does not move. Forced Progression guarantees
**non-decreasing per block and strictly heavier across the span** — not a jump every block. It is also
part of why lower-body lifts take 4.5 kg. `test/progression.test.ts` says so explicitly.

**3. A name check is not a protocol check.** `applyBeginnerProgress` compared exercise names against
LP_A/LP_B — but names collide across programmes *by design*: a Grey Man S cluster may legitimately
contain `Goblet / Front-rack Squat`, which is also LP_A's first lift. It now takes `phaseId` as a
**required** argument. **Scope by protocol, never by anything else.**

---

## Still open

### Required before the app is "finished" — Josh, 2026-08-24

| ID | Item |
|---|---|
| **E1** | **Specificity Alpha and Bravo.** *"We need to add Specificity before this app is finished."* Without it the app cannot run the book's Standard Cycle (p.140) or any General:Specificity ratio (pp.141–142), and the default plan has to stop at the bridge. Extracted in sections 05 and 06. Alpha has separate MS and H grids plus a deadlift override (pp.74–75). Where `tm90` and the Bulgarian cluster finally matter. The planner's ratio and no-General warnings are written and waiting. **Also unblocks `book-04 F5`** — the three p.142 worked examples cannot currently be built. |
| **E6** | **A second plan preset** once E1 lands. `PLAN_PRESETS` is already a list; add the full p.140 cycle and a 2:1 preset (p.142). Every preset carries a page citation. |

### Book fidelity — small, real, unaddressed

| ID | Item |
|---|---|
| book-01 F5 | **Main and supplementary clusters render as one flat list** on the Session screen, despite p.50 stressing they have separate structures. Rest is now per-cluster, but visually they are still one undifferentiated column. |
| book-01 F8 | **A/B restarts at every block, so two A days meet across the seam** of adjacent blocks. The book does not address it (Ambiguity §18). Decide and declare, or leave and document. |
| book-01 F11 | **"Four days off" (p.48) vs "3 days of conditioning" (p.39)** — the book's own tension, unresolved in our text. |
| book-03 F9, F10, F11 | Three small transcription/wording gaps in conditioning `detail` strings, a code comment misdescribing the default-days deviation, and Endurance Predator's card rendering a stray separator. |
| book-04 F2 | **Block numbering diverges from the author's own count** — he counts the Bridge as one of five blocks (p.141); we number training blocks. Cosmetic, but confusing read against the book. |
| book-04 F13 | **The Consolidation checklist (p.147) is not a flow.** Ten ordered steps the app could walk a first-timer through; today it is prose in the Guide. |
| book-04 F12 (E5) | **OMS Protocol** (pp.144–145) — its 3–6 week blocks are the one book-sanctioned non-3 length, and would need the planner's hard block-length rule relaxed per protocol. |

### Correctness — small, real, unaddressed

| ID | Item |
|---|---|
| code-01 F9 | **`parseBackup` validates table shape but never row shape.** A malformed session row imports and blows up later, at render. The version gate is solid now (F11); the rows are not. |
| code-02 F8 | **`before` and `complete` pin `day`/`week`**, and those values get written into history if a session is logged in either state. |
| code-02 F12 | **Deleting every block silently reverts to the stale `phaseStartDate`**, which under a plan is months out. Should refuse, or clear both. |
| code-02 F15 | **`loadBar` allocates memory proportional to the target weight.** Fine at human loads; unbounded in principle. |
| code-02 F17 | **S-cluster exercise ids come from the display name with no collision check.** Two exercises slugging to the same id would share a 1RM. |
| code-03 F19 | **Deleting a block has no confirmation**, and an empty plan turns every day into "Rest". |
| — | **`sessions.date` is not a unique index** — now deliberate (F1): a date legitimately holds two rows, and uniqueness is a property of `(date, family)` that the code enforces. An engine-level unique index was considered and rejected; `docs/mass-design.md` §13 says why. |

### UI polish — unaddressed, low severity

| ID | Item |
|---|---|
| code-03 F20 | Beginner's dumbbell progress panel still leads History, even on Grey Man. |
| code-03 F21 | "Barbell strength" on History lists three dumbbell lifts. |
| code-03 F22 | The header pill shows the current phase, not the day being viewed. |
| code-03 F23 | A flash of `DEFAULT_SETTINGS` renders before IndexedDB resolves on some screens. |
| code-03 F24 | Small tap targets remain on Plan and Settings. |
| code-03 F25 | Nav links expose no accessible name. |
| code-03 F27 | S-cluster exercise names truncate. |
| — | **Dark mode is defined twice** in `src/index.css` — ~40 duplicated lines to keep in sync. |
| — | **`EXERCISE_INFO` has no barbell lifts**, so Bench/Squat/OHP/Deadlift have no form content. Needs real coaching content, not invented content. |

### Tests — unaddressed

| ID | Item |
|---|---|
| code-04 G5 | Switching Beginner → Grey Man is never tested through the UI. |
| code-04 G7 | Three `planExercise` branches are never reached. |
| code-04 G8 | `loadBar`'s `pairs` cap and `exhausted` flag are thinly tested. |
| code-04 G10 | Strava write-back for a barbell session is untested. |
| code-04 G11 | **One genuinely flaky e2e** — `greyman.spec.ts` died once on `page.goto` with `net::ERR_ABORTED`, passed on retry. With no CI that trains "just re-run it". |
| code-04 G12 | Conditioning edge cases. |
| code-04 G3 | `Program.tsx` now reads the plan but still has thin assertions. |

### Deferred by Josh

| ID | Item |
|---|---|
| B1 | **Second Strava API app for `tb2`** — **deferred 2026-08-24. Don't keep raising it.** Strava does not work on tb2 until it exists, which is fine while he is months from switching. When wanted: register at `strava.com/settings/api` with callback domain `tb2.joshua-birch.co.uk`, send the **client ID** (secret goes in the `tb-app-v2` Pages env, never the repo), and move the client ID into build config. Consequence: the OAuth `state` and same-origin checks are unit-tested but have never run against real Strava. |
| — | **Rate limiting on `/api/strava/token`.** The same-origin check stops cross-site abuse; it cannot stop curl, and nothing in a public SPA can. Only worth doing if it is ever seen being hit. |

### Not built (deliberate)

| ID | Item |
|---|---|
| E2 | **Mass Template, Gladiator, Fighter HT** — extracted (sections 03, 04). One file each plus registration. All three need AMRAP and peaking, which Grey Man has not. **Fighter HT trains twice a week and therefore hits `alternationRotates`** — read p.60 before deciding what it should do. |
| E3 | **Base Building** — skipped by choice and **book-sanctioned** for a runner (p.18, p.151). Extracted in section 02. Its real argument is connective-tissue preparation, not cardio. |
| E4 | **Nutrition and supplements** — extracted (section 08). Two calorie/macro formulas (pp.120–121). The Guide points at the book and MacroFactor instead. |

---

## Questions the book itself does not answer

- **Forced Progression against a training max** — true 1RM, or the TM? Silent. Only bites once
  Specificity's Bulgarian cluster exists.
- **Which lift gets 5 lb and which gets 10** — **ANSWERED as far as it can be, 2026-08-24.** MASS never
  differentiates; Tactical Barbell I does (10 lb lower, 5 lb upper) and MASS's range is exactly those
  two numbers, so the app applies the split as a labelled deviation (`docs/mass-design.md` §12). The
  *cadence* half of the same sentence turned out **not** to be open: p.64's heading and p.90 both say
  "from block to block", so it is every block.
- **Conditioning day placement** — the book fixes the count, not the days. Declared deviation.
- **Weight rounding** — no rule anywhere in 160 pages, verified across the whole book.
- **No absolute load is printed for Grey Man anywhere** — every prescription is a percentage, so there
  is no pound-denominated working weight to use as a fixture. `test/greyman.test.ts` asserts instead
  that the arithmetic is unit-agnostic, which is what the concern was actually about.
