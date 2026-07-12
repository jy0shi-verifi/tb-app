import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '../components/ui'
import ExerciseDetail from '../components/ExerciseDetail'
import { EXERCISE_INFO } from '../exerciseInfo'

type Section = { id: string; emoji: string; title: string; body: ReactNode }

// The lifts/moves in a sensible teaching order.
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
    title: 'What is Tactical Barbell?',
    body: (
      <>
        <p>
          Tactical Barbell (TB) is a strength + conditioning system built for people who need to be
          good at <b>everything</b> — strong, and well-conditioned — not specialised in one thing.
          Your north star: always a training block away from being ready for anything.
        </p>
        <p className="mt-2">
          The big idea is <b>“practice strength, don’t work out.”</b> Instead of smashing yourself to
          failure once a week, you lift a handful of core movements <b>often</b> (3×/week) at
          submaximal weights, always stopping fresh. Frequent, heavy-enough, never-to-failure. That’s
          what builds strength fast without burning you out — and it leaves gas in the tank for your
          running and conditioning.
        </p>
        <p className="mt-2">
          Strength is the <b>skeleton</b>; conditioning, work capacity and endurance get draped over
          it. This app runs the two TB phases you need right now: <b>Base Building</b> then{' '}
          <b>Operator</b>.
        </p>
      </>
    ),
  },
  {
    id: 'app',
    emoji: '📱',
    title: 'How to use this app (the daily loop)',
    body: (
      <>
        <p>Every morning it’s the same three steps — no thinking required before coffee:</p>
        <ol className="list-decimal list-inside mt-2 flex flex-col gap-1.5">
          <li>
            Open <b>Today</b>. It shows exactly what today is (lift, circuit, run, HIC or rest).
          </li>
          <li>
            Tap in to the session. For lifts/circuits, do the sets and <b>tick each one off</b> — the
            rest timer starts itself. For runs/HIC, just go, then <b>Mark complete</b>.
          </li>
          <li>
            Tap <b>how it felt</b> + any notes, then <b>Done</b>. That’s it.
          </li>
        </ol>
        <p className="mt-2">The other tabs:</p>
        <ul className="list-disc list-inside mt-1 flex flex-col gap-1">
          <li>
            <b>Program</b> — the whole block laid out; tap any day to preview it (and see the weights).
          </li>
          <li>
            <b>History</b> — your streak, PRs, strength trend, running stats.
          </li>
          <li>
            <b>Maxes</b> — where your tested numbers live and where the working weights are calculated.
          </li>
          <li>
            <b>Settings</b> — rest-timer length, theme, Strava, and <b>Back up your data</b> (export a
            file now and then — it’s the only copy).
          </li>
        </ul>
        <p className="mt-2 text-muted text-xs">
          Tip: add the app to your home screen and set a phone alarm for your training mornings — the
          habit is the whole game.
        </p>
      </>
    ),
  },
  {
    id: 'map',
    emoji: '🗺️',
    title: 'The plan, start to finish',
    body: (
      <>
        <ul className="list-disc list-inside flex flex-col gap-1.5">
          <li>
            <b>Base Building — 8 weeks.</b> Rebuild your engine (easy running) + strength-endurance
            circuits. No heavy lifting or maxes yet.
          </li>
          <li>
            <b>Test Day</b> (end of week 8). Find a ~5-rep max on your 3 lifts → enter them in Maxes.
          </li>
          <li>
            <b>Operator — 6-week blocks.</b> The strength engine: 3 lifts, 3×/week, waved intensity,
            with conditioning (runs + HIC) around it. Repeat blocks through the cut.
          </li>
        </ul>
        <p className="mt-2">
          After the first 12 weeks of Operator you retest and keep rolling. Longer term TB flexes into
          other templates (e.g. a Mass block when you switch to building) — we’ll set that up when the
          cut wraps.
        </p>
      </>
    ),
  },
  {
    id: 'base',
    emoji: '🌱',
    title: 'Base Building — what & how',
    body: (
      <>
        <p>
          Eight weeks to build an aerobic base and toughen your joints/tendons before the heavy work.
          A typical week (weeks 1–5):
        </p>
        <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
          <li><b>Mon</b> — SE circuit (3 rounds)</li>
          <li><b>Tue / Wed</b> — easy run</li>
          <li><b>Thu</b> — SE circuit (2 rounds)</li>
          <li><b>Fri</b> — recovery (light / optional)</li>
          <li><b>Sat</b> — the long easy run</li>
          <li><b>Sun</b> — rest</li>
        </ul>
        <p className="mt-2">
          <b>Running is all easy (LSS).</b> Conversational pace — you should be able to talk. Flat
          ground for now. Can’t run the whole time? <b>Run-walk</b> — that’s expected and still builds
          the base. Work for <b>time, not distance</b>; the durations step up each week.
        </p>
        <p className="mt-2">
          Weeks 6–8 shift: two light <b>strength intro</b> days appear (grooving your 3 lifts), plus
          two short <b>HIC</b> sessions, leading into Test Day.
        </p>
      </>
    ),
  },
  {
    id: 'circuit',
    emoji: '🔁',
    title: 'How to run an SE circuit',
    body: (
      <>
        <p>
          SE (strength-endurance) is done <b>circuit style</b> — one set of each move in order, then
          repeat. It’s about beating the clock, not the weight.
        </p>
        <ol className="list-decimal list-inside mt-2 flex flex-col gap-1.5">
          <li>
            <b>Set up all your stations first</b> so you can move between them quickly.
          </li>
          <li>
            <b>One light weight, set once.</b> The only loaded move is the DB Romanian Deadlift — pick
            a light weight and leave it for the whole block. Everything else is bodyweight.
          </li>
          <li>
            Do one set of <b>each</b> move in order (that’s one round). Short rests between moves
            (aim to keep them tight, ~30–120s); up to <b>2–3 min between rounds</b>.
          </li>
          <li>
            The card shows the reps (e.g. 3 rounds × 20). Ramps 20 → 30 → 40 → 50 over the weeks.
          </li>
          <li>
            Can’t finish a set unbroken? <b>Rest-pause</b> — pause a few seconds and squeeze the rest
            out. Totally normal, especially at the higher reps.
          </li>
        </ol>
        <p className="mt-2 text-muted text-xs">
          The challenge is the clock and the reps — keep the weight light and your form calm.
        </p>
      </>
    ),
  },
  {
    id: 'test',
    emoji: '📏',
    title: 'Test Day (end of Base Building)',
    body: (
      <>
        <p>
          You don’t max out a single rep. For each lift you work up to a weight you can do about{' '}
          <b>5 clean reps</b> on, leaving 1–2 in the tank — stop before your form breaks.
        </p>
        <ol className="list-decimal list-inside mt-2 flex flex-col gap-1.5">
          <li>Rest up (2–3 easy days beforehand).</li>
          <li>Warm up, then build up in a few sets to your ~5-rep weight.</li>
          <li>Note the <b>weight per dumbbell × reps</b> for each lift.</li>
          <li>Enter them in the <b>Maxes</b> tab — the app calculates your training max and every working weight.</li>
        </ol>
        <p className="mt-2">
          That unlocks Operator. You’ll retest the same way every so often — you never lift a true
          one-rep max in TB.
        </p>
      </>
    ),
  },
  {
    id: 'operator',
    emoji: '🏋️',
    title: 'Operator — the strength engine',
    body: (
      <>
        <p>
          Three lifts (DB Bench, Two-DB Front-rack Squat, 1-Arm DB Row), performed <b>3×/week</b>{' '}
          (Mon / Wed / Fri), with a rest day between strength days. Each 6-week block waves the
          intensity:
        </p>
        <div className="mt-2 rounded-field bg-[var(--color-surface-sunk)] p-3 text-sm num-display">
          Wk1 70% · Wk2 80% · <b>Wk3 90%</b> · Wk4 75% · Wk5 85% · <b>Wk6 95%</b>
        </div>
        <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
          <li><b>Same weight for all sets</b> of a lift that day.</li>
          <li>Reps drop as the weight climbs (5s early, down to 2–3 on the heavy weeks).</li>
          <li>Weeks 3 & 6 are the <b>heavy weeks</b> — rest longer (3–5 min) and go easy on conditioning.</li>
        </ul>
        <p className="mt-2">
          The weights come off a <b>90% training max</b> (a slightly conservative number). That’s
          deliberate — it keeps every session hittable even on a rough morning, which is exactly how a
          frequent template like Operator is meant to run. Trust the lighter early weeks.
        </p>
      </>
    ),
  },
  {
    id: 'golden',
    emoji: '⏱️',
    title: 'The Golden Rule: rest & no failure',
    body: (
      <>
        <p className="font-semibold text-ink">Rest at least 2 minutes between strength sets. Always.</p>
        <p className="mt-2">
          Not 90 seconds — a minimum of two minutes, even if you feel ready sooner. The point is to be
          <b> fully recovered for every set</b> so you never grind to failure. Failure is for
          bodybuilding; for strength it just digs a fatigue hole.
        </p>
        <p className="mt-2">
          2–3 min is the sweet spot on the lighter weeks; go <b>3–5 min</b> on the heavy 90/95% weeks
          (it also keeps size gain down, which suits the cut). You can set your default in{' '}
          <b>Settings → Rest timer</b>.
        </p>
      </>
    ),
  },
  {
    id: 'conditioning',
    emoji: '🏃',
    title: 'Conditioning: runs (E) & HIC',
    body: (
      <>
        <p>Two flavours of conditioning sit around your lifting in Operator:</p>
        <ul className="list-disc list-inside mt-2 flex flex-col gap-1.5">
          <li>
            <b>E (Endurance)</b> — an easy, conversational run. Keeps the aerobic base ticking.
          </li>
          <li>
            <b>HIC (High-Intensity Conditioning)</b> — hard, short efforts: hill sprints, 600m
            resets, a fast tempo run. Run each at its prescribed effort and take the full recovery.
          </li>
        </ul>
        <p className="mt-2">
          Your week is the endurance-leaning setup: <b>2 HIC + 1 easy run</b> (Tue HIC · Thu run · Sat
          HIC), which suits you as a runner. On weeks 3 & 6 the conditioning goes <b>easy</b> — half
          the rounds/effort — because that’s when your lifting is heaviest. Runs auto-import from
          Strava; you just tick lifts and circuits.
        </p>
      </>
    ),
  },
  {
    id: 'progress',
    emoji: '📈',
    title: 'Getting stronger: retest vs forced progression',
    body: (
      <>
        <p>
          At the end of an Operator block the app tells you what to do — you don’t have to work it out:
        </p>
        <ul className="list-disc list-inside mt-2 flex flex-col gap-1.5">
          <li>
            <b>First 12 weeks:</b> run two blocks on the same numbers, then <b>retest</b>. Early gains
            are fast, and a retest captures them (often more than a fixed bump would).
          </li>
          <li>
            <b>After that:</b> retest every 6 weeks while the gains keep coming.
          </li>
          <li>
            <b>Forced progression</b> (adding a small fixed amount) is a <i>later</i> tool for when a
            lift stalls — the app watches for that and flags it, then points you back to me to set up
            the next stage.
          </li>
        </ul>
        <p className="mt-2 text-muted text-xs">
          On a cut, don’t expect big PRs — the goal is to <b>keep</b> your strength while the fat comes
          off. Holding steady is a win.
        </p>
      </>
    ),
  },
  {
    id: 'pullup',
    emoji: '💪',
    title: 'Your pull: row now, pull-ups later',
    body: (
      <>
        <p>
          The book’s Operator pull is a <b>weighted pull-up</b>. You’re running a <b>1-Arm DB Row</b>{' '}
          for now because it loads cleanly with your dumbbells and you can’t do a strict pull-up yet —
          it trains the same pulling muscles and balances your bench.
        </p>
        <p className="mt-2">
          The <b>goal</b> is the pull-up. Chip away on your beam — negatives (jump up, lower slow) and
          chair-assisted reps. When you can do <b>~10 bodyweight pull-ups</b>, we’ll swap the cluster’s pull
          to a weighted pull-up at a block boundary — bang on the book.
        </p>
      </>
    ),
  },
  {
    id: 'rest',
    emoji: '🌙',
    title: 'Easy weeks & time off',
    body: (
      <>
        <p>
          TB is “for life,” not a bootcamp — recovery is built in, not earned:
        </p>
        <ul className="list-disc list-inside mt-2 flex flex-col gap-1.5">
          <li><b>Every 3rd week</b> the conditioning eases off (it lands on your heavy lifting weeks).</li>
          <li>At least <b>one full rest day</b> a week.</li>
          <li>Take <b>a few weeks off</b> every 3–6 months to let your nervous system recharge — plan it around a holiday.</li>
        </ul>
        <p className="mt-2">
          If you’re fatigued, cut the <b>conditioning</b> first — never drop the weight on your lifts to
          cope. Recovery is training too.
        </p>
      </>
    ),
  },
  {
    id: 'diet',
    emoji: '🍽️',
    title: 'Food (MacroFactor)',
    body: (
      <p>
        Diet lives in <b>MacroFactor</b>, not here. Log everything honestly and weigh in most mornings
        (same time, after the loo, before food) and it auto-adjusts your targets. Keep protein up
        (~180–200g) to hold onto muscle on the cut, and don’t under-eat around the conditioning —
        that’s the classic mistake that tanks your lifts.
      </p>
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
          <b>Missed a day?</b> Nothing’s lost — just open it the next morning and carry on. Your streak
          tolerates short gaps, and rest days won’t break it.
        </li>
        <li>
          <b>Missed a chunk / been away?</b> The app eases you back in rather than dropping you into a
          heavy week — follow what Today says.
        </li>
        <li>
          <b>A weight feels too heavy / too light?</b> Early Operator weeks are <i>meant</i> to feel
          light (that’s the training max doing its job). If it’s genuinely wrong, re-check your Maxes
          entry.
        </li>
        <li>
          <b>Can’t finish an SE circuit unbroken?</b> Rest-pause and finish the reps — expected.
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
          The whole system, in plain English. Tap a topic — this is here so you rarely need to ask.
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
