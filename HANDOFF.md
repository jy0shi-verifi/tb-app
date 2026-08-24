# HANDOFF

**Last updated:** 2026-08-24 · **Branch:** `mass-extraction` · **Status:** MASS Grey Man built, audited by
eight agents, first fix pass landed. Deployed to `tb2` as **v33**; v32 reviewed and approved by Josh.

Read in this order:

1. `CLAUDE.md` — standing project context, constraints, conventions.
2. **`docs/BACKLOG.md`** — every outstanding item, with audit IDs and evidence. **If something is not in
   that file it will be forgotten.**
3. `docs/audit/00-summary.md` — the ranked synthesis of the audit, and why each item matters.
4. This file — where the work actually stopped.

---

## Where we are

The Tactical Barbell MASS book has been extracted, a design written from it, **Grey Man built end to
end**, and the whole thing audited by eight independent agents (four against the book, four against the
code). Nine findings are fixed; the rest are in the backlog.

`master` is untouched and still matches what Josh uses every morning.

**Josh will not use tb2 for months.** He is cutting on Beginner Mode and has no barbell or rack yet;
possibly an interim dumbbell hypertrophy block before MASS starts. So there is no deadline pressure —
but **Beginner Mode must keep working**, and its real history must keep rendering. Three of the audit's
worst findings were Beginner being corrupted or misread by MASS code.

### Built

| | Where |
|---|---|
| Book extracted, every claim page-referenced | `docs/MASS/MASS-extraction.md` (4,800 lines, 9 sections) |
| Design, decisions, labelled deviations | `docs/mass-design.md` |
| Audit: 8 reports + synthesis | `docs/audit/` |
| Plate math (proven correct — see below) | `src/lib/barbell.ts` |
| Dexie v2, `oneRm` table, `BACKUP_VERSION` 2 | `src/db.ts`, `test/migration.test.ts` |
| Protocol registry (`PHASES` retired) | `src/protocol.ts`, `src/program.ts` |
| Grey Man | `src/protocols/greyman.ts` |
| Bridge Week · conditioning catalogue + placement | `src/protocols/bridge.ts`, `conditioning.ts`, `conditioningPlan.ts` |
| 1RM entry | `src/screens/Maxes.tsx` → `/maxes` |
| Block plan, S-cluster builder, conditioning days | `src/screens/Plan.tsx` → `/plan` |
| Barbell-aware session rendering, plate line | `src/screens/Session.tsx` |
| Barbell strength summary | `src/screens/History.tsx` |
| Full-timeline demo data | `src/dev/seed.ts` |

**Verified at handoff:** 163 unit + 55 e2e green · `npm run typecheck` clean (now covers `test/` and
`e2e/` too) · lint and build clean · the real 23-session backup round-trips through the v2 schema
unchanged · every fix confirmed in a real browser, not only in tests.

### What the audit confirmed as sound — do not re-audit

The transcription is faithful. All 18 cells of the Grey Man grid, all eight conditioning cards
word-for-word, the A/B alternation, the 1RM-not-training-max altitude, and Bridge Week's layout all match
the book. Two stronger results worth knowing:

- **The plate math is proven**, not assumed: nearest-with-ties-down matched an independent brute-force
  knapsack across 13 inventories × 1,041 targets with zero mismatches. `diffDays` is DST-clean over
  3,000 days across both 2026 Europe/London transitions.
- **The v1→v2 migration is safe**, including the case where a **stale PWA build opens a v2 database** —
  tested empirically: Dexie catches the `VersionError`, reopens at the existing version, the old build
  reads its three stores normally and `oneRm` survives. A non-event.
- **The rounding claim holds.** Searched all 160 pages: the book gives no rounding rule anywhere, so our
  declared deviation rests on a verified premise.

---

## What to do next

**`docs/BACKLOG.md` is the list.** In priority order:

