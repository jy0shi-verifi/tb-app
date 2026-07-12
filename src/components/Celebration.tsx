import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, Trophy } from 'lucide-react'
import { Button, Card } from './ui'
import ShareWin from './ShareWin'

export type CelebrationIcon = 'trophy' | 'check'

export interface CelebrationContent {
  title: string
  sub: string
  icon?: CelebrationIcon
  /** when present, offer a "Share this win" image button */
  share?: { headline: string; sub: string }
}

const ICONS = { trophy: Trophy, check: Check }

/** One-shot full-screen celebration thrown after a TB win (PR, block done, Test Day, milestone). */
export default function Celebration({
  content,
  onClose,
}: {
  content: CelebrationContent
  onClose: () => void
}) {
  const Icon = ICONS[content.icon ?? 'check']
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus() // move focus into the dialog for keyboard/screen-reader users
    try {
      navigator.vibrate?.([15, 40, 15]) // a little triple-buzz flourish
    } catch {
      /* no-op */
    }
    return () => prevFocus?.focus?.() // restore focus to whatever triggered the dialog
  }, [])

  // Keep Tab focus inside the dialog while it's open.
  const trap = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !dialogRef.current) return
    const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md scrim-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebrate-title"
      onClick={onClose}
      onKeyDown={trap}
    >
      {/* confetti burst from centre — deterministic spread (no RNG) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2
          const r = 66 + (i % 3) * 32
          const star = i % 6 === 0
          const c = i % 3 === 0 ? 'var(--color-hot)' : i % 3 === 1 ? 'var(--color-purple)' : 'var(--color-gold)'
          const style = {
            '--tx': `${Math.cos(a) * r}px`,
            '--ty': `${Math.sin(a) * r}px`,
            '--rot': `${140 + i * 22}deg`,
            animationDelay: `${(i % 4) * 40}ms`,
            ...(star ? { color: 'var(--color-gold)' } : { background: c }),
          } as unknown as CSSProperties
          return star ? (
            <span key={i} className="confetti-dot absolute text-sm leading-none" style={style} aria-hidden="true">
              ✦
            </span>
          ) : (
            <span
              key={i}
              className={`confetti-dot absolute ${i % 2 ? 'w-2 h-2 rounded-full' : 'w-2.5 h-2.5 rounded-[3px]'}`}
              style={style}
              aria-hidden="true"
            />
          )
        })}
      </div>

      <div className="relative max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
      <Card
        pad="lg"
        elev="hero"
        className="hero-block topo-whisper text-center w-full celebrate relative"
      >
        {/* brass glow behind the medallion */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-4 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-gold) 40%, transparent), transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="relative inline-grid place-items-center w-[72px] h-[72px] rounded-pill gold-gradient text-on-gold mb-3 shadow-[var(--elev-1),inset_0_0_0_2px_rgba(255,255,255,0.45)] pop-check">
          <Icon size={34} strokeWidth={content.icon === 'check' ? 3 : 2} />
        </div>
        <p id="celebrate-title" className="relative display-hero text-3xl text-ink">
          {content.title}
        </p>
        <p className="relative text-muted text-sm mt-2">{content.sub}</p>
        <Button className="relative w-full mt-5" onClick={onClose} ref={closeRef}>
          Onwards
        </Button>
        {content.share && (
          <div className="relative mt-3">
            <ShareWin headline={content.share.headline} sub={content.share.sub} className="text-brand-ink" />
          </div>
        )}
      </Card>
      </div>
    </div>,
    document.body,
  )
}
