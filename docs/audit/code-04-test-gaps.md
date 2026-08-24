# Test-coverage audit — MASS (Grey Man) rebuild

**Date:** 2026-08-23 · **Branch:** `mass-extraction` · **Auditor:** code review pass 04
**Suites as run:** `npm run test:unit` → 10 files, 155 passed / 1 skipped (2.8 s).
`npm run test:e2e` → **50 passed, 1 flaky** (`greyman.spec.ts:69`, `net::ERR_ABORTED` on
`page.goto`, passed on retry), 1.3 min.

---

## Verdict

The **pure book-math is genuinely well tested** — `barbell.test.ts` and `greyman.test.ts` are the
best work in the repo, and they follow house style properly (assert the printed cell, then assert
the plausible wrong answer). The problem is that testing stops at the edge of the pure functions.
Everything that *writes* — the import rollback, the protocol switch, the Program screen's date
arithmetic — and everything that *mixes* — Beginner history sitting next to MASS history in one
`sessions` table — is either untested or tested only for the happy path. The suspected
cross-protocol contamination bug is real in principle and **no current test would catch it**:
`beginnerStall`, `beginnerProgress`, `lastPerformance` and `liftRecords` all filter on
`type === 'lift'` with no `phaseId` filter, exactly the thing CLAUDE.md warns against, and every
fixture in the repo contains a single protocol's sessions. Two of `docs/mass-design.md` §7's seven
promised fixtures are not implemented as arithmetic (Forced Progression's writer, the 10% failure
drop), and one house-style requirement — assert in lbs against the book's own examples — is not
honoured anywhere. `Program.tsx` and `Guide.tsx` have no assertions at all, and `Program.tsx`
ignores `settings.plan` entirely, which looks like a live bug that no test can currently see.

| # | Gap | Severity |
|---|-----|----------|
| G1 | `importBackup` rollback path never exercised | **critical** |
| G2 | Cross-protocol contamination: no mixed-history fixture anywhere | **critical** |
| G3 | `Program.tsx` ignores `settings.plan`; zero assertions on the screen | **critical** |
| G4 | Migration: empty DB, settings-only DB, interrupted upgrade, v2-opened-by-v1 all untested | **critical** |
| G5 | Protocol switch (Beginner → Grey Man) untested end to end | major |
| G6 | §7 fixtures 5 & 6 (Forced Progression, 10% failure drop) asserted as prose, not arithmetic | major |
| G7 | `planExercise`: `weightedBodyweight`, `unloaded` and `tm90` branches never reached | major |
| G8 | `loadBar` `pairs` cap and `exhausted` under-tested; one DP path can be wrong | major |
| G9 | `Maxes.tsx` `WorkingPreview` hardcodes 70/75/80, not linked to `GM_GRID` | major |
| G10 | Strava write-back for a barbell session untested (`liftDescription` with kg) | major |
| G11 | `e2e/greyman.spec.ts:69` genuinely flaked in this run | major |
| G12 | Conditioning edge cases: bad stored pick id, all-days-illegal, ticking a Green day | minor |
| G13 | No date fixture crosses a DST or year boundary | minor |
| G14 | `Guide.tsx` content is stale Operator/Base Building; only "does not crash" is asserted | minor |
| G15 | `test/__tmp_downgrade.test.ts` is a probe that asserts `expect(true).toBe(true)` | minor |
| G16 | `e2e/COVERAGE.md` is stale by two protocols | nit |

---

## Well covered

Credit where it is due — do not re-test these:

- **The p.51 Grey Man grid, cell for cell.** Sets, set *ranges*, reps and percentages for all three
  weeks, both rows, plus an explicit assertion that no AMRAP/peaking marker leaked in from the
  other three templates. (`greyman.test.ts`)
- **A/B alternation.** Asserted as the nine-element sequence `A B A B A B A B A`, *and* asserted not
  to be day-of-week, *and* not to be week parity, *and* to restart at the top of each block.
  Covered at unit level twice (`protocol.test.ts`, `greyman.test.ts`) and in the browser
  (`greyman.spec.ts`). This is the single best-defended piece of logic in the codebase.
- **Plate rounding.** Nearest-with-ties-down asserted at exact ties, asserted *not* to be
  always-down (`total(32)` is 32.5 and not 30), bounded-error swept across 20–200 kg at 0.25 kg
  steps, exact-solver-beats-greedy proven with an irregular 15/10 inventory, microplate variant
  swept too. Exemplary.
- **Bodyweight reps (p.90).** The book's own 10-rep-max → 3×7 example, plus the naive-reading
  negative assertion.
