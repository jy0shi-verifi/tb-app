# Book audit 04 — Block programming & scheduling

**Book:** *Tactical Barbell: Mass Protocol*, K. Black (Zulu23 Group, 2018).
**Range audited:** pp.38–41 (Programming Overview), p.50–51, p.61, pp.64–67, pp.92–93, pp.139–151.
**Code audited:** `src/program.ts`, `src/protocol.ts`, `src/protocols/bridge.ts`, `src/protocols/greyman.ts`, `src/screens/Plan.tsx`, `src/screens/Program.tsx`, `src/screens/Today.tsx`, `test/plan.test.ts`.
**Date:** 2026-08-23 · **Branch:** `mass-extraction` · **Auditor note:** no code was changed.

All page numbers are PDF pages of `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`, matching the convention in `docs/MASS/MASS-extraction.md`. Every table cited was opened as an image and read directly (`docs/MASS/images/pNNN_N.png`); nothing here is taken on the extraction's word.

---

## Verdict on 3-week vs 6-week blocks

**The app's reading is correct, and it is more strongly supported than the decision record admits.** The extraction (`MASS-extraction.md` §1) framed "General 6 Weeks" (p.140) versus "Both General and Specificity consist of 3-week blocks" (p.40) as an unresolved conflict settled by Josh's judgement plus community practice. It is in fact settled by the book, in two places the extraction did not cite. First, **p.67: "Specificity blocks are three weeks in length. You can run one or more blocks depending on training objectives."** — the book's own statement that a longer stint is *more blocks*, and the p.140 Standard Cycle duly prints Specificity twice at 3 weeks rather than once at 6. Second, and decisively, **no template grid in the book extends past week 3** (Mass p.45, Grey Man p.51, Gladiator p.55, Fighter HT p.60 — all verified as three-row images). A literal 6-week General block has no printed prescription for weeks 4, 5 and 6; it is *unrunnable* from the book as written. The only executable reading of "General — 6 Weeks" is the 3-week wave run twice, i.e. two blocks — which is also what the p.64 progression prose assumes ("PROGRESSION from block to block is where the magic happens… When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast"). Corroborating this, **pp.142 Examples 1 and 2 both print `General x 2` inside a single "Block" cell** (verified in `p142_1.png`, `p142_2.png`) — proof that the author's cycle tables use "Block" as a *slot in a cycle*, not as a fixed unit of time, and that doubling General is expressed as two blocks. The one genuine cost of the reading is arithmetic: the author counts the Standard Cycle as five blocks (p.141 "After a 5-block cycle"; p.140 "Block 6 can be a bridge week"), whereas the app's model makes it seven. That is a labelling divergence, not a programming one (F2). **Keep 3-week blocks. Upgrade the decision record from "decided" to "book-cited" with pp.67 and 64.**

---

## Summary

| # | Finding | Severity | Category |
|---|---|---|---|
| F1 | 3-week block decision is right, but under-cited — pp.67 and 64 settle it | minor | (c) extraction incomplete |
| F2 | App block numbering (7) diverges from the author's own count (5) | minor | (b) gap |
| F3 | `defaultPlan()` moves the bridge week and drops the terminal bridge — undeclared | major | (a) contradicts |
| F4 | Plan screen cites the Standard Cycle without its printed week counts — misstates the book | major | (a) contradicts |
| F5 | None of the three p.142 worked examples can be built (no Specificity) | minor | (d) declared deviation |
| F6 | No General : Specificity ratio is shown or guided toward (pp.141–142) | major | (b) gap |
| F7 | Base Building skipped — correctly declared in docs, invisible in the app | minor | (d) declared deviation |
| F8 | Bridge placement is fully general and matches p.93 exactly | **correct** | — |
| F9 | End of plan: dead "Resume" button, and no reassess/next-cycle prompt (p.140, p.147) | major | (a) + (b) |
| F10 | A/B restart per block is right; the code comment describing p.50 is wrong | nit | (c) extraction wrong |
| F11 | `Program.tsx` is plan-blind — the main schedule screen ignores `settings.plan` | **critical** | (a) contradicts |
| F12 | OMS (pp.144–145) unbuilt; its 3–6 week blocks are the one book-sanctioned non-3 length | minor | (b) gap |
| F13 | Consolidation checklist (p.147) exists as prose, not as a flow | minor | (b) gap |
| F14 | No guardrail against a book-discouraged plan (p.41); unreachable today, reachable soon | minor | (b) gap |
| F15 | **Forced Progression is not implemented** — four identical blocks, forever | **critical** | (a) contradicts |

