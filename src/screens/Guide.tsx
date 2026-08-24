import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '../components/ui'
import ExerciseDetail from '../components/ExerciseDetail'
import { EXERCISE_INFO } from '../exerciseInfo'

/**
 * The Guide — rewritten from `docs/MASS/MASS-extraction.md` (audit D1).
 *
 * It used to teach Base Building, Operator, the Golden Rule and a training max:
 * a programme this app no longer runs, and in places one Mass Protocol
 * explicitly contradicts — p.63 says the Golden Rule is NOT in effect, and p.65
 * says outright not to compare the two.
 *
 * Every programme claim below carries a page reference, per the fidelity rule in
 * CLAUDE.md. Where something is the app's choice rather than the book's, it says
 * so — Beginner Mode is labelled as not from the book, and the truncated default
 * plan is labelled as a consequence of Specificity not being built.
 */

type Section = { id: string; emoji: string; title: string; body: ReactNode }

/**
 * The moves with form content, in a sensible teaching order.
 *
 * These are all dumbbell/bodyweight: `EXERCISE_INFO` has no entries for the four
 * MASS main lifts, so the list filters them out rather than showing empty cards.
 * Adding barbell form content is tracked in the backlog — inventing it here
 * would be exactly the kind of unverified content this rebuild exists to remove.
 */
const MOVE_ORDER = [
  'DB Bench Press',
  'Two-DB Front-rack Squat',
  '1-Arm DB Row',
  'Pull-up progression',
  'Push-ups',
  'Bodyweight squats',
  'Chest-supported DB row',
  'DB Romanian Deadlift',
  'Back extensions / Supermans',
  'Bicycle crunches',
]