- **`weightedBodyweightAddedKg` arithmetic**, including the "too heavy too fast" wrong reading.
- **Protocol max scoping.** `narrowMaxes` keeps `mass` and `beginner` apart; the compound
  `[protocolId+exerciseId]` key is proven not to collide on a shared `exerciseId`; a per-dumbbell
  max is proven not to leak into a barbell load.
- **Beginner refactor equivalence.** `sessionFor('beginner', w, d, s)` is compared to
  `beginnerSessionFor(w, d, s)` over 12 weeks × 7 days — 84 structural comparisons. That is a strong
  guard against a *generation* regression (see G2 for what it does not guard).
- **`parseBackup` rejections.** Six negative cases, including the subtle
  absent-`oneRm`-means-v1 vs present-but-malformed-means-corrupt distinction.
- **The Dexie v1→v2 upgrade happy path.** A genuine v1 database is built with the v1 schema, filled,
  closed, and re-opened through the real `TBDatabase` — not a mock. Sessions asserted equal
  byte-for-byte, indexes re-queried, token stripping verified, double round-trip stable.
- **Brzycki** against K. Black's printed worked examples, with the Epley negative assertion.

---

## Gaps

### G1. `importBackup`'s snapshot/rollback path is never exercised
- **Severity:** critical
- **What is untested:** `src/db.ts:importBackup` — the entire `catch` branch (snapshot restore of
  `settings`/`maxes`/`sessions`/`oneRm`, the `snap.oneRm ?? []` v1-snapshot fallback, and the
  re-injection of `currentStrava` on rollback). Every migration test takes the success path.
  `e2e/COVERAGE.md` already lists this as "deliberately left (#9)".
- **Why it matters:** This is the one code path whose entire job is to prevent the project's stated
  highest-severity failure. A restore that throws partway — a poisoned session row, a quota error,
  a Dexie constraint on a duplicated `[protocolId+exerciseId]` — currently clears all four tables
  before writing. If the rollback is broken, Josh has *nothing*, and the failure mode is silent
  until he opens the app. Note the snapshot itself is produced by `exportBackup()`, which
  **strips Strava tokens**, so a rollback path bug would also silently drop the connection.
- **Test to add:** In `test/migration.test.ts`, seed the DB with the 23-session v1 fixture and one
  `oneRm` row. Spy/stub `db.sessions.bulkPut` to throw on first call (`vi.spyOn(mod.db.sessions,
  'bulkPut').mockRejectedValueOnce(new Error('boom'))`). Call `importBackup(otherBackupJson)` and
  assert: (a) it rejects with `/Restore failed — kept your existing data/`; (b)
  `db.sessions.count()` is still 23 and `db.sessions.orderBy('id').toArray()` deep-equals the
  original array; (c) the `oneRm` row is back with its exact `kg` and `progressedKg`; (d) a
  pre-existing `settings.strava` object is still present on the restored row (it must survive even
  though the snapshot stripped it). Add a second case where the *rollback* itself is what must not
  lose data: assert `db.settings.get('app')` is not `undefined` after the failure.

### G2. Nothing tests a database that contains both Beginner and MASS sessions
- **Severity:** critical
- **What is untested:** `src/beginner.ts:beginnerStall`, `beginnerProgress`, `liftHistory`;
  `src/lib/stats.ts:lastPerformance`, `liftRecords`, `sessionVolume`, `weekSummary`. All five
  filter on `s.type === 'lift'` and **never look at `s.phaseId`**. `applyBeginnerProgress`'s
  positional-mapping name guard (`if (ex.name !== l.name) return`) has no negative test either.
- **Why it matters:** This is the suspected contamination bug, and it is structurally present. Once
  Josh runs a Grey Man block, his `sessions` table holds `phaseId: 'gm'` rows with
  `type: 'lift'` and **barbell totals** in `set.weight`. The S cluster is user-editable and
  `Plan.tsx` slugs ids from free text, so a user typing "DB Romanian Deadlift" or "1-Arm DB Row"
  produces a MASS-logged exercise whose *name* collides with a Beginner LP lift — and name is the
  only key these functions use. Consequences: `beginnerStall` sees a 100 kg barbell entry at a
  "working weight" of 10 kg and returns `null` forever (the deload safety net silently dies), or
  worse, `lastPerformance` shows Josh a 100 kg suggestion under a dumbbell lift. `liftRecords` and
  the History PR display would report a bogus e1RM. The 84-case Beginner equivalence test in
  `protocol.test.ts` cannot catch any of this — it compares *generated plans*, and never touches
  logged history at all.
