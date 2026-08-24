# Book audit 01 — Grey Man (MASS pp.48–53)

**Audited:** `src/protocols/greyman.ts`, `test/greyman.test.ts`, `src/screens/Session.tsx`
(and, where they bear on Grey Man, `src/protocol.ts`, `src/program.ts`, `src/lib/barbell.ts`).
**Against:** `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`, PDF pages 39, 43–53, 65, 90, 152,
and the table images `docs/MASS/images/p048_1.png`, `p049_1.png`, `p050_1.png`, `p051_1.png`, `p052_x.png`,
`p043_1.png`. Page numbers below are PDF pages of that file, matching the convention already used in the code.
**Date:** 2026-08-23. No code was changed.

---

## Verdict

**The transcription is faithful.** I read the p.51 grid image cell for cell and every one of the eighteen
numbers in `GM_GRID` is right; the p.50 schedule image, the p.48 main cluster image and the p.49 S-cluster
example image all match the code exactly; the A/B selector reproduces the printed nine-session sequence
`A B A / B A B / A B A` precisely; and the app is correct that Grey Man has no AMRAP and no peaking, that it
uses the 1RM rather than a training max, and that its failure remedy is a flat 10% where the Mass Template's
is 5–10%. I found **no case of the app contradicting a printed number.** What I did find is a cluster of
**omissions** — things the book prescribes that the app does not yet do. The most serious is that
**Forced Progression is not implemented at all** (p.53: "Every 3 to 6 weeks, add 5-10lbs to 1RMs"): nothing
in the app ever writes `progressedKg`, and the default plan runs two Grey Man blocks back to back, so block 2
would repeat block 1's loads exactly. Second, the book's `4-5` set range is advertised in the UI but only
4 sets can ever be performed. Third, the two clusters' genuinely different execution rules — rest, failure
tolerance, super-setting — are collapsed into one sentence and one flat 120-second rest timer. Two comments
in the code also justify a correct decision with an incorrect description of the evidence, which matters
under the no-page-number-no-claim rule.

---

## Summary of findings

| # | Finding | Severity | Kind |
|---|---|---|---|
| F1 | Forced Progression (p.53, p.90) is not implemented — `progressedKg` is never written | major | omission |
| F2 | The printed `4-5` set range is displayed but the 5th set cannot be performed | major | omission |
| F3 | Rest timer is a flat 120 s; the book gives 2–5 min (main) and 1–2 min (S) | minor | omission |
| F4 | The execution note skips the book's *first* remedy for failure (longer rest, then 10%) | minor | omission |
| F5 | Session UI does not separate main lifts from the S cluster | minor | omission |
| F6 | Bodyweight S exercise with no recorded max reps plans 0 reps; wrong prompt wording; book's "or keep it simple, 4×12" option (p.52) not offered and actively asserted against | minor | gap / test error |
| F7 | Code comments say the book prints a "two-week grid" (it is three weeks) and that week parity "gives the wrong answer" (it is arithmetically equivalent) | minor | doc error |
| F8 | A/B resets every block, so two consecutive A days fall across the seam of two adjacent GM blocks, and BP/SQ get 5 sessions to OHP/DL's 4 in every block | minor | gap the book leaves |
| F9 | Day 1/3/5 → Mon/Wed/Fri is an app choice; a test title states it as if printed | nit | gap the book leaves |
| F10 | Two weak / over-claiming test assertions | nit | test quality |
| F11 | p.39 says Grey Man balances "3 days of lifting with 3 days of conditioning"; p.48 says "four days off" — the app defaults to 2 | nit | observation, for the conditioning audit |

---

## Clean bill of health

These I checked against the book and they are **correct**. Stating so explicitly, per the brief.

- **C1 — The p.51 grid, all nine cells.** Read `p051_1.png` directly. Week 1: main `4-5 x 8` / `70%`,
  S `4 x 12` / `55%`. Week 2: `4-5 x 6` / `75%`, S `4 x 10` / `60%`. Week 3: `4-5 x 3` / `80%`, S `4 x 8` /
  `65%`. All three lifting days in a week carry identical cells; Days 2, 4, 6, 7 are blank. `GM_GRID`
  (`greyman.ts:98-111`) matches every number, and the S row is a flat 4 sets, not a range — also correct
  against the image. `p052_x.png` (the enlarged Week 1/Day 1 box) independently confirms the week-1 cell.
