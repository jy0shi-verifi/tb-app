# Code audit 02 — pure logic bugs (MASS rebuild)

Branch `mass-extraction`, HEAD `2ba691c`. Scope: the arithmetic and the date/position
engine — `src/lib/barbell.ts`, `src/lib/date.ts`, `src/program.ts`, `src/protocol.ts`,
`src/protocols/*`, and the `planExercise` path in `src/protocols/greyman.ts`. Book
fidelity is out of scope (covered by `book-01`…`book-04`); data integrity and test
coverage are out of scope (covered by `code-01` and `code-04`).

Everything below was exercised by throwaway Node scripts driving the real modules
(imports rewritten to `.ts` in a scratch copy — no repo files were changed). Where a
finding is reasoning only, it says so.

## Verdict

**The plate solver is correct.** I brute-forced `loadBar` against an independent
reference knapsack across 13 bar/plate inventories × 1041 targets each (0–260 kg in
0.25 kg steps), including limited `pairs`, single-denomination sets, irregular
inventories where greedy fails, a 0 kg bar and a negative bar: **zero disagreements**
on the nearest-with-ties-down rule, and the reconstructed `perSide` list summed
exactly to the reported `totalKg` in every case where the plate denominations sit on
the 0.25 kg grid. The DP's "first path wins" reconstruction is sound — `usedOfCurrent`
is only ever written along the same chain `from` records, so the `pairs` cap it
enforces is the cap the reconstructed list actually obeys. `diffDays` is likewise
sound across DST: 0 errors over 3000 consecutive days in `Europe/London`, including
both 2026 transitions. `bodyweightReps`' ties-down rule is exact.

The bugs are all one layer up, and they cluster on a single theme: **`planExercise`
trusts `ex.defaultLoading` and ignores everything the stored `OneRmEntry` says about
itself.** The S-cluster builder lets the user change an exercise's loading kind from a
dropdown while a 1RM already exists for it, and nothing revalidates. That produces the
exact factor-of-two error the whole `maxScope` design was built to prevent — a 100 kg
barbell 1RM reinterpreted as 70 kg *per dumbbell*. The second theme is
`resolvePosition`'s day-of-week: it is derived from days-since-`startDate`, not from
the calendar, and the plan start date is a free `<input type="date">`.

## Summary

| # | Severity | What | Verified |
|---|---|---|---|
| F1 | critical | Changing an S-cluster exercise's loading kind silently reinterprets its stored 1RM (100 kg on the bar → 70 kg per dumbbell) | yes |
| F2 | critical | `weightedBodyweight` with `bodyweightKg` unset prescribes the whole percentage as added weight — 84 kg on a dip belt | yes |
| F3 | major | A plan start date that isn't a Monday rotates the entire week; Mon/Wed/Fri lifting lands on the wrong days and is mislabelled | yes |
| F4 | major | A bodyweight exercise whose 1RM row has no `maxReps` renders four sets of **0 reps** | yes |
| F5 | major | `loadBar.exhausted` is computed and never read — running out of plates shows a light bar with no warning | yes (grep) |
| F6 | major | `Maxes.tsx` keys off `settings.currentPhaseId`, so with a plan running it edits the wrong protocol's maxes, in the wrong scope | reasoning + code |
| F7 | major | A non-integer block length crashes the session render (`GM_GRID[1.5]` → TypeError) | yes |
| F8 | minor | `status: 'before'` / `'complete'` pin `day`/`week`, and `Session.tsx` writes them into history | yes |
| F9 | minor | Plate denominations off the 0.25 kg grid make `perSide` and `totalKg` disagree (1.1 kg plates: says 22 kg, weighs 22.2 kg) | yes |
| F10 | minor | The "only the first N count" conditioning warning is unreachable; over-cap days vanish silently | yes (code) |
| F11 | minor | `conditioningPickFor` resolves a stored pick against *all* sessions, not the block's colour | reasoning |
| F12 | minor | Deleting every block silently reverts the whole schedule to the stale `phaseStartDate` | yes |
| F13 | minor | `greyManDay(ordinal % 2)` degenerates for any protocol with an even number of lifting days (Fighter HT is 2/week) | yes |
| F14 | minor | Dead code: `exhausted`, `deltaKg`, `overCeiling`, `findExercise`, `sets()`, `capMin`, Beginner in `SELECTABLE_PROTOCOLS` | yes (grep) |
| F15 | nit | `loadBar` allocates an array proportional to the target — 1e9 hangs, 1e12 throws `RangeError` | yes |
| F16 | nit | `NaN`/`Infinity` target, or a `NaN` bar weight, propagate silently instead of flagging | yes |
| F17 | nit | S-cluster ids come from `slug(name)` with no collision check | reasoning |

