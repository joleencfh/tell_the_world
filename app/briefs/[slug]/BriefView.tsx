'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { submitQuestion, submitContribution } from '@/lib/briefs/actions'
import ProposeBriefModal from '@/components/ProposeBriefModal'
import type {
  Brief,
  BriefSectionType,
  CurrentUser,
  Question,
  QuestionAuthor,
  Quote,
} from './page'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_ORDER: BriefSectionType[] = [
  'recent_developments',
  'sources_basic',
  'sources_advanced',
  'faq',
]

const SECTION_META: Record<BriefSectionType, { label: string; num: string; description: string }> =
  {
    recent_developments: {
      label: "What's Happening Now",
      num: '01',
      description: 'The latest events and why they matter',
    },
    sources_basic: {
      label: 'Just Getting Started?',
      num: '02',
      description: 'The friendliest places to learn more',
    },
    sources_advanced: {
      label: 'Going Deeper',
      num: '03',
      description: 'For when you want the full picture',
    },
    faq: {
      label: 'Common Questions',
      num: '04',
      description: 'The things everyone wonders about',
    },
  }

// Section background: alternates between base (with texture) and warm amber cream
const SECTION_BG: Record<number, string> = {
  0: 'bg-base grid-texture',
  1: 'bg-warm',
  2: 'bg-base grid-texture',
  3: 'bg-warm',
}

// ---------------------------------------------------------------------------
// Content parsers
// ---------------------------------------------------------------------------

interface SourceItem {
  title: string
  description: string
  url: string | null
  summary?: string
  takeaways?: string[]
}

type ParseMode = 'desc' | 'summary' | 'takeaways'

function parseSources(content: string): SourceItem[] | null {
  const lines = content.split('\n')
  const items: SourceItem[] = []
  let current: {
    titleLine: string
    descLines: string[]
    url: string | null
    summaryLines: string[]
    takeaways: string[]
    mode: ParseMode
  } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    // Only '•' starts a new source item — '- ' is reserved for takeaway bullets
    if (line.startsWith('•')) {
      if (current) items.push(buildSourceItem(current))
      current = { titleLine: trimmed.replace(/^•\s*/, ''), descLines: [], url: null, summaryLines: [], takeaways: [], mode: 'desc' }
    } else if (current) {
      if (trimmed.match(/^https?:\/\//)) {
        current.url = trimmed
        current.mode = 'desc'
      } else if (trimmed.toLowerCase().startsWith('summary:')) {
        current.mode = 'summary'
        const rest = trimmed.replace(/^summary:\s*/i, '')
        if (rest) current.summaryLines.push(rest)
      } else if (trimmed.toLowerCase().match(/^(key )?takeaways?:/)) {
        current.mode = 'takeaways'
      } else if (current.mode === 'takeaways' && trimmed.startsWith('- ')) {
        current.takeaways.push(trimmed.replace(/^-\s*/, ''))
      } else if (current.mode === 'summary' && trimmed) {
        current.summaryLines.push(trimmed)
      } else if (current.mode === 'desc' && trimmed) {
        current.descLines.push(trimmed)
      }
    }
  }
  if (current) items.push(buildSourceItem(current))
  return items.length >= 2 ? items : null
}

