import type { PendingCta, PublishedCta } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import EmptyState from '@/components/ui/EmptyState'
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
        <EmptyState title="No pending calls to action." />
      ) : (
        <div className="flex flex-col gap-2" data-testid="admin-queue-list">
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
      <div className="mt-8 border-t border-rule pt-6">
        <h2 className="mb-1 font-mono text-label uppercase text-umber-soft">
          Published — reorder
        </h2>
        <p className="mb-4 font-ui text-ui-sm text-umber-soft">
          Default order is newest first. Set a lower number to promote a CTA earlier in its brief&apos;s
          carousel; clear the field to return it to the default.
        </p>
        {publishedCtas.length === 0 ? (
          <EmptyState title="No published calls to action." />
        ) : (
          <div className="flex flex-col gap-2" data-testid="admin-published-cta-list">
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
