# MASS rebuild — design document

**Written:** 2026-08-22 · **Branch:** `mass-extraction` · **Status:** design only, no code written yet.

Source of truth for the programme is `docs/MASS/MASS-extraction.md`. Every programme rule below carries
the PDF page reference from that document. Where this design departs from the book, it is labelled
**DEVIATION** and says why. There are six such departures, all listed in the decision table in §1:
rounding, microplates, skipping Base Building, below-bar handling, fractional bodyweight reps, and
(if it ever happens) moving Grey Man's lifting days.

Read `docs/codebase-map.md` §8 alongside this: it lists what in the current code resists a second
protocol, and this design is largely a set of answers to that list.

---

## 1. What is being built

**Grey Man**, the 3-day General Mass template (pp.48–53), running against a barbell, with:

| Decision | Value | Taken |
|---|---|---|
| Template | Grey Man | Josh, 2026-08-22 |
| Block length | 3 weeks; phases run any multiple of 3 | Josh, 2026-08-22 |
| Weighted pull-ups | Not qualified (<12 bodyweight reps) — irrelevant to Grey Man, matters for the bodyweight loading mode | Josh, 2026-08-22 |
| Beginner mode | Kept as an unadvertised fallback; MASS is the default | Josh, 2026-08-22 |
| Conditioning | Follow the book — app prescribes Green sessions during General Mass | Josh, 2026-08-22 |
| Rounding | Nearest loadable weight, ties down, always show target + loaded + plates | Josh, 2026-08-22 (**DEVIATION** — book has no rule) |
| Microplates | Optional, not required. Plate inventory is user-configurable | Josh, 2026-08-22 |
| Base Building | **Skipped.** Start at General Mass | Josh, 2026-08-22 — **NOT a deviation.** p.18: "If you already have a current/established endurance base of some kind, (i.e. runner…) feel free to skip it." p.151 FAQ: "No. Base Building is optional…" Josh is a runner, the exact case named. |
| Below bar weight | Show "empty bar" plus a warning; do not substitute automatically | Claude, 2026-08-22 (**DEVIATION** — book covers SE only, p.31) |
| Fractional bodyweight reps | Round to nearest, ties down — same rule as weight | Claude, 2026-08-22 (**DEVIATION** — book silent) |
| Conditioning days | Default Tue/Sat, user editable; the book's weekly caps are enforced | Claude, 2026-08-23 (**DEVIATION** — book fixes the count, not the days) |
| Bar and plates | 20 kg bar; pairs of 25/20/15/10/5/2.5/1.25 kg. Smallest jump 2.5 kg | Josh, 2026-08-22 |
| Lifting days | Mon / Wed / Fri, as printed (p.50) | Josh, 2026-08-22 |
| First 1RMs | Estimate from a 3RM per lift via `estimate1RM`, once the bar arrives (sanctioned p.90) | Josh, 2026-08-22 |
| Strava on `tb2` | A **second** Strava API app registered against `tb2.joshua-birch.co.uk`; the live app's Strava is untouched | Josh, 2026-08-22 |

Not being built now, but the model must not preclude them: Mass Template, Gladiator, Fighter HT,
Specificity Alpha and Bravo, Base Building.

---

## 2. Grey Man, precisely

### 2.1 Clusters (pp.48–49)

**Main cluster** — fixed, "standard across the board, the same for everyone" (p.48):
Bench Press, Squat, Overhead Press, Deadlift.

**Supplementary (S) cluster** — user-built. 4 to 6 exercises total, "no more" (p.49), split into two
lists S1 and S2. Dumbbells, barbells, kettlebells and bodyweight are all allowed (p.49). The book's
example splits 3 / 2; it does not say how to divide them, so the app should let Josh choose the split.

Author's recommendation for a mass-focused trainee, worth surfacing in the builder UI: *"stick to the
more conventional exercises using dumbbells and barbells"* (p.49).

This is where the existing dumbbells stay in use.

### 2.2 The A/B alternation (p.50) — simpler than it looks

The book prints it as a two-week grid:

| Week | Day 1 | Day 3 | Day 5 |
|---|---|---|---|
| 1 | BP SQ **S1** | OHP DL **S2** | BP SQ **S1** |
| 2 | OHP DL **S2** | BP SQ **S1** | OHP DL **S2** |
| 3 | BP SQ **S1** | OHP DL **S2** | BP SQ **S1** |

With **A = Bench + Squat + S1** and **B = OHP + Deadlift + S2**.

Written out as a sequence of lifting sessions from the start of the block, that is simply
`A B A B A B A B A` — **strict alternation of consecutive lifting sessions.** The apparent two-week
period is a side effect of three sessions per week against a two-element cycle, not a rule of its own.

So the selector is:

```
cluster = (liftingSessionOrdinalWithinBlock % 2 === 0) ? 'A' : 'B'
```

**Not** day-of-week, and **not** week parity. `codebase-map` §8 flagged the old `switch(day)` as a trap;
this is the concrete reason it would have been wrong here.

The ordinal resets at the start of each 3-week block, so every block opens on A. Nine lifting sessions
per block: five A, four B.

### 2.3 Programming grid (p.51)

All three lifting days in a week carry **identical** prescriptions. Each day has **two** prescriptions —
one for the two main lifts, one for the S exercises:

| Week | Main lifts | Main % | S exercises | S % |
|---|---|---|---|---|
| 1 | 4–5 × 8 | 70% | 4 × 12 | 55% |
| 2 | 4–5 × 6 | 75% | 4 × 10 | 60% |
| 3 | 4–5 × 3 | 80% | 4 × 8 | 65% |

Notes that matter for the model:

