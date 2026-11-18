import RoleLabel from '@/components/ui/RoleLabel'
import Tag from '@/components/ui/Tag'
import type { WaitlistSignup } from '@/lib/admin/actions'
import { formatDate, QueueItem } from './admin-shared'

// docs/design/landing-page/plans/temp-landing-page-plan.md §2, Part 1 — read-only
// list card, no approve/reject action (unlike the moderation cards
// elsewhere in this file's siblings). Follows FeedbackCard's layout shape.

export function WaitlistCard({ signup }: { signup: WaitlistSignup }) {
  return (
    <QueueItem
      testId="admin-waitlist-card"
      title={signup.full_name}
      meta={
        <>
          {signup.email}
          {' · '}
          {formatDate(signup.created_at)}
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {signup.wants_early_access && <Tag>Early tester</Tag>}
          <RoleLabel role={signup.role} />
        </div>

        {(signup.affiliation || signup.linkedin_or_website_url) && (
          <p className="font-ui text-ui-sm text-umber-soft">
            {signup.affiliation}
            {signup.affiliation && signup.linkedin_or_website_url && ' · '}
            {signup.linkedin_or_website_url && (
              <a
                href={signup.linkedin_or_website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-cobalt underline focus-ring"
              >
                {signup.linkedin_or_website_url}
              </a>
            )}
          </p>
        )}

        {signup.additional_info && (
          <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">
            {signup.additional_info}
          </p>
        )}
      </div>
    </QueueItem>
  )
}
