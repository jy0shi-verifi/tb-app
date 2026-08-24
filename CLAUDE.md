# CLAUDE.md — tb-app

Read this first, then **`HANDOFF.md`** for where work actually stopped and what comes next, and
**`docs/BACKLOG.md`** for the durable list of outstanding work — **if something is not in that file it
will be forgotten.** For the full architecture reference see **`docs/codebase-map.md`** (dated map of
every subsystem, with file:line references); for the MASS rebuild see **`docs/mass-design.md`** and the
book extraction in **`docs/MASS/MASS-extraction.md`**.

---

## What this is

A single-user, offline-first training PWA. Josh uses it **every morning** to run his lifting and running. It tells him what to do that day and works out every weight.

- **Sole user: Josh.** Every design decision assumes one user, one device-local database, no auth, no backend.
- **Currently running (live app, `master`):** Beginner Mode — dumbbell A/B double progression (3×8–12, +2 kg when all three sets hit 12). Running is delegated to **Runna** and pulled in via **Strava**.
- **In development (`tb2`, branch `mass-extraction`):** Tactical Barbell **MASS — Grey Man**, rebuilt from the book. Josh will not switch to it for some months (he is cutting on Beginner until the barbell and rack arrive), so tb2 has no deadline pressure — but **Beginner must keep working**, it is not legacy code that can rot.
- **Live at:** `tb.joshua-birch.co.uk` (Cloudflare Pages project `tb-app`).
- **In daily production use with ~1 month of real training history.**

> **Data loss is the highest-severity failure mode in this project.** Real history lives only in browser IndexedDB and JSON backups. Treat anything touching `src/db.ts`, the backup format, or Dexie schema as high-risk and test it.

---

## The plan

1. **Strip out the existing Tactical Barbell code** *(done — see Status below).*
2. Build the new/improved app **on a separate subdomain**, so Josh keeps using the current app uninterrupted while development happens.
3. Rebuild Tactical Barbell **from the books**, from scratch — the **MASS** protocol (confirmed), not Operator/Black. MASS is **barbell**-based; assume Josh has a barbell and rack even though he hasn't bought them yet.
4. When it's ready, Josh migrates: exports from the current app, imports into the new one, switches over.

### The fidelity rule

**The book wins, always.** Whatever the book says to do, the app does. Where the book offers options, follow its own recommendation — don't substitute judgement or quietly "improve" a prescription. Every claim extracted from a book carries a **page reference**; no page number, no claim. The book's printed tables become **test fixtures** (see `test/calc.test.ts` — it asserts against the author's printed worked examples and explicitly asserts the result isn't the wrong formula; that test is why a real bug got caught).

Outside research is a **second pass, not an input**: cross-reference a finished plan against what others do, and research specific points the book leaves unclear — but never let a forum post reshape an extraction before the book has been read.

### Two hard constraints

**A. Changes must stay separate from the live app.** The current app at `tb.joshua-birch.co.uk` must keep working exactly as it does today. New work deploys to a **separate Cloudflare Pages project**. Never deploy in-progress work to the production project.

| | Live app | Rebuild |
|---|---|---|
| Pages project | `tb-app` | `tb-app-v2` |
| URL | `tb.joshua-birch.co.uk` | `tb2.joshua-birch.co.uk` · `tb-app-v2.pages.dev` |
| Deploy with | `npm run deploy` **(only when Josh asks)** | `npm run deploy:v2` |
| PWA name | Tactical Barbell / TB | Tactical Barbell v2 / TB v2 |

`npm run deploy:v2` (`scripts/deploy-v2.mjs`) builds with `APP_VARIANT=v2` — which renames the PWA and the tab so two installed copies are tellable apart — and pushes to `tb-app-v2`. The two sites are **separate origins, so their IndexedDB training data is completely isolated**: experimenting on v2 can't touch the real history on the live app, and v2 starts empty until a backup is imported into it.

**Deploy `v2` at the end of any turn that changes the app**, so Josh can actually look at the work on his phone. It takes ~15 seconds.

**B. Backup portability is sacred.** Josh must be able to export from the current app and import into the new one **with no hassle and no data loss**. That makes the backup JSON the migration contract:

```json
{ "app": "tb-app", "version": 1, "exportedAt": "<ISO>",
  "settings": [...], "maxes": [...], "sessions": [...] }
```

