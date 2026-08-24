# Audit summary — 2026-08-23/24

Eight independent audits of the MASS rebuild: four checking the app against the book, four checking the
code. Each wrote its own report in this directory; this file is the consolidated, ranked action list.

**Status:** 7 of 8 reports complete. `code-03-ui-gaps.md` was still running when this was written.

**One finding was fixed during the audit rather than filed** — see A0.

---

## How to read the classes

- **(a) contradicts the book** — the app does something the book says not to, or omits something it says
  to do. These are the ones the whole rebuild exists to prevent.
- **(b) fills a gap** — the book is silent; the app had to choose. Fine, but it should be *declared*.
- **(c) our own docs are wrong** — extraction or design doc misstates the book.
- **(d) declared deviation** — working as intended.

---

## The headline

**The transcription is sound. The engine around it is not.**

Every audit that checked printed numbers against the code found them faithful — the Grey Man grid is
right in all 18 cells, all eight conditioning cards are word-for-word, the block-length decision is
correct (and better supported than we claimed), the rounding deviation rests on a true premise, and the
v1→v2 migration is genuinely safe. The failures are almost all in the layer that turns that data into a
week of training, plus a cluster of data-safety issues that predate MASS.

**The single most important finding: the programme does not progress.** Three separate audits found it
independently. `progressedKg` is read and displayed but the only thing in the entire app that writes a
non-zero value is the demo seeder. Run the default plan and block 4 prescribes exactly what block 1 did.
Forced Progression is not a missing convenience — the book calls it the mechanism by which the whole
protocol works, and prints the rule on six separate pages.

---

## Ranked action list

### A0 — DONE during the audit
**Cross-protocol write corruption.** `Session.tsx`'s `finish()` gated on `plan.type === 'lift'`, so
finishing a Grey Man session ran Beginner's linear progression, which maps exercises onto LP_A/LP_B *by
array position*. Proven: bench 55 kg and squat 70 kg on the bar wrote `{bg_squat: 55, bg_bench: 70}` —
barbell totals as per-dumbbell weights, on the programme Josh actually uses. Fixed at the call site and
hardened in `applyBeginnerProgress`; four regression tests. Commit `e39c9ab`.

### A1 — Forced Progression is not implemented · **critical** · (a)
*book-01 F1, book-02 F1/F2, book-04 F15, code-04 §7*

Nothing writes `progressedKg`. No "struggled with this lift" flag, so the second half of the rule
("Don't force progression for exercises you struggled with", p.53) cannot be honoured either. The 10%
failure drop exists only as English prose in `EXECUTION_DETAIL`.

**Rectify:** a per-lift progression step at a block boundary (+2.5 kg default, per-lift skip), a
"struggled" marker, and a one-tap 10% drop. Then a fixture asserting block 2 loads exceed block 1.

### A1b — Loading kind and the stored 1RM's unit can disagree · **critical** · verified
*code-02 F1*

`planExercise` (`greyman.ts:172`) dispatches on `ex.defaultLoading` and **never reads
`OneRmEntry.unit`**. The S-cluster loading dropdown (`Plan.tsx:229`) lets the kind be changed with a 1RM
already stored, so a 100 kg *barbell* max becomes **70 kg per dumbbell**, and a 30 kg/DB max becomes
"bar only". This is the exact factor-of-two error the `maxScope` design exists to prevent — it just
comes in through the loading kind instead of the protocol.

**Rectify:** resolve loading from the stored `unit` where one exists, or refuse to compute when they
disagree and prompt for a re-test. Changing the kind should invalidate the max, not silently reinterpret it.

### A1c — Weighted bodyweight prescribes a dangerous load when bodyweight is unset · **critical** · verified
*code-02 F2, book-02 F5*

`settings.bodyweightKg` is unset by default and `greyman.ts` falls back to `0`. A 120 kg system 1RM at
70% then prescribes **84 kg hung off a dip belt** instead of the correct −1 kg, which means "you need
assistance". This is the failure p.90 gives a full-page warning about, and it is a physical-injury risk
rather than a data one.

**Rectify:** never default bodyweight to 0 — refuse to compute and prompt for it. Combine with A7.