- **`4-5` is a genuine range**, not a typo — the user picks 4 or 5 sets. S exercises are a flat 4.
- **No AMRAP and no peaking markers anywhere in the Grey Man grid** (p.51). Unlike Mass Template,
  Gladiator and Fighter HT, week 3 is just heavier. That removes a whole feature from the first build.
- Percentages are of the **1RM**, not a training max (p.51). Grey Man never uses a TM.

### 2.4 Scheduling — Days 1/3/5 are fixed

Grey Man prints Days 1, 3 and 5 (p.50) and gives **no permission to move them.** That flexibility
belongs to other templates: Fighter HT has an explicit 48-hour rule (p.61) and Gladiator says outright
"You don't have to stick to the above schedule exactly" (p.55). Grey Man says only that the four days off
"allows for more flexibility with **conditioning and recovery**" (p.48) — which is about the conditioning
schedule, not the lifting one.

So: **Monday / Wednesday / Friday**, mapping Day 1→`day 0`, Day 3→`day 2`, Day 5→`day 4` in the app's
existing 0=Mon..6=Sun convention. Shifting them would be a deviation and should be labelled as one if it
ever becomes necessary.

### 2.5 Execution rules (pp.50–53)

- Main lifts first, then S exercises (p.50).
- Rest: 2–5 minutes on main lifts, 1–2 minutes on S (p.53).
- Super-setting is permitted for S exercises (p.53).
- On failure: **lower the 1RM by 10%** and recalculate (p.53). Note Grey Man says a flat 10%, where Mass
  Template says 5–10% (p.45) — a per-template rule, not a global one.
- "Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight
  work, nothing" (p.64) — but Grey Man's S cluster *is* the sanctioned outlet for exactly that (p.49).
  The S cluster is the exception; the app should not offer an "add extra exercise" affordance outside it.

### 2.6 Progression (p.53, p.90)

Forced Progression. Every 3–6 weeks — i.e. every one to two blocks — **add 5–10 lbs (2.5–5 kg) to the
stored 1RM** and recalculate. Never force progression on a lift that was a struggle (p.53).

Testing happens only at start-up, on a phase change, or when a new exercise enters a cluster (pp.90, 93).
A true 1RM never has to be lifted — a 2RM or 3RM run through a calculator is explicitly acceptable
(p.90), which is what `estimate1RM` already does.

---

## 3. Domain model

### 3.1 The shape the old code could not express

`PhaseMeta` is `{ id, name, lengthWeeks }` and `sessionFor()` ignores its phase argument entirely
(`src/program.ts`). `PlannedSet` carries `perDumbbell` and a raw `weight` (`src/program.ts`). Neither can
carry a percentage-driven, multi-cluster, multi-loading-mode prescription.

### 3.2 Proposed types

```ts
// ---- loading ----------------------------------------------------------

/** How a prescribed load is computed and displayed. */
export type Loading =
  /** % of the basis max, loaded on a barbell. Needs plate math. */
  | { kind: 'barbell'; percent: number }
  /** % of the basis max, per hand. The existing beginner mode. */
  | { kind: 'dumbbell'; percent?: number }
  /** % applies to MAX REPS, not to weight (p.90). 10-rep max @ 70% => 7 reps. */
  | { kind: 'bodyweightReps'; percent: number }
  /** Weighted bodyweight. Bodyweight MUST be included in the calculation (p.90). */
  | { kind: 'weightedBodyweight'; percent: number }
  /** No load prescribed (abs, mobility). */
  | { kind: 'unloaded' }

// ---- prescription -----------------------------------------------------

export interface Prescription {
  setsMin: number          // 4
  setsMax: number          // 5  (equal to setsMin when the book prints a single number)
  reps: number
  loading: Loading
  /** '1rm' everywhere except the Bulgarian cluster, which recommends 90% (pp.88-89). */
  basis: '1rm' | 'tm90'
}

// ---- clusters ---------------------------------------------------------

export interface ClusterExercise {
  /** Stable id. NOT the display name — see §3.4. */
  id: string
  name: string
  defaultLoading: Loading['kind']
}

export interface Cluster {
  id: string               // 'gm-main-a' | 'gm-main-b' | 'gm-s1' | 'gm-s2'
  label: string
  exercises: ClusterExercise[]
  editable: boolean        // main cluster false, S cluster true
}

// ---- protocol ---------------------------------------------------------

export type ConditioningColour = 'green' | 'black' | 'none'

export interface Protocol {
  id: string                      // 'gm' (grey man)
  name: string                    // 'Grey Man'
  family: 'general' | 'specificity' | 'base' | 'legacy'
  blockWeeks: number              // 3
  /** 0=Mon..6=Sun. Grey Man: [0, 2, 4]. */
  liftingDays: number[]
  conditioning: ConditioningColour
  clusters: Record<string, Cluster>
  /**
   * Resolve one session. Given the position within the block, return the
   * clusters to train and the prescription for each. This is the seam that
   * WaveWeek could not express (codebase-map §8.1).
   */
  sessionFor(pos: BlockPosition, state: ProtocolState): SessionPlan
}
```

`PHASES` becomes `PROTOCOLS: Record<string, Protocol>`, and every screen reads
`PROTOCOLS[id].clusters` rather than importing a lift list directly — the fix for `codebase-map` §8.2.

### 3.3 Position and scheduling

`resolvePosition` currently maps a single `phaseStartDate` onto one open-ended phase. MASS needs a
sequence of blocks.

```ts
export interface PlannedBlock {
  protocolId: string       // 'gm' | 'bridge' | ...
  weeks: number            // 3, or 1 for a bridge week
}

// settings
plan: {
  startDate: string        // ISO, Monday of block 1 week 1
  blocks: PlannedBlock[]
}
```

