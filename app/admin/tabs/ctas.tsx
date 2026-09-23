import type { PendingCta, PublishedCta } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import { CtaCard, PublishedCtaCard } from '../cta-card'

export function CtasTab({
  pendingCtas,
  pendingCtasCount,
  ctasPage,
  publishedCtas,
  publishedCtasCount,
  publishedCtasPage,
  buildPageHref,
}: {
  pendingCtas: PendingCta[]
  pendingCtasCount: number
  ctasPage: number
  publishedCtas: PublishedCta[]
  publishedCtasCount: number
  publishedCtasPage: number
  buildPageHref: (paramName: string, page: number) => string
}) {
  return (
    <>
      {pendingCtas.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending calls to action.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingCtas.map(c => (
            <CtaCard key={c.id} cta={c} />
          ))}
        </div>
      )}
      <Pagination
        page={ctasPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingCtasCount}
        buildHref={(p) => buildPageHref('ctasPage', p)}
      />

      {/* Published CTAs — reorder/pin control (brief-page-part2-plan.md
          §2, Part 8). Separate from the pending queue above: these are
          already live, this section is about which order they appear
          in, not moderation. */}
      <div className="mt-8 pt-6 border-t border-line">
        <h2 className="mb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
          Published — reorder
        </h2>
        <p className="mb-4 font-body text-xs text-ink-soft/70">
          Default order is newest first. Set a lower number to promote a CTA earlier in its brief&apos;s
          carousel; clear the field to return it to the default.
        </p>
        {publishedCtas.length === 0 ? (
          <p className="font-body text-sm text-ink-soft italic py-8 text-center">
            No published calls to action.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {publishedCtas.map(c => (
              <PublishedCtaCard key={c.id} cta={c} />
            ))}
          </div>
        )}
        <Pagination
          page={publishedCtasPage}
          pageSize={ADMIN_PAGE_SIZE}
          total={publishedCtasCount}
          buildHref={(p) => buildPageHref('publishedCtasPage', p)}
        />
      </div>
    </>
  )
}
