import { useEffect, useRef, useState } from 'react'

// Play the cold-open intro at most once per page load. A full (cold) PWA launch
// remounts the app → this module reloads → flag resets → it plays again. Route
// changes within a session don't remount App, so it won't replay mid-use.
let introConsumed = false

/**
 * Decide (and consume) whether the intro should play on this mount. Called from a
 * useState initializer, so it must be safe to call once per real mount. The e2e
 * suite sets `tb-no-splash` so the overlay never covers the app under test.
 */
export function shouldPlayIntro(): boolean {
  if (introConsumed) return false
  introConsumed = true
  try {
    if (localStorage.getItem('tb-no-splash')) return false
  } catch {
    /* localStorage unavailable — fine to play */
  }
  return true
}

const reducedMotion = (): boolean => {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/**
 * "The Strike" — the daily reveille. On every cold open the motto slams in
 * (die-stamp), an ember flash blooms, a brass sheen sweeps across, then it fades
 * into the app. Tap anywhere to skip. CSS-only motion; honours reduced-motion
 * (the global rule collapses the animations, so it just shows + holds + fades).
 */
export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)
  const timers = useRef<number[]>([])

  const finish = () => {
    if (done.current) return
    done.current = true
    setLeaving(true)
    timers.current.push(window.setTimeout(onDone, 380))
  }

  useEffect(() => {
    const reduced = reducedMotion()
    timers.current.push(window.setTimeout(finish, reduced ? 900 : 1500))
    const t = timers.current
    return () => t.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      role="presentation"
      data-testid="intro-splash"
      onClick={finish}
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none ${
        leaving ? 'splash-out' : ''
      }`}
      style={{ background: '#0B0C0E' }}
    >
      {/* tactical texture + ember bloom on impact */}
      <div className="absolute inset-0 topo-print opacity-[0.06]" aria-hidden />
      <div
        className="absolute inset-0 splash-flash"
        aria-hidden
        style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(255,106,61,0.30), transparent 70%)' }}
      />
      <div className="grain" aria-hidden />

      {/* the motto — struck in, one line at a time */}
      <div className={`relative px-6 text-center ${leaving ? '' : 'splash-shake'}`}>
        <div className="shimmer-sweep inline-block">
          <div className="display-hero hero-text leading-[0.86] text-white text-[16vw] sm:text-7xl">
            <span className="block splash-strike" style={{ animationDelay: '0ms' }}>
              Be a
            </span>
            <span className="block splash-strike" style={{ color: 'var(--color-hot)', animationDelay: '110ms' }}>
              fucking
            </span>
            <span className="block splash-strike" style={{ animationDelay: '220ms' }}>
              pro
            </span>
          </div>
        </div>
        {/* ember→brass underscore sweeps out beneath */}
        <div
          className="splash-bar mx-auto mt-4 h-[3px] w-2/3 rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-hot), var(--color-gold))', animationDelay: '360ms' }}
          aria-hidden
        />
      </div>

      <span className="sr-only">Be a fucking pro</span>
    </div>
  )
}