- **Test to add:** A new `describe('mixed protocol history')` in `test/beginner.test.ts`. Build a
  session array containing three `phaseId: 'beginner'` squat sessions at 10 kg × 9 reps **and** two
  `phaseId: 'gm'` sessions logging an exercise literally named `'Goblet / Front-rack Squat'` at
  `weight: 100, reps: 3`. Assert:
  - `beginnerStall(mixed, 'Goblet / Front-rack Squat', 10, 2)` still returns
    `{ count: 3, deloadTo: 8 }` — i.e. exactly what it returns for the beginner-only history — and
    **not** `null` (null is the failure mode: contamination breaks the clean-run-at-this-weight
    check).
  - `beginnerProgress(mixed, settings).find(p => p.id === 'bg_squat')` reports `start: 10`, not
    `start: 100`.
  - `lastPerformance(mixed, 'Goblet / Front-rack Squat', '2026-09-01')?.weight` is `10`, not `100`.
  - `applyBeginnerProgress(settings, 'A', gmLoggedExercises)` returns `null` — a Grey Man log must
    never move a Beginner working weight (assert `next?.bg_squat` is not `100`).

  Because the production code has no `phaseId` filter, **these tests should fail today**; that is
  the point. Then add the filter and they pass.

### G3. `Program.tsx` ignores `settings.plan`, and has zero assertions
- **Severity:** critical
- **What is untested:** `src/screens/Program.tsx` in full. The only coverage is
  `smoke.spec.ts:8`, which visits `/program` seeded with Beginner and asserts the nav bar is
  present and the text "Something broke" is absent.
- **Why it matters:** `Program.tsx:84` and `:151` both call
  `sessionFor(settings.currentPhaseId, week, day, …)` and compute every date from
  `parseISO(settings.phaseStartDate)`. Neither consults `settings.plan`, but `Plan.tsx`'s "Create a
  starter plan" writes a five-block plan and `resolvePosition` then drives Today and Session from
  `plan.startDate` instead. So the moment Josh creates a plan, **the Program screen and the Today
  screen disagree**: Program shows Grey Man sessions during the bridge week (block index 2), and
  its dates are anchored to a `phaseStartDate` the plan no longer uses. `Today.tsx:26` has the same
  latent issue — `useMaxesFor(settings.currentPhaseId)` rather than the position's resolved
  `phaseId` — which under a plan hands the wrong `maxScope` to a bridge or a future
  Specificity block. No test can see any of this.
- **Test to add:** New `e2e/program.spec.ts`. Seed the plan-driven state used by `plan.spec.ts`
  (`{ currentPhaseId: 'gm', plan: { startDate: MONDAY, blocks: [gm×3, bridge×1, gm×3] } }`) plus
  the four MASS 1RMs, then `goto('/program')` and assert:
  - the week view for the current week lists `Grey Man — Day A` on Monday, `Day B` on Wednesday,
    `Day A` on Friday, and a Green conditioning title (`Walk`) on Tuesday;
  - the loads line under Monday reads the real barbell totals (`Bench Press 55 · Squat 70 kg`), so
    a regression to per-dumbbell numbers is caught;
  - navigating forward to week 4 shows **`Bridge — rest`**, not a Grey Man day. This is the
    assertion that fails today.
  - the block view renders exactly 3 week rows for Grey Man (`phase.blockWeeks` is 3), not 12.

  Add a unit test too: assert that for a settings object with a plan, the phase used to render week
  4 equals `resolvePosition(settings, dateOfWeek4).phaseId` (`'bridge'`), not
  `settings.currentPhaseId` (`'gm'`).

### G4. Migration: only one of five scenarios is covered
- **Severity:** critical
- **What is untested:** `src/db.ts` version(2) upgrade and `ensureSeeded` under four other starting
  states.
  1. **Empty DB / fresh install.** No test opens `TBDatabase` with no prior database at all. A
     fresh install must land on `verno === 2` with all four stores present and
     `ensureSeeded()` writing `phaseStartDate = nextMonday()` and `onboarded: false`. Today the
     only proof this works is that the e2e suite happens to boot.
  2. **Settings-only DB** (a v1 install where Josh never logged a session): upgrade with zero
     `sessions` rows.
  3. **Interrupted upgrade.** If the browser is killed mid-`version(2)` upgrade, IndexedDB should
     roll the version transaction back and the next open should re-run it. Untested.
  4. **A v2 DB opened by the old v1 build.** This is the one that matters for the two-subdomain
     migration plan — Josh will have both PWAs installed. `test/__tmp_downgrade.test.ts` probes it
     but asserts nothing (see G15).
- **Why it matters:** (1) and (2) are the states a brand-new v2 install and a lightly-used v1
  install are actually in — the fixture-based test covers only the *heaviest* case. (4) determines
  whether opening the old app after using the new one throws `VersionError` and, critically,
  whether the old app can still *read* its data afterwards or is bricked until the new app is
  opened again. Josh needs to know the answer before switching over, and right now the repo
  contains a probe that logs it to a temp file rather than a test that pins it.
