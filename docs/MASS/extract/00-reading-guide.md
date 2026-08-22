# Tactical Barbell: Mass Protocol — book extraction

**Extracted:** 2026-08-21/22 · **Source:** `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`
**Status:** extraction complete. No application code written. Three decisions have since been taken by
Josh and are marked inline as DECIDED; everything else is left open.

---

## How to read this document

Nine agents each read one chapter range of the book and wrote one section. This file is the guide and
the cross-chapter reconciliation; sections 01–09 follow, in book order.

### The page-reference convention

Every claim in this document carries a page reference like `(p.45)`.

**These are PDF page numbers of this exact file**, counting the cover as page 1. The PDF is a calibre
9.2.1 conversion of the EPUB and carries **no printed page numbers**, so there is no other stable way to
cite it. If the file is ever replaced with a different edition or conversion, every reference in this
document must be re-checked.

### Where the numbers came from

**Every template table in this book is an embedded raster image, not text.** The PDF has a good text
layer — 143,884 characters over 160 pages — but it contains only the prose and captions. All 71
programming grids, cluster lists and formula boxes are pictures. A text-only extraction would have
captured every caveat and not one percentage.

The images were extracted to `docs/MASS/images/pNNN_N.png` and each agent transcribed the ones in its
range visually, cell for cell. Where a grid mattered, the transcription was cross-checked against the
rendered PDF page. Cells that are blank in the book are blank here; formatting quirks in the original
(`Day1` without a space, `10x3` without spaces, inconsistent `DL: 1 x 5` vs `DL: 1x5`) are reproduced
rather than tidied, so that a later reader can tell a book inconsistency from a transcription error.

### What is deliberately *not* here

The nine section files take no decisions at all. Where the book offers a choice, they record the choice
and — separately, and labelled — the author's own recommendation, if he gives one. Where the book is
silent or contradicts itself, that is recorded as unresolved. Each section ends with its own
"Ambiguities and choices" list.

The reconciliation below is the only part of this document that goes beyond the book, and it says so
explicitly at each point: `DECIDED` marks a call Josh has made, `RESOLVED BY THE BOOK` marks a conflict
that dissolves once two chapters are read together, and anything else is still open.

---

## Confirming the two-phase understanding

The working assumption going in was: *MASS is two phases — General Mass (heavy barbell compounds and
bodyweight) and Specificity (permissive isolation work).*

**Confirmed in outline, wrong in two specifics.**

**Confirmed.** The protocol is built from exactly two resistance-training phases, General Mass and
Specificity, run in blocks whose ratio the reader controls (p.40). "If General Mass is the broadsword,
Specificity is the scalpel" (p.39). A reader who only wants bulk may "disregard Specificity completely"
(p.40); the author does not recommend the reverse — "I don't recommend excluding General completely
during hypertrophy phases" (p.41).

**Correction 1 — General Mass is four templates, not one.** Mass Template, Grey Man, Gladiator and
Fighter HT (pp.39, 42–62). They differ in cluster, in days per week (3 or 4), and in their grids. All
four are extracted in sections 03 and 04.

**Correction 2 — Specificity is not permissive about loading.** It comes in two named versions (p.68):
**Alpha**, a 50/50 split of two maximal-strength days and two hypertrophy days, and **Bravo**, four days
of pure hypertrophy. In both, **sets, reps and percentage are fully prescribed by a printed grid** — the
reader is told to "Refer to the programming table to figure out how much weight to use, along with sets
and reps" (p.78), and even the optional intensity tactics lock the load: "The only thing that changes is
how many reps you do – not the load… don't add an extra pound to that number" (p.76).

What *is* free in Specificity is **exercise selection**: "You can create your own MS cluster" (p.71),
"This is where you get input and can include all your favorite exercises while targeting areas of
weakness" (p.72).

For the app this is a better outcome than expected. Specificity is not a free-text slot — it is the same
shape as General Mass (a week × day-type grid) with a user-defined exercise list plugged into it. Both
phases can share one prescription model. The genuinely variable part is *which exercises are in the
cluster*, not *what to do with them*.

Two further structural facts that were not in the original assumption:

