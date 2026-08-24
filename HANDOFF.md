# HANDOFF

**Last updated:** 2026-08-24 · **Branch:** `mass-extraction` · **Deployed to `tb2` as v43.**

**Status: the eight-agent audit has been worked end to end.** Every item in its ranked summary is done.
The individual reports carry more findings than that summary did, and those were then re-read one by one
— what genuinely remains is listed in `docs/BACKLOG.md`, honestly, including the small and cosmetic ones.

Read in this order:

1. `CLAUDE.md` — standing context, constraints, conventions.
2. **`docs/BACKLOG.md`** — every outstanding item. **If it is not in that file it will be forgotten.**
3. `docs/mass-design.md` **§11 and §12** — the decisions Josh made on 2026-08-24, binding on the
   planner, the backup system and Forced Progression.
4. This file.

---

## Where we are

Grey Man is built, audited, and the audit is closed out. `master` is untouched and still matches what
Josh uses every morning.

**Josh will not use tb2 for months.** He is cutting on Beginner Mode and has no barbell or rack yet. No
deadline pressure — but **Beginner Mode must keep working**, and its real history must keep rendering.
Four of the worst findings this project has had were Beginner being corrupted or misread by MASS code.

**Josh reviewed v41 and said it all looked good.** v42 and v43 landed after that review, so the
progression screen's new shape and the three tail fixes have not been looked at yet.

### Two standing assumptions corrected this session

**Runna is a Beginner-only arrangement.** Josh: *"Runna will be moot during mass, I will be following
whatever training green gives me. I'll still be uploading to strava it just won't be runna."* Under MASS
his cardio **is** the Green conditioning the app prescribes; Strava stays the log, Runna stops being the
source. The p.110 extra-curricular rule still holds — it counts work on *top* of Green. Don't write
MASS-side copy that assumes a Runna plan.

**B1 (the second Strava API app) is deferred, not blocked.** Josh does not want it raised again until he
asks. Consequence worth remembering: the OAuth `state` and same-origin checks added this session are
unit-tested but have never run against real Strava.

### The headline change

**The programme now progresses.** Before this session nothing in `src/` wrote a non-zero `progressedKg`,
so a fourth block prescribed exactly what the first one did. Forced Progression (p.53, p.90) is the
mechanism the book says the whole protocol works by, and it now exists — twice over, because Josh's
question about increment size sent it back for a second pass.

### Built this session

| | Where |
|---|---|
| Forced Progression | `src/lib/progression.ts`, `src/screens/Progression.tsx` → `/progression` |
| Increment sized by lift + three-way `full`/`eased`/`hold` | same, plus `ClusterExercise.bodyPart` |
| Automatic on-device backups (Dexie **v3**) | `src/lib/snapshots.ts`, Settings → Automatic snapshots |
| The guided block planner | `src/lib/planRules.ts`, `src/screens/NextCycle.tsx` → `/next-cycle` |
| Green conditioning alongside a lift | `src/components/ConditioningAlongside.tsx` |
| The conditioning allowance, counting whatever Strava sends | `conditioningLoad` in `conditioningPlan.ts` |
| Programme choice in onboarding | `src/screens/Onboarding.tsx` |
| The Guide, rewritten from the book | `src/screens/Guide.tsx` |
| OAuth `state` + same-origin token endpoint | `src/lib/strava.ts`, `functions/api/strava/token.ts` |

**Verified:** 295 unit + 64 e2e green · `npm run typecheck` clean and now covering `functions/` too ·
lint and build clean · every change confirmed in a real browser, not only in tests.

---

## What to do next

**`docs/BACKLOG.md` is the list.** In rough priority order:

1. **Josh reviews v42/v43** — the new progression screen especially, since it changed after his review.
2. **F1 — two sessions per day.** Decided by Josh: *"in case I ever need to shorten my week by doubling
   everything up."* Also the root of code-01 F7 (a morning run and an evening lift, which under MASS is
   a normal week) and of a same-day Green session having nowhere to be ticked. Needs Dexie **v4** keyed
   on something like `(date, kind)`, plus every read that assumes one row per date, plus `stravaSync`'s
   `byDate` map. **The riskiest code in the project** — snapshot before the first write.
3. **E1 — Specificity Alpha and Bravo.** Josh ruled it required before the app is finished. The
   planner's ratio guidance and no-General warning are written and waiting; the default plan has to stop
   at the bridge without it. Extracted in sections 05 and 06.
