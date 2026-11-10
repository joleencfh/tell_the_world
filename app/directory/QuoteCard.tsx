import Link from 'next/link'
import type { QuoteResult } from '@/lib/directory/queries'
import Author from '@/components/ui/Author'
import Tag from '@/components/ui/Tag'

// ---------------------------------------------------------------------------
// QuoteCard
// ---------------------------------------------------------------------------
// The Quote card (design-system.md 3.5): the quote in serif, then the Author
// block. Adds a topic-tags row the Brief version doesn't need (this is the
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

  return (
    <article className="flex h-full flex-col gap-4 rounded-control bg-vellum p-5 shadow-hairline">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-label tabular-nums text-umber-soft">{formatDate(quote.created_at)}</span>
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>

      <p className="flex-1 font-serif text-message text-umber">&ldquo;{quote.body}&rdquo;</p>

      <div className="border-t border-window-line pt-3.5">
        <Link
          href={`/profile/${author.id}`}
          className="block min-h-11 rounded-control hover:underline focus-ring"
        >
          <Author name={authorName} avatarUrl={author.avatar_url} role={author.role} affiliation={credential} size="sm" />
        </Link>
      </div>
    </article>
  )
}
