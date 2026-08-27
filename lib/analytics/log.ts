import 'server-only'

import { getAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/database.types'

export type AnalyticsEventType =
  | 'login'
  | 'question_submitted'
  | 'comment_submitted'
  | 'like_added'
  | 'brief_viewed'

interface LogEventParams {
  eventType: AnalyticsEventType
  userId: string | null
  targetType?: string
  targetId?: string
  metadata?: Record<string, Json>
}

// Fire-and-forget-ish: uses the service-role client (bypasses RLS — this
// table has no policies) and never throws, so a logging failure can't take
// down the login redirect or a question/comment/like submission it's
// attached to.
export async function logEvent({ eventType, userId, targetType, targetId, metadata }: LogEventParams): Promise<void> {
  try {
    const { error } = await getAdminClient().from('analytics_events').insert({
      event_type: eventType,
      user_id: userId,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? {},
    })
    if (error) console.error('[analytics] logEvent failed:', error.message)
  } catch (err) {
    console.error('[analytics] logEvent threw:', err)
  }
}

// Brief views are deduped to one row per user per brief per day via a
// unique dedupe_key — a repeat visit just hits the unique constraint,
// which is treated as a normal no-op rather than an error.
export async function logBriefView(userId: string, briefId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const dedupeKey = `brief_viewed:${userId}:${briefId}:${today}`

  try {
    const { error } = await getAdminClient().from('analytics_events').insert({
      event_type: 'brief_viewed',
      user_id: userId,
      target_type: 'brief',
      target_id: briefId,
      dedupe_key: dedupeKey,
    })
    if (error && error.code !== '23505') console.error('[analytics] logBriefView failed:', error.message)
  } catch (err) {
    console.error('[analytics] logBriefView threw:', err)
  }
}
