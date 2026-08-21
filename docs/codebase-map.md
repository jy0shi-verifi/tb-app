# tb-app — Codebase Map

**Compiled:** 2026-08-21 · **Against:** `master` @ `9ede0ae` (v23)
**Method:** five parallel mapping agents (data model, program logic, UI, integrations/infra, tests/docs), plus live verification against the deployed app at `tb.joshua-birch.co.uk` with Josh's real backup (`tb-backup-2026-08-19`, 23 sessions) imported.

This is the reference document. It describes the app **as it existed on `master` at `9ede0ae`**, i.e. the version Josh uses daily.

> **⚠ Superseded in part.** The Tactical Barbell strip has since been carried out on branch **`strip-tb`** (see `CLAUDE.md`). On that branch, §3.2 (Operator / Base Building), the Maxes screen in §4.3, `src/lib/progression.ts`, and most of the TB load math in §3.2 no longer exist, and §8 is now a record of *why* the rebuild was chosen rather than a live plan. Everything else — the data model (§2), the backup contract (§2.5), Strava (§5), and the UI conventions (§4) — still describes both branches. Read §8 before rebuilding TB: it lists the exact design traps that made the old implementation hard to extend.

---

## 0. What this app is

A single-user, offline-first PWA that Josh uses every morning to run his training. It tells him exactly what to do that day and works out every weight.

- **Owner/user:** Josh (sole user — every design decision assumes this).
- **Current programme:** Beginner Mode — dumbbell A/B double progression, with running delegated to Runna and pulled in via Strava.
- **Original design target:** Tactical Barbell *Operator/Black*.
- **Future direction:** switch to a Tactical Barbell **MASS** protocol after the cut. The TB code currently in the repo is being removed and rebuilt from the books rather than trusted.
- **In production use for ~1 month.** Real training history lives only in the browser's IndexedDB and in JSON backups. Data loss is the highest-severity failure mode in this project.

**Numbers:** ~8,400 lines across 47 source files · 49 Playwright e2e tests · 39 Vitest unit tests · 49 commits (2026-07-08 → 2026-07-31).

---

## 1. Stack & architecture

| Layer | Choice |
|---|---|
| Framework | React 19.2 + TypeScript 6 |
| Build | Vite 8, `vite-plugin-pwa` |
| Styling | Tailwind v4 (CSS-first `@theme`), self-hosted Inter + Oswald via `@fontsource-variable` |
| Data | Dexie 4 over IndexedDB, `dexie-react-hooks` `useLiveQuery` |
| Routing | react-router-dom v7 |
| Icons/Charts | lucide-react; **charts are hand-rolled inline SVG** (`recharts` is a dependency but imported nowhere) |
| Hosting | Cloudflare Pages, project `tb-app` |
| Server code | 3 Cloudflare Pages Functions, Strava proxy only |
| Lint/Test | oxlint · Vitest (`test/`) · Playwright (`e2e/`) |

**There is no backend, no auth, no server-side state, and no global client state store.** Every screen reads Dexie directly through `useLiveQuery` and writes back imperatively. This is a good fit for a single-user offline app and is why it feels instant. Do not introduce a store without a specific reason.

---

## 2. Data model & persistence

### 2.1 Dexie schema (`src/db.ts:5-20`)

Database `'tb-app'`, **version 1 — no migrations have ever been written**:

```
settings: 'id'                    // PK string, always the single row 'app'
maxes:    'liftId'                // PK string
sessions: '++id, date, phaseId'   // auto PK, non-unique indexes
```

### 2.2 Entities (`src/types.ts`)

**`SessionLog`** (`types.ts:48-66`) — table `sessions`, the atom of the whole app:

| Field | Type | Meaning |
|---|---|---|
| `id?` | number | Dexie auto key |
| `date` | string | `YYYY-MM-DD`, **local time** |
| `phaseId`, `week`, `day` | string, number, number | Snapshotted at write time. `day` is 0=Mon…6=Sun |
| `type` | `SessionType` | `'lift' \| 'se' \| 'run' \| 'hic' \| 'rest'` |
| `title` | string | Display name of the session |
| `exercises` | `LoggedExercise[]` | `{ name, sets: { weight?, reps, done }[] }` |
| `done` | boolean | Fully completed (vs partial "you showed up") |
| `durationMin?`, `distanceKm?`, `avgHr?` | number | Strava-owned conditioning metrics |
| `stravaId?` | number | Presence means Strava owns this session's metrics |
| `feel?` | `'easy'\|'ok'\|'hard'` | Post-session journal |
| `notes?` | string | Post-session journal |
| `createdAt` | number | epoch **ms** |

