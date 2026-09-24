import RevealOnScroll from './RevealOnScroll'

// conference-landing-page-plan.md §0 — "Why this matters now". A full-width
// text beat (no image, no CTA) between the audience cards and the two demo
// sections, on its own soft pink-bloom tint so it reads as a distinct block
// rather than fading into the plain-white sections on either side. Bounded
// top and bottom by a thin rule for the same reason.
export default function WhyThisMattersNow() {
  return (
    <section
      className="border-t border-b border-line-strong bg-paper px-6 py-[5.5rem]"
      style={{ backgroundImage: 'radial-gradient(38rem 22rem at 50% 30%, rgba(240,25,126,.10), rgba(240,25,126,0) 70%)' }}
    >
      <RevealOnScroll className="mx-auto max-w-[44rem] text-center">
        <div className="mb-[1.1rem] inline-flex items-center justify-center gap-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink" aria-hidden />
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-pink-ink">
            Why this matters now
          </span>
        </div>

        <h2
          className="font-display font-extrabold tracking-tight text-ink mb-6"
          style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)', lineHeight: 1.15 }}
        >
          Attention shows up. <span className="text-pink">Understanding doesn&rsquo;t stick.</span>
        </h2>

        <p
          className="font-body text-ink-soft mx-auto"
          style={{ fontSize: '1.02rem', lineHeight: 1.7, maxWidth: '38rem' }}
        >
          Every few months a warning from inside a frontier lab goes viral and the whole internet spends a
          week arguing about AI risk. Then it fades, and what&rsquo;s left is confusion and a fight split
          down party lines, not a public that understands the problem any better. People are already paying
          attention. What&rsquo;s missing is careful explanation from the people who actually study this,
          coming from voices audiences already trust.
        </p>
      </RevealOnScroll>
    </section>
  )
}
