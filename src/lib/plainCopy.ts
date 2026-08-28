/** Plain English first, book name second. No invented coaching. */

export const PROTOCOL_BLURB: Record<string, string> = {
  beginner:
    'Two dumbbell sessions that alternate, 3 × 8–12. Add weight when all three sets hit 12. Running stays yours — Runna logs in via Strava.',
  gm: 'Whole-body size work (Grey Man): two big lifts Mon/Wed/Fri that swap each session, then accessories you choose. Easy conditioning (Green) on the days between.',
  bridge:
    'A recovery week between training blocks (Bridge). Light activity only; optional 1RM tests if the next block needs new lifts.',
  alpha:
    'Strength zoom-in (Specificity Alpha): heavy days on the big lifts, plus higher-rep accessory days. You picked Alpha rather than Bravo.',
  bravo:
    'Hypertrophy zoom-in (Specificity Bravo): four days of higher-rep work. You picked Bravo rather than Alpha.',
  off: 'Nothing prescribed — a gap you placed so the next block starts when you want.',
}

export const clusterHeading = (kind: string | undefined): string | null => {
  if (kind === 'main') return 'Main lifts'
  if (kind === 's') return 'Accessories (S cluster)'
  if (kind === 'ms') return 'Main strength (MS)'
  if (kind === 'h') return 'Hypertrophy accessories (H)'
  return null
}