- **C2 — Main cluster.** `p048_1.png` prints exactly Bench Press (BP), Squat (SQ), Overhead Press (OHP),
  Deadlift (DL), with **no footnote**. `GM_MAIN` (`greyman.ts:46-51`) matches, including the short codes.
  The code's reasoning at `greyman.ts:42-45` is sound and I verified the contrast: the Mass Template cluster
  image `p043_1.png` *does* carry "\*Barbell rows, Body Weight Pull-ups, or Romanian Deadlifts can be
  substituted for Weighted Pull-ups", and Grey Man's carries nothing. Combined with "The Main cluster is
  standard across the board, the same for everyone" (p.48), `editable: false` is well supported. Note the
  substitution footnote exists only because MT contains WPUs, which Grey Man does not — so this is an
  inference, not a printed prohibition; it is nonetheless the right one.
- **C3 — S cluster rules.** "Use no more than 4 to 6" and "After you pick your 4 to 6 exercises, divide the
  list in two as I've done in the example above" (p.49) → `S_CLUSTER_MIN = 4`, `S_CLUSTER_MAX = 6`, split
  S1/S2. "S exercises can consist of dumbbells, barbells, kettlebells, and bodyweight" (p.49) → the loading
  kinds available cover all four. The example is transcribed correctly from `p049_1.png`: S1 = Dips, Incline
  Dumbbell Press, Front Squat; S2 = Dumbbell Shrugs, Dumbbell Row (`greyman.ts:64-72`), and the code is right
  to treat it as an example (the image is titled "S CLUSTER (Example)") rather than a prescription. The
  author's own recommendation is also correctly *not* overridden: "for those looking for a pure
  aesthetic/mass-centric result – stick to the more conventional exercises using dumbbells and barbells"
  (p.49) — the seeded example is exactly that, conventional DB/BB work, so the default follows the
  recommendation while the builder still allows the kettlebell/bodyweight/grip/plyo latitude the same page
  grants to operational types.
- **C4 — A/B alternation.** `p050_1.png` is a **three**-week grid: Wk1 `BP/SQ/S1 – OHP/DL/S2 – BP/SQ/S1`,
  Wk2 `OHP/DL/S2 – BP/SQ/S1 – OHP/DL/S2`, Wk3 `BP/SQ/S1 – OHP/DL/S2 – BP/SQ/S1`. Written as a session
  sequence that is `A B A B A B A B A`. `greyManDay(liftingOrdinal)` with
  `liftingOrdinalFor = (week-1)*3 + dayIndex` (`program.ts:83-87`) reproduces it exactly, and
  `test/greyman.test.ts:163-171` asserts the full nine-session sequence. A = BP + SQ + S1, B = OHP + DL + S2
  is right (`greyman.ts:140-143`), and is confirmed in prose on p.52: "on Day 1 it's the Bench Press and
  Squat… On Day 3 my main lifts are the OHP and DL."
- **C5 — No AMRAP, no peaking.** Verified by reading the whole of pp.48–53: the Grey Man chapter runs
  GM CLUSTERS → GM EXERCISE SCHEDULE → grid → EXECUTION → MAIN CLUSTER → SUPPLEMENTARY CLUSTER →
  PROGRESSION, and never mentions either technique. Mass Template has a dedicated "AMRAP or PEAK (+)"
  section (pp.45–46) and Gladiator has one (pp.55–56). The Grey Man grid image carries no `+` markers. The
  app is right to omit both, and right that week 3 is simply heavier.
- **C6 — The failure rule is a flat 10%.** "If you're still failing consistently, lower your 1 rep maximum
  by 10% and recalculate" (p.53). Mass Template says "5-10%" (p.45) and the FAQ says "drop 5-10% off your
  1RMs" for General Mass generally (p.152). The app uses 10% for Grey Man (`greyman.ts:255`), i.e. the
  chapter-specific number over the general one. That is the correct reading of the fidelity rule.
- **C7 — Percentages are of the 1RM, no training max.** Confirmed: the TM appears only in the Bulgarian
  cluster section, "A training maximum or TM is 90% of your True/or 1 Rep Max" (p.89). Nothing in pp.48–53
  mentions one. `basis: '1rm'` throughout, asserted at `greyman.test.ts:80-86`.
