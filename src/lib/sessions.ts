/**
 * Two sessions in one day — backlog F1.
 *
 * The app stored exactly ONE session row per date, and nearly every read
 * assumed it. That single assumption produced three separate problems:
 *
 *   1. A Strava run in the morning and a lift in the evening could not both
 *      exist. Saving the lift overwrote the run's `type` and `exercises` while
 *      keeping its `stravaId` and distance, so the run stopped counting as a run
 *      and its distance sat orphaned on a lift row (audit code-01 F7). Under
 *      MASS this is a NORMAL week, not a corner case: Green conditioning *is*
 *      Josh's running, so the book's own "sessions can be conducted on
 *      non-lifting **or lifting** days" (p.99) puts two sessions on one date.
 *   2. Green conditioning sharing a day with a lift had nowhere of its own to be
 *      ticked — `ConditioningAlongside` could only ever be informational.
 *   3. Josh could not shorten a week by pulling a session forward.
 *
 * ## The rule that shapes all of this
 *
 * Josh, 2026-08-24: *"I cannot be allowed to lift twice in one day."*
 *
 * That is the discriminator, and it is why there is no slot index here. A date
 * holds **at most one lift-family row and at most one cardio-family row**, so
 * `(date, family)` identifies a row uniquely. Two lifts in a day is not a state
 * the data can represent, which is a stronger guarantee than a check every call
 * site has to remember — and this codebase has been bitten five times by rules
 * that lived in a call site.
 *
 * It also matches the book: MASS lifting days are Days 1/3/5 with recovery
 * between them (p.50), and nothing in 160 pages sanctions two lifting sessions
 * in a day.
 *
 * ## Why no Dexie migration
 *
 * `sessions.date` was already a NON-unique index and `where('date').equals(…)`
 * already returns every matching row — the one-row-per-date assumption lived in
 * the reads, never in the schema. So this ships as an additive optional field
 * (`SessionLog.pulledFrom`), exactly the way `LoggedExercise.struggled` did:
 * no version bump, no index rebuild, and no chance of a `ConstraintError` while
 * upgrading a database that holds the only copy of real training history.
 * `BACKUP_VERSION` stays 2 and v1/v2 files round-trip untouched.
 *
 * A unique compound index would have enforced the rule in the engine, and was
 * rejected: creating one populates it over existing rows, so a database that an
 * older build already left a duplicate in would fail to open at all. Data loss
 * is the highest-severity failure mode in this project (CLAUDE.md); a repair
 * pass in code that can never fail beats an engine constraint that can.
 *
 * Everything in this file is pure — no Dexie, no dates-from-the-clock — so the
 * repair logic can be tested exhaustively without IndexedDB. `src/db.ts` wraps
 * it with the reads and writes.
 */
import type { SessionLog, SessionType } from '../types'

/**
 * Which kind of work a session row holds.
 *
 * Coarser than `SessionType` on purpose: 'se' is a lift and 'hic' is cardio for
 * the purpose of "what else can share this day", and the two legacy types must
 * keep behaving like the ones that replaced them.
 */
export type SessionFamily = 'lift' | 'cardio' | 'rest'

export function familyOf(type: SessionType): SessionFamily {
  if (type === 'lift' || type === 'se') return 'lift'
  if (type === 'run' || type === 'hic') return 'cardio'
  return 'rest'
}

/** The families that represent real training, in the order a day is read. */
export const TRAINING_FAMILIES: SessionFamily[] = ['lift', 'cardio']

/** A rest row that carries nothing but its own existence — safe to discard. */
function isEmptyRest(r: SessionLog): boolean {
  return (
    familyOf(r.type) === 'rest' &&
    r.stravaId == null &&
    r.exercises.length === 0 &&
    !r.notes &&
    !r.durationMin &&
    !r.distanceKm
  )
}

/**
 * Fold several rows of the SAME family on one date into one.
 *
 * Merges FIELD BY FIELD, not row by row. Picking a single "best" row loses
 * whatever the others held: the duplicate carrying the Strava link is usually
 * the one with no logged sets, so keeping it wholesale would throw the training
 * away, and keeping the other would throw the sync link away (audit A6).
 *
 * Unchanged in behaviour from the version that lived in `db.ts` — it is only
 * scoped to one family now, so a run and a lift on one date are no longer
 * mistaken for duplicates of each other.
 */
