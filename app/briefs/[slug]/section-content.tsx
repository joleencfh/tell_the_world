'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import { getDisplayName, formatDate } from './helpers'
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
      description: 'The three-minute version',
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

// Section background: alternates between paper and paper-raised (the grid
// texture that used to sit on the paper indices was removed sitewide,
// 2026-08-27 — plain white throughout, per the user's request).
export const SECTION_BG: Record<number, string> = {
  0: 'bg-paper',
  1: 'bg-paper-raised',
  2: 'bg-paper',
  3: 'bg-paper-raised',
  4: 'bg-paper',
  5: 'bg-paper-raised',
}

// ---------------------------------------------------------------------------
// TL;DR bullets — short lines, optional "**lead term** — rest" shape
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

  return lines.map((line) => {
    const match = line.match(/^\*\*(.+?)\*\*\s*—\s*(.*)$/)
    return match ? { lead: match[1].trim(), rest: match[2].trim() } : { lead: null, rest: line }
  })
}

export function TLDRList({ content }: { content: string }) {
  const bullets = parseTLDR(content)
  if (!bullets) return null

  return (
    <ul className="space-y-4 max-w-2xl">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-ink-faint shrink-0" aria-hidden />
          <p className="font-body text-[1.05rem] text-ink leading-[1.7]">
            {bullet.lead && <strong className="font-semibold text-ink">{bullet.lead} — </strong>}
            {bullet.rest}
          </p>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Header chip — endorsement bar / last-reviewed / read-time pills
// ---------------------------------------------------------------------------

const CHIP_TONE_CLASSES: Record<'blue' | 'pink' | 'default' | 'tag' | 'spotlight', string> = {
  blue: 'bg-blue-soft text-blue-ink border-blue/30',
  pink: 'bg-pink-soft text-pink-ink border-pink/30',
  default: 'bg-paper-raised text-ink-soft border-line',
  tag: 'bg-paper-raised text-ink border-line',
  // Solid-filled variant — home dashboard's Highlighted section eyebrow
  // (home-dashboard-plan.md §2 Part 0 step 4), used nowhere else. Extending
  // this component rather than adding a dashboard-local one since it's a
  // pure color/fill reskin of the same chip shape, not a different markup
  // shape.
  spotlight: 'bg-blue text-paper border-blue',
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
      className={`inline-flex items-center whitespace-nowrap font-mono text-[9px] tracking-[0.1em] uppercase px-3 py-1 border-[1.5px] ${CHIP_TONE_CLASSES[tone]}`}
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
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      style={{ touchAction: 'manipulation' }}
      className={`inline-flex items-center whitespace-nowrap font-mono text-[9px] tracking-[0.1em] uppercase px-3 py-1 border-[1.5px] outline-none transition-colors ${CHIP_TONE_CLASSES.blue} hover:bg-blue/20 focus-visible:ring-2 focus-visible:ring-blue`}
    >
      {parts.join(' · ')}
    </button>
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
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-faint">Contributors</span>
      <div className="flex flex-wrap gap-3">
        {contributors.map((c) => {
          const name = getDisplayName({ display_name: c.display_name })
          return (
            <Link
              key={c.id}
              href={`/profile/${c.id}`}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-soft hover:text-ink transition-colors"
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
  ink: 'text-ink',
  blue: 'text-blue',
  pink: 'text-pink',
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
  // Covered By (Part 7) is the only section on the fixed dark band
  // (coverage-bg) — text-ink/bg-line assume a light-in-light-mode /
  // dark-in-dark-mode paper background and invert with the theme, but
  // coverage-bg stays dark in both, so in light mode text-ink (near-black)
  // would sit on a near-black background and vanish. onDark swaps the
  // label/description/rule to the fixed coverage-fg token instead; numTone
  // is untouched since text-pink/text-blue already sit fine on coverage-bg
  // (the Members Only gate banner in BriefView.tsx already proves this
  // combination out).
  onDark?: boolean
  // Optional trailing control (e.g. Quotes' role filter, CTA's "+ New CTA")
  // — mirrors the reference artifact's .sec-head, which is a flex row with
  // the title block on the left and one optional control on the right.
  action?: ReactNode
}) {
  return (
    <div className="mb-12">
      {/* Numbered divider — its own full-width row, independent of the
          label/description/action row below. It used to live nested inside
          that row's left column, sharing width with the action slot — a
          wide action (e.g. the solid "+ New CTA" button) squeezed the
          column enough that the rule visibly stopped short of the section's
          edge, reading as truncated rather than as a deliberate short rule.
          Full width here regardless of whether an action exists. */}
      <div className="flex items-center gap-4 mb-4">
        <span className={`font-mono text-sm tracking-[0.2em] font-bold tabular-nums ${NUM_TONE_CLASSES[numTone]}`}>
          {num}
        </span>
        <div className={`h-px flex-1 ${onDark ? 'bg-coverage-fg/20' : 'bg-line'}`} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            className={`font-display uppercase font-extrabold leading-[1] ${onDark ? 'text-coverage-fg' : 'text-ink'}`}
            style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', letterSpacing: '0.01em' }}
          >
            {label}
          </h2>
          <p className={`font-body text-sm italic mt-2 ${onDark ? 'text-coverage-fg/70' : 'text-ink-soft'}`}>{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Locked section placeholder
// ---------------------------------------------------------------------------

export function LockedPlaceholder() {
  return (
    <div className="relative overflow-hidden py-10">
      <div className="space-y-3 select-none pointer-events-none" aria-hidden>
        <div className="h-3 w-10 rounded bg-line/50 mb-1" />
        <div className="h-7 w-56 rounded-lg bg-line/50" />
        <div className="mt-5 space-y-2">
          {[88, 75, 92, 68, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-line/35" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-paper/60 to-paper" />
    </div>
  )
}
