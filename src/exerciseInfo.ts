/**
 * Per-exercise reference data: a form video (YouTube id), the muscles worked, and
 * plain-English how-to steps. Keyed by the exercise `name` used in program.ts, so a
 * session move can look itself up. Videos are verified embeddable; each detail view
 * also shows a "Search more form videos" fallback in case of link-rot.
 */
export interface ExerciseInfo {
  targets: string[] // muscle keys understood by BodyDiagram
  video?: string // YouTube id
  videoStart?: number // seconds
  howTo: string[]
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // --- Operator + weeks 6-8 strength lifts ---
  'DB Bench Press': {
    targets: ['chest', 'shoulders', 'triceps'],
    video: 'VmB1G1K7v94', // ScottHermanFitness — Dumbbell Chest Press
    howTo: [
      'Lie back on the bench, a dumbbell in each hand resting on your thighs.',
      'Kick them up to your shoulders as you lie down; start with them at chest level, elbows about 45° from your body.',
      'Press both dumbbells up until your arms are straight, bringing them together over your chest.',
      'Lower under control until your elbows are level with the bench. Breathe out as you press.',
      'Keep your feet flat, glutes down, and a small natural arch in your lower back.',
    ],
  },
  'Two-DB Front-rack Squat': {
    targets: ['quads', 'glutes', 'core'],
    video: 'k_EhLGvM8TQ', // Buff Dudes — Goblet Squat (closest simple DB squat pattern)
    videoStart: 17,
    howTo: [
      'Hold a dumbbell in each hand up at your shoulders (the "front rack"). If that’s awkward, hold one dumbbell at your chest like a goblet squat instead — same legs.',
      'Feet about shoulder-width, toes turned slightly out.',
      'Brace your core, push your hips back and bend your knees, pushing your knees out (don’t let them cave in).',
      'Go down to about parallel — thighs level with the floor — keeping your chest up and heels down.',
      'Drive up through your heels. Breathe out as you stand.',
    ],
  },
  '1-Arm DB Row': {
    targets: ['back', 'biceps'],
    video: 'pYcpY20QaE8', // ScottHermanFitness — Single-Arm Dumbbell Row
    howTo: [
      'Put one hand and the same-side knee on the bench; the other foot stays on the floor. Back flat, roughly parallel to the ground.',
      'Let the dumbbell hang straight down from your shoulder.',
      'Pull it up to your ribs / hip, driving your elbow back and up — lead with the elbow, not the hand.',
      'Squeeze your shoulder blade at the top, then lower under control.',
      'Do all reps one side, then switch. Breathe out as you pull.',
    ],
  },
  'Pull-up progression': {
    targets: ['back', 'biceps'],
    video: 'eGo4IYlbE5g', // Calisthenic Movement — The Perfect Pull Up
    howTo: [
      "Can’t do a strict pull-up yet? That’s expected — build up on your beam and it becomes your Operator pull once you can do ~10.",
      'Negatives: jump (or step off a box) to the top with your chin over the beam, then lower yourself as slowly as you can (aim 3–5s). 3–5 reps.',
      'Assisted reps: put a chair or box under the beam and push through your feet just enough to help — take away as little help as you can each time.',
      'Dead hangs + scapular pulls: hang from the beam, then pull your shoulder blades down without bending your arms.',
      'When you can do ~10 clean bodyweight pull-ups, add weight (pack/DB) and it becomes a Weighted Pull-up — the book’s Operator pull.',
    ],
  },

  // --- Beginner-mode Linear Progression lifts (Day A / Day B) ---
  'Goblet / Front-rack Squat': {
    targets: ['quads', 'glutes', 'core'],
    video: 'k_EhLGvM8TQ', // Buff Dudes — Goblet Squat
    videoStart: 17,
    howTo: [
      'Hold one dumbbell vertically against your chest like a goblet (both hands cupping the top head). If you prefer, hold a dumbbell at each shoulder in the "front rack" instead — same legs.',
      'Feet about shoulder-width, toes turned slightly out.',
      'Brace your core, push your hips back and bend your knees, pushing your knees out (don’t let them cave in).',
      'Go down to about parallel — thighs level with the floor — chest up, heels down.',
      'Drive up through your heels. Breathe out as you stand.',
    ],
  },
  'DB Reverse Lunge': {
    targets: ['quads', 'glutes', 'hamstrings'],
    howTo: [
      'Stand tall with a dumbbell in each hand by your sides.',
      'Step one foot back and lower until both knees are about 90° — front thigh roughly parallel, back knee near the floor.',
      'Keep your torso upright and your weight through the front heel.',
      'Drive through the front foot to step back to standing.',
      'Alternate legs (or do all reps on one side then switch). Reverse lunges are kinder on the knees than forward ones.',
    ],
  },
  'DB Overhead Press': {
    targets: ['shoulders', 'triceps', 'core'],
    howTo: [
      'Stand tall, a dumbbell in each hand at shoulder height, palms facing forward (or slightly in).',
      'Brace your core and squeeze your glutes so you don’t lean back.',
      'Press both dumbbells straight overhead until your arms are locked out, bringing them together at the top.',
      'Lower under control back to your shoulders. Breathe out as you press.',
      'If your lower back arches, drop the weight or do it seated against a bench.',
    ],
  },

