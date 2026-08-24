import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Check } from 'lucide-react'
import { useSettings, useAllOneRm, useSessions } from '../hooks'
import { db, saveSettings } from '../db'
import { narrowMaxes, progressionPending, protocolFor } from '../program'
import { protocolExercises } from '../protocol'
import {
  PROGRESSION_DEFAULT_KG,
  PROGRESSION_MAX_KG,
  PROGRESSION_MIN_KG,
  reviewProgression,
  sessionsInBlock,
  suggestProgression,
  withProgression,
  type ProgressionCandidate,
} from '../lib/progression'
import { today } from '../lib/date'
import { Card, Button, Checkbox } from '../components/ui'
import ScreenHeader from '../components/ScreenHeader'

/**
 * The block-boundary Forced Progression prompt — MASS p.53, p.90.
 *
 *   "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't
 *    force progression for exercises you struggled with - use the same numbers
 *    for the next block." (p.53)
 *
 * This screen is the mechanism the whole protocol works by, and until it existed
 * the app had none: nothing wrote a non-zero `progressedKg`, so a fourth block
 * prescribed exactly what the first one did (audit A1).
 *
 * It fires at a BLOCK boundary. The end of a whole plan is a different moment
 * with a different prompt — "reassess and determine if you need to change the
 * ratio" (p.140) — which belongs to the planner, not here.
 * See docs/mass-design.md §11.2.
 */