**`MaxEntry`** (`types.ts:26-32`) — table `maxes`, PK `liftId`. `{ liftId, testWeight (kg per dumbbell), testReps, bumpKg? }`. Effective 1RM = `Brzycki(testWeight, testReps) + bumpKg`.

**`Settings`** (`types.ts:70-108`) — table `settings`, **single row `id: 'app'`**. Full shape:

- Core: `dbIncrement` (2|1 kg), `loadBasis` (`'tm'|'1rm'`), `currentPhaseId`, `phaseStartDate` (ISO date of **Monday of week 1**)
- UI: `theme?`, `onboarded?`, `restSec?` (0/undefined = Auto)
- Mode: `programMode?: 'tb'|'beginner'`, `beginner?: { lifts: Record<liftId, kg> }`
- TB progression: `operatorBlock?`, `operatorFirstRunDone?`, `maxHistory?: { date, lifts }[]` (capped at last 8)
- Strava: `strava?: { accessToken, refreshToken, expiresAt (epoch **seconds**), athleteId?, scope? }`, `lastStravaSyncAt?`, `stravaSyncError?`, `stravaNeedsReconnect?`
- Backup: `lastBackupAt?`

> **Unit trap:** `strava.expiresAt` is epoch **seconds**; every other timestamp (`createdAt`, `lastBackupAt`, `lastStravaSyncAt`) is **milliseconds**.

### 2.3 Non-Dexie state

Nine `localStorage` keys act as ad-hoc globals and are **never backed up**: `tb-rest-end`, `tb-seen-coins`, `tb-testday-celebrated`, `tb-dismiss-missed`, `tb-no-splash`. `clearAll()` (`dev/seed.ts:168`) resets four of five — it misses `tb-no-splash`.

### 2.4 Read/write patterns

Shared hooks in `src/hooks.ts`: `useSettings()`, `useMaxes()`, `useSessions()`, `useSessionByDate(date)`. Several screens deliberately bypass these and inline their own `useLiveQuery` (`App.tsx:37`, `Session.tsx:178`, `Today.tsx:30`, `Maxes.tsx:22`, `History.tsx:51`) purely to distinguish `undefined` (still loading) from the hook's default-settings fallback. **That duplication is a wart worth folding into `hooks.ts`.**

Writes are mostly whole-row `put`. Two pieces of hard-won care worth preserving:

- `Session.tsx:300` **re-reads the freshest row at write time** so a background Strava sync isn't clobbered.
- `Session.tsx:322` / `Today.tsx:330` **refuse to delete a Strava-linked row** — they un-tick `done` instead, preserving `stravaId`/`durationMin`/`distanceKm`/`avgHr`.

### 2.5 Backup format — *the migration contract*

`BACKUP_VERSION = 1` (`db.ts:78-155`). Shape:

```json
{ "app": "tb-app", "version": 1, "exportedAt": "<ISO>",
  "settings": [...], "maxes": [...], "sessions": [...] }
```

A straight table dump. `exportBackup` **strips Strava tokens** (`db.ts:119`). `parseBackup` validates the app tag, refuses `version > BACKUP_VERSION`, requires all three arrays and a row with `id === 'app'`. `importBackup` snapshots current state, clears + `bulkPut`s in one transaction, re-injects the *current device's* Strava tokens, and rolls back on failure.

> **This format is the bridge between the current app and any successor.** See §8.

### 2.6 Date conventions (`src/lib/date.ts`)

Everything is **local time, never UTC** — deliberately. `isoDate()` builds `YYYY-MM-DD` from local getters; `parseISO` constructs `new Date(y, m-1, d)` to avoid `Date.parse`'s UTC interpretation. **Weeks are Monday-based** (`mondayIndex = (getDay()+6)%7`). Date strings are compared lexicographically, which is valid for this format. Timezone/DST was only ever spot-checked — a latent bug class if Josh trains abroad.

---

## 3. Training-programme logic

### 3.1 The mode switch

