import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { getDisplayName } from './helpers'
import { parseSources, SourcesGrid } from './sources'
import type { BriefSectionType, Quote } from './page'

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
    // Not looped over (rendered in the hero instead) but kept here so this
    // stays a total map over BriefSectionType.
    tldr: {
      label: 'TL;DR',
      num: '00',
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

// Section background: alternates between base (with texture) and warm amber cream
export const SECTION_BG: Record<number, string> = {
  0: 'bg-base grid-texture',
  1: 'bg-warm',
  2: 'bg-base grid-texture',
  3: 'bg-warm',
  4: 'bg-base grid-texture',
  5: 'bg-warm',
}

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
// Quote card — watermark quote mark
// ---------------------------------------------------------------------------

export function QuoteCard({ quote }: { quote: Quote }) {
  const authorName = getDisplayName(quote.users)
  const credential = quote.users.affiliation || quote.users.org_name

  return (
    <div className="flex flex-col bg-warm rounded-2xl overflow-hidden h-full" style={{ boxShadow: '0 0 0 1px rgba(200,129,10,0.15), 0 8px 32px rgba(0,0,0,0.35)' }}>
      {/* Quote body — quote mark is an architectural watermark */}
      <div className="p-7 flex-1 relative overflow-hidden">
        <span
          className="absolute -top-10 -right-3 font-serif leading-none text-live/[0.18] select-none pointer-events-none"
          style={{ fontSize: '11rem' }}
          aria-hidden
        >
          &ldquo;
        </span>
        <p className="font-serif text-[1rem] text-dark/85 leading-[1.75] relative z-10">
          {quote.body || quote.title}
        </p>
      </div>

      {/* Author strip */}
      <div className="px-7 pb-6 pt-2 flex items-center gap-3 border-t border-live/10">
        <Avatar
          name={authorName}
          avatarUrl={quote.users.avatar_url}
          palette="colored"
          size="lg"
          ringClassName="ring-2 ring-white/10"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${quote.users.id}`}
            className="font-serif text-[0.8rem] font-semibold text-dark hover:text-live transition-colors block truncate"
          >
            {authorName}
          </Link>
          {credential && (
            <p className="font-mono text-[9px] tracking-[0.08em] text-soft/70 truncate mt-0.5">
              {credential}
            </p>
          )}
        </div>
        {quote.url && (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase text-live/60 hover:text-live transition-colors"
          >
            source →
          </a>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section header — amber rule, bigger number
// ---------------------------------------------------------------------------

export function SectionHeader({
  num,
  label,
  description,
}: {
  num: string
  label: string
  description: string
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-sm tracking-[0.2em] text-live font-bold tabular-nums">
          {num}
        </span>
        <div className="h-px flex-1 bg-live/20" />
      </div>
      <h2 className="font-display uppercase text-dark leading-[1] text-[2rem] sm:text-[2.75rem]">
        {label}
      </h2>
      <p className="font-serif text-sm text-soft/75 italic mt-2">{description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FAQ block — larger Q/A labels, more padding
// ---------------------------------------------------------------------------

function FAQBlock({ item }: { item: FAQItem }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      {/* Question */}
      <div className="bg-dark px-6 py-5 flex items-start gap-5">
        <span className="font-display text-live text-2xl leading-none shrink-0 mt-0.5 select-none">
          Q
        </span>
        <p className="font-serif text-[0.95rem] font-semibold text-white leading-relaxed">
          {item.question}
        </p>
      </div>
      {/* Answer */}
      <div className="bg-card border border-edge border-t-0 px-6 py-5 flex items-start gap-5">
        <span className="font-display text-soft/50 text-2xl leading-none shrink-0 mt-0.5 select-none">
          A
        </span>
        <p className="font-serif text-sm text-text leading-relaxed">{item.answer}</p>
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

export function SectionContent({ type, content }: { type: BriefSectionType; content: string }) {
  if (type === 'faq') {
    const items = parseFAQ(content)
    if (items) {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <FAQBlock key={i} item={item} />
          ))}
        </div>
      )
    }
  }

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
