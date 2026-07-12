import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'

// ============================================================
// ProgressRing — a dial that fills toward a target (ember→brass)
// Renders white center text; place it on a dark/topo hero card.
// ============================================================
export function ProgressRing({
  value,
  target,
  label,
}: {
  value: number
  target: number
  label?: ReactNode
}) {
  const R = 52
  const C = 2 * Math.PI * R
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const off = C * (1 - pct)
  const done = target > 0 && value >= target
  return (
    <div
      className="relative w-32 h-32"
      style={{ filter: 'drop-shadow(0 0 14px color-mix(in srgb, var(--color-brand) 50%, transparent))' }}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={done ? 'var(--color-gold-hi)' : 'var(--color-hot)'} />
            <stop offset="1" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.9s var(--ease-out-soft)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-white text-center">
        <div>
          <div className="num-display text-5xl leading-none hero-text">{value}</div>
          <div className="text-xs text-white/85 mt-0.5 font-semibold">{label ?? `of ${target}`}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CoinBadge — a challenge coin (earned) or a locked slug
// tiers: bronze → steel → gold(brass) → black (top)
// ============================================================
export type CoinTier = 'bronze' | 'steel' | 'gold' | 'black'
const TIER_GRAD: Record<CoinTier, string> = {
  bronze: 'linear-gradient(135deg,#e6a875,#a5652f)',
  steel: 'linear-gradient(135deg,#dfe4ea,#9aa4b0)',
  gold: 'linear-gradient(135deg,var(--color-gold-hi),var(--color-gold),var(--color-gold-lo))',
  black: 'linear-gradient(135deg,#33373d,#0c0e11)',
}

export function CoinBadge({
  emoji,
  label,
  tier = 'gold',
  earned,
  justEarned,
  lockedText,
}: {
  emoji: string
  label: string
  tier?: CoinTier
  earned: boolean
  justEarned?: boolean
  lockedText?: string
}) {
  return (
    <div className="shrink-0 w-[4.5rem] flex flex-col items-center gap-1.5 text-center">
      {earned ? (
        <div
          className={`w-16 h-16 rounded-pill grid place-items-center text-2xl elev-1 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.4)] ${
            justEarned ? 'pop ring-pulse' : ''
          } ${tier === 'black' ? 'ring-1 ring-[#c6f135]/60' : ''}`}
          style={{ backgroundImage: TIER_GRAD[tier] }}
          aria-label={`${label}, earned`}
        >
          <span aria-hidden="true">{emoji}</span>
        </div>
      ) : (
        <div
          className="w-16 h-16 rounded-pill grid place-items-center bg-[var(--color-surface-sunk)] border-2 border-dashed border-line text-muted"
          aria-label={`${label} — locked`}
        >
          <Lock size={18} />
        </div>
      )}
      <span className={`text-[10px] leading-tight font-semibold ${earned ? 'text-ink' : 'text-muted'}`}>
        {earned ? label : (lockedText ?? label)}
      </span>
    </div>
  )
}

// ============================================================
// Shared line-chart scaffold (inline SVG, theme-reactive via vars)
// ============================================================
const VB_W = 324
const VB_H = 196
const PAD = { l: 34, r: 10, t: 12, b: 24 }
const PLOT_W = VB_W - PAD.l - PAD.r
const PLOT_H = VB_H - PAD.t - PAD.b

function xAt(i: number, n: number): number {
  return n <= 1 ? PAD.l + PLOT_W / 2 : PAD.l + (i / (n - 1)) * PLOT_W
}
function yAt(v: number, min: number, max: number): number {
  const span = max - min || 1
  return PAD.t + (1 - (v - min) / span) * PLOT_H
}
/** ~4 "nice" tick values spanning [min,max]. */
function ticks(min: number, max: number): number[] {
  const span = max - min || 1
  const step = span / 3
  return [0, 1, 2, 3].map((i) => min + step * i)
}

export interface TrendSeries {
  key: string
  label: string
  color: string
  points: { i: number; v: number; title?: string }[] // i = index along the shared x-axis
}

function ChartFrame({
  n,
  labels,
  min,
  max,
  fmtY,
  label,
  children,
}: {
  n: number
  labels: string[]
  min: number
  max: number
  fmtY: (v: number) => string
  label: string
  children: ReactNode
}) {
  const ys = ticks(min, max)
  // show ~4 x labels max to avoid crowding
  const step = Math.max(1, Math.ceil(n / 4))
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label={label}>
      {ys.map((tv, k) => {
        const y = yAt(tv, min, max)
        return (
          <g key={k}>
            <line x1={PAD.l} y1={y} x2={VB_W - PAD.r} y2={y} stroke="var(--color-line)" strokeWidth="1" opacity="0.55" />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--color-muted)">
              {fmtY(tv)}
            </text>
          </g>
        )
      })}
      {labels.map((lb, i) =>
        i % step === 0 || i === n - 1 ? (
          <text key={i} x={xAt(i, n)} y={VB_H - 8} textAnchor="middle" fontSize="9" fill="var(--color-muted)">
            {lb}
          </text>
        ) : null,
      )}
      {children}
    </svg>
  )
}