### A2 — Read-path contamination between protocols · **critical** · (a)
*code-04 G2*

`beginnerStall`, `beginnerProgress`, `liftHistory` (`src/beginner.ts`) and `lastPerformance`,
`liftRecords`, `sessionVolume` (`src/lib/stats.ts`) all filter `type === 'lift'` with **no `phaseId`
filter**. A0 fixed the write path; these still read across protocols, so a 100 kg barbell squat can
poison a 10 kg dumbbell stall check, PR detection and volume totals. No fixture in the repo mixes two
protocols, so nothing would notice.

**Rectify:** add a phase filter to every one of the six. Add a mixed-protocol fixture — its absence is
why this survived.

### A3 — `Program.tsx` is plan-blind · **critical** · (a)
*book-04 F11, code-04 G3*

The main schedule screen ignores `settings.plan` entirely (`Program.tsx:84,151` use `currentPhaseId` +
`phaseStartDate`). With a plan active it shows Grey Man during the bridge week while Today correctly
shows the bridge. `Today.tsx:26` has the same latent bug — `useMaxesFor(settings.currentPhaseId)` should
be `pos.phaseId`.

**Rectify:** drive both from `resolvePosition`. Zero e2e assertions exist on `Program.tsx` — add some.

### A4 — Green conditioning can never land on a lifting day · **critical** · (a)
*book-03 F1*

`sessionFor` only injects conditioning when the resolved plan is `rest`, so conditioning is structurally
confined to rest days. The book: *"Sessions can be conducted on non-lifting **or lifting** days"* (p.99).
The Plan screen's day picker therefore lies — three of Grey Man's seven day buttons can be lit and
produce nothing.

**Rectify:** attach conditioning to the day independently of the lifting plan, and surface it alongside a
lift rather than instead of one. Black stays non-lifting-only (p.99).

### A5 — "Load demo history" can destroy real data in one tap · **critical**
*code-01 F1*

No confirm, no DEV gate, no undo, sitting directly below Export. Clears sessions, maxes and `oneRm`,
replaces settings, and sets `lastBackupAt: now` so the backup nudge goes quiet afterwards. Worse than
`BACKLOG.md` C3 records — "Reset to clean" at least confirms.

**Rectify:** confirm dialog at minimum; ideally DEV-gate both and auto-export first.

### A6 — Autosave can write two rows for one date · **major**
*code-01 F2*

`Session.tsx:357` fires `save()` un-debounced and unserialised; two rapid taps both read "no existing
row" and both `put` without an id. The second row is unreachable (`.first()` returns the lowest id),
undeletable, and `stravaSync`'s `byDate` map keeps the *last* — so Strava enrichment lands on the
invisible one. This is the concrete failure behind the long-known "`sessions.date` is not unique".

**Rectify:** serialise saves behind a promise chain; add a unique index or a dedupe on read.

### A7 — Weighted-bodyweight loading is unsafe · **major** · (a)
*book-02 F4/F5*

`Maxes.tsx:42` treats only `bodyweightReps` as bodyweight, so a *weighted* bodyweight exercise gets a
plain "kg on bar" field with no instruction to include bodyweight — a warning the book gives a full-page
callout (p.91). And `greyman.ts:204` defaults a missing `bodyweightKg` to 0, producing exactly the
"things will get too heavy too fast" failure p.90 warns about.

**Rectify:** treat both bodyweight kinds in the maxes form, prompt for the system max explicitly, and
refuse to compute rather than defaulting bodyweight to 0.

### A8 — Maxes keystroke-writes destroy Forced Progression state · **major**
*code-01 F4*

`Maxes.tsx:108,116` `delete` the `oneRm` row whenever the field is empty or zero. Clearing a field to
retype loses `progressedKg` (the only record of accumulated progression) and `testedAt`.

**Rectify:** debounce, and never delete on an empty intermediate value — only on an explicit clear.

### A9 — The 5th set cannot be performed · **major** · (a)
*book-01 F2, book-02 F6*

