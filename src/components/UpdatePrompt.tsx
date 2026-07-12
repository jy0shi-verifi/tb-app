import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker once (module scope). In 'prompt' mode a new build
// installs in the background and waits; onNeedRefresh fires so we can offer a
// deliberate reload instead of swapping assets mid-session.
let setNeedRefresh: ((v: boolean) => void) | null = null
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    setNeedRefresh?.(true)
  },
})

/** A small "new version — tap to reload" pill; only shows once an update waits. */
export default function UpdatePrompt() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setNeedRefresh = setShow
    return () => {
      setNeedRefresh = null
    }
  }, [])

  if (!show) return null
  return (
    <div className="fixed bottom-24 inset-x-0 px-4 z-30 timer-in">
      <div className="max-w-xl mx-auto rounded-field reward-panel text-white elev-2 px-4 py-3 flex items-center gap-3">
        <p className="flex-1 text-sm font-bold hero-text">New version ready</p>
        <button
          onClick={() => updateSW(true)}
          className="rounded-pill bg-white/20 px-4 min-h-11 text-sm font-bold active:scale-95"
        >
          Reload
        </button>
        <button
          onClick={() => setShow(false)}
          className="rounded-pill bg-white/10 px-3 min-h-11 text-sm font-semibold"
          aria-label="Later"
        >
          Later
        </button>
      </div>
    </div>
  )
}