`Settings.programMode?: 'tb' | 'beginner'` — **optional, and absent means TB**. A parallel axis exists in `currentPhaseId` indexing `PHASES` (`program.ts:276-281`: `base-building`, `operator`, `beginner`).

The single dispatch point is `sessionFor()` (`program.ts:340-350`):

```ts
if (settings.programMode === 'beginner' || phaseId === 'beginner') return beginnerSessionFor(...)
if (phaseId === 'operator')                                        return operatorDay(...)
return baseBuildingDay(...)
```

**`programMode` wins over `phaseId`.** Plan generation is clean — but **nine other files re-derive the mode ad hoc and inconsistently**: `Session.tsx:204,351,427`, `Today.tsx:292`, `History.tsx:128`, `Settings.tsx:58`, `stravaSync.ts:55,150`. Some include the `|| phaseId === 'beginner'` fallback, some don't. **There is no `isBeginner(settings)` helper — there should be.** `Maxes.tsx`, `Program.tsx` and most of `History.tsx` assume TB unconditionally.

### 3.2 Tactical Barbell side (to be removed and rebuilt)

**Implemented: Base Building and Operator only.** Black is *approximated* as conditioning (2 HIC + 1 easy run/week). **No Zulu, no Fighter, no Mass, no Grey Man.**

- **Operator** — `OPERATOR_WAVE` (`program.ts:49-56`) = 70/80/90/75/85/95%, always 3 sets, reps 5/5/3/5/3/2. Cluster `OPERATOR_LIFTS` (`program.ts:43-47`) = DB Bench (step 2.5), Two-DB Front-rack Squat (5), 1-Arm DB Row (2.5). 6-week block. Week shape is a hardcoded `switch(day)`.
- **Base Building** — `baseBuildingDay()` (`program.ts:236-271`), 8 weeks. Wks 1-5 SE circuits (`SE_REPS` 20/30/40/50/50) + easy runs; wks 6-8 light strength intro; wk8 Thu = Test Day.
- **Math** (`src/lib/calc.ts`) — `estimate1RM` is **Brzycki** `w*36/(37-reps)`; `trainingMax` = 90%; `workingLoad` floor-rounds to `dbIncrement` then clamps to `DB_MIN=4`/`DB_MAX=60`. **There is no plate math anywhere** — dumbbells only, `perDumbbell: true` on every loaded set.
- **Retest ladder** (`Today.tsx:141-200`) — first Operator run held 12 weeks, then retest every 6. `stalledLiftsSinceRetest` flags lifts whose gain ≤ their own step.

### 3.3 Beginner side (current, keep)

`src/beginner.ts`. `LP_A` = Goblet/Front-rack Squat 10 kg, DB Bench 8, 1-Arm Row 8. `LP_B` = RDL 10, Reverse Lunge 8, OHP 6. All `step: 2` kg. Range `REP_LO=8` → `REP_HI=12`, always 3 sets. A/B alternates **per lift session, not per week** (`beginnerDayLetter`, `:88-92`). Mon/Wed/Fri lift, Tue/Thu/Sat run, Sun rest.

- **Progression** — `applyBeginnerProgress` (`:214-237`) runs on session exit. Matches logged exercises to lifts **positionally**, reads the weight of the *last done set*, bumps by `step` only when all 3 sets hit 12 reps.
- **Stall/deload** — `beginnerStall` (`:161-180`), 3-session window. Deload = `workingKg - max(inc, round(workingKg*0.1/inc)*inc)`. Surfaced as a "⚠ Stalled" card with a one-tap deload that rewrites the session *and* persists the new working weight.
- **Running is delegated to Runna.** `runPlan()` is a bare slot; Strava auto-logs the run and **deliberately never renames beginner runs**.
- **Dead code:** the full Couch-to-5K machinery (`C25K` table, `c25kWorkout()`, the entire `IntervalTimer` component) exists and is unit-tested but **never fires** — nothing sets `SessionPlan.intervals`.

### 3.4 Name-collision hazard

Exercises are keyed by **display name**, and names collide across modes: `op_bench` and `bg_bench` are both `'DB Bench Press'`; `op_row` and `bg_row` are both `'1-Arm DB Row'`; `'DB Romanian Deadlift'` is both `bg_rdl` and a Base-Building SE move. Every name-keyed lookup (`beginnerLiftId`, `liftHistory`, `lastPerformance`, `liftRecords`, `bestEst1RM`) filters only on `type === 'lift'` — **never on phase or mode**. Operator bench logs therefore feed beginner stall detection and vice-versa.

