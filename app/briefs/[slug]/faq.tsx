'use client'

import { useState } from 'react'
import type { FaqAnswer } from '@/lib/data/faq-answers'
import type { FaqMeta } from '@/lib/data/faq-meta'
import { MoreAnswersToggle, AddAnswerForm, FaqMetaMenu } from './faq-answers'
import { parseFAQ, type FAQItem } from '@/lib/briefs/parse-faq'
import { parseRichContent } from '@/lib/richtext/types'
import { renderRichText } from '@/lib/richtext/render'

// ---------------------------------------------------------------------------
// FAQ accordion — collapsed by default, click (or Enter/Space, native
// <button> behavior) to expand. Matches the reference artifact's
// .acc-item/.acc-trigger/.acc-panel: a flat divider list (no per-item
// card/box), bold display-font question, mono "+" that rotates 45deg into
// "×" on open. The panel also carries the "More answers" nested-reveal
// (Part 4b) and, for expert/organisation viewers, an "Add an answer" form —
// both split into ./faq-answers.tsx to keep this file focused.
// ---------------------------------------------------------------------------

function FAQBlock({
  item,
  index,
  briefId,
  briefSlug,
  canSubmit,
  answers,
  meta,
  onGiveFeedback,
  isLoggedIn,
}: {
  item: FAQItem
  index: number
  briefId: string
  briefSlug: string
  canSubmit: boolean
  answers: FaqAnswer[]
  meta: FaqMeta | undefined
  onGiveFeedback: (question: string) => void
  isLoggedIn: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerId = `faq-trigger-${index}`
  const panelId = `faq-panel-${index}`

  return (
    <div className="border-b border-line first:border-t">
      <h3 className="m-0">
        <button
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((v) => !v)}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="flex w-full items-center justify-between gap-4 py-[0.85rem] sm:py-[1.15rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          <span
            className="font-display font-extrabold text-ink text-[0.875rem] sm:text-[1.04rem]"
            style={{ letterSpacing: '-0.005em' }}
          >
            {item.question}
          </span>
          <span
            aria-hidden
            className={`shrink-0 font-mono text-[0.95rem] sm:text-[1.1rem] font-bold text-blue transition-transform duration-300 motion-reduce:transition-none ${
              isOpen ? 'rotate-45' : ''
            }`}
          >
            +
          </span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!isOpen}>
        {isOpen && (
          <div className="anim-drawer max-w-[68ch] space-y-2.5 sm:space-y-4 pb-[1rem] sm:pb-[1.3rem]">
            <div>
              {/* Primary-answer byline (Part 6 step 1) — was previously
                  unlabeled, unlike expert-submitted "More answers" cards
                  below, which already show a full byline. */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink-faint">
                  Tell The World
                </span>
                <FaqMetaMenu meta={meta} question={item.question} onGiveFeedback={onGiveFeedback} isLoggedIn={isLoggedIn} />
              </div>
              {(() => {
                const doc = parseRichContent(meta?.richContent)
                const answerClassName = 'font-body text-[0.8125rem] sm:text-[0.96rem] leading-[1.5] sm:leading-[1.68] text-ink'
                return doc ? (
                  renderRichText(doc, { paragraphClassName: () => answerClassName })
                ) : (
                  <p className={answerClassName}>{item.answer}</p>
                )
              })()}
            </div>
            {answers.length > 0 && <MoreAnswersToggle answers={answers} />}
            {canSubmit && <AddAnswerForm briefId={briefId} briefSlug={briefSlug} question={item.question} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FAQ section — every faq-type brief_sections row, each parsed into its own
// Q/A items (multiple rows are supported the same way Explainer supports
// multiple titled subsections, Part 3). This is BriefView's FAQ call site
// (mirrors how ExplainerSections is its 'explainer' call site) — FAQBlock
// needs Part 4b's extra props (briefId, answers, etc.) that don't fit
// SectionContent's generic { type, content } shape.
// ---------------------------------------------------------------------------

export function FAQSection({
  sections,
  briefId,
  briefSlug,
  canSubmit,
  answersByQuestion,
  faqMetaByQuestion,
  onGiveFeedback,
  isLoggedIn,
}: {
  sections: { id: string; content: string }[]
  briefId: string
  briefSlug: string
  canSubmit: boolean
  answersByQuestion: Record<string, FaqAnswer[]>
  faqMetaByQuestion: Record<string, FaqMeta>
  onGiveFeedback: (question: string) => void
  isLoggedIn: boolean
}) {
  return (
    <div>
      {sections.map((section) => {
        const items = parseFAQ(section.content)
        if (!items) return null
        return items.map((item, i) => (
          <FAQBlock
            key={`${section.id}-${i}`}
            item={item}
            index={i}
            briefId={briefId}
            briefSlug={briefSlug}
            canSubmit={canSubmit}
            answers={answersByQuestion[item.question] ?? []}
            meta={faqMetaByQuestion[item.question]}
            onGiveFeedback={onGiveFeedback}
            isLoggedIn={isLoggedIn}
          />
        ))
      })}
    </div>
  )
}