- **Test to add:** In `test/migration.test.ts`, restructure so each scenario gets its own Dexie
  database name (`fake-indexeddb` supports many).
  - *Fresh:* open a `TBDatabase`-shaped Dexie on an unused name; assert `verno === 2`,
    `tables.map(t => t.name).sort()` equals `['maxes','oneRm','sessions','settings']`, then
    `ensureSeeded()` and assert `phaseStartDate === nextMonday()` and `onboarded === false`.
  - *Settings-only:* seed v1 with the settings row and no sessions; upgrade; assert
    `sessions.count() === 0`, `oneRm.count() === 0`, settings row unchanged.
  - *Downgrade:* build v2 with a session and an `oneRm` row, close, then open a Dexie declaring
    only `version(1)`. Assert the concrete outcome — `await expect(old.open()).rejects.toThrow(
    /VersionError/)` (or, if it opens, assert `verno` and that sessions are still readable) — then
    re-open at v2 and assert **both** the session and the `oneRm` row survived. The value here is
    pinning the answer, whatever it is, so a future Dexie upgrade cannot change it silently.
  - *Interrupted:* simulate by registering an `upgrade` callback on `version(2)` that throws, assert
    the open rejects and `verno` is still 1 with all v1 data intact.

### G5. Switching from Beginner to Grey Man is never tested through the UI
- **Severity:** major
- **What is untested:** the `<select>` at `src/screens/Settings.tsx:128` that writes
  `currentPhaseId`. `settings.spec.ts` covers only the rest timer and the theme. Every Grey Man e2e
  test seeds `currentPhaseId: 'gm'` straight into IndexedDB.
- **Why it matters:** This is *the* switchover moment for the whole rebuild plan, and it is the
  moment most likely to break: changing `currentPhaseId` while `phaseStartDate` still points at the
  Beginner start date puts Grey Man at week N ≫ 3, and `resolvePosition` then returns
  `status: 'complete'` (because `week > protocol.blockWeeks`) — so Josh would flip to Grey Man and
  see a finished programme. Nothing tests what the app does at that instant.
- **Test to add:** In `e2e/settings.spec.ts`: seed a Beginner install with `phaseStartDate` set 10
  weeks in the past and a few logged sessions. Go to `/settings`, select Grey Man, then go to `/`
  and assert the app shows an actionable state — a Grey Man session, or an explicit "your block has
  ended / set a start date" prompt — and specifically **not** a blank or a stale Beginner title.
  Assert `readSettings(page).currentPhaseId === 'gm'` and that the sessions are untouched
  (`readSessions(page)` still returns them all). Mirror it as a unit test:
  `resolvePosition({...beginnerSettings, currentPhaseId: 'gm'}, tenWeeksLater).status` — pin whether
  it is `'complete'` and decide whether that is the wanted behaviour.

