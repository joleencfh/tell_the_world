import DarkBand from '@/components/ui/DarkBand'
import { SectionHeader } from './section-content'
import { QuestionsList, QuestionForm } from './qa'
import { CtaCarousel } from './ctas'
import { CoverageCarousel } from './coverage'
import { RelatedBriefsCarousel } from './related-briefs'
import type { Question, QuestionAnswer, Cta, Coverage, RelatedBrief } from './page'

// ---------------------------------------------------------------------------
// Community Q&A — members only
// ---------------------------------------------------------------------------

export function QaSection({
  briefId,
  briefSlug,
  questions,
  answersByQuestion,
  canContribute,
  canSubmitAnswer,
  voterTone,
}: {
  briefId: string
  briefSlug: string
  questions: Question[]
  answersByQuestion: Record<string, QuestionAnswer[]>
  canContribute: boolean
  canSubmitAnswer: boolean
  voterTone: 'blue' | 'pink' | null
}) {
  return (
    <div id="section-qa" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line bg-paper-sunken px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          num="06"
          label="Community Q&A"
          description="Questions from members, answered by experts"
          numTone="pink"
          action={
            <button
              type="button"
              className="border-[1.5px] border-pink bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-pink transition-colors hover:bg-pink hover:text-white"
            >
              + Ask a question
            </button>
          }
        />
        <QuestionsList
          questions={questions}
          answersByQuestion={answersByQuestion}
          briefSlug={briefSlug}
          canEndorse={canContribute}
          canSubmitAnswer={canSubmitAnswer}
          voterTone={voterTone}
        />
        <QuestionForm briefId={briefId} briefSlug={briefSlug} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Calls to Action
// ---------------------------------------------------------------------------

export function CtaSection({
  ctas,
  canSuggestCta,
  onSuggestCta,
}: {
  ctas: Cta[]
  canSuggestCta: boolean
  onSuggestCta: () => void
}) {
  return (
    <div id="section-cta" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line bg-paper px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          num="07"
          label="Calls to Action"
          description="What experts & orgs want you to do with this"
          numTone="blue"
          action={
            canSuggestCta ? (
              <button
                type="button"
                onClick={onSuggestCta}
                style={{ touchAction: 'manipulation' }}
                className="border-2 border-blue bg-blue px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-paper hover:text-blue focus-visible:ring-2 focus-visible:ring-blue"
              >
                + New CTA
              </button>
            ) : undefined
          }
        />
        <CtaCarousel ctas={ctas} canSuggestCta={canSuggestCta} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Covered By — fixed dark band in both themes (§1.3)
// ---------------------------------------------------------------------------

export function CoverageSection({
  coverage,
  briefSlug,
  isLoggedIn,
  onAddCoverage,
  onOpenCoverage,
}: {
  coverage: Coverage[]
  briefSlug: string
  isLoggedIn: boolean
  onAddCoverage: () => void
  onOpenCoverage: (coverage: Coverage) => void
}) {
  return (
    <DarkBand id="section-coverage" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          num="08"
          label="Covered By"
          description="How this topic is being covered elsewhere"
          numTone="pink"
          onDark
          action={
            isLoggedIn ? (
              <button
                type="button"
                onClick={onAddCoverage}
                style={{ touchAction: 'manipulation' }}
                className="border-2 border-pink bg-pink px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-transparent hover:text-pink focus-visible:ring-2 focus-visible:ring-pink"
              >
                + Add coverage
              </button>
            ) : undefined
          }
        />
        <CoverageCarousel coverage={coverage} briefSlug={briefSlug} isLoggedIn={isLoggedIn} onOpenCoverage={onOpenCoverage} />
      </div>
    </DarkBand>
  )
}

// ---------------------------------------------------------------------------
// Related Briefs — neutral ink (§1.1: the editorial spine, never blue/pink).
// Not rendered at all when there's nothing to relate to (no topic_tag, or no
// other brief shares it) — same near-empty-state convention as Quotes,
// don't render an empty section (§3 Part 8). Callers should only mount this
// when relatedBriefs.length > 0.
// ---------------------------------------------------------------------------

export function RelatedBriefsSection({ relatedBriefs }: { relatedBriefs: RelatedBrief[] }) {
  return (
    <div id="section-related" className="scroll-mt-20 border-t-4 border-line bg-paper-raised px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          num="09"
          label="Related Briefs"
          description="More on this topic"
        />
        <RelatedBriefsCarousel briefs={relatedBriefs} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer actions — logged-in members
// ---------------------------------------------------------------------------

export function FooterActions({
  canContribute,
  onProposeCorrection,
  onProposeBrief,
}: {
  canContribute: boolean
  onProposeCorrection: () => void
  onProposeBrief: () => void
}) {
  return (
    <div className="px-6 py-6 border-t border-line">
      <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-6">
        {canContribute && (
          <button
            type="button"
            onClick={onProposeCorrection}
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-2"
          >
            <span aria-hidden>→</span> Propose a correction or addition
          </button>
        )}
        <button
          type="button"
          onClick={onProposeBrief}
          style={{ touchAction: 'manipulation' }}
          className="ml-auto inline-flex items-center gap-2 border-2 border-blue bg-paper px-8 py-3 font-display text-sm uppercase tracking-widest text-blue-ink transition-colors hover:bg-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          Propose a new brief <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