- **C8 — Three-week block.** The grid prints weeks 1–3 and no more; `GM_BLOCK_WEEKS = 3`.
- **C9 — Bodyweight loading is a percentage of MAX REPS.** "If using just bodyweight – find your maximum
  number of REPS. Maximum reps act as your 1RM… If the programming calls for 3 sets x 10 reps @ 70%RM, you'd
  do 3 sets of 7" (p.90). `bodyweightReps` implements exactly that, and the weighted-bodyweight path
  correctly includes bodyweight in the calculation, also p.90. The test at `greyman.test.ts:266-276` is a
  genuine book fixture (but see F6 on its last line).
- **C10 — Exercise order and rest intervals are transcribed correctly** in the detail string: main lifts
  first (p.50, p.52), 2–5 min main (p.52), 1–2 min S with super-setting "also an option" for S only (p.53).
  The app correctly does *not* offer super-setting on the main lifts.
- **C11 — Four sets is defensible.** See F2 for the caveat, but the *default* is right and better supported
  than the code currently claims. On p.52 the author walks through his own session and writes "I'll perform
  the main lifts first (4 sets of 8/70%)" — the book's own worked example uses 4. And p.65 frames the extra
  set as an option for surplus energy, not a default: "If you have surplus energy to burn – add extra sets
  to your main lifts." Defaulting to `setsMin` and citing p.52 + p.65 would make this airtight; today the
  code and test justify it only as "the low end of the printed range".

---

## Findings

### F1. Forced Progression between blocks is not implemented
- **Severity:** major
- **Claim:** `greyman.ts:156` reads `entry.kg + (entry.progressedKg ?? 0)`, and `History.tsx:212-232`
  renders "tested → current, +N". But **nothing in the app ever writes a non-zero `progressedKg`**:
  `Maxes.tsx:105` and `Maxes.tsx:130` both set it to `0`, and there is no other writer
  (`grep -rn progressedKg src/` returns only readers plus `dev/seed.ts:213`). `docs/mass-design.md` §9 lists
  nine build steps, none of which is Forced Progression, and §10 ("what this design deliberately does not
  do") does not name it either — so it is an unclosed gap rather than a recorded decision. The default plan
  (`program.ts:60-67`) is `gm, gm, bridge, gm, gm`, i.e. two Grey Man blocks back to back, so block 2 runs
  numerically identical loads to block 1.
- **Book says:** "PROGRESSION — Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force
  progression for exercises you struggled with - use the same numbers for the next block." (p.53; the
  identical paragraph closes the Mass Template chapter at p.47). And: "There's no need to regularly test
  your 1 rep maximums with this protocol… From there on progression simply consists of adding weight to your
  1 rep maximum and recalculating from block to block. Also referred to as Forced Progression in the
  Tactical Barbell system." (p.90)
- **Evidence:** read the plain text of PDF pages 47, 53 and 90; grepped every writer of `progressedKg`;
  read `Maxes.tsx` around lines 100–135 and the step list in `docs/mass-design.md` §9–§10.
- **Rectify:** at a block boundary (and at latest every 6 weeks), prompt to add **5–10 lb = 2.5–5 kg** to
  each 1RM and write it to `progressedKg` — per exercise, with a per-exercise opt-out, because the book's
  carve-out ("Don't force progression for exercises you struggled with") is per-lift, not global. A natural
  home is Bridge Week, which already exists and is already the book's designated between-blocks moment
  (`bridge.ts`). Add a test asserting +2.5 kg on a 100 kg squat moves the week-1 main target from 70 kg to
  71.75 kg, and that a lift marked "struggled" is left alone.

### F2. The book's `4-5` set range is shown but the fifth set cannot be performed
- **Severity:** major
- **Claim:** `greyman.ts:170` sets `const count = p.setsMin`, so a main-lift exercise always plans exactly
  4 sets. The scheme line at `greyman.ts:244` nevertheless advertises `4–5 × 8 @ 70%`, and `setsMax` is used
  **nowhere else in `src/`** (verified by grep — the only hit outside `protocol.ts` is that string).
  `Session.tsx:718-729` renders one `SetRow` per planned set and offers no add-set control (no `addSet` /
  "Add set" anywhere in the file). So the UI tells Josh he may do 5 sets and then makes it impossible to
  record the 5th.
