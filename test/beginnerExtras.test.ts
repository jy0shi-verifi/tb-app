import { describe, it, expect } from 'vitest'
import { lastPerformance } from '../src/lib/stats'
import { musclesForExercises } from '../src/exerciseInfo'
import { liftDescription } from '../src/lib/stravaSync'
import type { Settings, SessionLog } from '../src/types'

const settings: Settings = {
  id: 'app',
  dbIncrement: 2,
  loadBasis: 'tm',
  currentPhaseId: 'beginner',
  phaseStartDate: '2026-07-27',
  programMode: 'beginner',
  beginner: { lifts: {} },
}

const dayB: SessionLog = {
  id: 1,
  date: '2026-07-29',
  phaseId: 'beginner',
  week: 1,
  day: 2,
  type: 'lift',
  title: 'Strength — Day B',
  done: true,
  createdAt: 1,
  exercises: [
    { name: 'DB Romanian Deadlift', sets: [{ weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }] },
    { name: 'DB Reverse Lunge', sets: [{ weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }] },
    { name: 'DB Overhead Press', sets: [{ weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }] },
  ],
}

describe('lastPerformance', () => {
  it('finds the most recent prior logged reps + weight for a lift', () => {
    const lp = lastPerformance([dayB], 'DB Romanian Deadlift', '2026-08-05')
    expect(lp).toEqual({ weight: 10, reps: [8, 8, 8], date: '2026-07-29' })
  })
  it('ignores sessions on/after the cutoff date', () => {
    expect(lastPerformance([dayB], 'DB Romanian Deadlift', '2026-07-29')).toBeNull()
  })
  it('returns null when the lift was never logged', () => {
    expect(lastPerformance([dayB], 'DB Bench Press', '2026-08-05')).toBeNull()
  })
})

describe('musclesForExercises', () => {
  it('aggregates unique muscles across the day in first-seen order', () => {
    const m = musclesForExercises(['DB Romanian Deadlift', 'DB Reverse Lunge', 'DB Overhead Press'])
    expect(m).toEqual(['Hamstrings', 'Glutes', 'Back', 'Quads', 'Shoulders', 'Triceps', 'Core'])
  })
})

describe('liftDescription — beginner (reps only, no weight)', () => {
  const desc = liftDescription(dayB, {}, settings)
  it('lists each lift with reps and NO weight', () => {
    expect(desc).toContain('DB Romanian Deadlift — 8, 8, 8')
    expect(desc).not.toMatch(/kg/) // no weight anywhere
  })
  it('includes a Muscles line and the TB footer', () => {
    expect(desc).toContain('Muscles: Hamstrings · Glutes · Back · Quads · Shoulders · Triceps · Core')
    expect(desc).toContain('via Tactical Barbell')
  })
  it('omits the volume total (which would leak weight)', () => {
    expect(desc).not.toMatch(/Volume/)
  })
})