### G6. §7 fixtures 5 and 6 are asserted as prose, not as arithmetic
- **Severity:** major
- **What is untested:** *Forced Progression* (design §7.5) and the *10% failure rule* (§7.6).
  - Grep shows **nothing writes `progressedKg`** except `Maxes.tsx` (which sets it to `0`) and
    `src/dev/seed.ts`. There is no "+2.5 kg after a completed block" function and no
    "skip a lift marked as struggled" concept anywhere in `src/`. The one test —
    `greyman.test.ts` "applies Forced Progression on top of the tested max" — proves only that
    `basisKg` adds a pre-existing `progressedKg`, i.e. the *read* half. The design's promise
    ("+2.5 kg to the stored 1RM changes week 1 main load by 70% of the increment, and progression
    is skipped for a lift marked as struggled") is half-implemented and correspondingly half-tested.
  - The 10% failure drop exists **only as a substring of an English paragraph**
    (`greyman.ts:255`). The test asserts `plan.detail` matches `/10%/` and not `/5–10%/`. No code
    ever computes `oneRm * 0.9`.
- **Why it matters:** §7.6's stated purpose is "assert the number, so a later refactor cannot
  quietly harmonise it with Mass Template". A regex on a sentence does not do that — someone could
  change the arithmetic (when it exists) to 5% and leave the sentence alone, and the test stays
  green. And a `progressedKg` field that is read but never written is a feature Josh will assume he
  has: after a completed block his loads will not move.
- **Test to add:** Two parts.
  1. *Now, against what exists:* pin the read-half sharply.
     `sessionFor('gm', 1, 0, s, { squat: max('squat', 100, { progressedKg: 2.5 }) })` → the squat
     `targetKg` must be `71.75` (70% of 102.5) and **not** `70` (progression ignored) and **not**
     `72.5` (the increment added after the percentage). That third negative is the real bug this
     catches. Add the same for a `progressedKg: 0` control.
  2. *When the writers land:* a `forcedProgression(entry)` unit test asserting the stored 1RM goes
     100 → 102.5 exactly (not 105, not 102), a struggled-lift case asserting it stays 100, and a
     `failureDrop(entry)` test asserting 100 → **90** and explicitly
     `expect(dropped).not.toBe(95)` (the Mass Template 5% value the design warns about).

### G7. Three `planExercise` branches are never reached
- **Severity:** major
- **What is untested:** `src/protocols/greyman.ts:planExercise` —
  - the `'weightedBodyweight'` case (reads `ctx.settings.bodyweightKg`, clamps `weight` to
    `Math.max(0, added)`, sets `underFloor` and keeps the negative in `targetKg`);
  - the `'unloaded'` case (`loaded: false`, `count` sets of bare reps);
  - `basisKg`'s `tm90` branch (`kg * 0.9`).

  No cluster exercise in `GM_MAIN`, `GM_S1_EXAMPLE` or `GM_S2_EXAMPLE` has
  `defaultLoading: 'weightedBodyweight'` or `'unloaded'`, and nothing sets `basis: 'tm90'`, so
  `sessionFor` never enters them. The underlying pure function
  `weightedBodyweightAddedKg` *is* well tested; the plumbing around it is not.
- **Why it matters:** `Plan.tsx`'s S-cluster builder lets the user choose a loading kind, so the
  first time Josh adds a weighted pull-up the app runs code with no coverage — and the
  `Math.max(0, added)` clamp means a prescription lighter than bodyweight silently renders as
  `0 kg` with only the `underFloor` flag distinguishing it from a genuine zero. `tm90` is the
  Bulgarian-cluster path the design deliberately built the seam for; the comment says "Nothing sets
  it to `tm90` yet", which is exactly when to lock the arithmetic down.
- **Test to add:** In `greyman.test.ts`, build a settings object with a custom S cluster containing
  `{ id: 's_wpu', name: 'Weighted Pull-up', defaultLoading: 'weightedBodyweight' }` and
  `bodyweightKg: 80`, plus an `oneRm` of `100` for `s_wpu`. Week 1 S is 55%: assert
  `targetKg === -25` (55 kg of system minus 80 kg bodyweight), `weight === 0`, and
  `underFloor === true` — and assert `weight` is **not** `55` (the naive reading). Then a positive
  case: system max `140` at 65% (week 3) → `targetKg === 11`, `weight === 11`,
  `underFloor === false`.
  For `unloaded`: an S exercise with `defaultLoading: 'unloaded'` yields `loaded: false`,
  4 sets, `sets[0].weight === undefined`. For `tm90`: call `planExercise` directly with
  `setsRange(4, 5, 8, { kind: 'barbell', percent: 70 }, 'tm90')` and a 100 kg max — assert
  `targetKg === 63` (70% of 90) and explicitly `not.toBe(70)`.

### G8. `loadBar`'s `pairs` cap and `exhausted` flag are thinly tested
- **Severity:** major
- **What is untested:** `src/lib/barbell.ts:loadBar` — the bounded-knapsack `usedOfCurrent` cap has
  exactly one test (`{20, pairs:1}, {5, pairs:1}` → 70, exhausted), and `exhausted` has two. The DP
  records only the *first* path that reaches each sum (`if (reachable[s]) continue`), so
  `usedOfCurrent[prev]` reflects that first path, not the cheapest-in-current-plate path. With a
  constrained inventory there is a plausible class of inputs where a reachable sum is wrongly
  reported unreachable. Also untested: a non-20 kg bar (a 15 kg women's bar, `barKg: 0` for a
  Smith/machine), a `pairs: 0` entry, and a plate denomination finer than the 0.25 kg unit grid
  (e.g. 0.2 kg), which `toUnits` would round to zero and skip.
- **Why it matters:** Josh does not own the bar or plates yet (CLAUDE.md §1), so the inventory in
  `settings.bar.platePairsKg` is going to change, and the `pairs` cap is precisely the field a real
  home gym exercises. A silently-wrong plate breakdown is a wrong lift.
- **Test to add:**
  - *Cap correctness, brute-forced:* for a scarce inventory such as
    `[{kg:20,pairs:2},{kg:10,pairs:1},{kg:2.5,pairs:2}]`, enumerate every legal per-side
    combination in JS, build the sorted set of reachable totals, then for each target from 20 to
    130 in 0.5 kg steps assert `loadBar(t, kit).totalKg` equals the nearest-ties-down member of
    that set. This is one loop and it kills the whole class.
  - *Cap is honoured:* assert `loadBar(t).perSide.find(p => p.kg === 20)?.count` never exceeds the
    declared `pairs` across that same sweep.
  - *Odd bars:* `loadBar(60, { barKg: 15, plates: KIT.plates }).totalKg === 60` (22.5 per side) and
    `perSide` sums to 22.5; `loadBar(40, { barKg: 0, plates: KIT.plates }).totalKg === 40` with
    `belowBar === false`.
  - *Degenerate plate:* `{ kg: 0.2 }` in the inventory must not crash and must not be counted
    (assert it never appears in `perSide`).

### G9. `WorkingPreview` hardcodes 70/75/80 with nothing tying it to the grid
- **Severity:** major
- **What is untested:** `src/screens/Maxes.tsx:247` — `const weeks = [70, 75, 80]`. The Maxes screen
  is covered by exactly one e2e test (`greyman.spec.ts:88`), which asserts the Brzycki estimate
  `1RM 105.9 kg` and the stored row's `protocolId`. The three preview tiles it renders are never
  asserted, and the literal `[70, 75, 80]` is a second, independent copy of `GM_GRID`.
- **Why it matters:** Two sources of truth for the book's percentages. If a fidelity fix ever
  changes a grid percentage, the Maxes preview keeps showing the old number and nothing fails. It
  also silently assumes the user is on Grey Man — the preview is wrong the moment a second MASS
  template exists.
- **Test to add:** A unit test asserting the coupling directly:
  `expect(MAXES_PREVIEW_WEEKS).toEqual([1,2,3].map(w => pctOf(GM_GRID[w].main)))` (export the
  constant, or better, derive it from `GM_GRID` in the component and assert the derivation). Plus
  an e2e assertion in `greyman.spec.ts`: with a 100 kg squat entered, the three tiles read
  `Wk 1 · 70%` / `70`, `Wk 2 · 75%` / `75`, `Wk 3 · 80%` / `80`; and with a 25 kg OHP entered, week
  1's tile shows `20` with the `bar only` caption.

### G10. Strava write-back for a barbell session is untested
- **Severity:** major
- **What is untested:** `src/lib/stravaSync.ts:liftDescription` for a MASS session.
  `beginnerExtras.test.ts` tests it once, for a Beginner day, and its key assertions are
  *negative* — `not.toMatch(/kg/)` and `not.toMatch(/Volume/)` — because Beginner deliberately hides
  weight. So the entire "with weight" formatting branch has no test at all.
- **Why it matters:** A Grey Man session posts real barbell totals to a public Strava feed. Getting
  per-dumbbell vs total confused here writes a wrong, permanent, public number. The suite currently
  only proves the *absence* of kg.
- **Test to add:** In `beginnerExtras.test.ts` (or a new `stravaSync.test.ts`), build a
  `phaseId: 'gm'` lift session logging Bench 55×8 and Squat 70×8, four sets each, and assert
  `liftDescription` contains the barbell line in the real format (e.g.
  `Bench Press — 55 kg × 8, 8, 8, 8`), that it does **not** say `kg/DB`, and that the volume total
  equals `4*(55*8) + 4*(70*8) = 4000`. Pair it with the existing e2e write-back test seeded as
  Grey Man, asserting the PUT body carries the barbell numbers.

### G11. `e2e/greyman.spec.ts:69` flaked in this run
- **Severity:** major
- **What is untested / broken:** "the A/B alternation follows the sessions, not the weekday" failed
  on `page.goto('/session/2026-08-24')` with `net::ERR_ABORTED`, then passed on retry. It is the
  only test in the file that performs four sequential `goto`s; the abort is a navigation racing the
  previous route's in-flight work (most likely the Dexie live-query re-render or the service
  worker), not a date problem.
