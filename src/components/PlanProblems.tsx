import { AlertTriangle, Ban } from 'lucide-react'
import type { PlanProblem } from '../lib/planRules'

/**
 * What is wrong with a block plan, in the book's own words — audit A15,
 * docs/mass-design.md §11.4.
 *
 * The two levels are rendered differently on purpose. An `error` is something
 * the book states as a fact (a 3-week block, p.40) or something that genuinely
 * breaks the app (a fractional block length blanks the session screen), and it
 * blocks the save. A `warning` is advice the author explicitly hands over —
 * *"you can set-up a more customized ratio ... as needed"* (p.140) — so it
 * explains itself and gets out of the way.
 *
 * Turning the second kind into the first would make laws out of rules of thumb
 * the author did not write, which is the opposite of the fidelity rule.
 */
export default function PlanProblems({ problems }: { problems: PlanProblem[] }) {
  if (problems.length === 0) return null
  return (
    <div className="space-y-1.5">
      {problems.map((p, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-field p-2.5 ${
            p.level === 'error' ? 'bg-warm border border-warm-edge/40' : 'bg-[var(--color-surface-sunk)]'
          }`}
        >
          {p.level === 'error' ? (
            <Ban size={15} className="text-brand-ink mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={15} className="text-muted mt-0.5 shrink-0" />
          )}
          <p className={`text-[11px] leading-relaxed ${p.level === 'error' ? 'text-ink' : 'text-muted'}`}>
            {p.message}
          </p>
        </div>
      ))}
    </div>
  )
}
