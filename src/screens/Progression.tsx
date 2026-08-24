import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Check } from 'lucide-react'
import { useSettings, useAllOneRm, useSessions } from '../hooks'
import { db, saveSettings } from '../db'
import { narrowMaxes, progressionPending, protocolFor } from '../program'
import { protocolExercises } from '../protocol'
import {
  PROGRESSION_MAX_KG,
  PROGRESSION_MIN_KG,
  kgForChoice,
  reasonForChoice,
  reviewProgression,
  sessionsInBlock,
  suggestChoice,
  withProgression,
  type ProgressionCandidate,
  type ProgressionChoice,
} from '../lib/progression'
import { today } from '../lib/date'
import { Card, Button } from '../components/ui'
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
 * It fires at EVERY block boundary, which the book settles rather than leaves
 * open: p.64's chapter heading is "PROGRESSION from block to block", and p.90
 * says progression "consists of adding weight to your 1 rep maximum and
 * recalculating from block to block".
 *
 * The end of a whole PLAN is a different moment with a different prompt —
 * "reassess and determine if you need to change the ratio" (p.140) — which
 * belongs to the planner. See docs/mass-design.md §11.2.
 *
 * The design goal Josh set is that this takes thinking OFF him: in a normal
 * block he opens it, reads what the app worked out, and hits Apply.
 */

const round1 = (n: number) => Math.round(n * 10) / 10

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
   * Only the lifts he has explicitly overridden. The choice itself is DERIVED
   * from `suggestChoice`, never copied into state.
   *
   * Seeding state from the suggestion is the obvious implementation and it is
   * wrong: `useSessions` and `useAllOneRm` both return `[]` while IndexedDB is
   * still loading, so a seeding effect runs against no session history and
   * proposes a full increment for every lift — including the ones marked
   * "struggled", which is precisely the case the book tells us to leave alone.
   * It was invisible in unit tests, which call the pure function directly, and
   * obvious the moment the screen was opened. Deriving makes it unrepresentable.
   */
  const [override, setOverride] = useState<Record<string, ProgressionChoice>>({})
  const [saving, setSaving] = useState(false)

  const choiceFor = (c: ProgressionCandidate): ProgressionChoice =>
    override[c.exerciseId] ?? suggestChoice(c)

  if (!block) {
    return (
      <div className="space-y-4 stagger">
        <ScreenHeader title="Forced Progression" fallback={'/'} />
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
      </div>
    )
  }

  const moving = review.candidates.filter((c) => kgForChoice(c, choiceFor(c)) > 0)

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
      for (const c of review.candidates) {
        const add = kgForChoice(c, choiceFor(c))
        if (add > 0) await db.oneRm.put(withProgression(c.entry, add))
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
          Worked out from the block you just did. Change anything you disagree with, then apply —
          every working weight follows from the 1RM, and you don’t re-test (p.90).
        </p>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-2">Your 1RMs</p>
        <div className="space-y-2">
          {review.candidates.map((c) => (
            <CandidateRow
              key={c.exerciseId}
              c={c}
              choice={choiceFor(c)}
              onChoose={(v) => setOverride({ ...override, [c.exerciseId]: v })}
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

      <Card elev="sunk">
        <p className="text-[11px] text-muted leading-relaxed">
          The book says <b>5–10 lb</b> ({PROGRESSION_MIN_KG}–{PROGRESSION_MAX_KG} kg) but never which
          lift gets which end (p.53). Tactical Barbell I does — <b>10 lb lower body, 5 lb upper</b>,
          the same two numbers — so squats and deadlifts take {PROGRESSION_MAX_KG} kg and presses
          take {PROGRESSION_MIN_KG} kg. <b>That split is our reading, not this book’s text.</b>
        </p>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void apply()} disabled={saving}>
          <Check size={18} className="inline -mt-0.5 mr-1" />
          {moving.length > 0
            ? `Apply to ${moving.length} lift${moving.length === 1 ? '' : 's'}`
            : 'Keep all the same'}
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

const CHOICES: { v: ProgressionChoice; label: string }[] = [
  { v: 'full', label: 'Full' },
  { v: 'eased', label: 'Half' },
  { v: 'hold', label: 'Hold' },
]

function CandidateRow({
  c,
  choice,
  onChoose,
}: {
  c: ProgressionCandidate
  choice: ProgressionChoice
  onChoose: (v: ProgressionChoice) => void
}) {
  const add = kgForChoice(c, choice)
  const next = round1(c.currentKg + add)

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
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium text-ink text-[15px] min-w-0 truncate">{c.exerciseName}</p>
        <p className="num-display text-[13px] whitespace-nowrap">
          <span className={add > 0 ? 'text-muted' : 'text-load'}>{round1(c.currentKg)}</span>
          {add > 0 && <span className="text-load font-semibold"> → {next}</span>}
          <span className="text-muted"> kg</span>
        </p>
      </div>

      <p className="text-[11px] text-muted mt-1">{reasonForChoice(c, choice)}</p>

      {/* One tap to disagree with any of it — the "change something" affordance. */}
      <div className="flex gap-1.5 mt-2">
        {CHOICES.map((o) => {
          const on = choice === o.v
          const kg = kgForChoice(c, o.v)
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChoose(o.v)}
              aria-pressed={on}
              aria-label={`${c.exerciseName} ${o.label}`}
              className={`flex-1 rounded-pill text-[11px] font-bold py-1.5 min-h-9 ${
                on ? 'bg-brand/15 text-brand-ink' : 'bg-surface text-muted'
              }`}
            >
              {o.label}
              {kg > 0 && <span className="font-normal"> +{kg}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
