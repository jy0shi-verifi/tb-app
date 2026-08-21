# HANDOFF

**Last updated:** 2026-08-21 · **Branch:** `strip-tb` · **Status:** Tactical Barbell strip complete, tested, deployed. Ready to start the MASS rebuild.

Read `CLAUDE.md` first for standing project context, then this file for where the work actually stopped.

---

## Where we are

The app is a single-user training PWA Josh uses every morning. It was built around Tactical Barbell Operator/Black, then switched to a beginner dumbbell programme. The TB code was **never verified against the books**, so it has been removed and will be rebuilt from source.

**Done:**

1. **Codebase mapped** — `docs/codebase-map.md`. Five parallel agents covering data model, programme logic, UI, Strava/infra, and tests/docs, plus live verification against the deployed app with Josh's real backup. Still accurate for everything except the TB-specific sections (flagged inline at the top of that file).
2. **Tactical Barbell stripped** — see the Status section of `CLAUDE.md` for exactly what was removed vs. deliberately kept. 50 files, ~914 insertions / ~2,148 deletions.
3. **Second deploy target stood up** — `tb2.joshua-birch.co.uk` (Cloudflare Pages project `tb-app-v2`), fully separate from the live app. `npm run deploy:v2`.

**Verified at handoff:** 39 e2e + 24 unit tests green · `npm run build` clean · Josh's real 23-session backup imports into the stripped build and renders identically to production (same streak, week, weights, coins, +46 kg/DB).

---

## Next task: put the MASS book into the app

Josh's intent, in his words: *"we literally put the MASS book into our app, the book is the single source of truth, everything needs to be exactly by the book and its recommendations."*

**The plan he set out:**

1. He provides the MASS book as a PDF (**not yet in the repo** — this is the first blocker).
2. Subagents read it, understand the templates, and write findings to a Markdown file he can read through.
3. That becomes the spec for the rebuild.

**This is the right shape.** The step that made the last implementation untrustworthy was going straight from "roughly remember the programme" to code. An extraction document he can actually check, before any code exists, is the fix.

### How fidelity must be enforced

A prose summary is not enough on its own — the previous implementation *also* looked plausible. Two mechanisms make "by the book" real, and both are cheap:

- **Every claim in the extraction doc carries a page reference.** No page number, no claim.
- **The printed tables become test fixtures.** `test/calc.test.ts` is the model to copy: it asserts the estimated-1RM formula against K. Black's own printed worked examples *and* explicitly asserts the result is not the wrong formula. That test is why the Brzycki bug got caught. Do the same for every MASS percentage table and set/rep scheme — assert the app reproduces the book's printed numbers cell for cell.

`docs/book-fidelity-audit-2026-07-12.md` is the standard for what a real audit looks like (it read the rendered template tables rather than working from notes, and cited chapter and page throughout).

### Open questions to resolve before designing

1. **Barbell or dumbbells?** This is the big one. The MASS protocols are barbell programmes, but the app has only ever done dumbbell math — `perDumbbell: true` on every loaded set, a 4–60 kg per-dumbbell clamp, 1/2 kg increments, and **no plate math anywhere in the codebase**. If Josh is running MASS with a barbell, plate rounding has to be built from scratch and the load-display model changes. Ask before designing.
2. **Which template(s)?** Extract all of them so he can choose, but the one he'll actually run determines what gets built first.
3. **Where does Beginner mode go?** Kept as-is, retired once MASS starts, or selectable? Affects whether the protocol switch comes back as a first-class concept.

### Design traps to avoid (learned from the old implementation)

`docs/codebase-map.md` §8 lists these with file references. The short version — the old code made these mistakes, so don't repeat them:

- `WaveWeek` allowed **one prescription per week**, hardcoding the assumption that every lifting day is identical. Multi-cluster templates cannot be expressed in that shape. Put per-day prescriptions in `PhaseMeta`.
- `OPERATOR_LIFTS` was imported directly by five screens, so the max-entry form was structurally locked to exactly three lifts. Screens should read `PHASES[phaseId].lifts`.
- Block completion **hardcoded weeks 3 and 6** as the heavy weeks.
- Rest time was chosen by **string-sniffing the session title** (`plan.title.startsWith('Operator')`).
- `MaxEntry` has **no protocol scope**, so a rebuilt protocol reusing an old `liftId` would inherit stale progression state.
- Exercises are keyed by **display name**, and Josh's logged history still contains old TB exercise names that collide with the beginner lifts. Scope lookups by phase, not just `type === 'lift'`.

### Practical notes for the PDF work

- Check first whether the PDF has a text layer or is scanned images — that changes how the reading agents need to work, and how many turns it takes.
- `Read` handles PDFs via the `pages` parameter, **max 20 pages per request**, and the parameter is required for PDFs over 10 pages. A full book needs chunked reads across several agents.
- Keep the extraction to programme structure — templates, percentages, set/rep schemes, progression and deload rules, and the book's own caveats. It is Josh's own copy for his own app; don't reproduce the book wholesale, and don't publish the extraction anywhere public.

---

## Resuming

```bash
git checkout strip-tb          # the current line of work
npm run test:unit && npm run test:e2e
npm run deploy:v2              # push to tb2.joshua-birch.co.uk (~15s)
```

Start MASS work on a **fresh branch off `strip-tb`** — don't mix the rebuild into the strip commit.

## State of the tree at handoff

- `strip-tb` is committed and pushed to `origin`. `master` is untouched and still matches what Josh's phone runs.
- `.claude/launch.json` shows as deleted in the working tree. That predates this work and was left alone deliberately — it is not part of any commit here.
- `backups/` and `.playwright-mcp/` are gitignored. `backups/tb-backup-2026-08-19 (2).json` is real personal data and the regression fixture for any migration work — keep it, don't commit it.
