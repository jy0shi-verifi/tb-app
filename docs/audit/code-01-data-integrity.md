# Audit 01 — data integrity and data loss

**Scope:** `src/db.ts`, `src/types.ts`, `src/lib/backup.ts`, `src/dev/seed.ts`, `src/screens/Session.tsx`,
`src/screens/Maxes.tsx`, `src/lib/stravaSync.ts`, `src/lib/strava.ts`, `src/lib/stats.ts`,
`src/lib/autocomplete.ts`, `src/screens/Today.tsx`, `src/screens/History.tsx`, `src/main.tsx`,
`test/migration.test.ts`, `test/backup.test.ts`.
**Date:** 2026-08-23 · **Branch:** `mass-extraction` (HEAD `e39c9ab`)

## Verdict

The parts that were *designed* for data safety are genuinely good: the v1→v2 Dexie migration is as small
and safe as a migration can be, and I verified empirically that it survives both interruption and the
stale-PWA-cache scenario without losing a row; `importBackup` writes inside a single atomic transaction
across all four tables; `exportBackup` covers every table and provably never emits Strava tokens; and the
phase-id coercion is correctly conditional. The risk is not in the migration — it is in the **everyday
write paths**, which were built one screen at a time and never given a shared discipline. The worst item
is not a subtle race at all: **"Load demo history" wipes every logged session with no confirmation dialog**,
one tap away on the same screen Josh visits to export his backup. Behind that sit an unserialised autosave
that can mint duplicate rows for a single date (the exact failure the non-unique `sessions.date` index
makes unrecoverable through the UI), a backup nudge that disarms itself even when the download never
happened, and keystroke-driven `oneRm` writes that delete the row — and its accumulated Forced Progression
— the moment the field is cleared for retyping.

| # | Severity | Title | Where |
|---|----------|-------|-------|
| F1 | critical | "Load demo history" wipes all real history with no confirmation | `src/screens/Settings.tsx:310` |
| F2 | major | Session autosave is unserialised — two rows for one date, one unreachable | `src/screens/Session.tsx:357` |
| F3 | major | `downloadBackup` records a backup that may never have been written | `src/lib/backup.ts:5` |
| F4 | major | Clearing a 1RM field deletes the row, destroying `progressedKg`/`testedAt` | `src/screens/Maxes.tsx:108,116` |
| F5 | major | `importBackup` rollback has no durable copy — if it fails, everything is gone | `src/db.ts:203` |
| F6 | medium | The "never delete a Strava-linked row" invariant holds in only one of three delete paths | `src/screens/Session.tsx:860`, `src/screens/History.tsx:27` |
| F7 | medium | Autosave converts a Strava-synced run row into a lift row | `src/screens/Session.tsx:376` |
| F8 | medium | `saveSettings` is an untransacted read-modify-write that merges only at the top level | `src/db.ts:89` |
| F9 | minor | `parseBackup` validates table *shape* but never row shape | `src/db.ts:125` |
| F10 | minor | Duplicate dates double-count in stats but dedupe in streaks — inconsistent | `src/lib/stats.ts:39,52` |
| F11 | nit | `parseBackup` skips the version gate when `version` is not a number | `src/db.ts:133` |

---

## What I checked and found sound

These were examined specifically and I am satisfied with them. Do not "fix" them.

- **The v1→v2 Dexie migration (`src/db.ts:14-31`).** It adds one store and lists nothing else, relying on
  Dexie's delta semantics — correct, and the comment explaining why is right. There is no `.upgrade()`
  callback, so the versionchange transaction only creates an object store. **An interrupted upgrade is
  safe**: IndexedDB runs the whole upgrade inside a single versionchange transaction, so a tab kill or
  crash mid-upgrade rolls the store creation back and leaves a clean v1 database that will simply upgrade
  again next open. No user data is read, rewritten or reindexed at any point.
