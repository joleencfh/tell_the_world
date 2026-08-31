import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { isPrivateHost } from '@/lib/links/link-preview'

// Re-hosts a scraped og:image through Supabase storage instead of storing
// the third-party URL directly on brief_coverage.image_url. The CSP's
// img-src only allow-lists 'self', data:, and the Supabase storage origin
// (next.config.ts) — hotlinking outlet CDNs (substackcdn.com, etc.) would
// mean every new outlet silently fails to render until someone notices and
// widens the CSP. Re-hosting works for any host without touching the CSP,
// same tradeoff already made for avatars (app/profile/[id]/actions.ts).
//
// Never throws: any failure (unreachable host, wrong content-type, over
// the size cap, upload error) returns null so the caller (submitCoverage)
// falls back to the duotone placeholder — same "always insertable" contract
// fetchLinkPreview already follows.

const FETCH_TIMEOUT_MS = 8000
const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'coverage-images'

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

async function readCappedBody(res: Response): Promise<Uint8Array | null> {
  const reader = res.body?.getReader()
  if (!reader) {
    const buf = new Uint8Array(await res.arrayBuffer())
    return buf.byteLength <= MAX_BYTES ? buf : null
  }

  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

export async function fetchAndStoreImage(
  supabase: SupabaseClient<Database>,
  imageUrl: string,
  ownerId: string,
): Promise<string | null> {
  let url: URL
  try {
    url = new URL(imageUrl)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (isPrivateHost(url.hostname)) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TellTheWorldBot/1.0; +link-preview)' },
    })
    if (!res.ok) return null

    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    const ext = ALLOWED_IMAGE_TYPES[contentType]
    if (!ext) return null

    const bytes = await readCappedBody(res)
    if (!bytes) return null

    const path = `${ownerId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType, upsert: false })
    if (uploadError) return null

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return publicUrl
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
