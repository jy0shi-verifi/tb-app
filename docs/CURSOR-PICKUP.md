# Cursor pickup — tb-app

**Written:** 2026-08-28 · **Author:** Cursor (Grok 4.6), first session after Claude Code.

This is the durable note for **ongoing Cursor work**. It is an investigation of the repo as it
actually sits today, cross-checked against `CLAUDE.md`, `HANDOFF.md`, `docs/BACKLOG.md`, and git.
Claude’s files remain the source of truth for product rules and the backlog; this file is the
agent-switch report and the “how we work from here” map.

**Do not treat this as a second backlog.** Outstanding work still lives only in `docs/BACKLOG.md`.
If it is not in that file it will be forgotten.

---

## 1. What this project is

A **single-user, offline-first training PWA**. Josh is the only user. There is no auth, no backend,
and no shared database. Training history lives in the browser’s IndexedDB and in JSON backups.

It tells him what to do that day and computes every weight.

Two apps exist on purpose, on two Cloudflare Pages projects, so daily use is never mixed with
in-progress rebuild work:

| | Live (daily use) | Rebuild (in progress) |
|---|---|---|
| Git branch | `master` @ `9ede0ae` | `mass-extraction` @ `56227f0` (checked out) |
| App version | **v23** | **v44** (`src/version.ts`) |
| Pages project | `tb-app` | `tb-app-v2` |
| URL | `tb.joshua-birch.co.uk` | `tb2.joshua-birch.co.uk` |
| Deploy | `npm run deploy` **only when Josh asks** | `npm run deploy:v2` after app changes |
| Programme | Beginner Mode — dumbbell A/B double progression; running via **Runna** + **Strava** | Tactical Barbell **MASS — Grey Man**, rebuilt from the book |
| Data | ~1 month of real history | Isolated origin (empty until a backup is imported) |

**Josh will not switch to tb2 for months.** He is cutting on Beginner until a barbell and rack
arrive. There is no deadline pressure on MASS. **Beginner on `master` must keep working** — it is
not legacy code.

Remote: `https://github.com/jy0shi-verifi/tb-app`. Working tree at pickup: one leftover
`D .claude/launch.json` (deliberately uncommitted; predates MASS). `mass-extraction` tracks
`origin/mass-extraction`. `master` and `strip-tb` are untouched.

---

## 2. How the two products relate

```
master (v23, live) ──strip-tb──► mass-extraction (v44, tb2)
     ▲                               ▲
     │ daily Beginner + Strava       │ Grey Man + Bridge + planner
     │ NEVER deploy in-progress      │ NEVER deploy to project tb-app
     │ work here                     │
```

`strip-tb` (`39e6638`) removed the unverified Operator/Black Tactical Barbell implementation.
`mass-extraction` rebuilt MASS from the book on top of that strip.

**Backup JSON is the migration contract.** When Josh eventually switches, he exports from the live
app and imports into tb2. `BACKUP_VERSION` is **2** on this branch. The new app must still **read
v1**. v2 files will not load into the live app — take a fresh v1 export before switching over.

Real backups under `backups/` are gitignored (personal data). Tests use
`test/fixtures/backup-v1.json` plus any local real backup `test/migration.test.ts` can see.

---

## 3. Stack (verified against `package.json` and `src/`)

React 19 + TypeScript 6 + Vite 8 · Tailwind v4 · Dexie/IndexedDB · react-router v7 · Cloudflare
Pages + 3 Pages Functions (Strava proxy only).

**No global state store.** Screens read Dexie via `useLiveQuery` and write imperatively.

**No CI.** Deploys are manual from this machine.

### Database (`src/db.ts`) — Dexie schema version **3**

| Store | Key | Notes |
|---|---|---|
| `settings` | `id` (`'app'`) | Single row |
| `maxes` | `liftId` | **Frozen** — nothing writes it; v1 backups round-trip through it |
| `sessions` | `++id, date, phaseId` | `date` is **not unique** (two rows per day is now legal) |
| `oneRm` | `[protocolId+exerciseId]` | v2 — protocol-scoped 1RMs |
| `snapshots` | `++id, takenAt` | v3 — automatic on-device backups; **never exported** |

Both migrations add a store only. Destructive paths (`clearAll`, demo seeder, `importBackup`)
clear tables **by name**, so `snapshots` survives them by construction.

### Protocol registry (`src/program.ts`)

```
PROTOCOLS = { beginner, gm, bridge }
SELECTABLE_PROTOCOLS = [Grey Man, Beginner]   // Bridge is a block, not a programme
```

Dispatch: `sessionFor()` → `PROTOCOLS[id].sessionFor()`. New templates are one file under
`src/protocols/` plus a registry entry.

A date holds **at most one lift-family row and one cardio-family row**. Lookup by family:
`sessionForDate(date, 'lift')` / `sessionsForDate(date)`. A bare `.first()` on a date is a bug.

---

