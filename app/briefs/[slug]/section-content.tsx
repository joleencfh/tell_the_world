'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import Avatar from '@/components/ui/Avatar'
import { Carousel } from '@/components/ui/Carousel'
import type { PostType } from '@/lib/types'
import { getDisplayName } from './helpers'
import { parseSources, SourcesGrid } from './sources'
import type { BriefSectionType, Quote, MediaPost } from './page'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// 'tldr' is rendered in the hero, not looped here — see BriefView.
export const SECTION_ORDER: BriefSectionType[] = [
  'use_this',
  'featured_news',
  'explainer',
  'where_experts_stand',
  'going_deeper',
  'faq',
]

export const SECTION_META: Record<BriefSectionType, { label: string; num: string; description: string }> =
  {
    // Not looped over via SECTION_ORDER (BriefView renders it as its own
    // section right after the hero) but kept here so this stays a total map
    // over BriefSectionType. num '01' is the hero's own eyebrow numeral.
    tldr: {
      label: 'TL;DR',
      num: '02',
      description: 'The three-minute version',
    },
    use_this: {
      label: 'Use This',
      num: '01',
      description: 'Story angles, misconceptions to avoid, and quotes ready to use',
    },
    featured_news: {
      label: 'Featured News',
      num: '02',
      description: 'The latest events and why they matter',
    },
    explainer: {
      label: 'Explainer',
      num: '03',
      description: 'The full picture, plainly explained',
    },
    where_experts_stand: {
      label: 'Where Experts Stand',
      num: '04',
      description: 'Where the experts we consulted agree — and where they don’t',
    },
    going_deeper: {
      label: 'Going Deeper',
      num: '05',
      description: 'For when you want to go further',
    },
    faq: {
      label: 'Common Questions',
      num: '06',
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
    <div className="flex w-[300px] shrink-0 snap-start flex-col gap-[0.9rem] border border-line border-t-[3px] border-t-blue bg-paper p-5">
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
// Media card — the "Use this"-adjacent auto section, non-quote posts
// ---------------------------------------------------------------------------

const POST_TYPE_LABELS: Record<PostType, string> = {
  video: 'Video',
  article: 'Article',
  paper: 'Paper',
  resource: 'Resource',
  quote: 'Quote',
}

export function MediaCard({ post, isPinned }: { post: MediaPost; isPinned?: boolean }) {
  const authorName = getDisplayName(post.users)
  const credential = post.users.affiliation || post.users.org_name

  return (
    <div className="flex flex-col bg-card border border-edge rounded-2xl overflow-hidden h-full">
      <div className="p-6 flex-1">
        {isPinned && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] uppercase text-live mb-3">
            📌 Start here
          </span>
        )}
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-soft/70">
          {POST_TYPE_LABELS[post.post_type]}
        </span>
        <h3 className="font-serif text-[1.05rem] font-semibold text-dark leading-snug mt-1.5">
          {post.title}
        </h3>
        {post.body && (
          <p className="font-serif text-sm text-text/80 leading-relaxed mt-2 line-clamp-3">
            {post.body}
          </p>
        )}
      </div>
      <div className="px-6 pb-5 pt-2 flex items-center gap-3 border-t border-edge">
        <Avatar name={authorName} avatarUrl={post.users.avatar_url} palette="colored" size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.users.id}`}
            className="font-serif text-[0.75rem] font-semibold text-dark hover:text-live transition-colors block truncate"
          >
            {authorName}
          </Link>
          {credential && (
            <p className="font-mono text-[8px] tracking-[0.08em] text-soft/70 truncate">{credential}</p>
          )}
        </div>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase text-live/60 hover:text-live transition-colors"
          >
            view →
          </a>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header chip — endorsement bar / last-reviewed / read-time pills
// ---------------------------------------------------------------------------

const CHIP_TONE_CLASSES: Record<'blue' | 'pink' | 'default', string> = {
  blue: 'bg-blue-soft text-blue-ink border-blue/30',
  pink: 'bg-pink-soft text-pink-ink border-pink/30',
  default: 'bg-paper-raised text-ink-soft border-line',
}

export function HeaderChip({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'blue' | 'pink' | 'default'
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-mono text-[9px] tracking-[0.1em] uppercase px-3 py-1 border ${CHIP_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
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
  action,
}: {
  num: string
  label: string
  description: string
  numTone?: 'ink' | 'blue' | 'pink'
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
        <div className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            className="font-display uppercase text-ink font-bold leading-[1]"
            style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', letterSpacing: '0.01em' }}
          >
            {label}
          </h2>
          <p className="font-body text-sm text-ink-soft italic mt-2">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Paragraph content — lead paragraph treatment
// ---------------------------------------------------------------------------

function ParagraphContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean)
  return (
    <div className="space-y-5 max-w-2xl">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={`font-serif leading-relaxed ${
            i === 0
              ? 'text-[1.1rem] text-dark font-medium'
              : 'text-[0.95rem] text-text'
          }`}
        >
          {p.trim()}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Smart section content renderer
// ---------------------------------------------------------------------------

// 'faq' is not handled here — BriefView calls FAQSection directly (above)
// since FAQBlock needs Part 4b's extra props (briefId, answers, etc.) that
// don't fit this generic { type, content } shape.
export function SectionContent({ type, content }: { type: BriefSectionType; content: string }) {
  if (type === 'going_deeper') {
    const items = parseSources(content)
    if (items) {
      return <SourcesGrid items={items} />
    }
  }

  return <ParagraphContent content={content} />
}

// ---------------------------------------------------------------------------
// Locked section placeholder
// ---------------------------------------------------------------------------

export function LockedPlaceholder() {
  return (
    <div className="relative overflow-hidden py-10">
      <div className="space-y-3 select-none pointer-events-none" aria-hidden>
        <div className="h-3 w-10 rounded bg-edge/50 mb-1" />
        <div className="h-7 w-56 rounded-lg bg-edge/50" />
        <div className="mt-5 space-y-2">
          {[88, 75, 92, 68, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-edge/35" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
    </div>
  )
}
