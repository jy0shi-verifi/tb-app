# Book audit 03 — Conditioning (MASS pp.94–111)

**Auditor:** Claude · **Date:** 2026-08-23 · **Branch:** `mass-extraction`
**Book:** *Tactical Barbell: Mass Protocol*, K. Black, Zulu23 Group, 2018 (ISBN 9781999559311).
Page numbers are PDF pages of `docs/MASS/Tactical Barbell_ Mass Protocol - K. Black.pdf`, which is how
`docs/MASS/MASS-extraction.md` and the source comments already cite them.

**Code under audit:** `src/protocols/conditioning.ts`, `src/protocols/conditioningPlan.ts`,
`src/program.ts:228–236`, `src/screens/Plan.tsx:327–412`.

---

## Verdict

**The transcription is excellent; the scheduling engine is not.** All eight session cards, both weekly
caps, both colour pairings and seven of the eight duration caps are transcribed faithfully and carry the
right page anchors — the prose in `conditioning.ts` is closer to the book than most published summaries
of it. The failures are all in the layer that turns that data into a week. The app hard-codes a rule the
book never states — that conditioning only ever lands on a rest day — which silently contradicts p.99's
explicit permission to put Green sessions on lifting days, and which makes the Plan screen's day picker
lie: three of Grey Man's seven day-buttons can be lit up and produce nothing at all. Alongside that:
the flat Green ≤60 / Black ≤20 duration rule from the p.111 recap is missing entirely, Anabolic Sprints
therefore carries no cap, `capMin` is dead data that nothing reads, and the two rules that decide whether
Josh's actual week is legal — the 10-minute Recovery Run exemption (p.102) and extra-curricular activity
counting against the allowance (p.110) — exist only as prose inside a `detail` string. Given that Josh
runs with Runna and `stravaSync` auto-logs *any* run into the current phase, p.110 is the finding with
the most real-world bite. The much-flagged p.104 GREEN banner anomaly turns out to be a non-issue: the
p.98 table settles it, and the app already has it right.

### Summary

| # | Finding | Severity | Class |
|---|---|---|---|
| F1 | Green conditioning can never land on a lifting day | **critical** | (a) contradicts the book |
| F2 | Extra-curricular activity does not consume the allowance | **major** | (b) fills a gap / omitted rule |
| F3 | The p.111 flat duration caps (Green ≤60, Black ≤20) are absent; Anabolic Sprints has no cap | **major** | (a) omits a stated rule |
| F4 | A stored session pick is not validated against the block's colour | **major** | (a) can contradict p.20/p.98 |
| F5 | The 10-minute Recovery Run exemption is unmodelled and Strava violates it | major | (b) fills a gap |
| F6 | `capMin` is stored but read by nothing | minor | (b) inert data |
| F7 | The "only the first N count" warning in `Plan.tsx` is unreachable | minor | UX / cap enforcement is silent |
| F8 | Hardgainer caps flattened away; Endurance Predator's is not even in the text | minor | (a) omits a conditional prescription |
| F9 | `DEFAULT_GREEN_DAYS` comment misdescribes what it does; p.39 recommends 3 for Grey Man | minor | (d) deviation, wrongly justified |
| F10 | Card detail omissions: Fobbits alternates, Hill Sprints rest, Anabolic Sprints rest | nit | (a) incomplete transcription |
| F11 | Endurance Predator card renders as `Walk … · + Sprint …` | nit | presentation |

### Where the app is correct — verified, no action

- **The eight cards are transcribed correctly.** Walk (p.100), Ruck (p.101), Recovery Run (p.102),
  Endurance Predator (p.103), Anabolic Sprints (p.104), Reset-20 (p.105), Hill Sprints (p.106),
  Fobbits (p.107). Every `card` array matches the printed prescription lines word for word, including
  the book's own inconsistent capitalisation (`Walk x 30-60 **M**inutes` vs `Ruck x 30-60 **m**inutes`,
  `x 5-10 **R**ounds` vs `x 3-5 **r**ounds`). `conditioning.ts:46,55,65,76,89,98,109,119`.