`resolvePosition` walks `blocks` accumulating weeks to find the current block, then the week within it
(1..blockWeeks) and the day. It also returns the **lifting-session ordinal within the block**, which is
what §2.2 needs.

This makes "run four General blocks then a Specificity block" a data change, not a code change, which is
exactly the flexibility Josh's block-length decision implies. Extending the plan when it runs out is a
UI action, not a migration.

### 3.4 Exercises must stop being keyed by display name

`codebase-map` warns that exercises are keyed by display-name string and that Josh's logged history
already contains old TB names colliding with the beginner lifts (`DB Bench Press`, `1-Arm DB Row`,
`DB Romanian Deadlift`).

With Beginner retained as a fallback (Josh's decision), **this collision is now live, not hypothetical**:
a Grey Man S cluster containing "DB Bench Press" would feed the beginner stall detector, and vice versa.

**Design rule:** every progress lookup is scoped by `(protocolId, exerciseId)`, never by name alone. New
sessions record an `exerciseId` alongside the display `name`; historical sessions have no id and are
matched by name **within their own `phaseId` only**.

### 3.5 Maxes — a new table, the old one frozen

`MaxEntry` is `{ liftId, testWeight /* kg per dumbbell */, testReps, bumpKg }`. `testWeight` being
per-dumbbell makes it unusable for a barbell, and it has no protocol scope (`codebase-map` §8.5).

Rather than reinterpret it — which CLAUDE.md forbids — **freeze it and add a new table**:

```
settings:  'id'                               // unchanged
maxes:     'liftId'                           // v1, FROZEN. Read for backup round-trip only.
sessions:  '++id, date, phaseId'              // unchanged
oneRm:     '[protocolId+exerciseId]'          // NEW
```

```ts
export interface OneRmEntry {
  protocolId: string
  exerciseId: string
  kg: number                    // total on the bar, or per-dumbbell for dumbbell lifts
  unit: 'total' | 'perDumbbell'
  source: 'tested' | 'estimated'
  /** for bodyweight movements: max reps stands in for the 1RM (p.90) */
  maxReps?: number
  testedAt: string              // ISO date
  /** cumulative Forced Progression applied since the last test, kg */
  progressedKg: number
}
```

Forced Progression mutates `kg` and increments `progressedKg`, so the app can always show "tested 100,
now 105".

This is a **Dexie version 2** — the first migration ever written in this project. It adds a table and
touches no existing row, which is the safest possible shape for one. It still needs a test that opens a
v1 database and confirms every existing session survives.

### 3.6 Backup contract

Adding a table changes the export payload, so **`BACKUP_VERSION` goes to 2**:

```json
{ "app": "tb-app", "version": 2, "exportedAt": "...",
  "settings": [...], "maxes": [...], "sessions": [...], "oneRm": [...] }
```

- **Reading v1 must keep working** — `parseBackup` already refuses `version > BACKUP_VERSION`, so a v1
  file loads into a v2 app with `oneRm: []`. That is correct: a v1 backup predates MASS and has no 1RMs
  to carry.
- The 23 real sessions in `backups/tb-backup-2026-08-19 (2).json` stay the regression fixture. A v1 →
  v2 round-trip test is mandatory before this ships.
- v2 files will not load into the live app. That is expected and is the whole reason for the separate
  subdomain — but it means **the migration only runs one way**, and Josh should take a fresh v1 export
  before switching.

---

## 4. Barbell plate math — new module

Nothing like this exists in the codebase. `src/lib/barbell.ts`:

```ts
export interface BarSetup {
  barKg: number            // 20 default, configurable (15 for a women's bar, 10 for a technique bar)
  platePairsKg: number[]   // Josh's kit: [25, 20, 15, 10, 5, 2.5, 1.25]. Add 0.5 if microplates arrive.
}

export interface LoadedBar {
  targetKg: number         // the exact percentage result, unrounded
  totalKg: number          // what you actually load
  deltaKg: number          // totalKg - targetKg, signed
  perSide: { kg: number; count: number }[]
  belowBar: boolean        // target < barKg
}

export function loadBar(targetKg: number, setup: BarSetup): LoadedBar
```

**Rule (DEVIATION — the book has no rounding rule anywhere in 160 pages):** choose the loadable total
nearest to the target; on an exact tie choose the lower. Greedy plate selection from heaviest down.

**Display requirement, and it is part of the rule, not decoration.** Because the rounding is ours, the UI
always shows all three of: the exact percentage target, the loaded total, and the per-side breakdown.
`Squat — 70% of 100 kg = 70.0 → load 70 kg · 20 bar + 25 per side`. The deviation stays auditable
against the book at a glance.

**Below bar weight.** `belowBar` is set when the target is under the bar. The book covers this for Base
Building SE only — "go ahead and use the empty bar", and if that is still too heavy, "switch to dumbbells
or another exercise" (p.31). It says nothing for General Mass. **Open decision — see §8.**

### Bodyweight loading

Two distinct rules, both from p.90, neither involving the bar:

- **Pure bodyweight**: max reps stands in for the 1RM. 10-rep max at 70% → 7 reps. The book gives no
  rounding rule for a fractional result. **Open — see §8.**
- **Weighted bodyweight**: bodyweight must be included in the calculation, "or things will get too heavy
  too fast" (p.90). So added weight = `percent × (bodyweight + added1RM) − bodyweight`, which means the
  app needs a stored bodyweight — which it does not currently have.

Josh is under 12 pull-ups, so pure-bodyweight pull-ups are a plausible S-cluster entry from day one.

---

## 5. Conditioning

Josh chose to follow the book: the app prescribes **Green** sessions during General Mass (p.20, p.98).

Green: Walk, Ruck, Recovery Run, Endurance Predator. **1–3 per week**, allowed on lifting or non-lifting
days, capped at 60 minutes (pp.99, 111).

Two consequences:

1. **`SessionType` needs to grow.** It is a closed union with exhaustive maps in `SESSION_META` and
   `TYPE_LABEL` (`codebase-map` §8.7). Proposal: add `'cond'` with a `conditioningId` naming the specific
   session, rather than adding four new union members. `'run'` and `'hic'` stay for historical rows.
2. **Runna is being retired during mass phases** — that is what "follow the book" means here, and the
   book is explicit that outside activity counts against the Green allowance (p.110). Strava sync stays,
   because Green sessions still need logging; what changes is that the app, not Runna, decides the week.

---

## 6. Beginner mode as fallback

MASS is the default. Beginner stays reachable but unadvertised — Settings, not the tab bar.

- `beginner` remains in the protocol registry with `family: 'legacy'`.
- Its generator is untouched. No behaviour change, no re-testing burden.
- The `<Route path="*">` catch-all stays (CLAUDE.md).
- **The name-collision rule in §3.4 is load-bearing precisely because of this decision.**

---

## 7. Test fixtures from the book

Following `test/calc.test.ts`, which is the model: assert the app reproduces the book's printed numbers
cell for cell, and assert the result is *not* the plausible wrong answer.

1. **Grey Man grid (p.51)** — all nine cells (3 weeks × main/S), sets, reps and percentages.
2. **A/B alternation (p.50)** — all nine lifting sessions of a block resolve to
   `A B A B A B A B A`, and block 2 opens on A again.
3. **Plate math** — round-trip a table of targets against a standard kg plate set; assert
   nearest-with-ties-down explicitly, and assert it is *not* always-down (the failure mode we chose
   against).
4. **Bodyweight reps (p.90)** — the book's own worked example: 10-rep max, `3 × 10 @ 70%` → 3 × 7.
5. **Forced Progression (pp.53, 90)** — +2.5 kg to the stored 1RM changes week 1 main load by 70% of the
   increment, and progression is skipped for a lift marked as struggled.
6. **Failure rule (p.53)** — Grey Man drops the 1RM by a flat **10%**, not 5–10%. Assert the number, so a
   later refactor cannot quietly harmonise it with Mass Template.
7. **Migration** — the 23-session v1 backup imports into the v2 schema unchanged; a v1 file still parses;
   history renders identically.

Percentages should be asserted in **lbs against the book's own examples where the book gives them**, with
kg conversion tested separately — the book is entirely in pounds and the fixtures should not launder that.

---

## 8. Open questions

Ordered by how much they block the build.

1. ~~**Base Building**~~ — **DECIDED (Josh, 2026-08-22): skipped.** Start at General Mass. A deliberate
   departure from the book's sequence (p.147 puts 6 weeks of Base Building first and p.151 calls it
   highly recommended), taken because Josh already runs and Base Building is largely conditioning he is
   getting anyway. Recorded as a **DEVIATION**, not an omission.