- **Base Building** is a real third phase — 6 weeks, SE + Endurance, specific to Mass Protocol and
  explicitly *not* the TB II Base Building (pp.25–26).
- **Conditioning is a property of the block, not of the session.** "Use Green sessions when training
  General Mass blocks. Use Black with Specificity" (p.20). Eight named sessions, four Green, four Black
  (p.98).

---

## Cross-chapter reconciliation

Nine agents reading nine ranges independently surfaced a set of conflicts that only appear when the
sections are put side by side. These are the things that must be settled before any code is written,
because each one changes the data model or the arithmetic.

Two are now settled (§1 by Josh, §2 by the book itself). The rest remain open.

### 1. How long is a General Mass block? — DECIDED (Josh, 2026-08-22)

**Decision: blocks are 3 weeks throughout. A phase runs any multiple of 3 weeks.** So "General 6 Weeks"
in the Standard Cycle is two 3-week General blocks, and a longer General stint is simply more of them —
e.g. 4 × 3-week General blocks followed by 1 × 3-week Specificity block.

This matches the book's own explicit statement (p.40, "Both General and Specificity consist of 3-week
blocks"), matches every printed template grid, and is corroborated by community practice. It leaves
p.140's "6 Weeks" as loose wording for two blocks rather than a different block length.

*Evidence that produced the question, kept for the record — the book states it two ways and never
reconciles them:*

| Source | Says |
|---|---|
| p.40 | "Both General and Specificity consist of **3-week blocks**." |
| pp.43–62 | Every template grid prints exactly **3 weeks** (Mass p.45, Grey Man p.51, Gladiator p.55, Fighter HT p.60). |
| p.140 (Standard Cycle image) | "Block 1 — General — **6 Weeks** (Green)", "Block 2 — General — **6 Weeks** (Green)". |
| p.140 | Specificity blocks are **3 Weeks** — consistent with p.40 and p.67. |
| p.141 | "a **5-block** cycle"; "2 blocks of General + 1 Block Specificity". |

So the conflict is confined to General: the word "block" means 3 weeks in the template chapters and 6
weeks in the Standard Cycle. Specificity is 3 weeks everywhere.

The obvious reading is that a 6-week General block is the 3-week wave run twice with 1RMs bumped in
between — which would sit neatly with "Every 3 to 6 weeks, add 5-10lbs to 1RMs" (pp.47, 53, 57, 62) and
with "When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast" (p.64).
**But the book never says this.** It is inference, and under the fidelity rule it does not get to become
the implementation without a decision from you.

**This single question determines the entire scheduling model** — how many weeks a phase runs, when the
wave restarts, and when 1RMs move.

### 2. Does the 1RM get incremented, or re-tested? — RESOLVED BY THE BOOK (p.90, p.93)

**Not a contradiction.** The two mechanisms operate at different times, and the book says so plainly in
two places that sit outside the template chapters where the increment rule is printed:

> "There's no need to regularly test your 1 rep maximums with this protocol. **Test as required when
> changing phases or incorporating new exercises. From there on progression simply consists of adding
> weight to your 1 rep maximum and recalculating from block to block.** Also referred to as Forced
> Progression in the Tactical Barbell system." (p.90)

> "When it comes to this program, **testing is only required once before you start the protocol, and
> maybe before your first Specificity block.** If no 1RM testing is required than Test Days become Rest
> Days." (p.93)

So the rule is:

| Event | Mechanism | Source |
|---|---|---|
| Starting the protocol | Test 1RMs | pp.90, 93, 147 |
| Changing phase (General → Specificity) or adding a new exercise to a cluster | Test 1RMs, "as required" | pp.90, 93 |
| Block to block, otherwise | **Forced Progression** — add 5–10 lbs to the stored 1RM and recalculate | pp.47, 53, 57, 62, 77, 83, 90 |
| Struggling / repeatedly failing sets | Drop the stored 1RM by 5–10% and recalculate | pp.45, 152 (Grey Man says 10% flat, p.53) |

The Consolidation checklist (p.147) is consistent with this — it is the start-up sequence, and its three
test points are all "before you start" or "changing phase" events, not a recurring cadence.

Two things this settles for the app:

