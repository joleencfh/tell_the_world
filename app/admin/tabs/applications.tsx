import type { Application } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import { ApplicationCard, ApprovedRow } from '../cards'
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
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending applications.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
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
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No approved users yet.
        </p>
      ) : (
        <div className="bg-paper-raised border border-line px-5 py-1">
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
