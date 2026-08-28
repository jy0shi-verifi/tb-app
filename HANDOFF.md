# HANDOFF

**Last updated:** 2026-08-28 evening · **Branch:** `mass-extraction` · **tb2: v45**
(`https://tb2.joshua-birch.co.uk`).

**Status:** Grey Man + Bridge + F1 + **Specificity Alpha and Bravo** are in the engine. Josh has
not finished a phone QA of Spec and does not need to yet. **Next chat is UX / flow / year-planning,
not more templates** (`docs/mass-design.md` §14.5, `docs/BACKLOG.md` "NEXT"). Paste-ready
agent prompt: **`docs/UX-PASS.md`**.

Read in this order:

1. `CLAUDE.md` — standing context, constraints, conventions.
2. **`docs/BACKLOG.md`** — every outstanding item. **If it is not in that file it will be forgotten.**
3. `docs/mass-design.md` **§11, §12, §14** (especially **§14.5**).
4. This file.

---

## Where we are

`master` is untouched (live Beginner @ v23). `mass-extraction` is the rebuild. Josh is months from
switching — still cutting on Beginner, no barbell/rack yet. **Beginner must keep working.**

**v44 signed off (2026-08-28 morning).** Content-first until Grey Man + Spec prescribed correctly.
**v45** added Alpha and Bravo as real `Protocol`s (own grids, shared MASS 1RMs, one H cluster).
Deployed with `npm run deploy:v2` (not production).

Josh, same evening: the UI and journey are **not** complete; he only cares that the **code is in
place**. Before any further templates, the app must be usable by someone who has **never read the
books** (his bar: himself). Automatic after setup; easy to plan a **year**; book-faithful; flexible.
Food stays in **MacroFactor** — a later read-only stats hook is backlog **E4**, not now.

Runna is Beginner-only. B1 (Strava on tb2) stays deferred until he asks.

### Specificity (this session — E1a / E1b)

| | Where |
|---|---|
| Shared load math | `src/lib/planExercise.ts` (extracted from Grey Man; do not duplicate) |
| Stable custom ids | `src/lib/exerciseId.ts` (`uniqueExerciseId` — code-02 F17 for **new** adds) |
| Shared Spec defaults | `src/protocols/specificity.ts` — MS = BP/SQ/DL; H = Bravo p.81 example; `maxScope: 'mass'` |
| Alpha | `src/protocols/alpha.ts` — p.74 grid, DL 1-set override, `deadliftPerWeek` 1\|2 |
| Bravo | `src/protocols/bravo.ts` — p.81 mid-week % bump 50→55 / 60→65 / 70→75 |
| Registry | `PROTOCOLS.alpha` / `bravo` in `src/program.ts`. **Not** in `SELECTABLE_PROTOCOLS`. On Plan next to Bridge (`PLAN_BLOCK_PROTOCOLS`). |
| Settings (no Dexie bump, `BACKUP_VERSION` **2**) | `mass.msCluster`, `mass.hCluster` `{h1,h2}`, `mass.deadliftPerWeek`. One H cluster for both templates (p.85). `sCluster` still Grey Man only. |
| Plan / Maxes | S + MS + H builders always; consecutive-compound **warning** for Bravo; Maxes preview from **current** block's grid |
| Tests | `test/alpha.test.ts`, `test/bravo.test.ts`, mixed-protocol + planRules, `e2e/specificity.spec.ts` |

**Out of this pass (still parked):** Camp Drvar / Keeny-Meeny / Bulgarian / `tm90`, H2→Saturday, extra
DL sets, intensity-tactics UI, full E6 preset list as a *separate* "more templates" job, Operator, the
other three General templates.

**Verified:** 348 unit · typecheck/lint · 19 targeted e2e (greyman + plan + specificity) after
Playwright Chromium install. First e2e run failed only because the browser was missing.

### Already shipped (do not re-litigate)

Forced Progression, snapshots (Dexie v3), guided planner `/next-cycle`, F1 two-sessions-a-day, Green
on lift days, Guide from the book, OAuth `state` + same-origin token check. Details in git history
and the previous HANDOFF body if needed.