2. ~~**When a computed load falls below bar weight**~~ — **DECIDED (Claude): show "empty bar" and warn.**
   The book's only guidance is for SE — "go ahead and use the empty bar", and if that is still too heavy,
   "switch to dumbbells or another exercise" (p.31). The app will surface the same two options but will
   **not** substitute automatically: silently swapping an exercise would break the
   `(protocolId, exerciseId)` progress scoping in §3.4 and produce history the user did not choose.
   Most likely to bite on overhead press early on.
3. ~~**Rounding a fractional bodyweight-rep target**~~ — **DECIDED (Claude): nearest, ties down.** Same
   rule as weight rounding (§4), for consistency and for one less thing to remember. An 8-rep max at 55%
   is 4.4 → 4 reps. **DEVIATION** — the book is silent.
4. ~~**1RM entry on first run**~~ — **DECIDED (Josh, 2026-08-22): estimate from a 3RM.** The app walks
   through a 3RM for each of Bench, Squat, OHP and Deadlift and runs it through `estimate1RM` (Brzycki).
   Explicitly sanctioned: "There's also no need to test a true 1RM with this protocol. It's acceptable to
   perform a 2 or 3RM and determine 1RM using one of the many free online calculators" (p.90). The book
   names no formula, so Brzycki remains our choice — its book-anchored tests in `test/calc.test.ts`
   survive from the strip and stay valid. Pair it with p.64's warning in the UI: "DON'T start too heavy or
   overestimate your 1RMs".
5. **Bodyweight storage** — needed for weighted-bodyweight math (p.90) and for the nutrition formulas
   (p.120). Not currently in `Settings`.
6. ~~**Strava `redirect_uri`**~~ — **DECIDED (Josh, 2026-08-22): a second Strava API app.** Registered
   against `tb2.joshua-birch.co.uk`, leaving the live app's Strava integration completely untouched.
   **Blocked on Josh** registering it and supplying the client ID; the client secret goes in the `tb-app-v2`
   Pages environment, never in the repo. The app then needs its client ID to come from build config rather
   than being hardcoded, so the two variants can differ.
7. **Forced Progression against a training max** — if a cluster uses TM, does the increment apply to the
   true 1RM or the TM? Book silent (§2 of the extraction reconciliation). **Does not affect Grey Man** —
   parked until Specificity.

---

## 9. Suggested build order

Each step ends green and demonstrable on `tb2`.