### 3.5 Exercise catalogue & stats

`src/exerciseInfo.ts` — `EXERCISE_INFO` keyed by **display-name string**, each entry `{ targets[], video?, videoStart?, howTo[] }`. Covers the 3 Operator lifts + pull-up progression, 3 beginner-only lifts, 6 SE moves. **No equipment field, no lift-id link.** Missing entries degrade silently to no video and no muscles.

`src/lib/stats.ts` — `computeStreak`/`longestStreak` (session-based, ≤3-day tolerance), `sessionsThisWeek`, `runStats`, `bestEst1RM`, `lastPerformance`, `sessionVolume`, `weekSummary`, `liftRecords` (called with `OPERATOR_LIFTS` only), `badges` (hardcodes `base-building`/`operator` phase ids).

---

## 4. UI layer

### 4.1 Routes (`src/App.tsx:63-74`)

All eight routes are children of one **pathless layout route**. No lazy loading, no nested trees.

| Path | Screen |
|---|---|
| `/` | Today |
| `/session` · `/session/:date` | Session |
| `/program` | Program |
| `/history` | History |
| `/maxes` | Maxes |
| `/guide` | Guide |
| `/settings` | Settings |

**Gating is not router-level.** `App.tsx:56-77` branches *before* `<Routes>`: settings `undefined` → blank; `onboarded === false` → renders `<Onboarding />` instead of the router entirely (so the URL is ignored during onboarding).

> **⚠ There is no `<Route path="*">`.** An unknown path renders `null`, and because the layout route is pathless, the header and tab bar vanish too — a blank screen with no way back. Highest-value routing fix.

### 4.2 Navigation

`Layout.tsx:9-16` — six tabs: Today, Program, History, Maxes, Guide, Settings. Fixed bottom glass bar, `grid-cols-6` **hardcoded** (`Layout.tsx:74` — adding/removing a tab silently breaks the layout). Every tap fires `navigator.vibrate(6)`. Header is a slim topo bar: wordmark left, motto "Be a fucking pro" + `${phase.name} · Wk ${pos.week}` right.

### 4.3 Screens

- **`Today.tsx` (597 lines)** — the app's brain and biggest single hazard. **Four entirely different render trees**: loading skeleton · `before` (countdown) · `complete` (which itself has five sub-branches: lapse / BB-done / block-review / retest / stall) · the active-day view. Defines five async mutators (`realign`, `startOperator`, `forceProgress`, `repeatBlock`, `retest`) inline in the render body.
- **`Session.tsx` (796 lines)** — the logger. Four live queries, seven pieces of local state, five effects. Three render modes (SE circuit / lifting / cardio-rest). `SetRow` is deliberately hoisted to module scope (`:100`) — **do not inline it**; the comment at `:95-99` explains it would remount and blur inputs 4×/sec while the rest timer ticks. Autosave on `[ex, meta]` is **debounce-free** (one IndexedDB put per keystroke).
- **`History.tsx` (473)** — stat trio, this-week card, challenge-coin shelf, beginner LP progress *or* TB strength trend, running stats, expandable session list.
- **`Maxes.tsx` (274)** — **100% Operator**. Builds its entire form from `OPERATOR_LIFTS`. In Beginner mode it renders an empty "Operator Maxes" form the user can never use *(verified live 2026-08-21)*.
- **`Program.tsx` (211)** — week/block calendar views.
- **`Settings.tsx` (325)** — mode switch, preferences, phase config, Strava, backup, demo data.
- **`Onboarding.tsx` (157)** — 2-step wizard. **Never offers Beginner mode** — it's only reachable via Settings.
- **`Guide.tsx` (458)** — 14 JSX accordions. **100% TB content with no beginner variant.**

### 4.4 Design system

`components/ui.tsx` exports `Card`, `Button`, `Wordmark`, `Pill`, `SessionIcon`/`SESSION_META`, `SegmentedPicker`, `Stepper`, `SetCheck`, `Toggle`, `Checkbox`, `EmptyState`, `CoinGlyph`, `APP_NAME`. `components/dataviz.tsx` adds `ProgressRing`, `CoinBadge`, `TrendSeries`, `StrengthTrend`, `PaceTrend` — all hand-rolled SVG.

