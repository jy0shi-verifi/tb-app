# TB App — Weight-Math Fidelity Audit

> **RESOLUTION (2026-07-09, after community + K. Black forum cross-check).**
> Two of this audit's calls were revisited:
> - **1RM formula (Epley → Brzycki): CONFIRMED & FIXED.** Real bug; the app now matches KB's book numbers. ✅
> - **Default basis: the audit said flip `tm → 1rm`. OVERRIDDEN — keep the 90% TM default.** The book's *letter* (template text + Kane example) uses the true 1RM, but K. Black's own forum guidance (t=145, t=29, Sep 2016, post-3rd-ed) recommends a **90% Training Max for high-frequency templates like Operator** — the "greasing the groove" effect gives breathing room so every session is hittable even on a bad day. Community + third-party tools concur, and flag *"using true 1RM as your TM"* as the #1 stall-causing mistake for first-timers. The TM trigger is **template frequency, NOT conditioning volume** (this audit's "TM because you run Black" reasoning was wrong on the *why*, right on the *what*). So Operator stays on TM by default; true 1RM is the advanced opt-in. Section 3 below (the "#2 default → 1rm" fix) is superseded by this note.

## 1. Verdict

**Divergent (default config).** Verified firsthand against TB1 3rd ed (`updated 3rd volume.pdf`) and TB2, and against the app source. The app's Operator wave (%s, reps, sets), block length, retest ladder, forced-progression mechanic, and Base-Building "no weight math" are all faithful. But two settings compound into **wrong loads every session**:

1. **1RM estimation formula is wrong.** The app uses **Epley** (`weight × (1 + reps/30)`). KB tells you to plug a 3–5-rep max into an online calculator, and his own worked numbers in the book are produced by **Brzycki** (`weight × 36/(37−reps)`), not Epley. Epley over-estimates the 1RM by ~3.7% at 5 reps.
2. **The default basis is wrong.** `settings.loadBasis` defaults to `'tm'` (90% of 1RM). In TB1, standard Operator percentages run off the **true 1RM**; the 90% Training Max is an *optional troubleshooting fix* for older/advanced lifters or those running heavy conditioning (p153), and a *starting caution* for infantry/SOF on the heavy cluster (p65). It is not the default.

These two errors point in opposite directions and *partially* cancel (Epley too high × 0.90 too low), which is why the app doesn't look wildly off — but they do **not** cancel exactly. Net effect at Josh's realistic maxes: the app-default load lands **0–4 kg BELOW** the book on most weeks, and the gap is **largest on the heavy weeks** (wk6 bench: app 28 kg vs book 32 kg — a 12% under-load on the session that matters most). One correction on its own would over-shoot the book; you must fix **both** to match.

Correction on the extracted rules I was handed: the "rounding" rows claimed KB mandates round-*up* and that the app's floor-rounding diverges. **That is wrong.** TB1 p113 on Kane's own Operator example says verbatim *"He rounds down on the weights if necessary."* The app's floor-down rounding **matches** the book's Operator worked example. The "round up or down" quote (p105) is about a *weighted-pull-up backpack* plate, not the barbell/DB Operator loads. So rounding is a ✅, not a ❌.

---

## 2. Rule-by-rule table