export function mergeRows(rows: SessionLog[]): SessionLog {
  if (rows.length === 1) return rows[0]

  const stamps = rows
    .map((r) => r.createdAt)
    .filter((n): n is number => typeof n === 'number' && n > 0)

  const doneSets = (r: SessionLog): number =>
    r.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)

  const byId = [...rows].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  // The row the UI has been editing: the lowest id is the one a `.first()` read
  // surfaced, so that is the one the user can see. Its id is kept so nothing
  // else has to re-point at a new row.
  const base = byId[0]
  const richest = [...byId].sort((a, b) => doneSets(b) - doneSets(a))[0]
  const synced = byId.find((r) => r.stravaId != null)

  return {
    ...base,
    id: base.id,
    exercises: doneSets(richest) > doneSets(base) ? richest.exercises : base.exercises,
    done: byId.some((r) => r.done),
    stravaId: base.stravaId ?? synced?.stravaId,
    title: base.stravaId == null && synced ? (synced.title ?? base.title) : base.title,
    durationMin: base.durationMin ?? synced?.durationMin,
    distanceKm: base.distanceKm ?? synced?.distanceKm,
    avgHr: base.avgHr ?? synced?.avgHr,
    feel: base.feel ?? richest.feel ?? synced?.feel,
    notes: base.notes ?? richest.notes ?? synced?.notes,
    pulledFrom: byId.find((r) => r.pulledFrom)?.pulledFrom,
    createdAt: stamps.length ? Math.min(...stamps) : base.createdAt,
  }
}

/**
 * What one date's rows should collapse to, and which stored rows that makes
 * redundant. Pure: the caller performs the writes.
 *
 * Two repairs happen here, and only these two:
 *
 * - **Duplicates within a family** are merged, as above. Writes are serialised
 *   so new ones are not created, but an older build may have left some behind.
 * - **An empty auto-completed rest row is dropped when real work shares its
 *   date.** `autoCompleteRestDays` skips dates that already hold a row, so this
 *   could not previously happen — but pulling a session forward onto a rest day
 *   can now add real work to a date that was already ticked off as rest, and a
 *   day you trained on is not a rest day. Only a rest row carrying nothing at
 *   all is discarded; one with a Strava link, notes or a duration is kept,
 *   because it holds something a user or a sync put there.
 *
 * Rows of DIFFERENT families are never merged. That is the whole point.
 */
export function repairDate(rows: SessionLog[]): { keep: SessionLog[]; deleteIds: number[] } {
  if (rows.length <= 1) return { keep: rows, deleteIds: [] }

  const byFamily = new Map<SessionFamily, SessionLog[]>()
  for (const r of rows) {
    const f = familyOf(r.type)
    const list = byFamily.get(f)
    if (list) list.push(r)
    else byFamily.set(f, [r])
  }

  const deleteIds: number[] = []
  const keep: SessionLog[] = []
  const hasRealWork = TRAINING_FAMILIES.some((f) => byFamily.has(f))

  for (const family of ['lift', 'cardio', 'rest'] as SessionFamily[]) {
    const list = byFamily.get(family)
    if (!list) continue
    if (family === 'rest' && hasRealWork) {
      for (const r of list) {
        if (isEmptyRest(r)) {
          if (r.id != null) deleteIds.push(r.id)
        } else keep.push(r)
      }
      continue
    }
    const merged = mergeRows(list)
    keep.push(merged)
    for (const r of list) if (r.id != null && r.id !== merged.id) deleteIds.push(r.id)
  }

  return { keep, deleteIds }
}

/** The row holding a given family's session on a date, if there is one. */
export function rowOfFamily(rows: SessionLog[], family: SessionFamily): SessionLog | undefined {
  return rows.find((r) => familyOf(r.type) === family)
}

/**
 * The row that fulfils the session prescribed for `date`, trained on an earlier
 * day — Josh's "shorten my week by doubling everything up".
 *
 * `pulledFrom` records the date the work was BORROWED FROM, so the day it was
 * borrowed from can show as covered rather than nagging as missed. The date is
 * the whole identity: no block/week/day tuple is needed, because a prescribed
 * session belongs to exactly one date.
 *
 * `rows` here is every session, not one date's — the covering row lives on a
 * different date by definition.
 */
export function coverFor(rows: SessionLog[], date: string): SessionLog | undefined {
  return rows.find((r) => r.pulledFrom === date)
}

/** Every date whose session was trained early. */
export function pulledForwardDates(rows: SessionLog[]): Set<string> {
  const out = new Set<string>()
  for (const r of rows) if (r.pulledFrom) out.add(r.pulledFrom)
  return out
}

/**
 * Why a session may not be pulled forward onto a date, or `null` if it may.
 *
 * The first rule is Josh's, and it is the reason this whole design has no slot
 * index: *"I cannot be allowed to lift twice in one day."* His own examples are
 * both cross-family — a run in the morning and tomorrow's lift at night, or a
 * lift in the morning and tomorrow's run at night — so refusing a same-family
 * pull costs nothing he wants and forbids the thing he ruled out.
 */
export function pullForwardBlocker(
  rowsOnTarget: SessionLog[],
  family: SessionFamily,
): string | null {
  if (family === 'rest') return 'There is nothing to bring forward from a rest day.'
  const clash = rowOfFamily(rowsOnTarget, family)
  if (clash)
    return family === 'lift'
      ? 'You have already got a lifting session on this day — you can’t lift twice in one day.'
      : 'You have already got a conditioning session on this day.'
  return null
}