- **A stale build opening a migrated database — verified empirically** with `fake-indexeddb` and the real
  Dexie in `node_modules`. Result: **no data loss, and no failure to open.** Dexie's open path catches the
  `VersionError` that `indexedDB.open(name, 10)` raises against a native-version-20 database and retries
  with no version argument (`node_modules/dexie/dist/dexie.js:4599-4603`), which opens the existing
  database as-is. The stale build then sees only the three stores it declares, `verifyInstalledSchema`
  passes (it checks that declared stores are present, not that no extras exist), and it reads and writes
  `sessions`/`settings`/`maxes` normally. I confirmed the `oneRm` store and its rows are still intact when
  the v2 build comes back, and that a session written by the stale build is visible to both. This is Dexie
  library behaviour, not a `fake-indexeddb` artefact. **The stale-PWA-cache scenario is a non-event.**
  Helped by `registerType: 'prompt'` in `vite.config.ts:43`, which stops a new build hot-swapping chunks
  mid-session.
- **`exportBackup` (`src/db.ts:147`) captures every table** — `settings`, `maxes`, `sessions`, `oneRm` are
  all four tables the schema declares. Nothing is silently dropped on a round-trip. The only persisted
  state outside the backup is a handful of localStorage UI flags (`tb-testday-celebrated`, `tb-seen-coins`,
  `tb-dismiss-missed`, `tb-rest-end`, `tb-no-splash`) — none of which is training data.
- **Strava tokens never reach a backup file.** `exportBackup` maps `strava: undefined` over each settings
  row and `JSON.stringify` drops undefined keys; `test/migration.test.ts:98` asserts the serialised string
  does not contain the token. `importBackup` correctly re-injects the *on-device* connection rather than
  the file's (`src/db.ts:172,193`), and does the same on the rollback path (`:213`). Correct on both legs.
- **`importBackup`'s write is genuinely atomic.** The clear-then-bulkPut runs inside one Dexie `rw`
  transaction naming **all four** tables (`src/db.ts:177`), so a mid-write failure aborts the whole thing —
  the rollback path is a second line of defence, not the primary one. `parseBackup` is called *before*
  anything is touched. This is the right shape.
- **Phase-id coercion is conditional, in both `ensureSeeded` and `importBackup`.** The earlier
  unconditional pin to `'beginner'` would have undone a Grey Man switch on every app open and every import;
  `PROTOCOLS[id] ? id : DEFAULT_PHASE_ID` is right, and `test/migration.test.ts:181-227` covers all four
  quadrants.
- **`oneRm`'s `[protocolId+exerciseId]` compound key** does what §3.4 of the design claims: the
  `db_bench` collision test (`test/migration.test.ts:153`) proves Beginner's per-dumbbell max and Grey
  Man's cannot alias. This is the correct answer to CLAUDE.md's "exercises are keyed by display-name
  string" hazard — for maxes at least; logged sessions still key by name, which is backlog C1.
- **The Session autosave *does* re-read the freshest row before writing** (`src/screens/Session.tsx:363`)
  and preserves `stravaId`/`durationMin`/`distanceKm`/`avgHr`/`title` from it. That documented behaviour
  still holds. (What no longer holds is the delete guard — see F6 — and the re-read has its own race, F2.)
- **`SetRow` is still hoisted to module scope** with its explanatory comment intact.
- **v1 backup files still load.** `parseBackup` fills a missing `oneRm` with `[]` and reinterprets nothing
  else; `test/backup.test.ts:30-53` asserts that settings keys the app no longer reads (`loadBasis`,
  `programMode`) survive verbatim. The migration contract with the live app is intact in the direction
  that matters.
- **`clearAll` (`src/dev/seed.ts:291`) is behind a confirm.** It is `seedFakeData` that is not — see F1.

---

## Findings