| Rule | Book says (+page, TB1 printed pages) | App does (+file:line) | Match? | Notes |
|---|---|---|---|---|
| **What % runs off (1RM vs TM)** | Operator %s are "percentage of your one repetition maximum" (p63). Kane's worked loads run off the **true** max: "170lbs (70% of 244lbs – his Maximum)" (p113). TM is an *optional* fix only (p153). | `basisMax()` returns `trainingMax(oneRM)` when basis==='tm'; **default is `'tm'`** → 90%×1RM. `calc.ts:18-20`, applied `program.ts:70`. | ❌ | Default shrinks every working weight by ~10% vs the book's true-1RM basis. The optional `'1rm'` toggle would match the book. |
| **TM = 90% of 1RM** | Defined exactly: "A TM is simply 90% of your true one rep max… Recommended if you're… older or advanced" (p153). TB2 corroborates & attributes to Wendler (TB2 p62). | `trainingMax = oneRM * 0.9` `calc.ts:13-15`. | ✅ (definition) / ❌ (as default) | The 90% number is faithful; making it the permanent default for all lifts is not. |
| **1RM estimation method** | Test a 3–5RM, plug into a calculator (names exrx.net), p103. **His worked numbers are Brzycki, not Epley:** squat 375×5→**422** (Brzycki 421.9, Epley 437.5); bench 230×3→**244** (Brzycki 243.5, Epley 253.0); WPU 200×5→**225** (Brzycki 225.0, Epley 233.3), p104/106/112. | `estimate1RM = weight*(1+reps/30)` = **Epley** `calc.ts:6-10`. | ❌ | **Quantified:** at 5 reps Epley is +3.7% high. Per-DB: 30 kg×5 → Epley 35.0 vs Brzycki 33.75 (**+1.25 kg**); 40 kg×5 → 46.67 vs 45.0 (**+1.67 kg**); 24 kg×5 → 28.0 vs 27.0 (**+1.0 kg**). At 3 reps ~+3.9%. |
| **Establish max via rep-max conversion** | "You don't actually have to test a ONE rep maximum… testing a three to five rep maximum, and then calculating" (p103). | Maxes screen takes weight×reps and converts `Maxes.tsx:97`, `calc.ts:52-53`. | ✅ | Approach matches; only the formula (Epley) differs — see row above. |
| **6-week wave — percentages** | W1 70 / W2 80 / W3 90 / W4 75 / W5 85 / W6 95 (Operator Template, p63). | `OPERATOR_WAVE` = 70/80/90/75/85/95 `program.ts:46-53`. | ✅ | Exact. |
| **6-week wave — reps** | Ranges: 5/5/3/5/3/**1-2** (p63). | 5/5/3/5/3/**2** `program.ts:47-52`. | ✅ | All inside book ranges; wk6=2 is inside "1-2". |
| **Sets** | "3-5" sets; "I strongly recommend you stick to the minimums for your first block" (p63). | Hard-coded `sets: 3` `program.ts:47-52`. | ✅ | 3 = the recommended minimum. Removes the 3–5 flexibility but is book-endorsed. |
| **Rounding direction** | Kane's Operator example: **"He rounds down on the weights if necessary"** (p113). (The "round up or down" line, p105, is a weighted-pull-up backpack plate, not DB/barbell loads.) | `Math.floor(raw/increment)*increment` — floor down `calc.ts:44`. | ✅ | **Corrects the extracted rule.** App's floor-down matches KB's Operator worked example exactly. |
| **Forced-progression increment (upper/lower split)** | "Add 5-10lbs… 5lbs for upper body, 10lbs for lower body" (p107). | Bench/Row `progressStep: 2.5`, Squat `5` (kg) `program.ts:41-43`. | ⚠️ | Metric adaptation: 2.5 kg ≈ 5.5 lb (upper), 5 kg ≈ 11 lb (lower). Direction & upper<lower split match; kg steps are ~10% larger than the literal lb. Acceptable, but not literal. |
| **What the increment is added to** | "you are adding that weight to the 1rm, not to every lifting session… calculate my new 1rm as 310… use 310 to calculate the weekly loads" (p107). | `effective1RM = estimate1RM + bumpKg`, then recompute `calc.ts:52-53`, `progression.ts:59`. | ✅ | Exact mechanic — bump the 1RM, recompute the wave. |
| **First-block length** | "Very first block is always 12 weeks followed by Retest method" (p108). | Memory/docs: first run = 12 wks (two 6-wk blocks). Phase length 6 wks/block `program.ts:275`. | ✅ | Matches. |
| **Retest cadence thereafter** | Then retest every 6 wks; when it slows, every 12; then Force-Progress every 6; then 6–12 (p108). | "~every 6 weeks thereafter." | ✅ | Matches the immediate next rung. |
| **Block length / min before progression** | "a block is 6 weeks… no re-testing or forced progression for at least 6 weeks. 6 is the minimum" (p104). | Operator phase = 6 wks `program.ts:275`. | ✅ | Matches. |
| **"Stay same numbers" option** | Three end-of-block choices incl. "Stay with the same numbers" (p104/108). | Repeat-block supported. | ✅ | Preserved. |
| **Base Building — SE loads** | "15%-30% of your estimated 1 repetition maximums. No need to actually test" (TB2 p120). | No weight computed for SE; "one token weight, set once" `program.ts:165,185`. | ✅ | App correctly does no SE weight math. |
| **BB weeks 6–8 strength basis** | TB2 defers to TB1/Wendler: "use a 90% Training Max… for the entire 8 week Block" (TB2 p62). | `bbStrengthIntro` = light 3×5, "leave 2+ in tank" `program.ts:200-212`. | ⚠️ | The app's light re-acclimation is its own interpretation (book prescribes no BB-specific numbers), reasonable but not a verbatim book scheme. Not a load-math error since no number is handed over. |

---

## 3. Divergences to fix (ranked)

**#1 — 1RM formula: switch Epley → Brzycki (biggest fidelity gap).**
`calc.ts:7-10`. Replace:
```ts
return weight * (1 + reps / 30)          // Epley
```
with:
```ts
return (weight * 36) / (37 - reps)        // Brzycki — matches KB's exrx numbers; reps<37
```
Guard `reps < 37` (already effectively true for 1–5 rep tests). This reproduces the book's 422/244/225 exactly. Update the code comment ("Epley estimated 1RM"→"Brzycki").

**#2 — Default `loadBasis` should be `'1rm'`, not `'tm'`.**
Standard Operator runs off the true 1RM (p63, p113). Change the default in the settings initializer/type default so a fresh install uses `'1rm'`. Keep the `'tm'` option available (label it "90% Training Max — older/advanced or heavy conditioning," per p153) — it's a legitimate *opt-in*, just not the default. **Note for Josh specifically:** he *is* running Operator concurrently with a full conditioning block, which is exactly the case KB says the 90% TM is "recommended" for (p153). So the TM basis may be the right *choice for him* — but it should be a conscious opt-in, not a silent default, and it must sit on top of a **correct (Brzycki) 1RM**.

**#3 — Fix the two errors together, not one at a time.** Because Epley (+3.7%) and TM (−10%) partly cancel, fixing only #2 (Epley off true 1RM) would over-shoot the book by ~3.7% on every lift; fixing only #1 (Brzycki × 0.9 TM) would under-shoot by ~10%. The book-faithful target is **Brzycki off true 1RM**. Encode that as the reference in tests (§4).

**#4 (minor, ⚠️) — Forced-progression increment is metric-rounded ~10% heavy.** `program.ts:41-43`. 2.5/5 kg vs literal 5/10 lb (2.27/4.54 kg). Directionally correct; leave as-is for clean DB math, or use 2/4 kg if you want to stay under the book's lb. Low priority — a per-block one-off, not a per-session load.

Rounding direction (§2) is **correct** and needs no change — disregard the extracted "always round up" claim.

---

## 4. Worked example for unit-test assertions

Two anchors below: **(A) KB's own book example** (barbell, lb — proves the formula & basis), and **(B) Josh's DB case** (kg/DB, floor-round 2 kg — the actual app path).

### (A) Book anchor — Kane, TB1 p112-113 (assert against the estimator + basis)
Test inputs → expected 1RM (Brzycki), and Week-1 @70% off **true 1RM**, round **down**:
- Squat **375×5 → 1RM 422 lb** (Brzycki 421.9); 70% = 295 lb → book prints **295**. ✅
- Bench **230×3 → 1RM 244 lb** (Brzycki 243.5); 70% = 170 lb → book prints **170**. ✅
- WPU **230×3 → 245 lb** (bodyweight-inclusive; Brzycki 243.5, KB rounds to 245); 70% = 170 lb → **170**, minus 180 bw = no added weight. ✅

Assert: `estimate1RM(375,5)` ≈ 421.9 and rounds to KB's 422; **Epley would give 437.5 — a failing 15.5 lb error.** `estimate1RM(230,3)` ≈ 243.5 (KB 244); Epley 253.0 — failing 9 lb error.

### (B) Josh DB case — book-exact expected loads (kg per dumbbell)
Assumed Test-Day results (per single dumbbell): **Bench 30×5, Squat 40×5, Row 24×5.** DB increment 2 kg, floor-round. Method = **Brzycki off true 1RM** (the fix target).

1RM per DB: Bench **33.75**, Squat **45.00**, Row **27.00**.

| Wk | %×reps | **Bench (book)** | **Squat (book)** | **Row (book)** |
|----|--------|-----------------:|-----------------:|---------------:|
| 1 | 70%×5 | **22** | **30** | **18** |
| 2 | 80%×5 | **26** | **36** | **20** |
| 3 | 90%×3 | **30** | **40** | **24** |
| 4 | 75%×5 | **24** | **32** | **20** |
| 5 | 85%×3 | **28** | **38** | **22** |
| 6 | 95%×2 | **32** | **42** | **24** |

(Arithmetic e.g. Bench wk6: 33.75 × 0.95 = 32.06 → floor to 32. Squat wk3: 45 × 0.90 = 40.5 → 40. Row wk1: 27 × 0.70 = 18.9 → 18.)

**What the app produces TODAY (Epley, default TM basis) for the same inputs — the failing deltas to catch:**

| Wk | Bench: book / app-default (Δ) | Squat: book / app-default (Δ) | Row: book / app-default (Δ) |
|----|---|---|---|
| 1 | 22 / 22 (0) | 30 / 28 (**−2**) | 18 / 16 (**−2**) |
| 2 | 26 / 24 (**−2**) | 36 / 32 (**−4**) | 20 / 20 (0) |
| 3 | 30 / 28 (**−2**) | 40 / 36 (**−4**) | 24 / 22 (**−2**) |
| 4 | 24 / 22 (**−2**) | 32 / 30 (**−2**) | 20 / 18 (**−2**) |
| 5 | 28 / 26 (**−2**) | 38 / 34 (**−4**) | 22 / 20 (**−2**) |
| 6 | 32 / 28 (**−4**) | 42 / 38 (**−4**) | 24 / 22 (**−2**) |

App-default under-loads on 15 of 18 cells, up to **4 kg (~12%)** light on the heaviest week. For reference, the *other* single-fix path — **Epley off true 1RM** (app with `loadBasis:'1rm'`, no formula fix) — over-shoots instead: Bench wk1 24 (book 22), Squat wk6 44 (book 42), Row wk6 26 (book 24). Only **Brzycki off true 1RM** lands on the book column — that's the assertion set to encode.

---

**Files audited (absolute paths):**
`C:\Users\Josh Birch\dev\tb-app\src\lib\calc.ts` (estimate1RM Epley L7-10; trainingMax L13-15; basisMax L18-20; floor-round L44),
`C:\Users\Josh Birch\dev\tb-app\src\lib\progression.ts` (forced-progression on 1RM L57-68),
`C:\Users\Josh Birch\dev\tb-app\src\program.ts` (OPERATOR_WAVE L46-53; progressStep L41-43; TM basis applied L70),
`C:\Users\Josh Birch\dev\tb-app\src\screens\Maxes.tsx` (rep-max entry L97-98).
Book sources: `C:\Users\Josh Birch\OneDrive - joshua-birch\Documents\Fitness Stuff\updated 3rd volume.pdf` (TB1) and `C:\Users\Josh Birch\Calibre Library\K. Black\Tactical Barbell II_ Conditioning (9)\Tactical Barbell II_ Conditioni - K. Black.pdf` (TB2).