/**
 * Conditioning — the eight named sessions, MASS pp.98–111.
 *
 * Conditioning is a property of the BLOCK, not of the session: "Use Green
 * sessions when training General Mass blocks. Use Black with Specificity"
 * (p.20). Green pairs with General Mass, Black with Specificity.
 *
 * Every prescription below is transcribed from the book's own card, with the
 * governing prose quoted in `detail`. Where the book gives a range it is kept as
 * a range — the app must not narrow the author's own latitude.
 */
import type { ConditioningColour } from '../protocol'

export interface ConditioningSession {
  id: string
  name: string
  colour: ConditioningColour
  /** The card's prescription lines, verbatim. */
  card: string[]
  /** The governing rule, quoted, with its page. */
  detail: string
  /** Hard cap in minutes where the book states one. */
  capMin?: number
  page: number
  /** Book-stated alternatives to the primary modality. */
  alternatives?: string
}

/**
 * "Perform 1 to 3 conditioning sessions per week. No more than 3. Sessions can
 *  be conducted on non-lifting or lifting days." (p.99)
 */
export const GREEN_PER_WEEK = { min: 1, max: 3 } as const

/**
 * "Perform 1 to 2 conditioning sessions per week. No more than 2. Perform Black
 *  sessions on non-lifting days." (p.99)
 */
export const BLACK_PER_WEEK = { min: 1, max: 2 } as const

export const GREEN_SESSIONS: ConditioningSession[] = [
  {
    id: 'walk',
    name: 'Walk',
    colour: 'green',
    card: ['Walk x 30-60 Minutes'],
    detail: '“Self explanatory.” (p.100)',
    capMin: 60,
    page: 100,
  },
  {
    id: 'ruck',
    name: 'Ruck',
    colour: 'green',
    card: ['Ruck x 30-60 minutes'],
    detail:
      '“Ruck for 30 to 60 minutes continuously with a load of 10-50lbs. 30lbs is usually the sweet spot for most.” A weight vest can be used in place of a ruck. (p.101)',
    capMin: 60,
    page: 101,
  },
  {
    id: 'recovery-run',
    name: 'Recovery Run',
    colour: 'green',
    card: ['Run x 20-30 minutes'],
    detail:
      '“Jog at a relaxed pace for 20-30 minutes. Use the talk-test.” Don’t run longer than 30 minutes while hypertrophy is the objective; hardgainers cap it at 20. A 10-minute run either side of a lift does NOT count as a session. (p.102)',
    capMin: 30,
    page: 102,
    alternatives: 'Cycle / Swim / Row',
  },
  {
    id: 'endurance-predator',
    name: 'Endurance Predator',
    colour: 'green',
    card: ['Walk x 30-60 minutes', '+ Sprint x 50-100m'],
    detail:
      '“Every 5 to 10 minutes break out and sprint for 50 to 100m. The sprint should be an all-out effort.” Vary the gap between intervals. Optional weight vest (5-10lbs). (p.103)',
    capMin: 60,
    page: 103,
  },
]

export const BLACK_SESSIONS: ConditioningSession[] = [
  {
    id: 'anabolic-sprints',
    name: 'Anabolic Sprints',
    colour: 'black',
    card: ['Sprint x 30M', 'x 5-10 Rounds'],
    detail:
      '“Sprint as hard as you can for 30 meters. Walk back to start. Rest for a few moments. Repeat for 5 to 10 rounds.” Warm up first. (p.104)',
    page: 104,
  },
  {
    id: 'reset-20',
    name: 'Reset-20',
    colour: 'black',
    card: ['Sprint x 20 Seconds', 'Rest 2-5 Minutes', 'x 3-5 rounds'],
    detail:
      '“Perform the 20 second work interval at maximum speed and intensity… Don’t train for more than 15 to 20 minutes with this session.” (p.105)',
    capMin: 20,
    page: 105,
    alternatives: 'Airdyne / Row / Heavy Bag',
  },
  {
    id: 'hill-sprints',
    name: 'Hill Sprints',
    colour: 'black',
    card: ['Hill Sprint', 'x 3-10 rounds'],
    detail:
      '“Find a steep hill and sprint up it as fast as you can – maximum effort… approximately 10-20seconds. No more than 10 sprints or 15 minutes per session – whichever comes first.” On the flat: sprint 15-20s, rest 2-3 min, 5-10 sprints. (p.106)',
    capMin: 15,
    page: 106,
  },
  {
    id: 'fobbits',
    name: 'Fobbits',
    colour: 'black',
    card: ['LSS x 2 Mins', 'Kettlebell Swings x 10', 'x 15-20 minutes'],
    detail:
      '“Every 2 minutes step off the treadmill and perform 10 kettlebell swings.” Keep the LSS portion low intensity — talk-test, or roughly 120-150BPM. Duration 15-20 minutes, no longer. (p.107)',
    capMin: 20,
    page: 107,
  },
]

export const ALL_CONDITIONING = [...GREEN_SESSIONS, ...BLACK_SESSIONS]

export const sessionsFor = (colour: ConditioningColour): ConditioningSession[] =>
  colour === 'green' ? GREEN_SESSIONS : colour === 'black' ? BLACK_SESSIONS : []

export const conditioningById = (id: string): ConditioningSession | undefined =>
  ALL_CONDITIONING.find((c) => c.id === id)

export const perWeekFor = (colour: ConditioningColour) =>
  colour === 'black' ? BLACK_PER_WEEK : GREEN_PER_WEEK

/**
 * Which days carry a conditioning session.
 *
 * **DEVIATION.** The book fixes the COUNT (1–3 Green a week, p.99) but never the
 * days — Green may fall on lifting or non-lifting days, Black on non-lifting days
 * only. The app therefore defaults to two Green sessions on the non-lifting days
 * either side of the week's middle lift, which sits inside the book's range and
 * keeps them clear of the bar, and lets the user change them.
 */
export const DEFAULT_GREEN_DAYS = [1, 5] // Tue, Sat
export const DEFAULT_BLACK_DAYS = [1, 5]

export function defaultConditioningDays(colour: ConditioningColour): number[] {
  return colour === 'black' ? DEFAULT_BLACK_DAYS : colour === 'green' ? DEFAULT_GREEN_DAYS : []
}
