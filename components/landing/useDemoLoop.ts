'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Shared by the landing page's two demos (design-system.md, Motion).
//
// - Runs only once the demo is mostly in view, and stops when it leaves view
//   or the tab is hidden, so nothing animates off screen.
// - Pause / Play from the window's chrome (WCAG 2.2.2).
// - With prefers-reduced-motion it never runs: callers show their rest frame.
// - Server render and first paint are the rest frame, so the page is complete
//   without JS.
function useDemoGate() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [paused, setPaused] = useState(false)
  // Assume reduced until we have asked, so the first frame is the rest frame.
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // "Mostly in view": 40% of the demo, or half the viewport for a demo
        // taller than the screen (a phone).
        const tallEnough = entry.intersectionRect.height >= window.innerHeight * 0.5
        setInView(entry.isIntersecting && (entry.intersectionRatio >= 0.4 || tallEnough))
      },
      { threshold: [0, 0.2, 0.4, 0.6, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const togglePause = useCallback(() => setPaused((p) => !p), [])
  const running = inView && tabVisible && !paused && !reduced

  return { ref, running, paused, togglePause, reduced }
}

interface UseDemoLoopOptions {
  /** How long each beat stays on screen, in ms. Beat i lasts durations[i]. */
  durations: readonly number[]
  /** The beat shown with no JS, with reduced motion, or before the demo is first seen. */
  restBeat: number
}

/** A demo made of a few discrete beats (the Q&A). */
export function useDemoLoop({ durations, restBeat }: UseDemoLoopOptions) {
  const { ref, running, paused, togglePause, reduced } = useDemoGate()
  // -1 until the demo has first been seen and started; then counts every beat
  // shown, so the current beat is step % durations.length.
  const [step, setStep] = useState(-1)

  useEffect(() => {
    if (!running) return
    // The first tick fires immediately and moves from the rest frame to beat 0.
    const delay = step < 0 ? 0 : durations[step % durations.length]
    const timer = setTimeout(() => setStep((s) => s + 1), delay)
    return () => clearTimeout(timer)
  }, [running, step, durations])

  const beat = reduced || step < 0 ? restBeat : step % durations.length

  return { ref, beat, paused, togglePause, reduced }
}

interface UseDemoClockOptions {
  /** Length of one full cycle, in ms. The clock wraps back to 0 after it. */
  cycleMs: number
  /** The moment shown with no JS, with reduced motion, or before the demo is first seen. */
  restMs: number
  tickMs?: number
}

/**
 * A demo driven by one clock (the quote demo, with its cursor and typing).
 * Returns `t`, the ms elapsed in the current cycle. Pausing stops the clock
 * and resuming carries on from the same moment, so every visual state can be
 * a pure function of `t`.
 */
export function useDemoClock({ cycleMs, restMs, tickMs = 50 }: UseDemoClockOptions) {
  const { ref, running, paused, togglePause, reduced } = useDemoGate()
  const [elapsed, setElapsed] = useState(-1)

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(now - last, 250)
      last = now
      setElapsed((e) => ((e < 0 ? 0 : e) + dt) % cycleMs)
    }, tickMs)
    return () => clearInterval(id)
  }, [running, cycleMs, tickMs])

  const t = reduced || elapsed < 0 ? restMs : elapsed
  /** True once the clock has actually started (not the rest frame). */
  const live = !reduced && elapsed >= 0

  return { ref, t, live, paused, togglePause, reduced }
}
