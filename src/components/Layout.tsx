import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, CalendarDays, History, Calculator, Settings } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/program', label: 'Program', icon: CalendarDays },
  { to: '/history', label: 'History', icon: History },
  { to: '/maxes', label: 'Maxes', icon: Calculator },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const TITLES: Record<string, string> = {
  '/': 'Today',
  '/program': 'Program',
  '/history': 'History',
  '/maxes': 'Maxes & Calculator',
  '/settings': 'Settings',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'Tactical Barbell'
  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* header */}
      <header className="safe-top bg-brand text-white sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold tracking-tight">{title}</span>
          <span className="text-xs font-semibold text-white/70">TACTICAL BARBELL</span>
        </div>
      </header>

      {/* content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 pb-28">
        <Outlet />
      </main>

      {/* bottom nav */}
      <nav className="safe-bottom fixed bottom-0 inset-x-0 bg-surface border-t border-line z-10">
        <div className="max-w-xl mx-auto grid grid-cols-5">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                    isActive ? 'text-brand' : 'text-muted'
                  }`
                }
              >
                <Icon size={22} />
                {n.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
