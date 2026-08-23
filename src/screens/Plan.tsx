import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { useSettings } from '../hooks'
import { saveSettings } from '../db'
import {
  PROTOCOLS,
  SELECTABLE_PROTOCOLS,
  defaultPlan,
  planWeeks,
  protocolFor,
  resolvePosition,
} from '../program'
import { S_CLUSTER_MAX, S_CLUSTER_MIN, GM_S1_EXAMPLE, GM_S2_EXAMPLE } from '../protocols/greyman'
import { sessionsFor, perWeekFor, defaultConditioningDays } from '../protocols/conditioning'
import { conditioningDaysFor, conditioningPickFor } from '../protocols/conditioningPlan'
import { today, addDays, isoDate, mondayIndex, DAY_NAMES } from '../lib/date'
import { Card, Button } from '../components/ui'
import type { ClusterExerciseRef } from '../types'

/**
 * Block plan, supplementary cluster and conditioning — the three things the book
 * leaves to the reader.
 *
 * Each section says what the book fixes and what it does not, because that
 * distinction is the whole point of the rebuild: the app should never look like
 * it is inventing a prescription, and it should never hide a choice the author
 * deliberately handed over.
 */

/** The Monday of the current week — the natural default for a plan start. */
const thisMonday = (): string => {
  const d = today()
  return isoDate(addDays(d, -mondayIndex(d)))
}

const fieldCls =
  'rounded-field border border-[var(--color-field-border)] bg-[var(--color-surface-sunk)] text-ink px-3 py-2 font-semibold min-h-11'

const slug = (name: string) =>
  's_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

