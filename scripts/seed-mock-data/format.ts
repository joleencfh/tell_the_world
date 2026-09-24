// ---------------------------------------------------------------------------
// Formatting helpers matching each section's authoring convention
// (app/briefs/[slug]/{section-content,sources,faq}.tsx)
// ---------------------------------------------------------------------------

export function formatTLDR(items: { lead?: string; rest: string }[]): string {
  return items.map((i) => (i.lead ? `**${i.lead}** — ${i.rest}` : i.rest)).join('\n')
}

export interface SourceSeed {
  title: string
  description: string
  publisher: string
  url: string
  summary: string
  takeaways: string[]
}

export function formatSources(items: SourceSeed[]): string {
  return items
    .map((s) =>
      [
        `• "${s.title}" — ${s.description}`,
        `Publisher: ${s.publisher}`,
        s.url,
        `Summary: ${s.summary}`,
        'Key takeaways:',
        ...s.takeaways.map((t) => `- ${t}`),
      ].join('\n'),
    )
    .join('\n\n')
}

export function formatFAQ(items: { q: string; a: string }[]): string {
  return items.map((i) => `Q: ${i.q}\nA: ${i.a}`).join('\n\n')
}

export function avatarUrl(seed: string, kind: 'person' | 'org'): string {
  const style = kind === 'org' ? 'identicon' : 'avataaars'
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