**Where the app is correct** (stated explicitly, per the brief): the 3-week block length and the "any multiple of 3" phase rule (F1); the flat, ordered, protocol-tagged block list as the data shape — it is exactly the shape pp.140–142 print (F5); bridge-week placement rules and content (F8); the A/B alternation restarting each block (F10); the bridge week's `Rest Rest Rest Test Test Rest Rest` layout and its "testing is optional" framing (`bridge.ts`, p.93); Green conditioning attached to the General block rather than the session (p.20, p.140); and the total *General* volume in the default plan — 12 weeks, which matches the Standard Cycle's 6 + 6 exactly.

---

## Findings

### F1. The 3-week block decision is right, but the record under-cites the book
- **Severity:** minor
- **Claim:** `src/protocol.ts:233` (`blockWeeks`), `src/protocols/greyman.ts:113` (`GM_BLOCK_WEEKS = 3`), `docs/mass-design.md:23` — "Block length | 3 weeks; phases run any multiple of 3 | Josh, 2026-08-22". `MASS-extraction.md:100-131` records the question as decided by the user "corroborated by community practice", explicitly noting the 3-week-wave-run-twice reading is "inference… it does not get to become the implementation without a decision from you".
- **Book says:** "Both General and Specificity consist of 3-week blocks." (p.40) — and, not cited anywhere in the repo: **"Specificity blocks are three weeks in length. You can run one or more blocks depending on training objectives."** (p.67). Also "PROGRESSION from block to block is where the magic happens… When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast." (p.64).
- **Evidence:** p.67 read from the text dump and confirmed against the PDF text; the four template grids read as images — `p045_1.png`, `p051_1.png`, `p055_1.png`, `p060_1.png` — every one of them is a three-row (Week 1/2/3) table. `p140_1.png` read cell for cell: Block 1 `General / 6 Weeks / (Green)`, Block 2 identical, Block 3 `Bridge / 1 Week`, Blocks 4–5 `Specificity / 3 Weeks / (Black)`. Nothing in the book prescribes a week 4, 5 or 6 of any template.
- **Rectify:** In `docs/mass-design.md` §1 and `MASS-extraction.md` §1, restate the resolution as book-derived, citing p.67 (the "one or more blocks" pattern), the absence of any week-4 prescription in pp.43–62, and p.64. Change "corroborated by community practice" to a footnote — under the fidelity rule, outside research is a second pass and should not be load-bearing here, because it no longer needs to be.

### F2. Block numbering diverges from the author's own count
- **Severity:** minor
- **Claim:** `src/screens/Plan.tsx:126` numbers blocks `1..N` from the plan array. Under the 3-week model the Standard Cycle is seven entries (gm, gm, gm, gm, bridge, spec, spec).
- **Book says:** "After a 5-block cycle you're at 175lbs." (p.141) and "Block 6 can be a bridge week between cycles or you can transition into something else immediately." (p.140) — the author counts the Standard Cycle as **five** blocks, Bridge included.
- **Evidence:** p.140/p.141 prose; `p142_1.png` and `p142_2.png` print `General x 2` inside one numbered Block cell, confirming that the author's "Block N" is a cycle slot, not a fixed duration. So both numbering schemes are internally consistent; they just count different things.
- **Rectify:** Nothing structural. Add one line of copy to the Plan screen: the book's cycle tables number *slots* (a slot may hold two General blocks), so a plan built here will have more entries than the book's Block 1–5. Prevents a user cross-referencing p.140 concluding the app is wrong.

