'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!payload.title.trim()) return { error: 'Title is required' }

  const { error } = await supabase.from('content_posts').insert({
    user_id: user.id,
    post_type: payload.post_type,
    title: payload.title.trim(),
    body: payload.body?.trim() || null,
    url: payload.url?.trim() || null,
    topic_tags: payload.topic_tags ?? [],
  })

  if (error) return { error: error.message }

  revalidatePath(`/profile/${user.id}`)
  return { success: true }
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
