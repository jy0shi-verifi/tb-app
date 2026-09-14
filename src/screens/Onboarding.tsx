import { useState } from 'react'
import { Footprints, Dumbbell, CalendarCheck, Check } from 'lucide-react'
import { saveSettings } from '../db'
import { defaultBeginnerWeights } from '../beginner'
import { defaultAbcWeights } from '../abc'
import { nextMonday, parseISO, prettyDate } from '../lib/date'
import { Button, Card, SegmentedPicker, Wordmark, CoinGlyph } from '../components/ui'
import type { DbIncrement } from '../types'

type Program = 'tb' | 'beginner' | 'abc'

const PROGRAMS: { id: Program; name: string; desc: string; Icon: typeof Dumbbell }[] = [
  {
    id: 'tb',
    name: 'Tactical Barbell',
    desc: 'Base Building → Operator. The full periodised plan — rebuild your engine, then lift.',
    Icon: Dumbbell,
  },
  {
    id: 'beginner',
    name: 'Beginner',
    desc: 'Dumbbell Linear Progression + Couch-to-5K. A gentler on-ramp from scratch.',
    Icon: Footprints,
  },
  {
    id: 'abc',
    name: 'Dumbbell A/B/C',
    desc: 'A minimalist 3-day dumbbell split (Mon/Wed/Fri) with double progression, plus your Runna runs.',
    Icon: Dumbbell,
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [program, setProgram] = useState<Program>('tb')
  const [start, setStart] = useState(nextMonday())
  const [increment, setIncrement] = useState<DbIncrement>(2)
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      const base = { phaseStartDate: start, dbIncrement: increment, onboarded: true }
      if (program === 'beginner') {
        await saveSettings({ ...base, programMode: 'beginner', currentPhaseId: 'beginner', beginner: { lifts: defaultBeginnerWeights() } })
      } else if (program === 'abc') {
        await saveSettings({ ...base, programMode: 'abc', currentPhaseId: 'abc', abc: { lifts: defaultAbcWeights() } })
      } else {
        await saveSettings({ ...base, programMode: 'tb', currentPhaseId: 'base-building' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col safe-top safe-bottom">
      <div className="flex-1 w-full max-w-xl mx-auto px-5 py-6 flex flex-col">
        {/* Branded hero */}
        <Card elev="hero" pad="lg" className="topo-hero text-white overflow-hidden flex items-center justify-between gap-4 border-white/10">
          <div>
            <p className="eyebrow hero-text text-gold-hi">
              Welcome to
            </p>
            <div className="mt-1">
              <Wordmark size="lg" onDark />
            </div>
          </div>
          <div className="shrink-0 floaty" aria-hidden="true">
            <CoinGlyph size={72} />
          </div>
        </Card>

        {/* Progress */}
        <div
          className="flex gap-1.5 mt-4"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of 2`}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 glam-radiant' : 'w-4 bg-line'
              }`}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="flex-1 flex flex-col stagger mt-6">
            <div>
              <p className="eyebrow text-brand-ink">Choose your program</p>
              <h1 className="display-hero text-ink text-4xl mt-1">
                Your training,
                <br />
                handled.
              </h1>
            </div>
            <p className="text-muted mt-3 leading-relaxed">
              Pick the plan that fits where you are — the app tells you what to do each day and works
              out every weight. You can switch anytime in Settings.
            </p>

            <div className="space-y-3 mt-6" role="radiogroup" aria-label="Choose your program">
              {PROGRAMS.map((p) => {
                const on = program === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setProgram(p.id)}
                    className={`w-full text-left rounded-card border p-4 flex items-start gap-3 transition ${
                      on ? 'border-brand bg-brand/5 elev-1' : 'border-line bg-surface'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-chip shrink-0 ${
                        on ? 'bg-brand/15 text-brand-ink' : 'bg-[var(--color-surface-sunk)] text-muted'
                      }`}
                    >
                      <p.Icon size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink">{p.name}</p>
                      <p className="text-sm text-muted leading-snug">{p.desc}</p>
                    </div>
                    {on && <Check size={18} className="text-brand-ink shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>

            <div className="flex-1" />
            <Button className="w-full text-lg min-h-[3.5rem] mt-6" onClick={() => setStep(1)}>
              Get started
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col stagger mt-6">
            <div>
              <p className="eyebrow text-brand-ink">Almost there</p>
              <h1 className="display-hero text-ink text-3xl mt-1">Two quick things</h1>
              <p className="text-muted mt-2 text-sm">You can change these later in Settings.</p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="font-semibold text-ink mb-2 flex items-center gap-2">
                  <CalendarCheck size={18} className="text-brand" /> When do you want to start?
                </p>
                <input
                  type="date"
                  aria-label="Start date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-field border border-[var(--color-field-border)] bg-[var(--color-surface-sunk)] px-4 py-3 font-semibold text-ink transition"
                />
                <p className="text-xs text-muted mt-2">Defaults to next Monday — {prettyDate(parseISO(start))}.</p>
              </div>

              <div>
                <p className="font-semibold text-ink mb-2">What's the smallest jump on your dumbbells?</p>
                <SegmentedPicker
                  label="What's the smallest jump on your dumbbells?"
                  value={String(increment)}
                  onChange={(v) => setIncrement(Number(v) as DbIncrement)}
                  options={[
                    { v: '2', label: '2 kg' },
                    { v: '1', label: '1 kg (magnets)' },
                  ]}
                />
              </div>
            </div>

            <div className="flex-1" />
            <Button className="w-full text-lg min-h-[3.5rem] mt-6" onClick={finish} loading={saving}>
              Let's go →
            </Button>
            <Button variant="ghost" className="w-full text-sm mt-1" onClick={() => setStep(0)}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
