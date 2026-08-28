import { useState, type DragEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  PLAN_BLOCK_PROTOCOLS,
  PROTOCOLS,
  blockWeeksOf,
  planWeeks,
  protocolFor,
  type PlannedBlock,
} from '../program'
import { PLAN_PRESETS, planHasErrors, presetBlocks, validatePlan, type PlanPreset } from '../lib/planRules'
import {
  appendStartingOn,
  calendarWeeks,
  insertOffBefore,
  monthsInView,
  protocolColor,
  protocolShort,
  weeksCovered,
} from '../lib/planCalendar'
import PlanProblems from './PlanProblems'
import { addDays, isoDate, mondayIndex, parseISO, prettyDate } from '../lib/date'
import { Button } from './ui'

const HORIZON = 52

export default function PlanYear({
  blocks,
  startDate,
  storedStart,
  activeBlockIndex,
  onWrite,
  onClear,
}: {
  blocks: PlannedBlock[]
  startDate: string
  storedStart?: string
  activeBlockIndex: number
  onWrite: (next: PlannedBlock[], start?: string) => void
  onClear: () => void
}) {
  const [offWeeks, setOffWeeks] = useState(2)
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [placing, setPlacing] = useState<'gm' | 'bridge' | 'alpha' | 'bravo' | 'off'>('gm')

  const problems = validatePlan(blocks, (id) => protocolFor(id), storedStart, (d) =>
    mondayIndex(parseISO(d)),
  )
  const general = blocks.filter((b) => protocolFor(b.protocolId).family === 'general').length
  const spec = blocks.filter((b) => protocolFor(b.protocolId).family === 'specificity').length
  const weeks = planWeeks(blocks)
  const end = weeks > 0 ? isoDate(addDays(parseISO(startDate), weeks * 7 - 1)) : startDate
  const horizon = Math.max(HORIZON, weeks + 8)
  const cells = calendarWeeks(startDate, blocks, horizon)
  const months = monthsInView(startDate, horizon)

  const add = (protocolId: string) =>
    onWrite([...blocks, { protocolId, weeks: PROTOCOLS[protocolId]?.blockWeeks || (protocolId === 'off' ? offWeeks : 3) }])

  const move = (i: number, by: number) => {
    const j = i + by
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    onWrite(next)
  }

  const remove = (i: number) => {
    const p = protocolFor(blocks[i].protocolId)
    if (!window.confirm(`Remove ${p.name} (${blockWeeksOf(blocks[i])} weeks) from the year?`)) return
    const next = blocks.filter((_, j) => j !== i)
    if (next.length === 0) {
      if (!window.confirm('That empties the plan. Every day will have nothing to run until you add blocks again.'))
        return
    }
    onWrite(next)
    setSelected(null)
  }

  const onDropWeek = (weekIndex: number) => {
    if (dragging == null) return
    const from = dragging
    setDragging(null)
    const cell = cells[weekIndex]
    if (!cell) return
    const moving = blocks[from]
    if (!moving) return
    const without = blocks.filter((_, i) => i !== from)
    if (cell.blockIndex == null) {
      onWrite(appendStartingOn(without, startDate, cell.monday, moving))
      return
    }
    let insertAt = cell.blockIndex
    if (from < insertAt) insertAt -= 1
    if (!cell.blockStart) {
      window.alert('Drop on the first week of a block (or on an empty week) — a 3-week block cannot be split.')
      return
    }
    const next = [...without]
    next.splice(Math.max(0, insertAt), 0, moving)
    onWrite(next)
  }

  const applyPreset = (preset: PlanPreset, spec?: 'alpha' | 'bravo') => {
    onWrite(presetBlocks(preset, spec), startDate)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-muted mb-1">Year calendar</p>
        <p className="text-xs text-muted">
          A <b>block</b> is a 3-week chunk of the same work (p.40). A <b>cycle</b> is a sequence of
          blocks you lay out here. Drag a coloured bar onto a week, or tap an empty week after the
          plan ends to drop the next piece. Time off shifts everything after it — use it for a
          holiday.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Starts</span>
        <input
          type="date"
          aria-label="Plan start date"
          value={storedStart ?? startDate}
          onChange={(e) => onWrite(blocks, e.target.value)}
          className="rounded-field bg-[var(--color-surface-sunk)] border border-[var(--color-field-border)] px-2 py-2 text-ink min-h-11"
        />
        {weeks > 0 && <span>→ {prettyDate(parseISO(end))}</span>}
      </div>

      {weeks > 0 && (
        <p className="text-xs text-muted">
          {weeks} weeks · General {general} : Specificity {spec} (Bridge and time off don’t count) ·
          2:1 is the author’s balanced long-term option (p.142)
        </p>
      )}

      <div className="rounded-card border border-line overflow-hidden">
        {months.map((m) => (
          <div key={m.label} className="border-b border-line/60 last:border-0">
            <p className="text-[10px] uppercase tracking-wide text-muted px-2 pt-1.5 pb-0.5">{m.label}</p>
            <div
              className="grid gap-px px-2 pb-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(m.weeks, 6)}, minmax(0, 1fr))` }}
            >
              {cells.slice(m.startWeek, m.startWeek + m.weeks).map((c) => {
                const active = c.blockIndex != null && c.blockIndex === activeBlockIndex
                const sel = c.blockIndex != null && c.blockIndex === selected
                return (
                  <button
                    key={c.weekIndex}
                    type="button"
                    draggable={c.blockIndex != null}
                    onDragStart={() => setDragging(c.blockIndex)}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e: DragEvent) => e.preventDefault()}
                    onDrop={() => onDropWeek(c.weekIndex)}
                    onClick={() => {
                      if (c.blockIndex != null) {
                        setSelected(c.blockIndex)
                        return
                      }
                      const piece: PlannedBlock = {
                        protocolId: placing,
                        weeks: placing === 'bridge' ? 1 : placing === 'off' ? offWeeks : 3,
                      }
                      onWrite(appendStartingOn(blocks, startDate, c.monday, piece))
                    }}
                    title={`${c.monday}${c.protocolId ? ` · ${protocolShort(c.protocolId)}` : ' · empty'}`}
                    className={`min-h-11 rounded-sm text-[9px] font-bold leading-tight px-0.5 py-1 text-left ${
                      c.protocolId
                        ? 'text-white'
                        : 'text-muted border border-dashed border-line bg-[var(--color-surface-sunk)]'
                    } ${active ? 'ring-2 ring-ink' : ''} ${sel ? 'outline outline-2 outline-brand' : ''}`}
                    style={c.protocolId ? { background: protocolColor(c.protocolId), opacity: c.blockStart ? 1 : 0.85 } : undefined}
                  >
                    {c.blockStart ? protocolShort(c.protocolId ?? '') : c.protocolId ? '' : '+'}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted">
            No year laid out yet. Apply a starting sequence, then drag and insert time off until the
            dates match real life.
          </p>
          <Button onClick={() => applyPreset(PLAN_PRESETS[0])}>Paint a Grey Man year</Button>
        </div>
      )}

      {selected != null && blocks[selected] && (
        <div className="rounded-field bg-[var(--color-surface-sunk)] p-3 space-y-2">
          <p className="font-medium text-ink text-[15px]">
            {protocolFor(blocks[selected].protocolId).name} · {blockWeeksOf(blocks[selected])} weeks
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 px-3 rounded-pill bg-surface text-ink text-[12px] font-bold" onClick={() => move(selected, -1)}>
              Earlier
            </button>
            <button type="button" className="min-h-11 px-3 rounded-pill bg-surface text-ink text-[12px] font-bold" onClick={() => move(selected, 1)}>
              Later
            </button>
            <button
              type="button"
              className="min-h-11 px-3 rounded-pill bg-surface text-ink text-[12px] font-bold"
              onClick={() => {
                onWrite(insertOffBefore(blocks, selected, offWeeks))
                setSelected(selected + 1)
              }}
            >
              Time off before
            </button>
            <button type="button" className="min-h-11 px-3 rounded-pill text-muted text-[12px] font-bold" onClick={() => remove(selected)}>
              Remove
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            Time-off length
            <input
              type="number"
              min={1}
              max={12}
              value={offWeeks}
              onChange={(e) => setOffWeeks(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-field border border-[var(--color-field-border)] bg-surface px-2 py-2 text-ink min-h-11"
            />
            weeks
          </label>
        </div>
      )}

      {problems.length > 0 && (
        <div>
          <PlanProblems problems={problems} />
          {planHasErrors(problems) && (
            <p className="text-[11px] text-muted mt-2">
              Fix the blocked items — the book states those. The rest are advice; the plan will run
              either way.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="eyebrow text-muted mb-2">Empty week places</p>
        <p className="text-[11px] text-muted mb-2">Tap a dashed week to drop this, filling any gap with time off.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['gm', 'bridge', 'alpha', 'bravo', 'off'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlacing(id)}
              className={`rounded-pill text-[12px] font-bold px-3 min-h-11 ${
                placing === id ? 'bg-brand/15 text-brand-ink' : 'bg-[var(--color-surface-sunk)] text-muted'
              }`}
            >
              {protocolShort(id)}
            </button>
          ))}
        </div>
        <p className="eyebrow text-muted mb-2">Add to the end</p>
        <div className="flex flex-wrap gap-2">
          {PLAN_BLOCK_PROTOCOLS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p.id)}
              className="inline-flex items-center gap-1 rounded-pill bg-brand/10 text-brand-ink text-[12px] font-bold px-3 min-h-11"
            >
              <Plus size={14} /> {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => add('bridge')}
            className="inline-flex items-center gap-1 rounded-pill bg-[var(--color-surface-sunk)] text-muted text-[12px] font-bold px-3 min-h-11"
          >
            <Plus size={14} /> Bridge week
          </button>
          <button
            type="button"
            onClick={() => add('off')}
            className="inline-flex items-center gap-1 rounded-pill bg-[var(--color-surface-sunk)] text-muted text-[12px] font-bold px-3 min-h-11"
          >
            <Plus size={14} /> Time off
          </button>
        </div>
      </div>

      <div>
        <p className="eyebrow text-muted mb-2">Starting sequences</p>
        <div className="space-y-2">
          {PLAN_PRESETS.map((preset) => (
            <div key={preset.id} className="rounded-field border border-line p-3">
              <p className="font-medium text-ink text-[15px]">{preset.name}</p>
              <p className="text-xs text-muted mt-0.5">{preset.goal}</p>
              <p className="text-[11px] text-muted mt-1">
                {preset.specChoice
                  ? `${preset.slots.length} blocks after you pick Alpha or Bravo`
                  : `${weeksCovered(presetBlocks(preset))} weeks`}{' '}
                · {preset.cite}
              </p>
              {preset.note && <p className="text-[11px] text-muted italic mt-1">{preset.note}</p>}
              {preset.specChoice ? (
                <div className="flex gap-2 mt-2">
                  <Button className="flex-1" onClick={() => applyPreset(preset, 'alpha')}>
                    Use with Alpha
                  </Button>
                  <Button className="flex-1" variant="secondary" onClick={() => applyPreset(preset, 'bravo')}>
                    Use with Bravo
                  </Button>
                </div>
              ) : (
                <Button className="w-full mt-2" variant="secondary" onClick={() => applyPreset(preset)}>
                  Apply
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {blocks.length > 0 && (
        <button type="button" onClick={onClear} className="text-[12px] font-bold text-muted min-h-11">
          Clear plan
        </button>
      )}
    </div>
  )
}
