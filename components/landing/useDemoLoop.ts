'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Shared by the landing page's two demos (design-system.md, Motion).
//
// - Plays once, when the demo is mostly in view, then holds its last frame.
//   Nothing loops. It stops when the demo leaves view or the tab is hidden,
//   so nothing animates off screen, and picks up where it left off.
// - Pause / Play from the window's chrome (WCAG 2.2.2). After the end, Play
//   replays from the start.
// - With prefers-reduced-motion it never starts by itself: callers show their
//   rest frame, and Play is still there for a visitor who wants to watch.
// - Server render and first paint are the rest frame, so the page is complete
//   without JS.

interface UseDemoClockOptions {
  /** Length of the one pass, in ms. The clock holds at this value afterwards. */
  durationMs: number
  /** The moment shown with no JS, with reduced motion, or before the demo is first seen. */
  restMs: number
  tickMs?: number
}

/**
 * A demo driven by one clock. Returns `t`, the ms elapsed in the pass, so every
 * visual state can be a pure function of `t`. Pausing stops the clock and
 * resuming carries on from the same moment.
 */
export function useDemoClock({ durationMs, restMs, tickMs = 50 }: UseDemoClockOptions) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [paused, setPaused] = useState(false)
  // Assume reduced until we have asked, so the first frame is the rest frame.
  const [reduced, setReduced] = useState(true)
  // A visitor with reduced motion pressed Play: that is an explicit opt-in.
  const [optedIn, setOptedIn] = useState(false)
  const [elapsed, setElapsed] = useState(-1)

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

  const allowed = !reduced || optedIn
  const finished = elapsed >= durationMs
  const running = allowed && inView && tabVisible && !paused && !finished

  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(now - last, 250)
      last = now
      setElapsed((e) => Math.min(durationMs, (e < 0 ? 0 : e) + dt))
    }, tickMs)
    return () => clearInterval(id)
  }, [running, durationMs, tickMs])

  const toggle = useCallback(() => {
    if (!allowed) {
      setOptedIn(true)
      setPaused(false)
      setElapsed(0)
    } else if (finished) {
      setPaused(false)
      setElapsed(0)
    } else {
      setPaused((p) => !p)
    }
  }, [allowed, finished])

  const t = !allowed || elapsed < 0 ? restMs : elapsed
  /** True once the clock has actually started (not the rest frame). */
  const live = allowed && elapsed >= 0
  /** What the button offers: Pause only while the clock is meant to be running. */
  const playing = allowed && !paused && !finished

  return { ref, t, live, playing, toggle }
}
