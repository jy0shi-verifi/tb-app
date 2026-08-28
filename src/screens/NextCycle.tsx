import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, Plus, Repeat } from 'lucide-react'
import { useSettings } from '../hooks'
import { saveSettings } from '../db'
import {
  PLAN_BLOCK_PROTOCOLS,
  PROTOCOLS,
  defaultPlan,
  blockWeeksOf,
  mondayOnOrBefore,
  planWeeks,
  protocolFor,
  resolvePosition,
} from '../program'
import { PLAN_PRESETS, planHasErrors, presetBlocks, validatePlan, type PlanPreset } from '../lib/planRules'
import { addDays, isoDate, parseISO, prettyDate, today } from '../lib/date'
import { Card, Button } from '../components/ui'
import ScreenHeader from '../components/ScreenHeader'
import PlanProblems from '../components/PlanProblems'

/**
 * The end-of-cycle planner — MASS p.140, p.147 item 10.
 *
 *   "After completing a standard cycle, reassess and determine if you need to
 *    change the ratio of time spent in General vs Specificity. Block 6 can be a
 *    bridge week between cycles or you can transition into something else
 *    immediately." (p.140)
 *
 * This replaces the dead "Resume" button that used to sit here. That button
 * called `realign`, which writes `phaseStartDate` — a field `resolveInPlan`
 * never reads — so under a plan it did nothing at all and Today bricked with
 * "It's been 0 days" (audit A15, book-04 F9).
 *
 * It fires at the end of a PLAN, not at the end of a block: p.140 asks for
 * reassessment once a cycle, while the block-to-block moment is Forced
 * Progression, which has its own screen. See docs/mass-design.md §11.2.
 */
export default function NextCycle() {
  const s = useSettings()
  const nav = useNavigate()
  const pos = resolvePosition(s, today())
  const plan = s.plan
  const [busy, setBusy] = useState(false)

  if (!plan?.blocks?.length) {
    return (
      <Card elev="1">
        <p className="eyebrow text-muted">Next cycle</p>
        <h2 className="display-hero text-xl text-ink">No plan to continue</h2>
        <p className="text-xs text-muted mt-2">Build one on the Block plan screen first.</p>
        <Button className="mt-3" onClick={() => nav('/plan')}>
          Block plan
        </Button>
      </Card>
    )
  }

  /**
   * The Monday after the current plan ends.
   *
   * A new cycle is APPENDED to the existing plan rather than replacing it, so
   * `plan.startDate` never moves and every past block keeps the dates it
   * actually ran on. Starting a fresh plan instead would re-date the whole
   * history and put every completed session in the wrong week.
   */
  const appendBlocks = async (blocks: { protocolId: string; weeks: number }[]) => {
    if (busy) return
    setBusy(true)
    try {
      await saveSettings({ plan: { ...plan, blocks: [...plan.blocks, ...blocks] } })
      nav('/')
    } finally {
      setBusy(false)
    }
  }

  const endsOn = isoDate(addDays(parseISO(plan.startDate), planWeeks(plan.blocks) * 7 - 1))
  const done = pos.status === 'complete'

  return (
    <div className="space-y-4 stagger">
      <ScreenHeader title="Next cycle" fallback={'/'} />
      <Card elev="1">
        <div className="flex items-center gap-2">
          <Flag size={18} className="text-load" />
          <p className="eyebrow text-muted">Next cycle</p>
        </div>
        <h2 className="display-hero text-xl text-ink mt-1">
          {done ? 'Cycle complete' : 'Plan what comes next'}
        </h2>
        <p className="text-xs text-muted mt-2">
          “After completing a standard cycle, <b>reassess and determine if you need to change the
          ratio</b> of time spent in General vs Specificity. Block 6 can be a bridge week between
          cycles or you can transition into something else immediately.” (p.140)
        </p>
        <p className="text-[11px] text-muted mt-2">
          {plan.blocks.length} blocks · {planWeeks(plan.blocks)} weeks, ending{' '}
          {prettyDate(parseISO(endsOn))}. Anything you add starts the day after.
        </p>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-1">Run it again</p>
        <p className="text-xs text-muted mb-3">
          “There’s no rule that you must favor Specificity as you get close to your target weight. If
          you’re happy with your progress and don’t want to rock the boat, <b>keep repeating the
          Standard Cycle</b>.” (p.142)
        </p>
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => void appendBlocks(plan.blocks.map((b) => ({ ...b })))}
        >
          <Repeat size={17} className="inline -mt-0.5 mr-1.5" />
          Repeat this cycle ({planWeeks(plan.blocks)} more weeks)
        </Button>
      </Card>

      {PLAN_PRESETS.map((preset) => (
        <PresetCard key={preset.id} preset={preset} busy={busy} onPick={appendBlocks} />
      ))}

      <Card>
        <p className="eyebrow text-muted mb-1">Add one block</p>
        <p className="text-xs text-muted mb-3">
          Blocks are a fixed length — “Both General and Specificity consist of <b>3-week blocks</b>”
          (p.40) — so a longer stint is more blocks, not a longer one.
        </p>
        <div className="flex flex-wrap gap-2">
          {PLAN_BLOCK_PROTOCOLS.map((p) => (
            <button
              key={p.id}
              disabled={busy}
              onClick={() => void appendBlocks([{ protocolId: p.id, weeks: p.blockWeeks }])}
              className="inline-flex items-center gap-1 rounded-pill bg-brand/10 text-brand-ink text-[12px] font-bold px-3 min-h-9 disabled:opacity-50"
            >
              <Plus size={14} /> {p.name} · {p.blockWeeks} wk
            </button>
          ))}
          <button
            disabled={busy}
            onClick={() => void appendBlocks([{ protocolId: 'bridge', weeks: 1 }])}
            className="inline-flex items-center gap-1 rounded-pill bg-[var(--color-surface-sunk)] text-muted text-[12px] font-bold px-3 min-h-9 disabled:opacity-50"
          >
            <Plus size={14} /> Bridge week
          </button>
        </div>
      </Card>

      <Card>
        <p className="eyebrow text-muted mb-1">Start over</p>
        <p className="text-xs text-muted mb-3">
          Builds a brand-new plan from this Monday. Your logged history is untouched, but past blocks
          stop lining up with the dates they ran on — appending above is usually what you want.
        </p>
        <Button
          variant="secondary"
          className="w-full"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm('Start a brand-new plan from this Monday?')) return
            const start = mondayOnOrBefore(isoDate(today()))
            await saveSettings({ plan: defaultPlan(start) })
            nav('/plan')
          }}
        >
          New plan from this Monday
        </Button>
      </Card>

      <button onClick={() => nav('/plan')} className="w-full text-[12px] font-bold text-muted min-h-11">
        Edit the plan by hand →
      </button>
    </div>
  )
}