4. **E6 — a second plan preset** once E1 lands. `PLAN_PRESETS` is already a list.
5. **The small correctness tail** — `parseBackup` row-shape validation (code-01 F9), deleting every
   block reverting to a stale `phaseStartDate` (code-02 F12), S-cluster id collisions (code-02 F17).
6. **E2 — the other three General templates.** Fighter HT trains twice a week and hits the
   `alternationRotates` limitation; read p.60 first.

---

## Hard-won lessons — read before touching this code

- **Scope by protocol, never by anything else.** This root cause has produced *five* bugs. The newest:
  `applyBeginnerProgress`'s "defence in depth" was a NAME check against LP_A/LP_B, and names collide
  across programmes **by design** — a Grey Man S cluster may legitimately contain
  `Goblet / Front-rack Squat`, which is also LP_A's first lift. It now takes `phaseId` as a required
  argument, like `lastPerformance`.
- **Never seed React state from data that is still loading.** `useSettings`, `useSessions` and
  `useAllOneRm` all return a default before IndexedDB answers, so a `useEffect` copying derived data
  into state runs against nothing and never re-runs. That is how every lift proposed a full increment on
  the progression screen — including ones marked "struggled" — **with all unit tests passing**. The
  screen showed it in one look. Derive, don't copy.
- **A stored 1RM carries a unit.** Kilos-per-dumbbell and total-on-the-bar are a factor of two apart.
- **Under a block plan, `settings.currentPhaseId` and `settings.phaseStartDate` are stale.** Screens must
  read `resolvePosition()` — including `pos.blockStartDate` for any calendar.
- **A protocol's real exercise list is `protocol.exercisesFor(settings)`, not `protocol.clusters`.**
- **Hooks must sit above every early return.**
- **`npm run typecheck` covers `src`, `test`, `e2e` AND `functions`.** Every one of those gaps was real
  when it was closed — adding `functions/` immediately found a dead guard in the file holding the Strava
  client secret.
- **A plan start that is not a Monday does not shift the plan, it ROTATES it.** Grey Man's Mon/Wed/Fri
  lands on Wed/Fri/Sun and is still labelled "Mon". Every write snaps; a stored one is flagged.
- **One row per date is a hard constraint.** It is why a lift cannot be saved over a Strava run, and why
  a same-day Green session cannot be ticked. Backlog F1.

---

## Three results worth not "fixing"

- **Four blocks of +2.5 kg give `[70, 72.5, 72.5, 75]` kg on the bar.** 2.5 kg on the 1RM is only
  1.75 kg at 70%, below what the plates can express. The book has the same property in pounds and never
  mentions it. The guarantee is non-decreasing per block and strictly heavier across the span — not a
  jump every block. It is also part of why lower-body lifts take 4.5 kg.
- **The A/B alternation only rotates for an ODD number of lifting days a week.** With two, Monday is
  ordinal 0, 2, 4… and stays Day A forever. Named (`alternationRotates`) and pinned by a test rather
  than "fixed", because what Fighter HT should do is a question for its own grid on p.60.
- **The progression increment is deliberately asymmetric.** 4.5 kg lower body, 2.5 kg upper. It looks
  like an inconsistency; it is the book's own 5–10 lb range, split the way the same author splits it in
  Tactical Barbell I. `docs/mass-design.md` §12 has the whole argument, including what MASS does *not*
  say and why the cadence half of the same sentence is not a choice.

---

## Resuming

```bash
git checkout mass-extraction
npm run typecheck && npm run test:unit && npm run test:e2e
npm run deploy:v2              # tb2.joshua-birch.co.uk, ~15s
```

To see Grey Man: Settings → **Load demo history** (confirmed before it wipes anything, and it takes a
snapshot first), or Settings → Programme → **Grey Man**, then Settings → **1RM maxes** and Settings →
**Block plan**. A fresh install is offered Grey Man during onboarding.

`/progression` appears via the Today banner when a block has ended; `/next-cycle` when a plan runs out.

## State of the tree at handoff

- `mass-extraction` is committed and pushed to `origin`. `master` and `strip-tb` are untouched.
- `.claude/launch.json` shows as deleted in the working tree. It predates all of this work and has been
  left alone deliberately.
- `backups/` is gitignored (real personal data), as is `docs/MASS/` book source material — the PDF, text
  dump and 71 page images are **not** committed, only the derived extraction.
