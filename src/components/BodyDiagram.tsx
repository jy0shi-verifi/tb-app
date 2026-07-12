type View = 'front' | 'back'
type Blob = { cx: number; cy: number; rx: number; ry: number }

const OX_BACK = 95

// where each muscle group sits on a little front / back figure
const MUSCLE_BLOBS: Record<string, { view: View; blobs: Blob[] }> = {
  chest: { view: 'front', blobs: [{ cx: 45, cy: 36, rx: 8, ry: 5 }] },
  shoulders: {
    view: 'front',
    blobs: [
      { cx: 34, cy: 30, rx: 4, ry: 3 },
      { cx: 56, cy: 30, rx: 4, ry: 3 },
    ],
  },
  triceps: {
    view: 'front',
    blobs: [
      { cx: 30, cy: 42, rx: 3.5, ry: 6 },
      { cx: 60, cy: 42, rx: 3.5, ry: 6 },
    ],
  },
  biceps: {
    view: 'front',
    blobs: [
      { cx: 30, cy: 42, rx: 3.5, ry: 6 },
      { cx: 60, cy: 42, rx: 3.5, ry: 6 },
    ],
  },
  core: { view: 'front', blobs: [{ cx: 45, cy: 54, rx: 7, ry: 8 }] },
  quads: {
    view: 'front',
    blobs: [
      { cx: 41, cy: 76, rx: 4, ry: 10 },
      { cx: 49, cy: 76, rx: 4, ry: 10 },
    ],
  },
  back: { view: 'back', blobs: [{ cx: 45, cy: 42, rx: 8, ry: 9 }] },
  glutes: {
    view: 'back',
    blobs: [
      { cx: 40, cy: 64, rx: 5, ry: 5 },
      { cx: 50, cy: 64, rx: 5, ry: 5 },
    ],
  },
  hamstrings: {
    view: 'back',
    blobs: [
      { cx: 41, cy: 80, rx: 4, ry: 9 },
      { cx: 49, cy: 80, rx: 4, ry: 9 },
    ],
  },
}

function Silhouette({ ox }: { ox: number }) {
  return (
    <g fill="var(--color-line)" transform={`translate(${ox},0)`}>
      <circle cx="45" cy="16" r="9" />
      <rect x="34" y="26" width="22" height="40" rx="8" />
      <rect x="26" y="28" width="8" height="30" rx="4" />
      <rect x="56" y="28" width="8" height="30" rx="4" />
      <rect x="37" y="64" width="8" height="34" rx="4" />
      <rect x="45" y="64" width="8" height="34" rx="4" />
    </g>
  )
}

export default function BodyDiagram({ muscles }: { muscles: string[] }) {
  return (
    <svg viewBox="0 0 190 116" className="w-full max-w-[200px] mx-auto" role="img" aria-label="Muscles worked">
      <Silhouette ox={0} />
      <Silhouette ox={OX_BACK} />
      <g fill="var(--color-brand)">
        {muscles.flatMap((m) => {
          const def = MUSCLE_BLOBS[m]
          if (!def) return []
          const ox = def.view === 'back' ? OX_BACK : 0
          return def.blobs.map((b, i) => (
            <ellipse key={`${m}-${i}`} cx={b.cx + ox} cy={b.cy} rx={b.rx} ry={b.ry} />
          ))
        })}
      </g>
      <text x="45" y="112" textAnchor="middle" fontSize="8" fill="var(--color-muted)">
        Front
      </text>
      <text x={45 + OX_BACK} y="112" textAnchor="middle" fontSize="8" fill="var(--color-muted)">
        Back
      </text>
    </svg>
  )
}
