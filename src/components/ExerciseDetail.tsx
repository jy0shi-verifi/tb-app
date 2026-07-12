import type { ExerciseInfo } from '../exerciseInfo'
import BodyDiagram from './BodyDiagram'

const MUSCLE_NAMES: Record<string, string> = {
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  back: 'Back',
  core: 'Core',
}

/** How-to steps, a target-muscle diagram, and a form video (embedded, or a link when embed=false). */
export default function ExerciseDetail({
  name,
  info,
  embed = false,
}: {
  name: string
  info: ExerciseInfo
  embed?: boolean
}) {
  const targetNames = [...new Set((info.targets ?? []).map((t) => MUSCLE_NAMES[t] ?? t))]
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' proper form')}`

  return (
    <div className="flex flex-col gap-3">
      {info.howTo && (
        <ol className="list-decimal list-inside flex flex-col gap-1 text-sm text-ink">
          {info.howTo.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      )}

      {info.targets && info.targets.length > 0 && (
        <div className="rounded-field bg-[var(--color-surface-sunk)] p-3">
          <p className="eyebrow text-muted mb-1">Works: {targetNames.join(' · ')}</p>
          <BodyDiagram muscles={info.targets} />
        </div>
      )}

      {info.video &&
        (embed ? (
          <div className="rounded-field overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              title={`${name} form video`}
              src={`https://www.youtube.com/embed/${info.video}${info.videoStart ? `?start=${info.videoStart}` : ''}`}
              className="w-full h-full"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <a
            href={`https://www.youtube.com/watch?v=${info.video}${info.videoStart ? `&t=${info.videoStart}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-bold text-brand-ink"
          >
            ▶ Watch a form video
          </a>
        ))}

      <a href={search} target="_blank" rel="noreferrer" className="text-[11px] text-muted">
        Not playing? Search more form videos →
      </a>
    </div>
  )
}
