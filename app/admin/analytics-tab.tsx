import type { AnalyticsEventRow } from '@/lib/admin/actions'
import Tag from '@/components/ui/Tag'

const EVENT_LABELS: Record<string, string> = {
  login: 'Login',
  question_submitted: 'Question submitted',
  comment_submitted: 'Comment submitted',
  like_added: 'Like',
  brief_viewed: 'Brief viewed',
}

const TARGET_LABELS: Record<string, string> = {
  brief: 'Brief',
  quote: 'Quote',
  explainer_comment: 'Explainer comment',
  coverage_comment: 'Coverage comment',
  explainer_useful: 'Explainer "useful" vote',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AnalyticsEventRowItem({ event }: { event: AnalyticsEventRow }) {
  const who = event.users?.display_name || event.users?.email || 'Unknown user'
  const targetLabel = event.target_type ? TARGET_LABELS[event.target_type] ?? event.target_type : null

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-3 border-b border-rule py-3 font-ui text-ui-sm last:border-0">
      <time dateTime={event.created_at} className="shrink-0 text-umber-soft sm:w-44">
        {formatDateTime(event.created_at)}
      </time>
      <Tag className="shrink-0">{EVENT_LABELS[event.event_type] ?? event.event_type}</Tag>
      <span className="min-w-0 flex-1 truncate text-umber">{who}</span>
      {targetLabel && <span className="shrink-0 text-umber-soft">{targetLabel}</span>}
    </div>
  )
}
