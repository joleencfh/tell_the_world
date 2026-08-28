'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { checkClarity } from '@/lib/clarity/check'
import { CONTRIBUTOR_ROLES } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import type { Database, Json } from '@/lib/database.types'

// TODO: drop this once supabase/055_content_posts_flagged_terms.sql is
// applied and lib/database.types.ts is regenerated — flagged_terms will
// then be a real column on the generated Insert type.
type ContentPostInsertWithFlags = Database['public']['Tables']['content_posts']['Insert'] & {
  flagged_terms?: Json | null
}

export type PostType = 'video' | 'article' | 'paper' | 'quote' | 'resource'

export interface PostPayload {
  post_type: PostType
  title: string
  body?: string | null
  url?: string | null
  topic_tags?: string[]
}

export async function createPost(
  payload: PostPayload,
): Promise<{ error?: string; success?: boolean; status?: 'published' | 'pending' }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!payload.title.trim()) return { error: 'Title is required' }

  const title = payload.title.trim()
  const body = payload.body?.trim() || null

  // Deterministic clarity check (lib/clarity/check.ts) — scoped to
  // expert/organisation only, same role set submitQuote gates on
  // (lib/briefs/actions.ts). creator/journalist and admin submissions are
  // completely untouched: creators/journalists are this feature's intended
  // readers, not the jargon source, and admin bypasses it the same way
  // createSourcedQuote already does. Server-side and authoritative —
  // useClarityGate.ts's client-side check is UX only.
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole | undefined

  let status: 'published' | 'pending' = 'published'
  let flaggedTerms: Json | null = null
  if (role && CONTRIBUTOR_ROLES.includes(role)) {
    const { flaggedTerms: flags, isClean } = checkClarity([title, body].filter(Boolean).join('\n\n'))
    if (!isClean) {
      status = 'pending'
      flaggedTerms = flags as unknown as Json
    }
  }

  const insertPayload: ContentPostInsertWithFlags = {
    user_id: user.id,
    post_type: payload.post_type,
    title,
    body,
    url: payload.url?.trim() || null,
    topic_tags: payload.topic_tags ?? [],
    ...(status === 'pending' ? { status, flagged_terms: flaggedTerms } : {}),
  }
  const { error } = await supabase.from('content_posts').insert(insertPayload)

  if (error) return { error: error.message }

  revalidatePath(`/profile/${user.id}`)
  return { success: true, status }
}

export async function updatePost(
  postId: string,
  payload: PostPayload,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!payload.title.trim()) return { error: 'Title is required' }

  const { error } = await supabase
    .from('content_posts')
    .update({
      post_type: payload.post_type,
      title: payload.title.trim(),
      body: payload.body?.trim() || null,
      url: payload.url?.trim() || null,
      topic_tags: payload.topic_tags ?? [],
    })
    .eq('id', postId)
    .eq('user_id', user.id) // RLS also enforces this

  if (error) return { error: error.message }

  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}

export async function deletePost(
  postId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('content_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id) // RLS also enforces this

  if (error) return { error: error.message }

  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}