export default function Plan() {
  const s = useSettings()
  const pos = resolvePosition(s, today())
  const protocol = protocolFor(pos.phaseId)
  const plan = s.plan

  return (
    <div className="space-y-4 stagger">
      <Card elev="1">
        <p className="eyebrow text-muted">Programme</p>
        <h2 className="display-hero text-xl text-ink">Plan your blocks</h2>
        <p className="text-xs text-muted mt-2">
          “Both General and Specificity consist of <b>3-week blocks</b>” (p.40). A longer stint is
          more blocks, not a longer one. Bridge a week between them whenever you need to — the author
          recommends one every two to three months (p.93).
        </p>
      </Card>

      <BlockPlanner />

      {protocol.id === 'gm' && <SupplementaryBuilder />}

      {protocol.conditioning !== 'none' && <ConditioningPlanner />}

      {!plan && (
        <Card>
          <p className="text-xs text-muted">
            No block plan yet — the app is running the single programme set in Settings, starting{' '}
            {s.phaseStartDate}.
          </p>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function BlockPlanner() {
  const s = useSettings()
  const blocks = s.plan?.blocks ?? []
  const startDate = s.plan?.startDate ?? thisMonday()
  const pos = resolvePosition(s, today())

  const write = (next: { protocolId: string; weeks: number }[], start = startDate) =>
    saveSettings({ plan: { startDate: start, blocks: next } })

  const add = (protocolId: string) =>
    write([...blocks, { protocolId, weeks: PROTOCOLS[protocolId]?.blockWeeks ?? 3 }])

  const move = (i: number, by: number) => {
    const j = i + by
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    write(next)
  }

  return (
    <Card>
      <p className="eyebrow text-muted mb-2">Block sequence</p>

      {blocks.length === 0 ? (
        <>
          <p className="text-xs text-muted mb-3">
            The book’s Standard Cycle for a first-timer is General, General, Bridge, Specificity,
            Specificity (p.140). Specificity isn’t built yet, so this starts you with four Grey Man
            blocks and a bridge week — twelve weeks of lifting.
          </p>
          <Button onClick={() => saveSettings({ plan: defaultPlan(startDate) })}>
            Create a starter plan
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            {blocks.map((b, i) => {
              const p = protocolFor(b.protocolId)
              const active = i === pos.blockIndex
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-field p-2 ${active ? 'bg-load-soft' : 'bg-[var(--color-surface-sunk)]'}`}
                >
                  <span className="w-5 text-center text-xs font-bold text-muted num-display">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink text-[15px] truncate">{p.name}</p>
                    <p className="text-xs text-muted">
                      {b.weeks} {b.weeks === 1 ? 'week' : 'weeks'}
                      {active ? ` · now, week ${pos.week}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => move(i, -1)}
                    aria-label={`Move block ${i + 1} earlier`}
                    className="p-2 text-muted"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    aria-label={`Move block ${i + 1} later`}
                    className="p-2 text-muted"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => write(blocks.filter((_, j) => j !== i))}
                    aria-label={`Remove block ${i + 1}`}
                    className="p-2 text-muted"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted mt-3">
            {planWeeks(blocks)} weeks in total, starting{' '}
            <input
              type="date"
              aria-label="Plan start date"
              value={s.plan?.startDate ?? startDate}
              onChange={(e) => write(blocks, e.target.value)}
              className="rounded-field bg-[var(--color-surface-sunk)] border border-[var(--color-field-border)] px-2 py-1 text-ink"
            />
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {SELECTABLE_PROTOCOLS.filter((p) => p.family !== 'legacy').map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="inline-flex items-center gap-1 rounded-pill bg-brand/10 text-brand-ink text-[12px] font-bold px-3 min-h-9"
              >
                <Plus size={14} /> {p.name}
              </button>
            ))}
            <button
              onClick={() => add('bridge')}
              className="inline-flex items-center gap-1 rounded-pill bg-[var(--color-surface-sunk)] text-muted text-[12px] font-bold px-3 min-h-9"
            >
              <Plus size={14} /> Bridge week
            </button>
            <button
              onClick={() => saveSettings({ plan: undefined })}
              className="ml-auto text-[12px] font-bold text-muted px-2 min-h-9"
            >
              Clear plan
            </button>
          </div>
        </>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------

function SupplementaryBuilder() {
  const s = useSettings()
  const s1 = s.mass?.sCluster?.s1 ?? GM_S1_EXAMPLE
  const s2 = s.mass?.sCluster?.s2 ?? GM_S2_EXAMPLE
  const total = s1.length + s2.length
  const [draft, setDraft] = useState('')
  const [target, setTarget] = useState<'s1' | 's2'>('s1')

  const save = (next1: ClusterExerciseRef[], next2: ClusterExerciseRef[]) =>
    saveSettings({ mass: { ...s.mass, sCluster: { s1: next1, s2: next2 } } })

  const add = () => {
    const name = draft.trim()
    if (!name || total >= S_CLUSTER_MAX) return
    const ex: ClusterExerciseRef = { id: slug(name), name, defaultLoading: 'dumbbell' }
    if (target === 's1') save([...s1, ex], s2)
    else save(s1, [...s2, ex])
    setDraft('')
  }

  const remove = (which: 's1' | 's2', id: string) => {
    if (which === 's1') save(s1.filter((e) => e.id !== id), s2)
    else save(s1, s2.filter((e) => e.id !== id))
  }

  const setLoading = (which: 's1' | 's2', id: string, loading: ClusterExerciseRef['defaultLoading']) => {
    const map = (list: ClusterExerciseRef[]) =>
      list.map((e) => (e.id === id ? { ...e, defaultLoading: loading } : e))
    if (which === 's1') save(map(s1), s2)
    else save(s1, map(s2))
  }

  const list = (which: 's1' | 's2', items: ClusterExerciseRef[]) => (
    <div>
      <p className="text-xs font-bold text-ink mb-1">{which.toUpperCase()}</p>
      {items.length === 0 && <p className="text-xs text-muted mb-1">Empty.</p>}
      <div className="space-y-1.5">
        {items.map((e) => (
          <div key={e.id} className="flex items-center gap-2 rounded-field bg-[var(--color-surface-sunk)] p-2">
            <span className="flex-1 min-w-0 truncate text-[14px] text-ink">{e.name}</span>
            <select
              aria-label={`${e.name} loading`}
              value={e.defaultLoading}
              onChange={(ev) =>
                setLoading(which, e.id, ev.target.value as ClusterExerciseRef['defaultLoading'])
              }
              className="rounded-pill bg-surface text-[11px] font-bold text-muted px-2 py-1"
            >
              <option value="barbell">Barbell</option>
              <option value="dumbbell">Dumbbell</option>
              <option value="bodyweightReps">Bodyweight</option>
              <option value="weightedBodyweight">Weighted BW</option>
              <option value="unloaded">No load</option>
            </select>
            <button onClick={() => remove(which, e.id)} aria-label={`Remove ${e.name}`} className="p-1.5 text-muted">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card>
      <p className="eyebrow text-muted mb-1">Supplementary cluster</p>
      <p className="text-xs text-muted mb-3">
        “You create and customize the S cluster” (p.48). <b>4 to 6 exercises, no more</b>, split into
        two lists (p.49). Dumbbells, barbells, kettlebells and bodyweight are all allowed. For a pure
        mass result the author recommends sticking to conventional dumbbell and barbell work.
      </p>

      <div className="space-y-3">
        {list('s1', s1)}
        {list('s2', s2)}
      </div>

      <p
        className={`text-xs mt-3 font-bold ${total < S_CLUSTER_MIN || total > S_CLUSTER_MAX ? 'text-brand-ink' : 'text-muted'}`}
      >
        {total} of {S_CLUSTER_MIN}–{S_CLUSTER_MAX}
        {total < S_CLUSTER_MIN && ' — the book asks for at least 4.'}
        {total > S_CLUSTER_MAX && ' — the book says no more than 6.'}
      </p>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className={`${fieldCls} flex-1`}
          placeholder="Add an exercise"
          aria-label="New supplementary exercise"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <select
          aria-label="Add to which list"
          value={target}
          onChange={(e) => setTarget(e.target.value as 's1' | 's2')}
          className={fieldCls}
        >
          <option value="s1">S1</option>
          <option value="s2">S2</option>
        </select>
        <Button onClick={add} disabled={!draft.trim() || total >= S_CLUSTER_MAX}>
          Add
        </Button>
      </div>

      {(s.mass?.sCluster?.s1 || s.mass?.sCluster?.s2) && (
        <button
          onClick={() => saveSettings({ mass: { ...s.mass, sCluster: undefined } })}
          className="text-[12px] font-bold text-muted mt-3 min-h-9"
        >
          Reset to the book’s example
        </button>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------

function ConditioningPlanner() {
  const s = useSettings()
  const pos = resolvePosition(s, today())
  const protocol = protocolFor(pos.phaseId)
  const colour = protocol.conditioning
  const days = conditioningDaysFor(protocol, s)
  const options = sessionsFor(colour)
  const cap = perWeekFor(colour)

  const toggle = (d: number) => {
    const cur = s.mass?.conditioningDays ?? defaultConditioningDays(colour)
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    saveSettings({ mass: { ...s.mass, conditioningDays: next.sort((a, b) => a - b) } })
  }

  const pick = (d: number, id: string) =>
    saveSettings({
      mass: { ...s.mass, conditioningPick: { ...(s.mass?.conditioningPick ?? {}), [d]: id } },
    })

  return (
    <Card>
      <p className="eyebrow text-muted mb-1">{colour === 'black' ? 'Black' : 'Green'} conditioning</p>
      <p className="text-xs text-muted mb-3">
        {colour === 'black'
          ? '“Perform 1 to 2 conditioning sessions per week. No more than 2. Perform Black sessions on non-lifting days.” (p.99)'
          : '“Perform 1 to 3 conditioning sessions per week. No more than 3. Sessions can be conducted on non-lifting or lifting days.” (p.99)'}{' '}
        The book fixes the count, not the days — those are yours.
      </p>

      <div className="flex gap-1.5 mb-3">
        {DAY_NAMES.map((n, d) => {
          const on = days.includes(d)
          const lifting = protocol.liftingDays.includes(d)
          const blocked = colour === 'black' && lifting
          return (
            <button
              key={d}
              onClick={() => !blocked && toggle(d)}
              disabled={blocked}
              aria-label={`${n} conditioning`}
              aria-pressed={on}
              className={`flex-1 rounded-field py-2 text-[11px] font-bold min-h-11 ${
                on
                  ? 'bg-brand/15 text-brand-ink'
                  : blocked
                    ? 'bg-[var(--color-surface-sunk)] text-muted/40'
                    : 'bg-[var(--color-surface-sunk)] text-muted'
              }`}
            >
              {n}
              {lifting && <span className="block text-[9px] font-normal">lift</span>}
            </button>
          )
        })}
      </div>

      {days.length > cap.max && (
        <p className="text-xs font-bold text-brand-ink mb-2">
          Only the first {cap.max} count — the book caps it there.
        </p>
      )}

      <div className="space-y-2">
        {days.map((d) => (
          <div key={d} className="flex items-center gap-2">
            <span className="w-10 text-xs font-bold text-muted">{DAY_NAMES[d]}</span>
            <select
              aria-label={`${DAY_NAMES[d]} session`}
              value={conditioningPickFor(protocol, s, d)?.id ?? options[0]?.id}
              onChange={(e) => pick(d, e.target.value)}
              className={`${fieldCls} flex-1`}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} — {o.card[0]}
                </option>
              ))}
            </select>
          </div>
        ))}
        {days.length === 0 && (
          <p className="text-xs text-muted">
            No conditioning scheduled. The book asks for at least {cap.min} a week.
          </p>
        )}
      </div>
    </Card>
  )
}
