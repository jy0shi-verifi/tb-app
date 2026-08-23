# HANDOFF

**Last updated:** 2026-08-23 · **Branch:** `mass-extraction` · **Status:** MASS Grey Man built, tested and deployed to `tb2` (v29). All nine build steps done; Josh has reviewed it and is happy.

Read `CLAUDE.md` first for standing project context, then this file for where the work actually stopped,
then **`docs/BACKLOG.md`** — that is the durable list of outstanding work, and nothing tracks it elsewhere.

---

## Where we are

The Tactical Barbell MASS book has been extracted, a design written from it, and **Grey Man built end to
end**. It runs on `tb2.joshua-birch.co.uk`. `master` is untouched and still matches what Josh uses every
morning.

**Josh will not use tb2 for some months.** He is cutting on Beginner Mode and has no barbell or rack yet;
possibly an interim dumbbell hypertrophy block before MASS starts. So there is no deadline pressure on
tb2 — but **Beginner Mode must keep working**, and its 23 sessions of real history must keep rendering.

### Done

| | Where |
|---|---|
| Book extracted, every claim page-referenced | `docs/MASS/MASS-extraction.md` (4,800 lines, 9 sections) |
| Design + decisions + deviations | `docs/mass-design.md` |
| Plate math | `src/lib/barbell.ts` |
| Dexie v2, `oneRm` table, `BACKUP_VERSION` 2 | `src/db.ts`, `test/migration.test.ts` |
| Protocol registry (`PHASES` retired) | `src/protocol.ts`, `src/program.ts` |
| Grey Man | `src/protocols/greyman.ts` |
| Bridge Week | `src/protocols/bridge.ts` |
| Conditioning catalogue + placement | `src/protocols/conditioning.ts`, `conditioningPlan.ts` |
| 1RM entry | `src/screens/Maxes.tsx` → `/maxes` |
| Block plan, S-cluster builder, conditioning days | `src/screens/Plan.tsx` → `/plan` |
| Barbell-aware session rendering | `src/screens/Session.tsx` |
| Barbell strength summary | `src/screens/History.tsx` |
| Full-timeline demo data | `src/dev/seed.ts` |

**Verified at handoff:** 153 unit + 51 e2e green · lint and build clean · the real 23-session backup
round-trips through the v2 schema unchanged · Grey Man verified in a real browser, not just in tests.

### Decisions taken (all recorded in `docs/mass-design.md` §1)

Grey Man first · 3-week blocks, phases are any multiple of 3 · Beginner kept as an unadvertised fallback
· app prescribes Green conditioning · **Base Building skipped** · rounding nearest-with-ties-down ·
microplates optional · 20 kg bar with standard kg plates · Mon/Wed/Fri · 1RMs estimated from a 3RM.

Six **deviations** from the book are labelled as such in the design doc. The book gives no rounding rule
at all, which is the largest of them.

---

## What is NOT built

- **Specificity** (Alpha and Bravo) — extracted in full, not implemented. Alpha is the more complex: two
  MS days and two H days with separate grids, plus a deadlift override (pp.74–75).
- **The other three General templates** — Mass, Gladiator, Fighter HT. All extracted. Each is one file
  under `src/protocols/` plus registration; no screen changes needed.
- **Base Building** — deliberately skipped (Josh's call), a labelled deviation from the book's own
  sequence (p.147).
- **Nutrition / supplements** — extracted (section 08), out of scope.
- **The Guide screen** is still old Tactical Barbell content and needs rewriting.

---

## Next steps

**`docs/BACKLOG.md` is the list.** In short, in the order I would take them:

1. **C1 — log MASS exercises by id, not name.** Gets harder the more sessions exist.
2. **C2 — a Forced Progression UI.** The most visible functional hole: after a block, 1RMs must be
   edited by hand.
3. **D1 — rewrite the Guide screen**, which still describes Operator/Black.
4. **B1 — Strava on tb2** (blocked on Josh, deferred by him).
5. Then more templates: Specificity, or the other three General ones.

An audit pass ran on 2026-08-23 — book-fidelity and code-gap findings are in **`docs/audit/`**. Work
those in before adding features.

## Known live risks (unchanged, still not fixed)

- **"Load demo history" and "Reset to clean" in `Settings.tsx` are not DEV-gated** — the production app
  can wipe real training data from the UI.
- `POST /api/strava/token` is an **unauthenticated public endpoint**; no origin check, no rate limit, and
  the OAuth flow has no `state` parameter.
- `sessions.date` is **not a unique index**, yet nearly all read code assumes one session per date.
- `backups/` is gitignored but holds real personal data. `docs/MASS/` now has an ignore rule too — the
  book PDF, its text dump and the 71 extracted page images are **not** committed, only the extraction.

---

## Resuming

```bash
git checkout mass-extraction
npm run test:unit && npm run test:e2e
npm run deploy:v2              # tb2.joshua-birch.co.uk, ~15s
```

To see Grey Man: Settings → Programme → **Grey Man**, then Settings → **1RM maxes** to enter numbers, and
Settings → **Block plan** to sequence blocks and build the S cluster.

## State of the tree at handoff

- `mass-extraction` is committed and pushed to `origin`. `master` and `strip-tb` are untouched.
- `.claude/launch.json` shows as deleted in the working tree. That predates all of this work and has been
  left alone deliberately.
- `npm install` added `fake-indexeddb` as a devDependency. npm reported pre-existing audit warnings on the
  tree; `npm audit fix` was **not** run, since it rewrites the lockfile.