  // --- Base Building SE circuit moves ---
  'Push-ups': {
    targets: ['chest', 'shoulders', 'triceps', 'core'],
    video: '_l3ySVKYVJ8', // CrossFit — The Push-Up (standard, chest-to-floor; do them the way you're used to)
    howTo: [
      'Standard push-up — the way you’re used to (your RAF-style ones are perfect). Don’t worry about the ultra-strict slow-tempo style; that’s harder and not what we’re after.',
      'Hands about shoulder-width (a touch wider is fine), body in a straight line from head to heels.',
      'Brace your core and glutes so your hips don’t sag or pike.',
      'Lower until your chest is near the floor, elbows travelling back at a comfortable angle — they do NOT have to be pinned tight to your sides.',
      'Push back up to straight arms at a normal, controlled tempo. This is SE — reps are the point, so when a set gets tough drop to your knees and keep going rather than stopping.',
    ],
  },
  'Bodyweight squats': {
    targets: ['quads', 'glutes'],
    video: 'C_VtOYc6j5c', // CrossFit — The Air Squat
    howTo: [
      'Feet about shoulder-width, toes slightly out, arms out in front for balance.',
      'Push your hips back and down, knees tracking over your toes.',
      'Go to about parallel (or as low as you can with a flat back and heels down).',
      'Drive up through your heels to standing. Breathe out as you stand.',
      'Keep the pace steady and rhythmic — you’re chasing reps here, not weight.',
    ],
  },
  'Chest-supported DB row': {
    targets: ['back', 'biceps'],
    video: '_b6ch2nIchk', // Fit Father Project — Chest-Supported Dumbbell Row
    howTo: [
      'Set your bench to an incline (~30–45°) and lie face-down with your chest on the pad, a dumbbell in each hand hanging straight down.',
      'Use the same light dumbbells as your RDL — one weight, set once for the whole circuit.',
      'Pull both dumbbells up to your ribs, driving your elbows back and squeezing your shoulder blades together.',
      'Lower under control until your arms are straight. Your chest stays on the pad the whole time — so there’s no strain on your lower back.',
      'No bench free? A standing bent-over DB row does the same job — just keep a flat back. This is your horizontal pull in the circuit.',
    ],
  },
  'DB Romanian Deadlift': {
    targets: ['hamstrings', 'glutes', 'back'],
    video: 'FQKfr1YDhEk', // ScottHermanFitness — Dumbbell Romanian Deadlift
    howTo: [
      'Stand holding a dumbbell in each hand in front of your thighs, knees slightly bent (and kept there).',
      'Push your hips back and slide the dumbbells down your legs — the movement is at the hips, not the knees.',
      'Keep your back flat and the dumbbells close to your legs; feel a stretch in your hamstrings.',
      'Go as low as you can keep a flat back (usually mid-shin), then drive your hips forward to stand tall.',
      'Squeeze your glutes at the top. Breathe out as you stand. This is the only loaded move in the circuit — set the weight light and leave it.',
    ],
  },
  'Back extensions / Supermans': {
    targets: ['back', 'glutes', 'hamstrings'],
    video: 'z6PJMT2y8GQ', // Superman exercise tutorial
    howTo: [
      'Lie face-down, arms out in front, legs straight.',
      'Squeeze your glutes and lift your chest, arms and legs off the floor at the same time.',
      'Hold for a second at the top — think "long", not "high"; don’t crank your neck back.',
      'Lower under control. Breathe out as you lift.',
      'This strengthens your lower back and posterior chain to prep for heavier lifting.',
    ],
  },
  'Bicycle crunches': {
    targets: ['core'],
    video: '1we3bh9uhqY', // Tone and Tighten — Bicycle Crunch
    howTo: [
      'Lie on your back, hands lightly by your ears, knees up over your hips.',
      'Press your lower back gently into the floor and keep it there.',
      'Bring one elbow toward the opposite knee while you straighten the other leg.',
      'Switch sides in a smooth pedalling motion — control it, don’t rush or yank your neck.',
      'Keep breathing throughout. Prefer a plank? Hold a straight-body plank for time instead.',
    ],
  },
}

/** Display labels for the muscle keys used by BodyDiagram / exercise `targets`. */
export const MUSCLE_LABEL: Record<string, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  back: 'Back',
  biceps: 'Biceps',
  core: 'Core',
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

/** Unique muscles worked across a list of exercise names, in first-seen order, as labels. */
export function musclesForExercises(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const n of names) {
    for (const key of EXERCISE_INFO[n]?.targets ?? []) {
      if (!seen.has(key)) {
        seen.add(key)
        out.push(MUSCLE_LABEL[key] ?? key)
      }
    }
  }
  return out
}