### F3. `defaultPlan()` relocates the bridge week and drops the terminal bridge, undeclared
- **Severity:** major
- **Claim:** `src/program.ts:58-69` — `defaultPlan()` returns `gm, gm, bridge, gm, gm` = 3+3+1+3+3 = **13 weeks**. Asserted in `test/plan.test.ts:74-83`.
- **Book says:** Standard Cycle (p.140) = General 6wk, General 6wk, Bridge 1wk, Specificity 3wk, Specificity 3wk = **19 weeks**, i.e. under the app's own model: `gm, gm, gm, gm, bridge, spec, spec`. Plus "Block 6 can be a bridge week between cycles" (p.140).
- **Evidence:** `p140_1.png`, transcribed above. Comparing like for like:

  | | Book (p.140) | App `defaultPlan()` |
  |---|---|---|
  | Weeks of General | 12 | 12 ✅ |
  | Bridge weeks | 1 | 1 ✅ |
  | Bridge position | after **all** General, before Specificity | after **half** the General ❌ |
  | Weeks of Specificity | 6 | 0 (declared — F5) |
  | Terminal bridge / next-cycle slot | "Block 6 can be a bridge week" | none ❌ |

  The General volume is exactly right — that is worth keeping. The two departures are placement, not volume. Mid-General bridging is *permitted* ("You can bridge… between blocks of General and General", p.93) and bridging more often than every 2–3 months is "certainly acceptable" (p.93), so this is not a rule violation — but it is not the printed Standard Cycle either, and the app presents it as one.
- **Rectify:** Either (a) move the bridge to the end — `gm, gm, gm, gm, bridge` — so the shape matches the Standard Cycle's General half and the plan ends on the book's own hand-off point; or (b) keep the mid-plan bridge and declare it as a labelled DEVIATION in `docs/mass-design.md` §1 with the p.93 justification. Option (a) is preferred: it is the book's shape, and it makes the plan end where p.140 says to reassess. Either way, add a trailing bridge block so the plan does not simply stop (see F9).

### F4. The Plan screen's citation of the Standard Cycle omits its week counts and so misstates the book
- **Severity:** major
- **Claim:** `src/screens/Plan.tsx:107-110` — "The book's Standard Cycle for a first-timer is General, General, Bridge, Specificity, Specificity (p.140). Specificity isn't built yet, so this starts you with four Grey Man blocks and a bridge week — twelve weeks of lifting."
- **Book says:** the p.140 cells are not bare names. They read `General / 6 Weeks / (Green)`, `General / 6 Weeks / (Green)`, `Bridge / 1 Week`, `Specificity / 3 Weeks / (Black)`, `Specificity / 3 Weeks / (Black)`.
- **Evidence:** `p140_1.png`. The screen's phrasing, read against the app's own "blocks are 3 weeks" banner two cards above it (`Plan.tsx:54`), computes to 3+3+1+3+3 = 13 weeks — coincidentally the app's own plan length, and six weeks short of the book's 19. A user who trusts the screen will believe the Standard Cycle is 13 weeks. That is a fidelity claim on screen that is wrong, which is the one thing this project cannot afford.
- **Rectify:** Quote the cells with their durations: "General 6 weeks (Green) · General 6 weeks (Green) · Bridge 1 week · Specificity 3 weeks (Black) · Specificity 3 weeks (Black) — 19 weeks (p.140). Read as 3-week blocks (p.40, p.67) that is four General blocks, a bridge, then two Specificity blocks." Then state the departure separately.

