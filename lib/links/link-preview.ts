import 'server-only'

// Server-side Open Graph / meta-tag preview fetch for Covered By (Part 7).
// Hand-rolled rather than a dependency (see two-ink-bold-plan.md §3 Part 7)
// — a small regex scrape of <meta> tags is enough for og:title/og:image/
// og:site_name, and this project hasn't added a package beyond Supabase/
// Resend/Playwright so far.
//
// Never throws: any failure (unreachable host, non-HTML response, no OG
// tags at all) falls back to values derived from the URL itself, so
// submitCoverage (lib/briefs/actions.ts) can always insert a usable row.
// The caller decides what "no image" means visually — CoverageCard falls
// back to the duotone placeholder (components/ui/DuotonePlaceholder.tsx).

export interface LinkPreview {
  title: string
  outletName: string
  imageUrl: string | null
  publishedDate: string | null // YYYY-MM-DD, or null if not found/parseable
}

const FETCH_TIMEOUT_MS = 5000
// Capping how much we read keeps this from being usable as a way to make
// the server download an arbitrarily large response. 1MB comfortably
// covers real article pages (including their inline JS/CSS bloat) while
// still bounding the worst case.
const MAX_BYTES = 1_000_000

// Best-effort SSRF guard: reject obviously-private/loopback/link-local
// hosts before making the request. Not exhaustive (doesn't resolve DNS to
// catch rebinding), but blocks the easy cases for a feature whose whole
// point is fetching URLs arbitrary logged-in members paste in.
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '::1' || host === '[::1]') return true
  if (/^127\./.test(host) || /^0\./.test(host) || /^10\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host)) {
    return true
  }
  const octets = host.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/)
  if (octets) {
    const a = Number(octets[1])
    const b = Number(octets[2])
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  return false
}

function fallbackFromUrl(url: URL): { title: string; outletName: string } {
  return { title: url.href, outletName: url.hostname.replace(/^www\./, '') }
}

// Covers named entities common in article titles/descriptions (curly
// quotes, dashes) plus decimal (&#39;) and hex (&#x27;) numeric character
// references — real headlines use both forms (observed 2026-08-14: Axios
// titles apostrophes as &#x27;, which the decimal-only version of this
// regex silently left undecoded).
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })
}

function extractMeta(html: string, prop: string): string | null {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // content before property/name, or property/name before content —
  // real-world markup uses both orders.
  const patterns = [
    new RegExp(`<meta[^>]*?(?:property|name)=["']${escaped}["'][^>]*?content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return decodeEntities(m[1].trim())
  }
  return null
}

async function readCappedHtml(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return res.text()

  const decoder = new TextDecoder()
  let html = ''
  let bytesRead = 0

  // No early exit on </head>: some real-world sites (e.g. time.com,
  // observed 2026-08-14) emit their og:* meta tags well after the nominal
  // </head> close, likely via a client framework's non-standard tag
  // placement — trusting </head> as a stopping point silently dropped
  // those sites' previews entirely. Just read up to the byte cap.
  while (bytesRead < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    bytesRead += value.byteLength
    html += decoder.decode(value, { stream: true })
  }
  reader.cancel().catch(() => {})
  return html
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const url = new URL(rawUrl)
  const fallback = fallbackFromUrl(url)
  const empty: LinkPreview = { title: fallback.title, outletName: fallback.outletName, imageUrl: null, publishedDate: null }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return empty
  if (isPrivateHost(url.hostname)) return empty

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TellTheWorldBot/1.0; +link-preview)' },
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.includes('text/html')) return empty

    const html = await readCappedHtml(res)

    const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = extractMeta(html, 'og:title') || (titleTagMatch ? decodeEntities(titleTagMatch[1].trim()) : null) || fallback.title
    const outletName = extractMeta(html, 'og:site_name') || fallback.outletName

    let imageUrl = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image')
    if (imageUrl) {
      try {
        const resolved = new URL(imageUrl, url)
        imageUrl = resolved.protocol === 'http:' || resolved.protocol === 'https:' ? resolved.toString() : null
      } catch {
        imageUrl = null
      }
    }

    const publishedRaw = extractMeta(html, 'article:published_time')
    const publishedDate = publishedRaw && !Number.isNaN(Date.parse(publishedRaw)) ? publishedRaw.slice(0, 10) : null

    return { title, outletName, imageUrl, publishedDate }
  } catch {
    return empty
  } finally {
    clearTimeout(timeout)
  }
}