## 4. Source layout (this branch)

55 files under `src/`. The important split:

| Area | Path |
|---|---|
| Programme dispatch | `src/program.ts`, `src/protocol.ts` |
| Beginner (live programme) | `src/beginner.ts` |
| Grey Man | `src/protocols/greyman.ts` |
| Bridge Week | `src/protocols/bridge.ts` |
| Conditioning cards + weekly plan | `src/protocols/conditioning.ts`, `conditioningPlan.ts` |
| Plate math | `src/lib/barbell.ts` |
| Forced Progression | `src/lib/progression.ts`, `src/screens/Progression.tsx` |
| Block planner | `src/lib/planRules.ts`, `src/screens/NextCycle.tsx`, `src/screens/Plan.tsx` |
| Two-sessions-a-day | `src/lib/sessions.ts` |
| Snapshots | `src/lib/snapshots.ts` |
| Persistence / backup | `src/db.ts` |
| Strava client | `src/lib/strava.ts`, `src/lib/stravaSync.ts` |
| Strava proxy | `functions/api/strava/{token,activities,update}.ts` |
| Screens | `src/screens/*.tsx` — Today, Session, Program, History, Settings, Guide, Maxes, Plan, Progression, NextCycle, Onboarding |

Routes outside the tab bar (`/maxes`, `/plan`, `/progression`, `/next-cycle`) each have a
`ScreenHeader` back link. Catch-all `*` renders Today.

Tests: 16 unit files under `test/`, 16 Playwright specs under `e2e/`. Last documented counts:
**322 unit + 68 e2e**, typecheck covering `src`, `test`, `e2e`, and `functions/`. **Not re-run
in this session.**

---

## 5. What is actually built (Grey Man on tb2)

All nine build steps of `docs/mass-design.md` §9, plus the 2026-08-24 audit close-out and F1:

- Grey Man grid (p.51) as data, A/B clusters, load resolution
- 1RM entry from a 2–3 rep test set (`/maxes`)
- Plate math (exact subset-sum, nearest ties-down — **our** rounding rule; the book has none)
- Forced Progression (p.53, p.90): increment by lift (4.5 kg lower / 2.5 kg upper), `full`/`eased`/`hold`
- Guided block planner + two-tier guardrails (`/plan`, `/next-cycle`)
- All eight Green/Black conditioning cards
- Bridge Week
- Two sessions a day (F1, v44) — lift + conditioning; pull tomorrow forward
- Automatic snapshots
- Guide rewritten from the book
- Onboarding offers Grey Man
- OAuth `state` + same-origin check on the token endpoint (unit-tested; **never run against real Strava on tb2**)

Josh reviewed **v41 then v42/v43** (“looked, all good”). **v44 (F1) is signed off (2026-08-28).**

---

## 6. What is next (from `docs/BACKLOG.md`, not invented here)

Priority as of **2026-08-28 evening** (`docs/mass-design.md` §14.5). **v44 signed off; v45 Alpha/Bravo
in on tb2.** Content-first is done for Grey Man + Spec. **Next is UX / flow / year-planning, not E2.**

1. **UX pass** — usable without having read MASS; automatic day-to-day; lay out a year and the app
   runs it. Specialist reviews then one implementer. See `docs/BACKLOG.md` "NEXT".
2. **E6** sits *inside* that pass (presets = the automatic year), with book-04 F13 / book-01 F5.
3. Optional hour-one: code-01 F9, code-02 F12, code-03 F19.
4. **E2 / E7 / named H samples** parked until Josh says the journey is good enough.

Deliberately not built now: Base Building (book-sanctioned skip for a runner), nutrition tracking.

**Do not raise B1** (second Strava API app for tb2) until Josh asks.

---

## 7. Rules that have already cost real bugs

These are standing. Breaking them reintroduces known failures.

1. **The book wins.** Every extracted claim needs a page number. Printed tables are test fixtures.
   Forum posts are a second pass, never an input to extraction.
2. **Data loss is the highest-severity failure.** Treat `src/db.ts`, backup format, and Dexie
   schema as high-risk.
3. **Never deploy in-progress work with `npm run deploy`.** That hits production (`tb-app`).
4. **Scope by protocol, never by `type === 'lift'` or by exercise name.** Names collide across
   programmes by design. `applyBeginnerProgress` and `lastPerformance` take `phaseId` as required.
   This root cause produced five bugs, including silently rewriting Beginner dumbbell weights from
   Grey Man barbell totals.
5. **Never seed React state from data that is still loading.** Hooks return defaults (`[]`,
   `DEFAULT_SETTINGS`) before IndexedDB answers. Derive; keep only user overrides in state.
6. **A stored 1RM carries a unit** (`'total'` vs `'perDumbbell'`). A factor of two.
7. **Under a block plan, `settings.currentPhaseId` / `phaseStartDate` are stale.** Use
   `resolvePosition()` and `pos.blockStartDate`.
