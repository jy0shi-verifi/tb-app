import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footprints, Dumbbell, CalendarCheck } from 'lucide-react'
import { saveSettings } from '../db'
import { defaultPlan, mondayOnOrBefore } from '../program'
import { nextMonday, parseISO, prettyDate } from '../lib/date'
import { Button, Card, SegmentedPicker, Wordmark, CoinGlyph } from '../components/ui'
import type { DbIncrement } from '../types'

/**
 * Which programme a new install starts on.
 *
 * Onboarding used to be Beginner-only copy with no choice at all, so a fresh
 * install never heard the words "Grey Man" — reaching MASS meant knowing to open
 * Settings and change a dropdown (audit code-03 F4). Since MASS is the whole
 * point of the rebuild, that is the first thing it should ask.
 */
type Choice = 'gm' | 'beginner'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [start, setStart] = useState(nextMonday())
  const [increment, setIncrement] = useState<DbIncrement>(2)
  const [choice, setChoice] = useState<Choice>('gm')
  const [saving, setSaving] = useState(false)
  // Onboarding is rendered by App, which sits INSIDE BrowserRouter, so it has a
  // router even though it is not itself a route.
  const nav = useNavigate()

  async function finish() {
    setSaving(true)
    try {
      // A plan start is a Monday or it rotates the whole training week (A16).
      const monday = mondayOnOrBefore(start)
      if (choice === 'gm') {
        await saveSettings({
          currentPhaseId: 'gm',
          phaseStartDate: monday,
          // Straight onto the book's Standard Cycle, truncated where Specificity
          // would begin (p.140) — see docs/mass-design.md §11.3.
          plan: defaultPlan(monday),
          dbIncrement: increment,
          onboarded: true,
        })
        // Grey Man cannot prescribe a single weight without 1RMs, so land on the
        // screen that collects them rather than on a Today full of honest gaps.
        //
        // A real navigate, not `history.replaceState`: the Router mounted at '/'
        // when the app started and does not observe replaceState, so the URL
        // changed while `<Routes>` went on rendering Today — which an e2e caught.
        nav('/maxes')
      } else {
        await saveSettings({
          currentPhaseId: 'beginner',
          phaseStartDate: monday,
          dbIncrement: increment,
          onboarded: true,
        })
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
          aria-valuemax={3}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of 3`}
        >
          {[0, 1, 2].map((i) => (
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
              <p className="eyebrow text-brand-ink">Your program</p>
              <h1 className="display-hero text-ink text-4xl mt-1">
                Your training,
                <br />
                handled.
              </h1>
            </div>
            <p className="text-muted mt-3 leading-relaxed">
              This app runs your training for you — it tells you exactly what to do each morning
              and tracks every weight. You just show up.
            </p>

            <div className="space-y-3 mt-6">
              <Card className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-chip bg-accent/15 text-accent-ink shrink-0">
                  <Footprints size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Running: your own plan</p>
                  <p className="text-sm text-muted">
                    Follow your Runna plan — runs log themselves here automatically once they sync
                    from Strava.
                  </p>
                </div>
              </Card>
              <Card className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-chip bg-brand/12 text-brand-ink shrink-0">
                  <Dumbbell size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Lifting: three days a week</p>
                  <p className="text-sm text-muted">
                    Two dumbbell sessions that alternate, 3 sets of 8–12. Clear all three sets at 12
                    and the app adds weight for you — no thinking required.
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex-1" />
            <Button className="w-full text-lg min-h-[3.5rem] mt-6" onClick={() => setStep(1)}>
              Get started
            </Button>
          </div>
        ) : step === 1 ? (
          <ProgrammeStep
            choice={choice}
            setChoice={setChoice}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
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
                <p className="text-xs text-muted mt-2">
                  Defaults to next Monday — {prettyDate(parseISO(start))}. A block starts on a
                  Monday; anything else rotates the whole training week.
                </p>
              </div>

              <div>
                <p className="font-semibold text-ink mb-2">
                  What's the smallest jump on your dumbbells?
                </p>
                <SegmentedPicker
                  label="What's the smallest jump on your dumbbells?"
                  value={String(increment)}
                  onChange={(v) => setIncrement(Number(v) as DbIncrement)}
                  options={[
                    { v: '2', label: '2 kg' },
                    { v: '1', label: '1 kg (magnets)' },
                  ]}
                />
                {choice === 'gm' && (
                  <p className="text-xs text-muted mt-2">
                    Grey Man is a barbell programme, but your supplementary cluster can use
                    dumbbells (p.49).
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1" />
            <Button className="w-full text-lg min-h-[3.5rem] mt-6" onClick={finish} loading={saving}>
              Let's go →
            </Button>
            <Button variant="ghost" className="w-full text-sm mt-1" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The programme choice — audit code-03 F4.
 *
 * A fresh install never heard the words "Grey Man": onboarding was Beginner-only
 * copy with no choice, and reaching MASS meant knowing to open Settings and
 * change a dropdown. Since MASS *is* the rebuild, it leads — but Beginner stays
 * a first-class option, because it is what runs without a barbell and rack.
 */
function ProgrammeStep({
  choice,
  setChoice,
  onNext,
  onBack,
}: {
  choice: Choice
  setChoice: (c: Choice) => void
  onNext: () => void
  onBack: () => void
}) {
  const opt = (
    id: Choice,
    name: string,
    kit: string,
    body: string,
    cite: string,
    Icon: typeof Dumbbell,
  ) => (
    <button
      key={id}
      onClick={() => setChoice(id)}
      aria-pressed={choice === id}
      className={`w-full text-left rounded-card p-4 border transition ${
        choice === id
          ? 'border-brand bg-brand/5'
          : 'border-line bg-[var(--color-surface-sunk)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center justify-center w-10 h-10 rounded-chip shrink-0 ${
            choice === id ? 'bg-brand/15 text-brand-ink' : 'bg-surface text-muted'
          }`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{name}</p>
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide">{kit}</p>
          <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
          <p className="text-[11px] text-muted mt-1">{cite}</p>
        </div>
      </div>
    </button>
  )

  return (
    <div className="flex-1 flex flex-col stagger mt-6">
      <div>
        <p className="eyebrow text-brand-ink">Choose your programme</p>
        <h1 className="display-hero text-ink text-3xl mt-1">What are you running?</h1>
        <p className="text-muted mt-2 text-sm">You can switch later in Settings.</p>
      </div>

      <div className="space-y-3 mt-6">
        {opt(
          'gm',
          'Grey Man',
          'Barbell + rack',
          'Tactical Barbell’s Mass Protocol. Two main lifts a day on Mon/Wed/Fri, alternating A/B, plus a supplementary cluster you build yourself. Every weight comes off your 1RMs.',
          'MASS pp.48–53 · 3-week blocks (p.40)',
          Dumbbell,
        )}
        {opt(
          'beginner',
          'Beginner Mode',
          'Dumbbells + bench',
          'Two alternating dumbbell sessions, 3 sets of 8–12. Clear all three sets at 12 and the app adds weight for you. Running stays yours — Runna sessions log themselves via Strava.',
          'Not from the book — the fallback for training without a barbell',
          Footprints,
        )}
      </div>

      {choice === 'gm' && (
        <Card className="mt-4">
          <p className="text-xs text-muted">
            Next you’ll set your <b>1RMs</b>. Grey Man can’t prescribe a single weight without them —
            test a 2–3 rep set per lift and the app works the rest out (p.63, p.90).
          </p>
        </Card>
      )}

      <div className="flex-1" />
      <Button className="w-full text-lg min-h-[3.5rem] mt-6" onClick={onNext}>
        Continue
      </Button>
      <Button variant="ghost" className="w-full text-sm mt-1" onClick={onBack}>
        Back
      </Button>
    </div>
  )
}
