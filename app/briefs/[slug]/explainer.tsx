import { Fragment } from 'react'
import { HeaderChip } from './section-content'
import { ReviewEndorseControl } from './review-endorse'
import { parseSources, SourcesGrid } from './sources'
import type { ExplainerContributionInfo } from './page'

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
        className="cursor-help rounded-sm border-b border-dashed border-blue font-medium not-italic text-blue-ink outline-none focus-visible:ring-2 focus-visible:ring-blue"
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

function ExplainerBody({ sectionId, content }: { sectionId: string; content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean)

  return (
    <div className="max-w-2xl space-y-5">
      {paragraphs.map((paragraph, i) => {
        const tokens = tokenizeKeyterms(paragraph.trim())
        return (
          <p
            key={i}
            className={`font-body leading-[1.7] ${
              i === 0 ? 'text-[1.05rem] font-medium text-ink' : 'text-[0.95rem] text-ink-soft'
            }`}
          >
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
      <ExplainerBody sectionId={section.id} content={section.content} />
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
  briefId,
  briefSlug,
  canContribute,
  contributions,
}: {
  sections: ExplainerSectionRow[]
  sourceSections: { id: string; content: string }[]
  briefId: string
  briefSlug: string
  canContribute: boolean
  contributions: ExplainerContributionInfo[]
}) {
  const contributionBySection = new Map(contributions.map((c) => [c.sectionId, c]))
  const sourceGroups = sourceSections
    .map((section) => ({ id: section.id, items: parseSources(section.content) }))
    .filter((group): group is { id: string; items: NonNullable<ReturnType<typeof parseSources>> } => group.items !== null)

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <ExplainerSubsection
          key={section.id}
          section={section}
          briefId={briefId}
          briefSlug={briefSlug}
          canContribute={canContribute}
          contribution={contributionBySection.get(section.id)}
        />
      ))}
      {sourceGroups.length > 0 && (
        <div className="space-y-6 border-t border-line pt-10">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-blue-ink">Sources</p>
          {sourceGroups.map((group) => (
            <SourcesGrid key={group.id} items={group.items} />
          ))}
        </div>
      )}
    </div>
  )
}
