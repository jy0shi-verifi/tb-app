# Book audit 02 — cross-cutting rules

**Book:** *Tactical Barbell: Mass Protocol*, K. Black · **App:** branch `mass-extraction`
**Scope:** the rules that apply across all templates — pp.7–22, 47/53/57/62/77/83 (progression), 63–66, 88–93, 139–156.
**Method:** every page read from `docs/MASS/mass-text.txt`; every table image on those pages opened (`p091_1`, `p092_1`, `p140_1`); code read directly, not via the extraction doc.

---

## Verdict

The book-wide *calculation* rules are in good shape: percentages run off the true 1RM with no training max, the p.90 bodyweight-reps rule is implemented exactly as printed (including the author's own worked example as a test fixture), the Bridge Week layout matches the p.92 table cell for cell, and the claim that the book contains no rounding rule is **true** — verified by exhaustive search, which also confirms the book never mentions kilos, so the declared rounding deviation is honestly declared and is the only place a unit choice could distort a printed rule. What is missing is the book-wide *feedback loop*. Mass Protocol has exactly two levers that change the numbers between blocks — Forced Progression up, and a 5–10% (Grey Man: flat 10%) 1RM drop down — and **neither exists as an action in the app**. `progressedKg` is read and displayed but nothing outside `src/dev/seed.ts` ever writes it, so as shipped the app prescribes the same three weeks forever; the author calls progression "where the magic happens" (p.64). Alongside that sit two weighted-bodyweight hazards (an un-warned 1RM field and a bodyweight that silently defaults to 0) and the printed "4–5 sets" range collapsing to 4 with no way to add the fifth — which also silently removes the book's only sanctioned outlet for surplus energy (p.65, p.152).

### Summary

| # | Finding | Severity | Kind |
|---|---|---|---|
| F1 | Forced Progression has no UI — the programme never progresses | **critical** | (a) contradicts book |
| F2 | No "struggled with this lift" flag, so FP cannot be skipped per-exercise | major | (a) |
| F3 | The 10% failure drop is advice text, not an action | major | (a) |
| F4 | Weighted-bodyweight 1RM entry never says "include your bodyweight" | major | (a) |
| F5 | Missing bodyweight silently becomes 0 kg and inflates the load | major | (a) |
| F6 | "4–5 sets" always renders 4; no way to add extra sets | major | (a) |
| F7 | Test-set rep range advertised as 2–5; the book says 2–3 | minor | (a) |
| F8 | "Take 2–3 days off after testing" (p.63) is nowhere in the app | minor | (a) |
| F9 | Skipping Base Building is labelled a DEVIATION; the book explicitly permits it | minor | (c) design doc wrong |
| F10 | "5–10 lbs" mapped to "2.5–5 kg"; the ceiling is 11 lbs | nit | (a) |
| F11 | Exercise order stated as fixed; p.63 says order doesn't matter | nit | (a) |
| F12 | Core/ab work is book-sanctioned but has no home outside the S-cluster budget | minor | (a) |
| F13 | Failure ladder skips the book's first remedy (longer rest) | minor | (a) |
| F14 | Default plan ends without a closing bridge week | nit | (b) gap-fill |

Confirmations (**C1–C10**) follow the findings — several are load-bearing.

---

## Findings

### F1. Forced Progression has no UI — the programme never progresses
- **Severity:** critical
- **Claim:** `OneRmEntry.progressedKg` is read at `src/protocols/greyman.ts:156` (`entry.kg + (entry.progressedKg ?? 0)`) and displayed at `src/screens/History.tsx:218–230` and `src/screens/Maxes.tsx:174`. The **only** writer of a non-zero value in the whole app is `src/dev/seed.ts:213`. `src/screens/Maxes.tsx:130` resets it to 0 on a retest. There is no button, no block-boundary prompt, and nothing in `src/screens/Plan.tsx`. So a real user's 1RMs never move, and blocks 2, 3 and 4 prescribe byte-identical loads to block 1.
- **Book says:** printed **verbatim and identically on six pages** — one per template — which is as close to a book-wide rule as this book gets: *"Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises you struggled with - use the same numbers for the next block."* (pp.47, 53, 57, 62, 77, 83). Restated globally at p.90: *"From there on progression simply consists of adding weight to your 1 rep maximum and recalculating from block to block. Also referred to as Forced Progression in the Tactical Barbell system."* And p.64: *"PROGRESSION from block to block is where the magic happens… When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast."*
- **Evidence:** `grep -rn "progressedKg" src/` returns 11 hits, all reads/displays except the dev seeder. Read `src/screens/Maxes.tsx` and `src/screens/Plan.tsx` in full — no progression control in either. `defaultPlan` (`src/program.ts:58`) chains 3-week blocks, so "block to block" means every 3 weeks — the **bottom** of the 3–6 week window, i.e. the app should be prompting at every block boundary.
- **Rectify:** add a Forced Progression step, per exercise, offered at each block boundary (and reachable from `/maxes`). Default increment 2.5 kg with 5 kg available (see F10). It must write `progressedKg`, not `kg`, so the "tested 100 → now 105" display in History stays truthful and a retest still resets cleanly. Cite p.90 in the copy.

### F2. No "struggled with this lift" flag, so progression cannot be skipped per-exercise
- **Severity:** major
- **Claim:** `OneRmEntry` (`src/types.ts:44–69`) has no struggle/deload marker, nothing derives one from logged sets (`LoggedSet.done` exists but is never aggregated per exercise across a block), and no screen offers one.
- **Book says:** *"Don't force progression for exercises you struggled with - use the same numbers for the next block."* (pp.47, 53, 57, 62, 77, 83) — the second half of the same two-sentence rule as F1.
- **Evidence:** `grep -rn "struggl" src/` returns only the prose in `greyman.ts`'s `EXECUTION_DETAIL`. No data field, no derivation.
- **Rectify:** whatever UI answers F1 must be **per exercise with a skip**, not one global "+2.5 kg to everything" button. Cheapest honest version: at the block boundary, list each exercise with a suggested bump and a "struggled — hold" toggle, pre-ticked when that exercise has undone sets logged in the block. Do not auto-decide silently; the book leaves the judgement to the lifter.

### F3. The repeated-failure 1RM drop is advice text, not an action
- **Severity:** major
- **Claim:** `src/protocols/greyman.ts` `EXECUTION_DETAIL` ends *"If you fail reps repeatedly, drop that lift's 1RM by 10% and recalculate."* That string is rendered as session detail and nothing more. There is no control to apply it, and no detection of repeated failure.
- **Book says:** p.53 (Grey Man, main cluster): *"if you're failing completely before finishing the set then use a longer rest interval; 5 minutes or longer. If you're still failing consistently, lower your 1 rep maximum by 10% and recalculate."* Book-wide FAQ, p.152: *"What if I find the loads used during General Mass too heavy? If you're struggling, drop 5-10% off your 1RMs and continue."* Also p.64: *"if you're consistently not meeting the reps – increase the rest interval and/or lower the weight."*
- **Evidence:** read `greyman.ts` in full; `EXECUTION_DETAIL` is a plain string with no companion handler. Searching for any 0.9 factor outside `basisKg`'s `tm90` branch finds nothing.
- **Rectify:** the same per-exercise 1RM adjuster that fixes F1 should offer "−10%" as well as "+2.5 kg" — one control, two directions. This is the safety half of the loop and matters more than the progression half.

### F4. Weighted-bodyweight 1RM entry never tells the user to include bodyweight
- **Severity:** major
- **Claim:** `src/screens/Maxes.tsx:42` — `isBodyweight = (ex) => ex.defaultLoading === 'bodyweightReps'`. A `weightedBodyweight` exercise therefore falls through to the ordinary weight+reps path and gets a field placeholdered **`kg on bar`** (`Maxes.tsx:203`), stored as `unit: 'total'` (`Maxes.tsx:126`). Nothing on the screen says the number must include the lifter's own bodyweight. `WorkingPreview` is also gated to `defaultLoading === 'barbell'` (`Maxes.tsx:224`), so a weighted-pull-up entry gets no sanity preview either.
- **Book says:** p.90: *"If the movements are weighted – calculate normally as you would any other exercise but include your bodyweight in the calculation. If you don't include your bodyweight and just factor-in the external weight – things will get too heavy too fast. You've been warned."* The author considers this important enough to pull out as a **full-page callout box** on p.91 (image `docs/MASS/images/p091_1.png`): *"When testing weighted bodyweight exercises – calculate normally as you would any other exercise **but include your bodyweight in the calculation.**"*
- **Evidence:** read `Maxes.tsx` in full; opened `p091_1.png`. The consuming code is correct — `weightedBodyweightAddedKg` in `src/lib/barbell.ts:248` subtracts bodyweight and its doc comment quotes p.90 — so the *math* assumes a system 1RM while the *input field* asks for "kg on bar". The mismatch is entirely in the entry UI.
- **Rectify:** give `weightedBodyweight` its own branch in `Maxes.tsx`: placeholder "kg incl. bodyweight", the p.90 warning inline, and ideally a helper that adds the stored bodyweight to a typed added-weight figure so the user cannot get it wrong. Extend `WorkingPreview` to this loading mode.

### F5. A missing bodyweight silently becomes 0 kg and massively inflates the load
- **Severity:** major
- **Claim:** `src/protocols/greyman.ts:204` — `const bw = ctx.settings.bodyweightKg ?? 0`. `bodyweightKg` is optional (`src/types.ts:149`) and only set from `src/screens/Settings.tsx:211`; there is no prompt and no default. With it unset, `weightedBodyweightAddedKg(systemOneRm, 0, 70)` returns `0.7 × systemOneRm` as *added* weight — for an 82 kg lifter with a 120 kg system 1RM that is 84 kg hung off a belt instead of 2 kg.
- **Book says:** the failure mode the app produces is precisely the one p.90 warns against: *"If you don't include your bodyweight and just factor-in the external weight – things will get too heavy too fast. You've been warned."*
- **Evidence:** `grep -rn "bodyweightKg" src/` — 6 hits; only `Settings.tsx` writes it, `seed.ts` sets 82, `greyman.ts` defaults to 0. No guard between them.
- **Rectify:** treat a missing bodyweight exactly the way `planExercise` already treats a missing 1RM — return the honest-gap shape (`note: 'Set your bodyweight to see the working weight'`, no `weight`) instead of computing. That pattern already exists ~20 lines above at `greyman.ts:186`; reuse it. Also close open question §8.5 in `docs/mass-design.md`, which still lists bodyweight storage as unresolved even though `Settings.tsx:206` ships it.

### F6. The printed "4–5 sets" range always renders 4, and there is no way to add the fifth
- **Severity:** major
- **Claim:** `src/protocols/greyman.ts` `planExercise` opens with `const count = p.setsMin` and builds exactly that many sets — so `setsMax` is only ever used for display. `schemeLine` still advertises **"4–5 × 8"**, and `src/screens/Session.tsx` has no add-set affordance (no `addSet`/"Add set" anywhere; the renderer iterates `ex[0].sets.length` at `Session.tsx:625`). The user is shown a range and given one end of it.
- **Book says:** the p.51 grid prints `4-5 x 8`; p.52 spells it out: *"Perform 4 to 5 sets of 8 reps with 70% of your 1 rep maximum for both exercises."* And extra sets are the book's designated outlet for surplus energy, twice: p.65 *"If you have surplus energy to burn – add extra sets to your main lifts"*; p.152 FAQ *"Can I add isolation work or supplemental exercises to the General Mass templates? I would advise against it… Add extra sets instead."*
- **Evidence:** read `greyman.ts` and `Session.tsx`. Also an **undeclared shortfall against the app's own design**: `docs/mass-design.md` §2.3 states *"`4-5` is a genuine range, not a typo — the user picks 4 or 5"*, and step 4 of §9 is marked DONE without it.
- **Rectify:** either a per-block setting ("main lifts: 4 or 5 sets") or an "+ add set" control on main-lift exercises in the Session screen. Keep S at a flat 4 (the book prints a single number there). This also closes the p.65/p.152 "add extra sets instead" path referenced in F12.

### F7. The test-set rep range is advertised as 2–5; the book says 2–3
- **Severity:** minor
- **Claim:** `src/screens/Maxes.tsx:148` — *"Enter a **2–5 rep** test set and the app works out your 1RM."* The handler accepts any `r > 1` with no upper bound (`Maxes.tsx:120`).
- **Book says:** p.90: *"It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators."* p.63: *"Don't get OCD – a 2-3 rep maximum to calculate a 1RM is fine. But DO test. Don't guess."* Both name 2–3; neither sanctions 4 or 5.
- **Evidence:** both passages read in full; no other page widens the range.
- **Rectify:** change the copy to "2–3 rep test set" and clamp or warn above 3. Brzycki stays accurate at 4–5 reps, so this is about fidelity rather than safety — but it is a printed constraint the app currently contradicts without declaring it. If 5 is wanted deliberately, label it a DEVIATION in `mass-design.md`.

### F8. "After testing take two or three days off before starting the block" is nowhere
- **Severity:** minor
- **Claim:** `/maxes` writes a 1RM and returns the user straight to a live plan. Nothing defers the block start, and nothing says to rest.
- **Book says:** p.63, in the General Mass Miscellaneous section that governs every template: *"Calculate 1 rep maximums for all exercises in your cluster prior to beginning. You can do your testing in one session or over two. **After testing take two or three days off before starting the block.**"*
- **Evidence:** read `Maxes.tsx` and `Plan.tsx`. Worth noting the app satisfies this **incidentally** when testing happens in a Bridge Week — `src/protocols/bridge.ts:24` puts the test days at Day 4/5, leaving Days 6–7 rest before the next block. It is only the first-run / mid-week path that misses it.
- **Rectify:** one line of copy on `/maxes` ("take 2–3 days off before starting the block — p.63"), and ideally an offer to set the plan start date 3 days out when the plan has not started yet.

### F9. Skipping Base Building is labelled a DEVIATION, but the book explicitly permits it
- **Severity:** minor · **Kind: (c) — the design doc is wrong, in the app's disfavour**
- **Claim:** `docs/mass-design.md` §1 records *"Base Building — **Skipped.** Start at General Mass … (**DEVIATION** — book sequences it first, p.147)"*, and §8.1 says the departure was *"taken because Josh already runs"* and that *"p.151 calls it highly recommended"*.
- **Book says:** three separate places make it optional, and one of them names Josh's exact situation. p.17: *"Along with an additional **optional** component: 4. Base Building… Base Building is an **optional** 6-week general preparation phase."* p.18: *"If you already have a current/established endurance base of some kind, **(i.e. runner, mountaineering, etc.) feel free to skip it.**"* p.151 FAQ: *"Do I have to do Base Building? **No.** Base Building is optional unless you're an operational athlete… It is, however, highly recommended."*
- **Evidence:** pp.17–18 and p.151 read in full. The design doc cites only p.147 (the Consolidation checklist, which is a recommended sequence, not a requirement) and the "highly recommended" half of p.151 without the "No" that precedes it.
- **Rectify:** downgrade the label in `docs/mass-design.md` §1 and §8.1 from **DEVIATION** to a book-sanctioned option, citing p.18's runner clause. This matters because the deviation count is used as a fidelity signal — carrying a false one devalues the real ones.

### F10. "5–10 lbs" mapped to "2.5–5 kg"; the top of the range is 11 lbs
- **Severity:** nit
- **Claim:** `docs/mass-design.md` §2.6 renders the progression increment as *"add 5–10 lbs (2.5–5 kg)"*. Nothing in code implements it yet (F1), so this is the spec for whatever gets built.
- **Book says:** *"add 5-10lbs to 1RMs"* (pp.47, 53, 57, 62, 77, 83). 5 lb = 2.27 kg; 10 lb = 4.54 kg.
- **Evidence:** searched the entire text for `kilo`, `kg`, `metric` — **zero** unit hits; the book is exclusively imperial, so every kg figure in the app is a conversion we chose. This is the only place a printed rule is expressed as an absolute number the app will act on, so it is the only real conversion risk in the codebase (see C6).
- **Rectify:** offer 2.5 kg (default) and 5 kg but present them as "≈5 lb / ≈10 lb", or cap the top option at 4.5 kg. Note the practical floor is 2.5 kg anyway: with Josh's plate set a +2.5 kg 1RM moves a 70% week-1 squat from 70 kg to 72.5 kg, so the increment does survive rounding — a hypothetical 1 kg bump would not.

### F11. Exercise order is stated as fixed; p.63 says it does not matter
- **Severity:** nit
- **Claim:** `src/protocols/greyman.ts` `EXECUTION_DETAIL` opens *"Main lifts first, then the supplementary cluster."*
- **Book says:** p.50/p.52 do put the main lifts first in the worked example, but the book-wide misc section is explicit that this is preference, not prescription — p.63: *"Choose whatever order of exercise you like. I personally like starting with BP… **Ultimately it doesn't matter – it's entirely up to you.** Just get the prescribed work done."* p.63 also permits stacking: *"Optionally, you can circuit-train or stack a couple exercises together. So long as you rest adequately in between sets regardless of exercise."* The app only mentions super-setting, and only for S (p.53).
- **Evidence:** pp.50, 52, 53, 63 read in full.
- **Rectify:** soften to "main lifts first is the author's preference; order is up to you (p.63)". Zero-cost copy change; no behaviour needs to move.

### F12. Core/ab work is book-sanctioned but has no home outside the S-cluster budget
- **Severity:** minor
- **Claim:** `docs/mass-design.md` §2.5 concludes *"the app should not offer an 'add extra exercise' affordance outside it [the S cluster]"*, and the app follows that — the only place to add anything is the S-cluster builder in `src/screens/Plan.tsx:269+`, which hard-caps at 4–6 exercises per p.49.
- **Book says:** p.64–65 bans extra work *and then names two exemptions in the next breath*: *"Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight work, nothing. If you have surplus energy to burn – **add extra sets to your main lifts.** You can add some **core work** if desired, bodyweight-based ab and lower back stuff. Hanging leg raises, hyperextensions, face-pulls, ab roller, like that."* Reaffirmed at p.152: *"I would advise against it. **Other than some minimal core/ab-work.** Unless otherwise stated of course, like Grey Man. Add extra sets instead."*
- **Evidence:** pp.64–65 and p.152 read in full; `Plan.tsx` S-cluster builder read.
- **Rectify:** the design's rule is *stricter* than the book on two counts. Extra sets is F6. For core: either allow an optional core/ab slot outside the 4–6 S budget (the `unloaded` loading kind already exists for exactly this shape) or, at minimum, say in the S-cluster builder copy that core work is permitted per p.65 — right now a user who puts hanging leg raises in S burns one of six S slots on something the book treats as outside the cluster.

### F13. The failure ladder skips the book's first remedy
- **Severity:** minor
- **Claim:** `EXECUTION_DETAIL` compresses the book's escalation to *"If you fail reps repeatedly, drop that lift's 1RM by 10% and recalculate."*
- **Book says:** the book gives a two-step ladder and the 1RM drop is the *second* rung. pp.52–53: *"if you're failing completely before finishing the set then **use a longer rest interval; 5 minutes or longer**. **If you're still failing consistently**, lower your 1 rep maximum by 10% and recalculate."* p.64 again, book-wide: *"if you're consistently not meeting the reps – **increase the rest interval and/or lower the weight**"*, plus the reassurance that this is normal: *"Don't be surprised or discouraged if you find yourself resting for 3-5 minutes or longer in between sets for the first little while."* Also worth surfacing for a TB1 reader: *"This isn't Operator template or Tactical Barbell I, the Golden Rule is NOT in effect for Mass Protocol."* (p.63).
- **Evidence:** pp.52–53, 63–65 read in full.
- **Rectify:** state both rungs in the session detail, in order. Pairs naturally with F3's control, which should be the second thing offered, not the first.

### F14. The default plan ends without a closing bridge week
- **Severity:** nit · **Kind: (b) — a gap the book leaves, filled reasonably**
- **Claim:** `defaultPlan` (`src/program.ts:58`) is `gm3, gm3, bridge1, gm3, gm3` — 13 weeks. The second six-week General stretch has no bridge after it; `resolveInPlan` (`src/program.ts:163`) then holds on the last day with `status: 'complete'`.
- **Book says:** p.93: *"I recommend taking a Bridge week once every two to three months whether you feel like it or not. Bridging more than that is certainly acceptable."* p.145: *"Don't forget to occasionally bridge/de-load."* p.140's Standard Cycle (image `p140_1.png`) is General 6wk (Green) · General 6wk (Green) · **Bridge 1wk** · Specificity 3wk (Black) · Specificity 3wk (Black) — the bridge sits after the twelve General weeks, at the change of phase.
- **Evidence:** opened `p140_1.png`; read `program.ts` and `Plan.tsx` (which already cites p.93 correctly in its copy at line 56).
- **Rectify:** append a trailing bridge block to `defaultPlan`, or prompt to extend the plan with one when `status` reaches `complete`. Low stakes — the app's 6-weeks-then-bridge rhythm is already inside the book's window, and Plan.tsx lets the user add blocks by hand.

---

## Where the app is correct

**C1. 1RM, not training max — right, and right for the right reason.** Every Grey Man prescription carries `basis: '1rm'` (`src/protocols/greyman.ts`), `basisKg` only applies the 0.9 factor when `basis === 'tm90'` (`greyman.ts:157`), and nothing anywhere sets `tm90`. That matches pp.88–89, where the TM is scoped to one cluster and one cluster only: *"This Bulgarian inspired approach… If you decide to go with this, I highly recommend using a training maximum in place of a 1 Rep Max for both MS and MH clusters. A training maximum or TM is 90% of your True/or 1 Rep Max. The TM is used instead of the 1RM to calculate your weekly loads."* Searched the full text — that is the **only** appearance of a training maximum in 160 pages. Putting `tm90` on the `Prescription` (i.e. per cluster) rather than on `Settings` or `Protocol` is exactly the right altitude; hoisting it would silently rescale every load in the app. `src/screens/Maxes.tsx:238` even says so on screen. Declared in `mass-design.md` §10 and working as intended.

**C2. Bodyweight-reps rule implemented literally.** `bodyweightReps` (`src/lib/barbell.ts:226`) applies the percentage to reps, not weight, and `greyman.ts:196` routes `bodyweightReps` loading through it. p.90: *"If using just bodyweight – find your maximum number of REPS. Maximum reps act as your 1RM for bodyweight movements… you can do 10 max. If the programming calls for 3 sets x 10 reps @ 70%RM, you'd do 3 sets of 7."* The author's own worked example is a test fixture (`mass-design.md` §7.4). The fractional-rounding rule the book omits is a *declared* deviation (nearest, ties down) — correctly flagged in the function's own doc comment, and consistent with p.52's aside that a bodyweight S exercise can equally *"keep it simple and do 4 sets of 12."*

**C3. Bridge Week matches the printed table exactly.** `src/protocols/bridge.ts:24` `TEST_DAYS = [3, 4]` against the p.92 table (image verified): `Day1 Rest · Day2 Rest · Day3 Rest · Day4 Test · Day5 Test · Day6 Rest · Day7 Rest`. Test days are **optional**, per p.93: *"You can test 1RMs on Day 4, Day 5, or both. If testing is required… testing is only required once before you start the protocol, and maybe before your first Specificity block. If no 1RM testing is required than Test Days become Rest Days."* The allowed-activity string quotes p.93 accurately (walking, hiking, swimming, yoga, stretching; easy bodyweight circuits allowed; avoid weights, HIC and E). Not mandatory in the app — correct, since the book frames bridging as a recommendation, not a requirement. Bonus: putting the tests on Day 4/5 means the two rest days that follow satisfy p.63's "take two or three days off after testing" for free.

**C4. The book really does contain no rounding rule — confirmed.** Searched the full 160-page text for `round`, `nearest`, `closest`, plate and bar-weight terms, and every numeric-precision phrasing. The only hits are conditioning "rounds" and the word "ground". The single passage that resembles guidance — *"No need to get ultra-precise with your calculations. Get within the ballpark"* (p.31) — is scoped to Base Building strength-endurance and explicitly contrasted with maximal-strength work in the same paragraph, exactly as `src/lib/barbell.ts:9–31` argues. **The declared rounding deviation rests on a true premise.** The implementation also does the honest thing the deviation demands: `LoadedBar` returns the untouched `targetKg` alongside `totalKg` and `perSide`, and the Session screen renders all three.

**C5. The Grey Man failure percentage is right, and right to differ from the global one.** `EXECUTION_DETAIL` says a flat 10%. p.53 (Grey Man): *"lower your 1 rep maximum by 10% and recalculate."* p.45 (Mass Template): *"lower your 1 rep maximums by 5-10%."* p.152 (FAQ, generic): *"drop 5-10% off your 1RMs."* The design's note that this is a per-template rule and must not be "harmonised" is correct, and the test fixture guarding it (`mass-design.md` §7.6) is well chosen. What is missing is the *action* (F3), not the number.

**C6. No unit-conversion hazard anywhere except the progression increment.** The book is entirely in pounds and never mentions kilograms; the app is entirely in kilograms and stores no imperial value. Because every percentage-based rule is unit-free, converting the basis has no effect on any printed prescription — 70% of a 1RM is 70% in any unit. The only place a printed *absolute* number must be converted is the 5–10 lb progression increment (F10). Percentages, rep counts, set counts, rest intervals, block lengths and conditioning caps all survive the unit change untouched.

**C7. Estimating a 1RM from a sub-maximal set is sanctioned, and the formula is a free choice.** p.90: *"There's also no need to test a true 1RM with this protocol. It's acceptable to perform a 2 or 3RM and determine 1RM using one of the many free online calculators."* p.63: *"a 2-3 rep maximum to calculate a 1RM is fine."* The book **names no formula and imposes no accuracy standard**, so Brzycki (`estimate1RM`, retained from the strip with its TB1-anchored tests) is an unconstrained implementation choice, not a deviation. The `source: 'tested' | 'estimated'` distinction on `OneRmEntry` is a nice touch the book does not ask for. Only the advertised rep window is off (F7).

**C8. `maxScope` sharing across MASS templates matches the retest rule.** `Protocol.maxScope = 'mass'` for Grey Man and Bridge, `'beginner'` for Beginner. p.90: *"There's no need to regularly test your 1 rep maximums with this protocol. Test as required when changing phases or incorporating new exercises."* A template swap within General is not a phase change, so a shared scope is right; and the reason given in the `src/protocol.ts:228` comment — that the scope separates incompatible loading conventions (kg/DB vs total-on-bar) rather than templates — is the correct framing. p.90's "or incorporating new exercises" is also honoured in practice: adding an S exercise in `/plan` produces an empty 1RM, which `planExercise` renders as an honest "Set your 1RM" gap rather than a fabricated load.

**C9. The extra-work ban and its Grey Man exception are read correctly.** p.64: *"Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no bodyweight work, nothing."* The app offers no add-exercise affordance inside a session and the only editable cluster is Grey Man's S, capped at 4–6 per p.49 and enforced in `Plan.tsx:271`. The FAQ confirms the reading verbatim: *"Can I add isolation work or supplemental exercises to the General Mass templates? I would advise against it… Unless otherwise stated of course, like Grey Man."* (p.152). Two edges are over-tight rather than wrong — extra sets (F6) and core work (F12).

**C10. Missed sessions — a gap the book leaves, filled sensibly.** The book says nothing about a missed lifting session anywhere in 160 pages (the only "make up" passages are about calories, p.127, and about reps within a set). `src/screens/Today.tsx:129` surfaces the most recent unlogged lift day in the last week, and `Today.tsx:50–111` refuses to advance into heavier weeks after a lapse, offering "resume from week N" instead. That is a **(b)-class gap-fill** and a good one: it errs in the direction the book cares about — *"Whatever you do, DON'T start too heavy or overestimate your 1RMs"* (p.64).

Also briefly confirmed and left to the block-programming audit: 3-week blocks (p.19, p.40), `defaultPlan`'s 6-weeks-then-bridge shape mirroring the p.140 Standard Cycle, and Green-with-General / Black-with-Specificity (p.20) with the p.99 weekly caps enforced in `src/protocols/conditioningPlan.ts:28`. The FAQ's *"If you're a civilian or have no mandatory cardiovascular standards to maintain – then you don't have to do any conditioning at all. I still recommend doing 1-2 sessions a week"* (p.154) is satisfied — the Plan screen's day toggles can be emptied to zero.