### F1. "Load demo history" wipes all real training history with no confirmation
- **Severity:** critical
- **Where:** `src/screens/Settings.tsx:310-318` → `src/dev/seed.ts:268-283`
- **Failure scenario:** The Settings screen is where Josh goes to tap "Export backup". Directly below it
  sits a two-button row; the left button, **"Load demo history"**, has **no `window.confirm`, no DEV gate,
  and no undo**. One mis-tap (or a thumb landing 40 px low on a phone) runs `seedFakeData()`, whose
  transaction does `db.sessions.clear()`, `db.maxes.clear()`, `db.oneRm.clear()` and then
  `db.settings.put(baseSettings({...}))` — which also replaces `beginner.lifts`, `plan`, `bodyweightKg`
  and `bar`, and sets `lastBackupAt: now` so the "back up your data" nudge stays silent afterwards.
  Every logged session is gone, irrecoverably, unless a JSON export exists off-device. The neighbouring
  "Reset to clean" button — the *less* destructive of the two, since it at least does not fabricate
  replacement data — is the one that got the confirm dialog.
  This is worse than BACKLOG **C3** records: C3 treats the two buttons as equivalent, and the seed button
  being confirmation-free is the actual hazard.
- **Rectify:** Wrap the whole "Demo data" `<Card>` in `import.meta.env.DEV`. `window.tbSeed` /
  `window.tbClear` are already exposed on `window` in DEV (`src/main.tsx:22-28`), so nothing is lost in
  development. If the buttons must ship, at minimum give the seed button the same confirm as the reset one
  *and* make both trigger an automatic `exportBackup()` download first.

### F2. Session autosave is unserialised — it can create two rows for one date, and the second becomes unreachable
- **Severity:** major
- **Where:** `src/screens/Session.tsx:357-396` (effect on `[ex, meta]`), with `src/db.ts:17`
  (`sessions: '++id, date, phaseId'` — `date` is not unique)
- **Failure scenario:** The autosave effect calls `save()` without awaiting it and without any in-flight
  guard or debounce. `save()` does `await db.sessions.where('date').equals(iso).first()` and then
  `db.sessions.put(rec)`, where `rec` omits `id` if nothing was found. On the **first** interaction of a
  session there is no row yet. Tap "done" on set 1 and set 2 in quick succession (or type two digits into
  a reps field): React commits twice, the effect runs twice, and both invocations complete their `await`
  on the read before either `put` lands. Both see `existing === undefined`, both `put` without an `id`,
  and IndexedDB auto-increments — **two rows for the same date**.
  The consequences are what make this major rather than cosmetic:
  - `useLiveQuery(... .where('date').equals(iso).first())` (`:234`) resolves the **lowest id**, so the
    screen edits row A forever and row B is invisible and **cannot be deleted from the UI** — the "Delete
    this log" button only ever passes `logged.id`.
  - `syncStrava` builds `new Map(sessions.map(s => [s.date, s]))` (`src/lib/stravaSync.ts:60`), which keeps
    the **last** row for a date. So Strava enrichment lands on row B while the user edits row A: HR and
    duration appear to vanish, and the write-back describes the wrong set data.
  - `sessionsThisWeek` and `runStats` count rows, so the week counter and total km double (see F10).
  The same pattern exists in `Today.tsx:171` (`markDone`), reachable by a fast double-tap.
- **Rectify:** Two changes, both cheap. (a) Serialise the autosave: keep a `useRef` promise chain (or a
  150 ms debounce plus an in-flight flag) so only one `save()` is ever outstanding. (b) Do the read and the
  write inside one `db.transaction('rw', db.sessions, …)` so read-then-put is atomic. Longer term, making
  `date` the primary key — or adding a `&date` unique index with a one-off dedupe migration — is what
  actually closes BACKLOG **C4**; every read path already assumes it.

### F3. `downloadBackup` records a successful backup that may never have been written
- **Severity:** major
- **Where:** `src/lib/backup.ts:5-15`
- **Failure scenario:** `downloadBackup` creates a blob URL, calls `a.click()`, **synchronously revokes
  the URL on the very next line**, and then unconditionally writes `lastBackupAt: Date.now()`. Two
  problems compound:
  1. `URL.revokeObjectURL(url)` immediately after `a.click()` is a known-fragile pattern — the anchor is
     never attached to the document, and on iOS Safari / standalone PWAs the download can be cancelled or
     silently no-op'd. That is Josh's platform.
  2. Whether or not a file was produced, `lastBackupAt` is set. `shouldNudgeBackup` (`:25-32`) then
     suppresses the "back up your data" prompt for **14 days or 12 sessions**.
  Net effect: the only off-device copy silently fails to exist, and the mechanism designed to catch that
  turns itself off. Since IndexedDB is the sole store and Safari can evict best-effort storage after ~7
  days idle, this is the path by which everything is lost with no warning at all.
