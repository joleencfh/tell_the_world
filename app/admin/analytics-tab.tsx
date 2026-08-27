import type { AnalyticsEventRow } from '@/lib/admin/actions'

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
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-line last:border-0">
      <span className="font-mono text-[9px] text-ink-soft shrink-0 w-40">{formatDateTime(event.created_at)}</span>
      <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink shrink-0">
        {EVENT_LABELS[event.event_type] ?? event.event_type}
      </span>
      <span className="font-body text-sm text-ink flex-1 min-w-0 truncate">{who}</span>
      {targetLabel && <span className="font-mono text-[10px] text-ink-soft shrink-0">{targetLabel}</span>}
    </div>
  )
}