- **Alternates are right where the book prints them as a card line.** Recovery Run → `Cycle/Swim/Row`
  (p.102), Reset-20 → `Airdyne/Row/Heavy Bag` (p.105). No other session prints an
  "Alternate Exercises:" line, and the app invents none.
- **Green/Black assignment is correct, including Anabolic Sprints.** See F0 below.
- **Colour pairing is correct.** Green with General Mass, Black with Specificity — "Use Green sessions
  when training General Mass blocks. Use Black with Specificity" (p.20), restated on p.98 and in the
  p.111 recap. `greyman.ts:311` is `green`; `bridge.ts:55` and `beginner.ts:266` are `none`.
  Bridge carrying no colour is right: "Avoid the more intense activities such as weights, HIC, and E"
  (p.93).
- **Grey Man is Green even though p.99 omits it.** p.99's Green list reads "Mass Template 1 & 2,
  Gladiator, Fighter HT" — Grey Man is missing. But p.38 lists Grey Man under General Mass templates and
  p.111's recap is unconditional ("Use the Green sessions with General Mass"). The app resolves the
  book's own omission the only defensible way.
- **Weekly counts are right.** Green `{min:1, max:3}` and Black `{min:1, max:2}` (`conditioning.ts:33,39`)
  match "Perform 1 to 3 … No more than 3" and "Perform 1 to 2 … No more than 2" (p.99), and the p.111
  recap. Reading "1 to 3" as a stated minimum of one is correct, and the Plan screen's empty-state
  ("The book asks for at least {cap.min} a week", `Plan.tsx:410`) is a fair rendering of it.
- **Black is correctly forbidden on lifting days.** "Perform Black sessions on non-lifting days" (p.99)
  is enforced in `conditioningPlan.ts:35` and disabled in the UI at `Plan.tsx:361`. This is the chapter's
  only hard day-placement constraint and the app is the only one of the two colours it gets right.
