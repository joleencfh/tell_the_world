'use client'

// Split out from highlighted.tsx (not because this needs to be reused
// elsewhere, but because it needs 'use client' for the image-load-failure
// fallback below, and that directive is file-scoped — the rest of
// highlighted.tsx stays a server component). Mirrors coverage.tsx's own
// CoverageCard imgFailed handling: a third-party og:image host can 404 or,
// more commonly here, get blocked by next.config.ts's img-src CSP allowlist
// (Supabase storage + dicebear only) — either way this falls back to
// Thumb's gradient tile instead of a broken-image icon, exactly like the
// real Brief page's coverage cards already do.

import { useState } from 'react'
import Thumb from '@/components/ui/Thumb'
import CardGoLink from '@/components/ui/CardGoLink'
import { formatDate } from '@/app/briefs/[slug]/helpers'
import type { Coverage } from '@/lib/data/coverage'

export default function DashboardCoverageCard({ coverage }: { coverage: Coverage }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = coverage.image_url && !imgFailed
  const dateLabel = coverage.published_date ? formatDate(coverage.published_date) : formatDate(coverage.created_at)

  return (
    <div className="flex gap-4 border border-line border-t-[3px] border-t-pink bg-paper p-5">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden">
        {showImage ? (
          // Arbitrary third-party host — can't be allow-listed for next/image (matches coverage.tsx's own tradeoff).
          <img
            src={coverage.image_url!}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Thumb id={coverage.id} className="h-full w-full" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="truncate font-mono text-[0.62rem] uppercase tracking-[0.06em] text-ink-faint">
          {coverage.outlet_name}
        </span>
        <p className="break-words font-display text-sm font-bold leading-snug text-ink line-clamp-2">
          {coverage.title}
        </p>
        <span className="font-mono text-[0.58rem] text-ink-faint">{dateLabel}</span>
      </div>
      <CardGoLink
        href={coverage.url}
        ariaLabel={`Read "${coverage.title}" at ${coverage.outlet_name}`}
        variant="external"
        className="self-center"
      />
    </div>
  )
}