### F5. The three p.142 worked examples cannot be built — declared, but only in a design doc
- **Severity:** minor
- **Claim:** `src/program.ts:34` — `SELECTABLE_PROTOCOLS = [GREY_MAN_PROTOCOL, BEGINNER_PROTOCOL]`, and `Plan.tsx:174` filters `family !== 'legacy'`, which removes Beginner. The only blocks addable in the UI are **Grey Man** and **Bridge**. `docs/mass-design.md` §10 declares "No Specificity, no Base Building, no other General template."
- **Book says:** three named alternatives to the Standard Cycle, given as "examples of what favoring Specificity might look like" (p.141), plus "A simple long-term option is using a 2:1 ratio of General to Specificity. 2:1 is a solid balanced approach. See example 3." (p.142).
- **Evidence:** transcribed from `p142_1.png`, `p142_2.png`, `p142_3.png` — my own reading matches `MASS-extraction.md` §09 exactly, including the four-column shape of Example 3:

  **Example 1 (p.142)** — 5 columns, one row, no week counts, no conditioning labels:

  | Block 1 | Block 2 | Block 3 | Block 4 | Block 5 |
  |---|---|---|---|---|
  | General x 2 | Specificity | Specificity | Bridge | Specificity |

  **Example 2 (p.142)** — 5 columns:

  | Block 1 | Block 2 | Block 3 | Block 4 | Block 5 |
  |---|---|---|---|---|
  | Specificity | Specificity | Bridge | General x 2 | Specificity |

  **Example 3 (p.142)** — **4** columns; the author's recommended long-term option:

  | Block 1 | Block 2 | Block 3 | Block 4 |
  |---|---|---|---|
  | General | General | Specificity | Bridge |

  **Can the app express these?** The *data model* can express all three exactly — `Settings['plan'].blocks` (`src/types.ts:177-180`) is an ordered list of `{ protocolId, weeks }`, which is precisely the shape of these tables, and `resolveInPlan` (`program.ts:124-176`) walks it correctly. Expanding `General x 2` to two `gm` entries and each unqualified `Specificity` to one 3-week entry, Example 3 becomes `gm, gm, spec, bridge`. **No Specificity protocol exists**, so today none of the three is buildable and only Example 3's General half can be entered. This is a declared gap, not a modelling error — the shape is right.
- **Rectify:** Nothing to fix in the block model. When Specificity lands, ship the three examples plus the Standard Cycle as one-tap presets on the Plan screen, each labelled with its page. Until then, add these transcriptions to `docs/mass-design.md` so the preset work has a fixture to build against.

### F6. The book's ratio guidance is absent from the app
- **Severity:** major
- **Claim:** `src/screens/Plan.tsx` shows a block list, a total week count and a start date. Nothing computes or displays a General : Specificity ratio, and no copy mentions target weight, the 2:1 rule of thumb, or the "reassess after a cycle" instruction.
- **Book says:** "Rule of thumb is to spend more time in General the farther away you are from your target weight." (p.141) · "You might use a 2:1 ratio: 2 blocks of General + 1 Block Specificity, repeat. Throw in a bridge week as needed." (p.141) · "A simple long-term option is using a 2:1 ratio of General to Specificity. 2:1 is a solid balanced approach. See example 3." (p.142) · "After completing a standard cycle, reassess and determine if you need to change the ratio of time spent in General vs Specificity." (p.140)
- **Evidence:** pp.140–142 text; Example 3 image (`p142_3.png`) is the book's own worked 2:1. Note that the ratio is counted in **blocks**, not weeks — "2 blocks of General + 1 Block Specificity" (p.141) — and that the Standard Cycle happens to be 2:1 by weeks as well (12 General : 6 Specificity). Counting blocks is the citable rule.
- **Rectify:** Show a live "General : Specificity — 4 : 0 blocks" line under the block list, excluding Bridge from the count, with the p.141/p.142 quotes as the explanation. When the ratio favours Specificity, surface the p.141 rule of thumb rather than blocking anything. This is guidance the author gives explicitly and the app currently withholds.

### F7. Base Building is skipped — correctly declared in docs, invisible in the app
- **Severity:** minor
- **Claim:** `docs/mass-design.md:29` — "Base Building | **Skipped.** Start at General Mass | Josh, 2026-08-22 (**DEVIATION** — book sequences it first, p.147)", expanded at §9.1. No Base Building protocol exists; `PROTOCOLS` holds only `beginner`, `gm`, `bridge` (`program.ts:27-31`). The Plan screen says nothing about it.
- **Book says:** the Consolidation checklist puts it at item 5: "Perform 6 Weeks of Base Building" (p.147), before "Pick a General Mass Template + Test 1RMs" (item 6). It is *not* in the p.140 Standard Cycle table at all. The FAQ softens it: "No. Base Building is optional unless you're an operational athlete or you're coming into the program with a pre-existing aerobic/endurance base. It is, however, highly recommended." (p.151). OMS adds "Throw in Mass Protocol Base Building once or twice a year before commencing OMS" (p.145). Also: "Take a Bridge week or two after Base Building as well - as needed." (p.147)
- **Evidence:** p.147 checklist and p.151 FAQ read from the text dump; `p140_1.png` confirms Base Building has no cell in the Standard Cycle. The deviation is well-founded — the book itself calls it optional, and Josh already runs.
- **Rectify:** This is the correct call and correctly recorded. The only gap is visibility: add one line to the Plan screen noting that the book puts 6 weeks of Base Building before Block 1 (p.147) and calls it optional but highly recommended (p.151), and that this app starts at General Mass by choice. Deviations should be visible where the user makes the decision, not only in a design doc.

