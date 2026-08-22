import { Fragment } from 'react'
import { HeaderChip } from './section-content'
import { ReviewEndorseControl } from './review-endorse'
import { parseSources, SourcesGrid } from './sources'
import { TimelineGraphic } from './timeline'
import { parseRichContent } from '@/lib/richtext/types'
import { renderRichText } from '@/lib/richtext/render'
import type { ExplainerContributionInfo, BriefTimelineEvent } from './page'

// ---------------------------------------------------------------------------
// Keyterm tooltips — authoring convention: {{term|definition}} inline in an
// explainer subsection's content, pattern-matched the same way parseFAQ
// parses structured text out of a single content field (two-ink-bold-plan.md
// §3 Part 3 step 4).
// ---------------------------------------------------------------------------

interface ExplainerToken {
  type: 'text' | 'keyterm'
  text: string
  definition?: string
}

const KEYTERM_PATTERN = /\{\{(.+?)\|(.+?)\}\}/g

function tokenizeKeyterms(text: string): ExplainerToken[] {
  const tokens: ExplainerToken[] = []
  let lastIndex = 0
  for (const match of text.matchAll(KEYTERM_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) tokens.push({ type: 'text', text: text.slice(lastIndex, index) })
    tokens.push({ type: 'keyterm', text: match[1].trim(), definition: match[2].trim() })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', text: text.slice(lastIndex) })
  return tokens
}

// CSS-only hover/focus reveal (group-hover/group-focus-within), keyboard
// reachable via the term's own tabIndex — but the tooltip's text also needs
// to reach assistive tech, not just sighted hover/focus users, hence
// aria-describedby rather than relying on the visual reveal alone (§1.4).
function Keyterm({ term, definition, id }: { term: string; definition: string; id: string }) {
  return (
    <span className="group relative" style={{ touchAction: 'manipulation' }}>
      <span
        tabIndex={0}
        aria-describedby={id}
        className="cursor-help border-b-2 border-blue font-semibold not-italic text-blue-ink outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        {term}
      </span>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded bg-ink px-3 py-2 text-left font-body text-xs font-normal not-italic leading-snug text-paper opacity-0 shadow-lg transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {definition}
      </span>
    </span>
  )
}

// Paragraph className matches the legacy path's first-paragraph emphasis
// (medium weight for the lead paragraph, soft color for the rest) so a
// subsection reads the same whether it's rich-text or legacy plain-text.
// Both sizes sit at 1.125rem (Part 5 step 1, "Option B" — signed off
// 2026-08-22): weight alone carries the lead/rest hierarchy at this size,
// so the two no longer need different font sizes the way the smaller
// 1.05rem/0.95rem baseline did.
function explainerParagraphClassName(index: number): string {
  return `font-body text-[1.125rem] leading-[1.7] ${
    index === 0 ? 'font-medium text-ink' : 'text-ink-soft'
  }`
}

function ExplainerBody({
  sectionId,
  content,
  richContent,
}: {
  sectionId: string
  content: string
  richContent: unknown
}) {
  const doc = parseRichContent(richContent)
  if (doc) {
    return <div className="max-w-2xl space-y-6">{renderRichText(doc, { paragraphClassName: explainerParagraphClassName })}</div>
  }

  // Legacy plain-text path — {{term|definition}} keyterm syntax, not
  // authored via the rich text editor yet (docs/design/brief-feature/
  // brief-page-part2-plan.md §2, Part 0b: the two shapes coexist).
  const paragraphs = content.split(/\n\n+/).filter(Boolean)

  return (
    <div className="max-w-2xl space-y-6">
      {paragraphs.map((paragraph, i) => {
        const tokens = tokenizeKeyterms(paragraph.trim())
        return (
          <p key={i} className={explainerParagraphClassName(i)}>
            {tokens.map((token, j) =>
              token.type === 'text' ? (
                <Fragment key={j}>{token.text}</Fragment>
              ) : (
                <Keyterm
                  key={j}
                  term={token.text}
                  definition={token.definition ?? ''}
                  id={`${sectionId}-p${i}-kt${j}`}
                />
              ),
            )}
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subsection — title (sub-head style, §1.2) + reviewed/endorsed badge and
// control (Part 1's brief-level mechanism, scoped to this section_id
// instead — §2 "Reusing brief_contributions") + body.
// ---------------------------------------------------------------------------

interface ExplainerSectionRow {
  id: string
  title: string | null
  content: string
  rich_content: unknown
}

function ExplainerSubsection({
  section,
  briefId,
  briefSlug,
  canContribute,
  contribution,
}: {
  section: ExplainerSectionRow
  briefId: string
  briefSlug: string
  canContribute: boolean
  contribution?: ExplainerContributionInfo
}) {
  const showBadgeRow = canContribute || (contribution && (contribution.reviewedCount > 0 || contribution.endorsedCount > 0))

  return (
    <div className="space-y-4">
      {section.title && (
        <h3 className="font-body text-[1.28rem] font-medium italic text-ink-soft">{section.title}</h3>
      )}
      {showBadgeRow && (
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          {contribution && contribution.reviewedCount > 0 && (
            <HeaderChip tone="blue">✓ Reviewed · {contribution.reviewedCount}</HeaderChip>
          )}
          {contribution && contribution.endorsedCount > 0 && (
            <HeaderChip tone="blue">★ Endorsed · {contribution.endorsedCount}</HeaderChip>
          )}
          {canContribute && (
            <ReviewEndorseControl
              briefId={briefId}
              briefSlug={briefSlug}
              sectionId={section.id}
              initialStatus={contribution?.status ?? 'none'}
            />
          )}
        </div>
      )}
      <ExplainerBody sectionId={section.id} content={section.content} richContent={section.rich_content} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full Explainer section — every explainer subsection, then going_deeper's
// existing Sources rendering folded in as the final subsection (Part 3 step
// 5) instead of its own top-level section. Restyled with the blue accent,
// parseSources/SourcesGrid's own logic is untouched.
// ---------------------------------------------------------------------------

export function ExplainerSections({
  sections,
  sourceSections,
  timelineEvents,
  briefId,
  briefSlug,
  canContribute,
  contributions,
  showGiveFeedback,
  onGiveFeedback,
}: {
  sections: ExplainerSectionRow[]
  sourceSections: { id: string; content: string }[]
  timelineEvents: BriefTimelineEvent[]
  briefId: string
  briefSlug: string
  canContribute: boolean
  contributions: ExplainerContributionInfo[]
  // Part 5 step 6 — "Give feedback" is open to any logged-in user (no role
  // check, admin included by construction), unlike the SectionHeader's
  // "Suggest changes" button (BriefView.tsx, org/expert/admin only). Both
  // trigger the same feedback modal/context; only who can see the trigger
  // differs.
  showGiveFeedback: boolean
  onGiveFeedback: () => void
}) {
  const contributionBySection = new Map(contributions.map((c) => [c.sectionId, c]))
  const sourceGroups = sourceSections
    .map((section) => ({ id: section.id, items: parseSources(section.content) }))
    .filter((group): group is { id: string; items: NonNullable<ReturnType<typeof parseSources>> } => group.items !== null)

  return (
    <div className="space-y-10">
      {sections.map((section, i) => (
        <Fragment key={section.id}>
          <ExplainerSubsection
            section={section}
            briefId={briefId}
            briefSlug={briefSlug}
            canContribute={canContribute}
            contribution={contributionBySection.get(section.id)}
          />
          {/* Timeline graphic (Part 5 step 2) — after the first subsection,
              signed off with the user 2026-08-22, rather than at the end or
              admin-configurable. */}
          {i === 0 && <TimelineGraphic events={timelineEvents} />}
        </Fragment>
      ))}
      {sourceGroups.length > 0 && (
        <div className="space-y-6 border-t border-line pt-10">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-blue-ink">Sources</p>
          {sourceGroups.map((group) => (
            <SourcesGrid key={group.id} items={group.items} />
          ))}
        </div>
      )}
      {showGiveFeedback && (
        <button
          type="button"
          onClick={onGiveFeedback}
          className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-2"
        >
          <span aria-hidden>→</span> Give feedback on this section
        </button>
      )}
    </div>
  )
}
