import type { PendingContentPost, PendingCoverage, PendingBriefFeedback } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import { ContentPostCard } from '../content-post-card'
import { CoverageCard } from '../coverage-card'
import { FeedbackCard } from '../feedback-card'
import type { TabProps } from './shared'

// Pending contributor submissions tab — brief-attached quotes (submitQuote)
// and profile posts (createPost) both land here, only when the
// deterministic clarity check flagged them (see lib/clarity/check.ts and
// lib/data/admin.ts's getPendingContentPosts).
export function QuotesTab({
  pendingContentPosts,
  pendingContentPostsCount,
  quotesPage,
  buildPageHref,
}: TabProps & { pendingContentPosts: PendingContentPost[]; pendingContentPostsCount: number; quotesPage: number }) {
  return (
    <>
      {pendingContentPosts.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending submissions.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingContentPosts.map(q => (
            <ContentPostCard key={q.id} quote={q} />
          ))}
        </div>
      )}
      <Pagination
        page={quotesPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingContentPostsCount}
        buildHref={(p) => buildPageHref('quotesPage', p)}
      />
    </>
  )
}

export function CoverageTab({
  pendingCoverage,
  pendingCoverageCount,
  coveragePage,
  buildPageHref,
}: TabProps & { pendingCoverage: PendingCoverage[]; pendingCoverageCount: number; coveragePage: number }) {
  return (
    <>
      {pendingCoverage.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending coverage.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingCoverage.map(c => (
            <CoverageCard key={c.id} coverage={c} />
          ))}
        </div>
      )}
      <Pagination
        page={coveragePage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingCoverageCount}
        buildHref={(p) => buildPageHref('coveragePage', p)}
      />
    </>
  )
}

export function FeedbackTab({
  pendingBriefFeedback,
  pendingBriefFeedbackCount,
  feedbackPage,
  buildPageHref,
}: TabProps & { pendingBriefFeedback: PendingBriefFeedback[]; pendingBriefFeedbackCount: number; feedbackPage: number }) {
  return (
    <>
      {pendingBriefFeedback.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No new feedback.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingBriefFeedback.map(f => (
            <FeedbackCard key={f.id} feedback={f} />
          ))}
        </div>
      )}
      <Pagination
        page={feedbackPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingBriefFeedbackCount}
        buildHref={(p) => buildPageHref('feedbackPage', p)}
      />
    </>
  )
}
