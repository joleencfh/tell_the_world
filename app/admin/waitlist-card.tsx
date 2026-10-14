import RoleBadge from '@/components/ui/RoleBadge'
import type { WaitlistSignup } from '@/lib/admin/actions'

// docs/design/landing-page/plans/temp-landing-page-plan.md §2, Part 1 — read-only
// list card, no approve/reject action (unlike the moderation cards
// elsewhere in this file's siblings). Follows FeedbackCard's layout shape.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function WaitlistCard({ signup }: { signup: WaitlistSignup }) {
  return (
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-body text-sm text-ink font-medium">{signup.full_name}</p>
          <p className="font-mono text-[9px] text-ink-soft">
            {signup.email}
            {' · '}
            {formatDate(signup.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {signup.wants_early_access && (
            <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-pink-ink border border-pink-ink rounded-sm px-1.5 py-0.5">
              Early tester
            </span>
          )}
          <RoleBadge role={signup.role} size="sm" />
        </div>
      </div>

      {(signup.affiliation || signup.linkedin_or_website_url) && (
        <p className="font-body text-sm text-ink-soft">
          {signup.affiliation}
          {signup.affiliation && signup.linkedin_or_website_url && ' · '}
          {signup.linkedin_or_website_url && (
            <a
              href={signup.linkedin_or_website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              {signup.linkedin_or_website_url}
            </a>
          )}
        </p>
      )}

      {signup.additional_info && (
        <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {signup.additional_info}
        </p>
      )}
    </div>
  )
}
