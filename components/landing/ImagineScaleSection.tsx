import RevealOnScroll from './RevealOnScroll'

// conference-landing-page-plan.md §0 — "Imagine + scale", replacing the
// earlier short "differentiation line" pull-quote with a more developed
// argument + stat callout. Full-bleed reversed band (--color-blue-ink),
// sitting right before the closing ask as the emotional-plus-rational beat
// that sets up "join now".
export default function ImagineScaleSection() {
  return (
    <section className="bg-blue-ink px-6 py-16">
      <RevealOnScroll className="mx-auto max-w-[42rem] text-center">
        <div className="mb-4 inline-flex items-center justify-center gap-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink" aria-hidden />
          <span className="font-mono text-xs tracking-[0.25em] uppercase" style={{ color: '#B9C6F2' }}>
            Why this could be big
          </span>
        </div>

        <h2
          className="font-display font-extrabold tracking-tight text-white mb-5"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2.15rem)', lineHeight: 1.25 }}
        >
          Imagine every AI safety expert&rsquo;s public voice, in one place &amp; in multiple languages.
        </h2>

        <p style={{ color: '#E2E8FC', fontSize: '1rem', lineHeight: 1.75, marginBottom: '2.75rem' }}>
          Right now the case for AI safety lives in scattered X threads, Substack posts, and research papers.
          What if a critical minority of the world&rsquo;s communicators could draw from all of it in one
          place, with a name and a face behind every claim?
        </p>

        <div
          className="font-extrabold text-white"
          style={{ fontSize: 'clamp(2.6rem, 7vw, 3.75rem)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        >
          <span className="text-pink">200,000</span>
        </div>
        <div
          className="font-mono uppercase mt-2.5 mb-7"
          style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: '#B9C6F2' }}
        >
          Creators reached, before journalists even factor in
        </div>

        <p className="mx-auto" style={{ color: '#B9C6F2', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '34rem' }}>
          Just 5% of creators with more than 10,000 followers, across ten G20 countries, would
          bring around 200,000 creators into AI safety communications, each reaching thousands of people
          directly. Add even a small share of journalists and the reach grows further.
        </p>
      </RevealOnScroll>
    </section>
  )
}
