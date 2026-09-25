'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/ui/Footer'
import WaitlistModal from '@/components/landing/WaitlistModal'
import TwoCirclesSection from '@/components/landing/TwoCirclesSection'
import WhyThisMattersNow from '@/components/landing/WhyThisMattersNow'
import QACommunityDemo from '@/components/landing/QACommunityDemo'
import AddQuoteDemo from '@/components/landing/AddQuoteDemo'
import ImagineScaleSection from '@/components/landing/ImagineScaleSection'
import ClosingSection from '@/components/landing/ClosingSection'
import type { UserRole } from '@/lib/types'

// Silent-launch landing page — docs/design/landing-page/temp-landing-page-plan.md
// §2, Part 3. Direction A from that plan's Part 0, signed off 2026-08-23;
// expanded 2026-08-24 with the two-circles and closing sections below the
// hero (design proposals reviewed and signed off as Artifacts in that
// session, not written up as a doc — see chat history if this needs
// revisiting). The previous landing page (briefs teaser grid, trust strip,
// full apply flow) moved to components/landing/LegacyLandingPage.tsx — not
// routed anywhere right now, kept for reuse when a permanent landing page
// replaces this one. /apply and /briefs still work, just no longer linked
// from here.

type ModalMode = 'waitlist' | 'early-tester'

