import RevealOnScroll from './RevealOnScroll'

interface ClosingSectionProps {
  onApplyAsExpertOrg: () => void
  onJoinWaitlist: () => void
  onBecomeEarlyTester: () => void
}

// conference-landing-page-plan.md §0 — the closing ask, replacing the old
// single waitlist CTA block with two role-specific columns (researchers &
// organisations vs. creators & journalists), each opening WaitlistModal
// with its own role pre-selected. "Become an early tester" now lives as a
// single line below both columns rather than its own button.
export default function ClosingSection({ onApplyAsExpertOrg, onJoinWaitlist, onBecomeEarlyTester }: ClosingSectionProps) {
  return (
    <section className="px-6 pt-16 pb-32">
      <RevealOnScroll className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4 border-2 border-ink p-8">
            <span className="inline-flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.16em] uppercase text-blue-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden />
              For researchers &amp; organisations
            </span>
            <p className="font-body text-[0.92rem] leading-relaxed text-ink-soft">
              Join as an early user and help shape the first briefs and Q&amp;A threads creators and
              journalists will actually use.
            </p>
            <button
              type="button"
              onClick={onApplyAsExpertOrg}
              className="self-start font-display uppercase tracking-widest text-sm px-6 py-3 border-2 border-blue-ink bg-blue-ink text-white hover:bg-white hover:text-blue-ink transition-colors duration-150"
            >
              Apply as an expert or org
            </button>
          </div>

          <div className="flex flex-col gap-4 border-2 border-ink p-8">
            <span className="inline-flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.16em] uppercase text-pink-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink" aria-hidden />
              For creators &amp; journalists
            </span>
            <p className="font-body text-[0.92rem] leading-relaxed text-ink-soft">
              Join the waitlist for early access to briefs, quotes, and direct contact with the people doing
              the research.
            </p>
            <button
              type="button"
              onClick={onJoinWaitlist}
              className="self-start font-display uppercase tracking-widest text-sm px-6 py-3 border-2 border-pink-ink bg-pink-ink text-white hover:bg-white hover:text-pink-ink transition-colors duration-150"
            >
              Join the waitlist
            </button>
          </div>
        </div>

        <p className="mx-auto mt-9 max-w-lg text-center font-body text-sm text-ink-soft">
          Want in sooner?{' '}
          <button
            type="button"
            onClick={onBecomeEarlyTester}
            className="font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
          >
            Become an early tester
          </button>{' '}
          and try Tell The World while it&rsquo;s still rough, so you can help us fix it.
        </p>
      </RevealOnScroll>
    </section>
  )
}
