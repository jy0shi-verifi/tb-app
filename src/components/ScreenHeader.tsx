import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * A back link for the screens that are not in the tab bar.
 *
 * `/maxes`, `/plan`, `/progression` and `/next-cycle` are all reached from a
 * link rather than a tab, and none of them had a way back — on a phone with no
 * browser chrome that is a dead end you have to kill the app to escape (audit
 * code-03 F11).
 *
 * Falls back to a route rather than `nav(-1)` when there is no history to go
 * back to, which is the case when one of these is opened as a deep link or
 * restored by the PWA.
 */
export default function ScreenHeader({
  title,
  fallback = '/settings',
}: {
  title: string
  fallback?: string
}) {
  const nav = useNavigate()
  return (
    <button
      onClick={() => (window.history.length > 1 ? nav(-1) : nav(fallback))}
      className="flex items-center gap-1 -ml-1 text-muted min-h-11"
      aria-label={`Back from ${title}`}
    >
      <ChevronLeft size={18} />
      <span className="text-[13px] font-bold">Back</span>
    </button>
  )
}
