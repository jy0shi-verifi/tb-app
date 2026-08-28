import { describe, it, expect } from 'vitest'
import { uniqueExerciseId, slugExercise } from '../src/lib/exerciseId'

describe('uniqueExerciseId (code-02 F17)', () => {
  it('slugs with the given prefix', () => {
    expect(slugExercise('Barbell Curl', 'h_')).toBe('h_barbell_curl')
  })

  it('does not collide with an already-taken id', () => {
    const first = uniqueExerciseId('Bench Press', 'h_', [])
    const second = uniqueExerciseId('Bench Press', 'h_', [first])
    expect(first).toBe('h_bench_press')
    expect(second).toBe('h_bench_press_2')
    expect(second).not.toBe(first)
  })
})
