import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, CalendarDays, History as HistoryIcon, BookOpen, Settings as SettingsIcon } from 'lucide-react'
import { useSettings } from '../hooks'
import { PHASES, resolvePosition } from '../program'
import { today } from '../lib/date'
import { Wordmark } from './ui'

const NAV = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/program', label: 'Program', icon: CalendarDays },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/guide', label: 'Guide', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

const buzz = () => {
  try {
    navigator.vibrate?.(6)
  } catch {
    /* no-op */
  }
}

export default function Layout() {
  const settings = useSettings()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const pageTitle = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'Tactical Barbell'

  const pos = resolvePosition(settings, today())
  // resolvePosition already falls back to a real phase, so this cannot be undefined
  // for a stored id that no longer exists.
  const phase = PHASES[pos.phaseId]
  const context =
    pos.status === 'active' ? `${phase.name} · Wk ${pos.week}` : (phase?.name ?? 'Tactical Barbell')

  return (
    <>
      <div className="grain" aria-hidden />
      <div className="relative z-[1] h-[100dvh] flex flex-col">
        {/* header — slim topo bar with scroll-elevation */}
        <header
          className={`safe-top topo-hero text-white shrink-0 transition-shadow duration-300 ${
            scrolled ? 'header-scrolled' : ''
          }`}
        >
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <Wordmark size="sm" onDark />
            <div className="text-right leading-none shrink-0">
              <span className="block display-hero text-[13px] tracking-wide text-white hero-text">
                Be a fucking pro
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-white/70 mt-0.5">
                {context}
              </span>
            </div>
          </div>
        </header>

        {/* content — the scroll container (native momentum, fixed chrome) */}
        <main
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain"
        >
          <div className="max-w-xl mx-auto px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
            <h1 className="sr-only">{pageTitle}</h1>
            <Outlet />
          </div>
        </main>
      </div>

      {/* floating glass tab bar with an ember active pill */}
      <nav className="fixed bottom-0 inset-x-0 z-10 safe-bottom bg-surface/85 backdrop-blur-xl border-t border-line/60 shadow-[0_-8px_28px_-18px_color-mix(in_srgb,var(--color-brand)_45%,transparent)]">
        {/* column count follows NAV so adding/removing a tab can't break the bar */}
        <div
          className="max-w-xl mx-auto grid"
          style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
        >
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={buzz}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-bold active:scale-90 transition-transform ${
                    isActive ? 'text-brand-ink' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex items-center justify-center w-14 h-8 rounded-pill transition-all duration-200 ease-[var(--ease-spring)] ${
                        isActive ? 'bg-brand/12 -translate-y-0.5 scale-110' : ''
                      }`}
                    >
                      <Icon size={24} strokeWidth={isActive ? 2.4 : 1.9} />
                    </span>
                    {n.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
