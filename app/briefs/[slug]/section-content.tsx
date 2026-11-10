'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { getDisplayName, formatDate } from './helpers'
import { parseRichContent, parseTldrBulletLead, type RichTextParagraphNode } from '@/lib/richtext/types'
import { renderRichTextInline } from '@/lib/richtext/render'
import type { Reviewer } from '@/lib/data/contributions'
import type { BriefContributor } from './page'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// 'tldr' is rendered in the hero, not looped here — see BriefView. Quotes
// (§2 row 2) renders as its own explicit block in BriefView with its own
// SectionHeader (num '03'), not through this loop.
//
// use_this/featured_news/where_experts_stand are old-IA section types the
// Two-Ink Bold rebuild dropped (two-ink-bold-plan.md §2 — "stop authoring
// new rows of those types") — their renderers are retired here too,
// pulling that slice of Part 10's cleanup forward at the user's request
// (2026-08-14). going_deeper still exists and folds into Explainer's final
// subsection (Part 3); BriefView reads it directly via section_type
// filtering rather than through this loop, so it's absent here too.
type ActiveSectionType = 'explainer' | 'faq'

export const SECTION_ORDER: ActiveSectionType[] = ['explainer', 'faq']

export const SECTION_META: Record<'tldr' | ActiveSectionType, { label: string; num: string; description: string }> =
  {
    // Not looped over via SECTION_ORDER (BriefView renders it as its own
    // section right after the hero). num '01' is the hero's own eyebrow
    // numeral.
    tldr: {
      label: 'TL;DR',
      num: '02',
      description: 'A quick summary',
    },
    explainer: {
      label: 'Explainer',
      num: '04',
      description: 'The full picture, plainly explained',
    },
    faq: {
      label: 'Common Questions',
      num: '05',
      description: 'The things everyone wonders about',
    },
  }

// ---------------------------------------------------------------------------
// TL;DR bullets — either the legacy plain-text lines (optional "**lead
// term** — rest" shape, parsed by parseTldrBulletLead) or, once an admin
// switches a TL;DR to the rich text editor (lib/richtext/editor.tsx, same
// one Explainer subsections use), one bullet per Lexical paragraph — see
// tldrPlainTextToRichContent's comment in lib/richtext/types.ts for how the
// two shapes stay compatible with each other.
// ---------------------------------------------------------------------------

interface TLDRBullet {
  lead: string | null
  rest: string
}

export function parseTLDR(content: string): TLDRBullet[] | null {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  return lines.map(parseTldrBulletLead)
}

function TLDRBulletRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-ink-faint shrink-0" aria-hidden />
      <p className="font-body text-[1.05rem] text-ink leading-[1.7]">{children}</p>
    </li>
  )
}