function buildSourceItem(raw: {
  titleLine: string
  descLines: string[]
  url: string | null
  summaryLines: string[]
  takeaways: string[]
}): SourceItem {
  let title = raw.titleLine
  let description = raw.descLines.join(' ')

  const quotedMatch = raw.titleLine.match(/^[""""](.+?)[""""](.*)/)
  if (quotedMatch) {
    title = quotedMatch[1]
    const rest = quotedMatch[2].replace(/^\s*[—–-]\s*/, '')
    description = (rest + ' ' + description).trim()
  } else {
    const dashMatch = raw.titleLine.match(/^(.+?)\s+[—–-]\s+(.+)/)
    if (dashMatch) {
      title = dashMatch[1]
      description = (dashMatch[2] + ' ' + description).trim()
    }
  }
  return {
    title: title.trim(),
    description: description.trim(),
    url: raw.url,
    summary: raw.summaryLines.length > 0 ? raw.summaryLines.join(' ') : undefined,
    takeaways: raw.takeaways.length > 0 ? raw.takeaways : undefined,
  }
}

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
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: { display_name: string | null; email: string }) {
  return user.display_name?.trim() || user.email.split('@')[0]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function Avatar({
  name,
  avatarUrl,
  size = 'sm',
}: {
  name: string
  avatarUrl: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' }
  const bgColors = [
    'bg-amber-700',
    'bg-emerald-700',
    'bg-sky-700',
    'bg-purple-700',
    'bg-rose-700',
  ]
  const colorIndex = name.charCodeAt(0) % bgColors.length
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ring-2 ring-white/10`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} ${bgColors[colorIndex]} rounded-full flex items-center justify-center shrink-0 select-none`}
    >
      <span className="text-white font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quote card — watermark quote mark
// ---------------------------------------------------------------------------

function QuoteCard({ quote }: { quote: Quote }) {
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
        <Avatar name={authorName} avatarUrl={quote.users.avatar_url} size="md" />
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

function SectionHeader({
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
// Source card — clickable, opens detail drawer
// ---------------------------------------------------------------------------

function SourceCard({
  item,
  index,
  isSelected,
  isOtherSelected,
  onClick,
}: {
  item: SourceItem
  index: number
  isSelected: boolean
  isOtherSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={`group bg-card rounded-r-2xl rounded-l-none p-5 flex flex-col gap-3 transition-all cursor-pointer select-none
        border border-edge border-l-[3px]
        ${isSelected
          ? 'border-l-live shadow-md ring-1 ring-live/20'
          : isOtherSelected
            ? 'border-l-live/20 opacity-50'
            : 'border-l-live/50 hover:border-l-live hover:shadow-md'
        }`}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs tracking-[0.15em] text-live font-bold tabular-nums mt-0.5 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className={`font-serif text-[0.9rem] font-bold leading-snug transition-colors flex-1 ${isSelected ? 'text-live' : 'text-dark group-hover:text-live'}`}>
          {item.title}
        </p>
        {/* Expand indicator */}
        <span
          className={`shrink-0 text-live/50 text-xs transition-transform duration-300 mt-0.5 ${isSelected ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ↓
        </span>
      </div>
      {item.description && (
        <p className="font-serif text-sm text-soft leading-relaxed pl-8">{item.description}</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit source: ${item.title}`}
          className="ml-auto mt-auto w-8 h-8 rounded-full bg-live/10 hover:bg-live flex items-center justify-center text-live hover:text-white transition-all group/link shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm group-hover/link:translate-x-0.5 transition-transform" aria-hidden>→</span>
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Source drawer — full-width detail panel
// ---------------------------------------------------------------------------

const PLACEHOLDER_SUMMARY =
  'A detailed summary of this source will be added soon. Check back after the brief has been fully annotated, or visit the original source using the link below.'
const PLACEHOLDER_TAKEAWAYS = [
  'Key insight from this source',
  'Another important takeaway',
  'A third point worth noting',
]

function SourceDrawer({
  item,
  index,
  onClose,
}: {
  item: SourceItem
  index: number
  onClose: () => void
}) {
  const summary = item.summary ?? PLACEHOLDER_SUMMARY
  const takeaways = item.takeaways ?? PLACEHOLDER_TAKEAWAYS
  const isPlaceholder = !item.summary

  return (
    <div
      className="mt-3 bg-dark rounded-2xl overflow-hidden anim-drawer"
      style={{ borderTop: '3px solid var(--color-live)' }}
    >
      <div className="px-7 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/60 mb-1.5">
              Source {String(index + 1).padStart(2, '0')} — Summary
            </p>
            <h3 className="font-display uppercase text-white text-xl leading-tight">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close summary"
            className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body — summary + takeaways */}
        <div className="grid sm:grid-cols-[1fr_220px] gap-6 sm:gap-10">
          {/* Summary */}
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/50 mb-3">
              Overview
            </p>
            <p className={`font-serif text-[0.95rem] leading-relaxed ${isPlaceholder ? 'text-white/35 italic' : 'text-white/75'}`}>
              {summary}
            </p>
          </div>

          {/* Takeaways */}
          <div className="sm:border-l sm:border-white/[0.08] sm:pl-8">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/50 mb-3">
              Key takeaways
            </p>
            <ul className="space-y-2.5">
              {takeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-live shrink-0 text-[10px] mt-[3px]" aria-hidden>▸</span>
                  <span className={`font-serif text-sm leading-snug ${isPlaceholder ? 'text-white/30 italic' : 'text-white/65'}`}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        {item.url && (
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-white/25">
              Ready to go deeper?
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display uppercase tracking-widest text-xs bg-live text-white px-5 py-2.5 hover:bg-live/90 transition-colors inline-flex items-center gap-2"
            >
              Visit source <span aria-hidden>→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sources grid — manages open drawer per row
// ---------------------------------------------------------------------------

function SourcesGrid({ items }: { items: SourceItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i))
  }

  // Group into rows of 2 so the drawer appears below the correct row
  const rows: { item: SourceItem; globalIndex: number }[][] = []
  for (let i = 0; i < items.length; i += 2) {
    const row: { item: SourceItem; globalIndex: number }[] = [{ item: items[i], globalIndex: i }]
    if (items[i + 1]) row.push({ item: items[i + 1], globalIndex: i + 1 })
    rows.push(row)
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIdx) => {
        const openInRow = row.find((r) => r.globalIndex === openIndex)
        return (
          <div key={rowIdx}>
            <div className="grid sm:grid-cols-2 gap-4">
              {row.map(({ item, globalIndex }) => (
                <SourceCard
                  key={globalIndex}
                  item={item}
                  index={globalIndex}
                  isSelected={openIndex === globalIndex}
                  isOtherSelected={openIndex !== null && openIndex !== globalIndex}
                  onClick={() => toggle(globalIndex)}
                />
              ))}
            </div>
            {openInRow && (
              <SourceDrawer
                key={openIndex}
                item={openInRow.item}
                index={openInRow.globalIndex}
                onClose={() => setOpenIndex(null)}
              />
            )}
          </div>
        )
      })}
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

function SectionContent({ type, content }: { type: BriefSectionType; content: string }) {
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

  if (type === 'sources_basic' || type === 'sources_advanced') {
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

function LockedPlaceholder() {
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

// ---------------------------------------------------------------------------
// Role + category display helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  creator: 'Creator',
  expert: 'Expert',
  organisation: 'Advocacy Organisation',
  journalist: 'Journalist',
  admin: 'Admin',
}

const EXPERT_CATEGORY_COLORS: Record<string, string> = {
  'Technical AI Safety': 'bg-sky-900/60 text-sky-300 border-sky-700/40',
  'AI Governance': 'bg-purple-900/60 text-purple-300 border-purple-700/40',
  'Technical AI Governance': 'bg-indigo-900/60 text-indigo-300 border-indigo-700/40',
}

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'bg-red-900/50 text-red-300 border-red-700/40',
  TikTok: 'bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-700/40',
  Podcast: 'bg-orange-900/50 text-orange-300 border-orange-700/40',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-live/70 border border-live/20 rounded px-1.5 py-0.5 shrink-0">
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function CategoryChips({ author }: { author: QuestionAuthor }) {
  if (author.role === 'expert' && author.expert_category) {
    const colorClass = EXPERT_CATEGORY_COLORS[author.expert_category] ?? 'bg-white/10 text-white/60 border-white/10'
    return (
      <span className={`font-mono text-[8px] tracking-[0.08em] uppercase border rounded px-1.5 py-0.5 ${colorClass}`}>
        {author.expert_category}
      </span>
    )
  }
  if (author.role === 'creator' && author.creator_platforms?.length) {
    return (
      <>
        {author.creator_platforms.map((p: string) => {
          const colorClass = PLATFORM_COLORS[p] ?? 'bg-white/10 text-white/60 border-white/10'
          return (
            <span key={p} className={`font-mono text-[8px] tracking-[0.08em] uppercase border rounded px-1.5 py-0.5 ${colorClass}`}>
              {p}
            </span>
          )
        })}
      </>
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Mock Q&A data — for screenshot / preview purposes
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS: Question[] = [
  {
    id: 'mock-1',
    question_text: "If an AI is trained to be helpful, why isn't that enough to make it aligned? What's actually missing?",
    answer_text: "Being helpful toward a user's immediate request and being aligned with human values long-term are very different things. A model optimised purely for helpfulness will tell people what they want to hear, assist with requests that cause broader harm, and maximise engagement rather than truth. Alignment requires the system to internalise something much harder to specify: not just 'do what's asked' but 'act in ways that reflect genuine human flourishing across time and context.' We don't yet know how to reliably instil that.",
    created_at: '2025-11-14T10:22:00Z',
    users: {
      id: 'mock-user-1',
      display_name: 'Priya Sharma',
      email: 'priya@example.com',
      avatar_url: null,
      role: 'creator',
      creator_platforms: ['YouTube', 'Podcast'],
    },
    answered_by: {
      id: 'mock-expert-1',
      display_name: 'Dr. Sarah Chen',
      email: 'sarah@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'Technical AI Safety',
    },
  },
  {
    id: 'mock-2',
    question_text: "Is RLHF actually solving alignment, or just making models appear more aligned to evaluators?",
    answer_text: "Mostly the latter, and this distinction matters enormously. RLHF (Reinforcement Learning from Human Feedback) trains models to produce outputs that human raters score highly — but raters have limited time, limited expertise, and are susceptible to confident-sounding wrong answers. The model learns to satisfy the rater, not to be correct or safe. This is sometimes called 'alignment to the evaluator' rather than alignment to underlying values. It's a meaningful improvement over nothing, but it's not a solution to alignment — it's a patch that may obscure how unsolved the problem still is.",
    created_at: '2025-11-18T15:05:00Z',
    users: {
      id: 'mock-user-2',
      display_name: 'Marcus Webb',
      email: 'marcus@example.com',
      avatar_url: null,
      role: 'journalist',
    },
    answered_by: {
      id: 'mock-expert-2',
      display_name: 'Amara Osei',
      email: 'amara@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'AI Governance',
    },
  },
  {
    id: 'mock-3',
    question_text: "I cover economics and I want to start covering AI safety — but my audience didn't sign up for a tech channel. How do I bring them along without losing them?",
    answer_text: "You actually have an advantage: economic intuitions are great entry points into alignment. Incentive structures, principal-agent problems, Goodhart's law — these map directly onto things researchers genuinely worry about. Lead with the dynamics your audience already understands, then show how AI makes those dynamics sharper and harder to correct. You don't need to explain the technical machinery. You need to explain why the stakes are high and who's accountable — which is exactly what good economics journalism does anyway.",
    created_at: '2025-12-01T09:40:00Z',
    users: {
      id: 'mock-user-3',
      display_name: 'Jordan Lee',
      email: 'jordan@example.com',
      avatar_url: null,
      role: 'creator',
      creator_platforms: ['TikTok'],
    },
    answered_by: {
      id: 'mock-expert-3',
      display_name: 'Dr. Felix Müller',
      email: 'felix@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'Technical AI Governance',
    },
  },
  {
    id: 'mock-4',
    question_text: "What should our organisation be advocating for when it comes to alignment — is this something policy can even address?",
    answer_text: "Policy can't solve alignment technically, but it can shape the conditions under which alignment research happens. The most tractable asks right now: mandate transparency about training objectives and evaluation methods, require that frontier model developers publish safety cases before deployment (similar to how pharmaceutical companies must demonstrate efficacy and safety), and fund independent alignment research so the field isn't entirely dependent on the labs whose incentives may conflict with thoroughness. The goal isn't to regulate the science — it's to ensure deployment doesn't outpace the safety work.",
    created_at: '2025-12-08T13:20:00Z',
    users: {
      id: 'mock-user-4',
      display_name: 'Global AI Watch',
      email: 'contact@globalaiwatch.org',
      avatar_url: null,
      role: 'organisation',
    },
    answered_by: {
      id: 'mock-expert-2',
      display_name: 'Amara Osei',
      email: 'amara@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'AI Governance',
    },
  },
]

// ---------------------------------------------------------------------------
// Q&A components
// ---------------------------------------------------------------------------

function AuthorStrip({ author, date }: { author: QuestionAuthor; date?: string }) {
  const name = getDisplayName(author)
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Avatar name={name} avatarUrl={author.avatar_url} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/profile/${author.id}`}
            className="font-serif text-xs font-semibold text-dark hover:text-live transition-colors truncate"
          >
            {name}
          </Link>
          {author.role && <RoleBadge role={author.role} />}
          <CategoryChips author={author} />
        </div>
        {date && (
          <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft mt-0.5">
            {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  )
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className="border border-edge rounded-2xl overflow-hidden bg-card">
      {/* Question */}
      <div className="p-5">
        <AuthorStrip author={question.users} date={question.created_at} />
        <p className="font-serif text-sm text-dark font-semibold leading-snug mt-3">
          {question.question_text}
        </p>
      </div>

      {/* Answer */}
      {question.answer_text ? (
        <div className="border-t border-edge bg-base px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-0.5 self-stretch bg-live/40 rounded-full shrink-0 mt-0.5 mb-0.5" />
            <div className="min-w-0 flex-1 space-y-3">
              {question.answered_by && (
                <AuthorStrip author={question.answered_by} />
              )}
              <p className="font-serif text-sm text-text leading-relaxed">
                {question.answer_text}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-edge px-5 py-3">
          <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft/50">
            Awaiting answer
          </p>
        </div>
      )}
    </div>
  )
}

function QuestionForm({ briefId, briefSlug }: { briefId: string; briefSlug: string }) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitQuestion(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setText('')
        setFeedback({
          type: 'success',
          message: 'Question submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3">
      <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft block">
        Ask a question
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Something you're curious about after reading this brief…"
        disabled={isPending}
        className="w-full bg-base border border-edge rounded-xl px-4 py-3 font-serif text-sm text-text placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50 resize-none disabled:opacity-50 transition"
      />
      {feedback && (
        <p
          className={`font-mono text-[10px] tracking-[0.1em] ${
            feedback.type === 'error' ? 'text-red-600' : 'text-green-700'
          }`}
        >
          {feedback.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="font-display uppercase tracking-widest text-xs bg-dark text-base px-6 py-3 hover:bg-text transition-colors disabled:opacity-40"
      >
        {isPending ? 'Submitting…' : 'Submit Question'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Contribute modal — experts and organisations only
// ---------------------------------------------------------------------------

function ContributeModal({
  briefId,
  briefSlug,
  briefTitle,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitContribution(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: 'Contribution submitted for review. Once approved, it will appear on your profile.',
        })
        setText('')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Propose a correction or addition"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-base rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-edge">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live mb-1">
              Brief contribution
            </p>
            <h2 className="font-display uppercase text-dark text-xl leading-tight">
              Propose a correction or addition
            </h2>
            <p className="font-serif text-xs text-soft mt-1.5 leading-snug">
              For: <em>{briefTitle}</em>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full bg-edge/50 hover:bg-edge flex items-center justify-center text-soft hover:text-dark transition-all text-lg leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft block mb-2">
              Your contribution
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="Describe what you'd like to correct or add — include any sources or context that would help the admin review your suggestion…"
              disabled={isPending || feedback?.type === 'success'}
              className="w-full bg-card border border-edge rounded-xl px-4 py-3 font-serif text-sm text-text placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50 resize-none disabled:opacity-50 transition"
            />
            <p className="font-mono text-[9px] text-soft/50 mt-1 text-right">
              {text.length} / 3000
            </p>
          </div>

          {feedback && (
            <p
              className={`font-mono text-[10px] tracking-[0.1em] leading-relaxed ${
                feedback.type === 'error' ? 'text-red-600' : 'text-green-700'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            {feedback?.type !== 'success' && (
              <button
                type="submit"
                disabled={isPending || !text.trim()}
                className="font-display uppercase tracking-widest text-xs bg-dark text-base px-6 py-3 hover:bg-text transition-colors disabled:opacity-40"
              >
                {isPending ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors"
            >
              {feedback?.type === 'success' ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BriefViewProps {
  brief: Brief
  quotes: Quote[]
  questions: Question[]
  currentUser: CurrentUser | null
}

export default function BriefView({ brief, quotes, questions, currentUser }: BriefViewProps) {
  const isLoggedIn = !!currentUser
  const showSections = isLoggedIn || brief.visibility === 'public'
  const canContribute = currentUser?.role === 'expert' || currentUser?.role === 'organisation'
  const [contributeOpen, setContributeOpen] = useState(false)
  const [proposeBriefOpen, setProposeBriefOpen] = useState(false)
  const sortedSections = [...brief.brief_sections].sort(
    (a, b) => a.display_order - b.display_order,
  )

  return (
    <div className="min-h-screen bg-base text-text">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm border-b border-edge px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <Link
            href={isLoggedIn ? '/home' : '/'}
            className="font-serif text-base font-bold tracking-tight text-text"
          >
            Tell <em className="italic text-live">The</em> World
          </Link>
          <nav className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link href="/directory" className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors hidden sm:block">Directory</Link>
                <Link href="/briefs" className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors hidden sm:block">Briefs</Link>
                <Link href={`/profile/${currentUser.id}`} className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors">Profile</Link>
              </>
            ) : (
              <>
                <Link href="/apply" className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors">Apply</Link>
                <Link href="/login" className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors">Login</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero — grid-texture, large type, editorial TLDR ─────────── */}
        <div className="grid-texture relative overflow-hidden px-6 pt-16 pb-20">
          {/* Bottom fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-base pointer-events-none" />

          <div className="mx-auto max-w-4xl relative">
            {/* Breadcrumb label */}
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-live mb-6 anim-rise" style={{ animationDelay: '0ms' }}>
              Brief
            </p>

            {/* Title — large, dominant */}
            <h1
              className="font-display uppercase text-dark mb-10 anim-rise"
              style={{
                fontSize: 'clamp(2.75rem, 7vw, 6rem)',
                lineHeight: '0.93',
                animationDelay: '80ms',
              }}
            >
              {brief.title}
            </h1>

            {/* TLDR — editorial standfirst */}
            <div className="anim-rise" style={{ animationDelay: '200ms' }}>
              <div className="w-10 h-[3px] bg-live mb-5" />
              <p className="font-serif text-[1.1rem] sm:text-[1.2rem] text-dark/75 leading-[1.65] max-w-2xl">
                {brief.tldr}
              </p>
            </div>
          </div>
        </div>

        {/* ── Quotes band ──────────────────────────────────────────────── */}
        {quotes.length > 0 && (
          <div className="bg-dark px-6 py-16">
            <div className="mx-auto max-w-4xl">
              {/* Band header */}
              <div className="mb-10 anim-rise" style={{ animationDelay: '0ms' }}>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-live/70 mb-3">
                  Expert voices
                </p>
                <h2
                  className="font-display uppercase text-white leading-[0.95]"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  What the experts say
                </h2>
              </div>

              {/* Quote grid */}
              <div className={`grid gap-4 ${quotes.length === 1 ? 'sm:grid-cols-1 max-w-xl' : 'sm:grid-cols-2'}`}>
                {quotes.map((q, i) => (
                  <div key={q.id} className="anim-rise" style={{ animationDelay: `${i * 120}ms` }}>
                    <QuoteCard quote={q} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Sections or lock ─────────────────────────────────────────── */}
        {showSections ? (
          <>
            {SECTION_ORDER.map((type, i) => {
              const section = sortedSections.find((s) => s.section_type === type)
              if (!section) return null
              const meta = SECTION_META[type]
              const bgClass = SECTION_BG[i] ?? 'bg-base'

              return (
                <div key={type} className={`${bgClass} px-6 py-16`}>
                  <div
                    className="mx-auto max-w-4xl anim-rise"
                    style={{ animationDelay: '100ms' }}
                  >
                    <SectionHeader num={meta.num} label={meta.label} description={meta.description} />
                    <SectionContent type={type} content={section.content} />
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <div className="px-6 py-14">
            <div className="mx-auto max-w-4xl space-y-2">
              {SECTION_ORDER.map((type) => (
                <LockedPlaceholder key={type} />
              ))}
            </div>
            {/* Members-only CTA */}
            <div className="mx-auto max-w-4xl mt-6">
              <div className="bg-dark rounded-2xl p-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-live/70">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-display uppercase text-white text-2xl mb-3">Members Only</p>
                <p className="font-serif text-sm text-white/50 mb-8 leading-relaxed max-w-sm mx-auto">
                  The full brief — sources, context, and expert guidance — is available to approved members of the Tell The World community.
                </p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <Link href="/apply" className="font-display uppercase tracking-widest text-xs bg-live text-white px-8 py-3 hover:bg-live/90 transition-colors">
                    Apply to Join
                  </Link>
                  <Link href="/login" className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/40 hover:text-white/80 transition-colors">
                    Already a member? Login →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Q&A — members only ───────────────────────────────────────── */}
        {isLoggedIn && (
          <div className="bg-warm px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="05"
                label="Community Q&A"
                description="Questions from members, answered by experts"
              />
              {(() => {
                const displayed = questions.length > 0 ? questions : MOCK_QUESTIONS
                return (
                  <div className="space-y-4 mb-6">
                    {displayed.map((q) => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                  </div>
                )
              })()}
              <QuestionForm briefId={brief.id} briefSlug={brief.slug} />
            </div>
          </div>
        )}

        {/* ── Footer actions — logged-in members ───────────────────────── */}
        {isLoggedIn && (
          <div className="px-6 py-6 border-t border-edge">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-6">
              {canContribute && (
                <button
                  type="button"
                  onClick={() => setContributeOpen(true)}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
                >
                  <span aria-hidden>→</span> Propose a correction or addition
                </button>
              )}
              <button
                type="button"
                onClick={() => setProposeBriefOpen(true)}
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
              >
                <span aria-hidden>→</span> Propose a new brief
              </button>
            </div>
          </div>
        )}

        {/* ── Contribute modal ─────────────────────────────────────────── */}
        {contributeOpen && currentUser && (
          <ContributeModal
            briefId={brief.id}
            briefSlug={brief.slug}
            briefTitle={brief.title}
            onClose={() => setContributeOpen(false)}
          />
        )}

        {/* ── Propose brief modal ───────────────────────────────────────── */}
        {proposeBriefOpen && currentUser && (
          <ProposeBriefModal
            submitterName={currentUser.display_name || currentUser.email.split('@')[0]}
            submitterEmail={currentUser.email}
            fromBriefTitle={brief.title}
            onClose={() => setProposeBriefOpen(false)}
          />
        )}

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-edge px-6 py-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-serif text-sm font-bold text-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
          <Link
            href={isLoggedIn ? '/home' : '/'}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft/60 hover:text-soft transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </footer>

    </div>
  )
}
