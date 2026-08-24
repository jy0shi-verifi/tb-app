# HANDOFF

**Last updated:** 2026-08-24 · **Branch:** `mass-extraction` · **Status:** the eight-agent audit has
been worked through end to end. Deployed to `tb2` as **v41**.

Read in this order:

1. `CLAUDE.md` — standing project context, constraints, conventions.
2. **`docs/BACKLOG.md`** — every outstanding item. **If something is not in that file it will be
   forgotten.**
3. `docs/mass-design.md` **§11** — the four design decisions Josh made on 2026-08-24, which are binding
   on the planner and the backup system.
4. This file — where the work actually stopped.

---

## Where we are

Grey Man is built, audited, and the audit is **done**. All ~44 findings are closed except the ones
deliberately deferred; `docs/BACKLOG.md` lists exactly which and why.

`master` is untouched and still matches what Josh uses every morning.

**Josh will not use tb2 for months.** He is cutting on Beginner Mode and has no barbell or rack yet. So
there is no deadline pressure — but **Beginner Mode must keep working**, and its real history must keep
rendering. Three of the audit's worst findings were Beginner being corrupted or misread by MASS code,
and a fourth turned up this session (see "Hard-won lessons").

### One standing assumption corrected

**Runna is a Beginner-only arrangement.** Josh, 2026-08-24: *"Runna will be moot during mass, I will be
following whatever training green gives me. I'll still be uploading to strava it just won't be runna."*
So under MASS his cardio **is** the Green conditioning the app prescribes; Strava stays the log, Runna
stops being the source. The extra-curricular rule (p.110) still applies — it just counts work on top of
Green, not his programmed running. Don't write MASS-side copy that assumes a Runna plan.

**B1 (the second Strava API app) is deferred, not blocked.** Josh does not want it raised again until
he asks.

### Forced Progression got a second pass (v42)

Josh asked whether the book differentiates the 5–10 lb increment by movement type. **It does not** — the
rule is printed six times, always identically. But TB1 does, for the same author's Forced Progression,
and MASS's range is exactly TB1's two numbers. So the app now applies **4.5 kg to lower-body lifts and
2.5 kg to upper**, as a labelled deviation, plus a three-way `full / eased / hold` decision it works out
from the block you just did. `docs/mass-design.md` §12 has the whole argument.

The same question settled something that had looked open: **progression fires every block**, because
p.64's heading and p.90 both say "from block to block". An earlier draft offered "every other block" as
the more faithful reading — that was wrong.

### The headline change

**The programme now progresses.** Before this session nothing in `src/` wrote a non-zero
`progressedKg`, so a fourth block prescribed exactly what the first one did. Forced Progression (p.53,
p.90) is the mechanism the book says the whole protocol works by, and it now exists: a block-boundary
prompt, a per-lift "struggled" marker, and the 10% failure drop as an action.

### Built this session

| | Where |
|---|---|
| Forced Progression | `src/lib/progression.ts`, `src/screens/Progression.tsx` → `/progression` |
| Automatic on-device backups (Dexie **v3**) | `src/lib/snapshots.ts`, Settings → Automatic snapshots |
| The guided block planner | `src/lib/planRules.ts`, `src/screens/NextCycle.tsx` → `/next-cycle` |
| Green conditioning alongside a lift | `src/components/ConditioningAlongside.tsx` |
| The conditioning allowance, counting whatever Strava sends | `conditioningLoad` in `src/protocols/conditioningPlan.ts` |
| Programme choice in onboarding | `src/screens/Onboarding.tsx` |
| The Guide, rewritten from the book | `src/screens/Guide.tsx` |
| OAuth `state` + same-origin token endpoint | `src/lib/strava.ts`, `functions/api/strava/token.ts` |

**Verified:** 287 unit + 62 e2e green · `npm run typecheck` clean, and it now covers `functions/` too ·
lint and build clean · every change confirmed in a real browser, not only in tests.

---

## What to do next

**`docs/BACKLOG.md` is the list.** In rough priority order:

0. **Josh is reviewing v41 first** (his call, 2026-08-24). He asked for nothing new to be started until
   he has looked at it on his phone — nine of the changes touch screens he has not seen. Take his
   feedback before picking anything below.
