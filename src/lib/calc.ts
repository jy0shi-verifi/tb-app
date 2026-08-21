/**
 * Brzycki estimated 1RM from a submaximal set (per dumbbell):
 *   1RM = weight × 36 / (37 − reps)
 *
 * Used only for display — personal-record detection and the estimated 1RM shown
 * on Strava write-back. Nothing prescribes load from it.
 *
 * NOTE: the Tactical Barbell load math that used to live alongside this
 * (training max, percentage-based working loads, the dumbbell floor/ceiling
 * clamp) was removed and will be rebuilt from the books. If you reintroduce
 * percentage work, verify the formula against the source before trusting it —
 * this one was originally shipped as Epley and was wrong.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps >= 37) return weight
  return (weight * 36) / (37 - reps)
}
