import type { ReactNode } from 'react'
import type { SessionType } from '../types'
import { Dumbbell, Footprints, Mountain, Repeat, Moon } from 'lucide-react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl bg-surface border border-line/70 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles: Record<string, string> = {
    primary: 'bg-brand text-white active:bg-brand-dark',
    secondary: 'bg-load-soft text-load active:brightness-95',
    ghost: 'bg-transparent text-brand active:bg-line/30',
    danger: 'bg-red-50 text-red-700 active:bg-red-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-3 font-semibold text-base transition active:scale-[0.98] disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Pill({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'load' | 'muted' | 'warm' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand/10 text-brand',
    load: 'bg-load-soft text-load',
    muted: 'bg-line/40 text-muted',
    warm: 'bg-warm text-warm-edge',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export const SESSION_META: Record<
  SessionType,
  { label: string; icon: typeof Dumbbell; color: string; bg: string }
> = {
  lift: { label: 'Lift', icon: Dumbbell, color: 'text-brand', bg: 'bg-brand/10' },
  se: { label: 'SE Circuit', icon: Repeat, color: 'text-load', bg: 'bg-load-soft' },
  run: { label: 'Run', icon: Footprints, color: 'text-accent', bg: 'bg-accent/10' },
  hic: { label: 'HIC', icon: Mountain, color: 'text-orange-600', bg: 'bg-orange-100' },
  rest: { label: 'Rest', icon: Moon, color: 'text-muted', bg: 'bg-line/40' },
}

export function SessionIcon({ type, size = 22 }: { type: SessionType; size?: number }) {
  const m = SESSION_META[type]
  const Icon = m.icon
  return (
    <span className={`inline-flex items-center justify-center rounded-xl ${m.bg} ${m.color}`} style={{ width: size + 20, height: size + 20 }}>
      <Icon size={size} />
    </span>
  )
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center py-10 px-6">
      <p className="font-semibold text-ink">{title}</p>
      {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
    </div>
  )
}