- **Book says:** the grid prints "4-5 x 8" (p.51 image); "Perform 4 to 5 sets of 8 reps with 70% of your
  1 rep maximum for both exercises" (p.52); "If you have surplus energy to burn – add extra sets to your
  main lifts" (p.65); and the FAQ, asked about adding exercises, answers "Add extra sets instead" (p.152).
- **Evidence:** read `p051_1.png` and `p052_x.png`; read PDF pages 52, 65, 152; grepped `setsMax`,
  `addSet`, "Add set" across `src/`.
- **Rectify:** add an "+ add set" affordance on loaded exercises, capped at `setsMax` for main lifts (the
  S cluster prints a flat 4, so it needs no cap raise). Assert in a test that a Grey Man main lift can reach
  5 sets and that the S cluster's `setsMin === setsMax === 4`. The alternative — a global "I do 4 / I do 5"
  setting — is weaker, because p.65 makes the fifth set a session-by-session judgement.

### F3. One flat 120-second rest timer for every set
- **Severity:** minor
- **Claim:** `Session.tsx:49-53` — `restSeconds()` returns `120` for everything unless the user has set a
  global override in Settings. Main lifts and S exercises get the same timer.
- **Book says:** main cluster — "Rest for approximately 2-5 minutes or more in between sets… if you're
  failing completely before finishing the set then use a longer rest interval; 5 minutes or longer" (p.52).
  S cluster — "Rest for 1-2 minutes between sets" (p.53).
- **Evidence:** read PDF pages 52–53; read `Session.tsx:49-53` and the `SetRow` wiring at 718-729.
- **Rectify:** carry a rest hint on the `Prescription` (or derive it from which cluster the exercise came
  from) and default main lifts to ~180 s and S work to ~90 s, still overridable. 120 s is simultaneously the
  floor of one range and the ceiling of the other, so it is the wrong number for both.

### F4. The failure remedy skips the book's first step
- **Severity:** minor
- **Claim:** `greyman.ts:255` — "If you fail reps repeatedly, drop that lift's 1RM by 10% and recalculate."
- **Book says:** the 10% drop is the *second* remedy, not the first. "if you're failing completely before
  finishing the set then use a longer rest interval; 5 minutes or longer. If you're **still** failing
  consistently, lower your 1 rep maximum by 10% and recalculate." (pp.52–53 — the emphasis is on the book's
  own ordering)
- **Evidence:** read PDF pages 52–53 in full.
- **Rectify:** one clause — "…failing reps? First lengthen the rest to 5 min or more; if you're still
  failing, drop that lift's 1RM by 10% and recalculate (p.53)." Cheap, and it restores a real instruction
  that currently sends Josh straight to cutting his max.

### F5. The two clusters are rendered as one flat list
- **Severity:** minor
- **Claim:** `greyman.ts:269-272` concatenates main lifts and S exercises into a single `exercises` array,
  and `Session.tsx:640-733` renders them as identical cards. Nothing on screen says which two are the main
  lifts, and the two prescriptions are compressed into one header string (`Session.tsx:537`).
- **Book says:** the distinction is structural, not cosmetic. "The two main lifts of the day are performed
  first. **They have their own unique set/rep/load structure.**… The supplementary exercises have a
  set/rep/load structure different from that of the main lifts." (p.50) They also differ in rest (F3), in
  failure tolerance — main: "The objective is to complete all reps of each set while minimizing muscle
  fatigue/failure" (p.52) vs S: "muscle failure and fatigue on the last few reps is acceptable" (p.53) — and
  in whether super-setting is allowed, S only (p.53).
- **Evidence:** read PDF pages 50, 52, 53; read `Session.tsx:640-733`.
- **Rectify:** a "Main cluster" / "Supplementary (S1)" heading between the two groups, each carrying its own
  sets×reps@% line and its own rest/tolerance note. `SessionPlan` would need one group flag per exercise.