`index.css` (755 lines) holds the whole theme in a Tailwind v4 `@theme` block. Visual language: dark-first gunmetal, **ember = action**, **brass = earned**, topo-map texture (`/topo.svg`) as the identity element, grain film overlay. Fonts: Oswald (display) + Inter (body).

> **⚠ Dark mode is defined twice** — once on `.dark` (`:95-135`) and again verbatim under `@media (prefers-color-scheme: dark)` (`:136-178`). ~40 duplicated lines that must be kept in sync.

### 4.5 UI hazards

1. `Today.tsx` and `Session.tsx` are doing far too much — extract `OperatorBlockReview`, `PhaseCountdown`, `DayCard`, `RestTimer`.
2. No `*` route (see 4.1).
3. `Layout.tsx:33-35` — `PHASES[settings.currentPhaseId]` is unguarded; a stale `currentPhaseId` throws into the ErrorBoundary.
4. Duplicated markup: the "Welcome back" card exists twice in Today; the chevron accordion pattern is written four times; the skeleton block is copy-pasted across four screens.
5. **Mode-blind hardcoded copy** — `APP_NAME`, the Guide, Onboarding, `Today.tsx:524` ("Past your 60 kg dumbbell"), and `Session.tsx:41` (`plan.title.startsWith('Operator')`).
6. **Dead code:** `src/App.css` (184 lines of Vite scaffold, imported nowhere), unused `recharts`, `Pill`'s four legacy tone aliases, `Toggle`/`Checkbox`.
7. **Accessibility:** the only `<h1>` is `sr-only`; no route-change focus management or skip link; countdowns lack `aria-live`; weight/reps inputs are `type="text"`; destructive flows use `window.confirm`.

---

## 5. Strava & infrastructure

### 5.1 OAuth

Starts at `beginStravaAuth()` (`strava.ts:16`) → `strava.com/oauth/authorize` with scope `activity:read_all,activity:write` and **`redirect_uri = ${window.location.origin}/`** computed at runtime. Return leg handled in `App.tsx:44-54` (module-level `autoSyncRan` latch for StrictMode), which POSTs the code to `/api/strava/token` and `history.replaceState`s the query away.

- Client ID `263946` is hardcoded in **two** places that must stay in sync: `src/lib/strava.ts:6` and `functions/api/strava/token.ts:10`. Public by nature.
- The **only real secret** is `STRAVA_CLIENT_SECRET`, a Cloudflare Pages binding set via `wrangler pages secret put`. Not in the repo.
- Tokens live in `Settings.strava` in IndexedDB. Refresh is lazy, inside `getStravaAccessToken()` when `expiresAt - 60 <= now`. No background timer.
- On failure, `runSync()` regex-matches `/token|refresh|401|invalid/i` to set `stravaNeedsReconnect`, surfaced as a banner on Today.

> **⚠ `redirect_uri` is `window.location.origin`** but Strava allows one callback domain per app. **This directly affects the second-subdomain plan — see §8.**

### 5.2 Pages Functions (`functions/api/strava/`)

All `onRequestPost` only, all pass Strava's status through.

| Endpoint | In | Purpose |
|---|---|---|
| `token.ts` | `{code}` or `{refreshToken}` | The only one with a real secret — keeps `STRAVA_CLIENT_SECRET` out of the browser |
| `activities.ts` | `{accessToken, after?}` | CORS dodge — Strava's API sends no CORS headers. `per_page=200`, **no pagination** |
| `update.ts` | `{accessToken, activityId, name?, description?}` | CORS dodge for the write-back |

**None of `functions/` is type-checked or linted** — `tsc -b` covers only `src` and `vite.config.ts`. There is no CI.

### 5.3 Sync (`src/lib/stravaSync.ts`)

Triggers: app open (10-min throttle), post-connect, manual "Sync now", one-off history import, DEV-only tag button. Imports `RUN_TYPES` (Run/TrailRun/VirtualRun/Walk/Hike) and `LIFT_TYPES` (WeightTraining/Workout/Crossfit); everything else skipped.

