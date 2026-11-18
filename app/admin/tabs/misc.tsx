import type { BriefReview, BriefProposal, WaitlistSignup, AnalyticsEventRow } from '@/lib/admin/actions'
import type { BriefOption } from '@/lib/admin/brief-actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { BriefProposalCard } from '../cards'
import { ReviewCard } from '../review-card'
import { WaitlistCard } from '../waitlist-card'
import { AnalyticsEventRowItem } from '../analytics-tab'
import type { TabProps } from './shared'

// Reviews & endorsements tab — read-only, no pending state
export function ReviewsTab({
  briefReviews,
  briefReviewsCount,
  reviewsPage,
  buildPageHref,
}: TabProps & { briefReviews: BriefReview[]; briefReviewsCount: number; reviewsPage: number }) {
  return (
    <>
      {briefReviews.length === 0 ? (
        <EmptyState title="No reviews or endorsements yet." />
      ) : (
        <div className="flex flex-col gap-2" data-testid="admin-queue-list">
          {briefReviews.map(r => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
      <Pagination
        page={reviewsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={briefReviewsCount}
        buildHref={(p) => buildPageHref('reviewsPage', p)}
      />
    </>
  )
}

export function ProposalsTab({
  briefProposals,
  briefProposalsCount,
  proposalsPage,
  briefOptions,
  buildPageHref,
}: TabProps & {
  briefProposals: BriefProposal[]
  briefProposalsCount: number
  proposalsPage: number
  briefOptions: BriefOption[]
}) {
  return (
    <>
      {briefProposals.length === 0 ? (
        <EmptyState title="No brief proposals yet." />
      ) : (
        <div className="flex flex-col gap-2" data-testid="admin-queue-list">
          {briefProposals.map(p => (
            <BriefProposalCard key={p.id} proposal={p} briefOptions={briefOptions} />
          ))}
        </div>
      )}
      <Pagination
        page={proposalsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={briefProposalsCount}
        buildHref={(p) => buildPageHref('proposalsPage', p)}
      />
    </>
  )
}

// Waitlist tab — read-only, no approve/reject state
export function WaitlistTab({
  waitlistSignups,
  waitlistSignupsCount,
  waitlistPage,
  buildPageHref,
}: TabProps & { waitlistSignups: WaitlistSignup[]; waitlistSignupsCount: number; waitlistPage: number }) {
  return (
    <>
      {waitlistSignups.length === 0 ? (
        <EmptyState title="No waitlist signups yet." />
      ) : (
        <div className="flex flex-col gap-2" data-testid="admin-queue-list">
          {waitlistSignups.map(w => (
            <WaitlistCard key={w.id} signup={w} />
          ))}
        </div>
      )}
      <Pagination
        page={waitlistPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={waitlistSignupsCount}
        buildHref={(p) => buildPageHref('waitlistPage', p)}
      />
    </>
  )
}

// Analytics tab — read-only activity feed (logins, questions, comments,
// likes, brief views) written by lib/analytics/log.ts
export function AnalyticsTab({
  analyticsEvents,
  analyticsEventsCount,
  analyticsPage,
  buildPageHref,
}: TabProps & { analyticsEvents: AnalyticsEventRow[]; analyticsEventsCount: number; analyticsPage: number }) {
  return (
    <>
      {analyticsEvents.length === 0 ? (
        <EmptyState title="No activity recorded yet." />
      ) : (
        <div className="border border-rule bg-vellum px-4" data-testid="admin-analytics-list">
          {analyticsEvents.map((event) => (
            <AnalyticsEventRowItem key={event.id} event={event} />
          ))}
        </div>
      )}
      <Pagination
        page={analyticsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={analyticsEventsCount}
        buildHref={(p) => buildPageHref('analyticsPage', p)}
      />
    </>
  )
}