- **Rectify:** Append the anchor to `document.body` before clicking, and revoke the URL from a
  `setTimeout(..., 60_000)` (or on the next `visibilitychange`) rather than synchronously. Do not set
  `lastBackupAt` blind — either gate it on the user confirming the file saved, or record the byte length
  and session count and surface "last backup: N sessions, D days ago" in Settings, so a stale value is
  visible rather than silent.

### F4. Clearing a 1RM field deletes the stored row, destroying accumulated Forced Progression
- **Severity:** major
- **Where:** `src/screens/Maxes.tsx:88-133` — specifically `:108` and `:116`
- **Failure scenario:** `write()` fires on **every keystroke**. If the parsed weight is not `> 0` it calls
  `db.oneRm.delete([protocol.maxScope, ex.id])`. To change a squat 1RM from 100 to 105, the natural
  gesture is to clear the field and retype: the moment it is empty, the row — including `progressedKg`
  (the *only* record of every Forced Progression bump applied since the last test) and the original
  `testedAt` — is deleted. Retyping writes a fresh row with `progressedKg: 0` and `testedAt: today`. The
  "tested 100, now 105" history that `OneRmEntry.progressedKg` exists to carry (`src/types.ts:64-68`) is
  gone, and History's forced-progression display resets to zero.
  Two smaller effects ride along: typing "105" transiently persists `kg: 1` then `kg: 10` — so any screen
  reading `oneRm` mid-keystroke prescribes a 1 kg bar — and a leading `0` (as in `0.5`) triggers the same
  delete.
- **Rectify:** Do not delete on an empty field; treat empty as "no change" and put deletion behind an
  explicit "clear this max" control. Debounce the write (~400 ms) or move it to `onBlur`. And on an update,
  carry the existing row's `progressedKg`/`testedAt` forward unless the user has explicitly said this is a
  fresh test — the "a fresh test supersedes accumulated Forced Progression" rule at `:130` is right, but it
  should fire on a deliberate retest, not on every character typed.

### F5. `importBackup`'s rollback holds the only copy of the old data in a local variable
- **Severity:** major
- **Where:** `src/db.ts:174` (snapshot) and `:203-219` (rollback)
- **Failure scenario:** The snapshot is `const snapshot = await exportBackup()` — a string in memory. The
  import transaction then clears all four tables. If the import fails, the rollback runs a *second*
  transaction that clears again and bulk-puts the snapshot back. If **that** transaction fails —
  `QuotaExceededError` (plausible: the import that just failed may well have failed for quota), the tab
  being closed or backgrounded-and-killed by iOS mid-restore, the database being blocked by another tab, or
  the browser being force-quit in the window between the two transactions — the snapshot string dies with
  the page and **every session is gone, with no file on disk anywhere**. The rollback's own throw is also
  unhandled: it propagates instead of the wrapped "kept your existing data" message, so the user is told
  nothing useful about what state they are now in.
- **Rectify:** Persist the snapshot before touching anything — write it to `localStorage` under a recovery
  key (and/or trigger a `downloadBackup()`-style save) and only clear it once the import commits. Wrap the
  rollback in its own try/catch that, on failure, leaves the recovery key in place and tells the user
  exactly how to recover. Cheapest version: `localStorage.setItem('tb-preimport-snapshot', snapshot)` at
  `:174`, removed at the end of the happy path, plus a "Recover pre-import data" button in Settings that
  appears whenever the key exists.

### F6. The "never delete a Strava-linked row" invariant holds in only one of three delete paths
- **Severity:** medium
- **Where:** guard present at `src/screens/Today.tsx:151`; **absent** at `src/screens/Session.tsx:857-861`
  and `src/screens/History.tsx:25-28` → `src/db.ts:94` (`deleteSession` has no guard)
