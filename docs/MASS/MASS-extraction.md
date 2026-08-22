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

1. **Plate granularity.** With 1.25 kg as the smallest plate, the bar moves in 2.5 kg steps. A pair of
   0.5 kg microplates takes that to 1 kg and makes rounding nearly moot. It also matters for Forced
   Progression: "add 5-10lbs" is 2.3–4.5 kg, which does not land on a 2.5 kg grid either. **Open: does
   Josh buy microplates?** The app's plate inventory must be configurable regardless.
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


---

# 01 — Introduction & Overview (PDF pp. 7–22)

Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
All page references below are **PDF page numbers of that exact file**, in the form `(p.14)`.
Covers Part I (Introduction, A Brief History Lesson, The Holy Trinity) and Part II (Overview, Base Building, Resistance Training, Conditioning, Nutrition, Stop (Over)Thinking & Execute).

Images transcribed for this range: `docs/MASS/images/p014_1.png`, `p019_1.png`, `p022_1.png`. All three are **callout/banner boxes**, not data tables — there are no numeric grids, percentage tables, set/rep schemes or load tables anywhere in pp. 7–22. The first prescriptive numbers in the book appear after p.22.

---

## Table of contents context (pp. 5–6, for orientation only)

The book's own contents list places this extract's material as (p.5):

```
I. Introduction
   A. Introduction
   B. A Brief History Lesson
   C. The Holy Trinity
II. Overview
   A. Overview
   B. Base Building
   C. Resistance Training
   D. Conditioning
   H. Nutrition
   I. Stop (Over)Thinking & Execute
```

> Note: the lettering in the printed contents jumps from `D. Conditioning` straight to `H. Nutrition` and `I. Stop (Over)Thinking & Execute` — `E`, `F`, `G` are absent under section II (p.5). Reproduced verbatim above.

Later parts (for cross-reference when extracting other ranges): III. Base Building; IV. Resistance Training (General Mass Templates, Mass Template, Grey Man Template, Gladiator, Fighter HT, General Mass Miscellaneous, Specificity, Specificity Alpha, Specificity Bravo, Sample H Clusters, Bridge Week); V. Conditioning; VI. Nutrition; VII. Supplements; VIII. Block Programming (incl. OMS Protocol); IX. Consolidation (Consolidation, Integration); X. FAQs (pp.5–6).

---

# PART I — INTRODUCTION

## Introduction

Part-opening page carries only an epigraph (p.7):

> "We must remember, that one man is much the same as another, and that he is best who is trained in the severest school"
> — Thucydides (p.7)

### Who the programme is for

Tactical Barbell I and II were written for "tactical law enforcement and military special operations/combat-arms", a population for whom "Excessive mass is usually detrimental… Every ounce of weight that isn't contributing to performance is felt tenfold in the field. The trick is to develop a high strength-to-weight ratio like a prize fighter." (p.8)

Mass Protocol is aimed instead at the majority — "patrol officers, paramedics, firefighters, corrections and others" — who "can get away with having greater amounts of muscle mass. In many cases it's an occupational benefit." (p.8)

Justifications given: officer presence / psychological advantage on the street and in corrections (p.8); firefighters offsetting heavy gear — "Would you rather be 130lbs wearing 75lbs of gear, or a muscled 185?" (p.8).

> "Enter Mass Protocol. This program was developed and refined for the operational professional looking to build muscle and improve physical presence, whatever the reason." (p.9)

> "Regardless of objective, Mass Protocol will be an invaluable addition to your toolbox." (p.9)

---

## A Brief History Lesson

The author's own case history, used to derive the programme's principles.

- "In roughly 3 years I went from 150 to 185lbs. Bodyfat from approximately 5% to 9%." (p.10) — "That's roughly 30lbs of muscle." (p.10)
- The gain was accidental; "performance, not size, was my number one objective" at the time (p.10).
- Military lifestyle: "generally endurance based. Long runs, ruck marches, field exercises, and ops. I supplemented strength training on my own time." (p.10)
- Law-enforcement lifestyle: cardiovascular training "drifted to sprints and high intensity interval training" (p.11); strength training went "from minimal low-rep sets to experimenting with higher volume protocols and various rep schemes" (p.11).
- Training frequency after the change: "I averaged one training session per day, 5 to 6 days per week. Training rarely went over an hour." (p.11) — described as "a drastic reduction in overall training volume" versus twice-a-day military training (p.11).
- Nutrition change: from carb-conscious/Zone/early ketogenic diets where "I barely met my daily calorie requirements. I could've easily used another 1000 calories" to "eating more carbs. I started eating more food overall." (p.11)
- Consistency was the constant: "I was habitual. I rarely missed training sessions, be they strength or conditioning. My mass gain was mostly effortless, but my training consistency was already in place. The base was there, only the variables changed." (p.11)

### Reverse engineering claim (timeline expectation)

> "It took me almost three years with no intentional process to gain 30lbs of quality lean body mass. If you're consistent with this protocol, you might do it in less." (p.12)

> "you'll be starting with the correct methods on Day 1. You'll be consistent from the get-go. No time wasted on trial and error." (p.12)

> "The templates in this program are specifically designed for maximum hypertrophy while staying true to some of the principles that brought about my own results." (p.12)

---

## The Holy Trinity

> "After boiling down all the changes in training, diet, and lifestyle I was left with three primary factors responsible for mass gain. The Holy Trinity. All three MUST be addressed for the natural trainee to successfully build quality muscle mass;" (p.13)

1. Resistance Training
2. Nutrition
3. Conditioning

(p.13 — note this ordering; the Overview chapter on p.17 lists the same three in a **different** order. See Ambiguities.)

> "Think of the Trinity like a 3-digit phone number. If you're off by even one digit you're not going to get through even if all the other digits are correct." (p.13)

### 1. Resistance training = the stimulus

> "Resistance training is the stimulus. It's a signal. The right kind of signal tells the body to start growing muscle. The right kind of training stimulus for mass-gain has an appropriate amount of volume balanced with intensity. Intensity is another term for load or weight." (p.13)

**Definition with implementation consequence — "intensity" means load/weight** (p.13), i.e. a percentage-of-max concept, not perceived effort.

Failure modes named:

- Enough weight, too little volume → "your strength will improve but you won't put on much muscle mass. Think of programs that have you lifting heavy but keep the reps and/or sets low. A **3x5 program is not the most efficient route to hypertrophy**. Good for maximal-strength, not the best for growing slabs of muscle. Doing one set as heavy as you can isn't going to get you anywhere either." (p.13)
- Enough volume, not enough load → "Pumping out hundreds of reps using 5lb pink Barbie dumbbells isn't going to do it." (p.13)

#### Callout box — `images/p014_1.png` (p.14)

Transcribed verbatim (single-line banner, dark box, white text):

> **Hypertrophy = Higher Volume + Moderate to High Intensity**

(p.14 — image `p014_1.png`. This is a formula banner, not a table; no numbers are given for what "higher volume" or "moderate to high intensity" mean at this point in the book.)

#### Naturals only

> "It's important to note all of this applies to the natural lifter that isn't on supraphysiological doses of testosterone or performance enhancing drugs." (p.14)

> "For naturals, usually a more reliable work-oriented approach is needed." (p.14)

### 2. Nutrition = the building material

> "To respond and grow that muscle – the body must have the building material available. Food is that building material. If your nutrition is inadequate, it won't matter if you train twice a day or squat thousands of pounds. You simply won't grow." (p.14)

### 3. Conditioning = mostly avoiding the wrong kind

> "When it comes to mass building it's mostly about avoiding the wrong kind. Just like the right kind of resistance training provides the stimulus to 'grow muscle' – the wrong kind of cardiovascular training signals the body to 'lose muscle'." (p.14)

> "While mass-building, conditioning is minimized but not eliminated." (p.14)

**The role of conditioning during Mass Protocol — three functions** (pp.14–15):

1. "Facilitates recovery between lifting sessions." (p.14)
2. "Promotes an anabolic environment. Primes your body for muscle growth instead of catabolism." (p.15)
3. "Maintains a minimum level of operational readiness." (p.15)

**Hard rule:**

> "Specific conditioning sessions are provided in this book to do the above. Mass Protocol is not the time to develop elite level conditioning or prepare for selection. **Stick to the conditioning sessions in this book until you hit your target weight.**" (p.15)

Consequences of neglecting a leg of the Trinity:

> "If you're eating enough but inconsistent with training – you'll gain mass alright, but not the kind you want. If training and nutrition are on-point, but you run for an hour every day because it makes you feel good – expect it to diminish your results." (p.15)

> "Yet 99% of the time failure to gain muscle is due to neglecting one or more of the three areas." (p.15)

> "Gaining mass doesn't require talent. It's a step-by-step repeatable process… It's systematic and predictable. What it does require is CONSISTENT EXECUTION." (p.15)

---

# PART II — OVERVIEW

Part-opening page carries only the word "OVERVIEW" (p.16).

## Overview — the four components

> "MASS Protocol consists of the Holy Trinity:
> 1. Resistance Training
> 2. Conditioning
> 3. Nutrition
>
> Along with an additional optional component:
> 4. Base Building" (p.17)

**Structure for implementation:** three mandatory components plus one optional preparatory phase (p.17). Note the Trinity order differs from p.13 (see Ambiguities).

---

## Base Building

> "Base Building is an optional 6-week general preparation phase. It's a kind of warm-up that prepares the body for the entire protocol. The focus is on low-intensity/high repetition resistance training alongside easy aerobic conditioning." (p.17)

**Block length: 6 weeks** (p.17). **Status: optional** (p.17) — but see the strong recommendation below.

What Base does (verbatim numbered list, p.17):

1. "Builds the aerobic system aka your gas tank. If you were Ironman this would be your power-center. Can't efficiently mobilize all your new muscle-mass without it."
2. "Strengthens joints/ligament/connective tissue in preparation for heavy lifting"
3. "Builds work capacity/the ability to handle higher volume"

### Not the same Base Building as TB II

> "The Base Building template found in this book is NOT the same as in Tactical Barbell II. This one is specifically geared for strength and hypertrophy phases." (p.18)

#### Callout box — `images/p019_1.png` (p.19)

Transcribed verbatim (dark box, white text; italics and bold as printed):

> The Base Building protocol in this book is NOT the same as the BB template found in *Tactical Barbell II*. This one can be used **anytime** you prioritize maximal-strength or hypertrophy in training. Think of it as Base Building for strength/hypertrophy athletes.

(p.19 — image `p019_1.png`. Banner box sits on the Resistance Training page but restates the Base Building point from p.18 and extends it: this BB template can be used **anytime** maximal-strength or hypertrophy is prioritised, i.e. it is not exclusive to Mass Protocol.)

### Author's recommendation on whether to run Base

> "If you're operational, Base is strongly recommended, dare I say- mandatory. It'll allow you to get away with the decreased conditioning during the remainder of the protocol. Basically, you'll be able to coast a lot further before that high-level conditioning starts to decline." (p.18)

> "Note, this mostly applies if you normally maintain an advanced or elite level of conditioning. If you don't, then the conditioning component of this protocol will likely be enough to maintain or even improve your baseline cardio." (p.18)

> "Let me put it this way, if you're an Air Force Tech, Base Building is a nice-to-have. If you're a SWAT operator – it's mandatory. **If you already have a current/established endurance base of some kind, (i.e. runner, mountaineering, etc.) feel free to skip it.**" (p.18)

Caveat before skipping:

> "Keep this in mind before deciding to bypass; aerobic training aside, the strength-endurance work in BB will prepare your body for heavy/high volume lifting. SE training plays a role in injury prevention by gradually strengthening connective tissue." (p.18)

Benefit of the aerobic base:

> "an optimized aerobic system will give you a noticeable increase in energy when it's time to lift weights in the gym. It's like developing your body's own innate pre-workout. Hypertrophy involves longer sessions with relatively heavy workloads. Having a superior gas tank will make it almost easy. Almost. Another massive benefit is that a strong aerobic system greatly facilitates recovery in between lifting sessions." (p.18)

---

## Resistance Training

> "Resistance Training is the stimulus. The lifting component of the program. It's broken down further into two components or phases:
> 1. Resistance Training
>    a. General Mass
>    b. Specificity" (p.19)

**Block structure (implementation-critical):**

| Component | Length | Purpose (verbatim) |
|---|---|---|
| General Mass | "3-week blocks" | "designed to increase overall size and structure" (p.19) |
| Specificity | "a 3-week supplemental block" | "for targeted hypertrophy" (p.19) |

> "General Mass comes in 3-week blocks designed to increase overall size and structure. Specificity is a 3-week supplemental block for targeted hypertrophy. General is the meat and potatoes. Specificity is a side dish used to target and sculpt specific muscles/muscle groups. **Both blocks can be used in various ratios depending on your needs.**" (p.19)

**Objectives, ranked:**

> "The primary objective of the resistance training in this program is hypertrophy with the secondary objective of increasing limit-strength." (p.19)

---

## Conditioning

> "This is a hypertrophy program, not performance enhancement. However, this is a Tactical Barbell book, so I'm assuming most of you are operational to some degree. Cardiovascular training won't be neglected. Specific conditioning sessions are included in this protocol, each carefully chosen to promote an anabolic environment, facilitate recovery, or maintain operational readiness." (pp.19–20)

**Volume cap warning:**

> "If you do more cardio than recommended your results might be suboptimal. You've been warned." (p.20)

**Two conditioning components:**

> "Conditioning is broken down into two components:
> 1. Conditioning
>    a. Green
>    b. Black" (p.20)

**Pairing rule (implementation-critical — conditioning type is determined by the lifting block being run):**

> "**Use Green sessions when training General Mass blocks. Use Black with Specificity.**" (p.20)

| Conditioning type | Character (verbatim) | Paired with |
|---|---|---|
| Green | "low intensity/long duration training" (p.20) | General Mass blocks (p.20) |
| Black | "high intensity/short duration" (p.20) | Specificity (p.20) |

**Session provenance rules:**

> "The individual Green and Black sessions found in this book are specific to Mass Protocol." (p.20)

> "They're designed to align with hypertrophy training and support muscle growth, while maintaining a degree of operational readiness. Although unique to this program – they can be used alongside any Tactical Barbell template to fill in Green/Black Protocol work. Add them to The Vault in TBII." (p.20)

> "On the other hand, **AVOID using the regular Green/Black sessions found in Tactical Barbell II with Mass Protocol**, unless you're experienced and familiar with the principles around using cardiovascular training to support hypertrophy." (p.20)

---

## Nutrition

> "You'll be provided with a method to calculate your total daily caloric requirement, along with recommended macronutrient composition. The formula for increasing lean body mass." (pp.20–21)

**Directional rule (implementation-critical — the error bias is asymmetric):**

> "When it comes to Mass Protocol, err on the side of overeating. **I don't care if you're 1000 calories over recommended daily intake – but don't go a single calorie below.** Don't guesstimate! The conditioning and higher volume lifting in this program will trim off the excess." (p.21)

> "Eating to gain quality muscle mass requires as much discipline as lifting. Most of us are enthusiastic and dialed-in when it comes to program selection and training, but eating is where things go off the rails. Trying to guesstimate meals is usually the culprit, which tends to result in under-eating." (p.21)

> "Make a promise to yourself right now that you'll get your nutrition handled. Do that, and you'll succeed where the majority fail." (p.21)

(No formulas, calorie numbers or macro percentages appear on pp.7–22 — they are promised for the Nutrition chapter later in the book, p.20–21.)

---

## Stop (Over)Thinking & Execute

> "Gaining quality mass is a systematic process that works regardless of who you are or your perceived shortcomings. Mass Protocol is the blueprint. **Exercises, loads, reps, sets, calories, macros, – everything is provided. No guess-work required on your part.** Get your cyborg-mode on and execute." (p.21)

**Loads are computed from current strength (implementation-critical):**

> "Nothing is so difficult that you won't be able to handle it, as **all the training loads are calculated based on your current levels of strength**." (p.21)

> "The only way to fail with this program is to not do the work." (p.21)

### The prescribed order of operations

> "Read the book COMPLETELY from start to finish before beginning the protocol. Don't skim. Reread the nutrition chapter and know your daily calorie intake/macros inside-out. **Start with Base Building. Transition to the main protocol.** Follow the conditioning guidelines and ensure your cardiovascular training doesn't interfere with hypertrophy. **Continue until your target weight or look is met.**" (p.21)

Sequence as stated (p.21):

1. Read the whole book, reread the nutrition chapter.
2. Start with Base Building.
3. Transition to the main protocol.
4. Follow the conditioning guidelines.
5. Continue until target weight or look is met.

#### Callout box — `images/p022_1.png` (p.22)

Transcribed verbatim (dark box, white text; bold as printed):

> Read the book COMPLETELY from start to finish before beginning MASS protocol. **Don't skim**.

(p.22 — image `p022_1.png`.)

### Commitment window

> "Drop any pre-conceived notions you may have about what a lifting program should look like. I am not saying our way is the best or only way. This is simply the method we use. **Give yourself to the protocol for 6 to 12 months without cutting any corners.** You'll be pleasantly surprised, or more likely shocked, at the outcome." (pp.21–22)

---

## Implementation notes (pp. 7–22)

Facts in this range that a training app would need to encode. Everything here is stated on the cited page; nothing is inferred.

| Item | What the book says | Page |
|---|---|---|
| Programme components | Resistance Training, Conditioning, Nutrition (mandatory Trinity) + Base Building (optional 4th) | p.17 |
| "Intensity" | means load / weight, not effort | p.13 |
| Hypertrophy formula | "Hypertrophy = Higher Volume + Moderate to High Intensity" — no numeric definition given in this range | p.14 (image) |
| Base Building length | 6 weeks | p.17 |
| Base Building status | Optional; "strongly recommended, dare I say- mandatory" if operational; skippable if an endurance base already exists | pp.17–18 |
| Base Building content | "low-intensity/high repetition resistance training alongside easy aerobic conditioning" | p.17 |
| Base Building variant | NOT the TB II BB template; usable anytime maximal-strength or hypertrophy is prioritised | p.18, p.19 (image) |
| General Mass block length | 3 weeks | p.19 |
| Specificity block length | 3 weeks (supplemental) | p.19 |
| Block ratio | "Both blocks can be used in various ratios depending on your needs" — ratios not specified in this range | p.19 |
| Training objective | Primary hypertrophy, secondary limit-strength | p.19 |
| Conditioning selection rule | Green with General Mass; Black with Specificity | p.20 |
| Green definition | low intensity / long duration | p.20 |
| Black definition | high intensity / short duration | p.20 |
| Conditioning source restriction | Use only the Green/Black sessions in this book; avoid TB II Green/Black sessions with Mass Protocol | p.20 |
| Conditioning cap | Exceeding recommended cardio may make results suboptimal | p.20 |
| Conditioning duration rule | Stick to this book's conditioning sessions "until you hit your target weight" | p.15 |
| Nutrition bias | Never below recommended daily intake; up to +1000 kcal over is acceptable | p.21 |
| Load derivation | "all the training loads are calculated based on your current levels of strength" — the max/percentage basis is not defined in this range | p.21 |
| Programme order | Base Building → main protocol → continue until target weight/look met | p.21 |
| Commitment window | 6 to 12 months | pp.21–22 |

**Not defined anywhere in pp. 7–22** (flagged so a later extract must supply them): 1RM or training-max definition; any percentage table; rounding rules for weight; rest intervals; set/rep schemes; weekly day-by-day structure; session counts per week; deload rules; progression rules; what counts as a session; calorie formula; macro splits; exercise list.

---

## Ambiguities and choices

