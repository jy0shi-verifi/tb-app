# Backlog

The durable list of outstanding work. **Nothing here is "remembered" anywhere else** — if it is not in
this file it will be forgotten. Add to it rather than relying on a chat thread.

**Last reviewed: 2026-08-24, after the eight-agent audit.** Full evidence for every item below is in
`docs/audit/` — `00-summary.md` is the ranked synthesis, the other eight files carry the detail with page
references and `file:line`. Where an item cites an ID like `A4` or `code-03 F7`, that is the audit's own
numbering; go there for the reasoning.

Status: `open` · `blocked` · `done`.

---

## Done in the audit fix pass (2026-08-23/24) — for reference, not action

| ID | Item | Commit |
|---|---|---|
| A0 | Cross-protocol **write** corruption: finishing a Grey Man session rewrote Beginner's per-dumbbell weights from barbell totals | `e39c9ab` |
| A1b | A stored 1RM could be reinterpreted in the wrong unit when an exercise's loading kind changed | `eff85ef` |
| A1c | Weighted bodyweight defaulted bodyweight to 0 and prescribed real weight on a dip belt | `eff85ef` |
| A2 | Read-path contamination in `beginner.ts` / `stats.ts` | `eff85ef` |
| — | `test/` and `e2e/` were never typechecked; added `tsconfig.test.json` + `npm run typecheck` | `eff85ef` |
| A3 | `Program.tsx` / `Today.tsx` / `Maxes.tsx` read stale settings instead of the resolved position | `b31f5b3` |
| code-03 F1 | A custom S-cluster exercise could never be given a 1RM | `b31f5b3` |
| code-03 F9 | The maxes preview used main-lift percentages for S lifts (~27% too heavy) | `b31f5b3` |
| code-03 F5 | The Session weight input clipped `102.5` to `10` | `b31f5b3` |
| code-03 F6/F8, A18 | The plate line omitted the loaded total and never surfaced `exhausted` | `b31f5b3` |
| — | Doc corrections: Base Building is not a deviation; the 3-week decision is book-cited; "two-week grid" wording; a dead en-dash test assertion | this commit |

---

## Recently done (2026-08-24, this session)