1. ~~**`src/lib/barbell.ts` + tests.**~~ **DONE (2026-08-22).** `loadBar`, `targetLoad`,
   `bodyweightReps`, `weightedBodyweightAddedKg`, plus `DEFAULT_BAR_SETUP` for Josh's kit. 29 tests in
   `test/barbell.test.ts`, each rule asserted against the plausible wrong answer as well as the right
   one. Notably: the solver is exact subset-sum over the plate inventory rather than greedy
   heaviest-first, because greedy fails on an irregular set (20 kg per side from 15s and 10s), and the
   per-side target is deliberately not snapped to the unit grid before the nearest/ties-down comparison —
   snapping it first silently converts a round-down into a round-up.
2. ~~**Dexie v2 + `oneRm` table + `BACKUP_VERSION` 2 + migration tests.**~~ **DONE (2026-08-22).**
   The migration adds one store and touches nothing else. `test/migration.test.ts` builds a genuine v1
   IndexedDB (via `fake-indexeddb`), fills it, then opens the app's real `TBDatabase` over the top and
   asserts every session survives byte for byte, the settings row keeps even the keys the app no longer
   reads (`loadBasis`, `programMode`), and the indexes still resolve. `test/backup.test.ts` covers the
   v1-tolerant parse. The **real 23-session backup is exercised too** whenever it is present on the
   machine — it ran and passed. A committed synthetic fixture mirrors its exact shape (same keys, same
   session count, same exercise names, synthetic numbers) so the test is repeatable without shipping
   personal data.
3. ~~**Protocol registry.**~~ **DONE (2026-08-22).** New `src/protocol.ts` holds `Loading`,
   `LoadBasis`, `Prescription`, `Cluster`, `ClusterExercise`, `BlockPosition`, `Protocol` and the
   resolved plan shapes. `PHASES`/`PhaseMeta` are gone; `PROTOCOLS: Record<string, Protocol>` replaces
   them and `sessionFor()` now dispatches through `protocol.sessionFor()` instead of always calling
   Beginner. Beginner registers itself as `BEGINNER_PROTOCOL` with its A/B lifts exposed as clusters, so
   screens no longer need to import programme data. `Interval` moved to `types.ts` to break the
   `beginner ⇄ program` import cycle. `liftingOrdinalFor()` lands here too — Grey Man's A/B selector —
   with tests asserting it is neither day-of-week nor week parity. 20 new tests, including a
   week×day matrix proving Beginner's plan is byte-identical through the new dispatch.
4. ~~**Grey Man protocol definition + `sessionFor`.**~~ **DONE (2026-08-22).**
   `src/protocols/greyman.ts` holds the p.51 grid as data, the fixed main cluster (p.48), the book's
   example S cluster (p.49) and the A/B resolution. Loads resolve through `src/lib/barbell.ts`, with
   dumbbell, bodyweight-reps and weighted-bodyweight all handled. A missing 1RM produces an honest
   "Set your 1RM" note rather than a fabricated weight. 32 book fixtures in `test/greyman.test.ts`.
   `Protocol.maxScope` was added so all MASS templates share one set of maxes (`'mass'`) while Beginner
   keeps its own — the scope separates incompatible loading conventions (kg-per-dumbbell vs total on the
   bar), not templates. **Not yet reachable in the UI**: needs the 1RM entry screen (step 5) and the
   Session-screen load display (step 6), which still hardcodes a "kg/DB" label at `Session.tsx:135`.
5. ~~**1RM entry / estimation screen.**~~ **DONE (2026-08-23).** `src/screens/Maxes.tsx` at `/maxes`,
   reachable from Settings. Enter a 2–5 rep test set, `estimate1RM` (Brzycki) derives the 1RM, and a
   three-cell preview shows what it produces in weeks 1–3. Bodyweight exercises take max reps instead
   (p.90). A fresh test resets `progressedKg`, so Forced Progression never stacks on top of a retest.
6. ~~**Session screen rendering barbell sets.**~~ **DONE (2026-08-23).** The hardcoded `kg/DB` label is
   now driven by the set's loading mode, the +/- stepper uses the smallest loadable bar jump rather than
   the dumbbell increment, and a `PlateLine` shows the per-side plates and the unrounded target. `SetRow`
   stays hoisted and the Strava-safe write behaviour is untouched.

   Two bugs found only by running the app, both now covered by e2e:
   - **Beginner's double-progression badge leaked into Grey Man sessions.** It was gated on
     `plan.type === 'lift'` alone — exactly the trap CLAUDE.md warns about. Now scoped by protocol.
   - **`/maxes` crashed on load.** `useSettings` returns `DEFAULT_SETTINGS` before IndexedDB resolves, so
     the form seeded Beginner's exercise ids and then rendered Grey Man's.
7. ~~**S-cluster builder.**~~ **DONE (2026-08-23).** In `/plan`. Add and remove exercises, split them
   between S1 and S2, set each one's loading mode. Enforces the book's own limit — "Use no more than 4
   to 6" (p.49) — and can be reset to the book's example. Stored in `settings.mass.sCluster`.
8. ~~**Block plan + scheduling UI.**~~ **DONE (2026-08-23).** `settings.plan` holds an ordered list of
   blocks; `resolvePosition` walks it and reports `blockIndex`/`blockCount` alongside the week. Without a
   plan it falls back to the original single-phase behaviour, so Beginner and every existing install are
   untouched. `BRIDGE_PROTOCOL` implements pp.92–93 — `Rest Rest Rest Test Test Rest Rest`, with the test
   days marked optional because testing "is only required once before you start the protocol, and maybe
   before your first Specificity block" (p.93). The A/B alternation restarts at the top of every block.