- `parseBackup` refuses `version > BACKUP_VERSION`, so **the new app must be able to read version 1**.
- If the schema must change, **bump `BACKUP_VERSION` and write an upgrade path for v1 files** — never silently reinterpret them.
- The 23 real sessions in `backups/tb-backup-2026-08-19 (2).json` are the regression fixture. Any migration work must round-trip them.

---

## Status: MASS rebuild — Grey Man complete on branch `mass-extraction`

`master` is untouched and still matches what Josh uses daily. Branch `strip-tb` removed the unverified
Tactical Barbell code; branch **`mass-extraction`** (off `strip-tb`) contains the rebuild.

**The book is extracted.** `docs/MASS/MASS-extraction.md` — 4,800 lines, nine chapter sections, every
claim page-referenced. All 71 programming tables in the PDF are **raster images, not text**, so each was
transcribed visually; a text-only extraction would have captured every caveat and not one percentage.
The source PDF, its text dump and the extracted page images are **gitignored** (copyrighted); only the
derived extraction is tracked.

**The design is written.** `docs/mass-design.md` — decisions, the type model, the test-fixture list, and
every **DEVIATION** from the book labelled with why.

**Grey Man is built and runs on `tb2`.** All nine build steps of `docs/mass-design.md` §9 are done:

| | |
|---|---|
| `src/lib/barbell.ts` | plate math — exact subset-sum, nearest with ties down, per-side breakdown |
| Dexie **v2** + `oneRm` table | first migration in the project; `BACKUP_VERSION` **2** |
| `src/protocol.ts` + `PROTOCOLS` | protocol registry; `PHASES`/`PhaseMeta` are gone |
| `src/protocols/greyman.ts` | the p.51 grid as data, A/B clusters, load resolution |
| `src/screens/Maxes.tsx` (`/maxes`) | 1RM entry from a 2–3 rep test set (p.63) |
| Session screen | loading-aware units, plate line, unrounded target |
| `src/screens/Plan.tsx` (`/plan`) | block sequence, S-cluster builder, conditioning days |
| `src/protocols/bridge.ts` | Bridge Week (pp.92–93) |
| `src/protocols/conditioning.ts` | all eight Green/Black sessions, cards verbatim |
| `src/lib/progression.ts` + `src/screens/Progression.tsx` (`/progression`) | Forced Progression (p.53, p.90) |
| `src/lib/snapshots.ts` | automatic on-device backups (Dexie v3) |
| `src/lib/planRules.ts` + `src/screens/NextCycle.tsx` (`/next-cycle`) | plan presets and two-tier guardrails |

**Audited (2026-08-24):** eight agents — four against the book, four against the code. Reports in
`docs/audit/`, ranked synthesis in `docs/audit/00-summary.md`, outstanding items in `docs/BACKLOG.md`.
The transcription came back faithful; the failures were in the engine around it.

**The audit is now worked through.** All ~44 findings are closed except the deliberately deferred ones
— see `docs/BACKLOG.md`, which is the live list. The headline change is that **the programme now
progresses**: Forced Progression (p.53, p.90) is implemented, where before nothing in `src/` wrote a
non-zero `progressedKg` and block 4 prescribed exactly what block 1 did. Also added: automatic
on-device backups, the guided block planner, Green conditioning on lifting days, the 5th set,
per-cluster rest, the conditioning allowance including Josh's own running, a programme choice in
onboarding, and a Guide rewritten from the book.

Confirmed sound and **not worth re-auditing**: the Grey Man grid cell for cell, all eight conditioning
cards, the 3-week block decision (book-cited, p.67), the absence of any rounding rule in the book, the
v1→v2 migration *including* a stale build opening a v2 database, and the plate math — validated against
an independent brute-force knapsack over 13 inventories × 1,041 targets with zero mismatches.

**Verified at handoff:** 287 unit + 62 e2e green, typecheck/lint/build clean, and the real 23-session
backup round-trips through the schema unchanged.