### F8. Bridge-week placement is fully general and matches the book — correct
- **Severity:** correct, no action
- **Claim:** `src/screens/Plan.tsx:183-188` lets a Bridge block be appended anywhere and the up/down controls (`Plan.tsx:92-98`) move it to any position, including first, last, adjacent to another bridge, or between two Grey Man blocks. `resolveInPlan` treats it as an ordinary block.
- **Book says:** "You can bridge in between blocks of General and Specificity, between blocks of General and General, Specificity and Specificity etc." (p.93) · "Take a Bridge week or two after Base Building as well - as needed." (p.147) · "Throw in a bridge week as needed." (p.141) · "Don't forget to occasionally bridge/de-load." (p.145)
- **Evidence:** p.93, p.141, p.145, p.147. Every placement the book names is expressible; the book names no placement the app forbids; and p.147's "a Bridge week or two" (consecutive bridges) works too. The bridge's own content is faithful — `bridge.ts` implements `Rest Rest Rest Test Test Rest Rest` with test days on Day 4/5 marked optional, matching p.93 verbatim, and carries `conditioning: 'none'` because p.93 says to avoid weights, HIC and E.
- **Rectify:** Nothing. One optional addition: p.93 recommends "taking a Bridge week once every two to three months whether you feel like it or not" — the app could flag a plan that runs more than ~12 weeks with no bridge. Advisory only; the app currently never does this, and the default plan's 6-week gap at the end (F3) is exactly the case it would catch.

### F9. End of plan: the book prescribes a behaviour, and the app's current one is a dead button
- **Severity:** major
- **Claim:** `src/program.ts:163-175` — past the end of a plan, `resolveInPlan` returns `status: 'complete'` pinned to the last block's last day. `src/screens/Today.tsx:100-125` then renders a Beginner-shaped card: "Welcome back 👋 … the calendar has run past your programme. Pick up where you left off." with a **"Resume from week N →"** button calling `realign()` (`Today.tsx:56-60`), which writes `settings.phaseStartDate`. But `resolvePosition` (`program.ts:99-100`) returns `resolveInPlan(...)` whenever `plan?.blocks?.length` is truthy and **never reads `phaseStartDate`**. For any user with a block plan the button is inert: it saves a setting nothing reads, the screen re-renders identically, and there is no other exit.
- **Book says:** "After completing a standard cycle, reassess and determine if you need to change the ratio of time spent in General vs Specificity. Block 6 can be a bridge week between cycles or you can transition into something else immediately." (p.140) · Consolidation item 10: "Reassess / Plan the next cycle" (p.147) · "There's no rule that you must favor Specificity as you get close to your target weight. If you're happy with your progress and don't want to rock the boat, keep repeating the Standard Cycle." (p.142)
- **Evidence:** p.140 and p.147 read from the text dump; the dead-button behaviour traced through `resolvePosition` → `resolveInPlan` → `Today.tsx`. `test/plan.test.ts:62-68` asserts only that `status === 'complete'` and does not exercise the UI path, so nothing catches it. So there **is** a book-sanctioned behaviour, and it is not "hold on the last day" — it is *reassess and plan the next cycle*, with three named options (bridge into the next cycle, transition out, or repeat the Standard Cycle).
- **Rectify:** Two changes. (1) Fix the dead button: when `settings.plan` exists, the complete state must offer plan-shaped actions (extend the plan, start a new cycle from today, clear the plan) rather than `realign()`, which cannot affect a plan user. (2) Replace the generic copy with the book's own hand-off: a "Cycle complete — reassess" card citing p.140 and p.147, offering "add a bridge week", "repeat this cycle", and "edit the plan" as the three options the author names.