- **Failure scenario:** CLAUDE.md states as a preserved invariant that session writes "refuse to delete a
  Strava-linked row — they un-tick `done` instead". Only `Today.markDone` implements it. The Session
  screen's "Delete this log" and History's delete both call an unconditional `db.sessions.delete(id)`.
  Two concrete outcomes:
  - Delete a Strava-synced **run** from History. On the next app open, `syncStrava` fetches activities from
    `phaseStartDate - 1 day` (`src/lib/stravaSync.ts:57`), finds no row for that date, and **re-creates
    it**. The deletion silently does not stick — and each cycle rewrites `createdAt`.
  - Delete a **lift** that Strava had enriched. The logged sets are gone permanently; the next sync sees a
    `WeightTraining` activity with no matching local row and skips it (`:76`), so nothing comes back.
  The inconsistency is the real problem: a documented invariant that two-thirds of the code ignores is not
  protecting anything.
- **Rectify:** Move the guard into `deleteSession` in `src/db.ts` so every caller inherits it: read the
  row, and if `stravaId != null` do `db.sessions.update(id, { done: false, exercises: [] })` instead of
  deleting. Then have `Session.tsx:860` call `deleteSession` rather than `db.sessions.delete` directly.
  One function, all three paths fixed.

### F7. Autosaving on a date that already has a Strava run silently converts the run row into a lift row
- **Severity:** medium
- **Where:** `src/screens/Session.tsx:370-393`
- **Failure scenario:** `syncStrava` auto-logs any Strava run onto its date, whatever the plan says
  (`src/lib/stravaSync.ts:118-134`) — deliberate, because Runna owns running. Josh then runs in the morning
  and lifts in the evening on the same day. He opens the Session screen for today and touches one field.
  The autosave re-reads the existing row (the run), keeps its `id`, `stravaId`, `distanceKm`, `avgHr` and
  `title`, but overwrites `type` with `plan.type` (`'lift'`) and `exercises` with the lift's sets. The run
  is no longer a run: `runStats` stops counting it (it filters on `type === 'run' | 'hic'`), so its
  distance and duration disappear from the running totals while `distanceKm` sits orphaned on a lift row.
  The title still reads like the Runna activity, so the History entry is visibly wrong. Nothing warns.
  The reverse guard exists — `stravaSync` refuses to write a run over a logged lift (`:111`) — but not this
  direction.
- **Rectify:** Same root cause as F2: one row per date cannot represent a run *and* a lift. Short term,
  refuse to overwrite `type` when `existing.stravaId != null && existing.type !== plan.type`, and surface
  "there's already a Strava run logged today". Properly, allow multiple sessions per date with an explicit
  key and stop using `date` as a de facto primary key.

### F8. `saveSettings` is an untransacted read-modify-write that merges only at the top level
- **Severity:** medium
- **Where:** `src/db.ts:89-92`
- **Failure scenario:** Two problems in three lines.
  1. **Lost update.** `get` and `put` are separate transactions with an `await` between them. Several
     callers run concurrently on app open: `App.runSync` writes `stravaSyncError`/`stravaNeedsReconnect`
     (`src/App.tsx:27-33`), `syncStrava` writes `lastStravaSyncAt` (`src/lib/stravaSync.ts:139`),
     `storeTokens` writes refreshed OAuth tokens (`src/lib/strava.ts:53`), and `ensureSeeded` may put a
     coerced row (`src/db.ts:69`) — note that `main.tsx` starts rendering without awaiting `ensureSeeded`.
     The window is short (one IndexedDB round trip), but the payload matters: if a `lastStravaSyncAt` write
     interleaves with `storeTokens`, the freshly rotated `refreshToken` is overwritten with the spent one.
     Strava rotates refresh tokens, so the next refresh 401s and the connection has to be re-established
     by hand.
  2. **Nested subtrees are replaced wholesale, from possibly-stale render state.** `Session.finish()`
     writes `beginner: { lifts: next }` where `next` was computed from the `useLiveQuery` snapshot
     (`src/screens/Session.tsx:509`), and the weight-adjust control at `:435` spreads
     `settings.beginner?.lifts` from the same snapshot. `Settings.tsx` does the same for `mass`, `plan` and
     `bar`. A change to one key of a nested object made between render and write is silently discarded.
     This is the same class of bug that produced the cross-protocol corruption fixed in `e39c9ab`.