8. **Real exercise list is `protocol.exercisesFor(settings)`**, not static `protocol.clusters`.
9. **Hooks above every early return.**
10. **Dates are local, never UTC.** `src/lib/date.ts`. `strava.expiresAt` is epoch **seconds**;
    every other timestamp is milliseconds.
11. **Look sessions up by family.** One lift + one cardio per date, never two lifts.
12. **`SetRow` in `Session.tsx` stays at module scope** — inlining remounts inputs while the
    rest timer ticks.
13. **Session writes re-read before save** so Strava sync is not clobbered; never delete a
    Strava-linked row (un-tick `done` instead).

Three results that look like bugs and are **not**:

- Four blocks of +2.5 kg can yield `[70, 72.5, 72.5, 75]` on the bar (2.5 kg on the 1RM is 1.75 kg
  at 70%, below plate resolution). Guarantee is non-decreasing per block, strictly heavier across
  the span.
- A/B alternation only rotates for an **odd** number of lifting days (`alternationRotates`).
- Progression increment is asymmetric on purpose (4.5 / 2.5 kg). See `docs/mass-design.md` §12.

---

## 8. Doc map (what to open for what)

| File | Role |
|---|---|
| `CLAUDE.md` | Standing architecture, constraints, commands, conventions. Still accurate as of this pickup. |
| `HANDOFF.md` | Where Claude stopped (2026-08-24, v44, F1 built). Resume steps. |
| `docs/BACKLOG.md` | **The** outstanding-work list. |
| `docs/mass-design.md` | Design decisions, type model, labelled DEVIATIONs. §11–13 are binding. |
| `docs/MASS/MASS-extraction.md` | Book extraction, page-referenced. Source PDF is gitignored. |
| `docs/audit/` | Eight-agent audit (2026-08-24). Evidence, not the to-do list. |
| `docs/codebase-map.md` | Architecture as of **`master` @ v23 (2026-08-21)**. Partly superseded on this branch (schema v1, no protocol layer). Useful for Beginner / Strava / UI conventions; **do not trust it for MASS schema or programme dispatch**. |
| `docs/CURSOR-PICKUP.md` | This file. |
| `e2e/COVERAGE.md` | What Playwright covers vs unit tests. |

User-testing notes (`docs/user-testing-round-*.md`) and older audits
(`docs/book-fidelity-audit-2026-07-12.md`, `docs/weight-math-audit.md`) are history of why the
rebuild happened.

---

## 9. Commands

```bash
npm run dev          # Vite, port 5173
npm run typecheck    # src + test + e2e + functions — use this, not only `build`
npm run lint         # oxlint
npm run test:unit    # Vitest
npm run test:e2e     # Playwright, own server on :5199
npm run deploy:v2    # tb2 only; ~15s
npm run deploy       # PRODUCTION. Do not run unless Josh asks.
```

To see Grey Man on a device: Settings → **Load demo history** (confirms, snapshots first), or
Programme → Grey Man then 1RM maxes + Block plan.

---

## 10. Known live risks (still open)

- `parseBackup` validates table shape, not row shape (code-01 F9).
- Strava `redirect_uri` is `window.location.origin`; Strava allows one callback domain per app.
  tb2 Strava is **off** until a second API app exists (deferred).
- `POST /api/strava/token` same-origin check does not stop curl. Rate limit only if abused.
- `sessions.date` is not a unique index (deliberate after F1). Uniqueness of `(date, family)` is
  enforced in code + `repairDate`.
- Dark mode is defined twice in `src/index.css` (~40 duplicated lines).

---

## 11. How Cursor will work this project

1. Read `CLAUDE.md` → `docs/BACKLOG.md` → `HANDOFF.md` at the start of a session.
2. Default branch for MASS work: **`mass-extraction`**. Default for live-app fixes: **`master`**,
   and keep those changes off tb2 unless Josh wants them on both.
3. Put new outstanding items in `docs/BACKLOG.md`. Update `HANDOFF.md` when a session ends or
   Josh says **handoff**.
4. Commit only when Josh asks. Push only when Josh asks. Never force-push `master`.
5. Deploy tb2 (`npm run deploy:v2`) at the end of a turn that changes the app, so he can look on
   his phone. Never `npm run deploy` unless asked.
6. Verify UI in the browser (or Playwright) before calling UI work done.
7. Book claims need page numbers. Tests should assert the printed number **and** the plausible
   wrong answer (house pattern in `test/calc.test.ts` / `test/greyman.test.ts`).

---

## 12. What this session did and did not do

**Did:** pickup investigation (see above), then recorded Josh's 2026-08-28 direction: v44 signed
off, content-first, Alpha then Bravo, MASS indefinitely vs later Operator. Written into
`docs/mass-design.md` §14, `docs/BACKLOG.md`, `HANDOFF.md`, and this file.

**Did not:** start E1a code, run the test suite, or deploy.