Runs become whole `SessionLog`s. **Lifts are never created** — the app owns the sets; sync only patches `stravaId`/`durationMin`/`avgHr` onto an already-logged session, field-wise, only where still null. Write-back (`liftDescription`, `:50`) pushes per-exercise lines + a muscle list + a volume footer onto the Strava activity; **beginner-mode runs are never renamed** because Runna owns them.

### 5.4 PWA & deploy

`registerType: 'prompt'` — deliberately not `autoUpdate`, so a new build can't hot-swap chunks mid-session. Manifest: "Tactical Barbell" / "TB", `#0b0c0e`, standalone, portrait. `devOptions.enabled: false`, so **the service worker is never exercised by the Playwright suite** (which runs against the dev server).

```
npm run build   # tsc -b && vite build
npm run deploy  # build && wrangler pages deploy dist --project-name tb-app --branch main
```

Deploys are **manual from the dev machine** — no CI, no Pages Git integration, no `wrangler.toml`. Version stamp `APP_VERSION` in `src/version.ts` is bumped **by hand** and echoed in the commit subject; it's rendered in the footer to detect a stale PWA cache.

### 5.5 Infrastructure risks

- **`POST /api/strava/token` is an unauthenticated public oracle.** It will sign anyone's `code` with your client secret. No origin check, no rate limit. `activities`/`update` are likewise open relays.
- **No OAuth `state` parameter** (CSRF).
- **No pagination and no 429 handling.** `importStravaHistory()` requests two years in a single 200-item page; with `after`, Strava returns the *oldest* slice, so history is silently lost.
- **Write-back staleness** — the skip condition keys only on name equality, so editing sets after the first push never re-uploads; a manually-renamed activity gets rewritten every sync.
- `dev-preview.bat` points at a **second checkout** (`C:\Users\Josh Birch\dev\tb-app`) that is not this repo.
- `backups/` is untracked **and un-ignored** — real personal data, one `git add .` from being committed.

---

## 6. Tests

**49 Playwright e2e tests across 17 specs + 39 Vitest unit tests.**

`e2e/helpers.ts` is genuinely good infrastructure and should be the starting point for any new test:

- Extended `test` fixture **auto-fails on any console error or pageerror** (with a benign allowlist). A test that *intends* a crash must opt out.
- `_noSplash` auto-fixture sets `tb-no-splash` so the cold-open never blocks tests.
- `seedState(page, {settings, sessions, maxes})` writes Dexie directly then reloads; `onboarded: true` bypasses onboarding.
- `readSessions`/`readMaxes`/`readSettings` assert the **persisted row**, not the DOM. `expect.poll` is the idiom.
- **Date control is by injection, not clock-mocking — there is no `page.clock` usage anywhere.**

The unit suite is the strongest asset: it asserts Brzycki 1RM against the printed numbers in TB1 3rd ed *and* explicitly asserts the result is **not** Epley.

**Zero coverage:** the Program calendar (~12 enumerated scenarios), the Guide screen, and — most concerning — **the Maxes calculator inputs**, the load-bearing math UI. Also uncovered: streak math, badges, `sessionVolume`, `liftRecords`, OAuth callback, sync throttle, write-back idempotency, historical import/dedupe, and the assertion that **export strips Strava tokens**.

`e2e/COVERAGE.md` is **stale** — claims 41 tests, omits `beginner.spec.ts` and `splash.spec.ts`, and has no backlog section for Beginner Mode at all.

---

## 7. Product docs & outstanding backlog

`docs/` holds three user-testing rounds (round 3 alone has 77 findings) plus two audits.

**Both audits came out well.** The book-fidelity audit (2026-07-12) checked Base Building and Operator against TB1 3rd ed and TB2 and found an **exact match** — it also retired round 2's "[MUST] Black is mislabelled" finding, since 2 HIC + 1 E is an explicitly allowed variant (TB2 p72). The weight-math audit caught a genuine **Epley → Brzycki** error (fixed) and correctly **overrode its own recommendation** on training max: 90% TM stays the default, per K. Black's own guidance that using true 1RM as your TM is the #1 stall cause.

### Still open