**Not built:** the other three General templates (Mass, Gladiator, Fighter HT), Base Building
(**book-sanctioned** to skip for a runner — p.18, p.151, not a deviation), and nutrition/supplement
tracking. **Specificity (Alpha/Bravo) is no longer optional**: Josh ruled on 2026-08-24 that it is
required before the app is finished, since without it the app cannot run the book's Standard Cycle
(p.140) or any General:Specificity ratio (pp.141–142). The model accommodates all of them. See
`docs/BACKLOG.md`.

**"Load demo history"** seeds the whole timeline: 26 weeks of Beginner, then four Grey Man blocks with a
bridge week, landing mid-block. Both halves run the real `sessionFor`, so seeded weights are the ones the
app would genuinely have prescribed.

**Kept deliberately:** the "Tactical Barbell" wordmark, `MaxEntry` and the `maxes` table (frozen — nothing writes them, but v1 backups round-trip
through them), `estimate1RM` (Brzycki — and p.90 explicitly sanctions estimating a 1RM from a 2RM/3RM),
and `'se'`/`'hic'` in `SessionType` so Josh's logged history keeps its types.

## Commands

```bash
npm run dev        # Vite dev server, port 5173
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b && tsc -p tsconfig.test.json --noEmit — ALSO covers test/ and e2e/
npm run lint       # oxlint
npm run test:unit  # Vitest  — test/**/*.test.ts
npm run test:e2e   # Playwright — e2e/, spins its own server on :5199
npm run deploy     # ⚠ DEPLOYS TO PRODUCTION (project tb-app). Do not run for in-progress work.
```

There is **no CI**. Deploys are manual from this machine. `functions/` is type-checked (`tsconfig.functions.json`, wired into `npm run typecheck`) but still not linted.

`npm run build` only typechecks `src`. **Use `npm run typecheck`** — it covers `src`, `test`, `e2e`
**and `functions/`**. Each of those gaps was real: `test/`/`e2e/` being unchecked is how a
required-argument change compiled cleanly and failed at runtime, and adding `functions/` immediately
found a dead guard in the code that holds the Strava client secret.

---

## Architecture in brief

React 19 + TypeScript + Vite 8 · Tailwind v4 · **Dexie/IndexedDB** · react-router v7 · Cloudflare Pages + 3 Pages Functions (Strava proxy only).

**No global state store.** Every screen reads Dexie via `useLiveQuery` and writes back imperatively. Don't add a store without a specific reason.

**Five tables** (`src/db.ts`), schema at **version 3**. Both migrations are add-a-store-only:

```
settings:  'id'                       // single row, id: 'app'
maxes:     'liftId'                   // FROZEN — v1 only, for backup round-tripping
sessions:  '++id, date, phaseId'
oneRm:     '[protocolId+exerciseId]'  // v2 — protocol-scoped 1RMs
snapshots: '++id, takenAt'            // v3 — automatic on-device backups
```

**The `snapshots` store is safe because nothing names it.** `clearAll`, the demo seeder and
`importBackup` all clear tables BY NAME, so a store none of them lists survives every destructive path
without any call site having to remember. That is structural, not a convention. Snapshots are **never
exported** — otherwise each backup would nest the previous ones.

`BACKUP_VERSION` is **2** and stays there: Dexie v3 added no exported table. v1 files still load (a
missing `oneRm` becomes `[]`). **v2 files will not load into the live app** — take a fresh v1 export
before switching over.

**Programme dispatch** goes through `sessionFor()` in `src/program.ts` → `PROTOCOLS[id].sessionFor()`.
`PHASES`/`PhaseMeta` no longer exist. A `Protocol` (`src/protocol.ts`) carries its clusters, lifting
days, block length, conditioning colour and `maxScope`. To add a template, write one file under
`src/protocols/` and register it — no screen changes.

**Two position modes.** With `settings.plan` present, `resolvePosition` walks an ordered list of blocks
and returns `blockIndex`/`blockCount`. Without one it falls back to the original single open-ended phase
(`currentPhaseId` + `phaseStartDate`), which is what Beginner and every existing install still use.

---

## Conventions & gotchas

