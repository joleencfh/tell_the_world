'use client'

import { useEffect, useRef } from 'react'

// The wordmark's two circles, blown up as the section's one graphic, with
// each audience's copy flanking it from xl (1280px) up — below that,
// including tablet, it stays stacked (circle on top, copy below). The
// flank only kicks in that late because the text columns are wide enough
// (23rem, widened to stop the pink line wrapping to 3 lines) that
// flanking any earlier would overflow the viewport. Fully met, the
// circles sit at exactly 50% offset — same ratio as the 12px/6px mark in
// the header (components/ui/Logo.tsx), just bigger, not a new proportion.
//
// The circles start apart while the viewer is still in the hero and
// slide together as this section scrolls into view, tracking scroll
// position directly (not a fire-once entrance animation) — scroll back
// up and they separate again. See the scroll handler below and the
// --meet-driven transform on .circle-meet-pink/.circle-meet-blue in
// app/globals.css.
export default function TwoCirclesSection() {
  const pairRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = pairRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--meet', '1')
      return
    }

    let ticking = false

    function update() {
      ticking = false
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // Fully apart while the circle pair's top is at or below the
      // viewport's bottom edge (still in the hero); fully met once it's
      // scrolled up to 35% down the viewport.
      const start = vh
      const end = vh * 0.35
      const raw = (start - rect.top) / (start - end)
      const progress = Math.min(1, Math.max(0, raw))
      el.style.setProperty('--meet', String(progress))
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section className="px-6 pt-[3.78rem] pb-[5.6rem]">
      <div className="mx-auto max-w-6xl">
        <div className="mt-[3.15rem] grid grid-cols-1 items-center justify-items-center gap-12 xl:mt-[5.985rem] xl:grid-cols-[1fr_auto_1fr] xl:gap-10">
          <div className="max-w-[23rem] text-center xl:text-right">
            <span className="mb-2.5 block font-mono text-[10.5px] tracking-[0.16em] uppercase text-pink-ink">
              Creators &amp; journalists
            </span>
            <p className="font-display text-lg leading-snug font-bold text-ink">
              Know how to turn complicated research into stories people can relate to.
            </p>
          </div>

          <div ref={pairRef} className="relative order-first h-40 w-60 xl:order-none" aria-hidden>
            <span className="circle-meet-pink absolute top-1/2 left-0 h-40 w-40 rounded-full bg-pink" />
            <span className="circle-meet-blue absolute top-1/2 left-20 h-40 w-40 rounded-full bg-blue mix-blend-multiply" />
          </div>

          <div className="max-w-[23rem] text-center xl:text-left">
            <span className="mb-2.5 block font-mono text-[10.5px] tracking-[0.16em] uppercase text-blue-ink">
              Researchers &amp; organisations
            </span>
            <p className="font-display text-lg leading-snug font-bold text-ink">
              Have important messages on how to make AI go well.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