const SECTIONS: Section[] = [
  {
    id: 'what',
    emoji: '🎯',
    title: 'What this programme is',
    body: (
      <>
        <p>
          This app runs <b>Tactical Barbell: Mass Protocol</b> — a hypertrophy programme built on a
          barbell. It rests on three things: <b>lifting</b> for the stimulus, <b>food</b> for the
          material, and <b>conditioning</b> kept light enough not to fight the other two.
        </p>
        <p className="mt-2">
          Mass Protocol has two halves. <b>General</b> builds overall size; <b>Specificity</b> is
          detail work on lagging areas. The book puts it in one line:{' '}
          <i>“General Mass is for building overall size and bulk. Specificity is the detail work.”</i>{' '}
          (p.143)
        </p>
        <p className="mt-2 text-muted">
          The app runs the General side, using the <b>Grey Man</b> template. Specificity isn’t built
          yet.
        </p>
      </>
    ),
  },
  {
    id: 'loop',
    emoji: '📱',
    title: 'How to use this app (the daily loop)',
    body: (
      <>
        <p>
          Open it in the morning. <b>Today</b> tells you what the session is and every weight, worked
          out from your 1RMs. Tap in, tick sets off as you go, and the rest timer starts itself.
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>
            <b>1RM maxes</b> (Settings → 1RM maxes) is where every weight comes from. Nothing works
            without them.
          </li>
          <li>
            <b>Block plan</b> (Settings → Block plan) sequences your blocks, builds your
            supplementary cluster and picks your conditioning days.
          </li>
          <li>
            When a block ends, the app asks whether to <b>add weight to your 1RMs</b>. That prompt
            <i> is</i> the programme — see “Getting stronger” below.
          </li>
          <li>
            When a whole cycle ends, it asks what to run next — which is what the book asks you to do
            at that point (p.140).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'greyman',
    emoji: '🏋️',
    title: 'Grey Man — the week',
    body: (
      <>
        <p>
          Three lifting days: <b>Monday, Wednesday, Friday</b> (p.50). Each day trains two main lifts
          plus a supplementary group, and the two days alternate:
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>
            <b>Day A</b> — Bench Press + Squat, then your <b>S1</b> exercises
          </li>
          <li>
            <b>Day B</b> — Overhead Press + Deadlift, then your <b>S2</b> exercises
          </li>
        </ul>
        <p className="mt-2">
          They alternate strictly — A, B, A, B… — so Monday is A one week and B the next. That is why
          the pattern looks like it repeats fortnightly (p.50).
        </p>
        <p className="mt-2">
          The <b>main cluster is fixed</b>, “the same for everyone” (p.48). The <b>S cluster is
          yours</b>: pick <b>4 to 6 exercises, no more</b>, split across S1 and S2 (p.49). Dumbbells,
          barbells, kettlebells and bodyweight all qualify; for a pure mass result the author
          suggests sticking to conventional dumbbell and barbell work.
        </p>
      </>
    ),
  },
  {
    id: 'grid',
    emoji: '📊',
    title: 'The three weeks of a block',
    body: (
      <>
        <p>
          A block is <b>three weeks</b> (p.40). Load climbs, reps fall — and the supplementary work
          runs on its own, lighter numbers (p.51):
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-bold">Week</th>
                <th className="py-1 pr-3 font-bold">Main lifts</th>
                <th className="py-1 font-bold">Supplementary</th>
              </tr>
            </thead>
            <tbody className="num-display text-ink">
              <tr className="border-t border-line/60">
                <td className="py-1.5 pr-3">1</td>
                <td className="py-1.5 pr-3">4–5 × 8 @ 70%</td>
                <td className="py-1.5">4 × 12 @ 55%</td>
              </tr>
              <tr className="border-t border-line/60">
                <td className="py-1.5 pr-3">2</td>
                <td className="py-1.5 pr-3">4–5 × 6 @ 75%</td>
                <td className="py-1.5">4 × 10 @ 60%</td>
              </tr>
              <tr className="border-t border-line/60">
                <td className="py-1.5 pr-3">3</td>
                <td className="py-1.5 pr-3">4–5 × 3 @ 80%</td>
                <td className="py-1.5">4 × 8 @ 65%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Percentages are of your <b>1 rep max</b> — there is no training max in this programme. Four
          sets is the default; the book’s own walkthrough says “4 sets of 8/70%” (p.52). The fifth is
          there for a day you feel good.
        </p>
        <p className="mt-2 text-muted">
          There’s no deload inside a block. After week 3 you add weight to your 1RMs and run the same
          three weeks again (p.53).
        </p>
      </>
    ),
  },
  {
    id: 'execution',
    emoji: '⏱️',
    title: 'How to run a session',
    body: (
      <>
        <ul className="list-disc list-inside flex flex-col gap-1.5">
          <li>
            <b>Both main lifts first</b>, then the supplementary work (p.50).
          </li>
          <li>
            All sets of one exercise before moving to the next (p.52). The order of the exercises
            themselves is yours — <i>“Ultimately it doesn’t matter – it’s entirely up to you.”</i>{' '}
            (p.63)
          </li>
          <li>
            <b>Rest 2–5 minutes</b> between main sets, longer if you need it; 3–5 minutes is the
            sweet spot on heavier days (pp.63–64). <b>1–2 minutes</b> on supplementary work, and you
            may superset it (p.53).
          </li>
          <li>
            <b>The Golden Rule from TB1 doesn’t apply here.</b> <i>“This isn’t Operator template or
            Tactical Barbell I.”</i> (p.63)
          </li>
          <li>
            Finish all the reps <b>without going to failure</b>. A little struggle on the last couple
            is fine, so long as you complete them (pp.52, 64).
          </li>
        </ul>
        <p className="mt-3">
          <b>Failing reps?</b> In this order: lengthen the rest to five minutes or more first; only
          if you’re <i>still</i> failing consistently, drop that lift’s 1RM by 10% and recalculate
          (pp.52–53). The app has a button for the second step, on the lift itself.
        </p>
      </>
    ),
  },
  {
    id: 'maxes',
    emoji: '🧮',
    title: 'Testing your 1RMs',
    body: (
      <>
        <p>
          Every weight comes off a 1RM, so they have to exist before a block starts.{' '}
          <i>“Calculate 1 rep maximums for all exercises in your cluster prior to beginning… a 2-3
          rep maximum to calculate a 1RM is fine. But DO test. Don’t guess.”</i> (p.63)
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>
            <b>You never have to lift a true single.</b> Enter a 2–3 rep set and the app estimates
            the 1RM (p.90).
          </li>
          <li>
            Test in one session or over two, then <b>take two or three days off</b> before starting
            the block (p.63).
          </li>
          <li>
            <b>Start conservative.</b> <i>“Whatever you do, DON’T start too heavy or overestimate
            your 1RMs.”</i> (p.64)
          </li>
          <li>
            <b>Bodyweight exercises</b> use max REPS instead of a weight — 55% of a 20-rep max is 11
            reps, not a load (p.90).
          </li>
          <li>
            <b>Weighted bodyweight</b> (dips, weighted pull-ups) puts your bodyweight inside the sum,
            so set your weight in Settings or the app can’t work it out (p.90).
          </li>
        </ul>
        <p className="mt-2 text-muted">
          You don’t retest on a schedule — only when changing phase or adding a new exercise (p.90).
        </p>
      </>
    ),
  },
  {
    id: 'progression',
    emoji: '📈',
    title: 'Getting stronger: Forced Progression',
    body: (
      <>
        <p>This is the mechanism the whole protocol runs on, and it’s one sentence:</p>
        <p className="mt-2">
          <i>“Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don’t force
          progression for exercises you struggled with — use the same numbers for the next block.”</i>{' '}
          (p.53)
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>
            5–10 lb is about <b>2.5–4.5 kg</b>. The app suggests 2.5 and lets you change it.
          </li>
          <li>
            Anything you tapped <b>“Struggled with this”</b> on during the block is left alone. That’s
            the second half of the rule, not a courtesy.
          </li>
          <li>
            <b>You don’t retest.</b> The stored 1RM drifts upward and every weight follows from it
            (p.90).
          </li>
        </ul>
        <p className="mt-3 text-muted">
          Early blocks are <i>meant</i> to feel light. <i>“Your very first block is like practice +
          work-capacity-building with lighter weight.”</i> (p.64)
        </p>
      </>
    ),
  },
  {
    id: 'extra',
    emoji: '🚫',
    title: 'What NOT to add',
    body: (
      <>
        <p>
          <i>“Avoid extra work in the gym during General. No bicep curls, no donkey calf raises, no
          bodyweight work, nothing. If you have surplus energy to burn – add extra sets to your main
          lifts.”</i> (pp.64–65)
        </p>
        <p className="mt-2">
          That’s why the app has a <b>+ Set</b> button and no accessories screen. The extra set is the
          sanctioned outlet.
        </p>
        <p className="mt-2">
          <b>Core work is the exception</b> — bodyweight ab and lower-back work is allowed: hanging
          leg raises, hyperextensions, face-pulls, ab roller (p.65). It doesn’t need a slot in your
          supplementary cluster.
        </p>
      </>
    ),
  },
  {
    id: 'conditioning',
    emoji: '🥾',
    title: 'Conditioning: keep it green',
    body: (
      <>
        <p>
          Conditioning here exists to <b>support</b> muscle gain, not to burn calories. General
          blocks use the <b>Green</b> sessions — walk, ruck, recovery run, endurance predator (p.20,
          p.98).
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>
            <b>1 to 3 Green sessions a week, no more than 3</b>, and they may sit on lifting days or
            non-lifting days (p.99).
          </li>
          <li>
            <b>Green shouldn’t exceed 60 minutes</b> (p.111). Individual sessions cap tighter — a
            recovery run stops at 30 minutes, 20 if you’re a hardgainer (p.102).
          </li>
          <li>
            <b>Your own running counts.</b> <i>“Anytime you do that extra-curricular activity it
            counts as one conditioning session. Cross off one Green/Black session for that week.”</i>{' '}
            (p.110) Under MASS your cardio <i>is</i> the Green work above, so this is about anything on
            top of it — and the Plan screen totals up whatever Strava sends, scheduled or not.
          </li>
          <li>
            A <b>10-minute easy run either side of a lift doesn’t count</b> — two of them still count
            as zero (p.102).
          </li>
        </ul>
        <p className="mt-2 text-muted">
          Black sessions (sprints, hill sprints, Reset-20, Fobbits) belong to Specificity and stay on
          non-lifting days (p.99). They arrive when Specificity does.
        </p>
      </>
    ),
  },
  {
    id: 'blocks',
    emoji: '🗓️',
    title: 'Blocks, bridges and cycles',
    body: (
      <>
        <p>
          Everything is built from <b>3-week blocks</b> (p.40). A longer stint of General is{' '}
          <i>more blocks</i>, never a longer one. The book’s recommended first cycle (p.140):
        </p>
        <p className="mt-2 text-ink">
          General 6 weeks → General 6 weeks → Bridge 1 week → Specificity 3 weeks → Specificity 3
          weeks
        </p>
        <p className="mt-2 text-muted">
          Specificity isn’t built yet, so the app’s default plan runs the four General blocks and the
          bridge week, then asks what to do next.
        </p>
        <p className="mt-3">
          <b>Bridge Week</b> is a week off between blocks: deload, let the work come to fruition, and
          test 1RMs if the next block needs it (p.92). The author suggests one every two to three
          months — and if you need a few more days, take them.{' '}
          <i>“Too much rest is better than not enough.”</i> (p.147)
        </p>
        <p className="mt-2">
          After a full cycle, reassess the balance of General and Specificity. The long-term default
          the author calls a “solid balanced approach” is <b>2:1 General to Specificity</b>, and{' '}
          <i>“spend more time in General the farther away you are from your target weight”</i>{' '}
          (pp.141–142).
        </p>
      </>
    ),
  },
  {
    id: 'food',
    emoji: '🍚',
    title: 'Food — where most people fail',
    body: (
      <>
        <p>
          The book is blunt:{' '}
          <i>“Nutrition is usually where the average bear fails – not time spent in the gym or on the
          road.”</i> (p.132)
        </p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 mt-2">
          <li>You can’t add muscle without a calorie surplus. Track it.</li>
          <li>
            Stay on top of protein, and if you do extra activity, eat back what it cost you{' '}
            <i>and then some</i> (p.110).
          </li>
          <li>
            <b>Don’t cut during a rest week.</b> <i>“Do NOT drop or change your calorie/macro intake
            during rest periods.”</i> (p.147)
          </li>
        </ul>
        <p className="mt-2 text-muted">
          The book gives two calorie/macro formulas (pp.120–121). The app doesn’t calculate them —
          use MacroFactor and the book’s own chapter.
        </p>
      </>
    ),
  },
  {
    id: 'base',
    emoji: '🏃',
    title: 'Do I need Base Building first?',
    body: (
      <>
        <p>
          <b>No.</b> <i>“If you already have a current/established endurance base of some kind, (i.e.
          runner…) feel free to skip it.”</i> (p.18) — and the FAQ agrees: <i>“No. Base Building is
          optional…”</i> (p.151)
        </p>
        <p className="mt-2 text-muted">
          Worth knowing what it’s actually for, though: not cardio. Its strength-endurance work
          prepares connective tissue for heavy barbell work. If you’re coming off a long layoff
          rather than off a running plan, that argument carries more weight.
        </p>
      </>
    ),
  },
  {
    id: 'beginner',
    emoji: '🔩',
    title: 'Beginner Mode (no barbell yet?)',
    body: (
      <>
        <p>
          Beginner Mode is <b>not from the book</b>. It’s the fallback for training without a barbell
          and rack: two alternating dumbbell sessions, <b>3 sets of 8–12</b>, and when you clear all
          three sets at 12 the app adds 2 kg for you.
        </p>
        <p className="mt-2">
          Switch between it and Grey Man in Settings → Programme. They keep entirely separate maxes,
          because Beginner’s weights are <b>per dumbbell</b> and Grey Man’s are <b>total on the
          bar</b> — letting those meet would be wrong by a factor of two on every set.
        </p>
      </>
    ),
  },
  {
    id: 'moves',
    emoji: '🎥',
    title: 'The lifts & moves — form videos',
    body: (
      <div className="flex flex-col gap-4">
        <p className="text-muted">
          Tap “Watch a form video” on any move (you can also tap a move mid-session for the same).
        </p>
        {MOVE_ORDER.filter((n) => EXERCISE_INFO[n]).map((name) => (
          <div key={name} className="border-t border-line/60 pt-3">
            <p className="font-bold text-ink mb-2">{name}</p>
            <ExerciseDetail name={name} info={EXERCISE_INFO[name]} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'trouble',
    emoji: '🤔',
    title: 'Bad day? Common questions',
    body: (
      <ul className="list-disc list-inside flex flex-col gap-1.5">
        <li>
          <b>Missed a day?</b> Nothing’s lost — open it the next morning and carry on. Your streak
          tolerates short gaps, and rest days won’t break it.
        </li>
        <li>
          <b>Missed a chunk / been away?</b> The app eases you back in rather than dropping you into
          a heavy week — follow what Today says.
        </li>
        <li>
          <b>The weights feel too light?</b> Early blocks are supposed to.{' '}
          <i>“That’s normal and desirable… we’re starting light to build work capacity.”</i> (p.64)
          If you genuinely have energy left, add a set — don’t add exercises (pp.64–65).
        </li>
        <li>
          <b>Failing reps?</b> Rest five minutes or more first. Only if you’re still failing, use the
          “Drop 1RM 10%” button on that lift (pp.52–53).
        </li>
        <li>
          <b>Had a hard block on one lift?</b> Tap <b>“Struggled with this”</b> on it. When the block
          ends, the app will leave that 1RM alone (p.53).
        </li>
        <li>
          <b>Need more than a bridge week?</b> Take it — <i>“Too much rest is better than not
          enough”</i> — but don’t drop your calories while you do (p.147).
        </li>
        <li>
          <b>Tapped the wrong thing?</b> Re-open the session to edit, or delete the log from History.
        </li>
        <li>
          <b>Something actually hurts</b> (not normal soreness)? Back off and get it looked at — no
          session is worth an injury.
        </li>
      </ul>
    ),
  },
]

export default function Guide() {
  const [open, setOpen] = useState<string | null>('what')

  return (
    <div className="flex flex-col gap-3 stagger">
      <Card elev="hero" pad="lg" className="topo-hero text-white">
        <h2 className="display-hero text-2xl text-white hero-text">Your TB guide</h2>
        <p className="text-white/90 text-sm mt-1 hero-text">
          Mass Protocol in plain English, with the page it comes from. Tap a topic.
        </p>
      </Card>

      {SECTIONS.map((s) => {
        const isOpen = open === s.id
        return (
          <Card key={s.id} pad="none" className="overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : s.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 p-4 text-left min-h-11"
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="flex-1 font-bold text-ink">{s.title}</span>
              <ChevronDown
                size={18}
                className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && <div className="px-4 pb-4 text-sm text-ink">{s.body}</div>}
          </Card>
        )
      })}

      <Card elev="sunk" className="text-sm">
        <p className="font-bold text-ink">One rule above all: consistency.</p>
        <p className="text-muted mt-1">
          Train in the morning, before the day can get in the way. A session you actually do beats a
          perfect one you skip. Compare yourself to yourself every six months — then look back and be
          amazed. Be a fucking pro.
        </p>
      </Card>
    </div>
  )
}
