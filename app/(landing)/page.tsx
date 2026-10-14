import WaitlistProvider from '@/components/landing/WaitlistProvider'
import LandingHeader from '@/components/landing/LandingHeader'
import Hero from '@/components/landing/Hero'
import WhyThisMatters from '@/components/landing/WhyThisMatters'
import ArtifactSection from '@/components/landing/ArtifactSection'
import QACommunityDemo from '@/components/landing/QACommunityDemo'
import AddQuoteDemo from '@/components/landing/AddQuoteDemo'
import Closing from '@/components/landing/Closing'

// Silent-launch landing page, redesigned (docs/design/landing-page/current/final-design.html,
// design-system.md). A server component: only the waitlist state (inside
// WaitlistProvider), the two demos and the buttons run on the client.
//
// Sections, in order: header, hero with the two audience cards, why this
// matters now, Community Q&A, Quotes on record, closing and footer. The
// earlier Imagine / 200,000 section is gone (an unsourced projection). The
// previous full landing page still lives, unrouted, at
// components/landing/LegacyLandingPage.tsx.
export default function LandingPage() {
  return (
    <WaitlistProvider>
      <div className="min-h-screen bg-parchment text-umber">
        <LandingHeader />
        <main>
          <Hero />
          <WhyThisMatters />
          <ArtifactSection
            heading="Ask a question. Hear from someone who studies this."
            body="A brief is a sourced summary of one AI risk topic, with an open Q&A at the end. Creators and journalists ask. Experts and organisations answer on the record."
          >
            <QACommunityDemo />
          </ArtifactSection>
          <ArtifactSection
            flip
            heading="Expert quotes you can understand, and use."
            body="Experts and organisations add their own on-record quotes directly, in plain language. Each quote goes through a clarity check first, so jargon is caught before a reader sees it."
          >
            <AddQuoteDemo />
          </ArtifactSection>
        </main>
        <Closing />
      </div>
    </WaitlistProvider>
  )
}
