import Button from '@/components/ui/Button'
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
    <div id="section-qa" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
      <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '100ms' }}>
        <SectionHeader
          num="06"
          label="Community Q&A"
          description="Questions from members, answered by experts"
          action={
            <Button type="button" variant="secondary" small>
              + Ask a question
            </Button>
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
    <div id="section-cta" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
      <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '100ms' }}>
        <SectionHeader
          num="07"
          label="Calls to Action"
          description="What experts & orgs want you to do with this"
          numTone="blue"
          action={
            canSuggestCta ? (
              <Button type="button" variant="cobalt" small onClick={onSuggestCta}>
                + New CTA
              </Button>
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
    <div id="section-coverage" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule bg-band-soft px-4 py-14 text-umber md:px-gutter md:py-section">
      <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '100ms' }}>
        <SectionHeader
          num="08"
          label="Covered By"
          description="How this topic is being covered elsewhere"
          numTone="pink"
          action={
            isLoggedIn ? (
              <Button type="button" variant="secondary" small onClick={onAddCoverage}>
                + Add coverage
              </Button>
            ) : undefined
          }
        />
        <CoverageCarousel coverage={coverage} briefSlug={briefSlug} isLoggedIn={isLoggedIn} onOpenCoverage={onOpenCoverage} />
      </div>
    </div>
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
    <div id="section-related" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
      <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '100ms' }}>
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
    <div className="border-t border-rule px-4 py-6 md:px-gutter">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-6">
        {canContribute && (
          <Button type="button" variant="ghost" onClick={onProposeCorrection}>
            <span aria-hidden>→</span> Propose a correction or addition
          </Button>
        )}
        <Button type="button" variant="secondary" className="ml-auto" onClick={onProposeBrief}>
          Propose a new brief <span aria-hidden>→</span>
        </Button>
      </div>
    </div>
  )
}
