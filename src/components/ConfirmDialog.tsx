import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card } from './ui'

export type ConfirmOpts = {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type Slot = ConfirmOpts & { resolve: (v: boolean) => void }

let setter: ((s: Slot | null) => void) | null = null

/** In-app confirm. Falls back to window.confirm if the host isn't mounted yet. */
export function confirmAction(opts: ConfirmOpts): Promise<boolean> {
  if (!setter) {
    return Promise.resolve(window.confirm([opts.title, opts.body].filter(Boolean).join('\n\n')))
  }
  return new Promise((resolve) => setter!({ ...opts, resolve }))
}

export function ConfirmHost() {
  const [slot, setSlot] = useState<Slot | null>(null)
  const okRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setter = setSlot
    return () => {
      if (setter === setSlot) setter = null
    }
  }, [])

  useEffect(() => {
    if (!slot) return
    okRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        slot.resolve(false)
        setSlot(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slot])

  if (!slot) return null

  const close = (v: boolean) => {
    slot.resolve(v)
    setSlot(null)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      role="presentation"
      onClick={() => close(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Card elev="2" pad="lg">
          <h2 id="confirm-title" className="display-hero text-xl text-ink">
            {slot.title}
          </h2>
          {slot.body && <p className="text-sm text-muted mt-2 whitespace-pre-line leading-relaxed">{slot.body}</p>}
          <div className="flex gap-2 mt-5">
            <Button variant="ghost" className="flex-1" onClick={() => close(false)}>
              {slot.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={slot.danger ? 'danger' : 'primary'}
              className="flex-1"
              ref={okRef}
              onClick={() => close(true)}
            >
              {slot.confirmLabel ?? 'OK'}
            </Button>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  )
}