`planExercise` uses `setsMin`, so "4–5 × 8" always renders 4 and `setsMax` is unreachable. This removes
the book's only sanctioned outlet for surplus energy (p.65; p.152 "Add extra sets instead").
Usefully, 4 as the *default* is better supported than we argued — p.52's own walkthrough says "4 sets of
8/70%".

**Rectify:** an add-set control on the session. Cite p.52 for the default and p.65 for the option.

### A10 — Backup can silently stop existing · **major**
*code-01 F3*

`backup.ts:5` revokes the blob URL synchronously after `a.click()` (fragile on iOS PWA) and sets
`lastBackupAt` unconditionally — so a *failed* download disarms the nudge for 14 days.

**Rectify:** revoke on a timeout, and only stamp `lastBackupAt` on evidence of success.

### A11 — The import rollback path has no test · **major**
*code-04 G1*

`importBackup` clears all four tables before writing. If the snapshot restore is broken, everything is
lost silently. Testable today with `vi.spyOn(db.sessions, 'bulkPut').mockRejectedValueOnce(...)`.

### A12 — Extra-curricular activity does not consume the conditioning allowance · **major** · (a)
*book-03 F2*

*"…it counts as one of your conditioning sessions"* (p.110). Josh runs with Runna and `stravaSync`
auto-logs any run into the current phase, so his real week can exceed the book's cap invisibly. The
audit called this the finding with the most real-world bite for him specifically.

### A13 — Missing duration caps and unvalidated picks · **major** · (a)
*book-03 F3/F4*

The p.111 flat caps (Green ≤60 min, Black ≤20) are absent; Anabolic Sprints has no cap at all; `capMin`
is stored but read by nothing; and a stored session pick is never validated against the block's colour,
so a Black session could render inside a General block.

### A14 — `defaultPlan()` silently departs from the Standard Cycle · **major** · (a)
*book-04 F3/F4*

It moves the bridge week and drops the terminal bridge, and the Plan screen cites the Standard Cycle
without its printed week counts. Neither is declared.

### A15 — Dead "Resume" button at the end of a plan · **major**
*book-04 F9* — plus no reassess/next-cycle prompt (p.140, p.147).

### A16 — A non-Monday plan start rotates the whole week · **major** · verified
*code-02 F3*

The plan start date is a free `<input type="date">` and `resolveInPlan` derives the weekday from
days-since-start. Start on a Wednesday and Grey Man's Mon/Wed/Fri lands on Wed/Fri/Sun — still labelled
"Mon". **Rectify:** snap the picker to Mondays, or normalise on read.

### A17 — Three ways a session renders nonsense · **major** · verified
*code-02 F4/F6/F7*

- A bodyweight exercise whose `oneRm` row lacks `maxReps` renders **four sets of 0 reps** — the `!entry`
  guard only catches a missing row, not a row missing the field it needs.
- `Maxes.tsx:50` keys off `currentPhaseId`, so with a plan running it edits the **wrong scope** and the
  MASS lifts stay blank forever. Same root cause as A3.
- A non-integer block length makes `GM_GRID[1.5]` undefined and blanks the session.

### A18 — `exhausted` is computed and never read · **major**
*code-02 F5*

Run out of plates and the app shows 70 kg against a 120 kg target with no warning at all. The flag
exists; nothing surfaces it. Same for `deltaKg` and `overCeiling`.

---

## Corrections to our own documentation · (c)

| | |
|---|---|
| **Skipping Base Building is NOT a deviation.** p.18: *"If you already have a current/established endurance base of some kind, (i.e. runner…) feel free to skip it."* p.151 FAQ: *"No. Base Building is optional…"* Josh is a runner — the exact case named. Carrying a false deviation devalues the real ones. *(book-02 F9)* | Remove from the deviation table; record as book-sanctioned, and note the book's actual caveat: the SE work is about **connective tissue before heavy barbell work**, not cardio. |
| **The 3-week block decision is under-cited.** p.67 (*"Specificity blocks are three weeks in length. You can run one or more blocks"*) plus the fact that **no template grid extends past week 3** make a literal 6-week block unrunnable from the book. It is settled by the book, not by judgement. *(book-04 F1)* | Restate as book-derived; demote "community practice" to a footnote. |
| **"The book prints a two-week grid (p.50)"** — it prints **three** week rows; the two-week *period* is a consequence. `protocol.ts:177,179`, `greyman.ts:131,133`. *(book-01 F7)* | Fix the wording. The logic and its tests are correct. |
| **A dead test assertion.** `greyman.test.ts:342` asserts `not.toMatch(/5–10%/)` with an **en-dash**; the string contains neither form, so it can never fail. *(book-01)* | Assert something real. |
| **The p.104 GREEN banner anomaly is a non-issue** — p.98 settles it and the app already has it right. *(book-03 F0)* | Note it in the extraction so nobody re-investigates. |

