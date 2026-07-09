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
    <div className="fixed bottom-24 inset-x-0 px-4 z-30">
      <div className="max-w-xl mx-auto rounded-xl bg-brand text-white shadow-lg px-4 py-3 flex items-center gap-3">
        <p className="flex-1 text-sm font-semibold">New version ready</p>
        <button
          onClick={() => updateSW(true)}
          className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold active:scale-95"
        >
          Reload
        </button>
        <button
          onClick={() => setShow(false)}
          className="rounded-lg bg-white/10 px-2 py-1.5 text-sm"
          aria-label="Later"
        >
          Later
        </button>
      </div>
    </div>
  )
}