### F10. A/B restarting each block is right; the code comment describing p.50 is wrong
- **Severity:** nit
- **Claim:** `src/program.ts:83-87` computes `liftingOrdinal` from the week *within the block*, so `greyManDay()` (`greyman.ts:136-138`) returns `A` at the top of every block. `test/plan.test.ts:51-60` asserts it. Correct. However `src/protocol.ts:175` and `src/protocols/greyman.ts:131` both state "The book prints it as a **two-week** grid (p.50)".
- **Book says:** the p.50 GM Exercise Schedule is a **three-week** grid — Week 1: `BP SQ S1 / OHP DL S2 / BP SQ S1`; Week 2: `OHP DL S2 / BP SQ S1 / OHP DL S2`; Week 3: `BP SQ S1 / OHP DL S2 / BP SQ S1` — on Days 1, 3, 5. "Grey Man is a three-day-per-week alternating A/B/A style template." (p.39); "uses a simple alternating 'A-B-A/B-A-B' style schedule" (p.48).
- **Evidence:** `p050_1.png` read directly — three body rows labelled 1, 2, 3. `docs/mass-design.md` §2.2 prints all three rows correctly, so this is an error introduced in the code comments, not in the extraction. **On the substance:** the grid is the *block's* schedule and its week 1 / Day 1 cell is `BP SQ S1` = A. Every block therefore opens on A, exactly as implemented. Continuing the alternation across a bridge would put `OHP DL S2` in the week-1/Day-1 cell of block 2, contradicting the printed grid. Two consequences the book never addresses and the app should not invent a fix for: within a block A runs five times and B four; and two consecutive General blocks put an A session immediately after an A session (Friday then Monday, with the intervening weekend). The book is silent, the printed grid is unambiguous, and the fidelity rule says the grid wins.
- **Rectify:** Change "two-week grid" to "three-week grid" in both comments. Leave the behaviour alone. Optionally note in `mass-design.md` §2.2 that the 5A/4B imbalance and the A→A block seam are consequences of the printed grid, so a future reader does not "fix" them.

### F11. `Program.tsx` — the main schedule screen — ignores the block plan entirely
- **Severity:** critical
- **Claim:** `src/screens/Program.tsx` calls `resolvePosition` once (line 20) to seed the current week, then builds everything else from raw settings: `const phase = PROTOCOLS[settings.currentPhaseId]` (line 17), `addDays(parseISO(settings.phaseStartDate), (week - 1) * 7 + day)` (line 82 and line 136), and `sessionFor(settings.currentPhaseId, week, day, …)` (lines 84 and 151). Neither the week view nor the block view consults `settings.plan`.
- **Book says:** the p.140/p.142 tables are the programme — a sequence of differently-typed blocks. A schedule view that cannot show a Bridge block, or shows Specificity weeks as General, is not showing the programme the book prescribes.
- **Evidence:** read directly from `Program.tsx`. Concretely, with the default plan active and `currentPhaseId` at its default `'beginner'` (`src/db.ts:39`), the Programme tab renders **Beginner** sessions and dates counted from `phaseStartDate` while Today renders **Grey Man** from the plan. Even with `currentPhaseId: 'gm'` the screen shows week 4 of Grey Man (which does not exist — `greyManSessionFor` clamps to week 3 at `greyman.ts:264`, silently repeating week 3) where the plan says "bridge week", and the block view's `blockWeeks` (line 32) is the protocol's length, not the plan's. Every date is wrong whenever `plan.startDate ≠ phaseStartDate`. This is the screen a user opens to see their block programming, and it is the one screen that does not know blocks exist.
- **Rectify:** Drive `Program.tsx` from the plan: resolve each rendered day through `resolvePosition(settings, date)` and call `sessionFor(pos.phaseId, pos.week, pos.day, …)`, so the protocol and the week are per-day rather than global. Anchor dates on `plan.startDate` when a plan exists. In block view, iterate the plan's blocks (showing bridge weeks as bridge weeks) rather than one protocol's `blockWeeks`. Add an e2e that seeds the default plan and asserts week 7 renders as Bridge.

