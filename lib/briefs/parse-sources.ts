// Shared with app/briefs/[slug]/sources.tsx (client, re-exports these for the
// public page's rendering) and lib/admin/brief-actions.ts (server, validates
// a going_deeper section's authored text before save). Kept in a plain
// module rather than only in sources.tsx (a 'use client' file) so the admin
// save action can import the exact same parser instead of re-implementing
// it — one parsing convention, one place it's enforced.

export interface SourceItem {
  title: string
  description: string
  url: string | null
  summary?: string
  takeaways?: string[]
  publisher?: string
}

type ParseMode = 'desc' | 'summary' | 'takeaways'

export function parseSources(content: string): SourceItem[] | null {
  const lines = content.split('\n')
  const items: SourceItem[] = []
  let current: {
    titleLine: string
    descLines: string[]
    url: string | null
    summaryLines: string[]
    takeaways: string[]
    publisher: string | null
    mode: ParseMode
  } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    // Only '•' starts a new source item — '- ' is reserved for takeaway bullets
    if (line.startsWith('•')) {
      if (current) items.push(buildSourceItem(current))
      current = { titleLine: trimmed.replace(/^•\s*/, ''), descLines: [], url: null, summaryLines: [], takeaways: [], publisher: null, mode: 'desc' }
    } else if (current) {
      if (trimmed.match(/^https?:\/\//)) {
        current.url = trimmed
        current.mode = 'desc'
      } else if (trimmed.toLowerCase().startsWith('publisher:')) {
        current.publisher = trimmed.replace(/^publisher:\s*/i, '').trim()
        current.mode = 'desc'
      } else if (trimmed.toLowerCase().startsWith('summary:')) {
        current.mode = 'summary'
        const rest = trimmed.replace(/^summary:\s*/i, '')
        if (rest) current.summaryLines.push(rest)
      } else if (trimmed.toLowerCase().match(/^(key )?takeaways?:/)) {
        current.mode = 'takeaways'
      } else if (current.mode === 'takeaways' && trimmed.startsWith('- ')) {
        current.takeaways.push(trimmed.replace(/^-\s*/, ''))
      } else if (current.mode === 'summary' && trimmed) {
        current.summaryLines.push(trimmed)
      } else if (current.mode === 'desc' && trimmed) {
        current.descLines.push(trimmed)
      }
    }
  }
  if (current) items.push(buildSourceItem(current))
  return items.length >= 2 ? items : null
}

function buildSourceItem(raw: {
  titleLine: string
  descLines: string[]
  url: string | null
  summaryLines: string[]
  takeaways: string[]
  publisher: string | null
}): SourceItem {
  let title = raw.titleLine
  let description = raw.descLines.join(' ')

  const quotedMatch = raw.titleLine.match(/^[""""](.+?)[""""](.*)/)
  if (quotedMatch) {
    title = quotedMatch[1]
    const rest = quotedMatch[2].replace(/^\s*[—–-]\s*/, '')
    description = (rest + ' ' + description).trim()
  } else {
    const dashMatch = raw.titleLine.match(/^(.+?)\s+[—–-]\s+(.+)/)
    if (dashMatch) {
      title = dashMatch[1]
      description = (dashMatch[2] + ' ' + description).trim()
    }
  }
  return {
    title: title.trim(),
    description: description.trim(),
    url: raw.url,
    summary: raw.summaryLines.length > 0 ? raw.summaryLines.join(' ') : undefined,
    takeaways: raw.takeaways.length > 0 ? raw.takeaways : undefined,
    publisher: raw.publisher || undefined,
  }
}
