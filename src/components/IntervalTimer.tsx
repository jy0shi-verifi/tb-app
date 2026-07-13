import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipForward } from 'lucide-react'
import type { Interval } from '../beginner'
import { Button } from './ui'

function buzz(p: number | number[]) {
  try {
    navigator.vibrate?.(p)
  } catch {
    /* unsupported */
  }
}
let audioCtx: AudioContext | null = null
function primeAudio() {
  try {
    audioCtx = audioCtx ?? new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    /* no audio */
  }
}
function tones(freqs: number[]) {
  try {
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    const t0 = audioCtx.currentTime
    freqs.forEach((f, i) => {
      const at = t0 + i * 0.18
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.connect(g)
      g.connect(audioCtx!.destination)
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, at)
      g.gain.exponentialRampToValueAtTime(0.35, at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
      o.start(at)
      o.stop(at + 0.18)
    })
  } catch {
    /* no audio */
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** A C25K run/walk interval player — counts down each interval, cues jog↔walk changes
 *  with a beep + vibrate, and calls onComplete when the sequence ends. */
export default function IntervalTimer({
  intervals,
  onComplete,
}: {
  intervals: Interval[]
  onComplete: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(intervals[0]?.sec ?? 0)
  const [finished, setFinished] = useState(false)
  const endRef = useRef<number | null>(null)

  const cur = intervals[idx]
  const nxt = intervals[idx + 1]
  const totalSec = intervals.reduce((n, i) => n + i.sec, 0)
  const doneSec = intervals.slice(0, idx).reduce((n, i) => n + i.sec, 0) + ((cur?.sec ?? 0) - remaining)

  // keep the screen awake while a run is timing
  useEffect(() => {
    if (!running) return
    let sentinel: { release: () => void } | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigator as any).wakeLock?.request('screen').then((s: any) => (sentinel = s)).catch(() => {})
    return () => {
      try {
        sentinel?.release()
      } catch {
        /* ignore */
      }
    }
  }, [running])

  useEffect(() => {
    if (!running || endRef.current == null) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current! - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) advance()
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, idx])

  function startInterval(nextIdx: number) {
    const iv = intervals[nextIdx]
    if (!iv) {
      setFinished(true)
      setRunning(false)
      endRef.current = null
      buzz([200, 100, 200, 100, 300])
      tones([880, 1040, 1240])
      onComplete()
      return
    }
    setIdx(nextIdx)
    setRemaining(iv.sec)
    endRef.current = Date.now() + iv.sec * 1000
  }

  function advance() {
    const next = intervals[idx + 1]
    if (next) {
      // cue the change: JOG = rising double, WALK = low single
      if (next.kind === 'jog') {
        tones([740, 990])
        buzz([120, 60, 180])
      } else {
        tones([420])
        buzz(220)
      }
    }
    startInterval(idx + 1)
  }

  function toggle() {
    if (finished) return
    if (running) {
      setRunning(false)
      endRef.current = null
    } else {
      primeAudio()
      endRef.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  const isJog = cur?.kind === 'jog'
  const pct = totalSec ? Math.min(100, (doneSec / totalSec) * 100) : 0

  if (finished) {
    return (
      <div className="rounded-card reward-panel text-white p-5 text-center elev-2">
        <p className="text-3xl">🏁</p>
        <p className="font-bold text-lg mt-1">Run complete</p>
        <p className="text-sm text-white/85 mt-1">Nice work. Mark it done below.</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-card p-5 text-center elev-2 text-white transition-colors ${
        isJog ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-run)]'
      }`}
    >
      <p className="eyebrow text-white/80">
        {isJog ? 'JOG' : cur?.sec === 300 && idx === 0 ? 'WARM-UP WALK' : 'WALK'} · interval {idx + 1}/{intervals.length}
      </p>
      <p className="num-display text-6xl leading-none my-2 hero-text">{fmt(remaining)}</p>
      <p className="text-sm text-white/85">
        {nxt ? `Next: ${nxt.kind === 'jog' ? 'jog' : 'walk'} ${fmt(nxt.sec)}` : 'Last one — finish strong'}
      </p>
      <div className="h-1.5 rounded-full bg-white/25 overflow-hidden my-3">
        <div className="h-full bg-white/90 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 justify-center">
        <Button variant="secondary" className="flex-1 !bg-white/15 !text-white border-0" onClick={toggle}>
          {running ? (
            <>
              <Pause size={18} className="inline -mt-0.5" /> Pause
            </>
          ) : (
            <>
              <Play size={18} className="inline -mt-0.5" /> {remaining === (cur?.sec ?? 0) && idx === 0 ? 'Start run' : 'Resume'}
            </>
          )}
        </Button>
        <button
          onClick={advance}
          aria-label="Skip interval"
          className="rounded-pill bg-white/15 w-12 grid place-items-center active:bg-white/25"
        >
          <SkipForward size={18} />
        </button>
      </div>
      <p className="text-[11px] text-white/70 mt-3">Keep your phone unlocked so it can beep you through. Jog easy — talk-pace.</p>
    </div>
  )
}