- **Why it matters:** With no CI, a flaky test on one machine trains the habit of re-running until
  green, which is how a real failure gets waved through — and this is the test guarding the single
  most important piece of MASS logic.
- **Test to add:** Not a new test — stabilise this one. Between navigations, wait for the previous
  assertion's element to detach, or replace the four `goto`s with in-app navigation. Concretely:
  after each `expect(...).toBeVisible()`, add `await page.waitForLoadState('networkidle')` before
  the next `goto`, or restructure into four independent `test.step`s each starting from a fresh
  `page.goto('/')`. Then run `npx playwright test greyman.spec.ts --repeat-each=20` and require
  20/20.

### G12. Conditioning edge cases
- **Severity:** minor
- **What is untested:** `src/protocols/conditioningPlan.ts` —
  - `conditioningPickFor` when `settings.mass.conditioningPick[day]` holds an id that no longer
    exists (falls through to `options[0]`);
  - Black with `conditioningDays` that are *all* lifting days → `conditioningDaysFor` returns `[]`
    → `sessionFor` falls back to the protocol's own rest plan (asserted nowhere);
  - `conditioningDaysFor` de-duplication (`[1,1,1]`) and the `.slice(cap)` ordering — the cap test
    asserts only `toHaveLength(3)`, not *which* three survive;
  - a Green conditioning day being ticked complete / matched to a Strava run, even though
    `conditioningSessionFor` deliberately returns `type: 'run'` to enable exactly that.