function PresetCard({
  preset,
  busy,
  onPick,
}: {
  preset: PlanPreset
  busy: boolean
  onPick: (blocks: { protocolId: string; weeks: number }[]) => void
}) {
  const apply = (spec?: 'alpha' | 'bravo') => onPick(presetBlocks(preset, spec))
  const sample = preset.specChoice ? null : presetBlocks(preset)
  const problems = sample ? validatePlan(sample, (id) => protocolFor(id)) : []
  return (
    <Card>
      <p className="eyebrow text-muted mb-1">{preset.name}</p>
      <p className="text-xs text-muted">{preset.goal}</p>
      {sample && (
        <div className="flex flex-wrap gap-1.5 my-3">
          {sample.map((b, i) => (
            <span
              key={i}
              className="rounded-pill bg-[var(--color-surface-sunk)] text-[11px] font-bold text-muted px-2.5 py-1"
            >
              {PROTOCOLS[b.protocolId]?.name ?? b.protocolId} · {blockWeeksOf(b)}w
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted mb-1">
        {sample ? `${planWeeks(sample)} weeks` : 'Pick Alpha or Bravo'} · {preset.cite}
      </p>
      {preset.note && <p className="text-[11px] text-muted mb-3 italic">{preset.note}</p>}
      <PlanProblems problems={problems} />
      {preset.specChoice ? (
        <div className="flex gap-2 mt-2">
          <Button className="flex-1" disabled={busy} onClick={() => apply('alpha')}>
            Add with Alpha
          </Button>
          <Button className="flex-1" variant="secondary" disabled={busy} onClick={() => apply('bravo')}>
            Add with Bravo
          </Button>
        </div>
      ) : (
        <Button className="w-full mt-2" disabled={busy || planHasErrors(problems)} onClick={() => apply()}>
          Add {preset.name}
        </Button>
      )}
    </Card>
  )
}