- **Six of eight `capMin` values are the correct number** (see F3 for the two that are wrong/missing):
  Walk 60 (p.100 card), Ruck 60 (p.101 card), Recovery Run 30 ("Don't run for longer than 30 minutes
  while hypertrophy is the primary objective", p.102), Endurance Predator 60 (p.103 card), Reset-20 20
  ("Don't train for more than 15 to 20 minutes", p.105), Hill Sprints 15 ("No more than 10 sprints or 15
  minutes per session – whichever comes first", p.106), Fobbits 20 ("duration is 15-20 minutes, no
  longer", p.107).
- **The app invents no conditioning rule.** Every enforced constraint traces to p.99 or p.111. The two
  editorial choices — a default day pair, and defaulting the session pick to `options[0]` — are both in
  territory the book leaves open (extraction §Ambiguities 6 and 8), and one of them is declared.
- **Unit tests already assert the right things** (`test/plan.test.ts:115–195`): four-and-four session
  split, verbatim cards, colour pairing, the Green cap, Black off lifting days. `test/plan.test.ts:163`
  ("never displaces a lifting day") is the one that encodes the F1 bug as intended behaviour.

---

## F0. The p.104 GREEN banner — verified, not a finding

The prior extraction flagged (`MASS-extraction.md` §07 Ambiguities 1) that p.104 ANABOLIC SPRINTS
carries a GREEN banner while p.98 lists it under BLACK, and left it unresolved.

**Verified.** `docs/MASS/images/p104_1.png` does read **GREEN**, byte-identical to `p100_1.png` and
`p103_1.png`; `p105_1.png`–`p107_1.png` read **BLACK**. So the banner discrepancy is real.

**Resolved against `docs/MASS/images/p098_1.png`**, the SESSIONS table, which I read directly:

| GREEN | BLACK |
|---|---|
| Walk | Anabolic Sprints |
| Ruck | Reset-20 |
| Recovery Run | Hill Sprints |
| Endurance Predator | Fobbits |

That table is the book's own index of the chapter and puts Anabolic Sprints under BLACK unambiguously.
Three further things agree with it: the session's own text is the p.99 definition of Black almost word
for word ("Black is designed to promote an anabolic environment which in turn supports muscular
hypertrophy" p.99 vs "Sprinting in this fashion stimulates an anabolic response" p.104); Black is
"high intensity/limited duration" (p.99) and this session is 5–10 all-out 30m sprints; and the columns
balance four and four. The GREEN banner on p.104 is a layout error — the same shared image object
carried one page too far.

**The app has this right** (`conditioning.ts:86–93`, Anabolic Sprints in `BLACK_SESSIONS`).
No change needed. `MASS-extraction.md` §07 Ambiguities 1 should be updated from "Not resolved here" to
resolved-in-favour-of-Black, citing the p.98 table, so the next reader does not re-litigate it.

---

## F1. Green conditioning can never land on a lifting day

- **Severity:** critical
- **Class:** (a) contradicts the book
- **Claim:** conditioning is only ever injected into a day whose plan is already `rest`.
  `src/program.ts:233` — `if (plan.type === 'rest' && protocol.conditioning !== 'none')`. The comment
  above it states the rule as fact: "never displaces a lifting day" (`program.ts:232`), and
  `conditioningPlan.ts` repeats it in its module docstring. The behaviour is locked in by
  `test/plan.test.ts:163` and `e2e/plan.spec.ts:48`.
- **Book says:** "Perform 1 to 3 conditioning sessions per week. No more than 3. **Sessions can be
  conducted on non-lifting or lifting days.**" (p.99). The Black paragraph immediately below restricts
  itself — "Perform Black sessions on non-lifting days" (p.99) — which makes the Green permission
  deliberate and load-bearing, not loose wording. There is no rule anywhere in pp.94–111 that keeps
  Green off a lifting day; p.102 in fact prescribes running *around* a lift, and p.97's fourth principle
  is "Conditioning can be used to speed up recovery between lifting sessions."
- **Evidence:** `docs/MASS/mass-text.txt` PDF page 99 (both paragraphs quoted above); `p098_1.png` for
  the colour split. Traced in code: `sessionFor()` (`program.ts:222–236`) calls
  `protocol.sessionFor()` first and only consults `conditioningSessionFor` when the result is `rest`.
  Grey Man's lifting days are `[0,2,4]` (`greyman.ts:309`), so Mon/Wed/Fri can never carry a Green
  session.
- **Compounding UI bug:** `Plan.tsx:361` only marks a day `blocked` when `colour === 'black'`. For Green
  the lifting-day buttons are live; toggling one stores it, `conditioningDaysFor` returns it
  (`conditioningPlan.ts:35` filters lifting days for Black only), the button lights up, the day appears
  in the picker list with a session dropdown — and `sessionFor` still emits the lift. A user who picks
  Mon/Wed/Fri gets **zero** conditioning sessions while the UI shows three scheduled, and those three
  have consumed the entire p.99 allowance of 3.
- **Rectify:** decide whether a Green session on a lifting day is an *additional* session that day or a
  *replacement*. The book is clear it is additional — the lift is unaffected and the same day carries
  both. Concretely: `SessionPlan` needs to carry an optional companion conditioning plan (or `sessionFor`
  needs to return a list), so a lifting day can render "Grey Man — Day A" plus "Green: Walk x 30-60
  Minutes". Until that lands, the honest interim is to block Green on lifting days in the UI the same way
  Black is (`Plan.tsx:361`) and record it as a **declared DEVIATION** in `docs/mass-design.md` §5 —
  "the app does not support conditioning on a lifting day; the book permits it (p.99)". Silently
  accepting the selection and dropping the session is the one option that is not acceptable. Either way
  `test/plan.test.ts:163` and `e2e/plan.spec.ts:48` need rewriting; today they assert the bug.

---

## F2. Extra-curricular activity does not consume the weekly allowance

- **Severity:** major
- **Class:** (b) fills a gap — a stated rule the app does not model
- **Claim:** nothing in `conditioning.ts`, `conditioningPlan.ts` or `Plan.tsx` references extra-curricular
  activity, and nothing decrements the weekly allowance for it. `conditioningDaysFor`
  (`conditioningPlan.ts:29–37`) derives the week purely from `settings.mass.conditioningDays` — a static
  weekday list — with no input from what was actually logged. Meanwhile `stravaSync.ts:113–139`
  auto-creates a `type: 'run'` `SessionLog` for **any** Strava run on any date inside the active phase
  ("Running is owned by Runna: log ANY run (whatever day it lands on)"), so Josh's Runna sessions land in
  the same phase as the MASS block and are counted by nothing.
- **Book says:** "You're going to find it challenging to gain substantial muscle mass if you're also
  participating in serious extra curricular activities like MMA, sports, extra PT etc. **I recommend
  limiting or dropping said activity until your target weight is met.**" (p.110) — and, for when that is
  impossible: "1. **Treat any extra activity as conditioning. Anytime you do that extra-curricular
  activity it counts as one conditioning session. Cross off one Green/Black session for that week.** You
  may have to drop Green/Black completely. So be it." (p.110)
- **Evidence:** `docs/MASS/mass-text.txt` PDF pages 109–111 (EXTRA-CURRICULAR ACTIVITY, both numbered
  workarounds). Cross-checked against `MASS-extraction.md` §07 → Implementation consequences →
  Weekly counting, which already records this rule correctly. Code traced: `grep -rn "conditioning" src/`
  returns no hit in `stravaSync.ts`, and `conditioningDaysFor` takes no session history argument.
- **Note:** `docs/mass-design.md:371-373` records a decision — "**Runna is being retired during mass
  phases** — that is what 'follow the book' means here" — which is the p.110 primary recommendation and
  is a legitimate answer. But that decision lives only in the design doc. The app still auto-logs Runna
  runs into the MASS phase, and offers Josh no signal at all if he does a Runna session mid-block. A
  decision recorded in a markdown file is not an implemented rule.
- **Rectify:** two pieces. (1) Count, don't just schedule: derive the week's conditioning tally from
  logged sessions (any `type: 'run'`/`'hic'` row in the current week that is not a sub-10-minute
  warm-up — see F5), and show it against the cap on the Plan and Today screens: "2 of 3 Green used this
  week". (2) Have Strava-sourced runs that do not match a scheduled conditioning day count toward that
  tally rather than being invisible, and surface the p.110 sentence when the tally hits the cap. If the
  "retire Runna during mass" decision stands, the app should say so at the top of the conditioning card
  and cite p.110, rather than leaving it in the design doc.

---

## F3. The p.111 flat duration caps are missing; Anabolic Sprints has no cap at all

- **Severity:** major
- **Class:** (a) omits a stated rule
- **Claim:** `capMin` is per-session only, and Anabolic Sprints (`conditioning.ts:86–93`) is the one
  session with **no `capMin` field**. There is no colour-level duration rule anywhere in the codebase —
  `grep -rn "capMin" src/` returns only the interface declaration at `conditioning.ts:23` and the eight
  literals.
- **Book says:** the CONDITIONING RECAP, printed as six lines (p.111):
  > Use the Green sessions with General Mass.
  > Use the Black sessions with Specificity.
  > No more than 3 Green Sessions per week.
  > No more than 2 Black sessions per week.
  > **Green Sessions shouldn't exceed 60 minutes.**
  > **Black Sessions shouldn't exceed 20 minutes.**

  The app encodes lines 1–4 and ignores lines 5–6. Line 6 is the only cap that covers Anabolic Sprints:
  its own page gives a round count ("x 5-10 Rounds", p.104) and a warm-up ("5-10 minutes of low intensity
  jogging", p.104) but no session time limit. With a 10-minute warm-up plus ten sprint/walk-back rounds,
  the session realistically runs past 20 minutes — and the book caps it at 20 (p.111).
- **Evidence:** `docs/MASS/mass-text.txt` PDF page 111, transcribed line-for-line in
  `MASS-extraction.md` §07 → CONDITIONING RECAP. Verified the omission in code by reading all eight
  session objects in `conditioning.ts:41–125`.
- **Rectify:** add `GREEN_CAP_MIN = 60` and `BLACK_CAP_MIN = 20` beside `GREEN_PER_WEEK`/`BLACK_PER_WEEK`
  (`conditioning.ts:33,39`) with the p.111 quote, and give Anabolic Sprints `capMin: 20, page: 104` — or
  better, derive its cap from the colour so the provenance stays honest. Note in the code comment that
  Hill Sprints' own 15-minute cap (p.106) is *tighter* than the colour cap, so the effective rule is
  `min(sessionCap, colourCap)` — the extraction already flags this as an internal book inconsistency
  (§07 Ambiguities 4) and `min()` is the reading that never exceeds anything the book says.

---

## F4. A stored session pick is not validated against the block's colour

- **Severity:** major
- **Class:** (a) can contradict p.20/p.98/p.111
- **Claim:** `conditioningPickFor` (`conditioningPlan.ts:40–49`) resolves the stored id through
  `conditioningById`, which searches `ALL_CONDITIONING` — Green *and* Black
  (`conditioning.ts:127,132–133`) — and returns whatever it finds with no colour check:
  ```ts
  const id = settings.mass?.conditioningPick?.[day]
  return (id && conditioningById(id)) || options[0]
  ```
  `settings.mass.conditioningPick` is keyed by weekday alone, not by block or by colour. A pick of
  `'fobbits'` made during a Specificity block therefore survives into the next General Mass block and
  renders a Black session on a Green day — labelled "Green conditioning" by
  `conditioningPlan.ts:66,71`, because the label comes from the protocol while the session comes from
  storage.
- **Book says:** "Green is used alongside General Mass. Black is used alongside Specificity." (p.98),
  restated at p.20 and p.111. And on Black specifically: "Perform Black sessions on non-lifting days"
  (p.99) — a mis-scoped Black pick would also escape the lifting-day filter at `conditioningPlan.ts:35`,
  which keys off `protocol.conditioning`, not off the chosen session.
- **Evidence:** read `conditioningPlan.ts:40–49` and `conditioning.ts:127–136`. No colour comparison
  exists on either path. Not currently reachable through the UI (`Plan.tsx:392–402` only offers
  `sessionsFor(colour)`), and not currently reachable at all because no Specificity protocol exists yet —
  but the settings are persisted and the block planner already supports multi-block plans
  (`mass-design.md` step 8), so this fires the day Alpha or Bravo lands.
- **Rectify:** filter in `conditioningPickFor` — resolve the id, then fall back to `options[0]` unless
  `picked.colour === protocol.conditioning`. One line, and it closes the whole class. Add a unit test
  beside `test/plan.test.ts:185` that stores a Black pick under a `gm` block and asserts a Green session
  comes back.

---

## F5. The 10-minute Recovery Run exemption is unmodelled, and Strava violates it

- **Severity:** major
- **Class:** (b) fills a gap
- **Claim:** the rule appears once, as prose inside a string:
  `conditioning.ts:67` — "A 10-minute run either side of a lift does NOT count as a session. (p.102)".
  Nothing acts on it. There is no concept of a warm-up or cool-down run anywhere in the protocol layer,
  and no conditioning tally for it to be excluded from (see F2). Worse, `stravaSync.ts:113–139` logs any
  Strava run — including a 10-minute pre-lift jog — as a full standalone `SessionLog` with
  `type: 'run'`, `done: true`, on the lifting day's date. Because a lift logged earlier the same day
  blocks it (`stravaSync.ts:112`), but an *unlogged* lift does not, a 10-minute warm-up run synced before
  Josh logs his Monday lift will occupy Monday's session row.
- **Book says:** "10-minute Recovery Runs can be used before and after weight training sessions as well.
  10-minutes as a warm-up prior to the session, and 10-minutes after to cool down and hasten recovery.
  **When done in this fashion they don't count as a conditioning session.**" (p.102)
- **Evidence:** `docs/MASS/mass-text.txt` PDF page 102, third paragraph. Verified the code path by
  reading `stravaSync.ts:104–140` and confirming no duration threshold and no lifting-day awareness.
- **Should the app handle it?** Yes, and specifically because of F2 and F1. The rule only *matters* once
  something counts sessions; until then it is inert trivia. But it matters twice over for Josh: it is the
  book's own sanctioned way to put a run on a lifting day (which F1 currently forbids), and it is the
  rule that stops Strava's auto-logging from eating the weekly allowance.
- **Rectify:** when the conditioning tally of F2 is built, exclude any run of ≤10 minutes
  (`durationMin`, already captured at `stravaSync.ts:167`) that falls on a lifting day, citing p.102.
  Surface it in the UI as a distinct thing — "10-min warm-up · doesn't count (p.102)" — rather than
  silently dropping it, so Josh can see why his tally did not move.

---

## F6. `capMin` is stored but nothing reads it

- **Severity:** minor
- **Class:** (b) inert data
- **Claim:** `ConditioningSession.capMin` (`conditioning.ts:23`) is populated on seven of eight sessions
  and read nowhere. `grep -rn "capMin" src/` returns only the declaration and the literals;
  `conditioningSessionFor` (`conditioningPlan.ts:58–74`) builds `scheme` from `card` and `detail` from
  `detail`/`alternatives`, never from `capMin`. The Plan screen's dropdown shows `o.card[0]` only
  (`Plan.tsx:398`).
- **Book says:** the caps are prescriptions, not annotations — "No more than 10 sprints or **15 minutes**
  per session – whichever comes first" (p.106), "duration is **15-20 minutes, no longer**" (p.107),
  "**Don't train for more than 15 to 20 minutes** with this session" (p.105).
- **Evidence:** grep as above; read all render paths (`Session.tsx:537,549`, `Today.tsx:281,286`) — they
  render `scheme` and `detail` only.
- **Rectify:** either surface it (a "cap: 20 min" chip on the session card, and a nudge when a synced
  Strava run exceeds the cap for that session), or delete the field and keep the numbers in `detail`
  where they are already quoted. Carrying book data the app never uses is how the previous TB
  implementation drifted.

---

## F7. The over-cap warning in the Plan screen is unreachable

- **Severity:** minor
- **Class:** dead code / silent enforcement
- **Claim:** `Plan.tsx:384` guards on `days.length > cap.max`, but `days` comes from
  `conditioningDaysFor` (`Plan.tsx:332`), which already ends in `.slice(0, cap)`
  (`conditioningPlan.ts:36`). The condition is always false and the message "Only the first {cap.max}
  count — the book caps it there" (`Plan.tsx:386`) can never render. The user-visible effect is that
  toggling a fourth Green day appears to do nothing at all: it is written to settings, excluded from
  `days`, so `on` is false (`Plan.tsx:359`) and the button stays dark with no explanation.
- **Book says:** "No more than 3." / "No more than 2." (p.99, p.111). Enforcement is correct; only the
  explanation is broken.
- **Evidence:** read `conditioningPlan.ts:29–37` and `Plan.tsx:332,359,384–388`. The slice happens
  before the comparison in every call path.
- **Rectify:** compare against the *raw* selection, e.g.
  `const chosen = s.mass?.conditioningDays ?? defaultConditioningDays(colour)` in the component, and warn
  when `chosen.length > cap.max`. Better still, refuse the toggle at the cap with the reason shown, so a
  click never appears to no-op.

---

## F8. Hardgainer caps are flattened, and one is missing from the text entirely

- **Severity:** minor
- **Class:** (a) omits a conditional prescription
- **Claim:** Recovery Run's `detail` mentions the hardgainer cap in passing — "hardgainers cap it at 20"
  (`conditioning.ts:67`) — but `capMin` is a flat `30` (`conditioning.ts:68`) and there is no hardgainer
  setting to switch on. Endurance Predator's `detail` (`conditioning.ts:78`) **omits the hardgainer
  sentence altogether**, and its `capMin` is a flat `60`.
- **Book says:** "If you're a hardgainer – i.e. you have difficulty growing muscle or gaining weight,
  **cap it at 20 minutes.**" (p.102, and this is bold in the book). "Skinny hardgainers stick to 30
  minutes. Heavier/overweight trainees can do the full 60 if desired." (p.103). Per the fidelity rule,
  where the book gives its own recommendation the app follows it rather than picking the midpoint —
  these are the author's explicit choices among options, not latitude.
- **Evidence:** `docs/MASS/mass-text.txt` PDF pages 102 and 103; `MASS-extraction.md` §07 → Duration caps
  table, rows 4 and 5, both of which record these correctly. Compared line-by-line against
  `conditioning.ts:62–81`.
- **Rectify:** add the p.103 sentence to Endurance Predator's `detail` — a one-line fix and a pure
  transcription gap. Then add a `hardgainer?: boolean` to `settings.mass` and let it select the low end:
  Recovery Run 30→20, Endurance Predator 60→30. The book defines the term inline ("difficulty growing
  muscle or gaining weight", p.102), so the setting can be self-explanatory.

---

## F9. The default-days deviation is declared, but the code comment misdescribes it — and the book has a Grey Man recommendation the app ignores

- **Severity:** minor
- **Class:** (d) declared deviation — sound in principle, wrong in its stated justification
- **Claim:** `DEFAULT_GREEN_DAYS = [1, 5] // Tue, Sat` (`conditioning.ts:147`), documented as "two Green
  sessions on the non-lifting days **either side of the week's middle lift**"
  (`conditioning.ts:143–145`). Grey Man's lifts are `[0,2,4]` = Mon/Wed/Fri, so the days either side of
  the middle lift are Tue (1) and Thu (3). Saturday (5) is not adjacent to Wednesday. The comment
  describes `[1,3]`, the code does `[1,5]`.
- **Is the deviation itself sound?** Yes. The book gives Green a count and a permission, never a grid:
  "Sessions can be conducted on non-lifting or lifting days" (p.99), and `MASS-extraction.md` §07
  Ambiguities 6 confirms "The book gives no preference and no rule about same-day ordering relative to
  the lift." Supplying an editable default inside the range is the right call, and it is declared in
  `docs/mass-design.md:32` and `:514`. **Working as intended.**
- **But the book is not entirely silent on Grey Man's conditioning volume:** "Grey Man is a
  three-day-per-week alternating A/B/A style template… A favorite with operational clients that want to
  **balance 3 days of lifting with 3 days of conditioning.**" (p.39), and p.48 says the four days off
  "allows for more flexibility with conditioning and recovery." That is the author describing Grey Man's
  intended shape as 3 + 3, which is also the p.99 maximum. The app defaults to 2. Legal, but it is not
  the book's own picture of this template.
- **Evidence:** `docs/MASS/mass-text.txt` PDF pages 39 and 48; `greyman.ts:309` for `[0,2,4]`;
  `conditioning.ts:138–152`.
- **Rectify:** fix the comment to say what the code does. Consider defaulting Grey Man to three Green
  days on the three non-lifting weekdays (Tue/Thu/Sat = `[1,3,5]`), citing p.39 — that makes the default
  the book's own description rather than an arbitrary pair, and it stays inside p.99. If the pair is kept
  deliberately (Josh's preference, recovery load), say so in `mass-design.md` §5 and cite p.39 as the
  thing being departed from.

---

## F10. Small transcription gaps in three `detail` strings

- **Severity:** nit
- **Class:** (a) incomplete transcription
- **Claim:**
  1. **Fobbits** (`conditioning.ts:116–124`) has no `alternatives`, though the book gives two whole sets:
     LSS may be "skipping, rowing, cycling, shadow boxing, or even swimming" and the work interval may be
     "push-ups, pull-ups, push-press, sledgehammer/tire drills etc." (p.107). Every other session's
     options made it in.
  2. **Hill Sprints** (`conditioning.ts:110–111`) omits the rest prescription: "Walk back down the hill,
     rest for a minute or two and repeat" (p.106). The flat variant's rest ("2 to 3 minutes") *is*
     included, so the hill version reads as having no rest at all.
  3. **Anabolic Sprints** (`conditioning.ts:90–91`) is complete, but worth an explicit note in the
     comment that the book gives **no numeric rest and no session cap** ("Rest for a few moments",
     p.104) — otherwise a future reader will assume it was dropped.
- **Book says:** as quoted, p.106 and p.107.
- **Evidence:** `docs/MASS/mass-text.txt` PDF pages 106–107, compared clause by clause against
  `conditioning.ts:105–124`. `MASS-extraction.md` §07 → Per-session parameters records all three
  correctly, so this is a code-side gap, not an extraction error.
- **Rectify:** add `alternatives: 'LSS: skipping / rowing / cycling / shadow boxing / swimming · Work:
  push-ups / pull-ups / push-press / sledgehammer'` to Fobbits, and the hill rest clause to Hill Sprints'
  `detail`.

---

## F11. Endurance Predator's card renders with a stray separator

- **Severity:** nit
- **Class:** presentation
- **Claim:** the card is stored as two lines, `['Walk x 30-60 minutes', '+ Sprint x 50-100m']`
  (`conditioning.ts:76`), and `conditioningSessionFor` joins every card with `' · '`
  (`conditioningPlan.ts:70`), producing `Walk x 30-60 minutes · + Sprint x 50-100m` in
  `Today.tsx:281` and `Session.tsx:537`.
- **Book says:** p.103 prints this as a **single** line: `Walk x 30-60 minutes + Sprint x 50-100m`.
  It is the only card of the eight whose prescription is one line containing a `+`.
- **Evidence:** `docs/MASS/mass-text.txt` PDF page 103; `MASS-extraction.md` §07 → ENDURANCE PREDATOR
  reproduces it as one line.
- **Rectify:** store it as one card line, matching the book. The array shape is right for the multi-line
  cards (Reset-20, Fobbits, Anabolic Sprints, Hill Sprints); this one just isn't multi-line.

---

## Not findings — checked and clear

- **Weekly counts and placement (p.99):** caps of 3 and 2 are correct and enforced; Black-off-lifting-days
  is correct and enforced. Only the Green lifting-day permission is wrong (F1).
- **Session selection / rotation:** the book never says which of the four to pick, whether to rotate, or
  whether repeating one all week is acceptable (`MASS-extraction.md` §07 Ambiguities 8). The app
  defaulting to `options[0]` and letting the user choose per day is a fair reading of silence.
- **Spacing of Black sessions:** the book gives no rule about consecutive non-lifting days (Ambiguities
  7). The app imposes none. Correct.
- **Ordering relative to the lift:** no rule in pp.94–111 beyond the p.102 warm-up/cool-down note. The
  app imposes none. Correct.
- **Miscellaneous chapter (pp.109–111):** three things live here. The p.109 "signal–response" material is
  rationale, not a rule, and nothing is owed. The p.110 extra-curricular rule **is** a rule and is F2.
  The p.111 recap is F3. Nothing else in the chapter is actionable.
- **Conditioning principles (pp.96–97):** four principles, none quantified, all rationale. Nothing to
  encode; the app rightly encodes none of them.
- **TB II exclusion (pp.95, 98, 107):** "drop everything you learned about conditioning in Tactical
  Barbell II", "Use the sessions provided in this book – NOT the Green/Black training found in Tactical
  Barbell II". The app ships only these eight and offers no others. Correct by construction.
- **Bridge week (p.93):** `bridge.ts:55` carries `conditioning: 'none'` and the session detail quotes the
  allowed activities verbatim. Correct.
- **`type: 'run'` for all eight sessions** (`conditioningPlan.ts:68`): a Walk, a Ruck and a Fobbit are not
  runs. This is an engineering compromise to reuse the Strava/completion path, and `mass-design.md:369`
  proposed a `'cond'` `SessionType` with a `conditioningId` instead. The book has nothing to say about it,
  so it is out of scope for this audit — but it is a design-doc proposal that the implementation quietly
  did not follow, and it is the reason the F2 tally has nothing clean to count. Worth resolving in
  `mass-design.md` either way.