export default function Progression() {
  const settings = useSettings()
  const rows = useAllOneRm()
  const sessions = useSessions()
  const nav = useNavigate()

  const finished = progressionPending(settings, today())
  // Re-read the block even once it has been answered, so revisiting the screen
  // shows what happened rather than an empty page.
  const block = finished ?? null
  const protocol = protocolFor(block?.protocolId)
  const exercises = protocol.exercisesFor?.(settings) ?? protocolExercises(protocol)
  const maxes = narrowMaxes(rows, protocol)
  const blockSessions = block ? sessionsInBlock(sessions, block.startDate, block.endDateExclusive) : []
  const review = reviewProgression(exercises, maxes, blockSessions)

  /**
   * Only the lifts he has explicitly overridden. The tick state itself is
   * DERIVED from `suggestProgression`, never copied into state.
   *
   * Seeding state from the suggestion is the obvious implementation and it is
   * wrong: `useSessions` and `useAllOneRm` both return `[]` while IndexedDB is
   * still loading, so a seeding effect runs against no session history and ticks
   * every lift — including the ones marked "struggled", which is precisely the
   * case the book tells us to leave alone. It was invisible in unit tests, which
   * call `suggestProgression` directly, and obvious the moment the screen was
   * opened. Deriving makes the bug unrepresentable.
   */
  const [override, setOverride] = useState<Record<string, boolean>>({})
  const [stepKg, setStepKg] = useState(String(PROGRESSION_DEFAULT_KG))
  const [saving, setSaving] = useState(false)

  const isPicked = (c: ProgressionCandidate): boolean =>
    override[c.exerciseId] ?? suggestProgression(c)

  if (!block) {
    return (
      <Card elev="1">
        <p className="eyebrow text-muted">Forced Progression</p>
        <h2 className="display-hero text-xl text-ink">Nothing to review</h2>
        <p className="text-xs text-muted mt-2">
          This appears when a block ends. “Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and
          repeat.” (p.53)
        </p>
        <Button className="mt-3" onClick={() => nav('/')}>
          Back to today
        </Button>
      </Card>
    )
  }

  const step = Number(stepKg)
  const stepValid = step > 0
  const chosen = review.candidates.filter((c) => !c.blocked && isPicked(c))

  /**
   * Apply the increments and stamp the block as answered.
   *
   * The stamp goes on whether or not anything was progressed: the prompt is a
   * decision point, and "I looked and left them alone" is an answer to it. Only
   * "Not now" leaves the block unstamped so it asks again.
   */
  async function apply() {
    if (!block || saving) return
    setSaving(true)
    try {
      for (const c of chosen) {
        await db.oneRm.put(withProgression(c.entry, step))
      }
      const done = settings.mass?.progressedBlocks ?? []
      await saveSettings({
        mass: { ...settings.mass, progressedBlocks: [...done, block.startDate] },
      })
      nav('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 stagger">
      <ScreenHeader title="Forced Progression" fallback={'/'} />
      <Card elev="1">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-load" />
          <p className="eyebrow text-muted">Forced Progression</p>
        </div>
        <h2 className="display-hero text-xl text-ink mt-1">
          {protocol.name} block {block.index + 1} is done
        </h2>
        <p className="text-xs text-muted mt-2">
          “<b>Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat.</b> Don’t force
          progression for exercises you struggled with — use the same numbers for the next block.”
          (p.53)
        </p>
        <p className="text-[11px] text-muted mt-2">
          This is how the programme gets heavier. Add to the 1RM and every working weight follows
          from it — you don’t re-test (p.90).
        </p>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-1">Increment</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            aria-label="Progression increment in kg"
            value={stepKg}
            onChange={(e) => setStepKg(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
            className="w-24 text-center rounded-field bg-[var(--color-surface-sunk)] border border-[var(--color-field-border)] py-2 num-display text-base text-ink"
          />
          <p className="text-xs text-muted flex-1">
            kg on the 1RM. The book says <b>5–10 lb</b>, which is{' '}
            <b>
              {PROGRESSION_MIN_KG}–{PROGRESSION_MAX_KG} kg
            </b>{' '}
            (p.53). Start at the bottom of it: <i>“DON’T start too heavy”</i> (p.64).
          </p>
        </div>
        {stepValid && step > PROGRESSION_MAX_KG && (
          <p className="text-[11px] font-bold text-brand-ink mt-2">
            {step} kg is more than the book’s 10 lb top end ({PROGRESSION_MAX_KG} kg).
          </p>
        )}
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-1">Lifts</p>
        <p className="text-xs text-muted mb-3">
          Ticked lifts go up by {stepValid ? step : '—'} kg. Anything you struggled with stays where
          it is — that is the book’s own instruction, not a courtesy.
        </p>
        <div className="space-y-2">
          {review.candidates.map((c) => (
            <CandidateRow
              key={c.exerciseId}
              c={c}
              step={stepValid ? step : 0}
              checked={isPicked(c)}
              onToggle={() => setOverride({ ...override, [c.exerciseId]: !isPicked(c) })}
            />
          ))}
          {review.candidates.length === 0 && (
            <p className="text-xs text-muted">
              No 1RMs stored for {protocol.name} yet — there is nothing to add weight to.
            </p>
          )}
        </div>

        {review.missing.length > 0 && (
          <p className="text-[11px] text-muted mt-3">
            No max recorded for {review.missing.join(', ')}.{' '}
            <button onClick={() => nav('/maxes')} className="font-bold text-brand-ink">
              Set them →
            </button>
          </p>
        )}
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void apply()} disabled={!stepValid || saving}>
          <Check size={18} className="inline -mt-0.5 mr-1" />
          {chosen.length > 0 ? `Progress ${chosen.length} lift${chosen.length === 1 ? '' : 's'}` : 'Keep all the same'}
        </Button>
        <Button variant="secondary" onClick={() => nav('/')}>
          Not now
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted">
        “Not now” asks again next time you open the app.
      </p>
    </div>
  )
}

function CandidateRow({
  c,
  step,
  checked,
  onToggle,
}: {
  c: ProgressionCandidate
  step: number
  checked: boolean
  onToggle: () => void
}) {
  const round1 = (n: number) => Math.round(n * 10) / 10
  if (c.blocked) {
    return (
      <div className="rounded-field bg-[var(--color-surface-sunk)] p-3 opacity-70">
        <p className="font-medium text-ink text-[15px]">{c.exerciseName}</p>
        <p className="text-[11px] text-muted mt-0.5">{c.blocked}</p>
      </div>
    )
  }
  return (
    <div className="rounded-field bg-[var(--color-surface-sunk)] p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Checkbox checked={checked} onChange={onToggle}>
            <span className="font-medium text-ink text-[15px]">{c.exerciseName}</span>
          </Checkbox>
        </div>
        <span className="num-display text-[13px] text-load whitespace-nowrap">
          {round1(c.currentKg)}
          {checked && step > 0 && (
            <span className="font-semibold"> → {round1(c.currentKg + step)}</span>
          )}
          <span className="text-muted"> kg</span>
        </span>
      </div>
      {(c.struggled || c.shortSets > 0) && (
        <p className="text-[11px] text-brand-ink mt-1.5 pl-9">
          {c.struggled && 'You marked this a struggle. '}
          {c.shortSets > 0 &&
            `${c.shortSets} set${c.shortSets === 1 ? '' : 's'} logged short of the rest. `}
          The book says use the same numbers again (p.53).
        </p>
      )}
    </div>
  )
}
