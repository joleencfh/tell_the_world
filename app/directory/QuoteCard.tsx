import Link from 'next/link'
import type { QuoteResult } from '@/lib/directory/queries'
import Avatar from '@/components/ui/Avatar'

// ---------------------------------------------------------------------------
// QuoteCard
// ---------------------------------------------------------------------------
// Matches the Brief page's blue-accented quote card (app/briefs/[slug]/
// section-content.tsx's QuoteCard, Part 2 of the Two-Ink Bold migration) —
// same card in two contexts, per docs/design/brief-feature/two-ink-bold-plan.md
// Part 11e. Adds a topic-tags row the Brief version doesn't need (this is the
// only place quotes are browsed across all topics at once).

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function QuoteCard({ quote }: { quote: QuoteResult }) {
  const author     = quote.users
  const authorName = author.display_name?.trim() || 'Anonymous'
  const credential = author.affiliation ?? author.org_name ?? null
  const tags       = (quote.topic_tags ?? []).slice(0, 3)
  const isOrg      = author.role === 'organisation'

  return (
    <article className="flex h-full flex-col gap-[0.9rem] border border-line border-t-[3px] border-t-blue bg-paper p-5 transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:shadow-[4px_4px_0_0_var(--color-blue)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.62rem] tracking-[0.06em] text-ink-faint tabular-nums">
          {formatDate(quote.created_at)}
        </span>
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-soft text-blue-ink rounded-full font-mono text-[8px] tracking-[0.12em] uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="flex-1 font-body text-base font-medium leading-[1.5] text-ink">
        &ldquo;{quote.body}&rdquo;
      </p>

      <div className="flex items-center gap-[0.65rem] border-t border-line pt-[0.85rem]">
        <Avatar
          name={authorName}
          avatarUrl={author.avatar_url}
          palette="blue"
          shape={isOrg ? 'square' : 'circle'}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${author.id}`}
            className="block truncate font-display text-[0.85rem] font-extrabold text-ink hover:text-blue transition-colors"
          >
            {authorName}
          </Link>
          {credential && (
            <p className="mt-0.5 truncate font-mono text-[0.62rem] text-ink-soft">{credential}</p>
          )}
        </div>
      </div>
    </article>
  )
}