- **Dates are local time, never UTC.** `YYYY-MM-DD` strings, Monday-based weeks (`day` 0=Mon…6=Sun). Use `src/lib/date.ts` — never `Date.parse` on a date string.
- **`strava.expiresAt` is epoch seconds. Every other timestamp is milliseconds.**
- **Barbell plate math lives in `src/lib/barbell.ts`.** `loadBar()` solves an exact subset-sum over the
  plate inventory — **not** greedy heaviest-first, which fails on an irregular set (20 kg a side from 15s
  and 10s: greedy takes a 15 and cannot finish). Rounding is **nearest, ties down**; this is **our rule,
  not the book's** — MASS gives none in 160 pages — so `LoadedBar` returns the unrounded target and the
  UI always shows it. Don't "simplify" that away. The per-side target is deliberately not snapped to the
  unit grid before comparison; snapping first turns a round-down into a round-up.
- **Four loading modes**, with genuinely different arithmetic: barbell (% × 1RM), dumbbell (per hand),
  **bodyweight (% applies to MAX REPS**, p.90 — a 10-rep max at 70% is 7 reps), and weighted bodyweight
  (**bodyweight must be inside the calculation**, p.90).
- **Scope by protocol, never by `type === 'lift'` alone.** This one root cause produced **four** separate
  bugs, the worst of which silently rewrote Beginner's per-dumbbell working weights from barbell totals
  when a Grey Man session was finished. Grey Man sessions are also `type: 'lift'`. Beginner's helpers now
  filter `phaseId === 'beginner'` *inside* `src/beginner.ts` so a call site cannot forget, and
  `lastPerformance` takes `phaseId` as a **required** argument for the same reason.
- **A stored 1RM carries a unit.** `OneRmEntry.unit` is `'total'` or `'perDumbbell'` — a factor of two
  apart. Anything computing a load must check it, not just the exercise's loading kind; the S-cluster
  builder lets the kind change after a max is stored.
- **Under a block plan, `settings.currentPhaseId` and `settings.phaseStartDate` are stale leftovers.**
  Screens must read `resolvePosition()`, and any calendar must use `pos.blockStartDate`. Reading settings
  directly put every date in `Program.tsx` months out.
- **A protocol's real exercise list is `protocol.exercisesFor(settings)`, not `protocol.clusters`.** Grey
  Man's S cluster is user-built (p.49); reading the static default made custom exercises un-loadable.
- **Never seed React state from data that is still loading.** `useSettings`, `useSessions` and
  `useAllOneRm` all return a default (`DEFAULT_SETTINGS`, `[]`) before IndexedDB answers, so a
  `useEffect` that copies derived data into state runs against nothing and never re-runs. That is how
  every lift came back ticked on the progression screen, including ones marked "struggled" — with all
  22 unit tests passing. **Derive, don't copy**, and keep only genuine user overrides in state.
- **`applyBeginnerProgress` and `lastPerformance` take `phaseId` as a REQUIRED argument.** A name check
  is not a protocol check: exercise names collide across programmes by design, so a Grey Man S cluster
  containing `Goblet / Front-rack Squat` walked straight past the old name guard.
- **Hooks must sit above every early return.** Moving `useMaxesFor` below `Today.tsx`'s loading guard
  crashed every screen with "Rendered more hooks than during the previous render".
- **Historical exercises are keyed by display name**; new ones carry a stable `exerciseId`. Stored 1RMs
  are keyed `(maxScope, exerciseId)`. All MASS templates share `maxScope: 'mass'`; Beginner has its own,
  because its maxes are **kilos per dumbbell** and MASS's are **total on the bar** — letting those meet
  would be a silent factor-of-two error on every set.
- **`SetRow` in `Session.tsx` is hoisted to module scope on purpose.** Inlining it remounts and blurs the inputs 4×/sec while the rest timer ticks. The comment at `Session.tsx:95-99` explains it. Don't "tidy" it.
- **Session writes re-read the freshest row before saving** (`Session.tsx:300`) so a background Strava sync isn't clobbered, and **refuse to delete a Strava-linked row** — they un-tick `done` instead. Preserve both behaviours.
- **Dark mode is defined twice** in `src/index.css` (`.dark` and the `prefers-color-scheme` block) — ~40 duplicated lines that must be kept in sync.
- **`<Route path="*">` renders Today.** Keep a catch-all if you touch routing. Four screens live
  outside the tab bar — `/maxes`, `/plan`, `/progression`, `/next-cycle` — and each renders a
  `ScreenHeader` back link, because without one they are dead ends on a phone with no browser chrome.