## What I fuzzed and found sound

Recording these because "the plate math is right" is the point of the exercise.

- **`loadBar` nearest-with-ties-down.** 13 setups × targets 0→260 kg @ 0.25 kg, each
  compared against an independently written brute-force bounded-knapsack reference.
  **0 mismatches.** Setups included: the default kit; the default kit + 0.5 kg
  microplates; `[15, 10]` only (the case the docstring says greedy would fail —
  20 kg/side is correctly solved as 10+10, not 15+stuck); `[{20, pairs:1}, {5, pairs:2}]`;
  `[{25, pairs:2}, {1.25, pairs:1}]`; a 15 kg bar with only 2.5s; a 7 kg bar with
  1.25/0.5; a single 100 kg plate; a 0 kg bar; a 20.3 kg bar.
- **Exact-tie handling.** The docstring's claim that `wantUnits` is deliberately left
  off-grid holds: 9.375 kg per side (a 38.75 kg target on a 2.5 kg grid) resolves
  down, not up, and the ascending scan with strict `<` never lets a heavier tie win.
  No float-flipped tie appeared anywhere in the sweep — `wantUnits` is an exact binary
  fraction for any target that is a multiple of 0.25, and `Math.abs(s - wantUnits)`
  compares two exactly-representable values.
- **`perSide` sums to `totalKg`.** Asserted on all ~13 500 solves. Only ever violated
  by off-grid plate denominations (F9).
- **`exhausted` correctness.** Empty inventory → `true`; all-`pairs:0` → `true`;
  `[{20, pairs:2}]` at 300 kg → `true` with the bar at its 100 kg maximum;
  the same inventory at exactly 100 kg → `false`. Negative and zero-kg plates are
  filtered before the solve. The flag itself is right — it is just never read (F5).
- **`bodyweightReps` ties down.** `(10,75)→7`, `(3,50)→1`, `(5,50)→2`, `(9,50)→4`,
  `(10,70)→7`, `(1,55)→1`. Never returns below 1 for a positive `maxReps`;
  `(10,105)→10`.
- **`diffDays` across DST.** 3000 consecutive days from 2020-01-06 in `Europe/London`:
  every one returned its exact index. `2026-03-30 − 2026-03-16 = 14`,
  `2026-10-26 − 2026-10-19 = 7`. The `Math.round` on the ms difference absorbs the
  ±1 hour correctly. **A DST transition inside a plan is not a problem.**
- **`liftingOrdinalFor` strict alternation.** Weeks 1–4 of Grey Man produce
  `A - B - A`, `B - A - B`, `A - B - A`, `B - A - B` — the book's `A B A/B A B`
  two-week period emerges as a side effect, exactly as the comment claims. Days
  outside 0–6 and days off the lifting list return `-1`.
- **`narrowMaxes`.** A `mass` row and a `beginner` row with the same `exerciseId` never
  cross: `gm` and `bridge` both see only the `mass` row, `beginner` only its own.
  Duplicate rows with the same compound key can't exist (Dexie compound primary key).
- **`resolvePosition` boundaries.** `weeks: 0` and `weeks: -3` are clamped to 1 by
  `Math.max(1, …)` in both `resolveInPlan` and `planWeeks`, consistently. An empty
  `blocks` array falls through to the phase path rather than throwing. A start date in
  the future returns `status: 'before'`. A date years past the end returns
  `status: 'complete'` on the last block. An unknown `protocolId` falls back to
  Beginner rather than throwing.
- **`greyManSessionFor` week clamping.** Week 99 clamps to grid week 3 while the
  lifting ordinal keeps advancing, so the A/B letter stays correct across the clamp.
  Week 0 and negative weeks produce negative ordinals and are treated as rest.

---

## Findings

### F1. Changing an S-cluster exercise's loading kind reinterprets its stored 1RM

- **Severity:** critical
- **Where:** `src/protocols/greyman.ts:172` (`planExercise` overrides `p.loading.kind`
  with `ex.defaultLoading`), `src/screens/Plan.tsx:229-234` (`setLoading`),
  `src/screens/Maxes.tsx:126` (`unit` written from `defaultLoading` and never read back)
