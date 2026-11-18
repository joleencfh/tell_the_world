import type { Application } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { ApplicationCard, ApprovedRow } from '../application-card'
import type { TabProps } from './shared'

export function PendingApplicationsTab({
  pending,
  pendingCount,
  pendingPage,
  buildPageHref,
}: TabProps & { pending: Application[]; pendingCount: number; pendingPage: number }) {
  return (
    <>
      {pending.length === 0 ? (
        <EmptyState title="No pending applications." />
      ) : (
        <div className="flex flex-col gap-2" data-testid="admin-applications-list">
          {pending.map(app => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
      <Pagination
        page={pendingPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingCount}
        buildHref={(p) => buildPageHref('pendingPage', p)}
      />
    </>
  )
}

export function ApprovedTab({
  approved,
  approvedCount,
  approvedPage,
  buildPageHref,
}: TabProps & { approved: Partial<Application>[]; approvedCount: number; approvedPage: number }) {
  return (
    <>
      {approved.length === 0 ? (
        <EmptyState title="No approved users yet." />
      ) : (
        <div className="border border-rule bg-vellum px-5 py-1" data-testid="admin-approved-list">
          {approved.map(app => (
            <ApprovedRow key={app.id} app={app} />
          ))}
        </div>
      )}
      <Pagination
        page={approvedPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={approvedCount}
        buildHref={(p) => buildPageHref('approvedPage', p)}
      />
    </>
  )
}
