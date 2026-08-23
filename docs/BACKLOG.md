# Backlog

The durable list of outstanding work. **Nothing here is "remembered" anywhere else** — if it is not in
this file it will be forgotten. Add to it rather than relying on a chat thread.

Ordered roughly by when I'd do it. Status: `open` · `blocked` · `done`.
Last reviewed: 2026-08-23.

---

## Blocked on Josh

| # | Item | Notes |
|---|---|---|
| B1 | **Second Strava API app for `tb2`** — `open`, deferred by Josh | Register at `strava.com/settings/api` with callback domain `tb2.joshua-birch.co.uk`; send the **client ID** (the secret goes in the `tb-app-v2` Pages env, never the repo). The app then needs the client ID to come from build config so `tb-app` and `tb-app-v2` can differ. **Until this exists, Strava does not work on tb2 at all.** |

---

## Correctness / data — do these before real training data accumulates

| # | Item | Why it matters |
|---|---|---|
| C1 | **MASS sessions log exercises by name, not id** — `open` | `PlannedExercise.exerciseId` is populated but `LoggedExercise` stores only `name`, so History and PR detection still match barbell work by display name. Renaming an exercise would silently orphan its history. Gets harder to fix the more sessions exist. |
| C2 | **Forced Progression has no UI** — `open` | The model supports it (`OneRmEntry.progressedKg`, and a fresh test resets it) and History displays it, but nothing *offers* it. After a block Josh has to edit 1RMs by hand. Rule: "Every 3 to 6 weeks, add 5-10lbs to 1RMs… Don't force progression for exercises you struggled with" (MASS pp.53, 90). |
| C3 | **"Load demo history" and "Reset to clean" are not DEV-gated** — `open` | `Settings.tsx`. The production app can wipe real training data from the UI. Pre-existing risk, carried over from before the rebuild. |
| C4 | **`sessions.date` is not a unique index** — `open` | Yet nearly all read code assumes one session per date. Pre-existing. |
| C5 | **`POST /api/strava/token` is unauthenticated** — `open` | Public endpoint that signs any caller's code with `STRAVA_CLIENT_SECRET`. No origin check, no rate limit, and the OAuth flow has no `state` parameter. Pre-existing. |

---

## Content

| # | Item | Notes |
|---|---|---|
| D1 | **Guide screen still describes Operator/Black** — `open` | Needs rewriting from `docs/MASS/MASS-extraction.md`. It is the last piece of un-rebuilt Tactical Barbell content in the app. |
| D2 | **`e2e/COVERAGE.md` is stale** — `open` | Claims 41 tests; there are 51. No Beginner or MASS section. |

---

## Not built (deliberate) — the model accommodates all of these

| # | Item | Notes |
|---|---|---|
| E1 | **Specificity Alpha and Bravo** | Fully extracted (sections 05 and 06). Alpha is the more complex: separate MS and H grids plus a deadlift override (pp.74–75). Bravo is four days of pure hypertrophy (pp.80–83). |
| E2 | **Mass Template, Gladiator, Fighter HT** | Fully extracted (sections 03 and 04). Each is one file under `src/protocols/` plus registration — no screen changes. All three need AMRAP and peaking, which Grey Man does not have. |
| E3 | **Base Building** | **Deliberately skipped** (Josh, 2026-08-22) — a labelled deviation from the book's own sequence (p.147). Extracted in section 02 if it is ever wanted. |
| E4 | **Nutrition and supplements** | Extracted (section 08). Two calorie/macro formulas that the app could compute (p.120–121). Out of scope by choice. |
| E5 | **Training max (`tm90`)** | Plumbed through `Prescription.basis` but nothing sets it. Only the Bulgarian cluster wants it (pp.88–89), which belongs to Specificity. |

---

## Open questions the book does not answer

Recorded in `docs/mass-design.md` §8; repeated here so they are not lost.

- **Forced Progression against a training max** — does the increment apply to the true 1RM or to the TM?
  The book is silent. Only bites once Specificity's Bulgarian cluster exists.
- **Conditioning day placement** — the book fixes the weekly count but not the days. The app defaults to
  Tue/Sat and lets Josh change them; recorded as a deviation.
- **Weight rounding** — the book gives no rule anywhere in 160 pages. Ours is nearest-with-ties-down,
  recorded as a deviation, and the unrounded target is always shown on screen so it stays auditable.
