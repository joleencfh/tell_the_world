// FAQ authoring convention — Q:/A: pairs in one brief_sections.content blob,
// separated by a blank line (app/admin/briefs/[id]/section-editor.tsx's
// SECTION_HELP.faq documents this to the admin). Shared between the public
// render path (app/briefs/[slug]/faq.tsx) and the admin FAQ-meta editor
// (app/admin/briefs/[id]/faq-meta-editor.tsx, Part 6), which both need the
// same parsed question list.

export interface FAQItem {
  question: string
  answer: string
}

export function parseFAQ(content: string): FAQItem[] | null {
  const items: FAQItem[] = []
  const blocks = content.split(/\n(?=Q:)/g)
  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+?)(?:\n|\r\n?)([\s\S]*)/)
    if (!qMatch) continue
    const question = qMatch[1].trim()
    const rest = qMatch[2].trim()
    const aMatch = rest.match(/^A:\s*([\s\S]+)/)
    const answer = aMatch ? aMatch[1].trim() : rest
    if (question) items.push({ question, answer })
  }
  return items.length >= 1 ? items : null
}
