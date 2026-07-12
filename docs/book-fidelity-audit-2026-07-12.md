# Book-Fidelity Audit — Base Building & Operator vs TB1/TB2 (2026-07-12)

**Sources (the only two used, per Josh):**
- **TB1 (Strength / Operator):** `updated 3rd volume.pdf` (3rd edition, 157pp)
- **TB2 (Conditioning / Base Building + Black):** Calibre `Tactical Barbell II_ Conditioning - K. Black.pdf` (254pp)

**Scope:** verify `src/program.ts` + `src/lib/progression.ts` prescribe Base Building and
Operator **exactly** as written, with **DB-for-barbell** as the only sanctioned deviation.

**Method:** extracted the actual book chapters (pymupdf) and read the template *tables*
(rendered p59 / p71 as images) — not relying on prior notes.

---

## VERDICT: EXACT MATCH.

Base Building and Operator are faithful to the books to the letter. The only differences are
the sanctioned dumbbell/bodyweight substitutions Josh's equipment requires. No fidelity bug
was found. A short list of optional copy enrichments + **one cluster decision** for Josh follow.

---

## Base Building (TB2 "Block 1 — Standard Template", p54–62) — day-for-day match

Book table (p59):

| Day | Wk1 | Wk2 | Wk3 | Wk4 | Wk5 | Wk6 | Wk7 | Wk8 |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 1 | SE 3×20 | SE 3×30 | SE 3×40 | **SE 1×50** | SE 3×50 | Max Strength | Max Strength | Max Strength |
| 2 | E 30M | E 40M | E 50M | E 60M | E 45-60M | HIC#1-10 | HIC#1-10 | HIC#1-10 |
| 3 | E 30M | E 40M | E 50M | E 60M | E 45-60M | Recovery | Recovery | Recovery |
| 4 | SE 2×20 | SE 2×30 | SE 2×40 | **SE 1×50** | SE 2×50 | Max Strength | Max Strength | Max Strength |
| 5 | Recovery | Recovery | Recovery | Recovery | Recovery | HIC#1-10 | HIC#1-10 | HIC#1-10 |
| 6 | E 35-120M | E 45-120M | E 55-120M | E 60-120M | E 45-120M | E 30-60M | E 30-60M | E 30-60M |
| 7 | Rest | Rest | Rest | Rest | Rest | Rest | Rest | Rest |

App (`baseBuildingDay`, `SE_REPS`, `BB_E_WEEKDAY`, `BB_E_LONG`):
- **SE rep ladder 20→30→40→50→50** — matches ✓
- **Circuits: Day-1 = 3, Day-4 = 2, and wk4 = 1 both days** (the book's `SE 1×50`) — matches ✓
- **Weekday E 30/40/50/60/45-60 min** — matches ✓
- **Weeks 6-8 = Max Strength / HIC#1-10 / Recovery / Max Strength / HIC#1-10 / E 30-60 / Rest** — matches ✓
- Rest day-7, Recovery day-5 (wk1-5) — matches ✓

**Sanctioned adaptations (not deviations):**
- SE circuit uses bodyweight + one DB move (push-ups, BW squats, beam inverted rows,
  DB RDL, back-ext, bicycle) — book explicitly allows all-bodyweight SE clusters and 2-8
  balanced moves (TB1 p119-131). SE load is token 20-40%, set once for the block ✓.
- Weeks 6-8 "Strength Intro" is *light, no-max* re-acclimation because Josh has **no tested
  max until Test Day (wk8)**. The book label is "Max Strength" (assumes a training max). For a
  no-barbell/no-prior-max beginner, grooving the 3 lifts light then testing at the seam is the
  correct faithful adaptation. Test Day = TB1's 3-5 rep max protocol (p103-104) ✓.

## Operator (TB1 ch.10, p57–68) — exact

- **Wave 70/80/90/75/85/95** ✓ (p63). Reps 5/5/3/5/3/2 (book wk6 = 1-2, app picks 2) ✓.
- **Sets = 3** (book range 3-5 / 3-4). Book: *"I strongly recommend you stick to the minimums
  for your first block."* App uses the minimum 3 ✓.
- **3×/week, one rest day between strength, no back-to-back** ✓ (p64).
- **Golden Rule rest ≥2 min; 3-5 min on the 90/95% heavy weeks** for minimal hypertrophy ✓ (p47-48).
- **Cluster = 3 main lifts** ("Use no more than 3 main lifts with Operator; a 4th bodyweight is
  acceptable", p68) ✓.
- **Load basis = 90% Training Max** — book-sanctioned (p66 cautious-TM for beginners; the
  strength-first BB template literally uses "a 90% Training Max", p63) ✓.
- **Progression ladder** (p108-109): first block 12wk → retest every 6wk → later rungs. App
  holds 12wk then retests every 6wk, with a per-lift stall safety-net routing back to Claude ✓.
- **Forced progression** = +5lb upper / +10lb lower to the 1RM (p108). App uses +2.5/+5 kg
  (clean metric, rounds to his DB increments; ~sanctioned) ✓.
- **Test Day** = 3-5 rep max → calculate 1RM (p103-104) ✓.

## Black conditioning (TB2 p69-82) — faithful

- App Operator-phase conditioning = **2 HIC + 1 E every week** — the book's explicitly-allowed
  endurance-lean variant (p72: *"you can do 2 HICS + 1 E every week"*) ✓.
- **Easy week every 3rd week (wks 3 & 6)**, cutting rounds, landing on the 90/95% heavy
  strength weeks — exactly as prescribed (p71 pt.4, p81) ✓.
- HIC menu cited (Short Hills #10 / 600m Resets #3 / Fast-5 Tempo #2) are all real,
  aerobic-compatible HIC#1-10 sessions ✓. BB weeks 6-8 correctly restrict to HIC#1-10 ✓.

---

## Optional polish (NOT fidelity errors)

- **P1 — long-day E ceiling.** Book day-6 E is a range up to **120 min** (`E 35-120M` …). App shows
  only the lower bound (35/45/55/60). Copy could note the long Saturday can extend toward
  120 min for the more experienced.
- **P2 — SE between-rounds rest.** App says "~2 min between rounds"; book (scaled Bravo) allows
  up to **3 min** between circuits. Trivial copy tweak → "2-3 min between rounds".
- **P3 — weeks 6-8 label.** Consider a one-line in-app note explaining why 6-8 is light
  "Strength Intro" (no max yet) vs the book's "Max Strength".

## The one real decision → Josh

**Operator pulling lift = 1-Arm DB Row (current) vs Weighted Pull-up progression (book).**
Every book Operator cluster uses a (weighted) **pull-up** as the pull; the book's answer for
someone who can't yet do 10 is "stick to bodyweight pull-ups until you can". The app instead
uses a **1-Arm DB Row** — a clean, loadable, balanced horizontal pull that waves perfectly with
his DBs, but it is a *movement* substitution (vertical→horizontal pull), not a pure
DB-for-barbell swap. This is the single place the program isn't literally a book cluster.
**Recommendation:** keep the DB Row now (Operator needs a loadable lift and Josh can't pull-up
yet), treat the **pull-up progression as the goal**, and swap the cluster's pull to a
Weighted Pull-up at a block boundary once he can do ~10 bodyweight pull-ups. Josh to confirm.
