'use client'

import { useEffect, useRef, useState } from 'react'
import { ReviewEndorseModal } from './review-endorse'
import { QuestionModal } from './qa'
import { FeedbackModal } from './feedback'
import type { UserRole } from '@/lib/types'
import type { ContributionStatus } from '@/lib/data/contributions'

// ---------------------------------------------------------------------------
// Contribute menu — hero's role-gated dropdown, matching the reference
// artifact's .contribute/.contribute-menu; the artifact's single entry
// point into the header's review/endorse control, the Q&A form, and the
// CTA/coverage "+" buttons, which all still exist in their own right. Every
// item opens a modal (Part 2, brief-page-part2-plan.md §2) — the modals
// (ContributeModals below) live at BriefView's top level, not nested here,
// per ReviewersModal's anim-rise containing-block note in
// section-content.tsx, so this component just closes its dropdown and calls
// the callback that opens the right one.
// ---------------------------------------------------------------------------

const EXPERT_ORG_ROLES: UserRole[] = ['expert', 'organisation']
const CREATOR_JOURNALIST_ROLES: UserRole[] = ['creator', 'journalist']

interface ContributeMenuItem {
  label: string
  onClick: () => void
}

function ContributeMenuGroup({
  label,
  tone,
  items,
}: {
  // Omitted for the shared "General" group below the role-specific ones —
  // one item, self-explanatory, doesn't need its own heading.
  label?: string
  tone: 'blue' | 'pink' | 'ink'
  items: ContributeMenuItem[]
}) {
  const hoverClasses =
    tone === 'blue'
      ? 'hover:bg-blue-soft hover:text-blue-ink'
      : tone === 'pink'
        ? 'hover:bg-pink-soft hover:text-pink-ink'
        : 'hover:bg-paper-raised hover:text-ink'
  const labelClasses = tone === 'blue' ? 'text-blue' : tone === 'pink' ? 'text-pink' : 'text-ink-faint'

  return (
    <div>
      {label && (
        <div className={`px-[0.9rem] pb-1 pt-[0.55rem] font-mono text-[9px] tracking-[0.08em] ${labelClasses}`}>
          {label}
        </div>
      )}
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          style={{ touchAction: 'manipulation' }}
          className={`block w-full border-b border-line px-[0.9rem] py-[0.7rem] text-left font-mono text-[0.68rem] uppercase tracking-[0.03em] text-ink last:border-b-0 ${hoverClasses}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export type ContributeModalKind = 'review' | 'question' | 'feedback' | 'faq-question'

export function ContributeMenu({
  role,
  onOpenModal,
  onSuggestCta,
  onAddCoverage,
}: {
  role: UserRole
  onOpenModal: (kind: ContributeModalKind) => void
  onSuggestCta: () => void
  onAddCoverage: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Admin sees both groups — like canSuggestCta elsewhere on this page, a
  // preview/convenience path (2026-08-14). Expert/org's "Review or endorse"
  // item still errors server-side for admin (setReviewStatus is expert/org
  // only, same tradeoff as the header's canContribute-gated control); its
  // "Suggest a question" sibling and every Creator/Journalist item route
  // through the no-role-gate feedback mechanism instead and work fine for
  // admin, so neither group needs a separate visibility gate here. The
  // "Send feedback on this page" item lives outside both groups entirely
  // (2026-08-22) — every logged-in role gets it, not just Creator/Journalist.
  const isAdmin = role === 'admin'
  const showExpertGroup = isAdmin || EXPERT_ORG_ROLES.includes(role)
  const showCreatorGroup = isAdmin || CREATOR_JOURNALIST_ROLES.includes(role)
  if (!showExpertGroup && !showCreatorGroup) return null

  function select(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{ touchAction: 'manipulation' }}
        className="inline-flex items-center gap-1.5 border-[1.5px] border-ink bg-ink px-4 py-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-paper transition-opacity hover:opacity-90"
      >
        Contribute <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.4rem)] z-20 min-w-[240px] border-[1.5px] border-ink bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
          {showExpertGroup && (
            <ContributeMenuGroup
              label="Expert / Org — verify"
              tone="blue"
              items={[
                { label: 'Review or endorse this brief', onClick: () => select(() => onOpenModal('review')) },
                { label: 'Suggest a question', onClick: () => select(() => onOpenModal('faq-question')) },
              ]}
            />
          )}
          {showCreatorGroup && (
            <ContributeMenuGroup
              label="Creator / Journalist — engage"
              tone="pink"
              items={[
                { label: 'Ask a question', onClick: () => select(() => onOpenModal('question')) },
                { label: 'Add media coverage', onClick: () => select(onAddCoverage) },
                { label: 'Suggest a call to action', onClick: () => select(onSuggestCta) },
              ]}
            />
          )}
          {/* Every logged-in role, not just Creator/Journalist — feedback
              on the page itself isn't specific to any one persona group. */}
          <ContributeMenuGroup
            tone="ink"
            items={[{ label: 'Send feedback on this page', onClick: () => select(() => onOpenModal('feedback')) }]}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contribute menu's modals — rendered once at BriefView's top level (see
// ContributeMenu's own comment for why), one at a time keyed off which item
// was clicked.
// ---------------------------------------------------------------------------

export function ContributeModals({
  brief,
  myReviewStatus,
  active,
  onClose,
}: {
  brief: { id: string; slug: string; title: string }
  myReviewStatus: ContributionStatus
  active: ContributeModalKind | null
  onClose: () => void
}) {
  if (active === 'review') {
    return (
      <ReviewEndorseModal
        briefId={brief.id}
        briefSlug={brief.slug}
        briefTitle={brief.title}
        initialStatus={myReviewStatus}
        onClose={onClose}
      />
    )
  }
  if (active === 'question') {
    return <QuestionModal briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onClose} />
  }
  if (active === 'feedback') {
    return <FeedbackModal context={{ briefId: brief.id, briefTitle: brief.title }} onClose={onClose} />
  }
  if (active === 'faq-question') {
    return (
      <FeedbackModal
        context={{ briefId: brief.id, briefTitle: brief.title, section: 'faq', sectionLabel: 'Suggest a FAQ question' }}
        onClose={onClose}
      />
    )
  }
  return null
}
