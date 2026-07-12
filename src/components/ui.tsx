import type { ReactNode, Ref } from 'react'
import type { SessionType } from '../types'
import { Check, Dumbbell, Footprints, Loader2, Minus, Moon, Mountain, Plus, Repeat, type LucideIcon } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

export const APP_NAME = 'Tactical Barbell'

// ============================================================
// Card — elevation + padding are ROLES, not per-call guesses
// ============================================================
type Elev = '1' | '2' | 'hero' | 'sunk'
type Pad = 'sm' | 'md' | 'lg' | 'none'
const ELEV: Record<Elev, string> = { '1': 'elev-1', '2': 'elev-2', hero: 'elev-hero', sunk: 'elev-sunk' }
const PAD: Record<Pad, string> = { sm: 'p-3.5', md: 'p-5', lg: 'p-7', none: '' }

export function Card({
  children,
  className = '',
  elev = '1',
  pad = 'md',
}: {
  children: ReactNode
  className?: string
  elev?: Elev
  pad?: Pad
}) {
  const surface =
    elev === 'sunk'
      ? 'bg-[var(--color-surface-sunk)] border-line/40'
      : 'bg-surface border-line/60 dark:border-white/[0.06]'
  // twMerge so caller className (p-*, bg tints) reliably overrides the defaults — Tailwind resolves
  // same-property conflicts by CSS source order, not class-attribute order
  return (
    <div className={twMerge(`relative rounded-card border ${surface} ${ELEV[elev]} ${PAD[pad]}`, className)}>
      {children}
    </div>
  )
}