| ID | Item | Commit |
|---|---|---|
| — | **A5 and A15 designed with Josh before any code**, per this file's own instruction. Four decisions recorded in `docs/mass-design.md` §11 and binding on the implementation. | `762ddd4` |
| **A1** | **Forced Progression — the programme now progresses.** Block-boundary prompt at `/progression`, the `struggled` marker on the Session screen, and the 10% failure drop as an action (with the book's rest-first step in its confirm). Increment defaults to 2.5 kg; 5–10 lb converts to 2.5–4.5 kg, so 5 kg would exceed the book's top end. Bodyweight-reps lifts are listed but refused — their max is a rep count (p.90) and the book gives no rep increment. | `4b0981c` |
| **A8** | Maxes keystroke-delete, fixed as part of A1 because A1 made `progressedKg` real data. Clearing a max is now explicit and confirmed; the row shows "tested 100 → 102.5". | `4b0981c` |
| **A4** | **Green conditioning can share a lifting day** (p.99), rendered alongside the lift on Today, Session and Program. Black still refused on lifting days, enforced where it is read. | `fc351b2` |
| **A14** | `defaultPlan()`'s undeclared departure from the Standard Cycle — *superseded by the §11.3 decision; the replacement lands with A15.* | — |

**One bug worth remembering** (it is why "verify in the running app" is a house rule): the
progression tick boxes were seeded from `suggestProgression` inside a `useEffect`, but `useSessions()`
and `useAllOneRm()` both return `[]` while IndexedDB loads — so every lift came back ticked, including
ones explicitly marked "struggled". **Every unit test passed.** The screen showed it in one look. The
state is now derived rather than copied, which makes the bug unrepresentable, and `e2e/progression.spec.ts`
asserts the ticks against seeded history because unit tests structurally cannot.

**One thing the tests pinned down that looks like a bug and is not:** four blocks of +2.5 kg give
`[70, 72.5, 72.5, 75]` kg on the bar. 2.5 kg on the 1RM is only 1.75 kg at 70%, which is below what the
plates can express, so some blocks repeat. The book has the same property in pounds and says nothing
about it. Forced Progression guarantees **non-decreasing** per block and strictly heavier across the
span — not a jump every block. `test/progression.test.ts` says so explicitly so nobody rounds it up.

---

## Book fidelity — the app contradicts or omits the book

| ID | Item | Evidence |
|---|---|---|
| ~~A4~~ | **DONE** (`fc351b2`) — ~~Green conditioning can never land on a lifting day.~~ `sessionFor` only injects conditioning when the plan is `rest`, so it is structurally confined to rest days. p.99: *"Sessions can be conducted on non-lifting **or lifting** days."* The Plan screen's day picker therefore lies — Mon/Wed/Fri can be lit and produce nothing. | book-03 F1 |
| A12 | **Extra-curricular activity does not consume the conditioning allowance** (p.110). Josh runs with Runna and `stravaSync` auto-logs any run into the current phase, so his real week can exceed the book's cap invisibly. The audit called this the finding with the most real-world bite for him. | book-03 F2 |
| A13 | **Missing duration caps and unvalidated picks.** The p.111 flat caps (Green ≤60 min, Black ≤20) are absent; Anabolic Sprints has no cap; `capMin` is stored but read by nothing; a stored session pick is never validated against the block's colour. | book-03 F3/F4/F6 |
| A9 | **The 5th set cannot be performed.** `planExercise` uses `setsMin`, so "4–5 × 8" always renders 4 and there is no add-set control. This removes the book's only sanctioned outlet for surplus energy (p.65; p.152 *"Add extra sets instead"*). 4 as the *default* is correct — p.52's own walkthrough says "4 sets of 8/70%". | book-01 F2, book-02 F6 |
| A14 | **`defaultPlan()` silently departs from the Standard Cycle** — *resolved by the §11.3 decision: the default becomes `GM, GM, GM, GM, Bridge`, the printed cycle truncated where Specificity would start. Do it as part of A15.*<br>Original finding: — it moves the bridge week and drops the terminal bridge, and the Plan screen cites the cycle without its printed week counts. Neither is declared. | book-04 F3/F4 |
| — | ~~**The failure ladder skips the book's first remedy.**~~ **DONE** (`4b0981c`) — the 10% drop action's confirm now states the order: lengthen rest to 5 min or more first, drop only if still failing (pp.52–53). | book-01 F4 |
| — | **Rest is a flat 120 s for everything.** The book gives 2–5 min for main lifts and 1–2 min for S (p.53), and the session renders both clusters as one undifferentiated list despite p.50 stressing they have separate structures. | book-01 F3/F5 |
| — | **The 10-minute Recovery Run exemption is unmodelled** (p.102) and Strava violates it. | book-03 F5 |
| — | **Hardgainer caps are flattened away**; Endurance Predator's is not even in the text. | book-03 F8 |
| — | **Test-set range advertised as 2–5** where the book says 2–3; p.63's post-test rest is missing. | book-02 F7/F8 |
| — | **Core/ab work is sanctioned by p.65** but has to eat an S-cluster slot. | book-03 F12 |

---

## Correctness and data safety

| ID | Item | Evidence |
|---|---|---|
| A5 | **"Load demo history" destroys real data in one tap** — no confirm, no DEV gate, no undo, directly below Export, and it sets `lastBackupAt` so the backup nudge goes quiet afterwards. **DESIGNED 2026-08-24 — see `docs/mass-design.md` §11.1.** Automatic snapshots into a new Dexie **v3 `snapshots` store**, taken on app open and before every destructive action; they survive `clearAll`/the demo seeder/`importBackup` by construction because all three clear tables *by name*. Restore is a list in Settings, and restoring itself takes a snapshot first. `BACKUP_VERSION` stays 2 — snapshots are never exported. Also softens A10 and A11. | code-01 F1 |
| A6 | **Autosave can write two rows for one date.** `Session.tsx` fires `save()` un-debounced and unserialised; the second row is unreachable and undeletable, and Strava enrichment lands on the invisible one. This is the concrete failure behind "`sessions.date` is not unique". **A4 added a second reason to want this:** a Green session sharing a day with a lift is currently informational only, because one row per date leaves it nowhere to be ticked. | code-01 F2 |
| ~~A8~~ | **DONE** (`4b0981c`) — ~~Maxes keystroke-writes destroy Forced Progression state.~~ Clearing a field to retype `delete`s the `oneRm` row, losing `progressedKg` and `testedAt`. | code-01 F4 |
| A10 | **A failed backup silently disarms the nudge for 14 days** — `lastBackupAt` is set unconditionally, and the blob URL is revoked synchronously after `a.click()` (fragile on iOS PWA). | code-01 F3 |
| A11 | **`importBackup`'s rollback path has no test.** It clears all four tables before writing; if the restore is broken everything is lost silently. Testable with `vi.spyOn(db.sessions, 'bulkPut').mockRejectedValueOnce(...)`. | code-04 G1 |
| A16 | **A non-Monday plan start rotates the whole week** — Grey Man's Mon/Wed/Fri lands on Wed/Fri/Sun, still labelled "Mon". Snap the date picker to Mondays. | code-02 F3 |
| A17 | **A non-integer block length blanks the session** (`GM_GRID[1.5]` is undefined). | code-02 F7 |
| A15 | **Dead "Resume" button at the end of a plan** — `realign` writes `phaseStartDate`, which `resolveInPlan` never reads, so Today bricks with "It's been 0 days". **DESIGNED 2026-08-24 — see `docs/mass-design.md` §11.2–§11.5.** Two moments, two prompts: a **block** boundary fires Forced Progression (A1), the **plan** ending fires the guided planner (p.140 asks for reassessment once a *cycle*, not once a block). The Resume button is *replaced* by the planner. Guardrails are two-tier — hard-block what the book states (3-week blocks p.40/p.67, 1-week bridge p.92, integer weeks → fixes A17, Monday start → fixes A16), warn on what it recommends (ratio p.142, bridge cadence p.93, no-General p.41). Presets are a **list** (§11.5), one entry today. Folds in book-04 F6 and F14. | book-04 F9, code-03 F3 |
| — | **The "never delete a Strava-linked row" invariant exists only in `Today.tsx`** — Session and History delete unconditionally, so deleted runs resurrect on the next sync. | code-01 F6 |
| — | **`saveSettings` is an untransacted read-modify-write** that can revert a rotated Strava refresh token from stale render state. | code-01 F8 |
| — | **Off-grid plate sizes make `perSide` and `totalKg` disagree** (1.1 kg plates: says 22 kg, weighs 22.2). Only bites with a non-0.25 kg plate configured. | code-02 F9 |
| — | **`ordinal % 2` degenerates for an even number of lifting days.** Fine for Grey Man (3/week); Fighter HT is 2/week and would never alternate. Fix before building it. | code-02 F13 |

---

## UI and journey

| ID | Item | Evidence |
|---|---|---|
| code-03 F4 | **A new install never hears the word "Grey Man."** Onboarding is Beginner-only copy with no protocol choice; reaching MASS means knowing to open Settings and change a dropdown. | code-03 F4 |
| code-03 F11 | **`/maxes` and `/plan` are not in the tab bar**, have no back link and no save/done. | code-03 F11 |
| code-03 F12/F13 | **"Set your 1RM for X" is inert text** with no route to the screen that fixes it, and the bridge **Test Day does not link to `/maxes`** — the one screen whose whole job is testing 1RMs. | code-03 F12/F13 |
| code-03 F7 | **`/plan` scrolls sideways at 390 px** and the "Add" button is entirely off-screen. | code-03 F7 |
| code-03 F10 | **Bodyweight exercises get a "Weight on the bar" kg field** on the Session screen. | code-03 F10 |
| D1 | **The Guide tab still teaches Base Building and Operator** — a programme the app no longer runs. Rewrite from the extraction. | code-03 F14 |
| code-03 F15 | Finishing a session navigates back through history rather than to Today. | code-03 F15 |
| code-03 F17/F18 | S-cluster add silently no-ops at 6 with no reason given; emptying S1 or S2 silently restores the book's example instead of honouring the edit. | code-03 F17/F18 |
| book-04 F6 | No General : Specificity **ratio** is shown or guided toward (pp.141–142). | book-04 F6 |
| book-04 F14 | No guardrail against a plan the book discourages (p.41, "I don't recommend excluding General completely"). Unreachable today, reachable once Specificity exists. | book-04 F14 |

---

## Tests

| ID | Item |
|---|---|
| A11 | The `importBackup` rollback branch (above) — the highest-value missing test in the repo. |
| code-04 G4 | **Migration covers one of five states.** Fresh/empty DB, settings-only DB, and an interrupted upgrade are untested. *(The v2-opened-by-old-build case WAS tested empirically and is a non-event — see `code-01`.)* |
| code-04 G2 | **No fixture mixes two protocols**, which is precisely why the contamination bugs survived. Add one. |
| — | The design's §7 fixture list is **4 of 7 done**; #5 (Forced Progression) and #6 (the 10% rule) describe behaviour that does not exist yet. |
| — | MASS fixtures use synthetic round kg; the design's own *"assert in lbs against the book's printed examples"* rule is honoured only in `calc.test.ts`. |
| — | One **genuinely flaky e2e**: `greyman.spec.ts` A/B alternation died once on `page.goto` with `net::ERR_ABORTED` and passed on retry. With no CI, that trains "just re-run it". |
| D2 | `e2e/COVERAGE.md` is stale — it claims 39 tests (there are 55), is dated 2026-08-21, and still says `/maxes` doesn't exist. |

---

## Blocked on Josh

| ID | Item |
|---|---|
| B1 | **Second Strava API app for `tb2`** — deferred by Josh. Register at `strava.com/settings/api` with callback domain `tb2.joshua-birch.co.uk`; send the **client ID** (the secret goes in the `tb-app-v2` Pages env, never the repo). The client ID must then come from build config so the two variants can differ. **Until this exists, Strava does not work on tb2 at all.** |

---

## Required before the app is "finished" — Josh, 2026-08-24

| ID | Item |
|---|---|
| E1 | **Specificity Alpha and Bravo.** Josh: *"We need to add Specificity before this app is finished."* Promoted out of "not built (deliberate)" — the app cannot run the book's Standard Cycle (p.140) or any General:Specificity ratio (pp.141–142) without it, and today's default plan has to stop at the bridge because of its absence (`docs/mass-design.md` §11.3). Extracted in sections 05 and 06. Alpha has separate MS and H grids plus a deadlift override (pp.74–75). This is where `tm90` and the Bulgarian cluster finally matter. |
| E6 | **A second plan preset once Specificity exists.** Josh: *"we can have more than one default (depending on current goal)."* The planner ships with `PLAN_PRESETS` as a list holding one entry; add the full p.140 Standard Cycle and a 2:1 General:Specificity preset (p.142) when E1 lands. Every preset carries a page citation — see §11.5. |

## Not built (deliberate) — the model accommodates all of these

| ID | Item |
|---|---|
| E2 | **Mass Template, Gladiator, Fighter HT** — extracted (sections 03, 04). Each is one file under `src/protocols/` plus registration. All three need AMRAP and peaking, which Grey Man does not have. Fighter HT also needs the even-lifting-days fix (code-02 F13). |
| E3 | **Base Building** — skipped by choice, and **book-sanctioned** for a runner (p.18, p.151), not a deviation. Extracted in section 02 if ever wanted. Worth knowing the book's actual argument for it: connective-tissue preparation for heavy barbell work, not cardio. |
| E4 | **Nutrition and supplements** — extracted (section 08). Two calorie/macro formulas the app could compute (pp.120–121). |
| E5 | **OMS Protocol** (pp.144–145) — its 3–6 week blocks are the one book-sanctioned non-3 block length. |

---

## Questions the book itself does not answer

- **Forced Progression against a training max** — does the increment apply to the true 1RM or the TM?
  Silent. Only bites once Specificity's Bulgarian cluster exists.
- **Conditioning day placement** — the book fixes the count, not the days. Declared deviation.
- **Weight rounding** — no rule anywhere in 160 pages. **The audit confirmed this across the whole book**,
  so our nearest-with-ties-down deviation rests on a verified premise.
