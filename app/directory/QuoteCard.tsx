import Link from 'next/link'
import type { QuoteResult } from '@/lib/directory/queries'

// ---------------------------------------------------------------------------
// Avatar — coloured initials fallback (matches BriefView pattern)
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-amber-700',
  'bg-emerald-700',
  'bg-sky-700',
  'bg-purple-700',
  'bg-rose-700',
]

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-live/20"
      />
    )
  }
  return (
    <div
      className={`w-9 h-9 ${AVATAR_COLORS[idx]} rounded-full flex items-center justify-center shrink-0 select-none`}
    >
      <span className="text-white text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// QuoteCard
// ---------------------------------------------------------------------------

export default function QuoteCard({ quote }: { quote: QuoteResult }) {
  const author     = quote.users
  const authorName = author.display_name?.trim() || 'Anonymous'
  const credential = author.affiliation ?? author.org_name ?? null
  const tags       = (quote.topic_tags ?? []).slice(0, 3)

  return (
    <article
      className="flex flex-col bg-warm rounded-2xl overflow-hidden h-full"
      style={{
        boxShadow: '0 0 0 1px rgba(200,129,10,0.12), 0 4px 24px rgba(0,0,0,0.22)',
      }}
    >
      {/* Quote body — large architectural watermark */}
      <div className="p-7 flex-1 relative overflow-hidden">
        {/* Watermark */}
        <span
          className="absolute -top-8 -right-2 font-serif leading-none text-live/[0.13] select-none pointer-events-none"
          style={{ fontSize: '8.5rem' }}
          aria-hidden
        >
          &ldquo;
        </span>

        {/* Topic tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-live/10 text-live rounded-full font-mono text-[8px] tracking-[0.12em] uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <p className="font-serif text-[0.95rem] text-dark/85 leading-[1.75] relative z-10">
          {quote.body}
        </p>
      </div>

      {/* Author strip */}
      <div className="px-7 pb-6 pt-3 flex items-center gap-3 border-t border-live/10">
        <Avatar name={authorName} avatarUrl={author.avatar_url} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${author.id}`}
            className="font-serif text-[0.8rem] font-semibold text-dark hover:text-live transition-colors block truncate"
          >
            {authorName}
          </Link>
          {credential && (
            <p className="font-mono text-[8px] tracking-[0.08em] text-soft/70 truncate mt-0.5">
              {credential}
            </p>
          )}
        </div>
        <Link
          href={`/profile/${author.id}`}
          className="shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase text-live/50 hover:text-live transition-colors"
        >
          profile →
        </Link>
      </div>
    </article>
  )
}