1. **Opt-in deload week between Operator blocks** — requested in all three rounds, marked [MUST] in round 2, **never built or decided**.
2. **Morning notification cue** — round 3 calls it the single biggest adherence lever; feasibility on an installed PWA was never spiked.
3. **Strava backlog** (densest cluster): unauthenticated proxy, no OAuth `state`, 200-activity cap, date-only write-back matching (can rename the wrong same-day activity), second same-day activity dropped, no 429/backoff, near-midnight date bucketing.
4. **Session hydration merges by array index** (round 3 #47) — corrupts a reloaded log if the plan's set order/count changes. Unfixed and untested.
5. **No unique date index; `.first()` is nondeterministic** (#48) on a schema frozen at `version(1)` (#60).
6. **SE circuit logs planned reps** (#32) — bodyweight history is fiction.
7. **Best-est-1RM logic duplicated 3×** (#72) — the chart and the PR number can silently disagree.
8. **Open decision awaiting Josh since July:** the Operator pull is a 1-Arm DB Row, whereas every cluster in the books uses a weighted pull-up. Audit recommendation: keep the row, treat the pull-up as the goal, swap at a block boundary around 10 bodyweight pull-ups.
9. Book-fidelity copy polish: 120-min long-E ceiling, SE rest "2–3 min", weeks 6-8 label note.
10. Polish batch deliberately deferred: hero numeral font, count-up motion, dark elevation, PR timeline, pace/HR chart, plus a11y hygiene (`maximum-scale=1`, `aria-current`, `:focus-visible`).

---

## 8. Extending to a new protocol (TB MASS) — what resists

Assessed against the **current** code. Much of this is why the decision was taken to rebuild TB from the books rather than extend it.

1. **`WaveWeek` is `{week, pct, sets, reps}`** — one prescription per week. That hardcodes the Operator assumption that Mon/Wed/Fri are identical. Zulu and Mass need per-day prescriptions and multiple clusters; **the type cannot express them.** Needs `days: Record<number, {pct,sets,reps}>` or a per-session prescription array.
2. **`OPERATOR_LIFTS` is imported directly by five screens** — `Maxes.tsx:30,60,86,123,222,237` builds the whole max-entry form from it, so a 4- or 5-lift cluster has nowhere to enter maxes. Also `Today.tsx:143`, `History.tsx:98,137,161,304`, `Program.tsx:38`. All should read `PHASES[phaseId].lifts`.
3. **`blockCompleted()` hardcodes weeks 3 and 6** as the heavy weeks that must be logged. A 4-week block is silently misjudged.
4. **`restSeconds()` sniffs `plan.title.startsWith('Operator')`** for 240s rest. A "Mass — Week 3" title silently gets 120s.
5. **`MaxEntry` has no protocol scope** — keyed by `liftId` alone, so a Mass block reusing `op_bench` inherits Operator's accumulated `bumpKg`.
6. **`programMode` is a two-valued union** and must become a protocol id — touching `types.ts:79`, `Settings.tsx:59-79`, and all nine mode-sniffing call sites.
7. **`SessionType` is a closed union** with exhaustive maps in `SESSION_META` and `TYPE_LABEL` — a hypertrophy/accessory day has no type.
8. **Load math is dumbbell-only.** `DB_MIN=4`, `DB_MAX=60`, increments 1|2 kg, `perDumbbell: true` everywhere. **A barbell block needs plate math that does not exist anywhere in this codebase.**
9. **`badges()` hardcodes `base-building`/`operator`** phase ids, so new-protocol milestones award nothing.

---

## 9. Live verification (2026-08-21)

Deployed app at `tb.joshua-birch.co.uk` with the 2026-08-19 backup (23 sessions, 0 maxes) imported through the app's own import flow — **the import path works, including the confirm dialog and the row counts shown in it**.

Observed: Beginner · Wk 4 · 23-session streak · 3 done this week · 3,088 kg volume. Three challenge coins earned (10 sessions, 50 km logged, 23-session streak) with a fourth locked. Progress across six lifts since starting:

| Lift | Start → Now |
|---|---|
| Goblet / Front-rack Squat | 10 → 20 kg (+10) |
| DB Bench Press | 8 → 16 kg (+8) |
| 1-Arm DB Row | 8 → 18 kg (+10) |
| DB Romanian Deadlift | 10 → 18 kg (+8) |
| DB Reverse Lunge | 8 → 16 kg (+8) |
| DB Overhead Press | 6 → 8 kg (+2) |

**+46 kg/DB total.** The Maxes tab was confirmed to render an unusable empty Operator form in Beginner mode.

Screenshots: `docs/_screens/`.