export default function LandingPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [waitlistRole, setWaitlistRole] = useState<UserRole>('creator')

  function openWaitlist(role: UserRole) {
    setWaitlistRole(role)
    setModalMode('waitlist')
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">

      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-4 sm:px-6">
        {/* gap-3 on the row is a floor, not a fallback for justify-between —
            flexbox gap enforces a minimum spacing between the logo and the
            nav group even when they're packed edge to edge, which they
            started being on narrow phones once the Blog link's added width
            ate the slack that justify-between used to leave on its own. */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 py-4">
          <Logo href="/" />
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="https://telltheworldblog.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              Blog
            </a>
            <Link
              href="/apply"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
            >
              Apply
            </Link>
            <Link
              href="/login"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="page-wash flex-1">
        {/* min-h keeps the hero filling roughly one viewport below the
            sticky header, so the two-circles section doesn't peek in
            before anyone scrolls — but only from lg (1024px) up. On
            mobile/tablet, forcing full viewport height either stretches
            the hero awkwardly on a tall phone or clips it on a short one,
            and scrolling immediately there isn't the problem this was
            solving for. 4.5rem approximates the header's rendered height
            (py-4 plus the logo's line height). */}
        <div
          className="mx-auto flex w-full flex-col items-center justify-center px-6 pt-16 pb-[2.52rem] text-center lg:min-h-[calc(100dvh-4.5rem)]"
          style={{ maxWidth: '70rem' }}
        >

          {/* Eyebrow */}
          <div className="mb-8 inline-flex items-center gap-2.5">
            <span className="eyebrow-dot h-1.5 w-1.5 rounded-full shrink-0" aria-hidden />
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-ink-soft">
              Opening soon
            </span>
          </div>

          {/* Headline — three lines so only the last ("tell its story.")
              lands in pink; the first two stay ink. Sized with a plain
              vw clamp (no vh term) since the height constraint that
              motivated min(vw, vh) elsewhere is now handled by the
              wrapper's min-h above, not by capping the type itself. The
              clamp's own floor (1.87rem) never engages below ~800px
              viewport width, so phones were stuck at the tablet-tuned
              size and the hero ran unnecessarily tall — a smaller
              un-prefixed size (mobile-first) plus `sm:` restoring the
              exact original clamp keeps tablet/desktop untouched. */}
          <h1
            className="font-display uppercase font-extrabold tracking-tight mb-9"
            style={{ lineHeight: 1.08 }}
          >
            <span className="block text-ink text-[1.55rem] sm:text-[clamp(1.87rem,3.74vw,3.06rem)]">AI safety research rarely reaches</span>
            <span className="block text-ink text-[1.55rem] sm:text-[clamp(1.87rem,3.74vw,3.06rem)]">the people who could</span>
            <span className="block text-pink text-[1.55rem] sm:text-[clamp(1.87rem,3.74vw,3.06rem)]">tell its story.</span>
          </h1>

          {/* Subtext */}
          <p
            className="font-body text-ink-soft mb-10 mx-auto"
            style={{ fontSize: 'clamp(1rem, 1.3vw, 1.25rem)', lineHeight: 1.65, maxWidth: '34rem' }}
          >
            Tell The World connects AI safety researchers and organisations with
            the creators and journalists who can put their work in front of real
            audiences.
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={() => openWaitlist('creator')}
            className="font-display uppercase tracking-widest text-sm px-7 py-3 border-2 border-blue-ink bg-blue-ink text-white hover:bg-white hover:text-blue-ink transition-colors duration-150"
          >
            Join the waitlist
          </button>
        </div>

        {/* Was a bordered divider; the continuous background wash (see
            .page-wash, app/globals.css) replaces the need for a seam line
            between sections, so this is just spacing now. */}
        <div className="py-[1.33875rem]" />

        <TwoCirclesSection />

        <div className="py-7" />

        <WhyThisMattersNow />

        {/* bg-paper-sunken is the shared theme token (used well beyond this
            page — briefs, home, admin), so it stays untouched; the extra
            intensity asked for here is a flat same-color overlay painted
            on top instead, scoped to this section only. A "gradient" of
            one solid color to itself is the trick — same math as mixing
            the base color toward pure pink. Started at .15 (+15% pass),
            dialed to .135 (-10% follow-up) — a "middle" section, not the
            header/bottom areas that were asked to stay put. */}
        <section className="bg-paper-sunken px-6 py-11" style={{ backgroundImage: 'linear-gradient(rgba(240,25,126,.135), rgba(240,25,126,.135))' }}>
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <span className="mb-3.5 inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.16em] uppercase text-blue-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden />
                Community Q&amp;A
              </span>
              <h3
                className="font-display font-extrabold tracking-tight text-ink mb-4"
                style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.75rem)', lineHeight: 1.2 }}
              >
                Ask a question &amp; get an answer from someone who studies this.
              </h3>
              <p className="font-body text-ink-soft" style={{ fontSize: '0.98rem', lineHeight: 1.65 }}>
                Every brief has an open Q&amp;A. Ask what&rsquo;s on your mind, and an expert or
                organisation working on the problem answers directly, on the record.
              </p>
            </div>
            <QACommunityDemo />
          </div>
        </section>

        {/* Same same-color-overlay trick as the Q&A section above, scoped
            here instead of touching the shared bg-paper-sunken-blue token;
            same .15 -> .135 dial-back too. */}
        <section className="border-t border-line-strong bg-paper-sunken-blue px-6 py-11" style={{ backgroundImage: 'linear-gradient(rgba(30,79,235,.135), rgba(30,79,235,.135))' }}>
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="md:order-2">
              <span className="mb-3.5 inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.16em] uppercase text-pink-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink" aria-hidden />
                Quotes, on record
              </span>
              <h3
                className="font-display font-extrabold tracking-tight text-ink mb-4"
                style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.75rem)', lineHeight: 1.2 }}
              >
                A quote experts can actually stand behind.
              </h3>
              <p className="font-body text-ink-soft" style={{ fontSize: '0.98rem', lineHeight: 1.65 }}>
                Experts and organisations add their own on-record quotes directly, in plain language. Every
                submission runs through a clarity check first, so jargon gets caught before it ever reaches
                a reader.
              </p>
            </div>
            <div className="md:order-1">
              <AddQuoteDemo />
            </div>
          </div>
        </section>

        <ImagineScaleSection />

        <ClosingSection
          onApplyAsExpertOrg={() => openWaitlist('expert')}
          onJoinWaitlist={() => openWaitlist('creator')}
          onBecomeEarlyTester={() => setModalMode('early-tester')}
        />
      </main>

      {/* Footer carries its own mt-16 (used across every other page it
          appears on, not landing-specific) — that sat on top of
          ClosingSection's own pb-32, doubling the gap the .page-wash
          fade was tuned for and leaving a plain white band between where
          the gradient reached white and the footer's actual border-t
          line. Cancelling it here, scoped to this page only, rather than
          touching the shared component. */}
      <div className="-mt-16">
        <Footer />
      </div>

      {modalMode && (
        <WaitlistModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          defaultRole={modalMode === 'waitlist' ? waitlistRole : undefined}
        />
      )}
    </div>
  )
}