1. **A1 — Forced Progression.** The single most important item: *the programme does not progress*.
   Nothing writes `progressedKg`, so block 4 prescribes exactly what block 1 did. Needs a block-boundary
   step, a "struggled with this lift" marker, and the 10% failure drop as an action.
2. **A4 — Green conditioning on lifting days.** The app structurally forbids what p.99 explicitly
   permits, and the Plan screen's day picker lies as a result.
3. **A5 — automatic backups.** Josh's direction: rather than just guarding the demo button, back up
   automatically (e.g. on each app open) so no single destructive action is unrecoverable. Also softens
   A10 and A11. Needs a short design decision first: where snapshots live, how many, how to restore.
4. **A15 — the guided block planner.** Josh's direction: when a block ends, offer a real planner —
   defaults or hand-picked (how many blocks, which template, how long) — while preventing anything that
   is not valid TB Grey Man. **Discuss and design before coding.** Folds in book-04 F6 and F14.
5. **A8, A16** — the Maxes keystroke delete that destroys progression state, and non-Monday plan starts.
6. **A9 — the add-set control**, and **A6** autosave serialisation.
7. **code-03 F4 / F11 / F12** — the journey: onboarding never mentions Grey Man, and `/maxes` and `/plan`
   are reachable only by knowing the URL.
8. **D1 — rewrite the Guide screen**, still Operator/Base Building content.
9. Then more templates: Specificity, or the other three General ones.

---

## Hard-won lessons — read before touching this code

- **Scope by protocol, never by `type === 'lift'`.** This root cause produced *four* separate bugs, one
  of which silently rewrote Beginner's working weights from barbell totals. Grey Man sessions are also
  `type: 'lift'`. Beginner's helpers now filter internally so a call site cannot forget.
- **A stored 1RM carries a unit.** Kilos-per-dumbbell and total-on-the-bar are a factor of two apart.
  Anything that reads a max must check `OneRmEntry.unit`, not just the exercise's loading kind.
- **Under a block plan, `settings.currentPhaseId` and `settings.phaseStartDate` are stale.** Screens must
  read `resolvePosition()` — including `pos.blockStartDate` for any calendar.
- **A protocol's real exercise list is `protocol.exercisesFor(settings)`, not `protocol.clusters`.** The
  S cluster is user-built; reading the static default made custom exercises un-loadable.
- **Hooks must sit above every early return.** Moving `useMaxesFor` below Today's loading guard crashed
  every screen with "Rendered more hooks than during the previous render" — caught only by e2e.
- **`npm run typecheck` now covers `test/` and `e2e/`.** They were previously unchecked, which is how a
  required-argument change compiled cleanly and failed at runtime. Run it, not just `npm run build`.

---

## Known live risks (still open)

- **"Load demo history" and "Reset to clean" are not DEV-gated**; demo history has no confirm at all.
- `POST /api/strava/token` is an **unauthenticated public endpoint**; no origin check, no rate limit, and
  the OAuth flow has no `state` parameter.
- `sessions.date` is **not unique**, and autosave can genuinely create two rows for one date (A6).
- `backups/` is gitignored but holds real personal data. `docs/MASS/` is ignored too — the book PDF, its
  text dump and the 71 page images are **not** committed, only the derived extraction.

---

## Resuming

```bash
git checkout mass-extraction
npm run typecheck && npm run test:unit && npm run test:e2e
npm run deploy:v2              # tb2.joshua-birch.co.uk, ~15s
```

To see Grey Man: Settings → **Load demo history** (26 weeks of Beginner then four Grey Man blocks,
landing mid-block), or Settings → Programme → **Grey Man**, then Settings → **1RM maxes** and
Settings → **Block plan**.

## State of the tree at handoff

- `mass-extraction` is committed and pushed to `origin`. `master` and `strip-tb` are untouched.
- `.claude/launch.json` shows as deleted in the working tree. It predates all of this work and has been
  left alone deliberately.
- `npm install` added `fake-indexeddb` as a devDependency. npm reported pre-existing audit warnings;
  `npm audit fix` was **not** run, since it rewrites the lockfile.
