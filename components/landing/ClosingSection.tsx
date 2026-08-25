import RevealOnScroll from './RevealOnScroll'

interface ClosingSectionProps {
  onJoinWaitlist: () => void
  onBecomeEarlyTester: () => void
}

// Minimalist title: plain key colors, no gradient. "Are you ready to"
// stays quiet; "Tell"/"World" get the brand colors, "The" stays neutral
// so the two colored words carry the emphasis instead of the whole line.
export default function ClosingSection({ onJoinWaitlist, onBecomeEarlyTester }: ClosingSectionProps) {
  return (
    <section className="px-6 pt-[4.2rem] pb-32 text-center">
      <RevealOnScroll className="mx-auto max-w-2xl">
        <p
          className="font-body font-medium text-ink-soft"
          style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)', marginBottom: '0.5rem' }}
        >
          Are you ready to
        </p>

        <p
          className="font-display font-extrabold tracking-tight"
          style={{ fontSize: 'clamp(2.2rem, 6vw, 3.4rem)', lineHeight: 1.1, marginBottom: '3rem' }}
        >
          <span className="text-pink">Tell</span> <span className="text-ink">The</span>{' '}
          <span className="text-blue">World?</span>
        </p>

        <div className="anim-nudge mb-12 flex justify-center" aria-hidden>
          <svg viewBox="0 0 20 46" width="20" height="46">
            <defs>
              <linearGradient id="closing-arrow-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--color-pink)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-blue)' }} />
              </linearGradient>
            </defs>
            <line x1="10" y1="0" x2="10" y2="34" stroke="url(#closing-arrow-gradient)" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M2 28 L10 38 L18 28"
              stroke="url(#closing-arrow-gradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <button
            type="button"
            onClick={onJoinWaitlist}
            className="w-full max-w-[20rem] whitespace-normal border-2 border-blue-ink bg-blue-ink px-4 py-3.5 text-center font-display text-sm font-bold tracking-wide uppercase text-white transition-colors hover:bg-white hover:text-blue-ink min-[480px]:w-64 min-[480px]:max-w-none min-[480px]:whitespace-nowrap"
          >
            Join the waitlist
          </button>

          <div className="group relative flex w-full max-w-[20rem] min-[480px]:w-auto min-[480px]:max-w-none">
            <button
              type="button"
              onClick={onBecomeEarlyTester}
              aria-describedby="early-tester-tip"
              className="w-full whitespace-normal border-2 border-ink px-4 py-3.5 text-center font-display text-sm font-bold tracking-wide uppercase text-ink transition-colors hover:bg-ink hover:text-white min-[480px]:w-64 min-[480px]:whitespace-nowrap"
            >
              Become an early tester
            </button>
            <span
              id="early-tester-tip"
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 w-56 -translate-x-1/2 translate-y-1 rounded-sm bg-ink px-3 py-2.5 text-left font-body text-xs leading-snug text-white opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              Try Tell The World while it&rsquo;s still rough, and help us fix it.
              <span
                aria-hidden
                className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink"
              />
            </span>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  )
}
