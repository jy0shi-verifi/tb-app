# UX / flow pass — prompt for the next agent

Paste the block below into a **new** Cursor chat on branch `mass-extraction`. The rest of this file
is the same text, kept here so it cannot vanish with the tab.

---

You are working on **tb-app**, branch **`mass-extraction`**, live preview **tb2.joshua-birch.co.uk** (v45). Sole user: **Josh**. Phone-first PWA. Offline-first. No auth.

Read first, in order: `CLAUDE.md`, `HANDOFF.md`, `docs/BACKLOG.md` (section **NEXT**), `docs/mass-design.md` **§14.5**, this file. Book claims need page numbers from `docs/MASS/`. The book wins over taste. Do not invent coaching, rounding rules, or templates.

## The job

The lifting **engine is in**: Beginner, Grey Man, Bridge, Specificity Alpha, Bravo, Forced Progression, two sessions a day, Green/Black conditioning. Josh has not fully QA'd Spec and does not need to before this.

The **product is not**. Today you have to already know Tactical Barbell MASS (blocks vs cycles, S/MS/H clusters, Bridge vs rest, A/B, % of 1RM, Green vs Black). Josh has not read the books in a way that lets him operate the app. The next work is **UI, UX, and flow** so someone who has never read MASS can:

1. Set up once (programme, 1RMs, clusters, a plan).
2. Lay out a **long plan** (a year if he wants) in a few taps — Grey Man looping, a Bridge about every 2–3 months (p.93), Specificity inserted as the scalpel (Alpha or Bravo, he chooses; never auto-pick, p.69).
3. Then the app **takes over**: each morning it says what to do and computes every weight. Forced Progression at block seams. `/next-cycle` when the plan runs out.

**Bar:** intuitive, flexible, automatic after setup, **exactly** what the book prints. Options the book hands over stay choices (`planRules` two-tier: BLOCKED vs WARNED). Do not “improve” prescriptions.

**Out of scope for this pass (do not start):** Mass Template, Gladiator, Fighter HT (E2); Operator / TB1 (E7); named sample H clusters (Camp Drvar, Keeny-Meeny, Bulgarian / TM90); H2-on-Saturday; extra DL sets; intensity-tactics UI; food logging / MacroFactor (E4 — later read-only stats only). Base Building stays skipped (p.18, p.151).

**Do not** `npm run deploy` (production). After app changes: `npm run deploy:v2`. Do not touch `master`. Data loss is the highest-severity failure (`src/db.ts`, backups, Dexie). Beginner Mode must keep working.

## How to run this chat

**Phase 1 — diagnose, do not restyle yet.** Launch several **read-only** specialist passes (Task/subagents or sequential reviews). Each returns a ranked list with: screen/route, what’s confusing, proposed change, book page **or** explicit “UX only / no book claim”, severity (blocks first-run / daily / year-plan). Specialists:

1. **First-run without the book** — onboarding → maxes → first Today. Pretend MASS vocabulary is unknown. Where does the app dump jargon (S cluster, Bridge, 75%RM) with no plain sentence?
2. **Daily loop** — Today, Session (main vs S / MS vs H — book-01 F5, p.50), Program week, pull-forward, Green alongside a lift.
3. **Year planner** — `/plan` and `/next-cycle`. Can he see 12 months? Add GM×N + bridges + one Spec without knowing “block” vs “cycle”? E6 belongs here (indefinite-bulk preset first; also cited p.140 and 2:1 p.142). book-04 F13 Consolidation (p.147) as a walk, not Guide-only prose. book-04 F2 numbering vs the author’s count.
4. **Visual / a11y / phone** — existing identity (Oswald/Inter, brand, dark mode). **Do not reinvent the brand** or chase generic “AI SaaS” looks. Fix: tap targets, DEFAULT_SETTINGS flash (code-03 F23), nav accessible names (F25), truncation (F27), History still looking like Beginner on Grey Man (F20–F21), header pill (F22). `EXERCISE_INFO` has no barbell lifts — form copy must be sourced, not invented.
5. **Optional hour-one correctness** (do these if they are small; they bite a year-long plan): parseBackup row shape (code-01 F9); delete-all-blocks stale `phaseStartDate` (code-02 F12); confirm delete block (code-03 F19).

**Phase 2 — one synthesis.** Merge lists. Kill duplicates and taste-only conflicts. Rank: first-run blockers → daily morning → year plan → polish. Get Josh’s OK on the ranked list if anything would change book-facing behaviour (e.g. auto-building a year, hiding Alpha/Bravo behind a recommendation).

**Phase 3 — one implementer.** One visual language, one information architecture. Verify in the browser (phone viewport) and with `npm run typecheck`, unit tests, relevant e2e. Bump `APP_VERSION` by hand. Deploy v2. Update `HANDOFF.md` + `docs/BACKLOG.md`.

## Product facts the UX must not break

- Dates are local `YYYY-MM-DD`; plan start **snaps to Monday** or the week **rotates**.
- Under a plan, `currentPhaseId` / `phaseStartDate` are stale — use `resolvePosition()`.
- Exercises: `protocol.exercisesFor(settings)`, not static clusters. MASS 1RMs are `maxScope: 'mass'` (never mix with Beginner per-dumbbell).
- One lift-family row and one cardio-family row per date. Never two lifts.
- Alpha: same lift on MS and H is **wanted**. Bravo: same compound on consecutive H days **warn**, don’t hard-block.
- Deadlift override is conventional `id === 'deadlift'` only.
- Green may share a lift day; Black must not.

## Copy rule

Explain in **plain English first**, book name second. Example: “This week is hypertrophy, lighter and more reps (Specificity Bravo)” not just “Bravo — H1”. Do not teach Operator, Base Building, or a training max except where Bulgarian would need it (not this pass).

## Done when

A new install (or Load demo history) can: pick MASS, enter maxes, understand Today without a briefing, see the week, follow a session with main vs accessories visually split, and build or apply a **multi-month plan** that the app then runs — including a Bridge when the book wants one and Spec when he asks. Josh can demo it on his phone at v2.

---