Recorded, not resolved. Where the author states his own recommendation, it is marked **[author's recommendation]**.

1. **Trinity ordering differs between chapters.** p.13 lists "1. Resistance Training 2. Nutrition 3. Conditioning"; p.17 lists "1. Resistance Training 2. Conditioning 3. Nutrition". Nothing indicates the order is meaningful, but the two lists do not match. (pp.13, 17)

2. **Base Building is simultaneously "optional" and "mandatory".** It is introduced as "an optional 6-week general preparation phase" (p.17), then: "If you're operational, Base is strongly recommended, dare I say- mandatory" (p.18), then qualified: "this mostly applies if you normally maintain an advanced or elite level of conditioning" (p.18), then: "if you're an Air Force Tech, Base Building is a nice-to-have. If you're a SWAT operator – it's mandatory" (p.18), then: "If you already have a current/established endurance base of some kind, (i.e. runner, mountaineering, etc.) feel free to skip it" (p.18) — while p.21 flatly instructs "Start with Base Building." The book leaves the decision to the reader based on occupation and existing conditioning level. **[author's recommendation]** — run Base Building if operational and/or without an established endurance base; skip it if an endurance base already exists (p.18). Note the injury-prevention caveat argues against skipping even then: "the strength-endurance work in BB will prepare your body for heavy/high volume lifting" (p.18).

3. **General Mass : Specificity ratio is left to the reader.** "Both blocks can be used in various ratios depending on your needs." (p.19) No default ratio, no ordering, and no rule for when to insert a Specificity block is given in this range. **[author's recommendation]** — General is "the meat and potatoes", Specificity is "a side dish" (p.19), implying General predominates, but no numeric ratio is stated.

4. **"Higher Volume + Moderate to High Intensity" is undefined numerically in this range.** (p.14, image) The only negative examples given are "3x5" (too little volume, p.13) and "one all-out death set" / "one set as heavy as you can" (pp.13–14), plus very light high-rep work (p.13). No percentage or rep-range boundary is supplied here.

5. **"Target weight or look" is the stopping condition, and is user-defined.** "Continue until your target weight or look is met." (p.21) and "Stick to the conditioning sessions in this book until you hit your target weight." (p.15) The book gives no method for setting that target in this range.

6. **Commitment window is a range, not a number.** "Give yourself to the protocol for 6 to 12 months" (pp.21–22) — no rule for choosing 6 vs 12.

7. **Conditioning cap is qualitative.** "If you do more cardio than recommended your results might be suboptimal." (p.20) The actual recommended volume is not stated in this range; only the pairing rule (Green↔General Mass, Black↔Specificity) is.

8. **The TB II Green/Black exclusion has an experience-based exemption.** "AVOID using the regular Green/Black sessions found in Tactical Barbell II with Mass Protocol, **unless you're experienced and familiar with the principles around using cardiovascular training to support hypertrophy**." (p.20) The book does not define who qualifies as "experienced and familiar". **[author's recommendation]** — the default is to avoid TB II sessions.

9. **Contents lettering gap.** Section II in the table of contents runs A, B, C, D, then H, I — E/F/G are missing (p.5). Whether chapters were removed or the lettering is simply a typo is not stated.

10. **Expected rate of gain is anecdotal and hedged.** "It took me almost three years… If you're consistent with this protocol, you might do it in less." (p.12) No target rate of weight gain per week/month is given in this range.

11. **Applicability limited to naturals.** "It's important to note all of this applies to the natural lifter that isn't on supraphysiological doses of testosterone or performance enhancing drugs." (p.14) The book states no alternative for enhanced lifters here.


---

# 02 — Base Building (PDF pp. 23–36)

Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
All page references below are **PDF page numbers of that file**, not printed page numbers.

Every table in this range is an embedded image. The transcriptions below were made by reading
`docs/MASS/images/p026_1.png`, `p027_1.png`, `p027_2.png`, `p029_1.png`, `p029_2.png`,
`p030_1.png`, `p033_1.png`, `p034_1.png` visually. `p023_1.png` is a photograph (soldiers on
patrol in desert terrain), not a table — it carries no programming content.

---

## Part title page (p.23)

The page carries only the words "BASE BUILDING" (p.23) and the photograph `p023_1.png` (p.23).

---

## Base Building (pp.24–25)

### What BB is and why it exists

> "Throughout time warrior societies and military units around the world have prescribed some form of introductory training designed to turn soft undisciplined civilians into something harder." (p.24)

> "Unlike more typical bootcamps, our version is a building-up process, not a meat grinder." (p.24)

> "I've covered off the importance of Base ad nauseum in Tactical Barbell II, so I'll keep it brief." (p.24)

> "BB is a general adaptation phase designed for anyone serious about being fit in multiple domains." (p.24)

### The listed benefits of BB (p.24)

Reproduced as the book's own numbered list (p.24):

1. Build aerobic capacity/general endurance
2. Build muscular-endurance/work capacity
3. Strengthen under-armor: joints/ligaments/connective tissue
4. General physical preparation
5. CNS rejuvenation
6. Harden the body and mind for higher intensity/volume work

> "Building an efficient aerobic system will benefit any performance-based activity, including weight-training." (p.24)

> "If you perform any activity for over two minutes, you'll need an aerobic system. The better the aerobic system, the better you can do whatever it is you're doing for more than two minutes." (pp.24–25)

### This BB template is NOT the TBII template

> "It's important to note the Base Building template in this book is specific to Mass Protocol. It isn't the same model contained in Tactical Barbell II." (p.25)

> "Standard Base Building as found in TBII is designed for the pure-bred tactical athlete looking for an elite level of fitness across multiple domains, typically: combat-arms military, special operations, tactical law enforcement, and fire/rescue services. It alternates between long duration/low intensity aerobic work and progressive muscular-endurance circuits. Anaerobic training is mostly avoided during this phase for reasons outlined in TBII." (p.25)

> "It's not uncommon for newbies to go from barely being able to run for 10 minutes to easily finishing 60-minute sessions before the block is over." (p.25)

> "MASS Protocol is a different animal. The primary objective of MASS is hypertrophy. Maintaining minimal cardiovascular conditioning for operational readiness is a secondary goal. The Base Building template in this program deviates from the Standard model to reflect that. The principles remain the same, but changes have been made to align with the primary objective." (p.25)

**Implementation consequence:** the MASS BB block must not reuse any TBII Base Building numbers. It is its own template, defined entirely by the tables on pp.26–34.

---

## PROGRAMMING (pp.26–27)

### Block length and domains

> "Base Building for MASS Protocol is 6 weeks in duration and focuses on two domains:" (p.26)

1. Strength-Endurance Training (SE) (p.26)
2. Endurance/General Aerobic Training (E) (p.26)

**Implementation consequence:** BB block length = **6 weeks** (p.26). See also p.34: "this version is 6 weeks instead of 8."

### Definition of SE

> "Strength-Endurance (aka muscular-endurance) is the ability of a muscle/muscle-group to exert force against resistance for extended periods of time. Doing 100 push-ups non-stop is an example of strength-endurance." (p.26)

> "SE is performed three times a week with loads ranging from 10-25% 1RM." (p.26)

*(Note the load range stated here differs from the ranges given on p.28 and in the p.30 table — see "Ambiguities and choices".)*

### Definition of E

> "Endurance or E in the Tactical Barbell lexicon refers to cardiovascular training that lasts for 30 minutes or more – either steady-state OR variable intensity. However, when it comes to Base Building E is solely low intensity/steady state (LSS)." (p.26)

> "There is no variation in intensity of the kind that you might find during Green Protocol or E training performed outside of Base Building. E during Base focuses exclusively on improving specific aspects of the aerobic system. Intervals and anaerobic/high intensity training are avoided to optimize the development of cardiac ventricular hypertrophy/efficiency." (pp.26–27)

> "I go into detail at length on this in Tactical Barbell II, so I won't repeat it here. If you'd like to learn more about the theory, read TBII. Otherwise, just do what I say." (p.27)

### Sidebar box: definition of E (image `p027_1.png`, p.27)

Reproduced verbatim (bold/italics as printed):

> E (Endurance) refers to cardiovascular-based training that lasts for 30 minutes or longer.
>
> E can be low-intensity/steady state **OR** variable intensity. However, ***during Base Building E is primarily low-intensity/steady state.***

*(The sidebar says E during Base Building is "**primarily**" LSS; the body text on p.26 says E during Base Building is "**solely**" low intensity/steady state. See "Ambiguities and choices".)*

### Week-template table (image `p026_1.png`, p.26)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| E | SE | E | SE | E | SE | REST |

*(This table places E on Days 1/3/5 and SE on Days 2/4/6. Every other table in the chapter — `p027_2.png`, `p029_1.png`, `p030_1.png`, `p034_1.png` — places SE on Days 1/3/5 and E on Days 2/4/6. See "Ambiguities and choices".)*

### Full Base Building schedule table, titled "BASE BUILDING" (image `p027_2.png`, p.27)

| Week | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1 | SE | E | SE | E | SE | E | REST |
| 2 | SE | E | SE | E | SE | E | REST |
| 3 | SE | E | SE | E | SE | E | REST |
| 4 | SE | E | SE | E | SE | E | REST |
| 5 | SE | E | SE | E | SE | E | REST |
| 6 | SE | E | SE | E | SE | E | REST |

Legend printed beneath the table (p.27):

- SE = Strength-Endurance
- E = Endurance

**Implementation consequences (p.27):**
- The block is a fixed 7-day cycle, identical for all 6 weeks — no wave in the *schedule*, only in the loading (p.30).
- Six training sessions per week, one REST day (Day 7).
- SE and E always alternate; SE and E are never performed on the same day in this template.

---

## STRENGTH-ENDURANCE TRAINING (pp.28–32)

### Frequency, structure and load

> "SE training is performed three times a week on alternate days. Four exercises are performed every session circuit-style. Weights/loads are light – approximately 15%-30% 1RM." (p.28)

**Implementation consequences (p.28):**
- 3 SE sessions/week, on alternate days.
- Exactly **four** exercises per session.
- Executed **circuit-style** (see Execution, pp.31–32).
- Loads are percentages of **1RM** (not of a training max — no training-max concept is introduced anywhere in this chapter).

### SE CLUSTER

> "A 'cluster' in the TB dictionary is simply a group of exercises." (p.28)

> "The Base Building model in this protocol is designed to align with the goals of strength and hypertrophy, so we're going to employ the principle of specificity when it comes to exercise selection. After Base Building, during the main part of the program (General Mass) the bench press, squat, and deadlift form the basis of the protocol." (p.28)

> "Therefore, the SE cluster will contain the same exercises (or similar variations):" (p.28)

#### SE cluster box (image `p029_2.png`, p.29)

| SE CLUSTER |
|---|
| **Bench Press** (barbell, dumbbell) |
| **Squat** (barbell, dumbbell, weight vest, goblet) |
| **Romanian Deadlift** (barbell, dumbbell) * |
| **Ab Exercise** (of your choice) |
| *Rows or pull-ups can be substituted for RDLs |

*(The asterisk footnote is printed inside the box exactly as shown; it attaches to the Romanian Deadlift row.)*

#### Exercise-selection rules (p.29)

> "This is the suggested cluster for optimal results. We're going for specificity - but there's no need to be totally militant with exercise selection for this phase." (p.29)

> "If you really really want to overhead press instead of bench, or Bulgarian Split Squat instead of squat – go for it. Rule of thumb is to include a press, a pull, legs, and abs." (p.29)

> "Choose exercises that allow you to manipulate the loads incrementally." (p.29)

> "Just know, the closer you can mimic the exercises used during General Mass (Bench/Squat/Deadlift) the better, but it won't be the end of the world if they're not exact." (p.29)

> "I don't recommend the conventional deadlift for SE, because it's an awkward movement to perform with light weight & high reps." (p.29)

**Implementation consequences (p.29):**
- The cluster is a **suggestion** with the author's own recommended default (BP / SQ / RDL / Abs) plus an explicit substitution rule ("a press, a pull, legs, and abs").
- Conventional deadlift is explicitly **not recommended** for SE.
- Substitutions listed in the box: rows or pull-ups for RDLs; loading modes per exercise are enumerated (barbell, dumbbell, weight vest, goblet).

### SE SCHEDULE (image `p029_1.png`, p.29)

Table printed under the heading "SE SCHEDULE" (p.29). Blank cells are blank in the book.

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| BP<br>SQ<br>RDL<br>ABS |  | BP<br>SQ<br>RDL<br>ABS |  | BP<br>SQ<br>RDL<br>ABS |  |  |

*(Each populated cell lists, top to bottom: BP, SQ, RDL, ABS. Days 2, 4, 6 and 7 are empty cells in the book — Day 7 has no "REST" label in this particular table.)*

### SE PROGRAMMING (image `p030_1.png`, p.30)

Table printed under the heading "SE PROGRAMMING" (p.30). Each populated cell contains a sets × reps line and, beneath it, a percentage. Blank cells are blank in the book.

| WEEK | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | 3 x 10<br>15% |  | 3 x 20<br>20% |  | 3 x 30<br>25% |  |  |
| 2 | 3 x 10<br>15% |  | 3 x 20<br>20% |  | 3 x 30<br>25% |  |  |
| 3 | 3 x 10<br>15% |  | 3 x 20<br>20% |  | 3 x 30<br>25% |  |  |
| 4 | 3 x 10<br>20% |  | 3 x 20<br>25% |  | 3 x 30<br>30% |  |  |
| 5 | 3 x 10<br>20% |  | 3 x 20<br>25% |  | 3 x 30<br>30% |  |  |
| 6 | 3 x 10<br>20% |  | 3 x 20<br>25% |  | 3 x 30<br>30% |  |  |

How to read the table, in the book's own words (p.30):

> "The above is Sets x Reps / percentage of 1 Rep Max." (p.30)

> "Example: 3 x 10/20% = 3 sets of 10 reps with 20% of 1 Rep Max." (p.30)

**Implementation consequences (p.30):**
- Sets are constant at **3** for every session of the whole block.
- Reps are fixed **by day-of-week**, not by week: Day 1 = 10, Day 3 = 20, Day 5 = 30.
- The percentage waves in two 3-week steps: weeks **1–3** use 15% / 20% / 25% (Day 1 / Day 3 / Day 5); weeks **4–6** use 20% / 25% / 30%.
- The percentage applies to the athlete's **1RM** for each exercise in the cluster.
- There is **no deload week** and no in-block retest anywhere in the 6-week table (p.30); the block is 6 weeks straight (p.26).
- Days 2, 4, 6, 7 carry no SE prescription (p.30) — E lives on Days 2/4/6 per p.34.

---

## EXECUTION (p.31)

### Reps come before load

> "Strength-Endurance training is about reps first, NOT LOAD." (p.31)

> "This isn't maximal-strength training. No need to get ultra-precise with your calculations. Get within the ballpark. If in doubt, always err on the side of lighter." (p.31)

**Implementation consequence:** the book explicitly de-prioritises precise load calculation and rounding for SE (p.31). It gives **no rounding rule** and **no plate-math rule** for SE loads. Its only stated tie-break is "err on the side of lighter" (p.31).

### When the calculated load is below an empty bar

> "Your starting weight for one or two exercises might be lower than empty bar weight – that's fine, go ahead and use the empty bar." (p.31)

> "If you're in a de-trained or weak state and the empty bar is a substantial load for you – then switch to dumbbells or another exercise and get closer to your true %RM." (p.31)

> "Bodyweight movements are always an option." (p.31)

**Implementation consequences (p.31):**
- A computed load below bar weight is **not an error** — the prescription becomes "empty bar".
- The book gives no bar weight figure in this chapter, so the app must source it elsewhere.
- Escape hatch when even an empty bar is too heavy: switch to dumbbells, another exercise, or bodyweight.

### Ab and bodyweight movements

> "When it comes to ab exercises (or pull-ups/bodyweight movements), you can simply do the assigned reps without worrying about adding external weight." (p.31)

**Implementation consequence:** the ABS slot (and any bodyweight substitute) carries **reps only, no % load** (p.31). A planned-set model must be able to express a load-less prescription.

---

## SE TRAINING IS MESSY (pp.31–32)

> "I feel like I need to stress this: SE TRAINING IS MESSY" (p.31)

> "You might frequently fail at various reps and sets throughout the session. That's normal. Don't expect to go in there and knock off all the reps of all sets perfectly. It won't happen." (p.31)

> "SE training by nature is designed to bring you to a point of fatigue relatively quickly, so that you have to struggle and push yourself to complete the remaining reps. It's at the point of failure and beyond where some of the training benefits begin. It's like the opposite of maximal-strength training." (p.31)

> "Your ego might take a hit when people see you struggling with an empty bar or a couple of little plates when set #2 or 3 rolls around. Deal with it, it's for the greater good." (p.31)

### Circuit mechanics

> "SE training is done circuit-style. Perform 10 reps of bench press, move on and squat x 10, finish up with RDL and abs, repeat." (p.31)

**Implementation consequence:** "3 x 10" means **3 rounds of the 4-exercise circuit**, each round being 10 reps of each exercise (p.31) — not 3 straight sets of one lift followed by the next.

> "You may need to modify your exercise selection if your gym set-up doesn't allow you to hold up 3 pieces of equipment simultaneously." (p.31)

> "The push-press, overhead press or even a floor press can take the place of the BP so you're not tying up a bench." (p.32)

> "The beauty of SE is that the weights are light enough that you can probably do everything with a barbell and no rack or bench. Or compromise – use the squat rack for squatting and a barbell for RDLs and Overhead or Floor Press. Worst case scenario – use dumbbells or bodyweight exercises. For bodyweight clusters just do the assigned reps." (p.32)

### Fallback when circuiting is impossible

> "If for whatever reason you can only do one exercise at a time it's not the end of the world. Complete all sets of each exercise before moving on to the next." (p.32)

**Implementation consequence:** a sanctioned alternative execution order exists — straight sets per exercise (p.32).

### Rest intervals

> "Rest for 0 to 2 minutes in between sets and exercises. Rest for 2 minutes in between circuits. The shorter you can keep your RIs between SETS the better, but when it comes to resting between CIRCUITS take the full 2 minutes to recover." (p.32)

**Implementation consequences (p.32):**
- Between sets and between exercises: **0–2 minutes**, shorter is better.
- Between circuits: **2 minutes**, take the full amount.
- Longer than 2 minutes between sets is tolerated but discouraged (see next quote).

### Failure handling

> "Failure and fatigue are acceptable and expected when it comes to SE." (p.32)

> "I'll say it again; failure and fatigue are acceptable and expected when it comes to SE." (p.32)

> "If you find yourself failing at rep 23 and you need to hit 30, simply take a breather for a few moments and then make up the remainder. Squeeze the reps out in mini-sets of 1 to 3." (p.32)

> "There are going to be times where you'll need to rest for more than 2 minutes in between sets – that's okay. Try not to make it a habit, and soldier on." (p.32)

> "Don't overthink this stuff. As I've said, SE training is messy by nature. It's not neat and precise like lifting for maximal-strength." (p.32)

### The only in-block load-adjustment rule

> "Don't readjust your weights halfway through the block because you're failing and want to meet the reps, unless you're failing so massively that it's clear you overestimated your starting loads." (p.32)

**Implementation consequences (p.32):**
- There is **no autoregulation and no stall/deload mechanic** in BB. Loads are fixed by the p.30 table for the whole block.
- The single sanctioned exception is a gross overestimate of starting loads; the book gives no threshold, no new percentage and no procedure for the readjustment.
- Missed reps must be loggable as such — failing sets is the expected state, not an error condition.

---

## ENDURANCE (pp.33–36)

### Definition, frequency and duration

> "Endurance (E) sessions for Base Building consist of any activity performed continuously at a low level of intensity, aka Long Steady State (LSS) training. Jogging, cycling, and ruck marching are popular options." (p.33)

> "E is performed three times a week on alternate days, for 30 minutes at a time. With Mass Protocol, E is purposely capped at 30 minutes to minimize potential effects on muscular hypertrophy." (p.33)

### E SESSIONS (image `p033_1.png`, p.33)

Two-column, three-row table of modalities printed under the heading "E SESSIONS" (p.33). The table has no header row.

| | |
|---|---|
| Jogging/LISS Running | Rowing |
| Cycling | Swimming |
| Rucking | Shadow boxing/bag work |

*(Transcribed exactly as printed, including "LISS" in the first cell — note the body text elsewhere uses "LSS", e.g. p.33 and p.35.)*

### E PROGRAMMING (image `p034_1.png`, p.34)

Table printed under the heading "E PROGRAMMING" (p.34). Blank cells are blank in the book. "M" is printed in italics.

| Week | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1 to 6 |  | E x 30*M* |  | E x 30*M* |  | E x 30*M* |  |

**Implementation consequences (p.34):**
- E is on **Days 2, 4, 6** for all six weeks — a single row covering weeks "1 to 6", i.e. **no progression at all** in E across the block.
- Every E session is exactly 30 minutes ("30M").
- Days 1, 3, 5 and 7 are blank in this table (SE lives on 1/3/5 per pp.29–30; Day 7 is REST per p.27).

### E EXECUTION (p.34)

> "Jog or perform any steady-state activity of your choice for 30 minutes. No more, no less." (p.34)

> "Intensity must be kept low throughout and can be measured/controlled in several ways:" (p.34)

The book's own numbered list of intensity controls (p.34):

1. > "Use the talk-test. If you can comfortably hold a conversation while working, then you are going at the correct pace." (p.34)
2. > "Use a heart rate monitor. Stay between 120 to 150 beats per minute." (p.34)
3. > "Nose breathing. Breathe through your nose while performing the activity. If you can't your intensity level is likely too high. Dial it back a little." (p.34)

> "Compared to Base Building found in TBII, the E portion of this version is minimal. It's designed to train the cardiovascular system with no effect on strength or hypertrophy. E sessions are capped at 30 minutes, and this version is 6 weeks instead of 8." (p.34)

> "DON'T break out into intervals or sprints. DON'T try and go fast. Whatever modality you choose – adhere to the pacing guidelines for the full 6 weeks of Base." (p.34)

> "Don't be fickle about staying exactly within 120-150bpm either. 5-10 beats higher or lower isn't going to make or break you." (pp.34–35)

> "But do keep in mind it's better to err on the side of going slower during Base. Speed-walking is better than a run that verges at tempo pace. Go too fast, and the body tends to start transitioning out of using fat and oxygen and starts tapping into glycogen/anaerobic-based energy. LSS should feel almost relaxing, and if done correctly will speed-up recovery." (p.35)

**Implementation consequences (pp.34–35):**
- HR target band: **120–150 bpm**, with an explicit tolerance of **±5–10 bpm** (pp.34–35).
- Duration is a hard equality, not a minimum: "No more, no less." (p.34)
- Intervals/sprints are forbidden for the whole 6 weeks (p.34).

### Modality choice (p.35)

> "If 30 minutes seems like a daunting amount of time to run or swim – then choose a modality that you can complete, like rucking, cycling or walking. It's all good. Speed walking is another easy way to get in the Base Building zone while improving your aerobic system." (p.35)

> "Base Building isn't run, ruck, or swim training. Think of E during Base Building as 'movement' as opposed to 'running' or 'jogging' or whatever. Key phrase being 'during Base Building'." (p.35)

> "That's not to say you shouldn't apply the principle of specificity. If your long-term plans include military work or selection, then choosing run/ruck/swim sessions for E will add benefit over unrelated training modalities." (p.35)

> "Above all, keep your ego in check." (p.35)

> "The biggest challenge you'll have is maintaining a painfully slow pace while grannies, children, and small dogs zip by you. You might even get sympathetic looks and an encouraging 'great job, keep it up'. Try not to unleash your particular-set-of-skills. This is a common enough problem that we're considering releasing a t-shirt; 'I'm Not Slow - I'm Base Building'." (p.35)

---

## LONGER SESSIONS (pp.35–36)

> "Let me address a question that is bound to come up; 'Can I do longer E sessions?'. The short answer is NO." (p.35)

> "The longer answer is to give serious thought as to why you've chosen this program. Mass protocol is for those who prioritize hypertrophy and maximal-strength - either temporarily or long term. Overdoing E will send signals to your body that oppose hypertrophy. You're basically making it harder to achieve your primary objective. That's not intelligent training. It pays to prioritize your goals – be that short or long term." (pp.35–36)

> "Base Building in this book contains the RIGHT amount of E to maintain operational readiness while supporting hypertrophy." (p.36)

> "Remember, you can be a mass-focused athlete for just one block or for the rest of your life. You're not stuck in the category perpetually. So, if you're going to do it – do it right. Learn to pivot and make all your resources pull in the same direction toward your current goal." (p.36)

> "If you have occasional mandatory training (military/sports etc.) – don't sweat it. Unless it's frequent and excessive it's not going to hurt your progress significantly, so long as you adjust your nutrition and daily calorie intake accordingly." (p.36)

**Implementation consequence:** the 30-minute cap is a hard rule the app should enforce or warn on, not a suggestion (p.34, p.35). Occasional externally-mandated extra training is explicitly tolerated with a nutrition adjustment, but no numbers are given (p.36).

---

## Implementation summary (all page-referenced above)

| Item | Book value | Page |
|---|---|---|
| BB block length | 6 weeks | p.26, p.34 |
| Weekly cycle | 7 days: SE / E / SE / E / SE / E / REST | p.27 |
| SE frequency | 3×/week, alternate days | p.26, p.28 |
| SE days | Day 1, Day 3, Day 5 | p.29, p.30 |
| E days | Day 2, Day 4, Day 6 | p.34 |
| Rest day | Day 7 | p.27 |
| Exercises per SE session | 4, circuit-style | p.28 |
| Default cluster | Bench Press, Squat, Romanian Deadlift, Ab Exercise | p.29 |
| Cluster substitution rule | "include a press, a pull, legs, and abs" | p.29 |
| Explicit substitutions | Rows or pull-ups for RDLs; OHP/push-press/floor press for BP; Bulgarian Split Squat for squat | p.29, p.32 |
| Explicitly not recommended | Conventional deadlift for SE | p.29 |
| Sets | 3, every session, every week | p.30 |
| Reps | Day 1 = 10, Day 3 = 20, Day 5 = 30 | p.30 |
| Load basis | % of **1 Rep Max** (no training max defined) | p.30 |
| Load, weeks 1–3 | 15% / 20% / 25% (Day 1 / 3 / 5) | p.30 |
| Load, weeks 4–6 | 20% / 25% / 30% (Day 1 / 3 / 5) | p.30 |
| Rounding rule | none given; "Get within the ballpark", "err on the side of lighter" | p.31 |
| Load below empty bar | use the empty bar | p.31 |
| Abs / bodyweight loading | reps only, no external weight required | p.31 |
| Rest between sets/exercises | 0 to 2 minutes (shorter is better) | p.32 |
| Rest between circuits | 2 minutes (take the full 2) | p.32 |
| Failed reps | expected; make up remainder in mini-sets of 1–3 | p.32 |
| Mid-block load change | forbidden except on a gross overestimate | p.32 |
| Deload / retest in BB | none present in any table | p.30 |
| E session duration | 30 minutes, "No more, no less" | p.33, p.34 |
| E intensity | LSS only; talk test / 120–150 bpm (±5–10) / nose breathing | p.34, pp.34–35 |
| E progression over block | none — identical weeks 1 to 6 | p.34 |
| E modalities | Jogging/LISS Running, Cycling, Rucking, Rowing, Swimming, Shadow boxing/bag work | p.33 |

---

## Ambiguities and choices

Recorded, not resolved.

1. **SE load range is stated three different ways.**
   - p.26: "SE is performed three times a week with loads ranging from **10-25% 1RM**."
   - p.28: "Weights/loads are light – approximately **15%-30% 1RM**."
   - The SE PROGRAMMING table (`p030_1.png`, p.30) uses only **15%, 20%, 25%, 30%**.

   The table's actual values match the p.28 range and contradict the p.26 range. The book never reconciles the three. No author recommendation is stated for which range governs.

2. **Which day starts the week — SE or E.**
   - `p026_1.png` (p.26): Day 1 = **E**, Day 2 = SE, … Day 7 = REST.
   - `p027_2.png` (p.27, the full 6-week "BASE BUILDING" table): Day 1 = **SE**, Day 2 = E, … Day 7 = REST.
   - `p029_1.png` (p.29) and `p030_1.png` (p.30) both put SE on Days 1/3/5.
   - `p034_1.png` (p.34) puts E on Days 2/4/6.

   Four of the five tables agree on SE-first; the p.26 table is the outlier. The book never flags the discrepancy or states which is intended. The prose only ever says "alternate days" (p.28, p.33), which is satisfied by either arrangement.

3. **"Solely" vs "primarily" LSS during Base.**
   - Body text, p.26: "when it comes to Base Building E is **solely** low intensity/steady state (LSS)."
   - Sidebar box `p027_1.png`, p.27: "during Base Building E is **primarily** low-intensity/steady state."

   The instruction on p.34 ("DON'T break out into intervals or sprints") reads as absolute, but the box's wording leaves room. Unresolved by the book.

4. **Exercise selection is left to the reader, with a stated author preference.**
   The author's own recommendation is explicit and should be treated as the book's default: "This is the suggested cluster for optimal results" (p.29) — Bench Press, Squat, Romanian Deadlift, Ab Exercise (`p029_2.png`, p.29), with the reasoning that "the closer you can mimic the exercises used during General Mass (Bench/Squat/Deadlift) the better" (p.29). Deviation is permitted under the rule "include a press, a pull, legs, and abs" (p.29). The ab exercise itself is entirely reader's choice ("Ab Exercise (of your choice)", p.29) — the book names none.

5. **Loading mode per exercise is a reader's choice.** The cluster box lists alternatives inside each row — Bench Press (barbell, dumbbell); Squat (barbell, dumbbell, weight vest, goblet); Romanian Deadlift (barbell, dumbbell) (p.29). No preference is given among them, other than the general specificity argument (p.29) and the "worst case scenario – use dumbbells or bodyweight exercises" fallback ordering (p.32).

6. **No rounding, plate or bar-weight rule is given.** The book states only "No need to get ultra-precise with your calculations. Get within the ballpark. If in doubt, always err on the side of lighter." (p.31). Bar weight is referred to ("lower than empty bar weight", p.31) but never numerically defined in this chapter. Any rounding increment an app applies is the app's invention, not the book's.

7. **1RM source is not defined here.** The p.30 table is expressed as a percentage of "1 Rep Max" (p.30) but this chapter never says how the 1RM is established, tested, or estimated, nor whether a per-exercise 1RM is needed for the RDL and the abs slot. The abs slot is explicitly exempt from external load (p.31); the RDL is not.

8. **The mid-block readjustment exception has no threshold or procedure.** "unless you're failing so massively that it's clear you overestimated your starting loads" (p.32) — the book defines neither "so massively" nor what the new load should be.

9. **Rest between sets is a range, with a stated author preference.** "Rest for 0 to 2 minutes in between sets and exercises" (p.32), with the author's own recommendation inside it: "The shorter you can keep your RIs between SETS the better" (p.32). Between circuits the 2 minutes is stated as an amount to take in full, not a range (p.32). Exceeding 2 minutes between sets is permitted but discouraged (p.32).

10. **Execution order is a choice.** Circuit-style is the prescribed default (p.28, p.31); straight sets per exercise is an explicitly sanctioned fallback "If for whatever reason you can only do one exercise at a time" (p.32). No adjustment to sets, reps, loads or rest is specified for the fallback.

11. **E modality is entirely the reader's choice** among the six listed (`p033_1.png`, p.33) plus walking/speed-walking mentioned only in prose (p.35). The author's stated preference is conditional, not absolute: "If your long-term plans include military work or selection, then choosing run/ruck/swim sessions for E will add benefit" (p.35), and "it's better to err on the side of going slower" (p.35).

12. **Three intensity-control methods are offered with no priority.** Talk test, 120–150 bpm HR, nose breathing (p.34). The book does not say which takes precedence if they disagree.

13. **"LISS" vs "LSS".** The E SESSIONS table cell reads "Jogging/LISS Running" (`p033_1.png`, p.33) while the surrounding prose consistently uses "LSS" / "Long Steady State" (p.33, p.35). The book does not say whether these are the same thing.

14. **Day 7 labelling is inconsistent across tables.** `p026_1.png` (p.26) and `p027_2.png` (p.27) print "REST" in the Day 7 cell; `p029_1.png` (p.29), `p030_1.png` (p.30) and `p034_1.png` (p.34) leave Day 7 blank. Reproduced as printed above.

15. **What happens at the end of the 6 weeks is not stated in this chapter.** No deload, no retest, and no transition rule into General Mass appears anywhere in pp.23–36.


---

# 03 — General Mass: Mass Template & Grey Man (PDF pp. 37–53)

> Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
> All page references in this document are **PDF page numbers of that file** (the page index used by the Read tool's `pages` parameter and by the `===== PDF PAGE N =====` markers in `docs/MASS/mass-text.txt`). Printed page numbers are not used anywhere here.
>
> **Every table in this book is an embedded image.** Every grid below was transcribed visually from the extracted PNGs listed under each table, cell for cell, including blank cells. Nothing in a grid was inferred from the prose.

---

## Part divider (p.37)

The part opens with a title page:

> "RESISTANCE TRAINING" (p.37)
>
> "*Long term consistency trumps short term intensity*" — Bruce Lee (p.37)

No table, no prescription on this page.

---

## RESISTANCE TRAINING — chapter intro (pp. 38–41)

### The two parts

> "Resistance training is the stimulus that signals your body to grow muscle mass. It consists of two separate phases or parts: 1. General Mass 2. Specificity" (p.38)

### General Mass

> "General is the foundation. The objective of General is to grow large muscle groups while simultaneously developing structural strength." (p.38)

> "Increases in hypertrophy and strength occur concurrently. General by itself will give many of you the size and aesthetic you desire without the need to transition to Specificity. It's a powerful style of training that balances frequency and volume to maximize hypertrophy." (p.38)

### The four General Mass templates (p.38)

> "There are several General Mass templates to choose from;
> Mass Template (MT)
> Grey Man
> Gladiator
> Fighter HT" (p.38)

> "For those of you familiar with the very first edition of Tactical Barbell 1, some of the above names might seem familiar. However, the templates in this book bear little resemblance to the originals in terms of programming. I just liked the names." (pp.38–39)

Per-template one-line characterisations (p.39):

| Template | Book's description (p.39) |
|---|---|
| MT | "MT is an unconventional approach that will turn you into a monster. It works around 4 exercises and harnesses the power of frequency to maximize hypertrophy." |
| Grey Man | "Grey Man is a three-day-per-week alternating A/B/A style template. A highly effective mass builder that balances frequency and exercise variety. A favorite with operational clients that want to balance 3 days of lifting with 3 days of conditioning." |
| Gladiator | "Gladiator uses a wider variety of exercises, along with techniques like AMRAP to stimulate growth." |
| Fighter-HT | "Fighter-HT is minimalist mass building. If you like simple approaches and can't spend all your time in the gym – this is your template. Fighter-HT is set up over 3-days. Two days dedicated to pressing and legs, and a third day solely for deadlifts." |

*(Gladiator and Fighter-HT are described on p.39 but their own chapters fall outside pp.37–53 and are not extracted here.)*

### Specificity (pp.39–40) — context only, out of scope

> "Specificity is the fine-tuning aspect of the protocol. If General Mass is the broadsword, Specificity is the scalpel." (p.39)

> "Specificity consists of four training sessions per week. Loads vary from 55% to 90%RM. Reps range from 3 to 12." (p.39)

> "Specificity comes in two versions; Alpha Bravo" (p.39)

> "The Alpha template utilizes a 50/50 split between maximal-strength and classical hypertrophy training." (p.39) … "Bravo is four days of pure hypertrophy training." (p.40)

### PROGRAMMING OVERVIEW (pp.40–41) — block length

> "Both General and Specificity consist of **3-week blocks**. You'll be provided with an initial standard programming schedule, but after that both can be run in various ratios depending on what aspect of muscle building you want to emphasize." (p.40)

> "Run General for as many cycles as required until your target weight is achieved." (p.40)

> "There are some of you that won't want to (or need to) run Specificity at all. … You can disregard Specificity completely." (p.40)

> "Some of you may want to spend most of your time running Specificity. Even so, I don't recommend excluding General completely during hypertrophy phases." (p.41) — **author's own recommendation.**

---

## GENERAL MASS TEMPLATES (p.42)

p.42 is a section divider carrying only the heading, which is set in the text layer without a space: "GENERAL MASSTEMPLATES" (p.42). No content.

---

# MASS TEMPLATE (pp. 43–47)

## Intro (p.43)

> "Drop any preconceived notions you may have of what a hypertrophy program should look like. Mass Template is a powerful and unconventional approach to growing muscle. It's a distant forefather to the popular Operator template found in Tactical Barbell I." (p.43)

> "**Mass is a 4-day template.** MT favors muscular hypertrophy while concurrently increasing maximal-strength. Mass and Operator are similar in that they employ frequency to maximize their objectives. Difference being Operator focuses on increasing maximal-strength with moderate hypertrophy, whereas MT significantly favors hypertrophy with less emphasis on maximal-strength." (p.43)

## MT CLUSTER (p.43, image `docs/MASS/images/p043_1.png`)

Transcribed cell for cell from the image:

| MT CLUSTER |
|---|
| Bench Press (BP) |
| Squat (SQ) |
| Weighted Pull-ups (WPU)* |
| *Barbell rows, Body Weight Pull-ups, or Romanian Deadlifts can be substituted for Weighted Pull-ups. |
| Deadlift (DL) |

**Exact order as printed in the image:** Bench Press (BP) / Squat (SQ) / Weighted Pull-ups (WPU)* / Deadlift (DL), then the footnote row:

> "*Barbell rows, Body Weight Pull-ups, or Romanian Deadlifts can be substituted for Weighted Pull-ups." (p.43, image)

*(The footnote is the last row of the table box, below "Deadlift (DL)". It is reproduced in the row-order table above out of position for readability only — in the book the four exercises are listed first and the asterisked note is at the bottom of the box.)*

### WPU qualification rule (p.43)

> "If you can do **12 or more bodyweight pull-ups you qualify for WPUs**. If you can't – sub in Barbell Rows, Romanian Deadlifts, or some other pull. **I recommend sticking with WPUs if qualified**, and watch the magic unfold when you treat them like a conventional lift." (pp.43–44)

Note the prose substitution list (p.43: "Barbell Rows, Romanian Deadlifts, or some other pull") is **not identical** to the image footnote list (p.43 image: "Barbell rows, Body Weight Pull-ups, or Romanian Deadlifts"). See Ambiguities.

### Why WPUs (p.44) — author's rationale, three numbered points

> "1. WPUs sufficiently cover off your biceps and arms to the point that you don't have to train them separately. Deadlifts alone don't do that to the same degree." (p.44)

> "2. It makes for an easy transition to typical military/police PFTs. With most PFTs, pull-ups are usually the exercise that need the most attention. … If included in your cluster, you won't need that extra prep work." (p.44)

> "3. The overall back/lat/grip development that results from treating WPUs like a conventional lift is extraordinary. You will grow wings over time." (p.44)

## MT EXERCISE SCHEDULE (p.44, image `docs/MASS/images/p044_1.png`)

Prose statement of the schedule:

> "The Bench Press, Squat, and Weighted Pull-up are each performed **three times a week on alternate days**. The Deadlift has its **own dedicated day at the end of the week**." (p.44)

Table transcribed cell for cell from `p044_1.png`. The header of the final column is printed **"Day7"** with no space; all other day headers have a space. There is a single data row whose Week cell reads `1-3`.

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1-3 | BP<br>SQ<br>WPU |  | BP<br>SQ<br>WPU |  | BP<br>SQ<br>WPU | DL |  |

Blank cells: Day 2, Day 4, Day 7 — all three weeks. **In the exercise-schedule table, Day 5 is trained in all of weeks 1–3.** (Contrast with the programming grid on p.45 — see Ambiguities.)

## MASS TEMPLATE — programming grid (p.45, image `docs/MASS/images/p045_1.png`)

Caption above the table:

> "The templates are **Sets x Reps / percentage of 1 Rep Max**. Note the slight difference when it comes to deadlift programming (Day 6)." (p.45)

Table transcribed cell for cell from `p045_1.png`. Header column 7 reads **"Day 6*"** (asterisk on the header). Cell contents are stacked lines; `/` below separates the printed lines within a single cell.

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6* | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | 4 x 8<br>65% |  | 4 x 8<br>65% |  | 4 x 8<br>65% | 4 x 5<br>65% |  |
| 2 | 4 x 6<br>75% |  | 4 x 6<br>75% |  | 4 x 6<br>75% | 4 x 5<br>75% |  |
| 3 | 4 x 3<br>80%<br>**SQ+**<br>**or**<br>**AMRAP** |  | 4 x 3<br>80%<br>**BP+**<br>**or**<br>**AMRAP** |  | *(blank)* | 1 x 3<br>80%<br>**DL+** |  |

Footnote printed below the grid:

> "*Day 6 = Deadlift Programming" (p.45, image)

**Verified points (re-checked at magnification against `p045_1.png`):**

- **Week 3 / Day 5 is EMPTY.** The Day 5 column has content in weeks 1 and 2 only. This directly conflicts with the p.44 exercise schedule, which shows BP/SQ/WPU on Day 5 for weeks 1–3. Recorded, not resolved — see Ambiguities.
- **Day 6 (deadlift) differs from the other days in every week:**
  - Weeks 1 and 2: `4 x 5` (all other trained days are `4 x 8` / `4 x 6`). The percentage matches the rest of the week (65%, then 75%).
  - Week 3: `1 x 3 / 80% / DL+` — **one** work set, not four, and it carries the `DL+` peaking marker with **no "or AMRAP" alternative**.
- The `+` markers and the words `or` / `AMRAP` are printed in **bold**; the sets×reps and percentages are not.
- Week row labels: `1` is set in regular weight in the image; `2` and `3` are bold. No apparent meaning.

## EXECUTION (p.45)

> "**Perform all sets of each exercise before moving on to the next.** Rest as needed in between sets. For most, **2-3 minutes** should be enough. The objective is to complete all reps of each set while minimizing muscle failure. Fatigue on the last few reps is acceptable and expected, but if you're failing completely before finishing the set then use a longer rest interval; **5 minutes or more**. If you're still failing, then **lower your 1 rep maximums by 5-10% and recalculate**." (p.45)

Implementation-relevant breakdown:

| Rule | Value | Page |
|---|---|---|
| Exercise ordering within a session | All sets of one exercise, then the next | p.45 |
| Default rest between sets | 2–3 minutes ("for most") | p.45 |
| Rest if failing sets | 5 minutes or more | p.45 |
| If still failing after longer rest | Lower 1RMs by **5–10%** and recalculate | p.45 |

*(The book gives no rule for which lift is done first within an MT session on p.45. It addresses that later, outside this range — see "Cross-references outside pp.37–53".)*

## AMRAP or PEAK (+) (pp. 45–46)

The heading "AMRAP or PEAK (+)" appears at the foot of p.45; the body runs on p.46.

> "**Where scheduled (week 3)** you can use AMRAP or Peaking techniques to ramp up the intensity of a session. **Choose one or the other.**" (p.46)

### AMRAP (p.46)

> "AMRAP aka As Many Reps as Possible. **AMRAP one exercise per session.** For example, for **Week 3 Day 1 it's the squat**. Complete the assigned work for the bench press & WPU (**4 sets x 3 reps at 80%RM**) and then move on to the squat. Complete the 4 x 3 as per the programming – **on the fourth set, instead of stopping at 3 reps keep going until you can't. Keep one or two reps in the bank for safety.** On **Day 3, it's the same thing, but with the bench press**." (p.46)

> "**Only one exercise per session is AMRAP'd.** The other exercises are performed normally as per the programming. **I don't recommend AMRAP with the deadlift** as it's too easy to injure yourself when form deteriorates." (p.46)

Implementation-relevant breakdown:

| Rule | Detail | Page |
|---|---|---|
| When available | Week 3 only ("where scheduled") | p.46 |
| Exclusivity | AMRAP **or** Peaking, not both | p.46 |
| How many exercises | Exactly one per session | p.46 |
| Which exercise, Week 3 Day 1 | Squat | p.46 |
| Which exercise, Week 3 Day 3 | Bench press | p.46 |
| Non-AMRAP lifts that day | 4 sets x 3 reps at 80%RM, as programmed | p.46 |
| Which set is AMRAP'd | The **fourth** (last) set only | p.46 |
| Stop condition | "keep going until you can't. Keep one or two reps in the bank for safety" | p.46 |
| Deadlift | **Not recommended** (author's recommendation) | p.46 |

### PEAKING (+) (p.46)

> "**PEAKING SQ+/BP+/OHP+/DL+:** Work up to heavy triples, doubles, or singles with the chosen exercise. Peaking is essentially playtime with the lift of the day." (p.46)

> "**Do only ONE work set x 3 reps (80%RM)** with the selected exercise. Then add weight to the bar. **Increments of 5 to 10lbs. Rest for 3 to 5 minutes** and try a triple, double, or single. Then add a little more. Rest up and try another triple, double, or single. **Keep working your way up until you can't or until you want to stop. Rest for as long as you want between sets. Do as much or as little of this extra work as you'd like.**" (p.46)

Worked example as printed (note it names the **bench press** for Week 3 / Day 1 — see Ambiguities):

> "For example, **Week 3/Day 1 the bench press is the chosen one**. Perform squats & WPUs as per the standard programming (**4 sets of 3 reps/80%**). After that, move on to the bench press. **Perform ONE work set of 3 reps at 80%.** After the work set is out of the way begin working up to new heavier triples, doubles, and singles." (p.46)

Escape hatch:

> "**On days you're strapped for time or don't have the juice, do the lifts as programmed without peaking or AMRAP.**" (p.46)

Implementation-relevant breakdown:

| Rule | Detail | Page |
|---|---|---|
| Marker syntax | `SQ+` / `BP+` / `OHP+` / `DL+` | p.46 |
| Work set for the peaked lift | **ONE** set x 3 reps at 80%RM (not 4 x 3) | p.46 |
| Load increment per attempt | 5 to 10 lbs | p.46 |
| Rest before each attempt | 3 to 5 minutes | p.46 |
| Rest between the peaking sets generally | "as long as you want" | p.46 |
| Attempt rep counts | triple, double, or single (trainee's choice each time) | p.46 |
| Termination | "until you can't or until you want to stop"; volume of extra work entirely optional | p.46 |
| Other lifts that day | Standard programming, 4 sets of 3 reps / 80% | p.46 |
| Opt-out | Do the session as programmed, no peaking, no AMRAP | p.46 |

## PROGRESSION — Mass Template (p.47)

> "**Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat.** Don't force progression for exercises you struggled with - **use the same numbers for the next block**." (p.47)

Implementation-relevant breakdown:

| Rule | Detail | Page |
|---|---|---|
| Progression cadence | Every 3 to 6 weeks | p.47 |
| Progression amount | Add 5–10 lbs to the **1RM** (not to the working weight) | p.47 |
| Then | Recalculate all percentages and repeat the block | p.47 |
| Per-lift stall rule | If you struggled with an exercise, carry the same 1RM into the next block | p.47 |

*(The wave itself — 65% / 75% / 80% over weeks 1–3 — is not restated as repeating on p.47; "Recalculate and repeat" is the only statement of what happens after week 3 within this range. p.40 states General is a 3-week block.)*

---

# GREY MAN TEMPLATE (pp. 48–53)

## Intro (p.48)

Heading printed as "GREY MAN TEMPLATE" on p.48 and "GREY-MAN TEMPLATE" (hyphenated) as the grid title on p.51.

> "Grey Man is a versatile, efficient mass builder that uses a simple alternating **'A-B-A/B-A-B'** style schedule. A favorite among operational clients. It combines general mass building with supplementary/isolation work. **It leaves the trainee with four days off** which allows for more flexibility with conditioning and recovery." (p.48)

## GM CLUSTERS (p.48)

> "GM contains **two clusters** – the **Main cluster** provided below, and a **Supplementary (S) Cluster**. **The Main cluster is standard across the board, the same for everyone. You create and customize the S cluster** (example provided below)." (p.48)

### MAIN CLUSTER (p.48, image `docs/MASS/images/p048_1.png`)

Transcribed cell for cell:

| MAIN CLUSTER |
|---|
| Bench Press (BP) |
| Squat (SQ) |
| Overhead Press (OHP) |
| Deadlift (DL) |

No footnote, no substitution note on this table (p.48 image).

### S CLUSTER (Example) (p.49, image `docs/MASS/images/p049_1.png`)

Transcribed cell for cell. `S1` and `S2` are printed **bold and underlined** in the image; the exercises under each are plain.

| S CLUSTER (Example) |
|---|
| **<u>S1</u>** |
| Dips |
| Incline Dumbbell Press |
| Front Squat |
| **<u>S2</u>** |
| Dumbbell Shrugs |
| Dumbbell Row |

This is explicitly an **example**, not a prescription (p.48: "You create and customize the S cluster (example provided below)"; the table title itself reads "S CLUSTER (Example)").

### Rules for building the S Cluster (p.49)

> "Don't get too crazy and overload yourself with supplementary (S Cluster) exercises. **Use no more than 4 to 6.** You'll get a chance to go hog-wild with accessory work during Specificity phase. **After you pick your 4 to 6 exercises, divide the list in two** as I've done in the example above." (p.49)

> "S exercises can consist of **dumbbells, barbells, kettlebells, and bodyweight**. Think isolation work. Incline dumbbell press, weighted dips, barbell curls, shrugs – anything you can think of are all on the table." (p.49)

> "If you're an operational type and want to use your supplementary time for non-conventional exercises or training – go for it. That's the idea behind GM. If you're feeling kettlebells, bodyweight work, grip, core, plyometrics or even extra conditioning – S cluster is where you do it. Get your two main lifts out of the way, and after that what you do with your S time is up to you. **However, for those looking for a pure aesthetic/mass-centric result – stick to the more conventional exercises using dumbbells and barbells.**" (p.49) — the final sentence is the **author's recommendation** for mass-focused trainees.

Implementation-relevant breakdown:

| Rule | Detail | Page |
|---|---|---|
| S cluster size | 4 to 6 exercises total, no more | p.49 |
| Split | Divide the chosen 4–6 into two lists: S1 and S2 | p.49 |
| Allowed implements | Dumbbells, barbells, kettlebells, bodyweight | p.49 |
| Character | Isolation work | p.49 |
| Operational alternative | Grip, core, plyometrics, even extra conditioning permitted in S time | p.49 |
| Author's recommendation for pure mass/aesthetics | Stick to conventional dumbbell/barbell exercises | p.49 |

*(The book does not state how the 4–6 exercises should be split between S1 and S2 — the example splits 3 and 2. See Ambiguities.)*

## GM EXERCISE SCHEDULE (p.50, image `docs/MASS/images/p050_1.png`)

Legend printed on p.50 above/around the table:

> "S1 = Supplementary Cluster #1
> S2 = Supplementary Cluster #2" (p.50)

> "**The two main lifts of the day are performed first. They have their own unique set/rep/load structure. After the main lifts are completed, the supplementary (S) exercises are performed. The supplementary exercises have a set/rep/load structure different from that of the main lifts.** See the programming table below." (p.50)

Table transcribed cell for cell from `p050_1.png`. `S1` / `S2` are printed **bold**; the main-lift abbreviations are not.

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | BP<br>SQ<br>**S1** |  | OHP<br>DL<br>**S2** |  | BP<br>SQ<br>**S1** |  |  |
| 2 | OHP<br>DL<br>**S2** |  | BP<br>SQ<br>**S1** |  | OHP<br>DL<br>**S2** |  |  |
| 3 | BP<br>SQ<br>**S1** |  | OHP<br>DL<br>**S2** |  | BP<br>SQ<br>**S1** |  |  |

Blank cells: Day 2, Day 4, Day 6, Day 7 — all three weeks. This is the A/B/A — B/A/B — A/B/A alternation described on p.48, with **A = BP+SQ+S1** and **B = OHP+DL+S2**. Week 3 repeats week 1 exactly; the pattern has a two-week period. Three lifting days per week, four days off (p.48).

## GREY-MAN TEMPLATE — programming grid (p.51, image `docs/MASS/images/p051_1.png`)

Table transcribed cell for cell from `p051_1.png`. Each populated cell contains **four stacked lines**: main-lift sets×reps, main-lift %, then S-lift sets×reps and S-lift % **in bold**.

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | 4-5 x 8<br>70%<br>**4 x 12**<br>**55%** |  | 4-5 x 8<br>70%<br>**4 x 12**<br>**55%** |  | 4-5 x 8<br>70%<br>**4 x 12**<br>**55%** |  |  |
| 2 | 4-5 x 6<br>75%<br>**4 x 10**<br>**60%** |  | 4-5 x 6<br>75%<br>**4 x 10**<br>**60%** |  | 4-5 x 6<br>75%<br>**4 x 10**<br>**60%** |  |  |
| 3 | 4-5 x 3<br>80%<br>**4 x 8**<br>**65%** |  | 4-5 x 3<br>80%<br>**4 x 8**<br>**65%** |  | 4-5 x 3<br>80%<br>**4 x 8**<br>**65%** |  |  |

All three training days in a given week carry **identical** prescriptions. There are **no `+` peaking markers and no AMRAP markers anywhere in the Grey Man grid** (p.51 image) — unlike the Mass Template grid on p.45.

Week row labels 1, 2, 3 are all bold in the image.

## EXECUTION — how to read the grid (pp. 51–52)

> "The above table is **Sets x Reps/percentage of 1 Rep Maximum**.
> **The first set of numbers applies to the main lifts.**
> **The second set of numbers (in bold) applies to the S lifts.**
> For example, here's the box for Week 1/Day 1:" (p.51)

### The Week 1 / Day 1 example box (p.52, embedded image, PDF xref 877)

> **Note:** this image was **not** present in `docs/MASS/images/` at the time of extraction (there is no `p052_1.png`). It was extracted directly from the PDF (page 52, image xref 877, 278×607 px) and transcribed. If the images folder is regenerated, this table should get a `p052_1.png`.

| Day 1 |
|---|
| 4-5 x 8 |
| 70% |
| **4 x 12** |
| **55%** |

Identical to the Week 1 Day 1 cell of the p.51 grid, as expected.

### Walk-through of the example (p.52)

> "The first set of numbers refers to the Main cluster lifts, in this case on **Day 1 it's the Bench Press and Squat** (see GM Exercise Schedule). **Perform 4 to 5 sets of 8 reps with 70% of your 1 rep maximum for both exercises.**" (p.52)

> "After completing the two main lifts of the day, move on to the supplemental work – specifically **S Cluster#1 or S1**. In the example I created S1 consists of **Dips, Incline DB Press, and Front Squats**. **Perform 4 sets of 12 for each using 55% of your 1 rep maximum.**" (p.52)

**Bodyweight-exercise handling — the only guidance in this range:**

> "Since I'm using bodyweight for Dips in this example; **I'll do 4 sets of 55% of my total max reps, or I'll keep it simple and do 4 sets of 12.**" (p.52)

> "On **Day 3 my main lifts are the OHP and DL. My S cluster (S2) consists of DB Shrugs and rows.** I'll perform the main lifts first (**4 sets of 8/70%**), take a little break and move on to the shrugs and pull-ups. **4 sets of 12/ 55%RM** for the supplementary work." (p.52)

> "Too easy." (p.52)

*(Note: the Day 3 walk-through says "4 sets of 8/70%" for the main lifts where the grid prints "4-5 x 8 / 70%"; and it says "shrugs and pull-ups" where the example S2 cluster on p.49 lists "Dumbbell Shrugs" and "Dumbbell Row". Both recorded in Ambiguities.)*

## EXECUTION — MAIN CLUSTER (pp. 52–53)

> "**Perform all sets of each exercise before moving on to the next. Rest for approximately 2-5 minutes or more in between sets.** The objective is to complete all reps of each set while minimizing muscle fatigue/failure. A little fatigue on the last few reps is acceptable, but if you're failing completely before finishing the set then use a longer rest interval; **5 minutes or longer**. If you're still failing consistently, **lower your 1 rep maximum by 10% and recalculate**." (pp.52–53)

## EXECUTION — SUPPLEMENTARY CLUSTER (S1 & S2) (p.53)

> "**Rest for 1-2 minutes between sets.** The objective is to complete all reps of all sets, but muscle failure and fatigue on the last few reps is acceptable. **Super-setting is also an option for S Cluster.**" (p.53)

### Grey Man execution parameters, consolidated

| Rule | Main cluster | S cluster (S1/S2) | Page |
|---|---|---|---|
| Order within session | Main lifts first, both of them, before any S work | S work after both main lifts | p.50, p.52 |
| Order within an exercise | All sets of one exercise before the next | (same statement applies to main cluster; not restated for S) | p.52 |
| Rest between sets | approximately **2-5 minutes or more** | **1-2 minutes** | p.52, p.53 |
| Rest if failing | 5 minutes or longer | — | p.53 |
| Failure remedy | Lower 1RM by **10%** and recalculate | — | p.53 |
| Failure tolerance | "A little fatigue on the last few reps is acceptable" | "muscle failure and fatigue on the last few reps is acceptable" | pp.52–53 |
| Super-setting | not mentioned | explicitly allowed | p.53 |

**Note the difference from the Mass Template:** MT says lower 1RMs by **5-10%** (p.45); Grey Man says lower by **10%** (p.53). MT default rest is **2-3 minutes** (p.45); GM main-cluster rest is **2-5 minutes or more** (p.52). These are genuinely different numbers in the book, not a transcription slip.

## PROGRESSION — Grey Man (p.53)

> "**Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat.** Don't force progression for exercises you struggled with - **use the same numbers for the next block**." (p.53)

Word-for-word identical to the Mass Template progression paragraph on p.47.

---

## Implementation notes

### Units

- Every absolute weight figure in this range is in **pounds**: "Increments of 5 to 10lbs" (p.46); "add 5-10lbs to 1RMs" (pp.47, 53). **The book never mentions kilograms anywhere in pp.37–53** (nor anywhere in the full text dump — a case-insensitive search of `mass-text.txt` for "kg" / "kilo" returns nothing).

### Rounding

- **The book states no rounding rule anywhere in pp.37–53.** It never says round up, round down, round to the nearest plate, or round to the nearest 5 lbs. A case-insensitive search of the entire text dump for "round", "nearest" and "plate" turns up **no** weight-rounding instruction in the book at all (the only "plates" hit is p.32, about SE work in Base Building, unrelated to load calculation).
- The only load-quantisation figure given is the **peaking increment**: "Increments of 5 to 10lbs" (p.46) — that is a jump size while working up, not a rounding rule for the calculated percentage loads.
- Consequence for the app: **rounding is undefined by the book and must be recorded as an implementation decision**, not presented as book fidelity.

### 1RM basis

- All percentages in both grids are of the **1 Rep Maximum**, stated three times: "percentage of 1 Rep Max" (p.45), "percentage of 1 Rep Maximum" (p.51), "70% of your 1 rep maximum" (p.52).
- **There is no separate "training max" concept in this range.** Percentages are applied directly to a tested 1RM. Progression adds lbs to the **1RM** itself and everything is recalculated (pp.47, 53).
- **Every lift needs its own 1RM**, including the S-cluster exercises ("4 sets of 12 for each using 55% of your 1 rep maximum", p.52), and including bodyweight exercises where a **max-reps** figure substitutes for a 1RM ("4 sets of 55% of my total max reps, or … 4 sets of 12", p.52).

### Block length and what happens after week 3

- General Mass blocks are **3 weeks** (p.40).
- Both templates' grids are exactly 3 weeks wide with a rising-load, falling-rep wave: MT 65% / 75% / 80% at 8 / 6 / 3 reps (p.45); GM main lifts 70% / 75% / 80% at 8 / 6 / 3 reps and S lifts 55% / 60% / 65% at 12 / 10 / 8 reps (p.51).
- After week 3: "Recalculate and repeat" (pp.47, 53) — i.e. the same 3-week wave runs again against the new 1RMs. **No deload week is specified inside a block on any page in this range.**
- The progression *cadence* is "Every 3 to 6 weeks" (pp.47, 53), which does not map cleanly onto a 3-week block — see Ambiguities.

### Per-day differences that an implementation must encode

**Mass Template (p.45):**
- Days 1, 3, 5 are the "cluster" days: BP, SQ and WPU all at the same sets×reps×% for that week (p.44 schedule + p.45 grid; confirmed by the p.46 AMRAP example "the bench press & WPU (4 sets x 3 reps at 80%RM)").
- Day 6 is deadlift-only and has its **own** prescription: `4 x 5` in weeks 1 and 2 versus `4 x 8` / `4 x 6` for the other days, and `1 x 3` in week 3 versus `4 x 3` (p.45 grid, footnote "*Day 6 = Deadlift Programming").
- Week 3 Day 1 marks the **squat** (`SQ+`), Week 3 Day 3 marks the **bench press** (`BP+`), Week 3 Day 6 marks the **deadlift** (`DL+`) (p.45 grid). WPU is never marked.
- Week 3 Day 5 is blank in the grid (p.45).

**Grey Man (pp.50–51):**
- Every training day in a week carries the identical prescription; only the *exercises* alternate (p.51 grid).
- Two prescriptions run per day: main-lift numbers and S-lift numbers (p.51).
- The main-lift set count is a **range** — `4-5 x 8` etc. — not a fixed number (p.51 grid). S-lift set count is fixed at 4.
- A/B alternation has a **two-week period**, so an implementation cannot key the day's cluster off the day-of-week alone; it needs week parity (p.50 grid).

---

## Cross-references outside pp.37–53

These are not in scope but bear directly on how the templates above are executed; they are noted here only so the in-scope rules are not read as complete. All are from the "GENERAL MASS MISCELLANEOUS" section:

- 1RM testing before a block: "Calculate 1 rep maximums for all exercises in your cluster prior to beginning. You can do your testing in one session or over two. After testing take two or three days off before starting the block. Don't get OCD – a 2-3 rep maximum to calculate a 1RM is fine. But DO test. Don't guess." (p.63)
- Exercise order within a session is the trainee's choice: "Choose whatever order of exercise you like. I personally like starting with BP … Ultimately it doesn't matter – it's entirely up to you." (p.63) — this **relaxes** the p.45 EXECUTION wording.
- Circuiting/stacking is allowed: "Optionally, you can circuit-train or stack a couple exercises together. So long as you rest adequately in between sets regardless of exercise." (p.63)
- Rest intervals restated: "the Golden Rule is NOT in effect for Mass Protocol … for most people that's going to be 2 to 5 minutes in between sets … 3-5 minutes is usually the sweet spot for heavier sessions." (pp.63–64) — differs again from the 2-3 minutes on p.45.

---

## Ambiguities and choices

Recorded, not resolved. Where the book states its own preference it is marked **(author's recommendation)**.

1. **Mass Template Week 3 / Day 5 is blank in the programming grid but populated in the exercise schedule.** The p.44 exercise schedule shows BP/SQ/WPU on Day 5 for weeks "1-3". The p.45 programming grid has Week 3 / Day 5 empty while Days 1, 3 and 6 are populated. The book never comments on this. Verified at magnification — the cell genuinely has no printed content. An app must decide whether Week 3 Day 5 is a rest day or a `4 x 3 / 80%` day, and the book does not say.

2. **MT peaking example contradicts the grid and the AMRAP paragraph about which lift is peaked on Week 3 Day 1.** The grid marks Day 1 `SQ+` (p.45); the AMRAP paragraph says "for Week 3 Day 1 it's the squat" (p.46); the peaking worked example says "Week 3/Day 1 the bench press is the chosen one" and has you do squats & WPUs as programmed (p.46). Two of the three say squat.

3. **`OHP+` appears in the MT peaking marker list but OHP is not in the MT cluster.** "PEAKING SQ+/BP+/OHP+/DL+" (p.46) sits inside the Mass Template chapter, whose cluster is BP/SQ/WPU/DL (p.43). OHP belongs to the Grey Man Main Cluster (p.48), which has no `+` markers in its grid (p.51). Unclear whether the marker list is generic boilerplate or implies a substitution.

4. **The WPU substitution list is stated twice, differently.** Prose: "sub in Barbell Rows, Romanian Deadlifts, or some other pull" (p.43). Table footnote: "Barbell rows, Body Weight Pull-ups, or Romanian Deadlifts can be substituted for Weighted Pull-ups" (p.43 image). The prose is open-ended ("some other pull") and omits bodyweight pull-ups; the footnote is a closed list of three and omits the open-ended option. **(Author's recommendation:** "I recommend sticking with WPUs if qualified", p.43, where qualified = 12+ bodyweight pull-ups.)

5. **Is AMRAP/peaking available on Week 3 Day 5?** "Where scheduled (week 3)" (p.46) with named examples only for Day 1 and Day 3 — and Day 5 of week 3 is blank in the grid anyway (see #1). Unresolvable from the book.

6. **AMRAP is not offered on the MT deadlift day, and the reason given is a recommendation rather than a prohibition.** The Week 3 Day 6 cell shows `DL+` with no "or AMRAP" (p.45 grid), and the text says "I don't recommend AMRAP with the deadlift as it's too easy to injure yourself when form deteriorates" (p.46) — **(author's recommendation)**. The grid treats it as simply not offered.

7. **The Week 3 MT main work-set count when peaking is only stated for the peaked lift.** "Do only ONE work set x 3 reps (80%RM) with the selected exercise" (p.46) — so the peaked lift drops from `4 x 3` to `1 x 3` while the other lifts stay at `4 x 3`. The grid's Week 3 Day 1 / Day 3 cells still print `4 x 3` above the `SQ+ or AMRAP` marker, so the cell's own numbers do not reflect the peaking variant. Only the Day 6 `DL+` cell prints `1 x 3` directly. An app must model the peaked lift's set count as conditional.

8. **Peaking has no defined stopping rule or ceiling.** "Keep working your way up until you can't or until you want to stop. Rest for as long as you want between sets. Do as much or as little of this extra work as you'd like." (p.46) Not programmable as a fixed prescription; entirely trainee-directed. Increments 5–10 lbs and rests 3–5 minutes are the only numeric anchors (p.46).

9. **Progression cadence "Every 3 to 6 weeks" against a 3-week block.** Blocks are 3 weeks (p.40), so "3 to 6 weeks" means either every block or every second block. The book gives no rule for choosing. It also does not say whether the 5–10 lb increment differs by lift (e.g. upper vs lower body).

10. **"Don't force progression for exercises you struggled with" has no defined threshold** (pp.47, 53). What counts as "struggled" is not specified, and it interacts with — but is not tied to — the failure rule that says to *lower* the 1RM (5-10% on p.45, 10% on p.53). It is unclear whether "struggled" means "failed reps" (which triggers a reduction) or something milder (which triggers a hold).

11. **No rounding rule anywhere.** See Implementation notes. The app must invent one.

12. **Grey Man main-lift set count is a range, `4-5`, with no rule for choosing** (p.51 grid). The p.52 walk-through says "Perform 4 to 5 sets of 8 reps" for Day 1 but then says "4 sets of 8/70%" for the Day 3 main lifts — the book itself uses both. No progression rule from 4 sets to 5 is given.

13. **How to split 4–6 S exercises between S1 and S2 is not specified.** "After you pick your 4 to 6 exercises, divide the list in two as I've done in the example above" (p.49). The example splits 3 / 2 (p.49 image), i.e. unevenly, from a 5-exercise list. Whether the split should be balanced, by movement pattern, or arbitrary is not stated.

14. **S-cluster 1RMs for non-barbell and bodyweight work.** The grid prescribes a percentage of 1RM for S lifts (p.51), but S exercises may be kettlebell, grip, core, plyometric or conditioning work (p.49) for which a 1RM is meaningless. The only guidance offered is for bodyweight: "4 sets of 55% of my total max reps, **or** I'll keep it simple and do 4 sets of 12" (p.52) — the book explicitly offers a choice and expresses no preference between the two, though "keep it simple" is the phrasing attached to the fixed-rep option.

15. **The p.52 Day 3 walk-through names exercises not in the stated example S2 cluster.** S2 is listed as "Dumbbell Shrugs / Dumbbell Row" (p.49 image) and the text first says "My S cluster (S2) consists of DB Shrugs and rows", then says "move on to the shrugs and **pull-ups**" (p.52). Almost certainly a slip in the book, but recorded rather than corrected.

16. **The Grey Man grid carries no AMRAP or peaking markers at all** (p.51), and the Grey Man chapter never mentions AMRAP or peaking. Whether the MT AMRAP/peaking options may be applied to Grey Man's Week 3 (which is also 80% x 3) is not addressed either way.

17. **Grey Man's failure remedy (lower 1RM by 10%, p.53) differs from Mass Template's (5-10%, p.45)**, and Grey Man gives no failure remedy for the S cluster at all (p.53 only covers rest, tolerance and super-setting). Also, MT's default rest is 2-3 minutes (p.45) while GM's main cluster is 2-5 minutes or more (p.52) and the later general chapter says 2-5 minutes with 3-5 as the sweet spot (pp.63-64) — three different figures for essentially the same situation.

18. **Whether the Grey Man A/B pattern continues across block boundaries.** The grid ends on Week 3 Day 5 = A (BP/SQ/S1) (p.50). Restarting the block puts A on Week 1 Day 1 again, so two consecutive A days would fall across the block seam. The book does not address this.

19. **Day numbering is not mapped to calendar days.** Both grids use "Day 1 … Day 7" with no statement of which weekday Day 1 is, and there is no rule about whether the rest days may be shifted. p.48 only says Grey Man "leaves the trainee with four days off which allows for more flexibility with conditioning and recovery."

20. **The exercise-order rule is stated twice with different strictness.** MT EXECUTION says "Perform all sets of each exercise before moving on to the next" (p.45), and Grey Man MAIN CLUSTER repeats it (p.52); but p.63 says circuiting/stacking is optional and "Choose whatever order of exercise you like … it's entirely up to you". Within pp.37–53 the strict reading stands; the relaxation is outside this range.


---

# 04 — General Mass: Gladiator, Fighter HT & Miscellaneous (PDF pp. 54–66)

> Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`. All page references in this
> document are **PDF page numbers of that file**, in the form `(p.56)`.
>
> Every grid/table below was transcribed **visually** from the extracted table images
> (`docs/MASS/images/pNNN_N.png`), because all tables in this book are embedded images with no text
> layer. Images transcribed for this section: `p054_1.png`, `p054_2.png`, `p055_1.png`, `p057_1.png`,
> `p058_1.png`, `p059_1.png`, `p060_1.png`, `p066_1.png`. Blank cells in the book are left blank here.
> Nothing has been normalised, unit-converted, tidied or "corrected".

---

## GLADIATOR (pp. 54–57)

### Introduction (p.54)

> "Named in honor of the original but now defunct template found in the very first edition of Tactical
> Barbell. Gladiator consists of four lifting sessions per week and includes techniques like AMRAP and
> Peaking to optimize growth." (p.54)

- **Four lifting sessions per week** (p.54).

### GLADIATOR CLUSTER (p.54, image `p054_1.png`)

Heading in the image: **GLADIATOR CLUSTER**

| GLADIATOR CLUSTER |
|---|
| Bench Press (BP) |
| Squat (SQ) |
| Overhead Press (OHP) |
| Deadlift (DL) |

- Four exercises. **No substitution footnote appears in or under this cluster box** (p.54).
- The only exercise-choice latitude stated for Gladiator is in the prose on p.55: "You can also change
  up the order or combination of exercises." (p.55)

### GLADIATOR EXERCISE SCHEDULE (p.54, image `p054_2.png`)

Caption above the table in the text layer: **GLADIATOR EXERCISE SCHEDULE** (p.54).

| Week | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1-3 | OHP<br>SQ | BP<br>DL |  | OHP<br>SQ | BP<br>DL |  |  |

- The row label is exactly `1-3` (p.54) — one row covering weeks 1 to 3.
- Day 3, Day 6 and Day 7 cells are **empty** (p.54).
- Column headers in this image are written without a space: `Day1`, `Day2`, … `Day7` (p.54).

### Schedule flexibility (p.55) — exact quote

> "You don't have to stick to the above schedule exactly. Insert a day between sessions if desired, such
> as doing Day 5 on Day 6 instead. You can also change up the order or combination of exercises." (p.55)

*(No minimum-rest rule is stated for Gladiator — unlike Fighter HT, which has an explicit 48-hour rule,
see p.60–61.)*

### GLADIATOR programming grid (p.55, image `p055_1.png`)

Heading above the table in the text layer: **GLADIATOR** (p.55).
Caption below the table: "The above is Sets x Reps/Percentage of 1 rep maximum." (p.55)

| Week | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | 4-5 x 8<br>60% | 4-5 x 8<br>60% |  | 4-5 x 8<br>60% | 4-5 x 8<br>60% |  |  |
| 2 | 4-5 x 6<br>70% | 4-5 x 6<br>70% |  | 4-5 x 6<br>70% | 4-5 x 6<br>70% |  |  |
| 3 | 4 x 3<br>80%<br>**SQ+**<br>**or**<br>**AMRAP** | 4 x 3<br>80%<br>**BP+**<br>**or**<br>**AMRAP** |  | 4 x 3<br>80%<br>**OHP+**<br>**or**<br>**AMRAP** | 4 x 3<br>80%<br>**DL+** |  |  |

Cell-level notes (all p.55):
- Column headers in this image **do** have spaces: `Day 1`, `Day 2`, … `Day 7`.
- Weeks 1 and 2 use the range `4-5 x` sets; week 3 uses a flat `4 x 3`.
- Week 3 / Day 5 (the DL day) shows **`DL+` only — no "or AMRAP"** in the cell. Every other week-3 cell
  shows `<lift>+` / `or` / `AMRAP`.
- The `SQ+`, `BP+`, `OHP+`, `DL+`, `or` and `AMRAP` text is **bold** in the book image.
- Day 3, Day 6, Day 7 columns are empty in all three week rows.
- The grid gives **one prescription per day**, applied to **both** lifts scheduled that day (see the
  execution example on p.55, which applies `4 to 5 sets of 8 using 60%` to squat *and* overhead press).

### EXECUTION (pp. 55–56)

> "Perform all sets of each exercise before moving on to the next." (p.55)

> "Week 1/Day 1 squat for 4 to 5 sets of 8 using 60% of your 1RM. Do the same with the overhead press."
> (p.55)

> "Rest as needed in between sets. For most, 2-3 minutes is sufficient." (p.55)

> "The objective is to complete all reps of each set while minimizing muscle failure. A little fatigue on
> the last few reps is acceptable, but if you're failing completely before finishing the set then use a
> longer rest interval; 5 minutes or longer. If you're still failing, then lower your 1 rep maximum by
> 10% and recalculate." (pp.55–56)

Failure-handling ladder for Gladiator, in order (pp.55–56):
1. Rest 2–3 minutes for most sets.
2. Failing completely before finishing the set → rest **5 minutes or longer**.
3. Still failing → **lower the 1RM by 10% and recalculate**.

### AMRAP OR PEAK (+) (p.56)

> "Where scheduled (week 3) you can use AMRAP or peaking techniques to ramp up the intensity of a
> session. Choose one or the other." (p.56)

**AMRAP** (p.56):
> "AMRAP aka As Many Reps as Possible. AMRAP one exercise per session. For example, for Week 3 Day 1 it's
> the squat. You'll complete the assigned work for the overhead press (4 sets x 3 reps at 80%RM) and then
> you'll move on to the squat. Complete the 4 x 3 as per the programming. On the fourth set, instead of
> stopping at 3 reps keep going until you can't. Stop one or two reps short of failure if you don't have
> a spotter. On Day 2, you'll do the same thing with the bench press. Only one exercise is AMRAP'd per
> session. The other exercise is performed normally as per the programming. I don't recommend AMRAP with
> the deadlift as it's too easy to injure yourself when form deteriorates." (p.56)

Rules an app would implement (p.56):
- AMRAP applies to **one exercise per session only**; the other scheduled exercise is done as programmed.
- AMRAP happens on the **fourth (last) set** of the `4 x 3`, continuing past 3 reps.
- Without a spotter: stop **one or two reps short of failure**.
- **AMRAP is not recommended for the deadlift** (author's own recommendation).

**PEAKING** (p.56):
> "PEAKING SQ+/BP+/OHP+/DL+: Work up to heavy triples, doubles, or singles with the chosen exercise."
> (p.56)

> "Do only ONE work set x 3 reps (80%RM) with the selected exercise. Then add weight to the bar.
> Increments of 5 to 10lbs. Rest for 3 to 5 minutes and try a triple, double, or single. Then add a
> little more. Rest up and try another triple, double, or single. Keep working your way up until you
> can't or until you want to stop. Rest for as long as you want between sets. Do as much or as little of
> this extra work as you'd like. For example, Week 3/Day 2 is bench press/deadlift training. Bench Press
> is the scheduled peaking exercise. Perform deadlifts as per the standard programming (4 sets of 3
> reps/80%). After that, move on to the bench press. Perform ONE work set of 3 reps at 80%. After the
> work set is out of the way begin working up to new heavier triples, doubles, and singles." (p.56)

Rules an app would implement (p.56):
- When peaking, the selected exercise does **ONE work set × 3 reps @ 80%RM** — *replacing* the programmed
  `4 x 3`.
- Then load is added in **increments of 5 to 10lbs**.
- Rest **3 to 5 minutes** between the ramp-up attempts; "Rest for as long as you want between sets."
- Ramp with triples, doubles or singles, "until you can't or until you want to stop" — volume of the
  ramp-up is entirely at the lifter's discretion.
- The other exercise that day is performed to standard programming.

### Pull-quote box (p.57, image `p057_1.png`)

White text on dark background, verbatim:

> "During week 3 Peaking or AMRAP can be performed. On days you don't have the time or energy for
> either, do straight sets across as per standard programming." (p.57)

Body text on the same page:
> "On the days you're strapped for time or don't have the juice, do the lifts as programmed without
> peaking or AMRAP." (p.57)

### PROGRESSION (p.57)

> "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises
> you struggled with - use the same numbers for the next block." (p.57)

---

## FIGHTER HT (pp. 58–62)

### Introduction (p.58)

> "Fighter HT is mass building for the minimalist. Simple but effective. Standard Fighter as found in
> Tactical Barbell I is our most popular template for those who lift to support another primary activity.
> Fighter leverages frequency to squeeze the most out of a minimal amount of training time. Fighter HT
> works in a similar fashion – but with hypertrophy being the goal rather than limit strength. This is
> for you if you can't devote a significant amount of time or energy to mass building but want to train
> toward that objective with the time you do have. A good option for those who have unavoidable physical
> commitments like unit PT or MMA - and can't wreck themselves completely in the quest for hypertrophy.
> Fighter HT isn't as optimal as MT, GM, or Gladiator, but it'll keep you moving toward the goal – muscle
> mass." (p.58)

- Author's own ranking: **Fighter HT is explicitly less optimal than MT, GM or Gladiator** (p.58).

### CLUSTER (p.58, image `p058_1.png`)

Text-layer heading above the image: **CLUSTER** (p.58). Heading inside the image: **FIGHTER HT**.

| FIGHTER HT |
|---|
| Bench Press (BP) |
| Squat (SQ) |
| Deadlift (DL) |

- Three exercises. **No overhead press.** **No substitution footnote in or under the box** (p.58).

Cluster rules (p.59):
> "The cluster is minimalist, because Fighter HT is designed for those with a limited amount of time.
> More volume needs to be squeezed into less training time. Too many exercises make the lifting sessions
> too long and impractical. If you want more exercises – use a different template, this isn't for you.
> Bodyweight finishers such as pull-ups/chins/dips et are fine." (p.59)

- **Adding exercises to the cluster is refused** (p.59); **bodyweight finishers (pull-ups/chins/dips) are
  permitted** (p.59). *(Note this sits against the General Mass Miscellaneous rule on p.64: "Avoid extra
  work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight work, nothing." —
  see Ambiguities.)*
- `et` appears in the book text as printed (p.59); presumably `etc`, transcribed as printed.

### FIGHTER HT EXERCISE SCHEDULE (p.59, image `p059_1.png`)

Text-layer heading above the image: **FIGHTER HT** (p.59).

| Week | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1 to 3 | BP<br>SQ |  |  | BP<br>SQ |  | DL |  |

- The row label is exactly `1 to 3` (p.59).
- Days 2, 3, 5 and 7 are **empty** (p.59).
- Column headers are written without spaces: `Day1` … `Day7` (p.59).

Caption beneath (p.59):
> "Squats and bench are done twice a week. Deadlifts are performed solo on a separate day." (p.59)

- **Three lifting sessions per week** (p.59; also stated as "3-days" for Fighter-HT elsewhere in the
  book).

### FIGHTER HT programming grid (p.60, image `p060_1.png`)

Text-layer heading above the image: **FIGHTER HT** (p.60).
Caption below: "The above table is Sets x Reps/percentage of 1 Rep Maximum." (p.60)

| Week | Day1 | Day2 | Day3 | Day4 | Day5 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1 | 5 x 8<br>60% |  |  | 5 x 8<br>60% |  | 5 x 8<br>60% |  |
| 2 | 5 x 6<br>70% |  |  | 5 x 6<br>70% |  | 5 x 5<br>70% |  |
| 3 | 5 x 3<br>80%<br>**SQ+**<br>**or**<br>**AMRAP** |  |  | 5 x 3<br>80%<br>**BP+**<br>**or**<br>**AMRAP** |  | 1 x 3<br>80%<br>**&**<br>**DL+**<br>**or**<br>**10x3**<br>**80%** |  |

Cell-level notes (all p.60):
- Fighter HT uses a **flat `5 x`** set count in every cell — not Gladiator's `4-5 x`.
- **Week 2 / Day 6 (deadlift) is `5 x 5`, not `5 x 6`** — it differs from the Day 1 and Day 4 cells in the
  same week, which are `5 x 6`. Transcribed exactly as printed; see Ambiguities.
- Week 3 / Day 6 (deadlift) is written on multiple lines as: `1 x 3`, `80%`, `&`, `DL+`, `or`, `10x3`,
  `80%`. The `10x3` is printed without spaces around the `x`, unlike every other cell.
- The `SQ+`, `BP+`, `&`, `DL+`, `or`, `AMRAP`, `10x3` and the trailing `80%` in the week-3 Day 6 cell are
  **bold** in the book image.
- Days 2, 3, 5 and 7 columns are empty in all three week rows.
- One prescription per day cell, applied to **both** lifts on the two-lift days (confirmed by the p.61
  worked example: "The squat is performed for 5 sets of 3. Move on to the bench press.").

### EXECUTION (pp. 60–61)

> "The above table is Sets x Reps/percentage of 1 Rep Maximum. Perform all sets of each exercise before
> moving on to the next. Rest for 2 minutes or longer in between sets. The objective is to complete all
> reps of each set while minimizing muscle failure. A little fatigue on the last few reps is acceptable,
> but if you're failing completely well before finishing the set then use a longer rest interval; 5
> minutes or longer. If you're still failing, then lower your 1 rep maximum by 10% and recalculate."
> (p.60)

Failure-handling ladder for Fighter HT, in order (p.60):
1. Rest **2 minutes or longer** between sets.
2. Failing completely well before finishing the set → rest **5 minutes or longer**.
3. Still failing → **lower the 1RM by 10% and recalculate**.

### Schedule shifting rules (pp. 60–61) — exact quotes

> "If your schedule requires it, Day 4 session can be moved to Day 3, and Day 6 to Day 5. The only rule is
> to have at least 48 hours off between Session#1 and 2." (p.60)

> "You can deadlift the day after session#2 if you wish, but the best practice is to have a buffer day in
> between." (p.61)

Rules an app would implement:
- Day 4 → may move to Day 3; Day 6 → may move to Day 5 (p.60).
- Hard rule: **at least 48 hours off between Session #1 and Session #2** (p.60).
- Deadlift day may fall the day after session #2, but a **buffer day is best practice** (author's own
  recommendation, p.61).

### Week 3 intensity techniques (p.61)

> "During Week 3, AMRAP or Peak with the chosen exercise:" (p.61)

**AMRAP** (p.61):
> "AMRAP on the last set of the prescribed exercise. For example, Week 3 Day 1 that would be squat. On the
> last set of 3, keep going and see how many extra reps you can do. Don't go nuts and injure yourself.
> Leave a rep or two in the tank for safety, especially if you don't have a spotter. On Day 4, the AMRAP
> exercise is the bench press. The squat is performed for 5 sets of 3. Move on to the bench press. Do
> AMRAP on set 5 of the bench-press. I don't recommend AMRAP with the deadlift." (p.61)

- AMRAP is on the **last (5th) set** (p.61).
- **AMRAP not recommended for the deadlift** (author's own recommendation, p.61).

**PEAKING** (p.61):
> "DL+/SQ+/BP+: Peaking technique that can be used instead of AMRAP. Work up to heavy triples, doubles, or
> singles with the chosen exercise." (p.61)

> "When peaking, do only ONE work set x 3 reps with the prescribed working weight (80%RM) for the selected
> exercise. Then add weight to the bar. Increments of 5 to 10lbs. Rest for 3 to 5 minutes and try a
> triple, double, or single. Then add a little more. Rest up and try another double or single. Keep
> working your way up using sets of 1 to 3 reps until you can't or until you want to stop. Do as much or
> as little of this extra work as you'd like. For example, Week 6/Day 4 the selected exercise is the bench
> press. Squat as per the standard programming (5 sets of 3/80%). After, move on to the bench press.
> Perform one work set of 3 reps at 80%. After the work set is out of the way begin working up to heavier
> triples, doubles, and singles." (p.61)

- **ONE work set × 3 reps @ 80%RM**, replacing the programmed `5 x 3`, then ramp in **5 to 10lb**
  increments with **3 to 5 minutes** rest, using sets of **1 to 3 reps** (p.61).
- The example says **"Week 6/Day 4"** although the Fighter HT grid only has weeks 1–3 (p.61 vs p.60) — see
  Ambiguities.

**Deadlift 10 x 3 option** (p.61):
> "Deadlift 10 x 3 Option: An alternative to peaking is high volume deadlifting. Perform 10 sets x 3 reps
> with the prescribed load. Adjust the weight a little lower or higher as desired. Rest as needed in
> between sets." (p.61)

**Time/energy escape hatch** (p.61):
> "On the days you're strapped for time or don't have the juice, do the lifts as programmed without
> peaking or AMRAP." (p.61)

### PROGRESSION (p.62)

> "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises
> you struggled with - use the same numbers for the next block." (p.62)

---

## GENERAL MASS MISCELLANEOUS (pp. 63–66)

Chapter heading as printed: **GENERAL MASS MISCELLANEOUS** (p.63). This chapter is prose only — no
tables. The single image in it is a pull-quote box on p.66.

### Testing 1RMs before a block (p.63)

> "Calculate 1 rep maximums for all exercises in your cluster prior to beginning. You can do your testing
> in one session or over two. After testing take two or three days off before starting the block. Don't
> get OCD – a 2-3 rep maximum to calculate a 1RM is fine. But DO test. Don't guess." (p.63)

Rules an app would implement (p.63):
- A 1RM is required for **every exercise in the cluster** before the block starts.
- Testing may be done in **one session or over two**.
- **Two or three days off after testing**, before the block begins.
- A **2–3 rep maximum used to calculate a 1RM is acceptable** — the book does not name a formula here.
- Guessing maxes is explicitly forbidden.

### Session structure and exercise order (p.63)

> "Lift two, three, or four times a week as per your template. Perform all the sets of one exercise
> completely before moving on to the next. Optionally, you can circuit-train or stack a couple exercises
> together. So long as you rest adequately in between sets regardless of exercise. I do this with squats
> and weighted pull-ups. I do a set of squats, rest for a few minutes and then hit WPU's. After a set of
> WPUs I rest for another 2-3 minutes and back to squats. If you've got the right set-up you can do your
> pull-ups right in the squat rack." (p.63)

> "Choose whatever order of exercise you like. I personally like starting with BP because it serves as a
> nice warm-up and has minimal impact on the remainder of my training, whereas doing Squats first
> sometimes results in a little more fatigue that carries over to the rest of the session. Ultimately it
> doesn't matter – it's entirely up to you. Just get the prescribed work done." (p.63)

> "The session objective is to complete all reps and all sets." (p.63)

- Exercise order is **free**; the author's personal preference (explicitly not a rule) is to **start with
  bench press** (p.63).
- Straight sets are the default; **circuit/stacking is an explicitly allowed option** provided rest is
  adequate (p.63).

### Rest intervals (pp. 63–64)

> "I want to clarify rest intervals here. This isn't Operator template or Tactical Barbell I, the Golden
> Rule is NOT in effect for Mass Protocol. Rule of thumb; when you think you've recovered enough to hit
> the assigned reps of the upcoming set – you're good to go. That said, for most people that's going to
> be 2 to 5 minutes in between sets. Longer if needed. 3-5 minutes is usually the sweet spot for heavier
> sessions. Alternatively, you can rest slightly less during lighter sessions if you wish. However, if
> you're consistently not meeting the reps – increase the rest interval and/or lower the weight. When 8
> reps are called for, complete 8 reps. It's okay to struggle on the last couple reps, so long as you
> complete them. General Mass blocks should be performed at a relaxed/comfortable pace." (pp.63–64)

Rules an app would implement (pp.63–64):
- **The Golden Rule (TB I) does not apply to Mass Protocol.**
- Default rest: **2 to 5 minutes**, longer if needed.
- **3–5 minutes** for heavier sessions; slightly less permitted on lighter sessions.
- Consistently missing reps → **increase rest and/or lower the weight**.

### PROGRESSION from block to block (p.64)

> "PROGRESSION from block to block is where the magic happens. For some, General block might feel a little
> light in the beginning, might feel like you're not doing enough work because the loads are lower than
> what you're used to. That's normal and desirable. The reason we're starting light is to build work
> capacity – to start getting used to the volume and rep range required to pack on muscle." (p.64)

> "The combination of moderate/heavy weight + high volume + frequency is POWERFUL for gaining muscle mass.
> The problem with trying to implement the formula right away is lack of work capacity. Most will easily
> have the strength to deal with the prescribed loads – but maybe not the capacity to handle the volume
> or frequency. Starting light is how we develop that capacity. Your very first block is like practice +
> work-capacity-building with lighter weight. After that it'll be a smoother transition to the next,
> heavier block. If you can't leave your ego out of it and go too heavy, you'll struggle mid-block and hit
> a wall. Or you might get through that first block, but upcoming blocks with progressively heavier loads
> will seem like a herculean task." (p.64)

> "When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast. Whatever you
> do, DON'T start too heavy or overestimate your 1RMs." (p.64)

### Pull-quote box (p.66, image `p066_1.png`)

White text on dark background, verbatim:

> "Most of you will easily have the strength to deal with the prescribed loads. But some of you might find
> the volume & frequency challenging. Starting light is how we develop the work capacity to handle that
> increased volume & frequency." (p.66)

### Extra work restrictions (pp. 64–65)

> "Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight work,
> nothing. If you have surplus energy to burn – add extra sets to your main lifts." (pp.64–65)

> "You can add some core work if desired, bodyweight-based ab and lower back stuff. Hanging leg raises,
> hyperextensions, face-pulls, ab roller, like that." (p.65)

Rules an app would implement (pp.64–65):
- **No accessory/isolation/bodyweight work during General Mass.**
- Surplus energy → **add extra sets to the main lifts** (the only sanctioned outlet).
- **Core work is permitted**: bodyweight ab and lower-back work — hanging leg raises, hyperextensions,
  face-pulls, ab roller.

### Don't compare to Operator / TB I (p.65)

> "You might be subconsciously comparing the protocols in this book to Operator/or other Tactical Barbell
> I templates. Don't." (p.65)

> "The templates in TB I were designed to be brief and feel relatively effortless to allow for
> conditioning and operations. Those templates are performance oriented with a focus on improving
> maximal-strength, not muscle size. Hypertrophy is a side-effect of those templates. Maximal-strength can
> be trained with less volume and minimal fatigue, unlike hypertrophy." (p.65)

> "Hypertrophy/mass-building is demanding. It will require effort. It will cause fatigue. You will be a
> little more tired through the week. You probably won't be able to just pick up and do Apex Hills after a
> lifting session. The templates in TB I may have spoiled you by giving you significant improvement with
> little discomfort. It's time to switch gears for Mass Protocol." (p.65)

> "If you've been training maximal-strength style with a 5-rep ceiling for a while, you're likely going to
> feel your first few mass building sessions. You might be surprised at just how challenging sets of 8
> (particularly for squats) can be, even with only 60-70% of your 1RM." (p.65)

> "With Operator template you can step out of the gym and immediately hit the road for a hard tempo run or
> LISS. With the General Mass templates in this book, it isn't going to be quite as effortless. Don't be
> surprised or discouraged if you find yourself resting for 3-5 minutes or longer in between sets for the
> first little while. It's normal. Your work capacity will improve and in time it'll become comfortable."
> (p.65)

### Extra-curricular activity (p.66)

> "If you have extra-curricular activities in your life like sports or MMA, put them on hold if you can.
> If you can't, then understand they may suffer somewhat while you're running the protocols in this book.
> Life will be easier if you can temporarily drop demanding activities. A lot of this comes down to
> individual work capacity. Some won't be affected much, others may feel it until the body adjusts."
> (p.66)

> "One powerful antidote to this is food and sleep. Compensate by increasing your daily food intake, and
> ensuring you get regular decent sleep." (p.66)

Author's own recommendation (p.66): **put sports/MMA on hold if possible**; if not, accept degraded
performance; compensate with **more food and regular decent sleep**.

---

## Implementation notes (things an app must decide from these pages)

1. **Load basis is the 1 Rep Maximum, not a training max.** Both Gladiator and Fighter HT grids are
   labelled "Sets x Reps/Percentage of 1 rep maximum" (p.55, p.60), and the misc chapter says to
   "Calculate 1 rep maximums for all exercises in your cluster prior to beginning" (p.63). Neither
   chapter in this page range mentions a training max. *(The book does discuss a training max elsewhere,
   outside this page range — do not import that into General Mass without checking that chapter.)*
2. **Units are pounds.** Every load increment in this range is stated in lbs: "Increments of 5 to 10lbs"
   (p.56, p.61), "add 5-10lbs to 1RMs" (p.57, p.62). **No kilogram values appear anywhere in the book
   text.**
3. **There is NO weight-rounding rule in this book.** A search of the full text dump for
   `round / nearest / plate / kg / kilogram` returns nothing prescriptive: the only "plate" mention is
   rhetorical ("struggling with an empty bar or a couple of little plates", outside this scope). The book
   never says round up, round down, or round to the nearest plate. **Any rounding the app performs is an
   app-level invention and must be flagged as such.**
4. **Deload:** neither the Gladiator nor Fighter HT chapters, nor the Miscellaneous chapter, contain any
   deload or back-off week. The word "deload" does not appear anywhere in pp.54–66. (It appears only in
   the Specificity/Bridging material elsewhere in the book, outside this scope.)
5. **Block length in the grids is 3 weeks**, but the progression rule says "Every 3 to 6 weeks" (p.57,
   p.62) — see Ambiguities. (For cross-reference only, outside this scope: "General Mass comes in 3-week
   blocks" (p.19) and "Both General and Specificity consist of 3-week blocks" (p.40).)
6. **Progression is 1RM-based, per exercise, and conditional**: "add 5-10lbs to 1RMs. Recalculate and
   repeat. Don't force progression for exercises you struggled with - use the same numbers for the next
   block." (p.57, p.62). The +5–10lb bump is applied to the **1RM**, not the working weight, and can be
   withheld **per exercise**.
7. **Mid-block failure adjustment is also 1RM-based**: "lower your 1 rep maximum by 10% and recalculate"
   (p.56) and "lower your 1 rep maximum by 10% and recalculate" (p.60). Both Gladiator and Fighter HT
   state **10%**. *(Note: the Mass Template chapter, outside this scope, says "5-10%" — do not conflate.)*
8. **Both templates prescribe one set/rep/% per day, shared by both lifts scheduled that day.** There is
   no per-lift differentiation in either grid (p.55, p.60).
9. **AMRAP and Peaking are mutually exclusive and optional** ("Choose one or the other", p.56; "On days
   you don't have the time or energy for either, do straight sets across as per standard programming",
   p.57; same escape hatch p.61). An app must support a third state: the plain programmed sets.
10. **Peaking replaces the working sets**, it doesn't add to them: `4 x 3` → "ONE work set x 3 reps
    (80%RM)" for Gladiator (p.56); `5 x 3` → "one work set of 3 reps at 80%" for Fighter HT (p.61); and
    the Fighter HT grid itself prints the DL peaking day as `1 x 3 80%` (p.60).
11. **Fighter HT deadlift day has three mutually exclusive week-3 modes** per the grid: `1 x 3 80% & DL+`
    (peaking), or `10x3 80%` (high-volume option), with AMRAP explicitly not recommended (p.60, p.61).
12. **The rest interval differs by template**: Gladiator "2-3 minutes is sufficient" (p.55); Fighter HT
    "2 minutes or longer" (p.60); the global misc rule is "2 to 5 minutes… 3-5 minutes is usually the
    sweet spot for heavier sessions" (pp.63–64). All three coexist; see Ambiguities.
13. **Schedules are movable, not fixed** — Gladiator: "You don't have to stick to the above schedule
    exactly" (p.55); Fighter HT: "Day 4 session can be moved to Day 3, and Day 6 to Day 5" with a hard
    "at least 48 hours off between Session#1 and 2" (p.60).
14. **No exercise-substitution table or footnote exists for either cluster** in pp.54–62. The only
    latitude given is Gladiator's "change up the order or combination of exercises" (p.55) and Fighter
    HT's permission for bodyweight finishers (p.59).

---

## Ambiguities and choices

*Recorded, not resolved. Where the author states his own recommendation among options, it is marked
**[author's recommendation]**.*

1. **Set count `4-5 x` in Gladiator weeks 1–2 (p.55).** The grid says `4-5 x 8` and `4-5 x 6`; the prose
   says "4 to 5 sets of 8" (p.55). The book never says how to choose 4 vs 5, nor whether it should be
   consistent across the block. Week 3 is a flat `4 x 3`. **Not resolved by the book.**
2. **Fighter HT week 2 / Day 6 is `5 x 5`, while Day 1 and Day 4 of the same week are `5 x 6` (p.60).**
   The book gives no explanation for the deadlift day dropping a rep, and the prose never mentions it.
   Could be intentional (deadlift volume management) or a typo. **Transcribed as printed; unresolved.**
3. **"Week 6/Day 4" in the Fighter HT peaking example (p.61)** — the Fighter HT grid only runs weeks 1–3
   (p.60), and the surrounding text says "During Week 3, AMRAP or Peak" (p.61). Likely a typo for Week 3,
   or a leftover from a longer block. **Unresolved.**
4. **Block length: 3 weeks vs "every 3 to 6 weeks" (p.55/p.60 grids vs p.57/p.62 progression).** The grids
   define 3 weeks; progression says add to 1RMs "Every 3 to 6 weeks". The book does not say whether a
   6-week block means running the 3-week grid twice with the same maxes, or something else. **Unresolved
   in this page range.**
5. **Gladiator week 3 / Day 5 (DL) shows `DL+` with no "or AMRAP" (p.55)**, and the prose says "I don't
   recommend AMRAP with the deadlift as it's too easy to injure yourself when form deteriorates" (p.56).
   It is not stated whether DL+ peaking is therefore *mandatory* on that day or still optional against
   plain `4 x 3`. The p.57 escape hatch ("do straight sets across as per standard programming") implies
   optional. **[author's recommendation]: no AMRAP on deadlifts.** Whether peaking is compulsory:
   **unresolved.**
6. **Fighter HT bodyweight finishers (p.59) vs the General Mass ban on bodyweight work (p.64).** p.59:
   "Bodyweight finishers such as pull-ups/chins/dips et are fine." p.64: "Avoid extra work in the gym
   during General. No bicep curls, no donkey calf raises, no bodyweight work, nothing." The Miscellaneous
   chapter is headed "GENERAL MASS MISCELLANEOUS" (p.63) and Fighter HT is a General Mass template.
   **Direct contradiction; unresolved by the book.**
7. **Rest interval, three different figures** — Gladiator "2-3 minutes is sufficient" for most (p.55);
   Fighter HT "2 minutes or longer" (p.60); Miscellaneous "2 to 5 minutes… 3-5 minutes is usually the
   sweet spot for heavier sessions" (pp.63–64), plus the governing rule of thumb "when you think you've
   recovered enough to hit the assigned reps of the upcoming set – you're good to go" (p.63). Which value
   an app should display per template is **not settled by the book**.
8. **1RM estimation formula (p.63).** "a 2-3 rep maximum to calculate a 1RM is fine" — the book does not
   name a formula or table on this page. **Unresolved here.**
9. **What "recalculate" means after a 10% 1RM reduction mid-block (p.56, p.60)** — whether the reduced 1RM
   applies to that exercise only, from the next session, or for the rest of the block, is not stated.
   **Unresolved.**
10. **Peaking ramp is entirely discretionary** — "Do as much or as little of this extra work as you'd
    like" (p.56, p.61), "Keep working your way up until you can't or until you want to stop" (p.56). The
    number of ramp sets and the top load are the lifter's choice; an app cannot prescribe them.
11. **AMRAP stopping point** — Gladiator: "keep going until you can't. Stop one or two reps short of
    failure if you don't have a spotter" (p.56). Fighter HT: "Leave a rep or two in the tank for safety,
    especially if you don't have a spotter" (p.61). Whether the spotter caveat is a hard rule or advice
    differs slightly in wording between the two chapters. **[author's recommendation]: leave 1–2 reps in
    reserve without a spotter.**
12. **Gladiator "change up the order or combination of exercises" (p.55)** — it is not stated whether this
    permits substituting *different* exercises for the four cluster lifts, or only reordering/re-pairing
    the same four. **Unresolved.**
13. **Fighter HT `10x3` deadlift option load (p.61)** — "Perform 10 sets x 3 reps with the prescribed
    load. Adjust the weight a little lower or higher as desired." The grid prints `10x3 80%` (p.60), but
    the prose explicitly permits adjusting it. **Adjustment amount unspecified.**
14. **Circuit/stacking option (p.63)** — "Optionally, you can circuit-train or stack a couple exercises
    together." Permitted but with no structure given beyond "rest adequately in between sets regardless
    of exercise". **[author's personal practice, not a prescription]: squats stacked with weighted
    pull-ups.**
15. **Exercise order (p.63)** — explicitly free: "Ultimately it doesn't matter – it's entirely up to you."
    **[author's personal preference]: start with bench press.** Note this sits alongside the
    Gladiator/Fighter HT worked examples, which describe doing the *other* lift first and moving on to the
    AMRAP/peaking lift last (p.56, p.61).
16. **Extra sets as the outlet for surplus energy (p.65)** — "add extra sets to your main lifts". How
    many, and at what load, is not stated. **Unresolved.**
17. **No rounding rule at all.** See Implementation note 3. The book gives percentages of a 1RM in pounds
    and never states how to land on a loadable barbell weight. **Unresolved by the book — an app decision
    that must be documented as a deviation.**
18. **Testing cadence between blocks (p.63 vs p.57/p.62).** p.63 requires testing before beginning; p.57
    and p.62 say to add 5–10lbs to the 1RMs and recalculate rather than retest. Whether a re-test is ever
    required between consecutive General Mass blocks is **not stated in this page range**.


---

# 05 — Specificity: overview & Alpha (PDF pp. 67–79)

> Scope: PDF pages 67–79 of `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
> All page references below are **PDF page numbers of that file** (`(p.74)` = PDF page 74).
> Every table in this range is an embedded image; all tables below were transcribed visually from
> `docs/MASS/images/pNNN_N.png` and are reproduced cell for cell, including blank cells.

---

## SPECIFICITY (p.67)

Chapter opens with an epigraph attributed to Arnold (p.67):

> "The last three or four reps is what makes the muscles grow. This area of pain divides a champion from someone who is not a champion. That's what most people lack, having the guts to go on and just say they'll go through the pain no matter what happens." — Arnold (p.67)

### What Specificity is

- "Specificity is finishing school. During General Mass you swapped out your Miata for a Humvee. Now it's time to work on the bells and whistles, install that lift kit, bush bar, swap out the tires, or do whatever it is people do with their vehicles." (p.67)
- "Specificity can be used anytime you feel the need for some targeted hypertrophy work. It's a convenient template that you can move around and insert in your training year for varying lengths of time." (p.67)

### When it is run

- "For the purposes of this protocol, Specificity works best following some General Mass work." (p.67)
  - Note the hedge: *works best following* — it is a recommendation, not a hard gate. Specificity "can be used anytime" (p.67).

### Block length — CONFIRMED (p.67)

> "Specificity blocks are three weeks in length. You can run one or more blocks depending on training objectives." (p.67)

**Implementation consequence:** block length is fixed at **3 weeks** (p.67); the *number* of blocks is user-chosen ("one or more … depending on training objectives", p.67). No deload week is described anywhere in pp.67–79.

---

## ALPHA/BRAVO (pp.68–69)

### The distinction (p.68)

> "Specificity comes in two versions; Alpha – a mixed maximal-strength/hypertrophy model, and Bravo – which is pure conventional hypertrophy." (p.68)

**ALPHA (p.68):**
- "ALPHA is a 50/50 mix of maximal-strength and hypertrophy training. Four lifting sessions per week. Two sessions are maximal-strength (MS) based. The other two consist of classical hypertrophy (H) work. Both types of session will have their own sets of rules." (p.68)
- "Think of it like running two programs simultaneously. One program for strength development, the other for accessory work and fine-tuning your aesthetics." (p.68)
- "Both training styles support and enhance each other when the objective is optimizing muscle mass." (p.68)
- "It's nice to include Alpha when conducting long hypertrophy phases. Alpha keeps an element of heavy maximal-strength style training in the mix when you're spending months and months on lighter/higher volume hypertrophy work." (p.68)

Rationale given for keeping MS in the mix (p.68):
- "Maximal-strength training will give your muscles that hard dense look along with the ability to generate force. That greater strength translates into heavier loads when it comes to hypertrophy training." (p.68)
- "Heavier loads result in bigger muscles when hypertrophy techniques are employed. More growth is triggered if your 60%RM is 200lbs instead of 50lbs." (p.68)
- "Hypertrophy training maximizes size through the increased recruitment of muscle fibers and sarcoplasm. In turn, that bigger muscle allows for more myofibril/maximal-strength development…which allows for more hypertrophy….and so on." (p.68)
- "Bit of an oversimplification, but if you'd like to learn more, research material by the likes of Verkhoshansky, Bompa, etc." (p.68)

**BRAVO (p.68):**
- "BRAVO is four days of nothing but hypertrophy-specific training. The focus is on increased volume while targeting specific muscle groups with loads ranging from 60%-75%RM." (p.68)

> Note for units/percentages: the Alpha rationale uses **lbs** ("200lbs instead of 50lbs", p.68). The whole chapter is written in **pounds**; no kilogram figures appear in pp.67–79.

### Choosing between them — every factor the book gives (pp.68–69)

The book explicitly **declines to pick**. Recorded faithfully:

1. "Both templates will get you to the top of the mountain. It's a matter of preference and what your body responds to (or needs) at any given point in time." (pp.68–69, sentence spans the page break)
2. In favour of Alpha: "Alpha allows you to keep an element of maximal-strength training in the mix and creates a good blend of muscle size and density. It's also nice having the option to maintain/progress maximal-strength while simultaneously doing isolation/supplementary work." (p.69)
3. In favour of Bravo: "That said, many clients respond well to a clean distinction between maximal-strength and hypertrophy phases. Dropping MS completely for a few blocks is a good way to prevent stagnation. It allows you to focus 100% on hypertrophy and gives you more time to build up neglected areas/work on specific muscle groups. If this sounds appealing, then Bravo might be the way to go for you." (p.69)
4. Training-age factor — **novice → Alpha**: "Another thing to consider when deciding between Alpha and Bravo is your personal situation. If you've just started weight training and haven't developed a solid foundation of strength – Alpha might be the suitable choice." (p.69)
5. Training-age factor — **long-time MS lifter → Bravo**: "On the other hand, if you've been training for many years, mostly maximal-strength style based around the big three – then complete dedication to hypertrophy/isolation movements might be exactly what you need to break you out of a plateau or stimulate new growth." (p.69)
6. Explicit refusal to prescribe: "Either way – what you do for one or two blocks isn't going to make much of a difference in the long run. Pick one, the other, or even both, and you'll eventually get an intuitive feel for which version you need at any given time as you become more in tune with your body/training. Sometimes Alpha will be the better choice, at other times it'll be Bravo. Don't get OCD over it. It's consistency over the years that matter – not over a block or two. Both templates will get you there." (p.69)

**Implementation consequence:** Alpha vs Bravo is a **user choice with no algorithmic rule**. The book gives heuristics (items 4 and 5) but qualifies them with "might be". An app must not auto-select; at most it may surface the two heuristics as guidance.

---

## SPECIFICITY ALPHA (pp.70–79)

### Weekly structure and session parameters (p.70)

> "Training is conducted four days a week. Two days are devoted to maximal-strength training and two to hypertrophy." (p.70)

> "Maximal-strength (MS) days consist of two to three compound exercises performed for 3-5 repetitions with loads varying from 75-85%RM." (p.70)

> "Hypertrophy (H) days consist of 6-12 exercises performed for 8-12 repetitions with 60-75%RM. Exercises can be a mix of compound/isolation movements." (p.70)

| Session type | Exercises | Reps | Load |
|---|---|---|---|
| MS (p.70) | two to three compound exercises | 3-5 repetitions | 75-85%RM |
| H (p.70) | 6-12 exercises, mix of compound/isolation | 8-12 repetitions | 60-75%RM |

#### Week outline table — image `p070_1.png` (p.70)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| MS | H1 |  | MS | H2 |  |  |

(Cells for Day 3, Day 6 and Day 7 are blank in the original.)

### CLUSTERS (p.70)

> "Alpha consists of two clusters; maximal-strength (MS) and hypertrophy (H)." (p.70)

#### MS CLUSTERS — "Standard Maximal-Strength Cluster:" (p.70 caption)

Image `p071_1.png`:

| MS |
|---|
| Bench Press |
| Squat |
| Deadlift |

#### ALTERNATIVE MAXIMAL-STRENGTH CLUSTERS (p.71)

Image `p071_2.png` — a 2×2 grid of four alternative clusters, transcribed with the original left-to-right, top-to-bottom layout preserved:

| (top-left) | (top-right) |
|---|---|
| Clean & Press<br>Front Squat<br>Weighted Pull-up | Bench Press<br>Front Squat<br>Trap Bar Deadlift |

| (bottom-left) | (bottom-right) |
|---|---|
| Bench Press<br>Squat<br>Power Clean | Overhead Press<br>Squat<br>Deadlift |

The four alternative clusters, listed plainly:

1. Clean & Press / Front Squat / Weighted Pull-up
2. Bench Press / Front Squat / Trap Bar Deadlift
3. Bench Press / Squat / Power Clean
4. Overhead Press / Squat / Deadlift

(The image has no column or row headers — the four cells are unlabelled and unnumbered.)

**Build-your-own rule of thumb (p.71):**

> "You can create your own MS cluster. General rule of thumb when creating your own is to include a press, a pull, and legs." (p.71)

**MS objective and loading (p.71):**

> "The objective of MS training during Alpha is to improve/maintain the domain of maximal-strength in support of muscular hypertrophy." (p.71)

> "MS sessions consist of lifting with loads ranging from 75%-85%RM. Volume is relatively low, 1-3 sets of 3-5 reps." (p.71)

#### HYPERTROPHY CLUSTER (pp.71–72)

> "The hypertrophy (H) cluster consists of 6 to 12 exercises. Those 6-12 exercises are divided in half. One half performed on one day (H1), the other half performed on another (H2)." (pp.71–72, sentence spans the page break)

> "You can create your own H cluster or choose from several we've provided. This is where you get input and can include all your favorite exercises while targeting areas of weakness." (p.72)

Objectives (p.72), reproduced as the book's bullets:

- "Increase muscle size" (p.72)
- "Use accessory/isolation training to improve areas of weakness for aesthetic and functional purposes." (p.72)

> "H sessions can be a mix of isolation and compound exercises. Intensity is light to moderate at 60% -75%RM. Volume is medium to high, 3-4 sets of 8-10 reps over 6 to 10 exercises. See SAMPLE H CLUSTERS at the end of the chapter." (p.72)

> The sample H clusters themselves are "at the end of the chapter" (p.72) and fall **outside pages 67–79** — not transcribed here.

### SPECIFICITY (ALPHA) — week outline with cluster placement (p.72)

Legend given in the text (p.72):

- "MS = Maximal Strength Session" (p.72)
- "H1 = Hypertrophy Session #1" (p.72)
- "H2 = Hypertrophy Session #2" (p.72)

Image `p072_1.png`:

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| **MS**<br>BP<br>SQ<br>DL | **H1**<br>As per Cluster |  | **MS**<br>BP<br>SQ<br>DL | **H2:**<br>As per Cluster |  |  |

(Original formatting preserved: "MS", "H1" and "H2:" are bold in the image; only "H2" carries a trailing colon. Day 3, 6 and 7 are blank.)

### Scheduling freedom and fatigue rules (pp.72–73)

> "The above is an outline of what your training week is going to look like. You can push H2 to Day 6 if you wish. Avoid scheduling a H session the day before MS training. Rule of thumb is to remain as fresh as possible for MS days, whereas some residual fatigue for H training is a good thing." (pp.72–73, sentence spans the page break)

> "By following the principles of MS training we'll minimize post-workout soreness and muscle fatigue. On the other hand, expect it after H sessions. Beyond that, muscle soreness or fatigue doesn't concern us when using this protocol." (p.73)

> "Chances are you will feel some soreness and DOMS throughout the week – mostly because of the H sessions. Don't pay it much attention. If it's bothering you, take a little extra time to warm-up and stretch prior to training. Over time it'll diminish, and you won't notice it as much." (p.73)

**Implementation consequences (pp.72–73):**
- Default day map: **Day 1 = MS, Day 2 = H1, Day 4 = MS, Day 5 = H2** (images `p070_1.png`, `p072_1.png`).
- Permitted variation: **H2 may be moved to Day 6** (p.73).
- Hard constraint: **no H session the day before an MS day** (p.73). With the default layout that is already satisfied (Day 3 and Day 6/7 rest before MS on Day 1 and Day 4).

---

## SPECIFICITY (ALPHA) — the programming grid (p.74)

Caption text on p.74:

> "MS days the loads are heavier with lower overall volume. H days call for a higher rep range with lighter/moderate weight. The above is Sets x Reps/Percentage of 1 Rep Max." (p.74)

Image `p074_1.png`, transcribed cell for cell (line breaks inside cells shown with `<br>`):

| Week | Day1<br>MS | Day2<br>H1 | Day3 | Day4<br>MS | Day5<br>H2 | Day6 | Day7 |
|---|---|---|---|---|---|---|---|
| 1 | 3 x 6<br>75%<br>DL: 1 x 5 | 4 x 12<br>65% |  | 3 x 6<br>75%<br>DL: 1x5 | 4 x 12<br>65% |  |  |
| 2 | 3 x 5<br>80%<br>DL: 1 x 4 | 4 x 10<br>70% |  | 3 x 5<br>80%<br>DL: 1 x 4 | 4 x 10<br>70% |  |  |
| 3 | 3 x 3<br>85%<br>DL: 1x3 | 4 x 8<br>75% |  | 3 x 3<br>85%<br>DL: 1x3 | 4 x 8<br>75% |  |  |

Formatting notes preserved from the image (p.74):
- Column headers are written without a space: "Day1", "Day2", … "Day7"; the MS/H1/H2 label sits on a second line inside the header cell.
- The deadlift entry is written inconsistently in the original: **"DL: 1 x 5"** (Wk1 Day1), **"DL: 1x5"** (Wk1 Day4), **"DL: 1 x 4"** (both Wk2 cells), **"DL: 1x3"** (both Wk3 cells). Spacing differences reproduced as printed.
- Percentages carry no "RM" suffix in this table (just "75%", "65%", …), unlike the sample table on p.78 which writes "75%RM".
- Day3, Day6 and Day7 cells are **blank** for all three weeks.

**Derived reading (from the image only, p.74):**

| Week | MS sets × reps | MS % | MS deadlift | H sets × reps | H % |
|---|---|---|---|---|---|
| 1 | 3 x 6 | 75% | 1 x 5 | 4 x 12 | 65% |
| 2 | 3 x 5 | 80% | 1 x 4 | 4 x 10 | 70% |
| 3 | 3 x 3 | 85% | 1 x 3 | 4 x 8 | 75% |

Both MS days in a week are identical, and both H days in a week are identical (p.74).

### DEADLIFTS (pp.74–75)

> "Note that DLs have their own programming. ONE work set per session twice a week. You also have the option to DL once OR twice per week (for 1 work set). For some intermediate/advanced lifters deadlifting twice a week can take a heavy toll in terms of CNS fatigue and recovery. For others it's no different than any other lift. Choose accordingly based on which camp you fall in." (pp.74–75, sentence spans the page break)

> "If using a cluster without conventional deadlifts program the third lift normally as per the other exercises." (p.75)

> "After a block or two – you have the option to increase deadlift sets if you like, only if you feel you can handle the workload. If multiple deadlift sets start screwing around with your recovery – drop back down to 1 or 2 works sets per week." (p.75)

**Implementation consequences (pp.74–75):**
- Default: **1 work set of DL per MS session, twice a week** (p.74).
- User option: **DL once OR twice per week**, still 1 work set (p.74).
- The DL rep count follows the week (5 / 4 / 3 per the p.74 grid), **not** the MS rep count (6 / 5 / 3).
- If the chosen MS cluster contains no conventional deadlift, the third lift is programmed with the **normal MS scheme**, i.e. 3 x 6 / 3 x 5 / 3 x 3 at 75/80/85% (p.75) — the DL exception does not apply.
- After "a block or two", extra DL sets are optional and self-regulated; the fallback stated is "1 or 2 works sets per week" [sic] (p.75).

---

## EXECUTION (MS) (p.75)

> "Maximal-strength sessions are performed on Day 1 and 4. Train both days as per the assigned set/rep/load scheme." (p.75)

**The book's worked example (p.75) — an exact fixture:**

> "Example, Week 1 Day 1 calls for 3 sets of 6 reps at 75% of your 1 rep maximum. Let's say your 1RMs are 300 and 100 for squat and bench press respectively. You'd squat 3 sets of 6 with 225lbs and bench 3 sets of 6 with 75lbs. Finish up with one work set of deadlifts (75%RM). Do warm-up sets as required." (p.75)

| Lift | 1RM | Week 1 Day 1 prescription | Load |
|---|---|---|---|
| Squat | 300 | 3 sets of 6 @ 75% | 225 lbs |
| Bench Press | 100 | 3 sets of 6 @ 75% | 75 lbs |
| Deadlift | — | one work set @ 75%RM | — |

- Confirms the p.74 grid: Week 1 = **3 x 6 @ 75%** (p.75).
- Confirms loads are computed as **% of 1RM** (not of a training max) (p.75).
- Both worked numbers divide exactly (300 × 0.75 = 225; 100 × 0.75 = 75), so **the book gives no rounding rule here** and the example cannot reveal one.
- Warm-up sets are unprogrammed: "Do warm-up sets as required." (p.75)

**Pacing, rest and failure (p.75):**

> "MS sessions should be slow paced and relaxed. Stay well rested, don't rush your sets, and avoid muscle failure. Rest for approximately 2-5 minutes. Longer if needed. For heavier days, 3 to 5 minutes is usually the sweet-spot." (p.75)

> "The mindset I want you to have: the last rep of your workout should be as crisp as the first. This may or may not happen – but that is the ideal to aim for." (p.75)

**Optional circuit style (p.75):**

> "If your training environment allows for it you can run your MS cluster circuit-style. Do one set of Bench, rest for 2-3 minutes and then do one set of Squats. Rest for a couple minutes and then Deadlift." (p.75)

---

## EXECUTION (H) (pp.75–76)

> "During MS it was stressed that you avoid muscle failure and complete all reps in a crisp fashion. On H days, you can get a little dirtier." (pp.75–76, sentence spans the page break)

> "Perform all sets of each exercise before moving on to the next. Rest for approximately 1 to 2 minutes between sets. Keep the rest intervals brief, avoid going over 2 minutes. Complete all reps of all sets. Muscle failure/struggle near the end of your set is acceptable and expected. If you fail before reaching the prescribed number of reps, take a short breather and make up the difference." (p.76)

**Implementation consequences (p.76):**
- H exercise order: **straight sets**, all sets of one exercise before moving on (p.76) — except when Super Setting is deliberately used (p.77).
- H rest: **1–2 minutes, hard ceiling "avoid going over 2 minutes"** (p.76).
- MS rest: **2–5 minutes**, "3 to 5 minutes … sweet-spot" on heavier days (p.75).
- Missed reps on H days are **made up** after a short breather rather than abandoned (p.76).

### H TACTICS (pp.76–77)

> "H is one of those rare times where occasionally annihilating yourself in training isn't a bad thing. Different rules for different objectives. I'm going to present a few optional tactics for H sessions. They're not mandatory, but if the feeling should strike, employ one or more of these techniques to squeeze more out of your session:" (p.76)

The book's numbered list (p.76):

1. Extra Sets
2. Failure
3. Super Set

**1. Extra Sets (p.76)**

> "Extra Sets is just that. Add 1, 2, 3, or more sets to one or more exercise in your cluster. If you're in the mood to really 'blast your pecs' then by all means do 5, 10, or a million sets. Don't stop at the prescribed amount. This is our favorite H tactic because extra volume contributes significantly to hypertrophy. As a bonus, work capacity improves as well. Work capacity is a high value domain for operational athletes." (p.76)

> **Author's own preference, recorded explicitly:** "This is our favorite H tactic" (p.76).

**2. Failure (pp.76–77)**

> "Failure: Go beyond the prescribed reps until you can't, on the last set of the exercise. The only thing that changes is how many reps you do – not the load. Don't start adding more weight to the bar than what's prescribed for the session. If you're supposed to be handling 65%RM, then don't add an extra pound to that number. Just do more reps." (p.76)

> "What this might look like; you're on your final set of barbell rows. You hit the prescribed 12 reps but feel like you have more left in the tank than you'd like. Instead of stopping at 12 keep going until you can't. Then rest for a few seconds and go some more. Then rest again and squeeze out a couple more sets of 1-3 reps. And again. Repeat as able. This is a decent choice if you don't have time to use the 'Extra Sets' method." (pp.76–77, sentence spans the page break)

**3. Super Set (p.77)**

> "Super Setting refers to pairing up two exercises and doing sets of each back to back with minimal/no rest. For example, let's say you have dumbbell shoulder press and dips in your H cluster. You'd do one set of DB shoulder press and then immediately do a set of dips. Then take your rest interval and repeat. A good choice when time is tight." (p.77)

**Hard constraint inside the tactics (p.76):** load is never increased beyond the prescribed percentage — "don't add an extra pound to that number" (p.76).

---

## PROGRESSION (p.77)

> "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises you struggled with - use the same numbers for the next block." (p.77)

**Implementation consequences (p.77):**
- Progression acts on the **1RM**, not on the working weight: add **5–10 lbs** to the 1RM, then recalculate all percentages.
- Cadence is **every 3 to 6 weeks** — i.e. every 1 to 2 Specificity blocks, since a block is 3 weeks (p.67). The book does not narrow this to a single number.
- Per-exercise stall rule: if you struggled with a lift, **do not add to that lift's 1RM** — "use the same numbers for the next block" (p.77). Progression is therefore **per-exercise**, not global.
- Units are **lbs** (p.77). No kilogram equivalent and **no rounding rule** are given anywhere in pp.67–79.
- No deload is prescribed in pp.67–79.

---

## SAMPLE SET-UP - ALPHA (pp.77–79)

> "To make sure we're still on the same page I'm going to run you through a sample Alpha set-up. First things first, we pick our two clusters – one for MS days and one for H." (p.77)

> "MS Cluster: we'll go with the recommended Bench Press/Squat/Deadlift cluster to keep it simple." (p.77)

> **Author's own recommendation, recorded explicitly:** the Bench Press / Squat / Deadlift cluster is described as "the recommended … cluster" (p.77), matching the "Standard Maximal-Strength Cluster" image (`p071_1.png`, p.70 caption).

> "H Cluster: this is for you to create. The guidelines are 6 to 12 exercises, which can be a mix of compound, isolation, accessory etc. For this example, let's use the following:" (p.77)

> "H1 - Overhead Press/Dips/Front Squat/Hanging Leg Raises" (p.77)
> "H2 – Barbell Row/Chins/Good Mornings/Dumbbell shrugs/Curls" (p.77)

> "Now we simply plug-and-play:" (p.77)

### Plug-and-play week — image `p078_1.png` (p.78)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| **MS:**<br>BP<br>SQ<br>DL | **H1:**<br>OHP<br>Dips<br>FSQ<br>HLR |  | **MS:**<br>BP<br>SQ<br>DL | **H2:**<br>BBR<br>Chins<br>GM<br>DB Shrug<br>Curls |  |  |

(Day 3, 6, 7 blank. Abbreviations as printed: BP, SQ, DL, OHP, FSQ, HLR, BBR, GM, DB Shrug.)

Note the sample H cluster has **9 exercises total** (4 on H1, 5 on H2) — an odd split, despite p.71 saying the 6–12 exercises "are divided in half" (p.71).

### "SPECIFICITY ALPHA – WEEK 1" — image `p078_2.png` (p.78)

Lead-in text (p.78):

> "Refer to the programming table to figure out how much weight to use, along with sets and reps:" (p.78)

Heading in the text layer above the image: **"SPECIFICITY ALPHA – WEEK 1"** (p.78)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| **MS:**<br>3 x 5*<br>75%RM<br>DL 1 x 5 | **H1:**<br>4 x 12<br>60%RM |  | **MS:**<br>3 x 5<br>75%RM<br>DL 1 x 5 | **H2:**<br>4 x 12<br>60%RM |  |  |

Footnote printed beneath the table (image `p078_2.png`, p.78):

> `*Sets x Reps`

(The asterisk is attached to "3 x 5*" in the Day 1 cell only. Day 3, 6, 7 blank. "DL 1 x 5" is written **without** a colon here, unlike "DL: 1 x 5" on p.74.)

> ⚠ **This sample table does not match the programming table on p.74.** See "Ambiguities and choices" below. Transcribed exactly as printed; nothing corrected.

### Bodyweight exercises — % of max REPS (pp.78–79)

> "Too easy. The H cluster used above is an example. You can create and choose any combination of exercises in line with your goals/priorities. Note that we have unweighted bodyweight exercises in our H cluster; dips, chins, and hanging leg raises. To calculate how many to do – use the percentage of your max REPS. If you can do a total of 10 chins, 60% of 10 is 6. So, on Day 5 you'd be doing 4 sets of 6 chins. Same method applies to the other bodyweight exercises." (pp.78–79, sentence spans the page break)

| Input | Value |
|---|---|
| Max reps (chins) | 10 (p.78) |
| Session % | 60% (p.78) |
| Computed reps | 60% of 10 = 6 (p.78) |
| Prescription on Day 5 | 4 sets of 6 chins (p.79) |

**Implementation consequences (pp.78–79):**
- For **unweighted bodyweight exercises**, the session percentage is applied to the lifter's **max reps**, and the *sets* count is taken unchanged from the programming table (4 sets in the example) (pp.78–79).
- The prescribed rep count from the table (12 in the sample) is **replaced** by the computed rep count (6), not multiplied by it (p.79).
- The example uses **60%** — matching the p.78 sample table (60%RM), not the p.74 programming table (65% in Week 1) (pp.74, 78).
- No rounding rule is given for cases where % × max reps is not a whole number (pp.78–79).

Chapter close (p.79):

> "Now that I've army-proofed everything and we're sort of on the same page let's move on to Bravo." (p.79)

---

## Design question: is Specificity Alpha fully prescribed, or is loading left to the user?

**Answer: the loading is fully prescribed. Only exercise selection is free.**

Evidence:

- Sets, reps and percentage are **fixed by week and day** in the programming table (`p074_1.png`, p.74), and the caption states plainly that the table "is Sets x Reps/Percentage of 1 Rep Max" (p.74).
- The user is told to look the numbers up, not to choose them: "Refer to the programming table to figure out how much weight to use, along with sets and reps" (p.78) and "Train both days as per the assigned set/rep/load scheme" (p.75).
- The weight itself is **computed**, not selected: the worked example derives 225 lbs and 75 lbs mechanically from 1RMs of 300 and 100 at 75% (p.75).
- Even inside the optional H tactics, the load is locked: "The only thing that changes is how many reps you do – not the load… don't add an extra pound to that number" (p.76).
- What *is* free: **which exercises** go in the clusters. "You can create your own MS cluster" (p.71); for the H cluster, "This is where you get input and can include all your favorite exercises while targeting areas of weakness" (p.72); "You can create and choose any combination of exercises in line with your goals/priorities" (p.78).

**Determining a day's prescription** is therefore a pure lookup (pp.74, 75, 78):
`(week 1–3) × (day type MS or H)` → sets × reps × %1RM, plus a deadlift override on MS days, plus a bodyweight-exercise rule that converts % to reps off max reps.

Bounded user latitude that an app must still expose (all cited above): H2 may move to Day 6 (p.73); deadlift 1× or 2× per week, and optionally more DL sets after a block or two (pp.74–75); optional H tactics — extra sets, failure, super sets (pp.76–77); progression cadence 3–6 weeks and increment 5–10 lbs (p.77); circuit-style MS if the gym allows (p.75).

---

## Implementation notes summary (pp.67–79)

| Item | Value | Page |
|---|---|---|
| Block length | 3 weeks, run one or more blocks | p.67 |
| Days per week | 4 lifting sessions | pp.68, 70 |
| Default day map | D1 MS, D2 H1, D4 MS, D5 H2 | pp.70, 72 (images `p070_1.png`, `p072_1.png`) |
| Permitted day shift | H2 → Day 6 | p.73 |
| Scheduling constraint | No H session the day before an MS day | p.73 |
| MS exercises | 2–3 compound | p.70 |
| MS build-your-own rule | include "a press, a pull, and legs" | p.71 |
| MS load band | 75–85%RM | pp.70, 71 |
| MS volume (prose) | 1–3 sets of 3–5 reps | p.71 |
| MS volume (table) | 3 x 6 / 3 x 5 / 3 x 3 by week | p.74 |
| MS deadlift | 1 work set per MS session; 1 x 5 / 1 x 4 / 1 x 3 by week | p.74 |
| H exercises | 6–12 (prose p.70/71); "6 to 10" (prose p.72) | pp.70, 71, 72 |
| H split | halves across H1 and H2 | pp.71–72 |
| H load band | 60–75%RM | pp.70, 72 |
| H volume (table) | 4 x 12 / 4 x 10 / 4 x 8 by week | p.74 |
| Loading basis | **% of 1 Rep Max** (1RM). No training-max concept appears | pp.74, 75 |
| Training max (TM = 90% of 1RM) | **Does NOT appear anywhere in pp.67–79.** Nothing in this range mentions a training max, a 90% figure, or any 1RM discount. If TM exists it is defined outside this range | pp.67–79 |
| 1RM definition | Not defined in this range; used as a given input | pp.74, 75 |
| Units | **lbs** throughout (300/100/225/75 lbs, "5-10lbs"). No kg anywhere | pp.68, 75, 77 |
| Rounding rule for weight | **None given** anywhere in pp.67–79 | — |
| Rest — MS | ~2–5 min; "3 to 5 minutes" sweet-spot on heavier days; "Longer if needed" | p.75 |
| Rest — H | ~1–2 min; "avoid going over 2 minutes" | p.76 |
| Rest — super set | "minimal/no rest" between the paired exercises, then normal interval | p.77 |
| Tempo/pacing — MS | "slow paced and relaxed", avoid muscle failure, "last rep … as crisp as the first" | p.75 |
| Tempo/pacing — H | "you can get a little dirtier"; failure near the end of a set expected | pp.75–76 |
| H exercise order | All sets of an exercise before the next (straight sets) | p.76 |
| Missed reps on H | Short breather, "make up the difference" | p.76 |
| Progression | +5–10 lbs to 1RMs every 3–6 weeks, then recalculate | p.77 |
| Stall rule | Struggled lifts keep the same 1RM next block | p.77 |
| Deload | **None prescribed in this range** | — |
| Warm-ups | "Do warm-up sets as required" — unprogrammed | p.75 |
| Bodyweight exercises | % applied to **max reps**; sets unchanged | pp.78–79 |
| Exercise substitution | Free for both clusters, within the stated guidelines | pp.71, 72, 78 |

---

## Ambiguities and choices

Recorded, not resolved. Where the author states his own preference it is marked **[AUTHOR'S RECOMMENDATION]**.

### A. Contradictions between the book's own tables and prose

1. **The p.78 sample table contradicts the p.74 programming table.** For Week 1:
   - p.74 (`p074_1.png`): MS **3 x 6 @ 75%**, DL 1 x 5; H **4 x 12 @ 65%**.
   - p.78 (`p078_2.png`), headed "SPECIFICITY ALPHA – WEEK 1": MS **3 x 5 @ 75%RM**, DL 1 x 5; H **4 x 12 @ 60%RM**.
   - The MS reps (6 vs 5) and the H percentage (65% vs 60%) disagree. The prose worked example on p.75 sides with p.74 on reps: "Week 1 Day 1 calls for 3 sets of 6 reps at 75%" (p.75). The bodyweight-chins example on p.78 sides with p.78's own table on percentage: it uses **60%** of max reps (p.78). **Not resolved here.**

2. **MS rep range vs the MS table.** Prose says MS is "3-5 repetitions" (p.70) and "1-3 sets of 3-5 reps" (p.71), but the Week 1 row of the p.74 table prescribes **3 x 6** — 6 reps, outside the stated 3–5 band, and 3 sets, at the top of the stated 1–3 band. **Not resolved here.**

3. **H exercise count.** p.70 says H days consist of "6-12 exercises" and p.71 says the H cluster "consists of 6 to 12 exercises", but p.72 says "3-4 sets of 8-10 reps over 6 to 10 exercises". 6–12 vs 6–10. **Not resolved here.**

4. **H rep range.** p.70 says H days are "8-12 repetitions"; p.72 says "3-4 sets of 8-10 reps"; the p.74 table prescribes 12 / 10 / 8 reps across the three weeks. The 12-rep Week 1 value lies outside p.72's 8–10 statement. **Not resolved here.**

5. **H set count.** p.72 says "3-4 sets"; the p.74 table always prescribes **4** sets. **Not resolved here.**

6. **H cluster "divided in half".** p.71 says the 6–12 exercises "are divided in half", but the author's own sample splits 9 exercises as 4 (H1) and 5 (H2) (p.77, image `p078_1.png`). An exact halving is evidently not required. **Not resolved here.**

7. **Table image placement.** `p070_1.png` (the bare MS/H1/MS/H2 week grid) is extracted from p.70, while the legend that explains "MS =", "H1 =", "H2 =" and the sentence "The above is an outline of what your training week is going to look like" both sit on p.72 alongside `p072_1.png`. Both grids describe the same weekly layout and do not conflict; the only uncertainty is which caption belongs to which image. **Flagged, not resolved.**

### B. Choices the book explicitly leaves to the reader

| Choice | Options given | Book's stance |
|---|---|---|
| Alpha vs Bravo | Alpha (50/50 MS+H) or Bravo (pure hypertrophy) | Explicitly declines: "Pick one, the other, or even both… Don't get OCD over it" (p.69). Heuristics only: new lifter → Alpha "might be the suitable choice"; many years of MS training → Bravo "might be exactly what you need" (p.69) |
| Number of Specificity blocks | "one or more … depending on training objectives" | User's call (p.67) |
| MS cluster | The standard cluster, one of four alternatives (`p071_2.png`), or build your own | **[AUTHOR'S RECOMMENDATION]** Bench Press / Squat / Deadlift — "the recommended Bench Press/Squat/Deadlift cluster" (p.77); the standard cluster image (p.70/`p071_1.png`). Build-your-own must "include a press, a pull, and legs" (p.71) |
| H cluster contents | Create your own, or use the provided samples (samples live outside pp.67–79) | Free: "This is where you get input" (p.72); "any combination of exercises in line with your goals/priorities" (p.78). Constrained only by 6–12 exercises, split across H1/H2, mix of compound/isolation (pp.70–72) |
| Deadlift frequency | Once **or** twice per week, 1 work set either way | Explicitly declines to pick: "Choose accordingly based on which camp you fall in" (pp.74–75). Table default shows twice (p.74) |
| Extra deadlift sets | Optional after "a block or two" | Only "if you feel you can handle the workload"; back off to "1 or 2 works sets per week" if recovery suffers (p.75) |
| H2 day placement | Day 5 (default) or Day 6 | "You can push H2 to Day 6 if you wish" (p.73) |
| MS session format | Straight sets, or circuit-style | "If your training environment allows for it you can run your MS cluster circuit-style" (p.75) — permissive, no preference stated |
| H tactics | Extra Sets, Failure, Super Set | "They're not mandatory" (p.76). **[AUTHOR'S RECOMMENDATION]** Extra Sets: "This is our favorite H tactic because extra volume contributes significantly to hypertrophy" (p.76). Failure is "a decent choice if you don't have time to use the 'Extra Sets' method" (p.77); Super Set is "A good choice when time is tight" (p.77) |
| Progression cadence | Every 3 to 6 weeks | Range only, no single value (p.77) |
| Progression increment | 5–10 lbs added to the 1RM | Range only, no single value (p.77) |
| MS rest interval | ~2–5 min, "Longer if needed" | **[AUTHOR'S RECOMMENDATION]** "For heavier days, 3 to 5 minutes is usually the sweet-spot" (p.75) |
| H rest interval | ~1–2 min | Ceiling stated: "avoid going over 2 minutes" (p.76) |
| Warm-up sets | Unspecified | "Do warm-up sets as required" (p.75) |

### C. Silences with implementation consequences

- **No rounding rule for computed weights** anywhere in pp.67–79. The only worked example (300 → 225, 100 → 75; p.75) divides exactly and therefore reveals nothing about rounding, bar weight, plate availability or loadable increments.
- **No bar weight, plate math or per-side breakdown** is mentioned in pp.67–79.
- **No training max.** The task brief flags a possible "TM = 90% of 1RM" around p.89 — **that concept appears nowhere in pp.67–79.** Every load in this range is a straight percentage of the 1RM (pp.74, 75).
- **No definition of how the 1RM is established or tested** in this range; it is assumed known.
- **No kilogram figures and no unit-conversion guidance** in this range; everything is lbs (pp.68, 75, 77).
- **No deload week and no failure/stall protocol beyond p.77's** "Don't force progression for exercises you struggled with" — "struggled with" is not quantified (p.77).
- **No rounding rule for the bodyweight rep calculation** when % × max reps is fractional (pp.78–79).
- **No guidance on what percentage applies to bodyweight exercises on MS days** — the bodyweight rule is only given in the H context (pp.78–79), yet "Weighted Pull-up" appears in an alternative MS cluster (p.71, `p071_2.png`), which is weighted rather than unweighted.
- **Sample H clusters are referenced but printed "at the end of the chapter"** (p.72) — outside pp.67–79 and therefore not captured here.


---

# 06 — Specificity Bravo, Sample H Clusters & Bridge Week (PDF pp. 80–93)

Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
All page references below are **PDF page numbers of that exact file**, in the form `(p.89)`.

Covers: **Specificity Bravo** (pp.80–83), **Sample H Clusters** incl. A Word on Alpha, Camp Drvar, Keeny-Meeny, KM + Alpha, Eidolon, Classic, Bulgarian, Bulgarian + Alpha, Miscellaneous (pp.84–91), and **Bridge Week** (pp.92–93).

Images transcribed for this range (all read visually; **every table in this book is an embedded image, not text**):
`p080_1.png`, `p081_1.png`, `p081_2.png`, `p085_1.png`, `p086_1.png`, `p087_1.png`, `p087_2.png`, `p088_1.png`, `p088_2.png`, `p089_1.png`, `p091_1.png`, `p092_1.png`.
There are **no images on pp.82, 83, 84, 90 or 93** — those pages are prose only.

> **Note on rendering:** the PDF could not be rasterised in this environment (`pdftoppm` not installed), so cross-checking was done against the extracted table images plus the page-marked text dump `docs/MASS/mass-text.txt`. Every grid below is transcribed from the image files, cell for cell, not inferred from prose. Where the prose and the grid could be compared (e.g. Bravo's "8 to 12 reps … 50-75% RM" vs the grid's 12/10/8 reps at 50–75%), they agree.

---

# SPECIFICITY BRAVO (pp.80–83)

Heading printed as `SPECIFICITYBRAVO` in the text layer (p.80) — i.e. "SPECIFICITY BRAVO".

## Definition / structure (p.80)

> "Training is conducted four days per week using 8-16 exercises. Exercises are a mix of compound and isolation. Each exercise is trained twice a week." (p.80)

> "8 to 12 reps are performed with loads ranging from 50-75% RM." (p.80)

Context from elsewhere in the book, for block length: "Specificity blocks are three weeks in length. You can run one or more blocks depending on training objectives." (p.67) and Bravo is described as "pure conventional hypertrophy" (p.68). Bravo has **no MS cluster** — every session is an H session.

### Weekly day layout — image `p080_1.png` (p.80)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| H1 | H2 |  | H1 | H2 |  |  |

(Days 3, 6 and 7 are **blank cells in the book** — not labelled "Rest". Reproduced blank.)

## CLUSTER (p.80)

> "Create your own cluster. Choose/list 8-16 exercises – a mix of compound and isolation movements. Divide the list in half. One half becomes H1, the other H2." (p.80)

> "Here's an example:" (p.80)

### Example Bravo cluster — image `p081_1.png` (p.81)

| H1 | H2 |
|---|---|
| Bench Press | Barbell Row |
| Dumbbell Military Press | Bicep Curls |
| Dips | Dumbbell Shrugs |
| Front Squat | Romanian Deadlift |
| Ab Roll-out | Face Pulls |
|  | Hyperextensions (Back) |

The two columns are single cells containing a list each; the row-pairing above is presentational only. H1 lists **5** exercises, H2 lists **6** (11 total) — the book's own example is therefore not an exactly even split of the list (see *Ambiguities*).

> "For more ideas have a look at the sample H Clusters at the end of the chapter." (p.81)

## SPECIFICITY (BRAVO) — programming grid

Caption printed in the text layer as `SPECIFICITY (BRAVO)` (p.81). Transcribed from image `p081_2.png`.

Cell format is **sets x reps** on the first line and **% on the second line**. Percentages are of RM (see *Implementation consequences* for which max).

| Week | Day 1 (H1) | Day 2 (H2) | Day 3 | Day 4 (H1) | Day 5 (H2) | Day 6 | Day 7 |
|---|---|---|---|---|---|---|---|
| 1 | 4-5 x 12<br>50% | 4-5 x 12<br>50% |  | 4-5 x 12<br>55% | 4-5 x 12<br>55% |  |  |
| 2 | 4-5 x 10<br>60% | 4-5 x 10<br>60% |  | 4-5 x 10<br>65% | 4-5 x 10<br>65% |  |  |
| 3 | 4-5 x 8<br>70% | 4-5 x 8<br>70% |  | 4-5 x 8<br>75% | 4-5 x 8<br>75% |  |  |

Notes on the transcription:
- The table has exactly **three week rows** (1, 2, 3) and ends with a closed bottom border — there is no week 4+ in this grid.
- Day 3, Day 6 and Day 7 columns exist as headers with **empty body cells** on every week row.
- The second session of each week is **5 percentage points heavier** than the first at the same set/rep scheme (50→55, 60→65, 70→75).
- Reps descend 12 → 10 → 8 across the three weeks; sets stay `4-5` throughout.
- The book writes `4-5 x 12` (sets x reps) — see the Alpha chapter's own gloss: "The above is Sets x Reps/Percentage of 1 Rep Max." (p.74)

## EXECUTION (p.82)

> "Perform all sets of each exercise before moving on to the next (unless super-setting, see below). Rest for approximately 1 to 2 minutes between sets. Try to keep rest intervals brief and avoid going over 2 minutes if possible. Muscle failure/struggle near the end of your set is acceptable/expected. If you fail before reaching the prescribed number of reps, take a short breather and make up the difference." (p.82)

Rest interval for Bravo: **approximately 1 to 2 minutes between sets, avoid going over 2 minutes** (p.82).

## H TACTICS (pp.82–83)

> "Accumulating fatigue for the trained muscle groups over the course of a session is beneficial for hypertrophy. All the hypertrophy tactics presented for Alpha apply to Bravo. These are optional tactics for H sessions. If the feeling should strike use these techniques to squeeze more out of your session:" (p.82)

1. Extra Sets
2. Failure
3. Super Set

(p.82 — numbered exactly as printed.)

**Extra Sets** (p.82):
> "Add 1, 2, 3, or more sets to one or more exercise in your cluster. If you're in the mood to really 'blast your pecs' then by all means do 5, 10, or a million sets. Don't stop at the prescribed amount. This is our favorite H tactic because volume contributes significantly to hypertrophy. As a bonus, work capacity improves as well. Work capacity is a high value domain for operational athletes." (p.82)

**Failure** (pp.82–83):
> "Go beyond the prescribed reps until you can't, on the last set of the exercise. The only thing that changes is how many reps you do – not the load. Don't start adding more weight to the bar than what's prescribed for the session. If you're supposed to be handling 65%RM, then don't add an extra pound to that number. Just do more reps." (p.82)

> "What this might look like; you're on your final set of barbell rows. You hit the prescribed 12 reps. Instead of stopping at 12 keep going until you can't. Then rest for a few seconds and squeeze out a few more. Then rest for another few seconds and pump out another 2-3 reps. Keep repeating as able. This is a decent choice if you don't have time to use the 'Extra Sets' method." (pp.82–83)

**Super Setting** (p.83):
> "Super Setting refers to pairing up two exercises and doing sets of each back to back with minimal/no rest. For example, let's say you have dumbbell shoulder press and dips in your H cluster. You'd do one set of DB shoulder press and then immediately do a set of dips. Then take your rest interval and repeat. A good choice when time is tight." (p.83)

All three tactics are **optional**: "These are optional tactics for H sessions." (p.82)

## PROGRESSION (p.83)

> "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises you struggled with - use the same numbers for the next block." (p.83)

Identical wording appears for Alpha (p.77) and elsewhere in the book (lines at pp.77, 83 and in the General Mass templates).

---

# SAMPLE H CLUSTERS (pp.84–91)

## General guidance (p.84)

> "H clusters can be a mix of compound lifts, isolation movements, dumbbells, cables, machines, kettlebells - anything. Exercises are divided into two sub-clusters; H1 and H2. H1 and H2 will contain roughly 3-8 exercises each. H1 will be performed on one day of the week, H2 on another." (p.84)

> "I encourage you to create your own H cluster, but several sample clusters are provided below if you'd rather not. Since this is a mass building program, I recommend using mostly barbell- and dumbbell-based exercises. Some exceptions are fine. Kettlebell swings and the like are acceptable but avoid make unconventional tools the staple. Barbells/dumbbells are tried and true when it comes to mass building. Easy to use, and they lend themselves well to incremental increases in load. Bodyweight work for abs/core like leg raises and back extensions are acceptable. Bodyweight or weighted bodyweight such as chins, pull-ups, dips are also good choices. For those of you that are so inclined – this is a chance to get those beach muscle exercises in…bicep curls, extra chest work, and other isolation movements." (p.84)

*(The sentence "avoid make unconventional tools the staple" is transcribed verbatim as printed, typo included.)*

**Author's own recommendation** (marked as such): *"Since this is a mass building program, I recommend using mostly barbell- and dumbbell-based exercises."* (p.84)

## A WORD ON ALPHA (pp.84–85)

> "Alpha has a prescribed MS cluster consisting of Bench Press/Squat/Deadlift (or similar variations). It is perfectly acceptable to include the same exercises in your H cluster. What that does is it creates a double-whammy high-frequency effect which is beneficial for both strength and mass. Let's say you include the bench press in your H cluster. That would have you benching three times a week. Two MS bench sessions and one H session. The reps/sets/load are waved from one style to another which make it sustainable. MS bench immediately followed by H bench the day after is acceptable and beneficial. Both styles of lifting hit the muscle/CNS from different angles so to speak, which results in a kind of positive synergy." (pp.84–85)

**Hard restriction for Bravo** (p.85):
> "This does NOT apply to Bravo. Consistently benching or squatting or whatever two days in a row using Bravo loads/sets/reps isn't best practice and is more of a negative rather than a positive over the long term." (p.85)

> "The following H Cluster samples can be used with either Alpha or Bravo, unless stated otherwise. Feel free to use them as-is or modify them to suit your needs:" (p.85)

---

## CAMP DRVAR CLUSTER (p.85)

> "This cluster gives you a range of movements and exercises. Barbell or dumbbells are acceptable. Dips and pull-ups can be done weighted or un-weighted, up to you." (p.85)

Image `p085_1.png` (p.85):

| H1 | H2 |
|---|---|
| Overhead Press | DB Row |
| DB Bench Press | Weighted Pull-Up |
| Weighted Dips | DB Shrug |
| Bulgarian Split Squat | Sumo Deadlift |
| Hamstring Curl | DB Bicep Curl |
| Calf Raise | Hyperextensions (Back) |
| Hanging Leg Raise |  |

(H1 = 7 exercises, H2 = 6; 13 total. The final H2 cell is blank in the book — reproduced blank.)

---

## KEENY-MEENY CLUSTER (p.86)

Image `p086_1.png` (p.86):

| H1 | H2 |
|---|---|
| Decline Bench Press | Front Squat |
| Barbell Row | Overhead Press |
| Weighted Pull-up (or bodyweight) | Weighted Pull-up (or bodyweight) |

(3 exercises per sub-cluster. "Weighted Pull-up (or bodyweight)" appears in **both** H1 and H2 — i.e. two pull-up sessions per week, exactly as the prose describes.)

Prose (p.86):
> "When used with Alpha, KM allows you to bench and squat three times a week (variations). And you get two weighted pull-up sessions - a high-value exercise for operational athletes. MS days act as heavy/low volume training, while MH days become higher volume/hypertrophy-focused sessions for similar exercises. If you've used the programming in Tactical Barbell I, you know how powerful frequency is when used correctly. When using a higher frequency approach, it's especially important to follow the rules for each type of session. On MS days make sure you're well rested and fresh in between sets. Stick to the assigned weight and don't do a single rep more than prescribed. Variations of the prescribed exercises are acceptable – i.e. Kroc rows, dumbbells instead of barbells etc." (p.86)

> "If using KM with Bravo, one of the pull-up sessions can be weighted, the other bodyweight (using total reps as %RM). Also, if using with Bravo, feel free to add a few more exercises." (p.86)

*(Note: the book writes "MH days" here (p.86) — elsewhere the hypertrophy sub-clusters are called H/H1/H2. Reproduced as printed; see* Ambiguities.*)*

---

## KM + ALPHA (p.87)

Image `p087_1.png` (p.87) — the weekly layout of the Keeny-Meeny cluster **when run with Alpha**:

| D1 (MS) | D2 (H1) | D3 | D4 (MS) | D5(H2) | D6 | D7 |
|---|---|---|---|---|---|---|
| BP<br>SQ | DBP<br>BR<br>WPU |  | BP<br>SQ<br>DL | FSQ<br>OHP<br>WPU |  |  |

Header cells are printed exactly as `D1 (MS)`, `D2 (H1)`, `D3`, `D4 (MS)`, `D5(H2)` (no space before the bracket on D5 — reproduced as printed), `D6`, `D7`. D3, D6, D7 body cells are blank.

Abbreviations as used in this grid (expanded from the Keeny-Meeny cluster table, p.86): BP = Bench Press, SQ = Squat, DL = Deadlift, DBP = Decline Bench Press, BR = Barbell Row, WPU = Weighted Pull-up, FSQ = Front Squat, OHP = Overhead Press. *The book does not print a legend on p.87 — these expansions are inferred from the p.86 cluster table and the p.84 Alpha MS cluster (Bench Press/Squat/Deadlift); flagged in* Ambiguities.

Prose (p.87):
> "The above is what KM looks like when used with Alpha. Consecutive training days used judiciously are rocket fuel for strength and mass. Intensity and volume are waved session to session to make this possible. This is an example showing only 1 deadlift session per week on Day 4. Two sessions per week can be performed depending on work capacity and recovery management." (p.87)

---

## EIDOLON (pp.87–88)

Heading `EIDOLON` printed at the foot of p.87. Image `p087_2.png` (p.87):

| H1 | H2 |
|---|---|
| Overhead Squat | Good Morning |
| Barbell Row | Weighted Pull-up |
| Decline DB Press | Overhead Press |
| Triceps Kickback | Barbell Curl |
| Ab Roller | Face-Pulls |
|  | Hyperextensions (Back) |

(H1 = 5, H2 = 6; 11 total. The last H1 cell is blank in the book. No accompanying prose or programming grid is printed for Eidolon — the next text on p.88 is the `CLASSIC` heading.)

---

## CLASSIC (p.88)

Image `p088_1.png` (p.88):

| H1 | H2 |
|---|---|
| Incline Barbell Bench Press | Barbell Row |
| Dumbbell Shoulder Press | Dumbbell Shrugs |
| Weighted Dips | Weighted or Bodyweight Pull-up |
| Zercher Squat | Trap Bar Deadlift |
| Lunges | DB Biceps Curl |
| Hanging Leg Raise | Hyperextensions |

(6 exercises per sub-cluster, 12 total. No prose accompanies Classic — the next text on p.88 is the `BULGARIAN` heading.)

---

## BULGARIAN (pp.88–89)

Image `p088_2.png` (p.88):

| HI | H2 |
|---|---|
| Squat | Squat |
| Bench Press | Bench Press |
| Romanian Deadlift | Romanian Deadlift |

`*FOR USE WITH ALPHA ONLY*` — printed **below the table**, on the page, exactly as shown (p.88).

> **Transcription note:** the left header in `p088_2.png` renders as **`HI`** (capital H, capital i) rather than `H1` as in every other cluster table. Reproduced as printed; it is evidently H1.

H1 and H2 are **identical** — the same three lifts on both H days.

Prose (pp.88–89):
> "This Bulgarian inspired approach is the nuclear option for strength and mass purists. When used with Alpha, it becomes a high frequency template that revolves around the big 3. This is a serious cluster for experienced lifters that have a realistic understanding of their work capacity. If you decide to go with this, I highly recommend using a training maximum in place of a 1 Rep Max for both MS and MH clusters." (pp.88–89)

### ⚠ TRAINING MAXIMUM (TM) — p.89, verbatim

> "A training maximum or TM is 90% of your True/or 1 Rep Max. The TM is used instead of the 1RM to calculate your weekly loads." (p.89)

Full surrounding sentence, spanning the page break (pp.88–89):

> "If you decide to go with this, I **highly recommend** using a training maximum in place of a 1 Rep Max for both MS and MH clusters. A training maximum or TM is 90% of your True/or 1 Rep Max. The TM is used instead of the 1RM to calculate your weekly loads." (pp.88–89, emphasis added to mark the strength of the recommendation)

Scope of the rule as printed:
- It is introduced **inside the Bulgarian cluster section**, conditioned on "If you decide to go with this" (p.88) — i.e. the book states it as a recommendation for the **Bulgarian cluster**, not as a global rule for the whole protocol.
- It is a **recommendation** ("I highly recommend"), not a mandate (p.88).
- When applied, it applies to **both MS and MH clusters** (p.88) — i.e. both the maximal-strength and the hypertrophy sessions, not just one of them.
- TM = **90% of True/1 Rep Max** (p.89). Loads are then computed as `percentage × TM` rather than `percentage × 1RM` (p.89).
- Nowhere else in pp.80–93 is a training maximum mentioned. Everywhere else the percentages are explicitly against the **1RM** — e.g. "Every 3 to 6 weeks, add 5-10lbs to 1RMs" (p.83), "Know the 1RMs for all the exercises in your clusters prior to starting Specificity" (p.90), and Alpha's gloss "Sets x Reps/Percentage of 1 Rep Max" (p.74).

Continuing (p.89):
> "Not only will the Bulgarian make you massive, but it'll improve your maximal-strength in leaps and bounds." (p.89)

> "This isn't for you if you want to focus more on isolation exercises or enjoy a variety of movements. Adding in extra isolation work is missing the point. It's too much and will likely sabotage the progress you're making with the prescribed lifts. Not a good choice if you have issues with frequent benching/pressing." (p.89)

---

## BULGARIAN + ALPHA (p.89)

Image `p089_1.png` (p.89):

| D1 (MS) | D2 (H1) | D3 | D4 (MS) | D5 | D6 (H2) | D7 |
|---|---|---|---|---|---|---|
| BP<br>SQ | BP<br>SQ<br>RDL |  | BP<br>SQ<br>DL |  | BP<br>SQ<br>RDL |  |

Header cells printed exactly as `D1 (MS)`, `D2 (H1)`, `D3`, `D4 (MS)`, `D5`, `D6 (H2)`, `D7`. D3, D5 and D7 body cells are blank.

Abbreviations: BP = Bench Press, SQ = Squat, RDL = Romanian Deadlift, DL = Deadlift. *(Legend not printed on p.89; expanded from the p.88 Bulgarian cluster table.)*

Note the asymmetry, reproduced exactly as printed: the MS day on **D1 has two lifts** (BP, SQ) while the MS day on **D4 has three** (BP, SQ, DL) — consistent with Alpha's deadlift rule that DLs get their own programming and may be run once or twice per week (p.74).

Prose (p.89):
> "In this example H2 is performed on Day 6 instead of Day 5. This is just to show that you have that option available to you. You can train H2 on Day 5 if you wish, but the option is there for those times you need a little more of a buffer. Hypertrophy benefits with a little pre-fatigue. There will be some carry-over fatigue from your MS days. This doesn't work in reverse, the fresher the better for MS. That said, there will be some residual fatigue and DOMs from H days that carry over all week regardless. It's unavoidable and will have minimal impact – don't worry about it. That's the nature of hypertrophy training." (p.89)

> "You can also get creative with the Bulgarian and sub in variations for H; front squats, decline/Incline bench, Sumo deadlifts, etc." (p.89)

---

## MISCELLANEOUS (pp.90–91)

> "The H-clusters provided above are samples. Some are a little unconventional to show you the range of what's acceptable. Your H cluster can certainly be more traditional with a greater focus on isolation exercises." (p.90)

> "Know the 1RMs for all the exercises in your clusters prior to starting Specificity." (p.90)

> "There's no need to regularly test your 1 rep maximums with this protocol. Test as required when changing phases or incorporating new exercises. From there on progression simply consists of adding weight to your 1 rep maximum and recalculating from block to block. Also referred to as Forced Progression in the Tactical Barbell system." (p.90)

> "There's also no need to test a true 1RM with this protocol. It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators." (p.90)

### Bodyweight & weighted-bodyweight testing (p.90)

> "When using bodyweight exercises such as pull-ups or dips there are two ways to go about testing. If the movements are weighted – calculate normally as you would any other exercise but include your bodyweight in the calculation. If you don't include your bodyweight and just factor-in the external weight – things will get too heavy too fast. You've been warned." (p.90)

> "If using just bodyweight – find your maximum number of REPS. Maximum reps act as your 1RM for bodyweight movements. Let's say you've included pull-ups in your cluster and you can do 10 max. If the programming calls for 3 sets x 10 reps @ 70%RM, you'd do 3 sets of 7. 7 is 70% of your maximum (10 reps)." (p.90)

Worked example as printed (p.90): max = 10 reps; prescription 3 sets × 10 reps @ 70%RM → **3 sets of 7**.

### Callout box — image `p091_1.png` (p.91)

Page 91 contains **only** a dark full-width callout box, no body text. Transcribed verbatim (italics as printed):

> "When testing weighted bodyweight exercises – calculate normally as you would any other exercise *but include your bodyweight in the calculation.*"

---

# BRIDGE WEEK (pp.92–93)

## What it is (p.92)

> "Bridge Week or bridging is simply taking a week off in between Blocks. Also known as deloading/deload week." (p.92)

> "Bridging serves two purposes;
> 1. Allows the body to recover so supercompensation/adaptation can occur.
> 2. Opportunity to test 1RMs for the upcoming Block (if required)." (p.92)

Rationale (p.92):
> "Near the end of a cycle or block you are not at your strongest. Your body is broken, your muscles overworked. Microtears, inflammation, and fatigue collect. When you stop training your body gets a chance to breath and starts the recovery/supercompensation process. Inflammation is quelled, adaptation takes place, and healing occurs. Your body comes back stronger than it's ever been in response to the unnatural stressors placed on it during the training cycle. If you never give your body a chance to go through that recovery – you'll be in a perpetual state of breakdown, never quite at your peak. Be smart – after every hard push back off a little and allow the work you've put in to come to fruition." (p.92)

## Bridge Week layout — image `p092_1.png` (p.92)

| Day 1 | Day 2 | Day 3 | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|---|---|
| Rest | Rest | Rest | Test | Test | Rest | Rest |

## When to bridge (p.93)

> "You can bridge in between blocks of General and Specificity, between blocks of General and General, Specificity and Specificity etc." (p.93)

> "You can test 1RMs on Day 4, Day 5, or both. If testing is required. When it comes to this program, testing is only required once before you start the protocol, and maybe before your first Specificity block." (p.93)

> "If no 1RM testing is required than Test Days become Rest Days." (p.93)

*(Transcribed verbatim, "than" for "then" included.)*

## What is allowed during Bridge Week (p.93)

> "Light activity such as walking, hiking, swimming, yoga and stretching are all good-to-go for Bridge Week. Avoid the more intense activities such as weights, HIC, and E. Easy body weight circuits are allowed." (p.93)

Allowed: walking, hiking, swimming, yoga, stretching, easy bodyweight circuits (p.93).
Avoid: weights, HIC, and E (p.93).

## Frequency — mandatory or optional? (p.93)

> "I recommend taking a Bridge week once every two to three months whether you feel like it or not. Bridging more than that is certainly acceptable - resting before you feel the need to is a good way to extend your training life while avoiding injury and burn-out. Don't learn this lesson the hard way, by ending up broken in your 30s and 40s with recurring injuries and perpetual back and knee problems." (p.93)

The book frames Bridge Week as the **author's recommendation** ("I recommend … once every two to three months whether you feel like it or not"), not as a mandated part of every block cycle (p.93). Bridging **more** often than every 2–3 months is explicitly "certainly acceptable" (p.93). No upper bound and no penalty is stated for bridging more often.

---

# Implementation consequences (for the app)

Each item below cites the page it comes from. Nothing here goes beyond what the pages say.

## Loading basis — 1RM vs Training Max
- Default basis throughout pp.80–93 is the **1 Rep Max**: "Know the 1RMs for all the exercises in your clusters prior to starting Specificity" (p.90); Bravo progression is "add 5-10lbs to 1RMs. Recalculate and repeat" (p.83); Alpha's grid gloss is "Percentage of 1 Rep Max" (p.74).
- **TM override**: "A training maximum or TM is 90% of your True/or 1 Rep Max. The TM is used instead of the 1RM to calculate your weekly loads." (p.89) — introduced as a **highly recommended** option **for the Bulgarian cluster**, applying to "both MS and MH clusters" (p.88).
- Consequence: the app needs a per-cluster (or per-programme) **loading basis** flag — `1RM` or `TM = 0.90 × 1RM` — and must not apply TM globally, because the book only prescribes it in the Bulgarian context (pp.88–89).
- 1RM itself may be **derived**: "It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators." (p.90) The book names no specific formula (see *Ambiguities*).

## Units and rounding
- Weight increments are stated in **pounds**: "add 5-10lbs to 1RMs" (p.83). The worked example on p.75 also uses lbs (300/100lb 1RMs). **No kg figures appear in this range.**
- **No rounding rule of any kind is printed** in pp.80–93 — not to the nearest 5lb, not to a loadable plate, nothing. The p.75 example (75% of 300 = 225lbs) happens to be exact. The Bravo percentages (50/55/60/65/70/75%) will routinely produce non-loadable numbers; the book gives no instruction on what to do about it.
- **No bar-weight or plate-math guidance** appears anywhere in this range.

## Block / week structure
- Bravo = **4 training days/week** (p.80); H1 on Day 1 and Day 4, H2 on Day 2 and Day 5; Days 3, 6, 7 blank (`p080_1.png`, p.80).
- Bravo block = **3 weeks**, per the printed grid (`p081_2.png`, p.81) and "Specificity blocks are three weeks in length" (p.67).
- **Each exercise is trained twice a week** (p.80) — i.e. the whole of H1 is repeated on Day 4 and the whole of H2 on Day 5, at a **higher percentage** (+5 points) the second time (`p081_2.png`, p.81).

## Sets / reps / load
- Sets are a **range: 4-5** for every Bravo cell (`p081_2.png`, p.81). The app must let the user pick 4 or 5; the book does not say which.
- Reps are **fixed per week**: 12 (wk1), 10 (wk2), 8 (wk3) (`p081_2.png`, p.81).
- Percentages are **fixed per day**: 50/50/55/55, 60/60/65/65, 70/70/75/75 (`p081_2.png`, p.81). No freedom here.
- Extra sets beyond the prescribed 4-5 are permitted as an optional tactic, but **the load must not change**: "The only thing that changes is how many reps you do – not the load … don't add an extra pound to that number." (p.82)

## Rest intervals
- Bravo / H sessions: **~1–2 minutes between sets, avoid exceeding 2 minutes** (p.82).
- Super-setting explicitly overrides "all sets of one exercise before the next" ordering, with **minimal/no rest** between the paired exercises and the normal rest interval after the pair (pp.82–83).
- (For contrast, MS sessions in Alpha use 2–5 minutes, 3–5 being the sweet spot — p.75, outside this range.)

## Progression / deload
- Progression: "**Every 3 to 6 weeks**, add **5-10lbs** to 1RMs. Recalculate and repeat." (p.83) — note that the increment window (3–6 weeks) is *wider* than the 3-week block, so a user may run two blocks on the same numbers.
- Stall rule: "Don't force progression for exercises you struggled with - use the same numbers for the next block." (p.83) — **per-exercise**, not per-block. The app needs per-exercise progression state.
- No in-block deload exists; the deload is the separate **Bridge Week** (p.92).
- Retesting: "There's no need to regularly test your 1 rep maximums with this protocol. Test as required when changing phases or incorporating new exercises." (p.90) — "Also referred to as Forced Progression in the Tactical Barbell system." (p.90)

## Bodyweight and weighted-bodyweight exercises
- **Pure bodyweight**: max reps is the "1RM". Prescribed reps = percentage × max reps. Worked example: max 10, prescription `3 sets x 10 reps @ 70%RM` → 3 sets of 7 (p.90). Consequence: for bodyweight movements the app must apply the percentage to the **rep count**, not the load, and it **overrides the printed rep number** in the grid.
- The book's rounding of `70% × 10 = 7` is exact; **no rule is given for non-integer results** (e.g. 55% of 9).
- **Weighted bodyweight**: "calculate normally as you would any other exercise but include your bodyweight in the calculation" (p.90, and the p.91 callout). Consequence: the 1RM for weighted dips/pull-ups is `bodyweight + external load`, and the working load computed from a percentage of that must then have bodyweight **subtracted back out** to know what to hang on the belt — the book does not spell out that subtraction step (see *Ambiguities*).
- Failure to include bodyweight is explicitly warned against: "things will get too heavy too fast. You've been warned." (p.90)

## Cluster construction rules the app can validate
- Bravo cluster: **8–16 exercises**, "a mix of compound and isolation movements", divided in half into H1 / H2 (p.80).
- Sample-cluster guidance: "H1 and H2 will contain **roughly 3-8 exercises each**" (p.84).
- Note the two ranges are not identical: 8–16 total (p.80) vs roughly 3–8 each i.e. ~6–16 total (p.84), and the book's own Bravo example is 5+6 = 11 (`p081_1.png`, p.81).
- Restriction: with **Bravo**, do not run the same lift on consecutive days — "This does NOT apply to Bravo. Consistently benching or squatting or whatever two days in a row using Bravo loads/sets/reps isn't best practice" (p.85). With **Alpha**, the same lift on consecutive MS→H days is explicitly "acceptable and beneficial" (pp.84–85).
- The **Bulgarian** cluster is marked `*FOR USE WITH ALPHA ONLY*` (p.88) — the app must not offer it under Bravo.
- The **Bulgarian** cluster additionally forbids added isolation work: "Adding in extra isolation work is missing the point. It's too much and will likely sabotage the progress you're making with the prescribed lifts." (p.89)
- All other listed samples: "The following H Cluster samples can be used with either Alpha or Bravo, unless stated otherwise." (p.85)

## Bridge Week
- A **7-day** week: Rest ×3, Test (D4), Test (D5), Rest ×2 (`p092_1.png`, p.92).
- Test days collapse to rest days when no testing is due: "If no 1RM testing is required than Test Days become Rest Days." (p.93)
- Testing may be on Day 4, Day 5, **or both** (p.93).
- Allowed activity: walking, hiking, swimming, yoga, stretching, easy bodyweight circuits. Prohibited: weights, HIC, E (p.93).
- Cadence: author recommends once every **2–3 months**; more frequent bridging is acceptable (p.93).
- Placement: between any two blocks — General↔Specificity, General↔General, Specificity↔Specificity (p.93).

---

# Ambiguities and choices

Where the reader has freedom, and where they do not. Nothing below is resolved — this section records the open points only, and marks the author's own recommendation where he gives one.

## Free (the reader chooses)

1. **Exercise selection for H clusters.** "Create your own cluster. Choose/list 8-16 exercises" (p.80); "I encourage you to create your own H cluster, but several sample clusters are provided below if you'd rather not" (p.84). **Author's recommendation:** "Since this is a mass building program, I recommend using mostly barbell- and dumbbell-based exercises." (p.84)
2. **Which sample cluster (if any) to use.** Six named samples are printed (Camp Drvar p.85, Keeny-Meeny p.86, Eidolon p.87, Classic p.88, Bulgarian p.88, plus the unnamed Bravo example p.81), all usable "as-is or modify them to suit your needs" (p.85).
3. **Exactly how the 8–16 list is split.** "Divide the list in half" (p.80), but the book's own example splits 5/6 (`p081_1.png`, p.81) and the sample clusters split 7/6 (Camp Drvar, p.85), 5/6 (Eidolon, p.87), 6/6 (Classic, p.88), 3/3 (Keeny-Meeny, p.86 and Bulgarian, p.88). The app should not enforce an exact even split.
4. **4 or 5 sets.** Every Bravo cell reads `4-5 x N` (`p081_2.png`, p.81). The book never says when to pick 4 vs 5.
5. **Weighted vs unweighted for dips/pull-ups.** "Dips and pull-ups can be done weighted or un-weighted, up to you." (p.85); Keeny-Meeny lists "Weighted Pull-up (or bodyweight)" (p.86); Classic lists "Weighted or Bodyweight Pull-up" (p.88). Under Bravo with KM: "one of the pull-up sessions can be weighted, the other bodyweight (using total reps as %RM)" (p.86).
6. **Exercise variations/substitutions.** "Variations of the prescribed exercises are acceptable – i.e. Kroc rows, dumbbells instead of barbells etc." (p.86); "You can also get creative with the Bulgarian and sub in variations for H; front squats, decline/Incline bench, Sumo deadlifts, etc." (p.89).
7. **H tactics (Extra Sets / Failure / Super Set).** Explicitly "optional tactics" (p.82).
8. **Deadlift frequency under Alpha-based clusters.** KM + Alpha "is an example showing only 1 deadlift session per week on Day 4. Two sessions per week can be performed depending on work capacity and recovery management." (p.87)
9. **H2 day placement under Bulgarian + Alpha.** "In this example H2 is performed on Day 6 instead of Day 5 … You can train H2 on Day 5 if you wish, but the option is there for those times you need a little more of a buffer." (p.89)
10. **Number of consecutive blocks.** "You can run one or more blocks depending on training objectives." (p.67)
11. **Bridge Week frequency.** **Author's recommendation:** "once every two to three months whether you feel like it or not"; more often is "certainly acceptable" (p.93).
12. **Bridge Week test day.** "You can test 1RMs on Day 4, Day 5, or both. If testing is required." (p.93)
13. **1RM determination method.** "It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators." (p.90) — **no specific formula is named**, so the app must choose one and cannot claim book fidelity for that choice.
14. **How much to add at progression.** "add 5-10lbs" (p.83) — a range, not a number.
15. **When to progress.** "Every 3 to 6 weeks" (p.83) — a range that does not align cleanly with the 3-week block.

## Fixed (the reader does not choose)

1. **Bravo day pattern**: H1/H2/–/H1/H2/–/– (`p080_1.png`, p.80).
2. **Bravo reps per week**: 12 / 10 / 8 (`p081_2.png`, p.81).
3. **Bravo loads per day**: 50/50/55/55 → 60/60/65/65 → 70/70/75/75 (`p081_2.png`, p.81).
4. **Set count band**: 4–5 (`p081_2.png`, p.81). Extra sets are allowed as a tactic, but the prescribed baseline is 4–5.
5. **Load is not to be altered by tactics**: "don't add an extra pound to that number" (p.82).
6. **Each exercise is trained twice a week** under Bravo (p.80).
7. **Bulgarian is Alpha-only** (`*FOR USE WITH ALPHA ONLY*`, p.88).
8. **No same-lift-on-consecutive-days under Bravo** (p.85).
9. **Bodyweight movements use %-of-max-reps, not %-of-load** (p.90).
10. **TM, when used, is exactly 90% of the 1RM** (p.89) — the 90% figure itself is not a range.

## Genuinely unresolved / not stated by the book

1. **Does the TM rule apply outside the Bulgarian cluster?** The rule is printed inside the Bulgarian section and conditioned on "If you decide to go with this" (p.88). The book does not say whether a lifter running Camp Drvar or plain Bravo may/should also use a TM. **Do not generalise it without a page reference.**
2. **"MH clusters"** (p.86, p.88) vs **"H clusters"** everywhere else. The book uses both labels; it never defines "MH". Treat as the same thing at your own risk — the book does not say.
3. **Rounding of computed loads.** Not addressed anywhere in pp.80–93.
4. **Rounding of computed bodyweight rep counts** when the percentage does not divide evenly. Not addressed (p.90 example is exact).
5. **Subtracting bodyweight back out** for weighted dips/pull-ups after computing `% × (bodyweight + load)`. The book says to include bodyweight in the *calculation* (p.90, p.91) but never spells out the final belt-load arithmetic.
6. **Units**: only lbs appear (p.83, p.75). No kg equivalents and no conversion guidance are printed.
7. **KM + Alpha and Bulgarian + Alpha grids carry no sets/reps/percentages** — they show exercise placement only (`p087_1.png` p.87, `p089_1.png` p.89). The loading for those days must come from the **Alpha** programming table (outside this extract's range, p.74), which the book does not restate here.
8. **Abbreviation legends are not printed** on p.87 or p.89 (BP, SQ, DL, DBP, BR, WPU, FSQ, OHP, RDL). The expansions given above are read off the corresponding cluster tables on p.86 and p.88; the book itself never lists them.
9. **Eidolon (p.87) and Classic (p.88) have no accompanying prose or programming grid** — no guidance is given on how they differ or who they suit.
10. **The cluster-size guidance conflicts**: 8–16 total (p.80) vs "roughly 3-8 exercises each" (p.84), and Keeny-Meeny/Bulgarian both ship with only 3 per sub-cluster (pp.86, 88) — below the 8-total minimum stated for Bravo (p.80). The book does not reconcile these.
11. **Is Bridge Week mandatory?** The book says "I recommend taking a Bridge week once every two to three months" (p.93) and describes it as "simply taking a week off in between Blocks" (p.92) — it is framed as strongly advised but is never stated as mandatory, and no rule forces one between any two specific blocks.


---

# 07 — Conditioning (PDF pp. 94–111)

> Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`. All page references are **PDF page numbers of that file**.
>
> Every image in this range was opened and transcribed. Note that in this range the images are **not** session grids: `p094_1.png` is a photograph, `p097_1.png` is a pull-quote box, `p098_1.png` is the Green/Black session table, and `p100_1.png`–`p107_1.png` are the **GREEN / BLACK section banners** printed above each session title. The session prescriptions themselves are live text. Each rendered page was also inspected directly to confirm the banner on each session page and the bold/italic emphasis.

---

## Part title: CONDITIONING (p.94)

Part-opening page. Title `CONDITIONING`, plus a photograph of a muscular athlete sprinting on a running track (`docs/MASS/images/p094_1.png`). No training content. (p.94)

---

## CONDITIONING (p.95)

> "In the Tactical Barbell lexicon, conditioning is the ability to produce energy to meet the task at hand." (p.95)

> "Standard TB conditioning sessions focus on improving various aspects of the cardiovascular system for peak operational performance. **For the purposes of this protocol I want you to drop everything you learned about conditioning in Tactical Barbell II.** We're going to get ruthlessly minimalist to achieve the primary objective – muscle mass. Now is not the time to build your aerobic base or train for that awe-inspiring OCR time. We're going to keep just enough conditioning in the mix to ensure a basic level of operational readiness." (p.95)

> "Before we get into the specific sessions, let's review the principles of conditioning in the context of hypertrophy training." (p.95)

---

## MASS PROTOCOL CONDITIONING PRINCIPLES (pp.96–97)

Heading is printed on two lines: `MASS PROTOCOL` / `CONDITIONING PRINCIPLES` (p.96). (The plain-text dump renders this as the run-together string "MASS PROTOCOLCONDITIONING PRINCIPLES" — that is a text-layer artefact, not the book's wording.)

> "**When muscle mass is the priority,** the role of conditioning must change to accommodate and promote that objective:" (p.96)

There are **four** principles, each printed as an italic sub-heading:

### 1. *Conditioning should improve the ability of the body to produce energy to support activity* (p.96)

> "Having a high functioning cardiovascular system improves work capacity in the gym. Meaning you can work longer and harder. You have that fire and motivation to lift when you're well conditioned. Recovery in between sets/sessions is quicker." (p.96)

> "Athletes that focus primarily on weight training while neglecting cardio quickly get stale in the gym. It's like increasing the size of a vehicle while simultaneously reducing its' power output. Looks like a G Wagon - but performs like a lawnmower. They barely have the energy to hit their target sets/reps/loads. They're going through the motions. Some attribute this to getting older or reaching natural limits, not realizing it might be because they've neglected their power-source over the years. They've been relying on the natural conditioning provided by youth and/or developed playing sports in school, the military, etc. As you get older – that well starts to run dry with neglect. You must consciously replenish and develop it with the same zeal you lift weights. We've all been there - we have good intentions, but 'cardio' is the first thing that gets dropped if our schedules become remotely busy. In the real world, conditioning can be the difference between being 'big and ripped' and 'chubby but strong.' Conditioning brings your engine up to par with your increased strength and mass." (p.96)

### 2. *Conditioning should promote anabolism* (p.97)

> "Certain types of conditioning trigger the release of growth hormone, testosterone and other anabolic processes. Doing the type of cardio that puts your body in an anabolic state supports and promotes the growth of muscle tissue." (p.97)

### 3. *Conditioning should not OPPOSE anabolism* (p.97)

> "Done a certain way, conditioning can easily become catabolic in nature. These sessions might benefit specific areas of performance – but they signal the body to shed excess tissue/weight, be it fat or muscle. **Excessive running falls into this category.** You *can* train endurance and build muscle mass to a degree – but you're creating an obstacle for yourself. It takes a high level of discipline and experience, especially with regards to food intake and recovery management. It's challenging enough to build mass without *any* conditioning, never mind with self-imposed obstacles. Make the path to your objective as easy as possible. Avoid the types of conditioning sessions that don't serve your *current* purpose. You don't get extra points for challenging yourself – you win by reaching your objective." (p.97)

("Excessive running" is not bolded in the book; emphasis in that quote is the book's own italics on *can*, *any* and *current*.)

### 4. *Use conditioning to facilitate recovery* (p.97)

> "Conditioning can be used to speed up recovery between lifting sessions. Blood flow to muscle and tissue increases, resulting in beneficial nutrients getting shuttled in while metabolic waste gets shuttled out." (p.97)

### Pull-quote box (p.97) — image `p097_1.png`

Dark grey callout box at the foot of p.97, transcribed cell-for-cell:

| |
|---|
| The sessions in this book were carefully designed and chosen with the Mass Protocol conditioning principles in mind. |

(p.97)

---

## SESSIONS (p.98)

> "Conditioning is divided in two categories for this protocol; Green and Black. Both phases mirror a lifting component of the program. **Green is used alongside General Mass. Black is used alongside Specificity.**" (p.98)

> "Green and Black are protocols found in the standard Tactical Barbell system, however in this program I'll be providing you with specific training sessions for each. *Use the sessions provided in this book* – NOT the Green/Black training found in *Tactical Barbell II*. The sessions in this book were chosen specifically to align with the goal of hypertrophy." (p.98)

### Green / Black session table (p.98) — image `p098_1.png`

Transcribed cell for cell (two columns, four rows of content, header row shaded):

| GREEN | BLACK |
|---|---|
| Walk | Anabolic Sprints |
| Ruck | Reset-20 |
| Recovery Run | Hill Sprints |
| Endurance Predator | Fobbits |

(p.98)

---

## GREEN SESSIONS (p.99)

> "Green is used alongside General Mass (Mass Template 1 & 2, Gladiator, Fighter HT). Green sessions are low intensity/longer duration. Green is designed to enhance aerobic/endurance capacity and facilitate recovery. Green sessions have no negative impact on muscular hypertrophy. **Perform 1 to 3 conditioning sessions per week. No more than 3. Sessions can be conducted on non-lifting or lifting days.**" (p.99)

## BLACK SESSIONS (p.99)

> "Black is used during Specificity (Alpha, Bravo) and is high intensity/limited duration. Black is designed to promote an anabolic environment which in turn supports muscular hypertrophy. Black also improves the anaerobic system. **Perform 1 to 2 conditioning sessions per week. No more than 2. Perform Black sessions on non-lifting days.**" (p.99)

Summary of the two categories as stated on p.99:

| | GREEN | BLACK |
|---|---|---|
| Used with | General Mass (Mass Template 1 & 2, Gladiator, Fighter HT) | Specificity (Alpha, Bravo) |
| Character | Low intensity / longer duration | High intensity / limited duration |
| Purpose | Enhance aerobic/endurance capacity and facilitate recovery; no negative impact on muscular hypertrophy | Promote an anabolic environment which supports muscular hypertrophy; also improves the anaerobic system |
| Sessions per week | 1 to 3. No more than 3. | 1 to 2. No more than 2. |
| Day placement | Non-lifting **or** lifting days | Non-lifting days |

(p.99)

---

## The eight sessions (pp.100–108)

Each session page is laid out as: a category **banner image** (GREEN or BLACK), the session name as a centred heading, then the prescription lines in **bold**, then prose. Banner images are `docs/MASS/images/pNNN_1.png` for each page; pp.100–104 all share one identical GREEN banner image (PDF xref 1408) and pp.105–107 share one identical BLACK banner image (PDF xref 1553). See "Ambiguities and choices" for the p.104 banner discrepancy.

---

## WALK (p.100) — banner: **GREEN**

Prescription card, transcribed exactly:

```
GREEN

WALK

Walk x 30-60 Minutes
```

> "Self explanatory." (p.100)

---

## RUCK (p.101) — banner: **GREEN**

```
GREEN

RUCK

Ruck x 30-60 minutes
```

> "Ruck for 30 to 60 minutes continuously with a load of 10-50lbs. 30lbs is usually the sweet spot for most." (p.101)

> "A weight vest can be used in place of a ruck." (p.101)

> "Rucking and weighted walks are an excellent way to develop or maintain a base level of endurance while building muscle. Wearing an external load signals the body to preserve/improve structural strength. It can't simply shed muscle willy-nilly. External weight can be a great antidote to the typical distance-runner physique." (p.101)

---

## RECOVERY RUN (p.102) — banner: **GREEN**

```
GREEN

RECOVERY RUN

Run x 20-30 minutes
Alternate Exercises: Cycle/Swim/Row
```

> "Jog *at a relaxed pace* for 20-30 minutes. Use the talk-test. Run at a pace that allows you to carry on a conversation and/or breathe through your nose. Think comfortable. Don't run for longer than 30 minutes while hypertrophy is the primary objective." (p.102)

> "If you're a hardgainer – i.e. you have difficulty growing muscle or gaining weight, **cap it at 20 minutes.**" (p.102)

> "10-minute Recovery Runs can be used before and after weight training sessions as well. 10-minutes as a warm-up prior to the session, and 10-minutes after to cool down and hasten recovery. **When done in this fashion they don't count as a conditioning session.**" (p.102)

(The "don't count" sentence is not bolded in the book; bolding here flags an implementation rule. The book's own bold on this page is `cap it at 20 minutes.`)

---

## ENDURANCE PREDATOR (p.103) — banner: **GREEN**

```
GREEN

ENDURANCE PREDATOR

Walk x 30-60 minutes + Sprint x 50-100m
```

> "Plan a 30 to 60 minute walk. Start walking. Every 5 to 10 minutes break out and sprint for 50 to 100m. The sprint should be an all-out effort. Pretend you're racing Usain Bolt for Olympic gold. Vary the time in between intervals, sometimes 5 minutes, sometimes 10, or anywhere in between. Don't get caught up in trying to sprint for precisely for a set distance. Roughly 50-100m is fine. If you come across a hill on your walk use it for a sprint interval. Trails or hilly terrain are perfect for this session." (p.103)

> "Optional: Do it with a weight vest (5-10lbs)." (p.103)

> "Skinny hardgainers stick to 30 minutes. Heavier/overweight trainees can do the full 60 if desired." (p.103)

(The phrase "sprint for precisely for a set distance" is the book's own wording, reproduced verbatim.)

---

## ANABOLIC SPRINTS (p.104) — banner as printed: **GREEN** (listed as **BLACK** on p.98 — see Ambiguities)

```
GREEN            <- banner as actually printed on p.104

ANABOLIC SPRINTS

Sprint x 30M
x 5-10 Rounds
```

> "Sprint as hard as you can for 30 meters. Walk back to start. Rest for a few moments. Repeat for 5 to 10 rounds. The key to this session is intensity. The sprint portion should be an all-out effort. Warm up with 5-10 minutes of low intensity jogging and/or run a couple sprints at 40-50% effort to ease your hamstrings and muscles into the session." (p.104)

> "Sprinting in this fashion stimulates an anabolic response by way of increased growth hormone, testosterone, and other positive biological factors. Don't let the simplicity of this session fool you – it packs a massive punch in terms of body composition, increased bone density, and cardiovascular performance." (p.104)

> "For those that are interested, this is one of several studies that outlines the benefits of brief sprints:" (p.104)

> https://www.ncbi.nlm.nih.gov/pubmed/21849912 (p.104)

Bulleted list beneath the link, exactly as printed:

- Improved aerobic and anaerobic performance
- Improved anabolic profile (promoted a favorable testosterone/cortisol ratio)

(p.104)

Note: rest between rounds is stated only as "Rest for a few moments" — no numeric rest or work:rest ratio is given. (p.104)

---

## RESET-20 (p.105) — banner: **BLACK**

```
BLACK

RESET-20

Sprint x 20 Seconds
Rest 2-5 Minutes
x 3-5 rounds
Alternate Exercises: Airdyne/Row/Heavy Bag
```

> "Perform the 20 second work interval at **maximum** speed and intensity. Maximum = don't hold anything in reserve. Rest for 2 to 5 minutes. Perform 3 to 5 rounds. Be well rested for each work interval. **Don't train for more than 15 to 20 minutes with this session.**" (p.105)

(The book's own bold on this page is on `maximum` in the first sentence. Bolding of the duration cap here is editorial emphasis of an implementation rule.)

---

## HILL SPRINTS (p.106) — banner: **BLACK**

```
BLACK

HILL SPRINTS

Hill Sprint
x 3-10 rounds
```

> "Self explanatory. Find a steep hill and sprint up it as fast as you can – maximum effort. The sprint portion should last **approximately 10-20seconds**. Walk back down the hill, rest for a minute or two and repeat. No more than 10 sprints or 15 minutes per session – whichever comes first." (p.106)

> "This can be performed on a flat surface/track as well. Simply sprint for 15-20 seconds. Rest for 2 to 3 minutes and repeat. Perform 5 to 10 sprints." (p.106)

(`approximately 10-20seconds` is bold in the book, and the missing space in "10-20seconds" is the book's own typography.)

Hill vs flat variant, side by side as prescribed on p.106:

| | Hill version | Flat surface/track version |
|---|---|---|
| Work | Sprint up a steep hill, maximum effort, approximately 10-20seconds | Sprint 15-20 seconds |
| Rest | Walk back down the hill, rest for a minute or two | Rest for 2 to 3 minutes |
| Rounds | Card says x 3-10 rounds; prose says "No more than 10 sprints or 15 minutes per session – whichever comes first" | Perform 5 to 10 sprints |

(p.106)

---

## FOBBITS (pp.107–108) — banner: **BLACK**

```
BLACK

FOBBITS

LSS x 2 Mins
Kettlebell Swings x 10
x 15-20 minutes
```

> "Like the Fobbits found in *Tactical Barbell II* with one caveat - duration is 15-20 minutes, no longer. The LSS portion is typically a slow jog on the treadmill. Every 2 minutes step off the treadmill and perform 10 kettlebell swings. Leave the treadmill running. When you get back on mentally calculate the next 2-minute mark for the next KB interval. Once the treadmill reaches 15-20 minutes, you're finished." (p.107)

> "The LSS portion isn't restricted to treadmill jogging. It can be skipping, rowing, cycling, shadow boxing, or even swimming should you have facilities that allow for it. The key is keeping the intensity low. Use the talk-test or stay roughly within 120-150BPM (LSS portion only)." (p.107)

> "Likewise, you're not restricted to kettlebell swings for the work interval. You can use push-ups, pull-ups, push-press, sledgehammer/tire drills etc. No need to stick to one exercise either. One popular use of conventional Fobbits by military personnel is to cycle between push-ups, pull-ups and sit-ups. Keep in mind with the MASS protocol Fobbit you're restricted to 20 minutes so the more variety you have the less volume you'll have with each different movement. At the end of the day it doesn't matter because the focus is on mass building, not getting better at push-ups and kettlebell swings. In this context Fobbits are used for general conditioning, so incorporate as much or as little variety as you like." (pp.107–108)

Page 108 contains only the tail of that final sentence: "general conditioning, so incorporate as much or as little variety as you like." (p.108)

---

## MISCELLANEOUS (pp.109–111)

Chapter opens with the centred heading `MISCELLANEOUS`. (p.109)

> "Your body is an adaptive machine. It will become what you do most." (p.109)

> "Signal – Response." (p.109)

> "If you move your body for extensive periods of time you are signalling that adaptive mechanism to become more efficient at moving for extensive periods of time. The body responds by manipulating its biology to become better at locomotion. One way it adapts is by shedding excess weight. That weight might be fat, muscle or a bit of both. The body doesn't discriminate as much as we'd like." (p.109)

> "That said, I'll be the first to tell you that you *can* put on muscle while doing all kinds of cardio. Fighters and other weight class athletes frequently do it. Eating to account for the extra activity and having the experience to know how to manage your training can get you there. But many find muscle building challenging without any extra activity at all. If you've always been a bit of a hardgainer – now is not the time to get greedy and try to train everything at once. Narrow your focus and work on one objective at a time without throwing up self-imposed obstacles. Without a doubt someone will write to me or post on a forum, '*I want to add 50lbs of muscle but also want to simultaneously train to be a special-forces-ninja-ultra-marathon-runner*'. To which I will say first add your 50lbs of muscle. Then start working on that ninja-endurance. There's an easy way, and a stupid way." (p.109)

> "Don't fight your biology. Get out of your own way and make *all* your activity align with the same goal. Once you've achieved that goal – then you can pivot and work toward something else." (pp.109–110)

## EXTRA-CURRICULAR ACTIVITY (pp.110–111)

> "You're going to find it challenging to gain substantial muscle mass if you're also participating in serious extra curricular activities like MMA, sports, extra PT etc. **I recommend limiting or dropping said activity until your target weight is met.** It'll affect you in two ways:" (p.110)

Numbered list, exactly as printed:

1. Burn calories
2. Fatigue will carryover to lifting sessions and vice versa. Hypertrophy lifting sessions are higher volume by nature.

(p.110)

> "Since food is where most people fail when it comes to building muscle mass, you'll have to be ultra disciplined and ensure you're not only replenishing calories lost through extra activity, but also eating surplus to grow muscle mass." (p.110)

> "The lifting sessions in this book are higher volume, designed to trigger hypertrophy. Higher volume training causes fatigue, both acute and residual through the week. Likewise, if you're doing some serious MMA training more often than not you're going to be tired, beat-up and sore. Walking into the gym the following day for General Mass training isn't going to be pleasant. At the end of the day you get to decide how important it is to put on that extra mass – do you want it enough to put other activities on hold? Or at the very least limit them drastically? Maybe now isn't the best time for a hypertrophy phase." (p.110)

> "In some cases, it might be unavoidable. Think unit PT. A couple workarounds to make it easier:" (p.110)

Numbered list, exactly as printed:

1. Treat any extra activity as conditioning. Anytime you do that extra-curricular activity it counts as one conditioning session. Cross off one Green/Black session for that week. You may have to drop Green/Black completely. So be it. (p.110)
2. Calories, calories, calories. Eat extra food. Eat enough to replenish the calories lost during your activity and eat extra on top of that to grow muscle. Stay on top of your protein intake. (p.111)

> "It can be done, but it's going to be a bit of a slog. You've been warned." (p.111)

## CONDITIONING RECAP (p.111)

Reproduced line for line as printed:

```
CONDITIONING RECAP

Use the Green sessions with General Mass.
Use the Black sessions with Specificity.
No more than 3 Green Sessions per week.
No more than 2 Black sessions per week.
Green Sessions shouldn't exceed 60 minutes.
Black Sessions shouldn't exceed 20 minutes.
```

(p.111)

---

## Implementation consequences

Facts an app must encode, each with its page anchor.

### Weekly counting

- Green: **1 to 3 sessions per week, no more than 3** (p.99, p.111). Black: **1 to 2 sessions per week, no more than 2** (p.99, p.111). The lower bound is stated as "Perform 1 to 3 / 1 to 2", so the book prescribes **at least one** session per week in each phase (p.99); the recap only restates the upper bound (p.111).
- Which category is active is **determined by the lifting phase, not chosen by the user**: Green with General Mass (Mass Template 1 & 2, Gladiator, Fighter HT), Black with Specificity (Alpha, Bravo) (p.98, p.99, p.111).
- **A 10-minute Recovery Run used as a pre-/post-lifting warm-up or cool-down does not count against the weekly total** (p.102). Two of them (10 min before + 10 min after) still count as zero sessions (p.102).
- **Any extra-curricular activity counts as one conditioning session** and crosses off one Green/Black session for that week; it may consume the entire weekly allowance (p.110).

### Scheduling relative to lifting days

- **Green sessions may be placed on lifting days or non-lifting days** (p.99).
- **Black sessions must be placed on non-lifting days** (p.99). This is the only hard day-placement constraint in the chapter, and it means a Specificity week must have at least one non-lifting day free for each Black session scheduled.
- No day-of-week grid, no "Day 4/Day 5" mapping and no ordering rule (before vs. after lifting) is given for conditioning anywhere in pp.94–111.

### Duration caps

| Rule | Value | Page |
|---|---|---|
| Green session duration | Shouldn't exceed 60 minutes | p.111 |
| Black session duration | Shouldn't exceed 20 minutes | p.111 |
| Recovery Run absolute cap while hypertrophy is the objective | 30 minutes | p.102 |
| Recovery Run cap for hardgainers | 20 minutes | p.102 |
| Endurance Predator for skinny hardgainers | 30 minutes (not the full 60) | p.103 |
| Reset-20 total session time | Don't train more than 15 to 20 minutes | p.105 |
| Hill Sprints total session time | No more than 10 sprints **or** 15 minutes per session – whichever comes first | p.106 |
| Fobbits total session time | 15-20 minutes, no longer | p.107 |

Note the Black caps are not all mutually consistent with the recap's flat "20 minutes" — Hill Sprints caps at 15 minutes/10 sprints (p.106) while Reset-20 and Fobbits allow up to 20 (pp.105, 107). Anabolic Sprints has **no** stated time cap at all, only a round count (p.104).

### Per-session parameters an app would need

| Session | Category (per p.98) | Work | Rest | Rounds | Intensity | Alternates / options |
|---|---|---|---|---|---|---|
| Walk | Green | Walk x 30-60 Minutes | — | — | not stated | — |
| Ruck | Green | Ruck x 30-60 minutes, continuous, load 10-50lbs (30lbs "the sweet spot for most") | — | — | not stated | Weight vest in place of a ruck (p.101) |
| Recovery Run | Green | Run x 20-30 minutes (hardgainer: cap 20) | — | — | Relaxed pace; talk-test; conversation and/or nose-breathing | Cycle/Swim/Row (p.102) |
| Endurance Predator | Green | Walk x 30-60 minutes + Sprint x 50-100m every 5 to 10 minutes | Walking is the recovery; vary interval 5–10 min | Not numbered — determined by walk length | Sprint = all-out effort | Optional weight vest 5-10lbs (p.103) |
| Anabolic Sprints | Black (but see banner note) | Sprint x 30M | Walk back to start, "rest for a few moments" | x 5-10 Rounds | All-out effort | Warm-up: 5-10 min low intensity jogging and/or a couple sprints at 40-50% effort (p.104) |
| Reset-20 | Black | Sprint x 20 Seconds | Rest 2-5 Minutes | x 3-5 rounds | Maximum speed and intensity; "don't hold anything in reserve" | Airdyne/Row/Heavy Bag (p.105) |
| Hill Sprints | Black | Hill sprint approx. 10-20seconds (flat variant: 15-20 seconds) | Walk back down + rest a minute or two (flat: 2 to 3 minutes) | x 3-10 rounds (flat: 5 to 10 sprints; cap 10 sprints or 15 min) | Maximum effort | Flat surface/track version (p.106) |
| Fobbits | Black | LSS x 2 Mins + Kettlebell Swings x 10, alternating | No dedicated rest — LSS is the recovery | Repeat for x 15-20 minutes total | LSS portion low: talk-test or roughly 120-150BPM | LSS: skipping/rowing/cycling/shadow boxing/swimming; work interval: push-ups, pull-ups, push-press, sledgehammer/tire drills; may cycle several (p.107) |

Units are as printed and deliberately **not** converted: loads in **lbs**, sprint distances in **m/M**, heart rate in **BPM**.

### Other

- Conditioning content from *Tactical Barbell II* must **not** be used with this protocol — including the TB II versions of Green/Black and the TB II Fobbit (pp.95, 98, 107).
- Adjacent context outside this range: during Bridge Week the book allows walking, hiking, swimming, yoga and stretching, and says to avoid weights, HIC and E, with easy body weight circuits allowed (p.93). That is the only place in the surrounding text that restricts conditioning by week type.

---

## Ambiguities and choices

1. **The p.104 ANABOLIC SPRINTS banner says GREEN, but the p.98 table lists Anabolic Sprints under BLACK.** This is not a transcription error: at the PDF object level, pp.100, 101, 102, 103 **and 104** all reference the same GREEN banner image (xref 1408), while pp.105, 106, 107 reference the BLACK banner (xref 1553). The two statements conflict and the book never reconciles them. **Not resolved here.** Consequence: if Anabolic Sprints is Green it would be paired with General Mass and allowed on lifting days; if Black, it is Specificity-only and non-lifting-days-only. Its own text ("stimulates an anabolic response", all-out sprints) matches the Black description on p.99, and the p.98 table and the count of four-per-column both point to Black.
2. **No numeric rest is given for Anabolic Sprints** — only "Walk back to start. Rest for a few moments." (p.104). No work:rest ratio and no session time cap are stated for this session.
3. **Hill Sprints round count is stated three different ways on one page**: the card says `x 3-10 rounds`, the hill prose says "No more than 10 sprints or 15 minutes per session – whichever comes first", and the flat-surface variant says "Perform 5 to 10 sprints" (p.106). The book does not say which governs.
4. **Black duration cap conflict**: the recap says Black sessions shouldn't exceed 20 minutes (p.111), but Hill Sprints caps at 15 minutes (p.106) and Reset-20 says "don't train for more than 15 to 20 minutes" (p.105). Whether 15 or 20 is the operative Hill Sprints limit is left to the reader.
5. **"1 to 3" vs "No more than 3"** (p.99, p.111): p.99 gives a range implying a minimum of one session per week; the recap on p.111 states only the maximum. Whether conditioning is **mandatory** (at least 1/week) or **optional** (0 allowed) is never stated outright. The extra-curricular workaround explicitly permits dropping Green/Black completely — "You may have to drop Green/Black completely. So be it." (p.110) — which is the only place the book sanctions zero sessions.
6. **Green day placement is a free choice** — "Sessions can be conducted on non-lifting or lifting days" (p.99). The book gives no preference and no rule about same-day ordering relative to the lift.
7. **No rule about spacing Black sessions.** With up to 2 Black sessions per week on non-lifting days, the book does not say whether they may be on consecutive non-lifting days.
8. **Session selection is unconstrained.** Within a category the book never says which of the four sessions to pick, whether to rotate them, or whether repeating one all week is acceptable.
9. **Author's own recommendations, recorded as such:**
   - **Author's recommendation (p.110):** "I recommend limiting or dropping said activity [MMA, sports, extra PT] until your target weight is met."
   - **Author's recommendation (p.101):** for the Ruck load range 10-50lbs, "30lbs is usually the sweet spot for most."
   - **Author's stated preference (p.95):** "drop everything you learned about conditioning in Tactical Barbell II"; use only the sessions in this book (p.98).
   - **Author's choice among options (p.102/103):** hardgainers take the low end — Recovery Run capped at 20 minutes, Endurance Predator at 30 minutes; heavier/overweight trainees may take the full 60 on Endurance Predator.
10. **Weight-vest options are optional, not prescribed**: Ruck may be replaced by a weight vest (p.101); Endurance Predator vest is explicitly "Optional: ... (5-10lbs)" (p.103).
11. **Fobbits work-interval substitution is open-ended** (p.107) — push-ups, pull-ups, push-press, sledgehammer/tire drills, or a cycle of several; no rep counts are given for substitutes, only the kettlebell swing's x 10.
12. **"LSS" is used without expansion** in this chapter (p.107). The book assumes the TB II term.
13. **The four principles (pp.96–97) are stated as design rationale, not as checkable rules.** Nothing in them is quantified; they justify the session list rather than constrain user choices.
14. Page numbers in the images filenames match PDF pages, but the banner images are shared across pages, so `p100_1.png` through `p104_1.png` are byte-identical, as are `p105_1.png` through `p107_1.png`. Reading only the image files (rather than the rendered pages) cannot distinguish which session a banner belongs to.


---

# 08 — Nutrition & Supplements (PDF pp. 112–138)

Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`.
All page references below are **PDF page numbers of that exact file**, in the form `(p.120)`.
Covers Part VI Nutrition (Nutrition, Macronutrients, Two Simple Formulas, Real Life, 3 Common Mistakes, The Iron Mike (Inspired) Diet, Summary) and Part VII Supplements (Supplements, Level 1, Level 2).

Images transcribed for this range: `docs/MASS/images/p120_1.png`, `p121_1.png`, `p123_1.png`, `p125_1.png`, `p132_1.png`. Two of them (`p120_1`, `p121_1`) are the **formula boxes** — the actual arithmetic of the diet exists ONLY as images; the text layer of pp.120–121 contains the surrounding prose but not the boxes. `p123_1` is the macro-content food table. `p125_1` and `p132_1` are callout banners.

---

## PART VI — NUTRITION

## Nutrition (part-opening epigraph, p.112)

The part-opening page carries only the section title and an epigraph (p.112):

> "Carbs are your friend!"
> — Dwayne 'The Rock' Johnson

## Nutrition (pp.113–114)

The author opens by declining to be dogmatic (p.113):

> "I'm not going to get too dogmatic about nutrition here. I'm simply going to present the method that we use to consistently get results when it comes to hypertrophy."

**The two mandatory rules**, reproduced verbatim including the book's own bold-style emphasis on MUST (p.113):

> "However, there are two rules you MUST follow to be successful with this protocol:
> 1. Eat the prescribed amount of protein every day.
> 2. Eat the prescribed number of total calories every day."

**The third item — explicitly NOT called a rule** (p.113):

> "There's a third rule which I really don't want to call a rule because you might be able to get around it and still be somewhat successful. Let's call it a very strong recommendation. Following it will make mass building faster and easier;
>
> **EAT CARBS**"

Rationale and warning (p.113):

> "This isn't Skinny Protocol or Caveman Dinosaur Ancestral Diet Protocol. This is Mass Protocol. If you restrict carbs, there's a good chance you'll fail or get subpar results. If you're ultra-disciplined and can meet your daily calorie requirements without carbs – you still might have a challenging time finding the energy to power through the training. The work in this protocol is primarily glycogen based (high volume weight training) which is fueled by carbohydrate."

> "I'm not saying it can't be done, but bottom line I can't guarantee your results if you limit carbs. You've been warned." (pp.113–114)

---

## Macronutrients (pp.115–119)

> "Protein, carbohydrate, and fat are macronutrients, aka macros." (p.115)

### PROTEIN (pp.115–116)

The book's four numbered claims for protein, verbatim (p.115):

> "Protein is a very important macro in this protocol;
> 1. Protein builds muscle
> 2. Protein spares muscle
> 3. Protein repairs muscle
> 4. Protein attenuates decreases in performance that occur during intense progressive training"

Supporting points:

- **Builds muscle** — the house/building-material analogy: "If your body is a house, protein is the building material – bricks, stone, concrete, wood etc. You can't build a house without material, regardless of how many construction workers you have standing around. The bigger and sturdier you want to build that house -the more material you're going to need. It's that simple. The evidence is overwhelmingly in favor of high protein intake to optimize muscle growth." (p.115). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/22958314`, quoted conclusion: "'An increase in dietary protein favorably effects muscle and strength during resistance training.'" (p.115)
- The author explicitly privileges field evidence over studies: "Forget the studies. We have a massive test population consisting of bodybuilders and physique competitors that have been systematically repeating the process of growing muscle for decades. That community is practically unanimous in the importance of increased protein intake. I'll take that kind of field evidence over the occasional counter-study anytime." (p.116)
- **Spares muscle** during training and/or weight loss — "Muscle is preserved, ensuring that most of the weight you lose is fat" (p.116). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/19927027/`
- **Repairs muscle** — "'protein synthesis' wherein new (muscle) tissue is added and damaged muscle is repaired." (p.116)
- **Attenuates performance decreases** — study of endurance athletes on high-protein vs normal diets over a three-week training block: "The 'normals' experienced a decrease in performance as the training block progressed, whereas the high protein group did not. Additionally, they experienced less psychological stress than the normals." (p.116). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/20798660`

### CARBOHYDRATE (pp.116–119)

The book's five numbered benefits, verbatim across the page break (pp.116–117):

> "Here are some of the benefits carbs provide in the context of hypertrophy;
> 1. Carbs fuel muscle
> 2. Carbs spike insulin, promoting anabolism
> 3. Carbs protect thyroid function
> 4. Carbs protect testosterone
> 5. Carbs spare protein/muscle tissue during training"

- **Fuel muscle** — "Carbs are stored as ATP/glycogen in the liver and muscle. Weight training relies heavily on glycogen for energy." Fat is "excellent for fueling long duration low intensity activity like distance running." The book concedes: "You might even be able to get away with low-carb for minimalist/low volume strength training – but with added volume and intensity it becomes a different ballgame. If you don't feel it during your first week, chances are you'll feel it by week 2 or 3." Early low-carb weight loss is "mostly water and glycogen" (p.117). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/10364416`
- **Spike insulin** — "Insulin is an anabolic hormone that acts as a growth signal… Restricting carb intake restricts insulin release." (p.117). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/9694422`
- **Preserve thyroid function** — "T3 is an active thyroid hormone… Studies show that low-carb diets reduce levels of T3. What this means for you is a feeling of sluggishness, weight management issues, and mood disturbances." (p.118). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/6761185`
- **Protect testosterone** — "testosterone and other anabolic hormones go down in the low-carb group, while cortisol levels go up." (p.118). Cited: `https://www.ncbi.nlm.nih.gov/pubmed/11402256`
- **Spare protein and muscle** — "Research shows that carb restriction can result in muscle loss even if protein intake is adequate. Let that sink in." (p.118). Cited: `https://www.physiology.org/doi/full/10.1152/japplphysiol.00108.2009?view=long&pmid=20489032&`

The author's framing rule (p.118):

> "Instead of thinking of it as 'low-carb' or 'high-carb', thing of it as 'adequate-carb for the job'. It's all about the right tool for the right job. Lower carb diets are a good fit for low intensity and/or low volume training."

And the explicit cross-protocol placement (pp.118–119):

> "Low carb aligns well with Base Building, or even standard Operator template with minimal sets. **Low-carb doesn't play well with Mass Protocol.**"

### FAT (p.119)

Full text of the FAT section (p.119):

> "Fats are essential for hormonal production/support, vitamin/mineral absorption and energy. 1 gram of fat contains 9 calories versus the 4 provided by a gram of protein or carbohydrate. 'Hormonal support' includes the production of testosterone."

---

## Two Simple Formulas (pp.120–122)

### Which formula applies (p.120)

> "We use two different calculations depending on if you're starting this program under- or overweight:"

| Formula | Applies to (verbatim from p.120) |
|---|---|
| **The STANDARD Formula, for:** | Skinny/hardgainers<br>Mesomorphs/athletic builds<br>Average builds |
| **FORMULA 2, for:** | Those starting out overweight/chubby/fat |

### STANDARD FORMULA

**Unit statement, verbatim (p.120):** "BW = bodyweight in **lbs**."

Prose statement of the standard formula, running across the page break (pp.120–121):

> "Multiply your current bodyweight by 1.3 for your daily protein requirement in grams. Multiply your bodyweight by 2 for carbs. Divide your body weight in half for fat intake. Too easy."

**Formula box, transcribed cell for cell from `images/p120_1.png` (p.120):**

```
1.  BW x 1.3 = Daily Protein Intake (grams)

2.  BW x 2 = Daily Carbohydrate Intake (grams)

3.  ½ BW = Daily Fat Intake (grams)
```

### FORMULA 2

**Formula box, transcribed cell for cell from `images/p121_1.png` (p.121):**

```
1.  BW x 1.3 = Daily Protein (grams)

2.  BW x 1 = Daily Carbohydrate (grams)

3.  1/3 BW = Daily Fat (grams)
```

> The "FORMULA 2" heading on p.121 is followed by **this box only** — the book gives no accompanying prose sentence for Formula 2 and no worked example of it. See "Ambiguities and choices".

### Calorie conversions (p.121)

Verbatim block (p.121):

```
1 Gram of Protein = 4 Calories
1 Gram of Carbohydrate = 4 Calories
1 Gram of Fat = 9 Calories
```

### EXAMPLE — the author's own worked example (pp.121–122)

> "Here's an example with the Standard formula using a 185lb trainee:" (p.121)

Arithmetic exactly as printed (p.121):

```
185 x 1.3 = 240
185 x 2 = 370
185 divided by 2 = 92
```

Resulting daily grams (p.121):

| Macro | Grams/day |
|---|---|
| Protein | 240 grams |
| Carbs | 370 grams |
| Fat | 92 grams |

Resulting daily calories (p.122):

| Macro | Calories/day |
|---|---|
| Protein | 960 calories |
| Carbs | 1480 calories |
| Fat | 828 calories |
| **Daily Total** | **3268 calories** |

The author's comment on the size of that number (p.122):

> "Seem like a lot? It is. If you want to build unnatural amounts of muscle – you'll have to eat unnatural amounts of food. It's that simple. If you want to do it your way with less protein or a lower overall calorie intake – fill your boots. But I don't know if you'll be successful."

**Implementation note (rounding):** 185 × 1.3 = 240.5, printed as **240**; 185 ÷ 2 = 92.5, printed as **92**. Both half-values are rounded **down** to whole grams (p.121). The calorie figures then follow from the rounded grams: 240×4 = 960, 370×4 = 1480, 92×9 = 828, total 3268 — all four figures reproduce exactly (pp.121–122). These are printed worked examples and are usable directly as test fixtures.

### TROUBLESHOOTING (p.122)

Verbatim, in full, because it is a decision procedure (p.122):

> "Assess yourself after a month or two. If you're not gaining muscle add an extra 300-500 calories daily. That's the size of a meal and should roughly consist of 30% protein, 30% fat, and 40% carbohydrate. If you're still not gaining after a month - add another 300-500 calories/repeat as necessary. On the other hand, if you're gaining weight but there's a little too much fat coming along for the ride – check your macros. Are you eating enough protein/with carb and fat in balance? If you're consistently going too high with fat or carb bring them back in range. If you're in range switch to Formula 2. Reassess after a month or two. If you're still getting chubby - scale back overall calories by 300/day. Reassess body composition after a month. Repeat as necessary."

As a decision flow (structure only — wording above is authoritative):

1. Assess after **1–2 months** (p.122).
2. **Not gaining muscle** → add **300–500 cal/day**, split roughly **30% protein / 30% fat / 40% carbohydrate**. Still not gaining after **a month** → add another 300–500 cal/day, repeat as necessary (p.122).
3. **Gaining weight but too much fat** → check macros (enough protein, carb and fat in balance). If consistently too high on fat or carb → bring back in range. **If already in range → switch to Formula 2.** Reassess after 1–2 months (p.122).
4. **Still getting chubby** → scale back overall calories by **300/day**. Reassess body composition after a month. Repeat as necessary (p.122).

### I'M GONNA DO IT MY WAY (p.122)

> "You are welcome to use another calculator or different nutrition program. Keep in mind when choosing that your goal is to eat for muscle mass, not for weight loss, health, etc."

---

## Real Life (pp.123–125)

> "When it comes to nutrition - numbers, formulas and calculations are off-putting. Your eyes probably started to glaze over while reading the previous chapter. Unfortunately, numbers are exactly where the average bear tends to fail in the quest for mass. It can help immensely to know what those numbers look like on your plate." (p.123)

**Restatement of the standard formula (p.123)** — note this restatement quotes an addition of **500** calories, not 300–500:

> "The standard mass-building formula is simple. Multiply your bodyweight x 1.3 for grams of protein, and x 2 for carb. Divide your bodyweight in half for fat. That's it. Those three numbers are all you need to know. **If you're not putting on weight after a month or two, add another 500 calories per day using the same ratio.** Repeat as necessary."

### Macro-content food table — transcribed cell for cell from `images/p123_1.png` (p.123)

Introduced by: "Your life will get a whole lot easier by knowing the gram content of a few simple macros that you can eat repeatedly:" (p.123)

| PROTEIN | CARB | FAT |
|---|---|---|
| Chicken Breast 30-40g | Cup of Rice 40-45g | Cup of Almonds 55g |
| Can of Tuna 25-30g | Cup of Pasta 40-45g | Cup of Walnuts 70g |
| Salmon Fillet 20-25g | ½ Cup of Oatmeal 30g | 1 Tbsp Peanut Butter 8g |
| 6oz Steak/beef 40g | Slice W/Wheat Bread 10g | 1 Tbsp MCT Oil 14g |
| 1 Egg 6-7g | *(no fifth row)* | 1 Egg 5g |

> The CARB column has four entries; PROTEIN and FAT have five each. Column headers are printed as **PROTEIN / CARB / FAT**, and the prose immediately after refers to them as **Column A / Column B / Column C** (pp.123–124).

### How to build a meal (p.124)

> "Pick your poison from Column A, combine it with an item from Column B, and sprinkle in a little something from Column C. Add a fistful of greens/veggies. That's your meal. Repeat throughout the day until you hit your target macros. Fill in deficiencies with protein/meal shakes. If there's something you eat regularly that's not on the list, figure it out. Nowadays with smartphones there's absolutely no excuse when it comes to calculating macros."

**The "err high" rule, verbatim (p.124):**

> "Take care of the broad strokes. Don't worry about that extra 2 grams of protein your slice of bread has. Treat bread like a carb source and disregard the protein content. **Never eat under your target. Always err on the side of eating more than your daily total.** If in doubt, eat an extra meal or snack. Getting more than required is a bonus. Gaining mass isn't like weight-loss – you can get sloppy with extra calories. The Mass Protocol workload/conditioning will trim the excess."

### TIPS/TRICKS (pp.124–125)

- Scale of the protein target, in food terms (p.124): "Our 185lb-er looking at that list is probably thinking 240 grams of protein is a LOT of meat. Correct. **That's about 6 or 7 chicken breasts, or 4 or 5 steaks.**"
- Hugh Jackman / Wolverine reference: "the most challenging aspect was scarfing down enormous amounts of steak and chicken every day. The theme that surfaces is; steak, chicken breast, squats, deadlifts, repeat." (p.124)
- **Protein powder arithmetic, verbatim (p.124):** "Continuing with our 185lb example-trainee, a **50-gram protein shake in the morning, post-workout, and before bed provides 150gms.** That leaves you with 100gms to get from solid food which can easily be divided between three or four meals."
- "Protein shakes don't have to be complicated. Protein + water will do anytime you're falling short for the day. You can do the same with carbs. Get a high-quality carb supplement and include it in your protein shake. If you can't always do shakes, use bars." (pp.124–125)

**Callout banner, transcribed from `images/p125_1.png` (p.125)** — bold as printed:

> Regardless of supplementation, make sure **at least three of your meals** are from whole food sources.

Followed by (p.125):

> "In theory it shouldn't matter – but in real life whole foods seem to provide a better result than powders and bars."

**The cheat-day rule, verbatim (p.125):**

> "You are free to have a cheat day every week. Order a pizza, have burgers or ice cream. Eat as much as you like. However - make sure you hit your minimum protein intake even on cheat days."

---

## 3 Common Mistakes (pp.126–129)

The three, verbatim (p.126):

> "1. Not counting calories.
> 2. Not eating enough on a daily-basis.
> 3. Not paying attention to macro intake – particularly protein."

Framing: "Time and time again these are the three most common problems we encounter when trainees struggle to put on quality mass. Key word being quality." (p.126)

### 1. NOT COUNTING CALORIES (pp.126–127)

> "You're probably not as good at estimating your daily food intake as you think. 9 times out of 10 clients training for hypertrophy under-eat big time. They're usually surprised when we force them to count calories." (p.126)

**The author's own recommended method, verbatim (p.126):**

> "Count your calories for a few days, a few weeks, or a few months. Whatever it takes for you to get an accurate picture of how much you need to eat every day while running Mass Protocol. **The easy way to do this is to put together 3 to 5 meals. Measure/count the calories in those meals. Then cycle through those same meals everyday until your target weight is met.** You can cheat once a week with an endless variety of food, so it's not really that hard to stick to, psychologically speaking. As time goes on, you won't have to measure or count – you'll be able to eyeball it when putting your meals together. Until then – measure."

> "Eating for hypertrophy is so much easier than eating for weight-loss. There's no issue with going over your limit by a few hundred calories. No hunger, no lack of energy, no need for extreme OCD – all too easy." (pp.126–127)

### 2. NOT MEETING CALORIES ON A DAILY-BASIS (p.127)

> "Some people hit their daily total once, twice or three times a week and then slack off for the remainder. They haven't really grasped the importance of how important consistent-quantity is when it comes to building enormous amounts of muscle tissue. **Eat your minimums every single day. Be consistent. If it comes down to it, always err on the side of overeating rather than under-eating.**"

> "The combined strength and conditioning work in this protocol is going to make staying lean much easier. If you don't have the discipline to eat the required amount every day, then prepare to fail. It's really not that difficult." (p.127)

**The weekly-total concession, hedged by the author (p.127):**

> "If you fall short a day or two, it's not the end of the world. Make up for the lost calories over the following days. There is some indication that meeting your calorie requirements for the week is as good as meeting them daily - **but tread cautiously here and don't make it a habit.**"

### 3. NOT PAYING ATTENTION TO MACROS (pp.127–129)

> "I can't stress this enough; when it comes to muscular hypertrophy and mass building – **PROTEIN IS KING.**" (p.127)

The diagnostic anecdote, verbatim (p.127): a client "gaining weight and strength but he's tubby and unhealthy looking. Kind of soft." Calories are met; protein is not — "He might need to hit 220 grams per day but he's getting 120 if he's lucky. His macro intake is skewed in the direction of fat and carb, and his body composition reflects that."

> "It's easy to get big, not as easy to get big with an aesthetically pleasing body composition. Instead of spending your time worrying about if the overhead press is more 'functional' than the bench press think about getting your protein intake right every day." (p.128)

**Protein source guidance, verbatim (p.128):**

> "Get the most bang-for-buck when choosing protein sources, pick high-yield foods; chicken breast, steak, beef, fish, and the like. Fill in the gaps with eggs, peanut butter, etc."

**On low-carb/keto (p.128):**

> "Another issue that overlaps/falls in this category is trying to build muscle on a carb-restricted or keto diet. It's possible, but difficult… Some of our clients can get away with low or moderate carb with our performance-based templates like Operator but not with our mass building protocols, so I don't recommend using Operator template as your litmus test. Building strength and building muscle size are two different animals."

The two exception groups the author names (p.128): "Outliers, aka a small percentage of the population that naturally thrive on low carb, and those that are on testosterone/TRT or steroids."

**On the dietary-fat/testosterone trend (pp.128–129):**

> "Lately there's been this big dietary fat = testosterone trend. Yes, a certain level of fat is required for hormonal support/production. Beyond that, unless you're in ketosis, it's going to go right to your waistline along with all the other excess calories. Probably more so the fat, because the lifting component of this program utilizes glycogen, not fat, as a primary fuel source. **Trying to eat a ton of extra dietary fat to jack up testosterone is NOT going to translate to into any significant muscle mass. Protein is higher on the food chain than fat when it comes to muscular hypertrophy.**"

> "Yes, go forth and eat enough fat to support and promote hormonal health – no one's stopping you. Fat isn't evil. But there's no need for anything over and above." (p.129)

**Bottom line (p.129):**

> "Bottom line, if you're getting bigger and stronger, but have a thick layer of fat all over your body – that's probably an indication that you're not paying close enough attention to your macros, particularly protein. We're not going for the big and fat look here. Think Tom Conlon, not Tommy Boy. Don't settle for anything less."

---

## The Iron Mike (Inspired) Diet (pp.130–131)

Framing (p.130):

> "Eating for mass doesn't have to be complicated or expensive. If you're like me and hate spending precious time thinking about and preparing food – take a page from Mike Tyson."

**Tyson's training day as recounted by the author (p.130)** — descriptive background, not a Mass Protocol prescription:

> "In training, Iron Mike would start his day with a 3-mile run, followed by sparring and ring work over two separate sessions. Toward the end of the day he'd perform bodyweight resistance training consisting of 2000 sit-ups, 500-800 dips, 500 push-ups, and 500 barbell shrugs. 10 minutes of neck-work as a finisher. His evening consisted of 30 minutes of cardio before bed. This was done 6 to 7 days a week."

> "His nutrition revolved around three types of meals; oatmeal, chicken & rice, and steak & pasta. He drank fruit juice and milk." (p.130)

**The author's suggested meal set, verbatim and in the book's own numbering (p.130):**

> "Base your feeding around 3 or 4 simple meals, like this:
> 1. Beef and pasta
> 2. Rice and chicken
> 3. Oatmeal + 1-2 scoops whey protein + nuts + raisins
> 4. Eggs
> 5. Post workout/Pre-Bedtime protein/carb shake"

> The list is introduced as "3 or 4 simple meals" but contains **five** numbered items (p.130). Reproduced as printed.

**Practical preparation rules (pp.130–131):**

- "It's simple enough to cook up a big pot of pasta and rice to store in the fridge. Buy bulk chicken breast and beef. Grill or cook half a dozen breasts/portions and store them in the fridge. Freeze the rest. Stewing beef works well with pasta." (p.130)
- "Find one or two sauces/condiments that go well with rice and pasta." (p.131)
- "When it's time for a feeding, simply combine chicken breast with rice, or a portion of meat with pasta. **Measure the amount of beef initially so you know how much protein you're getting per serving.** Add a spoon or two from a fat source if required. If you're industrious you can prepare individual meals and store them in Tupperware. Freeze and thaw as needed." (p.131)
- "Keep a big bowl of veggies in the fridge. Fill it with broccoli, carrots, kale, nuts, or whatever you like. Dip into the bowl throughout the day. **Restock every 2-3 days.** Cheap ready-made bags of mixed veggies are abundant in most grocery stores." (p.131)
- "Remember, you get a cheat day once a week to deal with the mental monotony of eating the same meals every day." (p.131)

**Multivitamin — author's named recommendation (p.131):**

> "Take a multivitamin to cover off any deficiencies. Pure Encapsulations, Thorne, and Life Extension all produce quality vitamins/supplements. **I usually recommend Pure Encapsulations ONE to clients** – it's a simple one-per-day as the name implies, with effective amounts and forms."

---

## Summary (p.132)

Verbatim (p.132):

> "Eating for mass isn't rocket science. Know your numbers. Know what those numbers look like on your plate. Learn how to put together three or four meals that cover off those numbers. Eat those same 3 or 4 meals every day. Make up any shortages with powders or supplements. Deal with the boredom of monotonous eating habits by including a weekly cheat day."

> "Eating is usually what separates the success stories from failures. Most people spend hours, weeks, and even years researching and planning their training strategies. Yet they can't tell you how many grams of protein or carbohydrate they need, or what their total daily calorie intake is. Is this you? It was most definitely me at various times throughout my training life." (p.132)

> "If you're not used to meal discipline or calculating macros it might take a little effort initially. Soon enough it'll become habit and you won't give it a second thought. **Nutrition is usually where the average bear fails – not time spent in the gym or on the road.** Get a handle on it and you'll be well ahead of the curve, everything else will become easy." (p.132)

**Callout banner, transcribed from `images/p132_1.png` (p.132)** — italic as printed:

> *You should feel as guilty missing a meal as you do a training session*

---

## PART VII — SUPPLEMENTS

## Supplements (pp.133–134)

Page 133 is the part-divider page carrying only the word "SUPPLEMENTS" (p.133).

Framing and the two-level system, verbatim (p.134):

> "There are supplements that work, supplements that work for some people, and supplements that probably don't work for anyone. These are the supplements we recommend in the context of building mass.
>
> I've divided them in two lists, Level 1 and 2.
>
> **Level 1 = Will make a significant difference in training. Mandatory (if you have the budget/and cleared by your physician).**
>
> **Level 2 = Can make a difference. For some can provide great benefit, for others the effects might be negligible. Nice to have, but not necessary.**"

## LEVEL 1 (pp.135–136)

Order as printed: Creatine Monohydrate (p.135), Supplemental Protein Powder (p.135), Multivitamin (p.136).

| # | Supplement | Dose given | Page |
|---|---|---|---|
| 1 | Creatine Monohydrate | 5 to 10 grams once a day, every day (training and non-training days) | p.135 |
| 2 | Supplemental Protein Powder | no dose given | p.135 |
| 3 | Multivitamin | no dose given; brands named | p.136 |

### CREATINE MONOHYDRATE (p.135)

> "This one's a no-brainer for muscle building – unless you're a non-responder. And you won't know you're a non-responder unless you try it for at least a month or two without skipping doses. Most people I've met that say they're non-responders haven't used it long enough, or they expect it to feel like some sort of instantaneous pre-workout stimulant. You'll be missing out big-time if you give up on this supplement too soon."

**Dose, verbatim (p.135):**

> "**5 to 10 grams once a day, every day. On training and non-training days.** An effective way to dose is to add 5 grams to a post-workout shake along with a high glycemic carb source/powder like dextrose or juice. The insulin spike provided by the carb source should optimize uptake and absorption."

**Form (p.135):**

> "Stick to monohydrate. It's the version with the most scientific backing behind it. Avoid the 'new and improved' forms. For the most part they're just marketing ploys to differentiate the product. If you can – try and get the 'Creapure' version of monohydrate. Look for the 'Creapure' logo on the bottle. Creapure is carried by several major brands."

### SUPPLEMENTAL PROTEIN POWDER (p.135)

Full text (p.135):

> "To help you reach your daily protein intake with ease. If you can eat 4-5 steaks a day and get all your protein from whole foods, please do, and skip this."

### MULTIVITAMIN (p.136)

> "I don't normally recommend multis across the board, but gaining 10, 20 or 30 lbs of muscle is an unnatural and demanding task. Ensure your body has the nutrients/vitamins and minerals it needs to activate and operate all the physiological processes required to do the job. **Use a quality brand like Thorne, Pure Encapsulations, Carlson, AOR, or Life Extension.**"

> Note the brand list here (Thorne, Pure Encapsulations, Carlson, AOR, Life Extension — p.136) differs from the one in the Iron Mike chapter (Pure Encapsulations, Thorne, Life Extension — p.131). Only p.131 names a specific product (Pure Encapsulations ONE).

## LEVEL 2 (pp.137–138)

Order as printed: Caffeine (p.137), Citrulline Malate (p.137), Magnesium (p.138).

| # | Supplement | Dose given | Timing | Page |
|---|---|---|---|---|
| 1 | Caffeine | 100-200mg | 20-30 minutes before training | p.137 |
| 2 | Citrulline Malate | 4 to 6 grams | 30-45 minutes before training | p.137 |
| 3 | Magnesium | 200 to 300mg a day | not specified | p.138 |

### CAFFEINE (p.137)

> "Caffeine is actually a level 1 supplement for many - but if you've never used caffeine to train then there's no need to start. It won't directly impact mass gain. If you frequently use 'pre-workouts' then caffeine tablets are a simple, effective, and cheap substitute. Healthier too. Many pre-workouts contain questionable ingredients."

**Dose, verbatim (p.137):**

> "For the times you need a little extra energy use **100-200mg 20-30 minutes before training**. Clear it with your physician first."

### CITRULLINE MALATE (p.137)

> "Citrulline malate works exceptionally well at increasing work capacity and delaying fatigue."

**Dose, verbatim (p.137):**

> "Use **4 to 6 grams 30-45 minutes before training. Anything less may not be as effective.** Mass Protocol sessions are much more demanding than regular Tactical Barbell maximal-strength templates. Having work-capacity support can make a big difference."

**Alternative (p.137):**

> "An alternative to citrulline is beet powder/extract, which has a decent amount of scientific backing in terms of performance enhancement."

### MAGNESIUM (p.138)

> "Magnesium plays a role in hundreds of bodily functions relating to energy and other aspects of performance. The average diet tends to fall a little short of the daily allowance. Stimulants (including caffeine and energy drinks), stress, and high levels of activity deplete levels even further. Athletes or those using a program like Mass Protocol tend to have higher requirements."

**Dose and forms, verbatim (p.138):**

> "Use **200 to 300mg a day**. Glycinate and malate are two excellent forms of magnesium that are easily absorbed. Glycinate tends to be relaxing, while malate energizes. In some people glycine can actually be activating – something to keep in mind when considering dosing schedule."

**Adverse reaction guidance (p.138):**

> "There are some that respond poorly to magnesium, particularly glycinate. We've had the occasional client report feeling lethargic/depressed and de-motivated the day after taking 100-400mg of glycinate. Not an unusual reaction if you consider magnesium's role in the body as a kind of 'chill pill'. **If you react badly to glycinate, give malate a try before giving up completely.**"

---

## Implementation consequences (things the app could compute or track)

All of the following are directly computable from the book; none of it is inferred.

1. **Bodyweight input is in POUNDS.** The book states "BW = bodyweight in lbs" (p.120) and every worked example is in lbs (185 lb, pp.121–122). The book never gives a kg variant and never gives a conversion factor. Any kg-based UI must convert to lbs before applying the multipliers, or the results will be wrong by a factor of ~2.2.
2. **Two selectable formulas, chosen by starting body composition** (p.120) — Standard for skinny/hardgainer, mesomorph/athletic, average; Formula 2 for those "starting out overweight/chubby/fat".
   - Standard: `protein_g = BW × 1.3`, `carb_g = BW × 2`, `fat_g = BW ÷ 2` (p.120)
   - Formula 2: `protein_g = BW × 1.3`, `carb_g = BW × 1`, `fat_g = BW ÷ 3` (p.121)
   - Protein is **identical** in both formulas; only carb and fat differ.
3. **Calorie total is derived, not prescribed**: `kcal = 4×protein_g + 4×carb_g + 9×fat_g` (p.121). There is no independent calorie target in the book — the calorie number falls out of the macro grams.
4. **Rounding**: the book's own example rounds .5 gram values **down** to whole grams (240.5→240, 92.5→92, p.121), and computes calories from the rounded grams (p.122). Reproduce this to match the printed example.
5. **Test fixture available**: 185 lb, Standard → 240 g / 370 g / 92 g → 960 / 1480 / 828 kcal → **3268 kcal total** (pp.121–122). This is the author's own printed arithmetic and should be asserted directly.
6. **Formula 2 has no printed worked example** — no fixture exists for it. (For a 185 lb trainee it would be 240 / 185 / 61.67 g, but the book does not print this; do not treat it as book-sourced.)
7. **A troubleshooting state machine** exists (p.122): assess at 1–2 months → not gaining: +300–500 kcal/day at 30% protein / 30% fat / 40% carb, re-check monthly, repeat; gaining too much fat: verify macros in range, then switch to Formula 2, reassess at 1–2 months; still chubby: −300 kcal/day, reassess monthly, repeat. An app could track "weeks since last assessment" and "current calorie adjustment offset".
8. **Explicit rate/target metric is absent.** The book gives no lbs-per-week or kg-per-week gain target anywhere in pp.112–138. Its trigger conditions are qualitative ("not gaining muscle", "a little too much fat coming along for the ride", "still getting chubby", p.122) on a 1–2 month clock. Do not invent a numeric rate target.
9. **Trackable daily rules**: (a) hit protein every day, (b) hit total calories every day (p.113); (c) never eat under target, always err over (p.124); (d) at least 3 meals per day from whole food sources (p.125); (e) one cheat day per week, but minimum protein still required on cheat days (p.125); (f) if short a day or two, make up the calories over following days — weekly totals are a hedged concession, not a rule (p.127).
10. **Food-gram reference table** (p.123) is a fixed lookup table that could back a quick "what does this look like on a plate" helper; note the CARB column has only four entries.
11. **Supplement schedule is expressible as reminders**: creatine 5–10 g daily every day incl. rest days (p.135); caffeine 100–200 mg 20–30 min pre-training (p.137); citrulline malate 4–6 g 30–45 min pre-training (p.137); magnesium 200–300 mg/day (p.138). Level 1 vs Level 2 gives a priority ordering (p.134).

---

## Ambiguities and choices

1. **Formula 2 has no prose and no example.** On p.121 the heading "FORMULA 2" is followed only by the formula box image (`p121_1.png`); the very next line of body text is the "EXAMPLE" heading, which the book explicitly ties to the Standard formula ("Here's an example with the Standard formula using a 185lb trainee", p.121). So Formula 2's multipliers exist only in the image. Not resolved here — recorded as-is.
2. **Formula 2's unit is never restated.** "BW = bodyweight in lbs" is stated once, under STANDARD FORMULA (p.120). Formula 2's box just says "BW" (p.121). It is a reasonable reading that lbs carries over, but the book does not say so. Flagged, not resolved.
3. **300–500 vs 500 calorie increment.** Troubleshooting says "add an extra 300-500 calories daily" (p.122); Real Life restates it as "add another 500 calories per day" (p.123). The book does not reconcile these.
4. **The composition of the added calories also conflicts.** p.122 says the added meal "should roughly consist of 30% protein, 30% fat, and 40% carbohydrate"; p.123 says "add another 500 calories per day **using the same ratio**" — i.e. the ratio of the base formula, which for the Standard formula is not 30/30/40 (185 lb Standard is 960/1480/828 kcal ≈ 29% protein / 45% carb / 25% fat). The book does not say which governs.
5. **Whether the 30/30/40 split is by calories or by grams** is not stated (p.122). It is written as percentages of "the size of a meal" of 300–500 calories, which reads as calories, but the book does not say.
6. **Rounding rule is never stated**, only demonstrated. The example rounds .5 down twice (p.121). Whether that is a rule, floor, or just the author's arithmetic is unstated.
7. **"Assess yourself after a month or two"** (p.122) — no precise re-assessment interval, and no measurement method (scale weight, body composition, photos) is prescribed. The follow-up checks are stated as "after a month" for the not-gaining branch (p.122).
8. **"Switch to Formula 2" has no stated exit condition.** p.122 never says whether or when to switch back to Standard once body composition improves.
9. **Column labels differ from table headers.** The p.123 table is headed PROTEIN / CARB / FAT; the p.124 instructions call them Column A / Column B / Column C. The mapping A=Protein, B=Carb, C=Fat is the obvious reading given the printed left-to-right order, but the book never states it.
10. **"3 or 4 simple meals" followed by a 5-item list** in the Iron Mike chapter (p.130). Whether item 5 (the shake) counts toward the 3–4 is not stated.
11. **The two multivitamin brand lists differ** (p.131 vs p.136); the book does not indicate which is definitive.
12. **Caffeine's level is self-contradicted by design**: "Caffeine is actually a level 1 supplement for many" but it is printed under LEVEL 2 (p.137). The author's own placement is Level 2; recorded as the author's choice.
13. **Magnesium dose vs the adverse-reaction figure**: recommended dose is "200 to 300mg a day" (p.138) but the reported bad reactions are at "100-400mg of glycinate" (p.138), a range that straddles and exceeds the recommendation. The book does not comment on the overlap.
14. **Author's own recommendations, recorded as the author's** (not neutral options):
    - Eat carbs — "a very strong recommendation", not one of the two hard rules (p.113).
    - "Low-carb doesn't play well with Mass Protocol" (p.119) and don't use Operator as your litmus test for low carb (p.128).
    - "PROTEIN IS KING" (p.127); protein outranks fat for hypertrophy (p.128).
    - Prep 3–5 fixed meals and cycle them daily (p.126) / "three or four meals" (p.132).
    - At least three meals from whole food (p.125).
    - Weekly cheat day, protein minimum still enforced (pp.125, 131).
    - Creatine monohydrate, Creapure version if available (p.135).
    - Pure Encapsulations ONE multivitamin (p.131).
    - Caffeine tablets over commercial pre-workouts (p.137).
    - Try malate before abandoning magnesium if glycinate reacts badly (p.138).
15. **Medical gating is the author's own caveat**: Level 1 is "Mandatory (if you have the budget/and cleared by your physician)" (p.134), and caffeine is "Clear it with your physician first" (p.137). Any app surfacing supplement guidance inherits that caveat.


---

# 09 — Block Programming, OMS, Consolidation & FAQs (PDF pp. 139–160)

Source: `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`. All page references
below are **PDF page numbers of that file**, in the form `(p.142)`.

Every table in this range is an embedded image. The five block-sequence grids and the
one pull-quote in this range were opened and transcribed visually from
`docs/MASS/images/p140_1.png`, `p142_1.png`, `p142_2.png`, `p142_3.png`, `p143_1.png`,
`p144_1.png`. Nothing in this document is inferred from surrounding prose.

---

## Part VIII — BLOCK PROGRAMMING

Part title page: "BLOCK PROGRAMMING" (p.139). Chapter opens on p.140 with the same
heading.

### Framing (p.140)

> "Building a massive amount of muscle is a long-term project. The more consistent you
> are with training and nutrition the quicker your results will be. Depending on how much
> mass you want and where you're starting from it can take several months or several
> years." (p.140)

> "I'm going to recommend the first cycle of training for you. After that you can set-up a
> more customized ratio between General and Specificity as needed." (p.140)

> "This is the standard cycle, recommended for those using Mass Protocol for the first
> time:" (p.140)

### STANDARD CYCLE (p.140)

Heading printed above the table: **STANDARD CYCLE** (p.140).

Transcribed cell for cell from `images/p140_1.png` (p.140). The grid is 5 columns, one
header row and one body row; each body cell contains three stacked lines.

| Block 1 | Block 2 | Block 3 | Block 4 | Block 5 |
|---|---|---|---|---|
| General<br>6 Weeks<br>(Green) | General<br>6 Weeks<br>(Green) | Bridge<br>1 Week | Specificity<br>3 Weeks<br>(Black) | Specificity<br>3 Weeks<br>(Black) |

Literal cell contents, line by line (p.140):

- Block 1 — line 1 `General`, line 2 `6 Weeks`, line 3 `(Green)`
- Block 2 — line 1 `General`, line 2 `6 Weeks`, line 3 `(Green)`
- Block 3 — line 1 `Bridge`, line 2 `1 Week`, line 3 *(blank — no parenthesised
  conditioning label is printed for the Bridge block)*
- Block 4 — line 1 `Specificity`, line 2 `3 Weeks`, line 3 `(Black)`
- Block 5 — line 1 `Specificity`, line 2 `3 Weeks`, line 3 `(Black)`

Total printed length of the standard cycle as drawn: 6 + 6 + 1 + 3 + 3 = **19 weeks**
across five blocks (p.140). The book does not print this total; it is arithmetic on the
printed cells.

Immediately after the table (p.140):

> "After completing a standard cycle, reassess and determine if you need to change the
> ratio of time spent in General vs Specificity. Block 6 can be a bridge week between
> cycles or you can transition into something else immediately." (p.140)

**Implementation notes (p.140):**
- Block length is **not** a single fixed number. A General block is 6 weeks; a Specificity
  block is 3 weeks; a Bridge block is 1 week, in the Standard Cycle as printed.
- Conditioning is attached to the block, not to the session: General blocks carry
  `(Green)`, Specificity blocks carry `(Black)`. The Bridge block carries no label.
- A sixth block position exists and is optional: "Block 6 can be a bridge week between
  cycles or you can transition into something else immediately." (p.140)
- Base Building does **not** appear in the Standard Cycle table (p.140). Its position in
  the sequence is given only by the Consolidation checklist (p.147) and the OMS chapter
  (p.145) — see below.

### Choosing the General : Specificity ratio (p.141)

> "The average hypertrophy-seeker usually needs to start off by building overall size and
> musculature. The more overall mass you need to build, the more you'll benefit by
> spending time running General templates. General Mass is for overall size and bulk,
> Specificity is typically for sculpting and targeting lagging/weak areas. Both contribute
> to hypertrophy in their own way." (p.141)

> "Rule of thumb is to spend more time in General the farther away you are from your
> target weight." (p.141)

Worked example given by the author (p.141), quoted in full:

> "Let's say you're 160lbs and you want to hit 200. After a 5-block cycle you're at 175lbs.
> You're still too far off target to change things or spend extra time in Specificity. Your
> foundation isn't in place yet. You've moved up from a Miata to Jeep but you're still not a
> Humvee. Continue using a ratio that favors General over Specificity. You might use a 2:1
> ratio: 2 blocks of General + 1 Block Specificity, repeat. Throw in a bridge week as
> needed. Or continue repeating the Standard Cycle if you don't want to overthink it. Just
> to be clear, there's no need to get rid of Specificity completely, simply use a ratio that
> favors General > Specificity." (p.141)

> "Continuing with our example… After a few cycles you hit 195lbs. Now you're close enough
> to your target weight of 200 to start putting more time into Specificity if you wish.
> Work on accessory lifts and strengthen or grow lagging muscle groups. You could keep
> running Specificity indefinitely from that point on or change up the ratio to favor
> Specificity over General. Some examples of what favoring Specificity might look like:"
> (p.141)

Note: "After a 5-block cycle" (p.141) is the author's own name for the Standard Cycle of
p.140 — five blocks, Bridge included as one of the five.

### EXAMPLE 1 (p.142)

Heading printed above the table: **EXAMPLE 1** (p.142). Transcribed from
`images/p142_1.png`. 5 columns, one header row, one body row, one line per cell.

| Block 1 | Block 2 | Block 3 | Block 4 | Block 5 |
|---|---|---|---|---|
| General x 2 | Specificity | Specificity | Bridge | Specificity |

No week counts and no conditioning labels are printed in this table (p.142). "General x 2"
is printed literally in Block 1's cell (p.142).

### EXAMPLE 2 (p.142)

Heading printed above the table: **EXAMPLE 2** (p.142). Transcribed from
`images/p142_2.png`. 5 columns, one header row, one body row, one line per cell.

| Block 1 | Block 2 | Block 3 | Block 4 | Block 5 |
|---|---|---|---|---|
| Specificity | Specificity | Bridge | General x 2 | Specificity |

No week counts and no conditioning labels are printed in this table (p.142).

### Between EXAMPLE 2 and EXAMPLE 3 (p.142)

> "There's no rule that you must favor Specificity as you get close to your target weight.
> If you're happy with your progress and don't want to rock the boat, keep repeating the
> Standard Cycle." (p.142)

### EXAMPLE 3 (p.142)

Heading printed above the table: **EXAMPLE 3** (p.142). Transcribed from
`images/p142_3.png`. This grid has **four** columns, not five. In the printed image the
Block 1 cell's text `General` sits higher in the cell than the text in the other three
cells, which are vertically centred; there is no second line of content in any cell.

| Block 1 | Block 2 | Block 3 | Block 4 |
|---|---|---|---|
| General | General | Specificity | Bridge |

Author's comment on this example (p.142):

> "A simple long-term option is using a 2:1 ratio of General to Specificity. 2:1 is a solid
> balanced approach. See example 3." (p.142)

**Author's own recommendation among the options:** the Standard Cycle for a first-time
user (p.140), and 2:1 General:Specificity — Example 3 — as the "simple long-term option"
and "solid balanced approach" (p.142).

### Pull-quote (p.143)

Page 143 carries no body text; its only content is a full-width dark callout box.
Transcribed from `images/p143_1.png` (p.143), white italic text on a dark grey ground:

> *"General Mass is for building overall size and bulk. Specificity is the detail work."*
> (p.143)

---

## OMS PROTOCOL (pp.144–145)

Chapter heading: **OMS PROTOCOL** (p.144).

> "Bonus material – for those that have Tactical Barbell I or are familiar with Operator
> template." (p.144)

> "OMS is a simple but powerful long-term continuation protocol for strength and mass. OMS
> is an abbreviation for Operator/Mass/Specificity." (p.144)

> "If there was a standard perpetual TB model for strength and hypertrophy – this would be
> it." (p.144)

> "OMS is usually started after one Standard cycle, however it can be used right from the
> get-go as well." (p.144)

### OMS block table (p.144)

Transcribed cell for cell from `images/p144_1.png` (p.144). Three columns, **no header
row** — each cell is two stacked lines, name then duration. The grid is drawn with plain
outer/inner rules and no shaded header band, unlike the Block tables on pp.140/142.

| Operator Template<br>x 3-6 weeks | Mass Template<br>x 3-6 weeks | Specificity<br>x 3-6 weeks |
|---|---|---|

Literal cell contents (p.144):

- Cell 1 — line 1 `Operator Template`, line 2 `x 3-6 weeks`
- Cell 2 — line 1 `Mass Template`, line 2 `x 3-6 weeks`
- Cell 3 — line 1 `Specificity`, line 2 `x 3-6 weeks`

Text following the table (p.144):

> "Operator is the maximal-strength component. Mass template for general hypertrophy, and
> Specificity for targeted work/fine-tuning. Adjust the ratios as desired. Simply keep
> repeating the above." (p.144)

> "A variation on OMS is to simply rotate between Operator and Mass, and add Specificity as
> needed, if needed. Remember, there's a lot of flexibility when it comes to Specificity –
> it doesn't have to be traditional isolation work. Specificity is when you can get
> unorthodox and play around with different modalities or try new approaches. Kettlebells,
> bodyweight routines, grip specialization or pole-dancing, I don't care." (p.144, running
> onto p.145)

> "If you want to keep maximal-strength in the mix remember to use Specificity Alpha. Yes,
> you can even sub in other TB protocols like Fighter/Green and the like. Just remember to
> stay focused on your objective – if it's mass – then keep Specificity hypertrophy
> related. If you're more of the all-around cross-training type, then a Green/endurance
> phase is fine for the ultimate have-it-all approach." (p.145)

> "Throw in Mass Protocol Base Building once or twice a year before commencing OMS and
> you're good to go. There's power in continuity. Use the same core exercises (i.e.
> Bench/Squat/Deadlift or variations) all the way through for Base/Operator/Mass for added
> impact." (p.145)

> "Don't forget to occasionally bridge/de-load." (p.145)

> "Zulu or I/A can be used in place of Operator, and other General Mass templates can
> replace Mass. However, Operator/Mass is the favored flagship approach." (p.145)

> "Simple is often best." (p.145)

**Implementation notes (pp.144–145):**
- OMS block length is **3–6 weeks per block**, for all three block types, as printed
  (p.144). This differs from the Standard Cycle's fixed 6/6/1/3/3 (p.140).
- OMS is an infinite loop: "Simply keep repeating the above." (p.144)
- Base Building placement in OMS: "once or twice a year before commencing OMS" (p.145).
- Deload placement in OMS: unscheduled — "Don't forget to occasionally bridge/de-load."
  (p.145) — no interval is printed in this chapter.
- Substitutions allowed by name: Zulu or I/A in place of Operator; any other General Mass
  template in place of Mass; Specificity Alpha if maximal-strength is to be retained;
  other TB protocols such as Fighter/Green (pp.144–145). Author's stated preference:
  "Operator/Mass is the favored flagship approach." (p.145)

---

## Part IX — CONSOLIDATION (pp.146–150)

Part title page: "CONSOLIDATION" (p.146). Chapter opens on p.147 with the same heading.

### The Consolidation checklist (p.147)

Reproduced exactly as printed, including the sub-lettering under item 8 (p.147):

1. Read Mass Protocol from cover to cover
2. Reread the Nutrition chapter
3. Calculate Total Calories/Macros + create eating plan
4. Test 1RMs for Base Building Exercise Cluster
5. Perform 6 Weeks of Base Building
6. Pick a General Mass Template + Test 1RMs
7. Execute General Mass + Green Conditioning
8. Bridge Week
   - a. Pick a Specificity Template/Create Exercise Cluster
   - b. Test 1RMs for Specificity
9. Execute Specificity + Black conditioning
10. Reassess / Plan the next cycle

(p.147)

**This is the only place in pp.139–160 that positions Base Building in the sequence:**
6 weeks of Base Building (item 5), preceded by 1RM testing for the Base Building cluster
(item 4), and preceding the General Mass block (items 6–7) (p.147).

**This is also the only place in pp.139–160 that states how maxes are handled between
blocks: they are *tested*, not incremented.** 1RMs are tested three times in the
checklist — before Base Building (item 4), when picking the General Mass template
(item 6), and during Bridge Week for Specificity (item 8b) (p.147). No fixed-increment
rule and no estimation rule appears anywhere in pp.139–160.

### Rest, and nutrition during rest (p.147)

> "If you need a few more days of rest over what Bridge Week provides, by all means take
> it. Too much rest is better than not enough. Do NOT drop or change your calorie/macro
> intake during rest periods. Take a Bridge week or two after Base Building as well - as
> needed." (p.147)

**Implementation notes (p.147):**
- Extra rest days beyond Bridge Week are explicitly permitted and unbounded ("by all means
  take it").
- Calorie/macro targets must **not** change during rest periods — a scheduling rule with a
  nutrition consequence.
- One or two Bridge weeks may also be inserted **after Base Building**, "as needed" —
  i.e. a Bridge block can sit between Base Building and Block 1 of the Standard Cycle,
  even though the p.140 table does not draw it there.

### Closing (pp.147–148)

> "One final step – take before and afters. Inspire others and show off your success by
> posting pictures and sharing your training journey on one of our online communities:
> http://tacticalbarbell.com/forum/index.php" (p.147)

> "Or the Tactical Barbell subreddit: r/tacticalbarbell" (pp.147–148)

### INTEGRATION (pp.149–150)

Chapter heading: **INTEGRATION** (p.149), with an epigraph:

> "An ounce of action is worth a ton of theory" — Ralph Waldo Emerson (p.149)

> "Focus on one goal at a time. Have everything pull in the same direction (nutrition,
> cardio, lifting) until that goal is achieved. Adjust fire when it's time for a new goal.
> Don't give your body opposing signals by doing things like endurance training while
> simultaneously trying to gain weight. It can be done, but you're creating an uphill
> battle for yourself." (p.149)

> "Tips for integrating Mass Protocol in the big picture;" (p.149)

> "Set a target weight/look and achieve it." (p.149)

> "When it's time to branch out to performance-oriented training – carry on by adjusting
> your food intake to support all the extra activity and your new weight." (p.149)

> "Be mentally prepared for a kind of 'growing pains' phase. There will be an adjustment
> period where your brain will have to learn it's carrying 200lbs over 10 miles instead of
> the 160 it's been accustomed to for most of your life. Don't fret if you feel heavy on
> your feet. You'll grow into it. Expect your timed runs or events to be suboptimal for a
> while – remain patient and allow for that adjustment. There's really no way around it.
> Being bigger and heavier comes at a cost." (p.149)

> "If there's a Tier 1 or 2 selection in your near-future avoid mass-building until after
> you pass. You don't have to have big muscles to pass selection. On the contrary, you will
> feel every extra ounce dragging you down. Conditioning is far more important. Instead,
> develop a favorable strength-to-weight ratio, be the strongest you can be while being the
> lightest you can be. Build strength while keeping size to a minimum. Read Tactical
> Barbell I and II for instructions. Put on that extra 20 or 30lbs of muscle after you get
> on the team." (pp.149–150)

> "Understand the trade-offs of carrying excessive muscle mass as it relates to
> performance. If you want to be a champion marathon runner but you're carrying 200lbs on a
> frame that's built for 160, it probably won't happen. Lose the weight." (p.150)

> "After going through this protocol you'll always know how to put the weight on when you
> need to, like a fighter moving up and down weight classes." (p.150)

---

## Part X — FAQS (pp.151–156)

Heading printed as **F A Q S** (p.151). Every question and its complete answer, in printed
order.

### Do I have to do Base Building? (p.151)

> "No. Base Building is optional unless you're an operational athlete or you're coming into
> the program with a pre-existing aerobic/endurance base. It is, however, highly
> recommended." (p.151)

*(Note the sentence as printed: the exception clause reads "unless you're an operational
athlete **or** you're coming into the program with a pre-existing aerobic/endurance base."
Recorded verbatim; see Ambiguities.)*

### How Should I Eat During Base Building? (p.151)

> "If you're overweight/carry excess fat - Base is a good time to play around with
> low-carb/keto/intermittent fasting etc. Get it out of your system before you get into the
> meat of the program. If you're a skinny hardgainer start using the Mass Protocol
> nutrition formula right away. Regardless, the important thing is to be ready to eat for
> hypertrophy come day 1 of General Mass block." (p.151)

### Can I use intermittent fasting with Mass Protocol? (p.151)

> "I don't know. Based on my experience, intermittent fasting doesn't lend itself well to
> hypertrophy/mass building phases. Your mileage may vary." (p.151)

### Can I do Keto or low-carb with Mass Protocol? (p.151)

> "I wouldn't recommend it." (p.151)

### Do I really need to eat THAT much protein? Studies show…. (p.152)

> "Are you as big and muscular as you want to be right now? If not, why not try it our way?
> You paid for this advice, so take it. Or not - up to you." (p.152)

### Can I still fast periodically? (p.152)

> "Yes, but keep it limited. No more than one to two 16-24 hour fasts every 4-6 weeks.
> Better yet, do it during Bridge Week. Re-establish regular fasting after you've finished
> gaining your target weight. If you're a hardgainer – stay away from all fasting until
> you've reached target weight." (p.152)

### Aren't the loads used during General Mass too light? (p.152)

> "Ask me this again after your first couple blocks. When it comes to hypertrophy, we don't
> need to rely as much on intensity – rather we're looking for that nice middle ground
> between intensity and volume." (p.152)

### What if I find the loads used during General Mass too heavy? (p.152)

> "If you're struggling, drop 5-10% off your 1RMs and continue. Keep in mind you will get
> stronger as the weeks progress. What felt difficult during week 1 or 2 will feel easier
> come week 4 or 5." (p.152)

**Implementation consequence (p.152): the only in-block max adjustment rule in this range.
It reduces the *1RM* by 5–10%, not the working load, and training continues from there.**

### Can I add isolation work or supplemental exercises to the General Mass templates? (p.152)

> "I would advise against it. Other than some minimal core/ab-work. Unless otherwise
> stated of course, like Grey Man. Add extra sets instead." (p.152)

### I've gained a lot of size using General Mass. I really like the aesthetic it's given me too. Do I still have to do Specificity? (p.153)

> "No. Specificity is optional but recommended. Specificity gives you an opportunity to
> work on weak points or areas that weren't given the same amount of attention during
> General Mass. A short 3-week block will do you good, before diving back into General."
> (p.153)

### This other program says to do to X build muscle, but you say to do Y instead. What gives? (p.153)

> "I can't speak for other programs. There are many ways up the mountain. Mass Protocol is
> ours." (p.153)

*(Question transcribed verbatim, including the printed "to do to X build muscle".)*

### Ok, so can I take ___ from that other program and add it to ____ when running Mass Protocol? (p.153)

> "No. There are reasons the other program does what it does and reasons we do what we do
> that may not be readily apparent to you. You're simply sabotaging yourself by trying to
> create some level of perfect programming that doesn't exist." (p.153)

### I'm primarily a strength and power athlete. Can I combine Tactical Barbell 1 with Mass Protocol to create strength AND hypertrophy programming? (p.153)

> "Absolutely. Break your training into strength and hypertrophy blocks/phases. Might be 6
> weeks of Operator (maximal-strength) followed by 6 weeks of Grey Man, rinse and repeat.
> Different templates, variations, and ratios are certainly acceptable and encouraged. You
> might want to start with a Hypertrophy phase and transition into maximal-strength or
> vice-versa. Also see the OMS Protocol in this book, in the Block Programming chapter."
> (p.153)

**Implementation note (p.153):** a second, concrete block-sequencing option — 6 weeks
Operator → 6 weeks Grey Man, repeating. Note this is 6-week blocks, whereas the OMS table
prints 3–6 weeks (p.144).

### How much conditioning should I do? Do I have to do any at all? (p.154)

> "If you're an operational athlete with occupational conditioning requirements, 2 x a week
> is the sweet spot. If you're a civilian or have no mandatory cardiovascular standards to
> maintain – then you don't have to do any conditioning at all. I still recommend doing 1-2
> sessions a week for overall performance enhancement and health." (p.154)

### During Specificity, it's possible to train the same muscle group two days in a row depending on the cluster you pick. Isn't that bad? (p.154)

> "It depends on how you train said muscle group. Hypertrophy style training (higher
> volume/higher repetition/decreased rest interval/muscle failure etc) performed two days
> in a row on the same muscle group isn't optimal and could impede progress by stifling
> recovery. However, maximal-strength style training (low rep/low volume/extended rest
> intervals/etc) can be performed two days in a row, and when used judiciously can
> accelerate growth. A maximal-strength day followed by hypertrophy day is even better,
> because load/volume is waved, and each style of training provides a different stimulus to
> the same muscle. In this program it's possible during Specificity to train a muscle group
> using maximal-strength principles on one day, and then train the same muscle the
> following day using hypertrophy tactics. So long as you're following the
> programming/nutrition guidelines, this is a good thing and will enhance your results."
> (p.154)

### Can I Use or Create a Different Cluster for General Mass? I'd rather overhead press than bench etc (pp.154–155)

> "You can. However, I strongly recommend running one Standard cycle as-is before making
> any changes to the programming. Also, if you have legitimate injuries that prevent you
> from doing a certain exercise, feel free to use a substitute." (pp.154–155)

### What's the deal with the old Gladiator, Mass Template etc in the original/first edition of Tactical Barbell 1? (p.155)

> "Although the old 1st edition templates share their names with the protocols found in
> this book, that's where the similarities end. The programming in this book is
> significantly different – although Mass Template does bear a passing resemblance to the
> Mass template of old. Those templates work but aren't optimal. They straddle the fence
> between hypertrophy and max-strength without really committing to either. For some that
> was adequate, and they did simultaneously increase hypertrophy and maximal-strength to a
> degree, but no to the same extent as the protocols in this book. They can also be made to
> fit within the programming of Operator I/A in the final (3rd) edition of TB1, for those
> that really want to resurrect them. Regardless, Tactical Barbell 1 was replaced and
> overwritten by Tactical Barbell 1 (3rd edition) several years ago. We learn, experiment,
> and get better, as our pool of trainees and readers expand. You shouldn't be using old
> defunct editions of TB anyway." (p.155)

*(Printed as "but no to the same extent" — transcribed verbatim.)*

### What's the difference between Tactical Barbell I, Tactical Barbell II, and Mass Protocol? (pp.155–156)

> "Tactical Barbell I is our strength training system. Maximal-strength is the ability to
> generate force regardless of muscle size. Several strategies/schedules for increasing
> maximal-strength and muscular-endurance are presented." (p.155)

> "Tactical Barbell II is our conditioning /cardiovascular training system." (p.155)

> "Mass Protocol focuses on developing muscle size, aka muscular hypertrophy. Hypertrophy
> isn't always the most optimal way to train for strength, and strength training isn't
> always the most efficient way to train for muscle size – although overlap does exist
> between the two." (pp.155–156)

> "Think of TBI as strength, TBII as cardio, and Mass Protocol as hypertrophy. All three
> can be used separately to train their respective domains – or together as one complete
> system." (p.156)

**That is the last FAQ. There are 17 questions in total, pp.151–156.**

---

## Back matter (pp.157–160)

These pages are promotional copy for the other two books, not programming content. No
tables, no images, no prescriptions.

- **TACTICAL BARBELL I — Strength Training for the Operational Athlete** (pp.157–158).
  Describes TB1 as "a strength training system designed specifically with tactical athletes
  in mind… Periodization based, with a simple progression model that allows for a great
  degree of customization." (p.158) and notes "The program includes a built-in strength
  testing component. You will know if your strength has increased or not, and by how much."
  (p.158)
- **TACTICAL BARBELL II — Conditioning** (pp.159–160). Describes TBII's "structured,
  three-pronged approach to conditioning… It consists of Base Building, followed by a
  transition to a more specific continuation protocol. Periodic maintenance of
  lower-priority fitness domains complete the model." (p.160)

The book ends at p.160.

---

## Implementation summary for the app

Rules from pp.139–160 that a scheduling model must encode:

1. **Standard Cycle = 5 blocks, 19 weeks** (p.140): General 6wk (Green) → General 6wk
   (Green) → Bridge 1wk → Specificity 3wk (Black) → Specificity 3wk (Black).
2. **Two General blocks precede Specificity** in the Standard Cycle, separated by a Bridge
   week (p.140).
3. **Conditioning type is a property of the block**: Green during General, Black during
   Specificity, none printed for Bridge (p.140).
4. **An optional Block 6** may be a bridge week between cycles, or the trainee may
   transition immediately into something else (p.140).
5. **Base Building sits before the first General block**: test 1RMs for the Base Building
   cluster, then 6 weeks of Base Building, then pick a General Mass template and test 1RMs
   (p.147). Base Building is optional but "highly recommended" (p.151).
6. **Bridge weeks may also be inserted after Base Building** — "a Bridge week or two… as
   needed" (p.147).
7. **Maxes progress by RE-TESTING, not by a fixed increment**, in this range: 1RMs are
   tested before Base Building, at the start of General Mass, and during the Bridge Week
   for the Specificity block (p.147). No add-a-fixed-amount rule and no estimate-forward
   rule appears anywhere in pp.139–160.
8. **The only in-block load correction printed here**: "If you're struggling, drop 5-10%
   off your 1RMs and continue." (p.152)
9. **Ratio after the first cycle** is user-configurable: reassess after the Standard Cycle
   (p.140); favour General while far from target weight, 2:1 General:Specificity being the
   named example (p.141); favour Specificity when near target, per Examples 1 and 2
   (p.142); or simply repeat the Standard Cycle (p.142).
10. **OMS** is a perpetual 3-block rotation, each block 3–6 weeks:
    Operator → Mass → Specificity, repeating (p.144), usually begun after one Standard
    Cycle (p.144), with Base Building "once or twice a year before commencing OMS" (p.145)
    and occasional bridge/de-loads (p.145).
11. **Cluster substitution**: allowed, but "I strongly recommend running one Standard cycle
    as-is before making any changes" (pp.154–155); injury substitutions allowed
    unconditionally (p.155).
12. **No isolation/supplemental additions to General Mass templates** beyond minimal
    core/ab work, or where the template states otherwise (e.g. Grey Man); "Add extra sets
    instead." (p.152)
13. **Specificity block length when returning to it ad hoc**: "A short 3-week block will do
    you good, before diving back into General." (p.153)
14. **Conditioning frequency**: 2×/week for operational athletes; optional for civilians,
    with 1–2 sessions/week recommended (p.154).
15. **Rest**: extra rest days beyond Bridge Week are permitted without limit; calorie/macro
    intake must not be changed during rest (p.147).

---

## Ambiguities and choices

Recorded, not resolved.

1. **Max progression between blocks is not stated in this range.** pp.139–160 only ever say
   "Test 1RMs" (p.147) and "drop 5-10% off your 1RMs" if struggling (p.152). The
   fixed-increment rule that appears elsewhere in this book — "Every 3 to 6 weeks, add
   5-10lbs to 1RMs. Recalculate and repeat." (pp.47, 53, 57, 62, 77, 83 in the
   template chapters) — is **not repeated in the Block Programming or
   Consolidation chapters**, and the two are never explicitly reconciled. Whether a new
   block starts from a re-tested 1RM, from the incremented 1RM, or from either, is not
   stated on pp.139–160. Do not resolve this from this section alone; cross-check against
   the Bridge Week chapter (pp.92–93) and the caution about consecutive blocks with
   "higher and higher 1RMs" and overestimation (p.64).
2. **Bridge Week's own definition is outside this range** (pp.92–93). p.140 gives Bridge a
   1-week slot but no content; p.145 says "occasionally bridge/de-load" with no interval;
   p.147 permits "a Bridge week or two after Base Building". The Bridge chapter's own
   recommendation ("once every two to three months", p.93) is not restated here.
3. **Block length is inconsistent across the chapter.** Standard Cycle: General 6wk,
   Specificity 3wk, Bridge 1wk (p.140). OMS: every block 3–6 weeks (p.144). The
   TB1-combination FAQ: 6 weeks Operator + 6 weeks Grey Man (p.153). Ad hoc Specificity:
   3 weeks (p.153). The book does not reconcile these into one rule.
4. **Examples 1–3 print no week counts and no conditioning labels** (p.142). Whether a
   "General" block in those examples is still 6 weeks and still Green, and a "Specificity"
   block still 3 weeks and still Black, is not stated. Do not fill in from p.140.
5. **"General x 2" in Examples 1 and 2** (p.142) occupies a single Block column while
   naming two blocks' worth of work. Whether that column is one 12-week block or two
   consecutive 6-week blocks (making the sequences 6 blocks long, not 5) is not stated.
6. **Example 3 has four columns while Examples 1–2 and the Standard Cycle have five**
   (p.142). The book does not comment on the differing cycle length.
7. **Base Building is absent from every block diagram** (pp.140, 142, 144). Its placement
   comes only from the Consolidation list (p.147) and the OMS prose (p.145). Whether Base
   Building counts as a "Block" for numbering purposes is not stated.
8. **The Base Building FAQ sentence appears self-contradictory as printed**: "Base Building
   is optional unless you're an operational athlete or you're coming into the program with
   a pre-existing aerobic/endurance base." (p.151) — reading it literally makes Base
   Building *mandatory* for someone who already has an aerobic base, which is the opposite
   of the likely intent. Transcribed verbatim; not corrected.
9. **Missed sessions, failed sets, and deload triggers are never addressed in the FAQs.**
   There is no FAQ on what to do if a session is missed, what to do if a set is failed
   mid-block, how to round loads, or when a deload is mandatory rather than optional. The
   only related statements in this range are "drop 5-10% off your 1RMs and continue"
   (p.152) and "Too much rest is better than not enough" (p.147). Any such behaviour in the
   app is not book-backed by this section.
10. **1RM vs Training Max is not mentioned anywhere in pp.139–160.** Every reference here is
    to "1RMs" (pp.147, 152). The TM concept appears earlier in the book (p.89) and is
    not connected to block sequencing in this range.
11. **Weight units**: all figures in this range are in pounds (160/175/195/200lbs body
    weight, p.141; "5-10lbs" does not appear in this range). No metric equivalents are
    printed.
12. **"Green" and "Black"** (p.140) are TB2 conditioning protocol names; this range never
    defines them, and the app cannot derive their content from pp.139–160.
13. **"Specificity Alpha"** (p.145), **"Zulu"**, **"I/A"**, **"Fighter"**, **"Grey Man"**
    (pp.145, 152, 153) are referenced by name without definition in this range.