- **Failure scenario:** The S-cluster builder has a per-exercise `<select>` with
  Barbell / Dumbbell / Bodyweight / Weighted BW / No load. Nothing revalidates the
  stored `OneRmEntry` when it changes.
  1. Add "Front Squat" to S1, leave it as Barbell, enter a 100 kg 1RM. Stored as
     `{ kg: 100, unit: 'total' }`.
  2. Change the dropdown to Dumbbell.
  3. Week 1 S prescription is 55%. `planExercise` now takes the dumbbell branch:
     `targetLoad(100, 55) = 55` → **`{ reps: 12, weight: 55, perDumbbell: true }`** —
     the app asks for 55 kg *in each hand*, 12 reps, four sets.

  The reverse is just as wrong and much quieter: an Incline DB Press stored at
  30 kg/DB, switched to Barbell, produces `targetLoad(30, 70) = 21` →
  `{ weight: 20, targetKg: 21, perSide: [] }` — "bar only" for what should be a
  60 kg-equivalent movement. Switching to Bodyweight hits F4.

  `OneRmEntry.unit` exists precisely to record this ('total' | 'perDumbbell') and is
  written correctly by `Maxes.tsx:126` — but **no consumer ever reads it**.
  `basisKg` takes `entry.kg` unconditionally.
- **Verified:** yes. Ran `planExercise` directly with
  `ex.defaultLoading: 'dumbbell'` and `entry: { kg: 100, unit: 'total' }` →
  `{"reps":8,"weight":70,"perDumbbell":true,"targetKg":70}`; and with
  `defaultLoading: 'barbell'`, `entry: { kg: 30, unit: 'perDumbbell' }` →
  `{"reps":8,"weight":20,"targetKg":21,"perSide":[]}`.