- **Why it matters:** The pick-id case is a stale-settings crash risk after any catalogue rename.
  The Strava-matching case is the stated *reason* the type is `'run'` and it is unverified.
- **Test to add:** In `plan.test.ts`: `settings({ mass: { conditioningDays: [1], conditioningPick:
  { 1: 'no-such-session' } } })` → `sessionFor('gm',1,1,s).title === 'Walk'` (the fallback), no
  throw. `conditioningDaysFor(blackish, settings({ mass: { conditioningDays: [0,2,4] } }))` →
  `[]`, and `sessionFor` on those days returns the lift, while a non-lifting day returns
  `type: 'rest'`. `conditioningDaysFor(gm, settings({ mass: { conditioningDays: [6,5,3,1] } }))`
  → assert exactly `[1,3,5]` (sorted-then-capped), not just a length. In e2e, seed a plan-driven
  Grey Man week plus a Strava run on the Tuesday and assert the Green day auto-ticks.

### G13. No date fixture crosses a DST or year boundary
- **Severity:** minor
- **What is untested:** `src/lib/date.ts:diffDays` uses
  `Math.round((a - b) / 86_400_000)`, which is DST-correct *because* of the rounding — a 23-hour or
  25-hour day still rounds to 1. Nothing proves that. Every unit fixture sits in August 2026
  (`2026-08-17`), and the e2e helpers derive from the real clock via `mondayOffset`.
- **Why it matters:** If someone ever "tidies" `Math.round` to `Math.floor`, a UK clock change puts
  Josh on the wrong day of the programme for the rest of the block, and no test notices. It is a
  three-line test for a whole class of silent off-by-one.
- **Test to add:** A `describe('date math across boundaries')` in a new or existing unit file:
  - DST forward (UK 2026-03-29): `diffDays(new Date(2026,2,30), new Date(2026,2,28)) === 2`;
    `resolvePosition({...s, phaseStartDate: '2026-03-23'}, new Date(2026,2,30))` →
    `{ week: 2, day: 0 }`.
  - DST back (2026-10-25): `diffDays(new Date(2026,9,26), new Date(2026,9,24)) === 2`.
  - Year boundary: `phaseStartDate: '2026-12-28'` (a Monday), resolved on `2027-01-04` → week 2,
    day 0; and `addDays` across 31 Dec.
  - Also guard the helper itself: assert `new Date(mondayOffset(0)).getDay() === 1`. (The e2e suite
    is *currently* weekday-safe because every date is derived from `mondayOffset` and navigated to
    explicitly — but nothing pins that property, and `weekSummary`/streak logic in `stats.ts` reads
    the real `today()` with no test at all.)

### G14. `Guide.tsx` still describes Operator and Base Building
- **Severity:** minor
- **What is untested:** `src/screens/Guide.tsx` (458 lines). Only `smoke.spec.ts` visits `/guide`,
  and it asserts only that the nav renders and "Something broke" is absent. The content asserts
  the app "runs the two TB phases you need right now: **Base Building** then **Operator**", walks
  through Test Day, the Operator retest ladder, and "the heavy 90/95% weeks" — none of which exist
  in this codebase any more.
- **Why it matters:** It is the in-app documentation telling Josh how to train, and it now describes
  a programme the app cannot run. CLAUDE.md flags it as deliberately kept "to be rewritten later",
  so this is a known debt — but a test would stop it being forgotten, and would stop the *next*
  rewrite drifting again.
- **Test to add:** A cheap content guard in `e2e/smoke.spec.ts` or a new `guide.spec.ts`: with
  Grey Man seeded, `/guide` must contain `Grey Man` and must **not** contain `Operator`,
  `Base Building` or `Test Day`. Mark it `test.fixme` until the rewrite lands so it is a visible
  red flag rather than a silent gap.

### G15. `test/__tmp_downgrade.test.ts` is a probe, not a test
- **Severity:** minor
- **What is untested:** the file's two `it()` blocks perform the v2-opened-by-v1 experiment (the
  G4.4 scenario), log the outcome with `appendFileSync` to an **absolute path inside a
  machine-specific Claude scratchpad directory**, and then assert `expect(true).toBe(true)`.
  A second untracked file, `test/tmp-prove.test.ts`, also appears in `git status`.
