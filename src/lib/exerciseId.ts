/** Stable id from a display name. Prefix keeps H/MS/S lifts from colliding. */
export const slugExercise = (name: string, prefix: string): string => {
  const body = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `${prefix}${body}`
}

/**
 * If two custom lifts slug to the same id they would share a 1RM (code-02 F17).
 * Append _2, _3… until the id is free.
 */
export function uniqueExerciseId(name: string, prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = slugExercise(name, prefix)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}_${n}`)) n += 1
  return `${base}_${n}`
}