### F6. Bodyweight S exercise with no recorded max reps plans zero reps
- **Severity:** minor
- **Claim:** `greyman.ts:198-200` calls `bodyweightReps(entry.maxReps ?? 0, percent)`, and `barbell.ts:227`
  returns `0` when `maxReps <= 0`. A bodyweight entry saved without a rep max therefore renders a set of
  **0 reps** rather than a prompt. Separately, the missing-entry path (`greyman.ts:189`) says "Set your
  **1RM** for Dips to see the **working weight** (55%)", which is the wrong instruction for a bodyweight
  movement — what is needed is a max-rep test, and there is no weight.
- **Book says:** "If using just bodyweight – find your maximum number of REPS. Maximum reps act as your 1RM
  for bodyweight movements." (p.90). And the book explicitly sanctions a fallback: "Since I'm using
  bodyweight for Dips in this example; I'll do 4 sets of 55% of my total max reps, **or I'll keep it simple
  and do 4 sets of 12**." (p.52)
- **Evidence:** read PDF pages 52 and 90; read `barbell.ts:210-232` and `greyman.ts:184-205`.
- **Rectify:** (a) when `maxReps` is absent, fall back to the grid's printed reps and say so, rather than
  planning 0; (b) reword the prompt for bodyweight exercises to ask for a max-rep test, not a 1RM; (c) note
  that `test/greyman.test.ts:274-275` asserts `expect(dips.sets[0].reps).not.toBe(12)` and calls 12 "the
  naive reading" — **the book prints 12 as an acceptable option on p.52**, so that assertion, as worded,
  contradicts the book. Keep the 55%-of-max-reps default (it is the author's primary example and the general
  rule on p.90), but drop or reword the "not 12" line.

### F7. Two code comments justify a correct decision with an incorrect description of the evidence
- **Severity:** minor
- **Claim:** `greyman.ts:130-134` and `protocol.ts:174-182` both say "The book prints a two-week grid
  (p.50) which reads like week parity. It is not… Selecting on day-of-week or on week parity both give the
  wrong answer."
- **Book says:** `p050_1.png` is a **three-week** grid — rows labelled 1, 2 and 3, `ABA / BAB / ABA`. The
  "A-B-A/B-A-B" phrasing on p.48 is two weeks of prose, but the printed table is three.
- **Evidence:** read `p050_1.png`. The parity half of the claim is arithmetically false, not merely
  imprecise: `liftingOrdinal = (week-1)*3 + idx`, and because `liftingDays.length` is **odd**,
  `liftingOrdinal mod 2 === ((week-1) + idx) mod 2` — so "week parity combined with the day slot" gives an
  identical answer to the ordinal, for every week, forever. What is genuinely wrong is week parity *alone*
  or day-of-week *alone*.
- **Rectify:** correct both comments to "a three-week grid (p.50)" and to "selecting on day-of-week alone,
  or on week parity alone, gives the wrong answer". The ordinal is still the better implementation, because
  it stays correct if `liftingDays` ever has an even length — and *that* is the reason worth writing down.
  No behaviour change.

### F8. A/B restarts at every block, so two A days meet across the seam of adjacent blocks
- **Severity:** minor — this is the app filling a gap, not contradicting the book
- **Claim:** `liftingOrdinalFor` is block-relative (`program.ts:83-87`), so every Grey Man block opens on A.
  `test/plan.test.ts:56-58` pins this deliberately ("Both blocks open on A… even though block 1 ended on A").
  The default plan is `gm, gm, bridge, gm, gm` (`program.ts:60-67`) — the first two blocks are **adjacent
  with no bridge between them**, so Wk3 Fri (A: BP/SQ) is followed by Wk1 Mon (A: BP/SQ) with only a weekend
  in between, while OHP/DL go a full 7 days between sessions. It also means BP/SQ get 5 sessions per block
  to OHP/DL's 4, in *every* block, rather than the imbalance alternating out over two blocks.
- **Book says:** nothing. The grid stops at Week 3 Day 5 = A and the book never addresses the seam
  (`MASS-extraction.md` open question 18 records this correctly). Restarting at A does reproduce the printed
  grid for every block, which is the conservative reading; continuing the alternation would print a week
  (`B A B` as week 1) that the book never shows.