- **The stored 1RM is a mutable number that drifts upward**, not a test result that is periodically
  refreshed. "Forced Progression" is the book's own name for it, and it is the default path.
- **A true 1RM never has to be lifted.** "There's also no need to test a true 1RM with this protocol.
  It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators"
  (p.90). This directly validates keeping `estimate1RM` (Brzycki) — the book explicitly sanctions
  estimating the 1RM from a low-rep set, though it names no specific formula.

**One genuinely new ambiguity falls out of this**, where it meets the training max (§3 below): if a
cluster is using a TM, does Forced Progression add 5–10 lbs to the **true 1RM** (with the TM re-derived
as 90% of it) or to the **TM** itself? The book never says. Only affects the Bulgarian cluster.

*Evidence that produced the original question, kept for the record:*

- **Increment.** "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force
  progression for exercises you struggled with." Repeated verbatim in six places (pp.47, 53, 57, 62, 77,
  83) — once at the end of every template chapter.
- **Re-test.** The Consolidation checklist (p.147) says to test 1RMs before Base Building, before picking
  a General template, and during Bridge Week before Specificity. Bridge Week's own layout sets aside
  Days 4 and 5 as Test days (p.92), with "If no 1RM testing is required than Test Days become Rest Days".
- **Correct downwards.** "If you're struggling, drop 5-10% off your 1RMs and continue" (p.152). Also
  in-template: on repeated failure, "lower your 1 rep maximums by 5-10% and recalculate" (p.45) — but
  Grey Man says **10%** flat for the same situation (p.53).

Three mechanisms, all moving the same stored number, with no stated precedence. The app needs one
`1RM` field per lift and a decided rule for when each mechanism fires.

### 3. 1RM or Training Max?

**There is no training max in this protocol, with exactly one exception.**

Every percentage in every General Mass template and in both Specificity templates is a percentage of the
**tested 1RM** (pp.45, 51, 55, 60, 74, 83, 90). Section 05 confirms the concept appears nowhere in
pp.67–79.

The exception is the **Bulgarian cluster** (pp.88–89): *"If you decide to go with this, I highly
recommend using a training maximum in place of a 1 Rep Max for both MS and MH clusters. A training
maximum or TM is 90% of your True/or 1 Rep Max. The TM is used instead of the 1RM to calculate your
weekly loads."*

**What a training max is.** A deliberately understated 1RM. Instead of running percentages off what you
can actually lift once, you run them off 90% of it, so every prescribed weight comes out ~10% lighter.
With a 100 kg squat 1RM, an Alpha week-1 MS set at 75% is 75 kg off the true 1RM but 67.5 kg off a 90 kg
TM. Same programme, same percentages, permanently lighter bar.

**Why the book introduces it only here.** The Bulgarian is 3 lifts in MS and the same 3 in H — "a high
frequency template that revolves around the big 3", "the nuclear option", "a serious cluster for
experienced lifters that have a realistic understanding of their work capacity" (p.88). You hit the big
three twice a week heavy *and* twice a week for volume. At true-1RM percentages that buries most people,
so the TM is the safety valve for that one cluster's frequency. It is a recommendation ("I highly
recommend"), not a rule, and it appears nowhere else in the book.

**Why the level matters for the app.** The loading basis has to be a property of the **cluster the user
selected**, resolved per session — not a field on settings, not a field on the phase, not a global
toggle:

- If TM lived on settings or on the Specificity phase, picking the Bulgarian would drop the loads on
  every other cluster too — or turning it on would quietly lighten General Mass as well.
- If it were baked into the stored max, switching clusters would leave the previous cluster's basis
  behind on the number.

This is the same shape of bug the old implementation had: `MaxEntry` was keyed by `liftId` with no
protocol scope, so a rebuilt protocol reusing an old id inherited stale progression state
(`docs/codebase-map.md` §8.5). The fix is the same — scope the basis to the thing that owns it.

Concretely: `basis: '1rm' | 'tm90'` belongs on the cluster definition, and the load calculation reads it
from the resolved session, never from user settings.

*(Note: `MH cluster` is used on pp.86 and 88 but never defined anywhere in the book.)*

### 4. The book gives no weight-rounding rule. At all.