/** Poly-line with dots for one series; skips gaps (connectNulls-style is handled by caller ordering). */
function SeriesLine({ s, n, min, max }: { s: TrendSeries; n: number; min: number; max: number }) {
  if (!s.points.length) return null
  const d = s.points.map((p, k) => `${k ? 'L' : 'M'}${xAt(p.i, n).toFixed(1)},${yAt(p.v, min, max).toFixed(1)}`).join(' ')
  return (
    <g>
      <path d={d} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {s.points.map((p, k) => (
        <circle
          key={k}
          cx={xAt(p.i, n)}
          cy={yAt(p.v, min, max)}
          r={k === s.points.length - 1 ? 3.6 : 2.6}
          fill={s.color}
          stroke="var(--color-surface)"
          strokeWidth="1.4"
        >
          <title>{p.title ?? `${s.label}: ${p.v}`}</title>
        </circle>
      ))}
    </g>
  )
}

// ============================================================
// StrengthTrend — multi-series best-est-1RM lines
// ============================================================
export function StrengthTrend({
  labels,
  series,
}: {
  labels: string[]
  series: TrendSeries[]
}) {
  const n = labels.length
  const vals = series.flatMap((s) => s.points.map((p) => p.v))
  if (!vals.length) return null
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  const pad = (max - min || max || 1) * 0.12
  min = Math.max(0, min - pad)
  max = max + pad
  return (
    <ChartFrame
      n={n}
      labels={labels}
      min={min}
      max={max}
      fmtY={(v) => Math.round(v).toString()}
      label="Strength trend — best estimated 1RM per lift over time"
    >
      {series.map((s) => (
        <SeriesLine key={s.key} s={s} n={n} min={min} max={max} />
      ))}
    </ChartFrame>
  )
}

// ============================================================
// PaceTrend — single reversed-axis line (faster = higher)
// ============================================================
function paceTick(v: number): string {
  const m = Math.floor(v)
  return `${m}:${String(Math.round((v - m) * 60)).padStart(2, '0')}`
}

export function PaceTrend({ labels, values, color }: { labels: string[]; values: number[]; color: string }) {
  const n = labels.length
  if (!values.length) return null
  // reversed axis: smaller pace (faster) plots HIGHER. Invert by mapping value → (hi+lo - value).
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo || 1) * 0.15
  const min = lo - pad
  const max = hi + pad
  const inv = (v: number) => min + max - v // flip within [min,max]
  const s: TrendSeries = {
    key: 'pace',
    label: 'pace',
    color,
    points: values.map((v, i) => ({ i, v: inv(v), title: `${paceTick(v)} /km` })),
  }
  return (
    <ChartFrame
      n={n}
      labels={labels}
      min={min}
      max={max}
      fmtY={(tv) => paceTick(inv(tv))}
      label="Conditioning pace trend over time — higher is faster"
    >
      <SeriesLine s={s} n={n} min={min} max={max} />
    </ChartFrame>
  )
}