9. ~~**Green conditioning.**~~ **DONE (2026-08-23).** All eight sessions extracted to
   `src/protocols/conditioning.ts` with their cards verbatim and their governing quote. A protocol
   carrying a colour fills its rest days with the matching session, never a lifting day. The book's
   caps are enforced (Green ≤3/week, Black ≤2/week and non-lifting days only, p.99); the *days* are a
   **DEVIATION**, since the book fixes the count but not the placement — default Tue/Sat, user editable.

Steps 1–4 are the substance. Nothing before step 4 changed what Josh sees on his phone.

---

## 10. What this design deliberately does not do

- **No AMRAP or peaking.** Grey Man has none (p.51). Building it now would be speculative work for the
  other three templates.
- **No training max.** Grey Man never uses one (§2.3). The `basis` field exists so the concept has a home
  when Specificity arrives, but nothing sets it to `tm90`.
- **No Specificity, no Base Building, no other General template.** The model accommodates them; the first
  build does not include them.
- **No nutrition or supplement tracking.** Extracted (section 08) but out of scope.

---

## 11. Decisions taken 2026-08-24 (Josh, in session)

Four design questions were put to Josh before any code was written, per the backlog's instruction that
**A5** and **A15** be discussed first. His answers are recorded here because they are now binding on the
implementation; the backlog entries point at this section.

### 11.1 A5 — automatic backups live in a new Dexie table (v3)

**Decision: a `snapshots` store, added in a Dexie v3 migration.**

The threat being defended against is a **user-level mistake**, not device loss: the un-gated "Load demo
history" button, "Reset to clean", and a bad import — all three reachable from Settings in production,
all three able to erase real training history in one tap. Device loss is already covered by manual
export, and always will be.

Why a Dexie table rather than OPFS, `localStorage` or an auto-download:

- **It survives every destructive path by construction.** `clearAll` (`src/dev/seed.ts:293`), the demo
  seeder (`:269`) and `importBackup` (`src/db.ts`) all clear tables **by name**. A store they do not
  name is untouched without anyone having to remember it. That is a structural guarantee, not a
  convention — and this project has been bitten four times by conventions call sites forgot.
- `localStorage` was rejected outright: a ~5 MB cap that the real history will grow into, failing
  silently, which is the worst possible behaviour for a safety net.
- OPFS was considered and set aside — it survives a Dexie-level catastrophe, but site-data clearing takes
  both out together, so the independence gain is small for materially more code and more failure modes.
- An auto-download was rejected: it prompts on every app open and fills the device's Downloads folder.

**Shape.** A snapshot is exactly the JSON `exportBackup()` already produces, plus the reason it was
taken. Reusing that function matters — it is the format `parseBackup`/`importBackup` already validate and
round-trip, and it is the one thing in this codebase with a real regression fixture behind it.

```ts
db.version(3).stores({ snapshots: '++id, takenAt' })

interface Snapshot {
  id?: number
  takenAt: number                 // epoch ms
  reason: 'app-open' | 'pre-demo' | 'pre-import' | 'pre-reset'
  json: string                    // exportBackup() output
  sessionCount: number            // for the restore list, without parsing
}
```

**Snapshots are NOT exported.** `exportBackup` must not include the `snapshots` table, or every backup
file would nest the previous ones and grow geometrically. `BACKUP_VERSION` therefore **stays at 2** —
the backup contract is unchanged, and a v2 file written before this change still restores identically.

**Restore** is a list in Settings (date, reason, session count), one tap, and **taking a snapshot first**
so that restoring the wrong one is itself undoable.

### 11.2 A15 — the planner fires at plan end; block boundaries get progression

**Decision: two distinct moments, two distinct prompts.**

| Moment | Prompt | Book |
|---|---|---|
| A **block** ends (every 3 weeks) | Forced Progression — per-lift +2.5 kg, skippable where he struggled | p.53, p.90 |
| The **plan** ends | Reassess and plan the next cycle | p.140, p.147 item 10 |

This is the book's own division. p.140 asks for reassessment *"after completing a standard cycle"* — once
a cycle, not once a block — while the increment rule is explicitly block-to-block. Firing the full
planner at every block boundary would put a plan-editing decision in front of Josh seventeen times a year
that the book asks for once, and would collide with the progression prompt on the same day.

It also disposes of A15's original symptom: the dead "Resume" button at the end of a plan
(`Today.tsx:117`) is **replaced by** the planner, not patched.

### 11.3 A15 — the default plan is the Standard Cycle truncated at the bridge

**Decision: `GM, GM, GM, GM, Bridge` — 13 weeks — and the planner is built to hold *several* named
presets, not one.**

Josh's words: *"We need to add Specificity before this app is finished. But we can have more than one
default (depending on current goal) so just do one now that is just GM and bridging as per the book."*

Two consequences, both binding:

1. **The preset list is a list.** Even though it holds one entry today, the planner's data model must be
   `PLAN_PRESETS: PlanPreset[]` keyed by goal, so adding "Standard Cycle (full)" and a 2:1 General:
   Specificity preset later is data, not a rewrite. See §11.5.
2. **Specificity is no longer optional work.** It moves out of "not built (deliberate)" and becomes a
   requirement for the app to be considered finished. The backlog is updated accordingly.

Why `GM ×4 + Bridge` is the faithful truncation rather than a deviation: p.140's Standard Cycle prints
*"General — 6 Weeks"* twice, and this project already decided (§ cross-chapter reconciliation 1, p.40,
p.67) that a 6-week General stint **is two 3-week blocks**. So blocks 1–2 of the printed cycle are our
four Grey Man blocks, and the printed cycle's block 3 is the Bridge. We stop exactly where the book turns
to Specificity. A bridge landing at week 13 is also precisely p.93's *"every two to three months"*.