Searched across the full text: no "round", no "nearest", no "plate", no bar weight, no per-side
breakdown, anywhere in 160 pages. The only worked example divides exactly (300 × 75% = 225; 100 × 75% =
75, p.75) and so reveals nothing.

This matters because **TB1's floor-rounding rule does not carry over** — the earlier audit established
"rounds down on the weights if necessary" from TB1 p.113, but that book is not this book, and this book
is silent. Any rounding the app does is a **deviation that has to be chosen and documented as such**,
not sourced.

Related silences: no bar weight, no plate inventory, no per-side math, and no rule for what to do when a
computed load falls below the empty bar (Base Building alone addresses that — "use the empty bar",
p.31).

**And the one passage that looks like a rounding philosophy does not apply here.** Base Building says
"No need to get ultra-precise with your calculations. Get within the ballpark. If in doubt, always err on
the side of lighter" (p.31) — but it prefaces that with "Strength-Endurance training is about reps first,
NOT LOAD. **This isn't maximal-strength training**" (p.31). The leniency is explicitly scoped to SE and
explicitly contrasted with the precision expected elsewhere. It cannot be carried into General Mass or
Specificity.

Rounding is therefore an equipment question before it is a book question: the granularity available is
whatever the plate set allows (with standard kg plates down to 1.25 kg, the smallest jump is 2.5 kg on
the bar).

#### The rule — DECIDED (Josh, 2026-08-22), as a documented deviation

**Round the computed target to the nearest weight loadable on the bar with the plates available. On an
exact tie, round down. Always display the exact target alongside the loaded weight, together with the
per-side plate breakdown.**

This is **not** sourced from the book — the book has no rule — so it is recorded here as a deviation.
It comes from the second pass permitted by the fidelity rule: outside research after the extraction was
complete. The r/tacticalbarbell thread "Inconvenient 1RM percentages" is the clearest statement of
community practice, and its two most-upvoted answers compose into the rule above:

- "Just look at the percentages as indications not strict rules and get the closest weight you can get
  with the equipment at your disposal" (19 votes) → round to **nearest**.
- "When in doubt always round down. There is a reason it's called sub maximal lifting" (18 votes) →
  break ties **downward**.

Nearest rather than always-down is deliberate. Always-down is unbiased-looking but systematically
under-loads: at a 32 kg target on a 2.5 kg grid it gives 30 kg, 6% light on every set. Nearest bounds
the error at half an increment and does not accumulate.

The display requirement is the substantive half of the decision. Because the rounding is ours and not
the book's, it must be **visible rather than hidden** — the screen shows the exact percentage target,
the weight actually loaded, and the plates per side, so the deviation is always auditable against the
book.

#### Two consequences that move the numbers more than the rule does

1. **Plate granularity — DECIDED (Josh, 2026-08-22): microplates optional, not required.** With 1.25 kg
   as the smallest plate the bar moves in 2.5 kg steps, so the rounding error is bounded at 1.25 kg,
   roughly 1.5–3% of a typical working weight. A pair of 0.5 kg microplates halves that but changes
   nothing structural.

   *Correction to an earlier note in this file:* plate granularity does **not** constrain Forced
   Progression. "Add 5-10lbs to 1RMs" (p.90) applies to the **stored 1RM**, not to the loaded bar — the
   1RM is never itself lifted, so it need not be a loadable number. Only the recalculated working weight
   is rounded.

   The app's plate inventory must be user-configurable regardless, so microplates can be added later
   without a code change.
2. **Bar weight is a hard floor.** A 20 kg bar cannot go lighter than 20 kg. The book addresses this
   only for Base Building SE — "go ahead and use the empty bar", and if the empty bar is still too much,
   "switch to dumbbells or another exercise" (p.31). It says nothing for General Mass or Specificity,
   where week-1 loads are 55–65% of 1RM. Given the existing training history is all dumbbell work, some
   early barbell 1RMs may put 55% under 20 kg. **Open: warn, substitute dumbbells, or display "empty
   bar"?**

### 5. Units: the book is in pounds, throughout