- **Rectify:** Put the read and write inside `db.transaction('rw', db.settings, …)`. For nested objects,
  either patch inside that transaction from the freshly-read row rather than from render state, or give
  the nested subtrees their own narrow helpers (`setBeginnerLift(id, kg)`) that do the merge against the
  stored row.

### F9. `parseBackup` validates table shape but never row shape
- **Severity:** minor
- **Where:** `src/db.ts:125-145`
- **Failure scenario:** The checks are: `app === 'tb-app'`, version not newer, the three core keys are
  arrays, one settings row has `id: 'app'`, and `oneRm` is an array if present. Nothing validates the rows.
  `{"app":"tb-app","version":2,"exportedAt":"…","settings":[{"id":"app"}],"maxes":[],"sessions":[{},{}],"oneRm":[]}`
  passes, and `importBackup` happily bulk-puts two sessions with no `date`, no `type` and no `exercises`.
  Those rows then crash every screen that does `s.exercises.map(...)` or `parseISO(s.date)` — after the
  transaction has already cleared the real data. The rollback does not fire, because nothing threw.
  Realistic trigger: a hand-edited file, a partially-synced OneDrive copy, or a truncated-then-repaired
  JSON. Note also that `Settings.tsx:45` calls `b.exportedAt.slice(0, 10)` on a field `parseBackup` never
  checks exists, throwing a `TypeError` surfaced as a confusing "Import failed" message.
- **Rectify:** Add a cheap per-row guard in `parseBackup`: every session needs a string `date` matching
  `/^\d{4}-\d{2}-\d{2}$/`, a `type` in the `SessionType` union, and an array `exercises`; every `oneRm` row
  needs `protocolId`, `exerciseId` and a finite `kg`. Reject with a count ("3 of 47 sessions are
  malformed") rather than importing. Also require `exportedAt` to be a string.

### F10. Duplicate dates dedupe in the streak functions but double-count everywhere else
- **Severity:** minor
- **Where:** `src/lib/stats.ts:12,27` (dedupe) vs `:39,52` (do not)
- **Failure scenario:** `computeStreak` and `longestStreak` both build `[...new Set(...map(s => s.date))]`,
  so they are immune to duplicate rows. `sessionsThisWeek` (`:39`) and `runStats` (`:52`) filter rows
  directly, so with a duplicate date (F2) the week counter reads 5 sessions where 4 happened, and total km
  doubles. Because half the module defends against duplicates and half does not, the symptom is a
  *partially* wrong dashboard, which reads as a rendering glitch rather than a data problem — so nobody
  investigates the duplicate row that caused it. This is the concrete answer to BACKLOG **C4**'s "nearly
  all read code assumes one session per date": the specific breakages are `stats.ts:39`, `stats.ts:52`,
  `hooks.ts:43`, `Session.tsx:234`, `Session.tsx:363`, and the last-wins map in `stravaSync.ts:60`.
- **Rectify:** Fix the cause (F2 / a unique `date`). Until then, dedupe by date in `sessionsThisWeek` and
  `runStats` for consistency, and add a Settings diagnostic that counts duplicate dates so the condition is
  detectable at all.

### F11. `parseBackup` skips the version gate when `version` is not a number
- **Severity:** nit
- **Where:** `src/db.ts:133`
- **Failure scenario:** `if (typeof data.version === 'number' && data.version > BACKUP_VERSION)`. A file
  with `"version": "3"` or no `version` key at all bypasses the newer-version rejection entirely and is
  imported as if it were understood. Not reachable from any file this app writes — but the whole point of
  the gate is to defend against files this app did not write.
- **Rectify:** Require the field: reject when `typeof data.version !== 'number'`, or when it exceeds
  `BACKUP_VERSION`.

---

## Note for whoever picks this up

While this audit ran, a concurrent session committed `e39c9ab` with `git add -A` and swept in a throwaway
probe file of mine, `test/__tmp_downgrade.test.ts`. I have deleted it from the working tree; the deletion
is **unstaged and needs committing**. It is not a real test and should not be kept.