**This fixes A14.** The current `defaultPlan()` — `GM, GM, Bridge, GM, GM` — moves the bridge to week 7
and drops the terminal one, an undeclared departure from the printed table. It is replaced, not labelled.

### 11.4 A15 — block what the book fixes, warn what it recommends

**Decision: two tiers, and the tier is decided by whether the book states a fact or gives advice.**

**Hard-blocked** — the book states these, and two of them are live bugs today:

| Rule | Page | Bug it closes |
|---|---|---|
| A General or Specificity block is **3 weeks** | p.40, p.67 | — |
| A Bridge block is **1 week** | p.92 | — |
| Block length is a **positive integer** | — | **A17**: `GM_GRID[1.5]` is `undefined` and blanks the session |
| The plan start date is a **Monday** | — | **A16**: a Wednesday start puts Grey Man's Mon/Wed/Fri on Wed/Fri/Sun, still labelled "Mon" |
| Conditioning colour **follows the block**, never chosen | p.20 | — |

**Warned but permitted** — the book advises here and explicitly hands the choice to the reader
(*"you can set-up a more customized ratio between General and Specificity as needed"*, p.140):

- No General blocks at all — *"I don't recommend excluding General completely"* (p.41).
- Three months or more of blocks with no bridge week (p.93).
- A General : Specificity ratio far from 2:1, the author's *"solid balanced approach"* (p.142).

Warn-only was rejected for the blocked tier because those are **bugs, not preferences** — a 1.5-week
block blanks the session screen and a Wednesday start silently rotates the whole training week.
Block-everything was rejected because it would turn the author's rules of thumb into laws he did not
write.

### 11.5 What §11.3 requires of the planner's shape

```ts
interface PlanPreset {
  id: string
  name: string          // "Standard Cycle (General only)"
  goal: string          // the goal it serves, shown under the name
  blocks: PlannedBlock[]
  cite: string          // the page it comes from — every preset must carry one
  note?: string         // e.g. why it stops where it does
}
```

A preset with no `cite` is not a preset. The one shipping today stops at the bridge because Specificity
does not exist yet, and its `note` must say so rather than leaving the truncation silent.

---

## 12. DEVIATION — how the Forced Progression increment is chosen

**Question Josh asked, 2026-08-24:** *"Does it mention anywhere in the book about the type of movement
it is? In the TB2 book it says to increase by a higher weight if it's a lower body lift but stick to the
lower option if it's an upper body movement. Is that the same here?"*

### What the book says: nothing

Mass Protocol prints the progression rule **six times** — pp.47, 53, 57, 62, 77, 83 — and every one is
word-for-word identical:

> *"Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for
> exercises you struggled with - use the same numbers for the next block."*

**It never distinguishes movement type, and never says how to choose 5 versus 10.** The extraction had
already recorded that silence twice, before the question was asked:

> *"It also does not say whether the 5–10 lb increment differs by lift (e.g. upper vs lower body)."*
> — section 03, Ambiguities §9
>
> *"How much to add at progression. 'add 5-10lbs' (p.83) — a range, not a number."*
> — section 06, Ambiguities §14

