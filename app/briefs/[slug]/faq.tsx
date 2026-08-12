'use client'

import { useState } from 'react'
import type { FaqAnswer } from '@/lib/data/faq-answers'
import { MoreAnswersToggle, AddAnswerForm } from './faq-answers'

// ---------------------------------------------------------------------------
// FAQ parser
// ---------------------------------------------------------------------------

interface FAQItem {
  question: string
  answer: string
}

function parseFAQ(content: string): FAQItem[] | null {
  const items: FAQItem[] = []
  const blocks = content.split(/\n(?=Q:)/g)
  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+?)(?:\n|\r\n?)([\s\S]*)/)
    if (!qMatch) continue
    const question = qMatch[1].trim()
    const rest = qMatch[2].trim()
    const aMatch = rest.match(/^A:\s*([\s\S]+)/)
    const answer = aMatch ? aMatch[1].trim() : rest
    if (question) items.push({ question, answer })
  }
  return items.length >= 1 ? items : null
}

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
}: {
  item: FAQItem
  index: number
  briefId: string
  briefSlug: string
  canSubmit: boolean
  answers: FaqAnswer[]
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
          className="flex w-full items-center justify-between gap-4 py-[1.15rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          <span
            className="font-display font-extrabold text-ink"
            style={{ fontSize: '1.04rem', letterSpacing: '-0.005em' }}
          >
            {item.question}
          </span>
          <span
            aria-hidden
            className={`shrink-0 font-mono text-[1.1rem] font-bold text-blue transition-transform duration-300 motion-reduce:transition-none ${
              isOpen ? 'rotate-45' : ''
            }`}
          >
            +
          </span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!isOpen}>
        {isOpen && (
          <div className="anim-drawer max-w-[68ch] space-y-4 pb-[1.3rem]">
            <p className="font-body text-[0.96rem] leading-[1.68] text-ink">{item.answer}</p>
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
}: {
  sections: { id: string; content: string }[]
  briefId: string
  briefSlug: string
  canSubmit: boolean
  answersByQuestion: Record<string, FaqAnswer[]>
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
          />
        ))
      })}
    </div>
  )
}