- **Evidence:** read `p050_1.png`; read `program.ts:60-121`; read `test/plan.test.ts:50-58`.
- **Rectify:** no change required for fidelity, but two things are worth doing. (1) Record it as a labelled
  DEVIATION / gap-fill in the `docs/mass-design.md` §1 decision table alongside the other six — it currently
  exists only as a test comment. (2) Consider whether the *default plan* should put a bridge week between
  every pair of GM blocks: a bridge is also the natural home for the F1 progression prompt, and it removes
  the A→A collision entirely.

### F9. Day 1/3/5 → Mon/Wed/Fri is an app choice, stated in a test as if printed
- **Severity:** nit
- **Claim:** `GM_LIFTING_DAYS = [0, 2, 4]` (`greyman.ts:123`), and the test title at `greyman.test.ts:131`
  reads "trains Days 1/3/5 — Mon, Wed, Fri".
- **Book says:** the grids use "Day 1 … Day 7" and never name a weekday, anywhere in pp.48–53
  (`MASS-extraction.md` open question 19 records this). p.48 says only that Grey Man "leaves the trainee
  with four days off which allows for more flexibility with conditioning and recovery."
- **Evidence:** read the headers of `p050_1.png` and `p051_1.png`; read PDF page 48.
- **Rectify:** reword the test title to "trains Days 1/3/5 (mapped to Mon/Wed/Fri — the book names no
  weekdays)". The surrounding comment at `greyman.ts:116-122` is otherwise good and correct: the
  "you don't have to stick to the above schedule exactly" licence really does belong to Gladiator (p.55),
  not to Grey Man.

### F10. Two weak test assertions
- **Severity:** nit
- **Claim:** (a) `greyman.test.ts:342` — `expect(plan.detail).not.toMatch(/5–10%/)` uses an **en dash**;
  the book prints "5-10%" with a hyphen (p.45), so this negative assertion could never fail whatever the app
  wrote. It looks like a guard against regressing to the Mass Template number but does not actually guard.
  (b) `greyman.test.ts:173-180` ("gives five A days and four B days per block") enshrines the 5:4 imbalance
  of F8 as if it were a book fact; it is a consequence of an app choice and carries no page reference,
  unlike every other assertion in the file.
- **Book says:** n/a — this is test quality, not fidelity.
- **Evidence:** read `test/greyman.test.ts` in full and PDF page 45.
- **Rectify:** make (a) `not.toMatch(/5\s*[-–]\s*10\s*%/)`; add a "this is our choice, the book is silent
  (OQ 18)" comment to (b).

### F11. "Four days off" (p.48) versus "3 days of conditioning" (p.39)
- **Severity:** nit — flagged for the conditioning audit, not actionable in `greyman.ts`
- **Claim:** `GREY_MAN_PROTOCOL.conditioning = 'green'` and, per `docs/mass-design.md` §9 step 9, the app
  defaults to **two** conditioning days (Tue/Sat, user editable, already recorded as a DEVIATION).
- **Book says:** p.48 — "It leaves the trainee with four days off which allows for more flexibility with
  conditioning and recovery." p.39 — "Grey Man is a three-day-per-week alternating A/B/A style template…
  A favorite with operational clients that want to balance **3 days of lifting with 3 days of
  conditioning**." The two descriptions of the same template do not agree, and p.99 caps Green at ≤3/week.
- **Evidence:** read PDF pages 39, 48.
- **Rectify:** nothing here. Carry the p.39 sentence into the conditioning audit as evidence that **three**
  Green days, not two, is this template's own stated intent, and that three sits inside the p.99 cap.

---

## On the extraction doc

`docs/MASS/MASS-extraction.md` §"GREY MAN TEMPLATE (pp. 48–53)" is accurate on every point I checked: the
grid, the cluster contents, the 10%-vs-5–10% distinction (line 1635), the absence of AMRAP/peaking (line
1575), and the open questions about the block seam (18), the weekday mapping (19) and the `4-5` set range
(12). Two small things:

- Line 343 summarises the alternation as "depends on week parity". That is not wrong — as F7 shows, week
  parity combined with the day slot is equivalent to the ordinal — but it sits oddly beside the code
  comments that call week parity flatly wrong. One of the two should be corrected; the code's is the one
  that is actually inaccurate.
- Nothing in the extraction was contradicted by the pages and images I read. It was a reliable guide;
  every claim I spot-checked against the source held up.