---

## What to do next

**`docs/BACKLOG.md` → "NEXT — UX, flow, and a year the app can run".** That is the work.

Suggested shape for the next chat (Josh's own instruction): several professional review passes
(journey, visual, a11y, first-run without the book, year-planner), then **one** implementer who
merges the list. Do not restyle from five conflicting briefs. The book still wins.

**In scope for that pass (not "more templates"):**

1. Make Today / Session / Plan / Maxes / Progression / Next-cycle / onboarding make sense without MASS.
2. **E6** — presets so he can drop a year of Grey Man + bridges + Spec and the app runs it.
   Indefinite-bulk first; also cited p.140 and 2:1 examples.
3. First-timer walk (book-04 F13 Consolidation, p.147); Session main vs S / MS vs H (book-01 F5).
4. The code-03 UI list (F19–F27, History lying on Grey Man, DEFAULT_SETTINGS flash, tap targets).

**Optional hour-one (not blockers):** code-01 F9 (`parseBackup` row shape), code-02 F12 (empty plan →
stale `phaseStartDate`), code-03 F19 (confirm delete block).

**Do not start next:** E2 (Mass / Gladiator / Fighter HT), E7 (Operator), named sample H clusters,
MacroFactor integration.

Nothing else is outstanding that should delay the UX chat.

---

## Hard-won lessons — read before touching this code

- **Scope by protocol, never by anything else.** Five bugs. `applyBeginnerProgress` / `lastPerformance`
  take `phaseId` as required. Names collide across programmes by design.
- **Never seed React state from data that is still loading.** Derive; keep only user overrides.
- **A stored 1RM carries a unit.** Per-dumbbell vs bar total is a factor of two. All MASS templates
  share `maxScope: 'mass'`; Beginner must not meet that table.
- **Under a block plan, `settings.currentPhaseId` and `settings.phaseStartDate` are stale.** Use
  `resolvePosition()` and `pos.blockStartDate`.
- **A protocol's real exercise list is `protocol.exercisesFor(settings)`.**
- **Hooks above every early return.**
- **`npm run typecheck` covers `src`, `test`, `e2e` AND `functions`.**
- **A non-Monday plan start ROTATES the week**, it does not shift it. Every write snaps.
- **A date holds at most ONE lift row and ONE cardio row.** Look up by family. No `.first()` on date.
- **Deadlift override is conventional `id === 'deadlift'` only.** Trap-bar / RDL use the normal MS
  scheme (p.75).
- **Alpha wants the same lift on MS and H; Bravo does not want the same compound on consecutive days.**

---

## Three results worth not "fixing"

- Four blocks of +2.5 kg can look like the bar did not move (2.5 kg × 70% < plate grain). Guarantee is
  non-decreasing per block, strictly heavier across the span.
- A/B only rotates for an **odd** number of lifting days a week (`alternationRotates`). Fighter HT is
  twice a week — do not "fix" Grey Man for that.
- Progression increment is 4.5 kg lower / 2.5 kg upper on purpose (`docs/mass-design.md` §12).

---

## Resuming

```bash
git checkout mass-extraction
npm run typecheck && npm run test:unit
npm run deploy:v2              # only after app changes; tb2, not production
```

Settings → **Load demo history** (confirms, snapshots first), or Programme → Grey Man, then 1RM maxes
and Block plan. Add Alpha/Bravo on `/plan` like Bridge. Footer should read **v45**.

`/progression` via Today when a block ends; `/next-cycle` when a plan runs out.

## State of the tree at handoff

- `mass-extraction` committed and pushed (`v45` Alpha/Bravo + this handoff). `master` and `strip-tb`
  untouched.
- `.claude/launch.json` deleted in the working tree — predates MASS; **left uncommitted**.
- `backups/` gitignored. MASS PDF / page images gitignored; extraction is tracked.
- Josh has not fully checked Spec in the running app; that is the UX pass's job, not a blocker.
