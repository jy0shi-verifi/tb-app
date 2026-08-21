# CLAUDE.md — tb-app

Read this first, then **`HANDOFF.md`** for where work actually stopped and what comes next. For the full architecture reference, see **`docs/codebase-map.md`** (dated map of every subsystem, with file:line references).

---

## What this is

A single-user, offline-first training PWA. Josh uses it **every morning** to run his lifting and running. It tells him what to do that day and works out every weight.

- **Sole user: Josh.** Every design decision assumes one user, one device-local database, no auth, no backend.
- **Currently running:** Beginner Mode — dumbbell A/B double progression (3×8–12, +2 kg when all three sets hit 12). Running is delegated to **Runna** and pulled in via **Strava**.
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

## Status: Tactical Barbell strip — done on branch `strip-tb`

The TB programme code was never verified against the books, so it is being **rebuilt from scratch** rather than trusted. Step 1 (removal) is complete on branch **`strip-tb`**; `master` is untouched and still matches what Josh uses daily.

**Removed:** the Maxes calculator (screen, route and tab), Operator and Base Building session generation, all TB load math (`trainingMax`, `basisMax`, `workingLoad`, `effective1RM`, `maxToBasis`, the wave tables), `src/lib/progression.ts` (block completion, forced progression, the retest ladder), the TB↔Beginner mode switch, the `loadBasis` control, the Operator hold/strength-trend/records blocks in History, and the dead `src/App.css`.

**Kept deliberately:**
- **The Guide screen** — still all TB content; to be rewritten later.
- **The "Tactical Barbell" wordmark and header text** — Josh wants the branding.
- **`MaxEntry` and the `maxes` table** — nothing writes them, but they are part of the backup contract, so v1 files still round-trip.
- **`estimate1RM`** (Brzycki) — still used for PR detection and the Strava write-back. Its book-anchored tests in `test/calc.test.ts` survive; reuse them when TB is rebuilt.
- `SessionType` still includes `'se'` and `'hic'` so Josh's existing logged sessions keep their type.

**Safety nets added:** `ensureSeeded()` and `importBackup()` both coerce `currentPhaseId` to `'beginner'`, so a stored TB phase (or a restored old backup) can't strand the app on a phase with no generator; `resolvePosition` falls back rather than throwing; and a `<Route path="*">` catches bookmarked `/maxes` links instead of rendering a blank page.

**Verified:** 39 e2e + 24 unit tests green; `npm run build` clean; Josh's real 23-session backup imported into the stripped build renders identically to production (same streak, week, weights, coins, +46 kg/DB).

**Next:** rebuild Tactical Barbell from the books on a fresh branch. Do not mix rebuild work into `strip-tb`.

---

## Commands

```bash
npm run dev        # Vite dev server, port 5173
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run test:unit  # Vitest  — test/**/*.test.ts
npm run test:e2e   # Playwright — e2e/, spins its own server on :5199
npm run deploy     # ⚠ DEPLOYS TO PRODUCTION (project tb-app). Do not run for in-progress work.
```

There is **no CI**. Deploys are manual from this machine. `functions/` is neither type-checked nor linted by any script.

---

## Architecture in brief

React 19 + TypeScript + Vite 8 · Tailwind v4 · **Dexie/IndexedDB** · react-router v7 · Cloudflare Pages + 3 Pages Functions (Strava proxy only).

**No global state store.** Every screen reads Dexie via `useLiveQuery` and writes back imperatively. Don't add a store without a specific reason.

**Three tables** (`src/db.ts`), schema **still at version 1, no migrations ever written**:

```
settings: 'id'                    // single row, id: 'app'
maxes:    'liftId'
sessions: '++id, date, phaseId'
```

**Programme dispatch** goes through `sessionFor()` in `src/program.ts`, which currently always delegates to `beginnerSessionFor()`. `PHASES` holds only `beginner`. When TB is rebuilt, this is the seam to branch on — and `PhaseMeta` is where per-protocol data belongs, rather than the hardcoded `switch(day)` the old implementation used.

---

## Conventions & gotchas

- **Dates are local time, never UTC.** `YYYY-MM-DD` strings, Monday-based weeks (`day` 0=Mon…6=Sun). Use `src/lib/date.ts` — never `Date.parse` on a date string.
- **`strava.expiresAt` is epoch seconds. Every other timestamp is milliseconds.**
- **There is no barbell plate math in this codebase.** All load handling is per-dumbbell (`perDumbbell: true`, a 4–60 kg clamp, 1/2 kg increments). The MASS rebuild needs bar weight, plate pairs, loadable-weight rounding and a per-side breakdown built from scratch — and `PlannedSet` needs to express barbell, dumbbell and bodyweight loading, because the existing beginner history is all per-dumbbell and must keep rendering.
- **Exercises are keyed by display-name string**, not id. Renaming an exercise string silently breaks historical progress calculations. Josh's logged history still contains old TB exercise names, and several collide with the beginner lifts (`'DB Bench Press'`, `'1-Arm DB Row'`, `'DB Romanian Deadlift'`) — a rebuilt TB protocol that reuses those names will feed the beginner stall detector, and vice-versa. Scope any new lookup by phase, not just by `type === 'lift'`.
- **`SetRow` in `Session.tsx` is hoisted to module scope on purpose.** Inlining it remounts and blurs the inputs 4×/sec while the rest timer ticks. The comment at `Session.tsx:95-99` explains it. Don't "tidy" it.
- **Session writes re-read the freshest row before saving** (`Session.tsx:300`) so a background Strava sync isn't clobbered, and **refuse to delete a Strava-linked row** — they un-tick `done` instead. Preserve both behaviours.
- **Dark mode is defined twice** in `src/index.css` (`.dark` and the `prefers-color-scheme` block) — ~40 duplicated lines that must be kept in sync.
- **`<Route path="*">` renders Today.** Added during the strip so bookmarked `/maxes` links don't render a blank screen. Keep a catch-all if you touch routing.
- `APP_VERSION` in `src/version.ts` is bumped **by hand** and echoed in the commit subject (`… (v23)`). It's shown in the footer to detect a stale PWA cache.

### Known live risks (not yet fixed)

- The **"Load demo history" and "Reset to clean" buttons in `Settings.tsx:302/313` are not DEV-gated** — the production app can wipe real training data from the UI.
- `POST /api/strava/token` is an **unauthenticated public endpoint** that signs any caller's code with `STRAVA_CLIENT_SECRET`. No origin check, no rate limit, and the OAuth flow has no `state` parameter.
- `sessions.date` is **not a unique index**, yet nearly all read code assumes one session per date.
- **Strava's `redirect_uri` is `window.location.origin`**, but Strava allows only one callback domain per app — **this needs solving before the new app can connect to Strava from a second subdomain.**
- `backups/` is untracked **and un-ignored** — real personal data, one `git add .` from being committed.

---

## Testing

`e2e/helpers.ts` is the entry point for any new Playwright test: `seedState()` writes Dexie directly, `readSessions`/`readSettings` assert the persisted row rather than the DOM, and the extended `test` fixture **auto-fails on any console error**. There is no `page.clock` usage — dates are controlled by injecting `phaseStartDate`, not by mocking time.

`e2e/COVERAGE.md` is stale (claims 41 tests; there are 49) and has no Beginner Mode section.

The Vitest suite is the strongest asset in the repo — it asserts Brzycki 1RM against the printed numbers in TB1 3rd ed. **If TB math is rebuilt, rebuild these assertions from the books too.**

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