### F12. OMS Protocol (pp.144–145) — unbuilt, and it is the one place the book sanctions a non-3-week block
- **Severity:** minor
- **Claim:** Not implemented, not mentioned in `docs/mass-design.md`. `MASS-extraction.md` §09 has it transcribed.
- **Book says:** "OMS is a simple but powerful long-term continuation protocol for strength and mass… Operator/Mass/Specificity." (p.144) · "If there was a standard perpetual TB model for strength and hypertrophy – this would be it." (p.144) · "OMS is usually started after one Standard cycle, however it can be used right from the get-go as well." (p.144) · "Adjust the ratios as desired. Simply keep repeating the above." (p.144) · "Zulu or I/A can be used in place of Operator, and other General Mass templates can replace Mass. However, Operator/Mass is the favored flagship approach." (p.145) · "Throw in Mass Protocol Base Building once or twice a year before commencing OMS." (p.145) · "Don't forget to occasionally bridge/de-load." (p.145)
- **Evidence:** `p144_1.png` read directly — three columns, **no header row**, each cell two lines: `Operator Template / x 3-6 weeks`, `Mass Template / x 3-6 weeks`, `Specificity / x 3-6 weeks`. My reading matches the extraction exactly. What OMS would need: (1) the **Operator** template, which is *not in this book* — it is Tactical Barbell I, so building it would require a second source and would sit outside this audit's fidelity chain; (2) **variable block length, 3–6 weeks, chosen per block** — the data model already allows it (`PlannedBlock.weeks` is a free number) but the UI does not: `Plan.tsx:90` hard-sets `weeks: PROTOCOLS[protocolId]?.blockWeeks ?? 3` and renders the count as static text (line 132) with no editor, so a 5-week block is unreachable through the UI; (3) an **infinite repeat** — the plan is a finite array with no loop concept, which is also what makes F9 bite; (4) template substitution by name.
- **Rectify:** Do not build OMS now. Record in `docs/mass-design.md` §10 that it is a known unbuilt chapter, that it depends on a template from a different book, and that its 3–6 week block length is the single book-sanctioned exception to the 3-week rule — so any future "blocks are always 3 weeks" invariant must be a Standard-Cycle rule, not a global one. Adding a weeks editor to the Plan screen is the cheap half and would also let a user express p.147's "a Bridge week or two".