- **Rectify:** Two changes, both cheap:
  1. In `planExercise`, compare `entry.unit` against the branch it is about to take
     and return the honest-gap `note` path ("re-test this lift — you changed how it's
     loaded") rather than a number, whenever they disagree. Same for
     `bodyweightReps`/`weightedBodyweight` against `maxReps` presence.
  2. In `Plan.tsx`'s `setLoading`, delete (or mark stale) the `oneRm` row for that
     `exerciseId` when the kind changes across a unit boundary, so the user is
     re-prompted. Deleting loses `progressedKg`, so prefer marking stale — see
     `code-01` F4 for the same hazard.

### F2. `weightedBodyweight` with bodyweight unset prescribes the whole percentage as added weight

- **Severity:** critical
- **Where:** `src/protocols/greyman.ts:204` — `const bw = ctx.settings.bodyweightKg ?? 0`
- **Failure scenario:** `Settings.bodyweightKg` is optional and starts undefined —
  `DEFAULT_SETTINGS` doesn't set it and only the dev seed does (`src/dev/seed.ts:278`).
  Add "Weighted Dips" to the S cluster, set loading to **Weighted BW**, enter a system
  1RM of 120 kg. Week 1 S is 55%… take week 1 main at 70% for the starkest case:
  `weightedBodyweightAddedKg(120, 0, 70) = 84`. The app renders
  **`{ reps: 8, weight: 84, underFloor: false }`** — hang 84 kg off a dip belt, four
  to five sets of eight.

  With bodyweight correctly set to 85 kg the same inputs give `-1` → `weight: 0`,
  `underFloor: true`, i.e. "you need assistance". The `?? 0` turns a correct
  *assistance* prescription into an 84 kg loaded one. This is the single most
  physically dangerous number the app can produce, and the book quotes an explicit
  warning about exactly this calculation ("You've been warned", p.90).
- **Verified:** yes. `planExercise` with `defaultLoading: 'weightedBodyweight'`,
  `entry.kg: 120`, `settings.bodyweightKg` undefined →
  `{"reps":8,"weight":84,"targetKg":84,"underFloor":false}`.
- **Rectify:** Treat a missing `bodyweightKg` as a *missing input*, not as zero.
  Return the `note` path ("Set your bodyweight in Settings — weighted bodyweight
  movements need it (p.90)") with no weight. Optionally gate the "Weighted BW" option
  in the S-cluster dropdown behind a set bodyweight.

### F3. A plan start date that isn't a Monday rotates the whole week

- **Severity:** major
- **Where:** `src/program.ts:127` — `const day = ((d % 7) + 7) % 7`, where `d` is
  `diffDays(when, parseISO(plan.startDate))`. Also `src/program.ts:110` for the
  no-plan path. Set from `src/screens/Plan.tsx:164-170`, a bare `<input type="date">`
  with no `min`, no step, and no validation.
- **Failure scenario:** `thisMonday()` is only the *default*; the date input accepts
  any day. Set the plan to start Wednesday 2026-01-07, then look at Wednesday
  2026-01-14:

  | plan `startDate` | real weekday of 2026-01-14 | app reports | session |
  |---|---|---|---|
  | 2026-01-05 (Mon) | Wed | week 2, day 2 (Wed) | lift ✓ |
  | 2026-01-06 (Tue) | Wed | week 2, **day 1 (Tue)** | Green run |
  | 2026-01-07 (Wed) | Wed | week 2, **day 0 (Mon)** | lift |
  | 2026-01-08 (Thu) | Wed | week 1, **day 6 (Sun)** | rest |

  Grey Man's fixed Day 1/3/5 (p.50) then falls on Wed/Fri/Sun, and every screen that
  renders `DAY_NAMES[pos.day]` labels it "Mon". `Session.tsx:380` persists that wrong
  `day` into history. Conditioning placement (`conditioningDaysFor` → `pos.day`) is
  rotated by the same amount, so the Black "never on a lifting day" rule can be
  violated even though the code enforcing it looks correct.
- **Verified:** yes — table above is real output from `resolvePosition` +
  `sessionFor`. Also swept 100 consecutive days across the 2026-03-29 DST transition
  with a Monday start: **every in-plan day matched its calendar weekday**, confirming
  this is a start-date problem and not a DST one.
- **Rectify:** Snap on write. In `Plan.tsx`'s date `onChange`, back the chosen date up
  to its Monday (`addDays(d, -mondayIndex(d))`) before saving, and say so in the UI.
  Belt and braces: in `resolveInPlan`, compute `day` as `mondayIndex(when)` and derive
  `weekIndex` from the Monday-aligned start, so a legacy off-Monday `startDate` can't
  rotate the schedule.

### F4. A bodyweight exercise with no `maxReps` renders sets of zero reps

- **Severity:** major
- **Where:** `src/protocols/greyman.ts:199` — `bodyweightReps(entry.maxReps ?? 0, percent)`;
  `src/lib/barbell.ts:227` — `if (maxReps <= 0) return 0`, which bypasses the
  `Math.max(1, …)` floor two lines below.
- **Failure scenario:** The `!entry` guard at `greyman.ts:184` only catches a *missing*
  row. A row that exists but carries no `maxReps` sails past it. That happens whenever
  the loading kind is switched to Bodyweight after a weight-based 1RM was entered
  (F1's sibling), and also for any row written by the dev seed or a restored backup
  that predates `maxReps`. Result: `bodyweightReps(0, 55) = 0` →
  **four sets of `{ reps: 0 }`** rendered as a real prescription, with no note and no
  "set your max reps" prompt.
- **Verified:** yes. `planExercise` with `defaultLoading: 'bodyweightReps'` and
  `entry: { kg: 0 }` (no `maxReps`) → `sets=4 first={"reps":0}`.
- **Rectify:** Change the guard at `greyman.ts:184` to
  `if (!entry || (loading.kind === 'bodyweightReps' && !(entry.maxReps > 0)))` and word
  the note for the bodyweight case ("Enter your max reps for X (p.90)"). Leave
  `bodyweightReps` itself alone — returning 0 for a non-positive `maxReps` is the
  honest answer at that level.

### F5. `loadBar.exhausted` is computed and never read

- **Severity:** major
- **Where:** `src/lib/barbell.ts:89,119,177` — the only three references in the repo.
  `planExercise` (`greyman.ts:220-226`) copies `totalKg`, `targetKg`, `perSide` and
  `belowBar` into the `PlannedSet` and drops `exhausted` and `deltaKg`.
  `PlannedSet` (`src/protocol.ts:129-142`) has no field for it.
- **Failure scenario:** Josh has a 20 kg bar and, say, `2 × 20 kg + 2 × 5 kg` in the
  garage. Grey Man week 3 squat at 80% of a 150 kg 1RM asks for 120 kg. `loadBar`
  returns `totalKg: 70`, `perSide: [20, 5]`, `exhausted: true`, `deltaKg: -50`. The
  session screen shows **70 kg** next to a 120 kg target with no warning that the
  inventory ran out — indistinguishable from a normal rounding delta. `belowBar` is
  plumbed through and rendered; `exhausted`, the more consequential of the two, is not.
- **Verified:** yes for the drop (grep: three hits, all inside `barbell.ts`); the
  `loadBar` values above are real output (`loadBar(300, {barKg:20, plates:[{kg:20,pairs:2}]})`
  → `{"totalKg":100,"deltaKg":-200,"exhausted":true}`).
- **Rectify:** Add `exhausted?: boolean` to `PlannedSet`, copy it in `planExercise`'s
  barbell branch alongside `belowBar`, and render it in `Session.tsx` the way
  `belowBar` is. Same for `deltaKg` if the UI wants it, or delete `deltaKg` (F14).

### F6. `Maxes.tsx` reads `settings.currentPhaseId`, not the position's protocol

- **Severity:** major
- **Where:** `src/screens/Maxes.tsx:50` — `protocolFor(settings.currentPhaseId)`;
  `maxScope` for every write then comes from that protocol (lines 97, 108, 116, 122).
- **Failure scenario:** Sibling to the already-reported `Today.tsx:26` /
  `Program.tsx:13` bug, but with a worse consequence, because Maxes *writes*.
  `currentPhaseId` defaults to `'beginner'` (`db.ts:39`) and nothing in the plan flow
  changes it — `Plan.tsx` only ever calls `saveSettings({ plan })`. So: create the
  starter Grey Man plan, go to Maxes, and the screen renders **Beginner's** clusters
  and writes rows with `protocolId: 'beginner'`. Meanwhile `Session.tsx:251` correctly
  narrows to `protocolFor(pos.phaseId).maxScope === 'mass'` and finds nothing, so every
  Grey Man lift renders the "Set your 1RM…" note forever. The user has no reachable way
  to enter a MASS 1RM except by first changing the protocol dropdown in Settings.
- **Verified:** code reading plus the confirmed narrowing behaviour
  (`narrowMaxes(rows, protocolFor('gm'))` returns only `protocolId: 'mass'` rows).
  Not reproduced through the UI.
- **Rectify:** `const pos = resolvePosition(settings, today()); const protocol = protocolFor(pos.phaseId)`.
  Bridge blocks share `maxScope: 'mass'`, so a test day inside a bridge week still lands
  in the right place. `Today.tsx` and `Program.tsx` need the same change.

### F7. A non-integer block length crashes the session render

- **Severity:** major
- **Where:** `src/protocols/greyman.ts:264-265` —
  `const week = Math.min(Math.max(pos.week, 1), GM_BLOCK_WEEKS); const grid = GM_GRID[week]`
- **Failure scenario:** `resolveInPlan` computes `week = weekIndex - acc + 1` where
  `acc` sums `Math.max(1, b.weeks)`. Integer inputs give integer weeks, but a block
  with `weeks: 2.5` makes `acc` fractional and `week` fractional for every subsequent
  block. `Math.min/Math.max` don't round, `GM_GRID[1.5]` is `undefined`, and
  `grid.main` throws `TypeError: Cannot read properties of undefined (reading 'main')`.
  The `ErrorBoundary` catches it, so the user sees a crash card instead of the day's
  session. There is no weeks editor in `Plan.tsx` today, so the reachable route is a
  hand-edited or corrupted `settings.plan` — which is exactly what a restored backup
  is.
- **Verified:** yes. `resolvePosition` with `blocks: [{gm, weeks: 2.5}, {bridge, weeks: 1}]`
  on 2026-01-26 returned `week: 1.5`, and `sessionFor('gm', 1.5, 0, …)` threw.
- **Rectify:** `Math.round`/`Math.trunc` the block length where `acc` is accumulated
  (`program.ts:146`: `const len = Math.max(1, Math.round(blocks[i].weeks))`), and add a
  belt-and-braces fallback in `greyManSessionFor`: `const grid = GM_GRID[week] ?? GM_GRID[1]`.

### F8. `before` and `complete` pin `day`/`week`, and those get written into history

- **Severity:** minor
- **Where:** `src/program.ts:108` (`day: 0`, `week: 1`), `:113-119` and `:167-174`
  (`day: 6`, last week); consumed by `src/screens/Session.tsx:378-380`, which persists
  `pos.week` and `pos.day` onto the `SessionLog`.
- **Failure scenario:** The session route is per-date (`/session/:date`), so
  `resolvePosition` is called with the *route's* date, not today's. Open a date before
  the plan starts and the app shows week 1 / day 0 — Grey Man Day A — whatever weekday
  it really is; log it and the row stores `week: 1, day: 0`. Open any date after the
  plan's last week and you get week 3 / day 6 (Sunday rest) forever; logging stores
  `day: 6`. I swept 100 days from a 13-week plan's start: the 8 days past the end all
  reported Sunday regardless of the real weekday. Anything reading `SessionLog.day`
  (History grouping, `programSessionName`'s "Run 2" ordinal) is then wrong.
- **Verified:** yes for the pinning (real `resolvePosition` output). The write path is
  code reading.
- **Rectify:** Keep `status` as the signal but let `day` stay truthful —
  `day: mondayIndex(when)` in both the `before` and `complete` branches — and have
  `Session.tsx` refuse to log (or warn) outside the plan's span rather than
  fabricating a position.

### F9. Plate denominations off the 0.25 kg grid make `perSide` and `totalKg` disagree

- **Severity:** minor
- **Where:** `src/lib/barbell.ts:92` — `toUnits = kg => Math.round(kg * 4)`, applied to
  each plate at line 140 and again during reconstruction at line 190, while
  `reconstruct` returns the **original** `plates[i].kg`.
- **Failure scenario:** `settings.bar.platePairsKg` is a free list of numbers. With
  `[1.1, 3.3]` on a 20 kg bar and a 21.25 kg target, `loadBar` returns
  `totalKg: 22`, `perSide: [{ kg: 1.1, count: 1 }]` — but one 1.1 kg plate a side is
  22.2 kg, not 22. The error compounds: at 31.5 kg the answer is
  `totalKg: 32` with six 1.1 kg plates a side = 33.2 kg actual, a 1.2 kg lie.
  Sub-0.25 kg plates (`{ kg: 0.1 }`) round to zero units and are dropped entirely —
  that case is at least honest, returning `exhausted: true`.
- **Verified:** yes. The `perSide`-sums-to-`totalKg` assertion failed on every solve
  for the `[1.1, 3.3]` inventory and on none of the twelve grid-aligned inventories.
- **Rectify:** Either validate on input (the bar/plate editor rejects anything that
  isn't a multiple of 0.25 kg) or snap on read (`barSetupFrom` maps each plate to
  `toKg(toUnits(kg))` so the returned `perSide` denominations are the ones actually
  used in the arithmetic). Snapping on read is the safer of the two — it keeps
  `perSide` and `totalKg` consistent by construction.

### F10. The conditioning over-cap warning can never fire

- **Severity:** minor
- **Where:** `src/screens/Plan.tsx:384` — `{days.length > cap.max && …}`, where
  `days = conditioningDaysFor(protocol, s)` and `conditioningDaysFor`
  (`src/protocols/conditioningPlan.ts:94`) already ends in `.slice(0, cap)`.
- **Failure scenario:** `days.length` is capped at `cap.max` by construction, so the
  "Only the first N count — the book caps it there" line is unreachable. A user who
  taps a fourth Green day sees it highlight (the toggle writes to
  `settings.mass.conditioningDays` unconditionally) but no session ever appears on it,
  and no explanation is given. Worse, the drop is by *weekday order*, not by the order
  the user picked: selecting Thu, Sat, Sun, Tue keeps Tue/Thu/Sat and silently discards
  Sunday.
- **Verified:** yes by reading; `conditioningDaysFor` sorts ascending then slices.
- **Rectify:** Compare against the raw selection, not the clamped one —
  `const chosen = s.mass?.conditioningDays ?? defaultConditioningDays(colour)` and test
  `chosen.length > cap.max`. Better still, refuse the extra toggle in the UI so the
  stored state and the rendered state agree.

### F11. A stored conditioning pick isn't scoped to the block's colour

- **Severity:** minor (latent — no Black protocol is registered yet)
- **Where:** `src/protocols/conditioningPlan.ts:106` —
  `return (id && conditioningById(id)) || options[0]`, where `conditioningById`
  (`src/protocols/conditioning.ts:264`) searches `ALL_CONDITIONING`.
- **Failure scenario:** `settings.mass.conditioningPick` is keyed by weekday only. Pick
  "Ruck" (Green) for Tuesday during a General block; when a Specificity block with
  `conditioning: 'black'` is added, Tuesday still resolves to Ruck, and
  `conditioningSessionFor` labels it "Black conditioning. *Ruck for 30 to 60 minutes…*".
  The `options` list the user is offered is correctly filtered by colour; only the
  *resolution* isn't.
- **Verified:** reasoning + code reading. Not reproducible today — `PROTOCOLS` holds no
  Black protocol.
- **Rectify:** `const s = id ? options.find(o => o.id === id) : undefined; return s ?? options[0]`.

### F12. Deleting every block silently reverts to the stale `phaseStartDate`

- **Severity:** minor
- **Where:** `src/program.ts:100` — `if (plan?.blocks?.length) return resolveInPlan(...)`;
  `src/screens/Plan.tsx:151` removes blocks one at a time with no floor.
- **Failure scenario:** Remove the last block and `plan` survives as
  `{ startDate: '2026-08-24', blocks: [] }`, but `resolvePosition` falls through to the
  `phaseStartDate` path — a date that may be a year old and belongs to a different
  protocol. On Josh's install `phaseStartDate` is his Beginner start, so the app jumps
  from "Grey Man, week 2" to "Beginner, week 34, complete" in one tap, and `Plan.tsx`
  offers "Create a starter plan" as if nothing had a plan. The two start dates are
  never reconciled: `Today.tsx`'s `realign()` writes `phaseStartDate` only, so it is a
  no-op whenever a plan is active, and `Today.tsx:64` computes the "starts in N days"
  countdown from `phaseStartDate` even when the `before` status came from the plan.
- **Verified:** yes for the fall-through (`resolvePosition` with `blocks: []` returned
  `blockIndex: -1, blockCount: 0` and used `phaseStartDate`). The `realign` /
  countdown mismatches are code reading.
- **Rectify:** Clear `plan` entirely when the last block is removed
  (`write` → `saveSettings({ plan: next.length ? { startDate, blocks: next } : undefined })`),
  and give `resolvePosition` a single `startDateFor(settings)` helper that every caller
  uses instead of reaching for `phaseStartDate` directly.

### F13. A/B alternation degenerates for any protocol with an even number of lifting days

- **Severity:** minor (landmine, not yet live)
- **Where:** `src/protocols/greyman.ts:136-138` — `liftingOrdinal % 2`, driven by
  `liftingOrdinalFor`'s `(week - 1) * liftingDays.length + idx` (`src/program.ts:86`).
- **Failure scenario:** The strict-alternation reasoning in the comments is correct and
  the A-B-A / B-A-B period is real — but only because 3 is odd. Give a protocol four
  lifting days and the ordinal advances by 4 each week, so `ordinal % 2` is constant
  per weekday: Monday is always A, Tuesday always B, forever. I ran a hypothetical
  `liftingDays: [0,1,3,4]` protocol through weeks 1–3 and got
  `Mon=A Tue=B Thu=A Fri=B` in all three. Fighter HT is a **two-day** template
  (MASS p.60), so this fires the moment it is added.
- **Verified:** yes (output above).
- **Rectify:** Nothing to fix in Grey Man. Add a comment at `greyManDay` recording the
  odd-day-count precondition, and when the next template lands, derive its day letter
  from its own grid rather than reusing `ordinal % 2`.

### F14. Dead code introduced by the rebuild

- **Severity:** minor
- **Where / what** (all confirmed by repo-wide grep):
  - `LoadedBar.exhausted` — `src/lib/barbell.ts:89`. Never read. See F5.
  - `LoadedBar.deltaKg` — `src/lib/barbell.ts:74`. Computed twice, never read.
  - `PlannedSet.overCeiling` — `src/protocol.ts:134`. Declared; never written, never
    read. `underFloor` is written (`greyman.ts:206`) but likewise never read.
  - `findExercise` — `src/protocol.ts:252`. Exported; used only by
    `test/protocol.test.ts`.
  - `sets()` — `src/protocol.ts:72`. Exported; used only by `test/protocol.test.ts`.
    Every real prescription uses `setsRange`.
  - `ConditioningSession.capMin` — `src/protocols/conditioning.ts:23`. Set on seven of
    eight sessions, read nowhere; the cap is only ever communicated as prose inside
    `detail`.
  - `BEGINNER_PROTOCOL` in `SELECTABLE_PROTOCOLS` — `src/program.ts:34`. Its only
    consumer, `Plan.tsx:174`, filters `family !== 'legacy'`, and Beginner's family *is*
    `'legacy'` (`src/beginner.ts:265`). So the array's second element is unreachable and
    Beginner can never be added to a block plan.
  - `basisKg`'s `tm90` branch — `src/protocols/greyman.ts:157`. Documented as
    deliberately unreachable ("Nothing sets it to `tm90` yet"); listed for completeness,
    not as a defect.
  - `Prescription.setsMax` — the 5th set is unreachable because `planExercise` uses
    `p.setsMin` for the count. Already reported in an earlier audit; noted here only
    because it is the same class.
- **Verified:** yes (grep counts).
- **Rectify:** Delete `overCeiling`, `deltaKg` and `findExercise` unless a consumer is
  imminent; wire `exhausted` up (F5); read `capMin` or drop it; and either give
  Beginner a non-legacy family or remove it from `SELECTABLE_PROTOCOLS`.

### F15. `loadBar` allocates memory proportional to the target weight

- **Severity:** nit
- **Where:** `src/lib/barbell.ts:129-136` — `maxUnits = Math.ceil(wantUnits) + toUnits(plates[0].kg)`,
  then `new Uint8Array(maxUnits + 1)` and `new Int16Array(maxUnits + 1)`.
- **Failure scenario:** `maxUnits` is `(target − bar) × 2` roughly, so the allocation is
  3 bytes per 0.25 kg of target. 1e6 kg → 42 ms; 1e7 kg → 283 ms; **1e9 kg → no result
  inside 40 s**; 1e12 kg → `RangeError: Array buffer allocation failed`, thrown
  synchronously during render. The reachable route is a fat-fingered 1RM in the Maxes
  field, which accepts arbitrary digits (`Maxes.tsx:208` strips only non-numerics).
  A realistic typo (100000 kg) costs 10 ms, so this is genuinely a nit — but the
  unbounded growth and the un-caught throw are both avoidable.
- **Verified:** yes (timings above are real).
- **Rectify:** Clamp `maxUnits` to something physical (say 2000 kg per side) and set
  `exhausted` when the clamp bites; or validate the 1RM field to a sane ceiling.

### F16. `NaN` and `Infinity` pass through `loadBar` unflagged

- **Severity:** nit
- **Where:** `src/lib/barbell.ts:116` — `if (!Number.isFinite(targetKg) || targetKg <= barKg) return bare`
- **Failure scenario:** `loadBar(NaN)` returns
  `{ targetKg: NaN, totalKg: 20, deltaKg: NaN, belowBar: false, exhausted: false }` and
  `loadBar(Infinity)` returns the same with `targetKg: Infinity` — a confident "load the
  empty bar" for an input that means nothing. A `NaN` bar weight
  (`loadBar(100, { barKg: NaN, … })`) is not guarded at all and returns
  `totalKg: NaN`, which renders as "NaN kg". `NaN` reaches these from
  `entry.kg + (entry.progressedKg ?? 0)` if a restored backup carries a non-numeric
  `kg` (`code-01` F9 notes `parseBackup` never validates row shape).
- **Verified:** yes (all three outputs are real).
- **Rectify:** Guard `barKg` with `Number.isFinite` alongside `targetKg`, and set
  `exhausted: true` (or a new `invalid` flag) rather than `false` on the non-finite
  path, so the UI has something to key off.

### F17. S-cluster exercise ids come from the display name with no collision check

- **Severity:** nit
- **Where:** `src/screens/Plan.tsx:39-40` (`slug`) and `:215-222` (`add`)
- **Failure scenario:** `slug` lowercases and collapses non-alphanumerics, so
  "DB Row", "db row" and "DB — Row!" all become `s_db_row`. Adding two of them puts a
  duplicate `id` in the cluster: they share one 1RM row, they collide as React keys,
  and `remove` (`Plan.tsx:225`, `filter(e => e.id !== id)`) deletes **both**. Adding
  "Dips" when the S1 example's `s_dips` is still present does the same. The whole
  point of the id/name split (`protocol.ts:96-100`) is that ids are stable and unique;
  this generator guarantees neither.
- **Verified:** reasoning + code reading. Not run.
- **Rectify:** De-duplicate on add — append a numeric suffix while the slug already
  exists in `s1 ∪ s2 ∪ protocolExercises(GREY_MAN_PROTOCOL)`.
