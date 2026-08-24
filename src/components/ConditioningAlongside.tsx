import { Footprints } from 'lucide-react'
import { SetCheck } from './ui'
import type { ConditioningBrief } from '../protocol'

/**
 * Conditioning scheduled on the same day as a lift — MASS p.99.
 *
 *   "Perform 1 to 3 conditioning sessions per week. No more than 3. Sessions can
 *    be conducted on non-lifting **or lifting** days." (p.99)
 *
 * Rendered as a companion to the lift, never in place of it. Until this existed
 * the app injected conditioning only when a day resolved to `rest`, so it was
 * structurally confined to rest days and the Plan screen's day picker lied
 * (audit A4).
 *
 * It is TICKABLE now. It used to be informational only, because the app stored
 * one session row per date and so this session had nowhere of its own to be
 * completed. Backlog F1 gave a date room for a lifting row and a conditioning
 * row, and this is the second one — a real session the book prescribes, with a
 * real completion state, not a note under the lift.
 *
 * `onToggle` is optional so the component still renders read-only where no
 * conditioning plan could be resolved.
 */
export default function ConditioningAlongside({
  c,
  done = false,
  onToggle,
}: {
  c: ConditioningBrief
  done?: boolean
  onToggle?: () => void
}) {
  return (
    <div className="mt-3 rounded-field bg-[var(--color-surface-sunk)] p-3">
      <div className="flex items-start gap-2.5">
        <Footprints size={18} className="text-accent-ink mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink">
            Also today: {c.name}
            <span className="text-[11px] font-bold text-muted ml-1.5 uppercase tracking-wide">
              Green
            </span>
          </p>
          {c.scheme && <p className="text-xs text-muted mt-0.5">{c.scheme}</p>}
          <p className="text-[11px] text-muted mt-1">
            Conditioning can share a day with a lift (p.99). Lift first.
          </p>
        </div>
        {onToggle && (
          <div className="shrink-0">
            <SetCheck done={done} onToggle={onToggle} label={`Mark ${c.name} done`} />
          </div>
        )}
      </div>
    </div>
  )
}