### F13. The Consolidation checklist (p.147) is not a flow
- **Severity:** minor
- **Claim:** No part of the app walks the checklist. The Plan screen does the block sequencing (item 10's second half) and `bridge.ts` offers the test days (item 8b), but 1RM testing is never *prompted* at the moments the book names, and there is no reassess step.
- **Book says:** the ten-item checklist (p.147), of which items 4, 6, 8, 8a, 8b, 9 and 10 are scheduling instructions: "Test 1RMs for Base Building Exercise Cluster" (4), "Pick a General Mass Template + Test 1RMs" (6), "Execute General Mass + Green Conditioning" (7), "Bridge Week" (8) with "Pick a Specificity Template/Create Exercise Cluster" (8a) and "Test 1RMs for Specificity" (8b), "Execute Specificity + Black conditioning" (9), "Reassess / Plan the next cycle" (10). Also "If you need a few more days of rest over what Bridge Week provides, by all means take it. Too much rest is better than not enough." (p.147)
- **Evidence:** p.147 read from the text dump; cross-checked against `MASS-extraction.md` §09, which correctly notes this is the only place in pp.139–160 that positions Base Building and the only place that says maxes are *tested* rather than incremented at block boundaries.
- **Rectify:** Two cheap, high-value pieces. (1) During a bridge block that precedes a *different* protocol family, surface item 8a/8b — "next block is Specificity: pick a template and test its 1RMs (p.147)". The bridge protocol already knows its test days; it does not know what comes next, but `resolvePosition` returns `blockIndex` so the caller does. (2) Item 10 at the end of the plan — that is F9's fix, and citing p.147 alongside p.140 strengthens it. Skip items 1–3 (reading and nutrition) and the extra-rest note; the latter is a nutrition rule with no home in this app.

### F14. Nothing warns about a plan the book would call wrong
- **Severity:** minor today, major once Specificity ships
- **Claim:** `Plan.tsx` validates nothing about the sequence. It will accept an empty plan, a plan of nothing but bridge weeks (a training programme that never trains), and any ratio. The only enforced book limit on this screen is the S-cluster's 4–6 (`Plan.tsx:281-287`) and the conditioning caps (line 384).
- **Book says:** "Some of you may want to spend most of your time running Specificity. Even so, **I don't recommend excluding General completely** during hypertrophy phases." (p.41) — and, in the other direction, General-only is explicitly fine: "You can disregard Specificity completely. Run General for as many cycles as required until your target weight is achieved." (p.40) · "For the purposes of this protocol, Specificity works best following some General Mass work." (p.67) · "Rule of thumb is to spend more time in General the farther away you are from your target weight." (p.141)
- **Evidence:** pp.40, 41, 67, 141. Note the asymmetry, which the app must not flatten: **General-only is blessed; Specificity-only is discouraged.** Today the app cannot build a discouraged plan at all — only Grey Man and Bridge are addable (F5) and General-only is the sanctioned case — so this is latent, not live. The reachable-today defects are the degenerate ones: a plan with zero blocks, or one containing only bridge weeks, both of which `resolveInPlan` handles without complaint.
- **Rectify:** A non-blocking advisory, never a block — the author hands these choices to the reader and the app must not overrule him. Suggested rules: (a) a plan containing Specificity but no General → show the p.41 quote; (b) Specificity appearing before any General → show p.67's "works best following some General Mass work"; (c) a plan with no lifting block at all → a plain "this plan has no training blocks". Phrase all three as the author's recommendation with the page number, following the S-cluster counter's existing pattern.

### F15. Forced Progression is not implemented, so consecutive blocks are identical
- **Severity:** critical
- **Claim:** `OneRmEntry.progressedKg` (`src/types.ts:68`) is **read** in `greyman.ts:156-157` (`entry.kg + (entry.progressedKg ?? 0)`), `History.tsx:98/218/226/230` and `Maxes.tsx:174/225`, and **reset to 0** on a fresh test (`Maxes.tsx:105`, `Maxes.tsx:130`). Nothing in `src/` ever increments it except the dev seeder (`src/dev/seed.ts:213`). There is no "+2.5 kg" affordance on `/maxes`, and no block-boundary hook. `test/greyman.test.ts:228-236` proves the arithmetic works when the field is set by hand; no code path sets it.
- **Book says:** "PROGRESSION — Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't force progression for exercises you struggled with - use the same numbers for the next block." (p.53, and identically at pp.47, 57, 62) · "PROGRESSION from block to block is where the magic happens." (p.64) · "When you run consecutive blocks with higher and higher 1RMs, you will turn into a beast." (p.64) · "From there on progression simply consists of adding weight to your 1 rep maximum and recalculating from block to block. Also referred to as Forced Progression in the Tactical Barbell system." (p.90)
- **Evidence:** grep across `src/` for `progressedKg` returns only readers plus the seeder. `docs/mass-design.md` §2.6 specifies the rule correctly and §7 lists it as test fixture 5, but the numbered build list in §9 has no step for it and does not mark it done. The consequence is concrete: `defaultPlan()` produces four Grey Man blocks; with no progression the user lifts **the identical 70/75/80% loads for twelve weeks**, which is precisely the failure the author calls out — the whole point of running consecutive blocks is that each one is heavier. This belongs in a block-programming audit because block sequencing without between-block progression is not the book's programme; it is the same block four times.
- **Rectify:** Build it. At minimum a manual affordance on `/maxes`: per-lift "+2.5 kg / +5 kg" that increments `progressedKg` and leaves `kg` and `testedAt` intact, so History's "tested 100 → +5" display keeps working. Better, hook it to the block boundary — when a new block starts, prompt per lift with the p.53 carve-out ("Don't force progression for exercises you struggled with") as an explicit skip, since that carve-out is the reason this cannot be silent and automatic. Land the §7 fixture-5 test at the same time.

---

## Method note

Every table cited was opened as an image and transcribed independently before being compared with `docs/MASS/MASS-extraction.md` §09: `p140_1.png` (Standard Cycle), `p142_1/2/3.png` (Examples 1–3), `p144_1.png` (OMS), `p050_1.png` (GM exercise schedule), `p051_1.png` (GM programming grid), `p060_1.png` (Fighter HT grid). **The extraction's §09 transcriptions are accurate** — cell for cell, including Example 3's four-column shape and the OMS table's missing header row. The two errors found are elsewhere: the §1 reconciliation is *incomplete* rather than wrong (it misses pp.67 and 64, F1), and the "two-week grid" claim in the code comments contradicts both the image and the extraction's own §2.2 (F10).