export function TLDRList({ content, richContent }: { content: string; richContent?: unknown }) {
  const doc = parseRichContent(richContent)

  if (doc) {
    const bullets = doc.root.children.filter((node): node is RichTextParagraphNode => node.type === 'paragraph')
    if (bullets.length === 0) return null
    return (
      <ul className="space-y-4 max-w-2xl">
        {bullets.map((bullet, i) => (
          <TLDRBulletRow key={i}>{renderRichTextInline(bullet.children)}</TLDRBulletRow>
        ))}
      </ul>
    )
  }

  const bullets = parseTLDR(content)
  if (!bullets) return null

  return (
    <ul className="space-y-4 max-w-2xl">
      {bullets.map((bullet, i) => (
        <TLDRBulletRow key={i}>
          {bullet.lead && <strong className="font-semibold text-ink">{bullet.lead} — </strong>}
          {bullet.rest}
        </TLDRBulletRow>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Header chip — endorsement bar / last-reviewed / read-time pills
// ---------------------------------------------------------------------------

const CHIP_TONE_CLASSES: Record<'blue' | 'pink' | 'default' | 'tag' | 'spotlight', string> = {
  blue: 'bg-cobalt-wash text-cobalt border-transparent',
  pink: 'bg-rose-wash text-rose-deep border-transparent',
  default: 'bg-bone text-umber-soft border-transparent',
  tag: 'bg-transparent text-umber-soft border-window-line',
  // Solid-filled variant — home dashboard's Highlighted section eyebrow
  // (home-dashboard-plan.md §2 Part 0 step 4), used nowhere else. Extending
  // this component rather than adding a dashboard-local one since it's a
  // pure color/fill reskin of the same chip shape, not a different markup
  // shape.
  spotlight: 'bg-umber text-parchment border-transparent',
}

export function HeaderChip({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'blue' | 'pink' | 'default' | 'tag' | 'spotlight'
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-tag border px-2 py-0.5 font-mono text-label uppercase ${CHIP_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Reviewed-by chip — the hero's "Reviewed by X · Endorsed by Y" chip (Part 1
// step 2), promoted from a plain span to a real <button>: clicking opens a
// centered modal (ReviewersModal below) listing who reviewed/endorsed
// (grouped expert/org, most recent first) and when, names linking to their
// profile. One combined button for both reviewers and endorsers rather than
// a chip each (2026-08-20, user preferred a single entry point, since both
// halves open the same modal anyway) — each half only appears when its
// count is nonzero, no expert/org breakdown in the button text itself, that
// detail lives in the modal. Click-only, not hover — a hover preview was
// tried first but dropped: it's awkward on touch, and being absolutely
// positioned inside the hero's `overflow-hidden` wrapper meant it got
// clipped at the section boundary. A modal has neither problem.
// ---------------------------------------------------------------------------

function ReviewerRow({ reviewer, linked }: { reviewer: Reviewer; linked?: boolean }) {
  const name = getDisplayName({ display_name: reviewer.displayName })
  const nameEl = linked ? (
    <Link href={`/profile/${reviewer.userId}`} className="block truncate font-mono text-[10px] text-ink hover:text-blue transition-colors">
      {name}
    </Link>
  ) : (
    <span className="block truncate font-mono text-[10px] text-ink">{name}</span>
  )
  // Job title + affiliation, same "role, org" convention the landing page's
  // expert credits already use — organisation accounts leave both null
  // (their display name already is their full identity), so no credential
  // line renders for them.
  const credential = [reviewer.jobTitle, reviewer.affiliation].filter(Boolean).join(', ')

  return (
    <div className="py-1">
      <div className="flex items-center gap-2">
        <Avatar
          name={name}
          avatarUrl={reviewer.avatarUrl}
          size="2xs"
          palette="blue"
          shape={reviewer.role === 'organisation' ? 'square' : 'circle'}
        />
        <div className="min-w-0 flex-1">
          {nameEl}
          {credential && <p className="truncate font-body text-[8.5px] italic text-ink-faint">{credential}</p>}
        </div>
        <span className="shrink-0 font-mono text-[9px] text-ink-faint tabular-nums">{formatDate(reviewer.contributedAt)}</span>
      </div>
      {reviewer.body && (
        <p className="mt-1 break-words font-body text-[10.5px] italic leading-snug text-ink-soft">&ldquo;{reviewer.body}&rdquo;</p>
      )}
    </div>
  )
}

function ReviewerGroup({ label, reviewers, linked }: { label: string; reviewers: Reviewer[]; linked?: boolean }) {
  if (reviewers.length === 0) return null
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-blue-ink">{label}</p>
      {reviewers.map((r) => (
        <ReviewerRow key={r.userId} reviewer={r} linked={linked} />
      ))}
    </div>
  )
}

// One bordered panel per group (Endorsed / Reviewed) — the panel's own
// header bar is what visually separates the two groups from each other,
// and gives the Experts/Organisations subheadings below a clean break from
// the panel title (2026-08-20, "bordered panels" direction, then a
// bolder pass: a 4px blue top rule — the same top-accent device QuoteCard
// already uses elsewhere on this page — a solid icon badge instead of a
// soft tint, bigger uppercase display type for the title, and a real gap
// between the Experts and Organisations subgroups via flex+gap rather than
// a thin top margin).
function VerificationPanel({
  icon,
  title,
  count,
  experts,
  orgs,
}: {
  icon: string
  title: string
  count: number
  experts: Reviewer[]
  orgs: Reviewer[]
}) {
  return (
    <div className="border border-line border-t-4 border-t-blue">
      <div className="flex items-center gap-[0.65rem] px-[1.1rem] py-[0.9rem]">
        <span className="flex h-[1.52rem] w-[1.52rem] shrink-0 items-center justify-center bg-blue text-[0.76rem] text-white">
          {icon}
        </span>
        <span className="flex-1 font-display text-[0.816rem] font-extrabold uppercase tracking-[0.01em] text-ink">
          {title}
        </span>
        <span className="bg-blue-soft px-2 py-[0.2rem] font-mono text-[10px] font-bold text-blue-ink">{count}</span>
      </div>
      <div className="flex flex-col gap-6 border-t border-line px-[1.1rem] pb-[1.1rem] pt-4">
        <ReviewerGroup label="Experts" reviewers={experts} linked />
        <ReviewerGroup label="Organisations" reviewers={orgs} linked />
      </div>
    </div>
  )
}

// Exported and rendered at the top level of BriefView.tsx, alongside its
// other modals (SuggestCtaModal, AddCoverageModal, etc.) — NOT nested
// inside ReviewedByButton below. Every completed `anim-rise` element keeps
// a resolved `transform: translateY(0)` (animation-fill-mode: both),
// which — per the CSS spec — makes that element a containing block for
// `position: fixed` descendants. HeroChipBar's wrapper carries `anim-rise`,
// so a modal rendered inside ReviewedByButton (a HeroChipBar descendant)
// was fixed relative to that small row, not the viewport: clipped,
// mispositioned, and stacked below later page content. Hoisting it out to
// `<main>` (which has no transformed ancestor) fixes all three, matching
// how every other modal on this page is already wired (2026-08-20).
export function ReviewersModal({
  reviewers,
  endorsers,
  onClose,
}: {
  reviewers: Reviewer[]
  endorsers: Reviewer[]
  onClose: () => void
}) {
  const expertReviewers = reviewers.filter((r) => r.role === 'expert')
  const orgReviewers = reviewers.filter((r) => r.role === 'organisation')
  const expertEndorsers = endorsers.filter((r) => r.role === 'expert')
  const orgEndorsers = endorsers.filter((r) => r.role === 'organisation')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Reviews and endorsements"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm overflow-hidden border-[1.5px] border-ink bg-paper">
        <div className="flex items-start justify-between border-b-[1.5px] border-ink px-7 pb-5 pt-7">
          <h2 className="font-display text-xl uppercase leading-tight text-ink">Reviews &amp; endorsements</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-7 py-6">
          {endorsers.length > 0 && (
            <VerificationPanel icon="★" title="Endorsed" count={endorsers.length} experts={expertEndorsers} orgs={orgEndorsers} />
          )}
          {reviewers.length > 0 && (
            <VerificationPanel icon="✓" title="Reviewed" count={reviewers.length} experts={expertReviewers} orgs={orgReviewers} />
          )}
          {reviewers.length === 0 && endorsers.length === 0 && (
            <p className="font-mono text-xs text-ink-faint">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewedByButton({
  reviewedCount,
  endorsedCount,
  onOpen,
}: {
  reviewedCount: number
  endorsedCount: number
  onOpen: () => void
}) {
  const parts = [
    reviewedCount > 0 && `✓ Reviewed by ${reviewedCount}`,
    endorsedCount > 0 && `★ Endorsed by ${endorsedCount}`,
  ].filter(Boolean)

  return (
    <Button type="button" variant="secondary" small onClick={onOpen} aria-haspopup="dialog" style={{ touchAction: 'manipulation' }}>
      {parts.join(' · ')}
    </Button>
  )
}

// Hero's chip bar + tag row together (Part 1 step 1/2/4) — pulled out of
// BriefView.tsx to keep that file under the repo's max-lines budget.
// One combined "Reviewed by X · Endorsed by Y" button for reviewers +
// endorsers (2026-08-20 — previously two separate chips; user preferred
// one entry point into the single modal that already lists both groups,
// rather than a chip each). onOpenReviewers opens ReviewersModal, which
// BriefView renders at the top level (see ReviewersModal's own comment for
// why it can't live in here).
export function HeroChipBar({
  reviewedCount,
  endorsedCount,
  lastReviewedAt,
  readTimeMinutes,
  topicTags,
  onOpenReviewers,
}: {
  reviewedCount: number
  endorsedCount: number
  lastReviewedAt: string | null
  readTimeMinutes: number
  topicTags: string[]
  onOpenReviewers: () => void
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-6 anim-rise" style={{ animationDelay: '160ms' }} aria-live="polite">
        {(reviewedCount > 0 || endorsedCount > 0) && (
          <ReviewedByButton reviewedCount={reviewedCount} endorsedCount={endorsedCount} onOpen={onOpenReviewers} />
        )}
        {lastReviewedAt && <HeaderChip>Last reviewed {formatDate(lastReviewedAt)}</HeaderChip>}
        <HeaderChip>{readTimeMinutes} min read</HeaderChip>
      </div>
      {topicTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 anim-rise" style={{ animationDelay: '170ms' }}>
          {topicTags.map((tag) => (
            <HeaderChip key={tag} tone="tag">{tag}</HeaderChip>
          ))}
        </div>
      )}
    </>
  )
}

// Section 01's Contributors list (Part 10 step 3) — names of members whose
// proposed-brief submission got converted/linked into this brief, each
// linking to their profile. Strictly additive: no empty-state chip, this
// just doesn't render when there are none (same convention as the home
// dashboard's matching "Your Proposals" card).
export function ContributorsList({ contributors }: { contributors: BriefContributor[] }) {
  if (contributors.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 anim-rise" style={{ animationDelay: '175ms' }}>
      <span className="font-mono text-label uppercase text-umber-soft">Contributors</span>
      <div className="flex flex-wrap gap-x-4">
        {contributors.map((c) => {
          const name = getDisplayName({ display_name: c.display_name })
          return (
            <Link
              key={c.id}
              href={`/profile/${c.id}`}
              className="focus-ring inline-flex min-h-11 items-center gap-2 font-ui text-ui-sm text-umber-soft transition-colors hover:text-umber"
            >
              <Avatar name={name} avatarUrl={c.avatar_url} size="2xs" />
              {name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header — numbered divider, ink (neutral) by default
// ---------------------------------------------------------------------------

const NUM_TONE_CLASSES: Record<'ink' | 'blue' | 'pink', string> = {
  ink: 'text-umber-soft',
  blue: 'text-cobalt',
  pink: 'text-rose',
}

export function SectionHeader({
  num,
  label,
  description,
  numTone = 'ink',
  onDark = false,
  action,
}: {
  num: string
  label: string
  description: string
  numTone?: 'ink' | 'blue' | 'pink'
  // The Covered By band (plan 4d) is still the fixed dark coverage-bg, so
  // onDark swaps label, description and rule to light text until it moves
  // to band-soft.
  onDark?: boolean
  // Optional trailing control (e.g. Quotes' role filter, CTA's "+ New CTA").
  action?: ReactNode
}) {
  return (
    <div className="mb-12">
      {/* Marker row on its own full-width line, independent of the
          label/description/action row below, so a wide action never
          shortens the hairline. */}
      <div className="mb-4 flex items-center gap-4">
        <span className={`font-mono text-label tabular-nums ${onDark ? 'text-parchment' : NUM_TONE_CLASSES[numTone]}`}>
          {num}
        </span>
        <div className={`h-px flex-1 ${onDark ? 'bg-parchment/20' : 'bg-rule'}`} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={`font-serif text-section ${onDark ? 'text-parchment' : 'text-umber'}`}>{label}</h2>
          <p className={`mt-2 font-ui text-ui-sm ${onDark ? 'text-parchment' : 'text-umber-soft'}`}>{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
