# MASS rebuild — design document

**Written:** 2026-08-22 · **Branch:** `mass-extraction` · **Status:** design only, no code written yet.

Source of truth for the programme is `docs/MASS/MASS-extraction.md`. Every programme rule below carries
the PDF page reference from that document. Where this design departs from the book — and it does in
three places — it is labelled **DEVIATION** and says why.

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

### 2.4 Execution rules (pp.50–53)

- Main lifts first, then S exercises (p.50).
- Rest: 2–5 minutes on main lifts, 1–2 minutes on S (p.53).
- Super-setting is permitted for S exercises (p.53).
- On failure: **lower the 1RM by 10%** and recalculate (p.53). Note Grey Man says a flat 10%, where Mass
  Template says 5–10% (p.45) — a per-template rule, not a global one.
- "Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight
  work, nothing" (p.64) — but Grey Man's S cluster *is* the sanctioned outlet for exactly that (p.49).
  The S cluster is the exception; the app should not offer an "add extra exercise" affordance outside it.

### 2.5 Progression (p.53, p.90)

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
  platePairsKg: number[]   // e.g. [25, 20, 15, 10, 5, 2.5, 1.25], optionally + [0.5]
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

1. **Base Building — skip it or run it?** The book puts 6 weeks of Base Building before the first General
   block and calls it "highly recommended" (Consolidation step 5, p.147; p.151). It is SE circuits plus
   endurance work — a substantial separate build. *Recommendation: skip it for now and start at General
   Mass.* Josh has been training a month, already runs, and Base Building is mostly conditioning he is
   getting anyway. But it is a deliberate departure from the book's own sequence, so it needs saying out
   loud rather than quietly dropping.
2. **When a computed load falls below bar weight** — empty bar, dumbbell substitute, or a warning? The
   book answers only for SE (p.31). Most likely to bite on overhead press early on.
3. **Rounding a fractional bodyweight-rep target** — 8-rep max at 55% is 4.4 reps. Book is silent.
4. **1RM entry on first run.** Josh has no barbell yet, so there are no tested maxes. Does the app ship
   with an estimate-from-a-3RM flow (sanctioned by p.90), a manual entry, or both? This gates the very
   first session.
5. **Bodyweight storage** — needed for weighted-bodyweight math (p.90) and for the nutrition formulas
   (p.120). Not currently in `Settings`.
6. **Strava `redirect_uri`** — still `window.location.origin`, and Strava allows one callback domain per
   app (CLAUDE.md). Unresolved, and it blocks Strava on `tb2`. Independent of MASS but on the critical
   path to using the new app for real.
7. **Forced Progression against a training max** — if a cluster uses TM, does the increment apply to the
   true 1RM or the TM? Book silent (§2 of the extraction reconciliation). **Does not affect Grey Man** —
   parked until Specificity.

---

## 9. Suggested build order

Each step ends green and demonstrable on `tb2`.

1. **`src/lib/barbell.ts` + tests.** Pure functions, no UI, no schema. Highest-risk arithmetic, zero
   blast radius. Do it first.
2. **Dexie v2 + `oneRm` table + `BACKUP_VERSION` 2 + migration tests**, including the real 23-session
   round-trip. Schema work before anything depends on it.
3. **Protocol registry** — `Protocol`, `Cluster`, `Prescription`, `Loading`; move `beginner` into it
   unchanged and prove nothing regressed.
4. **Grey Man protocol definition + `sessionFor`**, with the book-fixture tests from §7.
5. **1RM entry / estimation screen** (resolves open question 4).
6. **Session screen** rendering barbell sets with plate breakdown, preserving the `SetRow` hoisting and
   the Strava-safe write behaviour CLAUDE.md calls out.
7. **S-cluster builder.**
8. **Block plan + scheduling UI.**
9. **Green conditioning.**

Steps 1–4 are the substance. Nothing before step 4 changes what Josh sees on his phone.

---

## 10. What this design deliberately does not do

- **No AMRAP or peaking.** Grey Man has none (p.51). Building it now would be speculative work for the
  other three templates.
- **No training max.** Grey Man never uses one (§2.3). The `basis` field exists so the concept has a home
  when Specificity arrives, but nothing sets it to `tm90`.
- **No Specificity, no Base Building, no other General template.** The model accommodates them; the first
  build does not include them.
- **No nutrition or supplement tracking.** Extracted (section 08) but out of scope.
