'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import { Carousel } from '@/components/ui/Carousel'
import { getDisplayName, formatDate } from './helpers'
import type { Quote } from './page'
import type { UserRole } from '@/lib/types'

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

// Section background: alternates between paper (with texture) and paper-raised
export const SECTION_BG: Record<number, string> = {
  0: 'bg-paper grid-texture',
  1: 'bg-paper-raised',
  2: 'bg-paper grid-texture',
  3: 'bg-paper-raised',
  4: 'bg-paper grid-texture',
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
// Quote card — matches the Two-Ink Bold reference artifact's .qcard: flat
// (no radius/shadow), 1px line border + 3px blue top border, blue avatar
// (square for organisation authors), no decorative watermark.
// ---------------------------------------------------------------------------

export function QuoteCard({ quote }: { quote: Quote }) {
  const authorName = getDisplayName(quote.users)
  const credential = quote.users.affiliation || quote.users.org_name
  const isOrg = quote.users.role === 'organisation'

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div className="flex h-full flex-col gap-[0.9rem] border border-line border-t-[3px] border-t-blue bg-paper p-5 transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:shadow-[4px_4px_0_0_var(--color-blue)]">
        <span className="font-mono text-[0.62rem] tracking-[0.06em] text-ink-faint tabular-nums">
          {formatDate(quote.created_at)}
        </span>
        <p className="flex-1 font-body text-base font-medium leading-[1.5] text-ink">
          &ldquo;{quote.body || quote.title}&rdquo;
        </p>
        <div className="flex items-center gap-[0.65rem] border-t border-line pt-[0.85rem]">
          <Avatar
            name={authorName}
            avatarUrl={quote.users.avatar_url}
            palette="blue"
            shape={isOrg ? 'square' : 'circle'}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${quote.users.id}`}
              className="block truncate font-display text-[0.85rem] font-extrabold text-ink hover:text-blue transition-colors"
            >
              {authorName}
            </Link>
            {credential && (
              <p className="mt-0.5 truncate font-mono text-[0.62rem] text-ink-soft">{credential}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quotes carousel — SectionHeader + role filter + shared Carousel, matching
// the reference artifact's #quotes section (filter-select in the sec-head,
// blue-toned section number, blue top rule on the section itself)
// ---------------------------------------------------------------------------

const QUOTE_FILTERS: { value: 'all' | 'expert' | 'organisation'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expert', label: 'Experts only' },
  { value: 'organisation', label: 'Orgs only' },
]

export function QuotesCarousel({ quotes }: { quotes: Quote[] }) {
  const [filter, setFilter] = useState<'all' | 'expert' | 'organisation'>('all')
  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.users.role === filter)

  return (
    <>
      <SectionHeader
        num="03"
        label="Quotes"
        description="Pulled from the platform & source documents on this topic"
        numTone="blue"
        action={
          <>
            <label htmlFor="quote-filter" className="sr-only">
              Filter quotes
            </label>
            <select
              id="quote-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="border-[1.5px] border-line-strong bg-paper px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.04em] text-ink"
            >
              {QUOTE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </>
        }
      />
      {filtered.length > 0 ? (
        <Carousel.Provider>
          <Carousel.PrevButton />
          <Carousel.NextButton />
          <Carousel.Track fadeColor="var(--color-paper-sunken-blue)" ariaLabel="Expert quotes">
            {filtered.map((q) => (
              <QuoteCard key={q.id} quote={q} />
            ))}
          </Carousel.Track>
        </Carousel.Provider>
      ) : (
        <p className="font-mono text-xs text-ink-faint">No quotes match this filter.</p>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Header chip — endorsement bar / last-reviewed / read-time pills
// ---------------------------------------------------------------------------

const CHIP_TONE_CLASSES: Record<'blue' | 'pink' | 'default' | 'tag', string> = {
  blue: 'bg-blue-soft text-blue-ink border-blue/30',
  pink: 'bg-pink-soft text-pink-ink border-pink/30',
  default: 'bg-paper-raised text-ink-soft border-line',
  tag: 'bg-paper-raised text-ink border-line',
}

export function HeaderChip({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'blue' | 'pink' | 'default' | 'tag'
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
// Contribute menu — hero's role-gated dropdown, matching the reference
// artifact's .contribute/.contribute-menu. Visual only for now: the menu
// items don't submit anything yet (open/close is the only wired behavior).
// The working equivalents already live elsewhere on the page — the header's
// own Mark as reviewed/Endorse control, the Q&A form, the CTA/coverage "+"
// buttons — this is just the artifact's single entry point into all of
// them, added per Part 9 header-parity request (2026-08-14).
// ---------------------------------------------------------------------------

const EXPERT_ORG_ROLES: UserRole[] = ['expert', 'organisation']
const CREATOR_JOURNALIST_ROLES: UserRole[] = ['creator', 'journalist']

function ContributeMenuGroup({ label, tone, items }: { label: string; tone: 'blue' | 'pink'; items: string[] }) {
  const hoverClasses =
    tone === 'blue' ? 'hover:bg-blue-soft hover:text-blue-ink' : 'hover:bg-pink-soft hover:text-pink-ink'
  const labelClasses = tone === 'blue' ? 'text-blue' : 'text-pink'

  return (
    <div>
      <div className={`px-[0.9rem] pb-1 pt-[0.55rem] font-mono text-[9px] tracking-[0.08em] ${labelClasses}`}>
        {label}
      </div>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`block w-full border-b border-line px-[0.9rem] py-[0.7rem] text-left font-mono text-[0.68rem] uppercase tracking-[0.03em] text-ink last:border-b-0 ${hoverClasses}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function ContributeMenu({ role }: { role: UserRole }) {
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
  // preview/convenience path so admin doesn't need a separate expert/org or
  // creator/journalist test account just to see the menu (2026-08-14). Safe
  // here specifically because every item below is still visual-only (no
  // onClick) — unlike the real review/endorse control and correction-
  // proposal form, which stay expert/org-only since those actually submit
  // and would error server-side for admin.
  const isAdmin = role === 'admin'
  const showExpertGroup = isAdmin || EXPERT_ORG_ROLES.includes(role)
  const showCreatorGroup = isAdmin || CREATOR_JOURNALIST_ROLES.includes(role)
  if (!showExpertGroup && !showCreatorGroup) return null

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
              items={['Endorse this brief', 'Add a review', 'Suggest a question']}
            />
          )}
          {showCreatorGroup && (
            <ContributeMenuGroup
              label="Creator / Journalist — engage"
              tone="pink"
              items={['Ask a question', 'Add media coverage', 'Suggest a call to action']}
            />
          )}
        </div>
      )}
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