Every load, every increment, every formula is lbs (pp.68, 75, 77, 120). "Add 5-10**lbs**". The nutrition
formulas take bodyweight in lbs (p.120). There is no kg figure and no conversion guidance anywhere.

The app is in kg. Every increment, clamp and rounding step will therefore be a conversion, and the
book's printed worked examples — which are the test fixtures — are in lbs. Fixtures should assert in
lbs against the book, with conversion tested separately.

### 6. Three loading modes, three different calculations

The current `PlannedSet` carries `perDumbbell: true`. The rebuild needs three modes, and they are not
variations of one formula:

1. **Barbell** — load = % × 1RM. Needs bar weight, plate pairs, rounding, per-side breakdown. None of
   which exists in the codebase, and none of which the book specifies (see 4).
2. **Pure bodyweight** — the percentage applies to **max reps, not weight** (p.90). With a 10-rep max,
   `3 x 10 @ 70%` means 3 sets of 7. No rounding rule is given for fractional results.
3. **Weighted bodyweight** (the WPUs in the Mass Template cluster) — bodyweight **must be included in
   the calculation** or "things will get too heavy too fast" (p.90).

Plus the existing per-dumbbell mode, which must keep working for the logged beginner history.

### 7. Conflicts inside single chapters, carried forward

Recorded in full in the section files; listed here because they will each need a decision:

- **Mass Template, Week 3 / Day 5 is blank** in the p.45 grid, while p.44 says Days 1/3/5 are trained
  throughout. Verified at magnification. The template you are most likely to run has an undefined day.
- **Base Building is called both optional and mandatory** (pp.17–18, 151).
- **SE load range is stated three ways** — 10–25% (p.26), 15–30% (p.28), and the p.30 table prints
  15/20/25% for weeks 1–3 and 20/25/30% for weeks 4–6.
- **The p.26 Base Building week table puts E on Days 1/3/5**, contradicting four other tables that put
  SE there.
- **Anabolic Sprints carries a GREEN banner on p.104** but is listed under BLACK on p.98. Confirmed at
  the PDF object level (pp.100–104 all reference the same GREEN banner image).
- **Fighter HT Week 2 / Day 6 is `5 x 5`** where Days 1 and 4 that week are `5 x 6`. Transcribed as
  printed; may be intentional (deadlift day) or may be a typo.
- **`OHP+` appears in the Mass Template peaking text** (p.46) although the MT cluster contains no
  overhead press; and the peaking worked example names the bench for Week 3 / Day 1 where the grid and
  the AMRAP paragraph both say squat.
- **Grey Man cluster selection depends on week parity** — A/B/A then B/A/B then A/B/A across Days 1/3/5
  (p.50). A day-of-week lookup alone is not sufficient to determine the session.
- **Nutrition**: 300–500 kcal (p.122) vs 500 kcal (p.123) increment; 30/30/40 split (p.122) vs "the same
  ratio" (p.123); Formula 2's box says only "BW" where Formula 1 defines "BW = bodyweight in lbs"
  (pp.120–121).

### 8. What the book never says at all

No rule anywhere for: **missed sessions**, **weight rounding**, or a **mandatory deload** (Bridge Week is
recommended every 2–3 months, never required — p.93). The book also names **no specific 1RM-estimation
formula**, deferring to "free online calculators" (p.90), while explicitly permitting estimation from a
2RM or 3RM. The FAQs (pp.151–156) — the usual home for exactly these edge cases — do not cover them
either. Each is an app decision that must be documented as a deviation from the source.

---

## Section index

| Section | Scope | PDF pages |
|---|---|---|
| 01 | Introduction, History, The Holy Trinity, Overview | 7–22 |
| 02 | Base Building — SE and Endurance | 23–36 |
| 03 | General Mass — Mass Template & Grey Man | 37–53 |
| 04 | General Mass — Gladiator, Fighter HT, Miscellaneous | 54–66 |
| 05 | Specificity — overview & Alpha | 67–79 |
| 06 | Specificity Bravo, Sample H Clusters, Bridge Week | 80–93 |
| 07 | Conditioning | 94–111 |
| 08 | Nutrition & Supplements | 112–138 |
| 09 | Block Programming, OMS, Consolidation, FAQs | 139–160 |

---
