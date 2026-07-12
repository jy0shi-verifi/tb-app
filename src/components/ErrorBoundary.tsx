import { Component, type ReactNode } from 'react'
import { downloadBackup } from '../lib/backup'
import { saveSettings, DEFAULT_SETTINGS } from '../db'
import { nextMonday } from '../lib/date'

interface State {
  error: Error | null
}

/**
 * Catches a render/runtime crash anywhere in the tree and shows a recovery
 * screen INSTEAD of a white void — critically, with a one-tap "export my data"
 * so a 6am crash can never trap his history behind a broken screen.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-canvas text-ink">
        <div className="max-w-sm w-full space-y-4 text-center rounded-card bg-surface border border-line elev-2 p-6">
          <p className="text-2xl">😵‍💫</p>
          <h1 className="display-hero text-xl">Something broke</h1>
          <p className="text-sm text-muted">
            The app hit an error. Your data is still safe on this device — export a backup first, then
            try reloading.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => downloadBackup()}
              className="w-full rounded-pill px-5 min-h-[3rem] font-bold reward-panel text-white elev-2 active:brightness-95"
            >
              Export my data
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-pill px-5 min-h-[3rem] font-bold bg-warm text-ink border border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] active:brightness-95"
            >
              Reload the app
            </button>
            <button
              onClick={async () => {
                if (!window.confirm('Reset app settings to defaults? Your logged sessions are kept.'))
                  return
                await saveSettings({ ...DEFAULT_SETTINGS, phaseStartDate: nextMonday(), onboarded: true })
                window.location.reload()
              }}
              className="w-full text-xs text-muted py-2"
            >
              Reset settings (keeps history) →
            </button>
          </div>
          <p className="text-[11px] text-muted/70 break-words">{this.state.error.message}</p>
        </div>
      </div>
    )
  }
}
