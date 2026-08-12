export function getDisplayName(user: { display_name: string | null; email?: string }) {
  return user.display_name?.trim() || user.email?.split('@')[0] || 'Member'
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Read time is calculated on authored section text only — annotations,
// takes, quotes, and Q&A are excluded (design doc §11).
const READ_TIME_SECTION_TYPES = new Set([
  'tldr',
  'use_this',
  'featured_news',
  'explainer',
  'going_deeper',
  'faq',
])

const WORDS_PER_MINUTE = 225

export function computeReadTimeMinutes(sections: { section_type: string; content: string }[]) {
  const wordCount = sections
    .filter((s) => READ_TIME_SECTION_TYPES.has(s.section_type))
    .reduce((total, s) => {
      const text = s.content.replace(/<[^>]+>/g, ' ').trim()
      return total + (text ? text.split(/\s+/).length : 0)
    }, 0)

  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}
