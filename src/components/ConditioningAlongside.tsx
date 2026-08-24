import { Footprints } from 'lucide-react'
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
 * Deliberately informational: the app stores one session row per date, so a
 * conditioning session sharing a day with a lift has nowhere of its own to be
 * ticked. Giving it one means allowing two rows per date, which is the same
 * change A6 is about — see docs/BACKLOG.md.
 */
export default function ConditioningAlongside({ c }: { c: ConditioningBrief }) {
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
      </div>
    </div>
  )
}