- **Why it matters:** It passes unconditionally, so it contributes two green ticks and zero
  protection while inflating the headline count. The `appendFileSync` to a hardcoded
  `C:/Users/JOSHBI~1/...` path will throw on any other machine or after that temp dir is cleaned.
  And it occupies the filename a real downgrade test should have.
- **Test to add:** Replace it with the real assertions described in G4 (downgrade scenario), or
  delete both temp files. If the finding it captured is worth keeping, record the observed
  behaviour as an assertion, not a log line.

### G16. `e2e/COVERAGE.md` is two protocols out of date
- **Severity:** nit
- **What is untested:** n/a — documentation.
- **Why it matters:** It is the stated entry point for anyone adding a Playwright test, and it
  currently misdirects them.
- **What it should say:** header "✅ Implemented (**51** tests …)" dated 2026-08-23, not 39 /
  2026-08-21. Remove the note claiming `/maxes` "no longer exists" — it does, as the MASS 1RM
  screen, and `smoke.spec.ts:20` still carries that stale comment while testing `/maxes` as a
  *dead* route (the test passes only because it asserts nothing specific; it should either be
  re-pointed at `/nonsense` only, or updated to assert the real Maxes screen). Add two new
  sections: **Grey Man** (`greyman.spec.ts` — A-day lifts/loads/plates, no `kg/DB` label, no
  Beginner `+2 kg` badge leak, A/B alternation across a week boundary, missing-1RM message, Maxes
  Brzycki estimate scoped to `mass`) and **Plan / Bridge / Conditioning** (`plan.spec.ts` — block
  plan drives the protocol, bridge rest and test days, Green conditioning card, conditioning never
  displaces a lift, starter-plan creation, S-cluster 4–6 limit, custom S cluster reaches the
  session). Move "backup snapshot rollback (#9)" out of "deliberately left" — G1 shows it is
  testable at unit level with a `bulkPut` stub. Add a **Known gaps** section pointing at this file,
  and list the untested screens by name: `Program.tsx`, `Guide.tsx`, the Maxes working-weight
  preview, weeks 2–3 of a block on screen, an expired plan (`status: 'complete'`), and the Settings
  protocol switch.

---

## Design §7 fixture checklist

| # | Promised fixture | Status |
|---|------------------|--------|
| 1 | Grey Man grid (p.51), all nine cells — sets, reps, % | ✅ `greyman.test.ts` — full, both rows, plus the no-AMRAP negative |
| 2 | A/B alternation, nine sessions `A B A B A B A B A`, block 2 opens on A | ✅ `greyman.test.ts` + `plan.test.ts` + `greyman.spec.ts` |
| 3 | Plate math round-trip; nearest-ties-down explicitly; **not** always-down | ✅ `barbell.test.ts` — exemplary. See G8 for the `pairs`/odd-bar remainder |
| 4 | Bodyweight reps (p.90), the book's 10-max → 3×7 example | ✅ `barbell.test.ts`, with the naive-reading negative |
| 5 | Forced Progression (pp.53, 90): +2.5 kg moves week 1 by 70% of the increment; skipped for a struggled lift | ⚠️ **half** — the *read* is tested (`progressedKg` reaches `basisKg`); the +2.5 kg writer and the "struggled" concept do not exist in `src/`, so neither is tested. See G6 |
| 6 | Failure rule (p.53): a flat **10%**, asserted as a number so a refactor cannot harmonise it to 5–10% | ❌ **not implemented** — exists only as a regex on an English sentence in `plan.detail`. No arithmetic anywhere. See G6 |
| 7 | Migration: the 23-session v1 backup imports into v2 unchanged; a v1 file still parses; history renders identically | ⚠️ **partial** — v1 parse ✅, v1→v2 upgrade with 23 sessions byte-for-byte ✅, real-backup case ✅ (skips when absent). "History renders identically" is **not** asserted — no e2e imports the v1 fixture and compares the History screen. Rollback, empty DB, settings-only DB and downgrade all missing (G1, G4) |
| — | House rule: "assert percentages in **lbs** against the book's own examples, kg conversion tested separately" | ❌ **not done** — every MASS fixture uses synthetic round kg 1RMs (100, 80, 50). The only genuinely book-printed numbers asserted anywhere are the grid cells themselves, the 10→7 bodyweight example, and Brzycki's 375×5→422 / 230×3→244 (which *are* in lbs, in `calc.test.ts`). If the book prints a worked load example in lbs, it should be a fixture; if it does not, the design note should be corrected to say so |

**Recommended order of attack:** G2 (write the failing test first — it documents the contamination
bug), G1, G3, G4, then G6 alongside implementing the missing progression code.
