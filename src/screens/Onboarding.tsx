import { useState } from 'react'
import { Footprints, Dumbbell, CalendarCheck } from 'lucide-react'
import { saveSettings } from '../db'
import { nextMonday, parseISO, prettyDate } from '../lib/date'
import { Button, Card } from '../components/ui'
import type { DbIncrement } from '../types'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [start, setStart] = useState(nextMonday())
  const [increment, setIncrement] = useState<DbIncrement>(2)

  async function finish() {
    await saveSettings({ phaseStartDate: start, dbIncrement: increment, onboarded: true })
  }

  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col safe-top safe-bottom">
      <div className="flex-1 w-full max-w-xl mx-auto px-5 py-8 flex flex-col">
        <p className="text-xs font-bold tracking-widest text-accent">TACTICAL BARBELL</p>

        {step === 0 ? (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-extrabold text-ink mt-4 leading-tight">
              Your training,
              <br />
              handled.
            </h1>
            <p className="text-muted mt-3 leading-relaxed">
              This app runs your Tactical Barbell plan for you — it tells you exactly what to do each
              morning and works out every weight. You just show up.
            </p>

            <div className="space-y-3 mt-6">
              <Card className="p-4 flex items-start gap-3">
                <Footprints className="text-accent mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">First: Base Building</p>
                  <p className="text-sm text-muted">
                    8 weeks of easy runs and light circuits to rebuild your engine — before we load
                    the bar.
                  </p>
                </div>
              </Card>
              <Card className="p-4 flex items-start gap-3">
                <Dumbbell className="text-brand mt-0.5" />
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
            <Button className="w-full text-lg py-4 mt-6" onClick={() => setStep(1)}>
              Get started
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <h1 className="text-2xl font-extrabold text-ink mt-4">Two quick things</h1>
            <p className="text-muted mt-1 text-sm">You can change these later in Settings.</p>

            <div className="mt-6 space-y-5">
              <div>
                <p className="font-semibold text-ink mb-1 flex items-center gap-2">
                  <CalendarCheck size={18} className="text-brand" /> When do you want to start?
                </p>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 font-semibold text-ink"
                />
                <p className="text-xs text-muted mt-1">Defaults to next Monday — {prettyDate(parseISO(start))}.</p>
              </div>

              <div>
                <p className="font-semibold text-ink mb-2">What's the smallest jump on your dumbbells?</p>
                <div className="flex gap-2">
                  {([2, 1] as DbIncrement[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setIncrement(v)}
                      className={`flex-1 rounded-xl py-3 font-semibold border transition ${
                        increment === v
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface text-muted border-line'
                      }`}
                    >
                      {v} kg{v === 1 ? ' (magnets)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1" />
            <Button className="w-full text-lg py-4 mt-6" onClick={finish}>
              Let's go →
            </Button>
            <button onClick={() => setStep(0)} className="w-full text-sm text-muted py-2">
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