1. **F1 — two sessions per day.** Decided by Josh this session: *"in case I ever need to shorten my
   week by doubling everything up."* Needs a real schema decision (Dexie v4, `sessions.date` unique on
   something like `(date, kind)`) and touches the riskiest code in the project. Also unblocks logging a
   Green session that shares a day with a lift.
2. **E1 — Specificity Alpha and Bravo.** Josh ruled these are required before the app is finished. The
   planner's ratio guidance and no-General warning are already written and waiting for them; the
   default plan currently has to stop at the bridge because Specificity does not exist. Extracted in
   sections 05 and 06. This is where `tm90` and the Bulgarian cluster finally matter.
3. **E6 — a second plan preset** once E1 lands. `PLAN_PRESETS` is already a list.
4. **E2 — the other three General templates.** Note Fighter HT trains twice a week and therefore hits
   the `alternationRotates` limitation; read p.60 before deciding what it should do.

---

## Hard-won lessons — read before touching this code

- **Scope by protocol, never by anything else.** This root cause has now produced *five* bugs. The
  newest: `applyBeginnerProgress`'s "defence in depth" was a NAME check against LP_A/LP_B, and names
  collide across programmes **by design** — a Grey Man S cluster may legitimately contain
  `Goblet / Front-rack Squat`, which is also LP_A's first lift. A colliding name walked straight past
  it. It now takes `phaseId` as a required argument, like `lastPerformance`.
- **Never seed React state from data that is still loading.** `useSettings`, `useSessions` and
  `useAllOneRm` all return a default before IndexedDB answers, so a `useEffect` copying derived data
  into state runs against nothing and never re-runs. That is how every lift came back ticked on the
  progression screen — including ones explicitly marked "struggled" — **with all 22 unit tests
  passing**. The screen showed it in one look. Derive, don't copy.
- **A stored 1RM carries a unit.** Kilos-per-dumbbell and total-on-the-bar are a factor of two apart.
- **Under a block plan, `settings.currentPhaseId` and `settings.phaseStartDate` are stale.** Screens
  must read `resolvePosition()` — including `pos.blockStartDate` for any calendar.
- **A protocol's real exercise list is `protocol.exercisesFor(settings)`, not `protocol.clusters`.**
- **Hooks must sit above every early return.**
- **`npm run typecheck` now covers `src`, `test`, `e2e` AND `functions`.** Every one of those gaps was
  real when it was closed — adding `functions/` immediately found a dead guard in the file that holds
  the Strava client secret.
- **A plan start that is not a Monday does not shift the plan, it ROTATES it.** Grey Man's Mon/Wed/Fri
  lands on Wed/Fri/Sun and is still labelled "Mon". Every write snaps; a stored one is flagged.

---

## Two results worth not "fixing"

- **Four blocks of +2.5 kg give `[70, 72.5, 72.5, 75]` kg on the bar.** 2.5 kg on the 1RM is only
  1.75 kg at 70%, below what the plates can express, so some blocks repeat. The book has the same
  property in pounds and never mentions it. The guarantee is non-decreasing per block and strictly
  heavier across the span — not a jump every block. `test/progression.test.ts` says so explicitly.
- **The A/B alternation only rotates for an ODD number of lifting days a week.** With two, Monday is
  ordinal 0, 2, 4… and stays Day A forever. Named (`alternationRotates`) and pinned by a test rather
  than "fixed", because what Fighter HT should do instead is a question for its own grid on p.60.

---

## Resuming

```bash
git checkout mass-extraction
npm run typecheck && npm run test:unit && npm run test:e2e
npm run deploy:v2              # tb2.joshua-birch.co.uk, ~15s
```

To see Grey Man: Settings → **Load demo history** (now confirmed before it wipes anything, and it takes
a snapshot first), or Settings → Programme → **Grey Man**, then Settings → **1RM maxes** and
Settings → **Block plan**. A fresh install is now offered Grey Man during onboarding.

To see the new screens: `/progression` appears via the Today banner when a block has ended;
`/next-cycle` appears when a plan has run out.

## State of the tree at handoff

- `mass-extraction` is committed and pushed to `origin`. `master` and `strip-tb` are untouched.
- `.claude/launch.json` shows as deleted in the working tree. It predates all of this work and has been
  left alone deliberately.
- `backups/` is gitignored (it holds real personal data), as is `docs/MASS/` book source material — the
  PDF, text dump and 71 page images are **not** committed, only the derived extraction.
