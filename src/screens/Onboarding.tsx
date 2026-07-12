import { useState } from 'react'
import { Footprints, Dumbbell, CalendarCheck } from 'lucide-react'
import { saveSettings } from '../db'
import { nextMonday, parseISO, prettyDate } from '../lib/date'
import { Button, Card, SegmentedPicker, Wordmark, CoinGlyph } from '../components/ui'
import type { DbIncrement } from '../types'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [start, setStart] = useState(nextMonday())
  const [increment, setIncrement] = useState<DbIncrement>(2)
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      await saveSettings({ phaseStartDate: start, dbIncrement: increment, onboarded: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col safe-top safe-bottom">
      <div className="flex-1 w-full max-w-xl mx-auto px-5 py-6 flex flex-col">
        {/* Branded hero */}
        <Card elev="hero" pad="lg" className="topo-hero text-white overflow-hidden flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow hero-text" style={{ color: 'var(--color-gold)' }}>
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
              <p className="eyebrow text-brand-ink">Your programme</p>
              <h1 className="display-hero text-ink text-4xl mt-1">
                Your training,
                <br />
                handled.
              </h1>
            </div>
            <p className="text-muted mt-3 leading-relaxed">
              This app runs your Tactical Barbell plan for you — it tells you exactly what to do each
              morning and works out every weight. You just show up.
            </p>

            <div className="space-y-3 mt-6">
              <Card className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-chip bg-accent/15 text-accent-ink shrink-0">
                  <Footprints size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink">First: Base Building</p>
                  <p className="text-sm text-muted">
                    8 weeks of easy runs and light circuits to rebuild your engine — before we load
                    the bar.
                  </p>
                </div>
              </Card>
              <Card className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-chip bg-brand/12 text-brand-ink shrink-0">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Then: lifting (called "Operator")</p>
                  <p className="text-sm text-muted">
                    At the end you'll do a Test Day, pop in your numbers, and the app works out every
                    weight for you — no thinking required.
                  </p>
                </div>
              </Card>
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
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-field border border-line bg-[var(--color-surface-sunk)] px-4 py-3 font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
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