A search of the author's own forum found no guidance either: the
[Forced Progression thread](https://tacticalbarbell.com/forum/viewtopic.php?t=160) is community members
only, and none of them distinguish upper from lower.

### What settles the cadence: the book, actually

The "every 3 to 6 weeks" range looked like it left a choice, but two other passages close it:

- p.64's chapter heading: **"PROGRESSION from block to block is where the magic happens"**
- p.90: *"progression simply consists of adding weight to your 1 rep maximum and recalculating **from
  block to block**"*

So the app progresses at **every block boundary** (3 weeks), not every other. This is book-derived, not
a choice — an earlier draft of this decision offered "every other block" as the *more* faithful option
and that was wrong.

### The deviation: the split

**Tactical Barbell I does specify it**, for the same author's Forced Progression under Operator:
*add 5 lb to upper body lifts (Bench Press, Pull Up) and 10 lb to lower body lifts (Squat, Deadlift)*
([Liftosaur's TB Operator reference](https://www.liftosaur.com/programs/tactical-barbell-operator)).

MASS's range **is exactly those two numbers**. That reads as the author stating the bounds of a rule he
had already published, rather than replacing it with an undifferentiated one — so the split is the most
probable reading of this book's range rather than an import from another book.

**It is still a deviation**, because MASS does not say it. Recorded here, stated on the screen itself,
and asserted in `test/progression.test.ts`.

| | Increment | In pounds | Applies to |
|---|---|---|---|
| Lower body | **4.5 kg** | 9.92 lb | Squat, Deadlift, Front Squat |
| Upper body | **2.5 kg** | 5.51 lb | Bench, Overhead Press, and everything unclassified |

Both land inside the printed 5–10 lb range. **5 kg was rejected**: it is 11.02 lb, over the top end.
An exercise with no `bodyPart` gets the SMALLER increment — a user-built S exercise the app knows
nothing about should progress conservatively.

**One rate note, for honesty.** TB1's blocks are 6 weeks and MASS's are 3, so applying TB1's numbers per
MASS block is roughly double TB1's rate. That is defensible here — MASS is run in a calorie surplus at
submaximal loads (70–80%), and unlike TB1 this app can detect struggling and brake itself — but it is a
real difference and should not be papered over. The brake is what follows.

### The second deviation: the middle gear

The book's rule is **binary** — progress, or hold. The app adds a third outcome:

| Choice | When the app proposes it | Kilos |
|---|---|---|
| `full` | A clean block | the lift's full increment |
| `eased` | Sets were logged short of the best set of their own session | **half**, to 0.1 kg |
| `hold` | The lifter tapped "struggled with this" | 0 — *"use the same numbers"* (p.53) |

`hold` is the book's, verbatim. **`eased` is ours.** It does not contradict p.53 so much as apply it
more gently, and it exists because the increments above run near the top of the book's range — a faster
base rate is only defensible if something can pull it back.

The invariant that keeps it bounded, and which `test/progression.test.ts` asserts: the book sanctions
**0** (hold) and it sanctions the **full increment**, so any value strictly between two book-sanctioned
values is itself bracketed by the book, even though the particular number is our choice.

`eased` is detected from data already logged — no extra tap. The lifter's own "struggled" mark is the
only thing that requires an action, and it is the one judgement the book explicitly asks the lifter to
make.

### Why this shape at all

Josh's requirement, in his words: *"the whole point in this app is that it takes the thinking out of
lifting for me. I have MacroFactor to take the thought off the diet, the same needs to happen to the
lifting app."*

So the screen proposes a complete answer for every lift, with its reason, and every alternative is one
tap away. In a normal block there is nothing to decide.

---

## 13. Two sessions in one day (backlog F1)

**Decided with Josh, 2026-08-24.** This is a data-model change to the riskiest table in the project, so
the reasoning is recorded before the code rather than after it.

### The requirement, in his words

> *"Allow two sessions per day, in case I ever need to shorten my week by doubling everything up."*
> — and, asked what that should look like:
>
> *"Let's say it's a Tuesday, and I am supposed to do conditioning in the morning & Wednesday is my next
> lifting day. Let's say that on Wednesday I'm waking up early to travel to the other side of the
> country, I would want to push the lifting on Wednesday forward to Tuesday so I'd: run in the morning &
> lift in the night. Same thing goes in reverse if the morning session is lifting and I had to push
> tomorrow's running session forward to accommodate, I'd lift in the morning and run in the evening.
> **I cannot be allowed to lift twice in one day.**"*

Two things follow, and they are both binding:

1. **The escape hatch is optional and rare.** *"I will only ever reschedule my week like that if I am
   genuinely struggling for time."* The programme must never prescribe two sessions; the app must never
   look like it is proposing a double day. The offer is one quiet line at the bottom of Today.
2. **The second session is always a different KIND.** Never two lifts.

### Why there is no slot index

That second rule is the discriminator. A date holds **at most one lift-family row and at most one
cardio-family row**, so `(date, family)` identifies a row uniquely and "two lifts in a day" is not a
state the data can represent at all.

That is a stronger guarantee than a check, and this codebase has been bitten five times by rules that
lived in a call site rather than in the shape of the data. An integer `slot` would have been more
general and strictly worse: it would have permitted exactly the thing Josh ruled out, and every read
would then have needed to ask *which* of two lifts it meant.

`familyOf` is deliberately coarser than `SessionType`: `'se'` is a lift and `'hic'` is cardio, so the two
legacy types Josh's logged history still carries keep behaving like the ones that replaced them.

### DEVIATION from the backlog: no Dexie v4

`docs/BACKLOG.md` specified *"Dexie v4 keyed on something like (date, kind)"*. **It was not needed, and
it was not done.**

`sessions.date` was already a **non-unique** index and `where('date').equals(…)` already returned every
matching row. The one-row-per-date assumption lived entirely in the READS. So this ships as an additive
optional field, `SessionLog.pulledFrom`, exactly the way `LoggedExercise.struggled` did:

- no version bump, no index rebuild, no `upgrade()` callback;
- `BACKUP_VERSION` stays **2**, and v1/v2 files round-trip untouched;
- nothing already in a backup file is reinterpreted.

A **unique compound index** was the obvious alternative and was rejected outright. Creating one populates
it over existing rows, so a database an older build had already left a duplicate in would fail to open
**at all** — and duplicates are known to exist in the wild, which is why `sessionForDate` has a merge
repair. Trading "can never open your only copy of real training history" for "the engine enforces a rule
the shape of the data already enforces" is not a trade this project makes: *data loss is the
highest-severity failure mode* (CLAUDE.md).

### The model

| | |
|---|---|
| `src/lib/sessions.ts` | pure: `familyOf`, `repairDate`, `mergeRows`, `coverFor`, `pullForwardBlocker` |
| `sessionsForDate(date)` | every row on a date, repaired |
| `sessionForDate(date, family?)` | the row holding one kind of work |
| `SessionLog.pulledFrom` | ISO date this session was **prescribed for**, when trained early |

On a pulled-forward row, `date` is the day it was **done** — so streaks, weekly counts and Strava all see
the truth — while `phaseId`/`week`/`day` describe the slot it **fulfils**, so the prescription and the
Strava activity name are the borrowed day's.

`repairDate` does two things and only two: it merges duplicates **within** a family (the audit A6 repair,
now correctly scoped), and it drops an **empty** auto-completed rest row once real work shares its date —
a day you trained on is not a rest day. A rest row carrying a Strava link, notes or a duration is kept,
because something put it there.

### What this closes

- **code-01 F7** — properly, not by refusing. A morning Strava run and an evening lift now coexist. Under
  MASS that is a normal week, not a corner case: Green conditioning **is** the running (p.99).
- **The Green session sharing a lifting day** (p.99) has a row of its own and can be ticked. It had been
  informational only, which made the Plan screen's day picker lie about what it scheduled.
- **`stravaSync`'s `byDate` map**, which held whichever row came last and so reconciled activities
  against a coin toss on any day carrying both.