---

## Confirmed sound — do not re-audit

- **Grey Man's grid**: all 18 cells of p.51 correct; S row correctly flat-4, not a range.
- **The A/B alternation**: reproduces all nine printed sessions; restarting each block is right.
- **No AMRAP/peaking in Grey Man**: correct, unlike the other three templates.
- **1RM not training max**: pp.88–89 is the only TM mention in the book, Bulgarian-scoped. `tm90` living
  on `Prescription` is the right altitude.
- **The rounding claim**: searched all 160 pages — no rule exists, and the only near-miss (p.31
  "ballpark") is Base-Building-SE-scoped exactly as `barbell.ts` argues.
- **Units**: no metric anywhere in the book; because every prescription is a percentage, the kg
  conversion distorts nothing.
- **Bridge Week**: `TEST_DAYS = [3,4]` matches the p.92 table cell for cell; optional framing matches p.93.
- **All eight conditioning cards**: word-for-word, including the book's own inconsistent capitalisation.
- **The v1→v2 migration**: add-store-only, atomic, interruption rolls back cleanly. **And the
  stale-build-opens-v2-DB scenario was tested empirically — Dexie catches the `VersionError`, reopens at
  the existing version, the old build reads its three stores normally and `oneRm` survives. A non-event.**
- **Backups**: all four tables covered, Strava tokens provably never exported, import is one atomic
  4-table transaction, phase-id coercion correctly conditional, v1 files round-trip with unknown keys
  preserved.
- **The plate math is proven.** `loadBar`'s nearest-with-ties-down rule was checked against an
  independent brute-force knapsack across **13 inventories × 1,041 targets with zero mismatches**,
  including limited `pairs` and the greedy-fails `[15,10]` case. Reconstructed `perSide` always summed to
  `totalKg` on grid-aligned plates, and `bodyweightReps` ties down exactly.
- **Dates are DST-clean.** `diffDays` was fuzzed over 3,000 days across both 2026 Europe/London
  transitions: zero errors. The weekday bug in A16 is the start date, not DST.

---

## Also noted

- **Off-grid plate sizes silently disagree**: with 1.1 kg plates, `perSide` and `totalKg` diverge (says
  22 kg, weighs 22.2). Only bites if a non-0.25 kg plate is configured. *(code-02 F9)*
- **`ordinal % 2` degenerates for an even number of lifting days** — fine for Grey Man (3/week), but
  Fighter HT is 2/week and would never alternate. Worth knowing before that template is built.
  *(code-02 F13)*
- **Dead code**: `exhausted`, `deltaKg`, `overCeiling`, `findExercise`, `sets()`, `capMin`, and
  `BEGINNER_PROTOCOL` inside `SELECTABLE_PROTOCOLS` (filtered straight out as `'legacy'` by its only
  consumer). *(code-02 F14)*
- One **genuinely flaky e2e**: `greyman.spec.ts:69` died on `page.goto` with `net::ERR_ABORTED` and
  passed on retry. With no CI, that trains "just re-run it".
- `Maxes.tsx` hardcodes `[70,75,80]`, a second copy of `GM_GRID` that can drift.
- `e2e/COVERAGE.md` is stale — claims 39 tests, dated 2026-08-21, still says `/maxes` doesn't exist.
- The design doc's §7 fixture list is **4 of 7 done**; #5 and #6 describe behaviour that does not exist.
- MASS fixtures use synthetic round kg; the design's own "assert in lbs against the book's printed
  examples" rule is honoured only in `calc.test.ts`.
