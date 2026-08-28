# HANDOFF

**Last updated:** 2026-08-28 (handoff after v46) · **Branch:** `mass-extraction` · **tb2: v46**
(`https://tb2.joshua-birch.co.uk`).

**Status:** Engine unchanged. v46 UX/year-plan is **on tb2**. Josh tried the calendar: **it isn’t
good enough.** Next chat is a specialist review stack, then a planner rebuild — paste
**`docs/REVIEW-PASS.md`**. Do not add templates (E2/E7).

Read in this order:

1. `CLAUDE.md` — standing context, constraints, conventions.
2. **`docs/BACKLOG.md`** — every outstanding item. **If it is not in that file it will be forgotten.**
3. `docs/mass-design.md` **§11, §12, §14** (especially **§14.5**).
4. This file.

---

## Where we are

`master` is untouched (live Beginner @ v23). `mass-extraction` is the rebuild. Josh is months from
switching. **Beginner must keep working.**

**v46 (this session).** Specialist reviews then one implementer (`docs/UX-PASS.md`). Josh asked for a
**year calendar** (click/drag blocks, see dates, time off for holidays) instead of a wall of numbered
rows. Operator stays out. Alpha/Bravo are never auto-picked (p.69).

### What landed

- **Year calendar** on `/plan` — 52-week view, drag a block onto a week, tap empty weeks (fills gaps
  with **Time off**), insert time off before a selected block. `off` is a real protocol so it cannot
  fall through to Beginner.
- **E6 presets:** Grey Man year first (16× GM + 4 Bridges); truncated Standard Cycle; full Standard
  Cycle and 2:1 (p.140 / p.142) ask Alpha **or** Bravo on apply.
- **Short first-run walk:** onboarding copy no longer sells Beginner on the Grey Man path; maxes →
  year plan CTA; Today countdown is MASS-aware.
- **book-01 F5:** Session and Today split main vs accessories (MS vs H). Extra sets / drop-1RM stay
  on main/MS.
- History leads with MASS maxes on Grey Man; nav `aria-label`; tap targets; confirm delete; empty
  plan clears `phaseStartDate`; `parseBackup` refuses shapeless session rows.
- Default onboarding plan is the suggested year, not the 13-week truncation.

**Verified:** typecheck · lint (existing warnings only) · 353 unit · targeted e2e (greyman, plan,
onboarding, specificity).

---

## What to do next

**Paste `docs/REVIEW-PASS.md` into a new chat.** Several named-profession subagents (calendar
interaction designer first), then one merged list, then one implementer. Josh’s bar: start date,
click/drag (that actually works on a phone), see where each block lands in the year, time off for
a May holiday. Operator was an example for *later* — do not build it.

Do not defend `PlanYear.tsx`. Treat v46 as a failed first sketch of the calendar, not a product.

Still not next: E2, E7, named H samples, MacroFactor, B1 Strava on tb2.

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
and Block plan. Add Alpha/Bravo on `/plan` like Bridge. Footer should read **v46**.

## State of the tree at handoff

- `mass-extraction` committed and pushed (v46 + `docs/REVIEW-PASS.md`). `master` / `strip-tb`
  untouched.
- `.claude/launch.json` deleted in the working tree — predates MASS; **left uncommitted**.
- `backups/` gitignored. MASS PDF / page images gitignored; extraction is tracked.