// ============================================================
// Button — ember pill with spring press + loading
// ============================================================
export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  loading,
  ref,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}) {
  const styles: Record<string, string> = {
    primary: 'reward-panel text-white elev-2 btn-sheen active:brightness-95',
    secondary:
      'bg-warm text-ink border border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] active:brightness-95',
    ghost: 'text-brand-ink active:bg-brand/10',
    danger: 'bg-danger-bg text-danger active:brightness-95',
  }
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={twMerge(
        `relative inline-flex items-center justify-center gap-2 rounded-pill px-5 min-h-[3rem] font-bold text-base tracking-tight transition-[transform,box-shadow,filter] duration-[var(--dur-tap)] ease-[var(--ease-spring)] active:scale-[0.96] disabled:opacity-40 disabled:active:scale-100 ${styles[variant]}`,
        className,
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}

// ============================================================
// Wordmark — the "TACTICAL BARBELL" lockup (condensed Oswald)
// ============================================================
export function Wordmark({ size = 'sm', onDark = false }: { size?: 'sm' | 'lg'; onDark?: boolean }) {
  const sz = size === 'lg' ? 'text-4xl' : 'text-lg'
  return (
    <span
      className={`font-display font-bold uppercase tracking-[0.06em] leading-none ${sz} ${
        onDark ? 'text-white hero-text' : 'text-glam'
      }`}
    >
      {APP_NAME}
    </span>
  )
}

// ============================================================
// Pill — unifies badges / chips / tags
// (keeps legacy tone names so in-flight screens keep rendering)
// ============================================================
export function Pill({
  tone = 'soft-brand',
  className = '',
  children,
}: {
  tone?: 'gold' | 'soft-brand' | 'soft-steel' | 'outline' | 'brand' | 'load' | 'muted' | 'warm'
  className?: string
  children: ReactNode
}) {
  const tones: Record<string, string> = {
    gold: 'gold-gradient text-[#3a2600] elev-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]',
    'soft-brand': 'bg-brand/12 text-brand-ink',
    'soft-steel': 'bg-accent/15 text-accent-ink',
    outline: 'bg-[var(--color-surface-sunk)] text-muted border border-dashed border-line',
    // legacy aliases
    brand: 'bg-brand/12 text-brand-ink',
    load: 'bg-load-soft text-load',
    muted: 'bg-line/40 text-muted',
    warm: 'bg-warm text-gold-ink',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

// ============================================================
// Session-type identity (TB-authored: lift / se / run / hic / rest)
// ============================================================
export const SESSION_META: Record<
  SessionType,
  { label: string; icon: typeof Dumbbell; color: string; bg: string }
> = {
  lift: { label: 'Lift', icon: Dumbbell, color: 'text-brand-ink', bg: 'bg-brand/12' },
  se: { label: 'Circuit', icon: Repeat, color: 'text-load', bg: 'bg-load-soft' },
  run: { label: 'Run', icon: Footprints, color: 'text-run', bg: 'bg-run/15' },
  hic: { label: 'Conditioning', icon: Mountain, color: 'text-hic', bg: 'bg-hic/18' },
  rest: { label: 'Rest', icon: Moon, color: 'text-muted', bg: 'bg-line/40' },
}

export function SessionIcon({ type, size = 22 }: { type: SessionType; size?: number }) {
  const m = SESSION_META[type]
  const Icon = m.icon
  return (
    <span
      className={`inline-flex items-center justify-center rounded-chip elev-sunk ${m.bg} ${m.color}`}
      style={{ width: size + 20, height: size + 20 }}
    >
      <Icon size={size} />
    </span>
  )
}

// ============================================================
// SegmentedPicker — a well with quiet tinted selection
// ============================================================
export type SegOption<T extends string> = { v: T; label: string; tone?: 'green' | 'amber' | 'red'; Icon?: LucideIcon }
const TONE_DOT: Record<string, string> = { green: '#35b37e', amber: 'var(--color-gold)', red: 'var(--color-danger)' }

export function SegmentedPicker<T extends string>({
  label,
  value,
  onChange,
  options,
  toneMode = 'dot',
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: SegOption<T>[]
  /** 'dot' = leading traffic-light dot + ember selection; 'fill' = colour the whole option by its
   *  tone — coloured icon always, tone-tinted selection (feel: easy/ok/hard) */
  toneMode?: 'dot' | 'fill'
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 p-1 rounded-chip bg-[var(--color-surface-sunk)] elev-sunk"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}
    >
      {options.map(({ v, label: text, tone, Icon }) => {
        const on = value === v
        const fill = toneMode === 'fill' && tone
        const selectedStyle =
          on && fill
            ? {
                backgroundColor: `color-mix(in srgb, ${TONE_DOT[tone]} 20%, transparent)`,
                boxShadow: `inset 0 0 0 1.5px ${TONE_DOT[tone]}`,
              }
            : undefined
        const cls = on ? (fill ? 'text-ink' : 'selected-fill') : 'text-muted active:text-ink'
        return (
          <button
            key={v}
            aria-pressed={on}
            onClick={() => onChange(v)}
            style={selectedStyle}
            className={`rounded-[0.5rem] min-h-[2.75rem] text-xs font-bold flex items-center justify-center gap-1.5 transition-[background,color,box-shadow] duration-150 ${cls}`}
          >
            {tone && toneMode === 'dot' && !Icon && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TONE_DOT[tone] }} />
            )}
            {Icon && <Icon size={14} style={tone ? { color: TONE_DOT[tone] } : undefined} />}
            {text}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// Stepper — joined pill well with tabular value
// ============================================================
export function Stepper({
  value,
  onDec,
  onInc,
  labelDec,
  labelInc,
}: {
  value: ReactNode
  onDec: () => void
  onInc: () => void
  labelDec: string
  labelInc: string
}) {
  const buzz = () => {
    try {
      navigator.vibrate?.(8)
    } catch {
      /* no-op */
    }
  }
  return (
    <div className="inline-flex items-center rounded-pill bg-[var(--color-surface-sunk)] elev-sunk overflow-hidden">
      <button
        onClick={() => {
          buzz()
          onDec()
        }}
        aria-label={labelDec}
        className="w-11 h-11 grid place-items-center text-ink active:scale-90 active:bg-brand/10 transition-transform duration-100 ease-[var(--ease-spring)]"
      >
        <Minus size={16} />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="min-w-[3rem] text-center num-display text-2xl text-ink border-x border-line py-0.5"
      >
        {value}
      </span>
      <button
        onClick={() => {
          buzz()
          onInc()
        }}
        aria-label={labelInc}
        className="w-11 h-11 grid place-items-center text-ink active:scale-90 active:bg-brand/10 transition-transform duration-100 ease-[var(--ease-spring)]"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

// ============================================================
// SetCheck — BRASS (earned) check with a haptic pop
// ============================================================
export function SetCheck({ done, onToggle, label }: { done: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={() => {
        if (!done) {
          try {
            navigator.vibrate?.(15)
          } catch {
            /* no-op */
          }
        }
        onToggle()
      }}
      aria-label={label}
      aria-pressed={done}
      className={`w-11 h-11 rounded-chip grid place-items-center transition-colors duration-200 ${
        done ? 'gold-gradient text-[#3a2600] elev-1' : 'bg-[var(--color-surface-sunk)] border border-line text-muted'
      }`}
    >
      <span key={String(done)} className={done ? 'pop-check inline-flex' : 'inline-flex'}>
        <Check size={18} />
      </span>
    </button>
  )
}

// ============================================================
// Toggle — ember switch (replaces native checkbox for on/off)
// ============================================================
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`shrink-0 w-12 h-7 rounded-pill p-0.5 transition-colors duration-200 ${
        checked ? 'glam-gradient' : 'bg-line border border-[var(--color-line-strong)]'
      }`}
    >
      <span
        className={`block w-6 h-6 rounded-pill bg-surface elev-1 transition-transform duration-200 ease-[var(--ease-spring)] ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

// ============================================================
// Checkbox — brass-fill tick (replaces native checkbox in flows)
// ============================================================
export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  // controlled (not CSS peer-checked) so the BRASS fill actually applies — peer-checked can't drive
  // a custom .gold-gradient class
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full"
    >
      <span
        className={`mt-0.5 w-6 h-6 rounded-[0.5rem] grid place-items-center transition shrink-0 ${
          checked ? 'gold-gradient border-2 border-transparent' : 'border-2 border-line bg-[var(--color-surface-sunk)]'
        }`}
      >
        <Check size={14} className={`text-[#3a2600] transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} />
      </span>
      <span className="text-sm text-ink">{children}</span>
    </button>
  )
}

// ============================================================
// EmptyState — on-brand illustration slot
// ============================================================
export function EmptyState({ title, sub, illustration }: { title: string; sub?: string; illustration?: ReactNode }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="inline-flex items-center justify-center mb-3 floaty">
        {illustration ?? <CoinGlyph />}
      </div>
      <p className="font-bold text-ink">{title}</p>
      {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
    </div>
  )
}

/** A challenge coin with a barbell + topo ring — the tactical empty-state / celebration glyph. */
export function CoinGlyph({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="coin-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-gold-hi)" />
          <stop offset="0.55" stopColor="var(--color-gold)" />
          <stop offset="1" stopColor="var(--color-gold-lo)" />
        </linearGradient>
        <linearGradient id="coin-bar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-hot)" />
          <stop offset="1" stopColor="var(--color-brand)" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="44" fill="url(#coin-ring)" />
      <circle cx="48" cy="48" r="34" fill="var(--color-surface)" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      <circle cx="48" cy="48" r="34" fill="none" stroke="url(#coin-ring)" strokeWidth="1.5" opacity="0.5" />
      {/* barbell */}
      <g fill="url(#coin-bar)">
        <rect x="30" y="45" width="36" height="6" rx="3" />
        <rect x="24" y="39" width="6" height="18" rx="2" />
        <rect x="66" y="39" width="6" height="18" rx="2" />
        <rect x="18" y="42" width="5" height="12" rx="2" />
        <rect x="73" y="42" width="5" height="12" rx="2" />
      </g>
    </svg>
  )
}