- **`ensureSeeded` and `importBackup` coerce `currentPhaseId` only when it does not resolve.** They used
  to pin it to `'beginner'` unconditionally, which would silently undo a switch to Grey Man on every app
  open. Don't reintroduce that.
- `APP_VERSION` in `src/version.ts` is bumped **by hand** and echoed in the commit subject (`… (v23)`). It's shown in the footer to detect a stale PWA cache.

### Known live risks

Most of the original list is now closed (see `docs/BACKLOG.md`). What remains:

- `sessions.date` is **not a unique index**. Duplicate rows can no longer be *created* — autosave is
  serialised — and `sessionForDate` merges any that an older build left behind, field by field. A real
  unique index is still the proper fix, and is what a same-day conditioning session would need in order
  to be logged separately from the lift it shares a day with.
- `POST /api/strava/token` now requires a same-origin request, and the OAuth flow carries a `state`
  parameter. Neither can stop a determined caller with **curl** — nothing shipped in a public SPA can,
  since the only thing that would is a secret the client holds. Rate limiting is the next step if it is
  ever seen being hit.
- **Strava's `redirect_uri` is `window.location.origin`**, but Strava allows only one callback domain
  per app. **Decided (Josh, 2026-08-22): register a second Strava API app** against
  `tb2.joshua-birch.co.uk`. **Blocked on Josh** supplying the client ID; the secret goes in the
  `tb-app-v2` Pages environment, never the repo. The client ID must come from build config so the two
  variants can differ. Until then **Strava does not work on tb2 at all**.

## Testing

`e2e/helpers.ts` is the entry point for any new Playwright test: `seedState()` writes Dexie directly, `readSessions`/`readSettings` assert the persisted row rather than the DOM, and the extended `test` fixture **auto-fails on any console error**. There is no `page.clock` usage — dates are controlled by injecting `phaseStartDate`, not by mocking time.

`e2e/COVERAGE.md` was rewritten on 2026-08-24: a per-spec table of the 62 tests, what the unit suite
covers instead and why, and what is still genuinely uncovered. Its §3 is the old Tactical Barbell
backlog, kept as history behind a warning — most of it describes screens removed on `strip-tb`.

Unit tests need `fake-indexeddb` for anything touching Dexie — `import 'fake-indexeddb/auto'` first.

**The book's printed tables are the fixtures.** `test/greyman.test.ts` asserts the p.51 grid cell for
cell; `test/barbell.test.ts` and `test/plan.test.ts` do the same for the plate math and the conditioning
cards. Follow the house pattern of also asserting **the plausible wrong answer** — `total(32)` must be
32.5 *and must not be 30*; `bodyweightReps(10, 70)` must be 7 *and must not be 10*. That pattern is what
caught the original Brzycki/Epley bug.

`test/migration.test.ts` builds a **real v1 IndexedDB**, fills it and opens the app's `TBDatabase` over
the top. It also imports Josh's real backup whenever `backups/` holds one.

---

## "Handoff time"

When Josh says **handoff**, he means: this chat is ending and a fresh one picks the work up — possibly mid-task. Leave nothing in your head that isn't on disk. Do all of this:

1. **Write or update `HANDOFF.md`** — where the work actually stopped, what is done, what is next, open questions, and how to resume. Assume the next session has zero context beyond the repo. If a task is half-finished, say exactly which half and what the next concrete step is.
2. **Update `CLAUDE.md`** if any standing context changed — new commands, new constraints, corrected assumptions, changed architecture. Don't leave stale statements in it.
3. **Commit and push everything**, so nothing is lost. Verify the push actually landed (`git status` clean, branch tracking a remote, `git log origin/<branch>` shows the commits).
4. **Leave the tree in a known state** — say what is committed, what is deliberately uncommitted, and why.

A handoff is not a summary in chat. It is durable state in the repo.

---

## Working agreements

- **Verify against the books, don't assume.** The whole reason TB is being rebuilt is that the previous implementation was written without checking. `docs/book-fidelity-audit-2026-07-12.md` and `docs/weight-math-audit.md` show the standard expected.
- **Don't deploy to production** (`npm run deploy`) unless Josh explicitly asks.
- **Don't run destructive git commands.** Ask first.
- Josh reviews changes in the real app, not just in tests — expect to demo work running.
