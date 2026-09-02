// Shared shape for Lexical-authored rich text (brief_sections.rich_content,
// migration 033). Deliberately a narrow subset of Lexical's serialized node
// types, matching the editor's toolbar (bold, links, paragraphs, two heading
// levels, images — no lists yet). Kept independent of the `lexical` package
// so the read-only public-page renderer (render.tsx) doesn't need to import
// the editor.
//
// Heading levels (migration 059 follow-up, 2026-09-02): 'h2'/'h3' map to
// Lexical's own HeadingNode tag names (lib/richtext/editor.tsx uses
// $createHeadingNode('h2'|'h3') directly) rather than inventing separate
// "section"/"subsection" labels — h2 renders as the Explainer's in-content
// "section" header, h3 as its "subsection" header, both distinct from the
// one-per-row brief_sections.title (rendered by explainer.tsx, unaffected
// by this).

export const RICH_TEXT_BOLD_FORMAT = 1

export interface RichTextTextNode {
  type: 'text'
  text: string
  format?: number
}

export interface RichTextLineBreakNode {
  type: 'linebreak'
}

export interface RichTextLinkNode {
  type: 'link'
  url: string
  children: (RichTextTextNode | RichTextLineBreakNode)[]
}

export type RichTextInlineNode = RichTextTextNode | RichTextLinkNode | RichTextLineBreakNode

export interface RichTextParagraphNode {
  type: 'paragraph'
  children: RichTextInlineNode[]
}

export type RichTextHeadingLevel = 'h2' | 'h3'

export interface RichTextHeadingNode {
  type: 'heading'
  tag: RichTextHeadingLevel
  children: RichTextInlineNode[]
}

export interface RichTextImageNode {
  type: 'image'
  url: string
  alt: string
}

export type RichTextBlockNode = RichTextParagraphNode | RichTextHeadingNode | RichTextImageNode

export interface RichTextRoot {
  root: {
    type: 'root'
    children: RichTextBlockNode[]
  }
}

function isInlineNode(value: unknown): value is RichTextInlineNode {
  if (typeof value !== 'object' || value === null) return false
  const node = value as Record<string, unknown>
  if (node.type === 'linebreak') return true
  if (node.type === 'text') return typeof node.text === 'string'
  if (node.type === 'link') {
    return typeof node.url === 'string' && Array.isArray(node.children) && node.children.every(isInlineNode)
  }
  return false
}

function isParagraphNode(value: unknown): value is RichTextParagraphNode {
  if (typeof value !== 'object' || value === null) return false
  const node = value as Record<string, unknown>
  return node.type === 'paragraph' && Array.isArray(node.children) && node.children.every(isInlineNode)
}

function isHeadingNode(value: unknown): value is RichTextHeadingNode {
  if (typeof value !== 'object' || value === null) return false
  const node = value as Record<string, unknown>
  return (
    node.type === 'heading' &&
    (node.tag === 'h2' || node.tag === 'h3') &&
    Array.isArray(node.children) &&
    node.children.every(isInlineNode)
  )
}

function isImageNode(value: unknown): value is RichTextImageNode {
  if (typeof value !== 'object' || value === null) return false
  const node = value as Record<string, unknown>
  return node.type === 'image' && typeof node.url === 'string' && typeof node.alt === 'string'
}

function isBlockNode(value: unknown): value is RichTextBlockNode {
  return isParagraphNode(value) || isHeadingNode(value) || isImageNode(value)
}

// Defensive parse for data coming back from the DB (typed `unknown` since
// it's a jsonb column) — returns null on anything that doesn't match the
// expected shape rather than throwing, so a malformed/foreign row falls back
// to the legacy plain-text render path instead of crashing the page.
export function parseRichContent(value: unknown): RichTextRoot | null {
  if (typeof value !== 'object' || value === null || !('root' in value)) return null
  const root = (value as { root: unknown }).root
  if (typeof root !== 'object' || root === null) return null
  const { type, children } = root as { type: unknown; children: unknown }
  if (type !== 'root' || !Array.isArray(children) || !children.every(isBlockNode)) return null
  return { root: { type: 'root', children } }
}

// Plain-text mirror of a rich-text doc, kept in brief_sections.content
// alongside rich_content so the not-null column constraint and
// computeReadTimeMinutes (app/briefs/[slug]/helpers.ts) keep working without
// needing to know about the rich-text shape.
function inlineText(node: RichTextInlineNode): string {
  if (node.type === 'linebreak') return '\n'
  if (node.type === 'text') return node.text
  return node.children.map(inlineText).join('')
}

function blockText(node: RichTextBlockNode): string {
  if (node.type === 'image') return node.alt
  return node.children.map(inlineText).join('')
}

export function extractPlainText(doc: RichTextRoot): string {
  return doc.root.children.map(blockText).join('\n\n')
}

// One-way conversion used by the admin editor's "Switch to rich text editor"
// action on a legacy explainer subsection — seeds an initial rich-text doc
// from the existing plain content so it isn't silently discarded. Each
// paragraph becomes a single plain text node; {{term|definition}} keyterm
// markup isn't parsed into anything special (out of scope for this part —
// docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0b), it just
// carries over as literal text for the admin to redo manually if needed.
export function plainTextToRichContent(content: string): RichTextRoot {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0)
  const children: RichTextParagraphNode[] = (paragraphs.length > 0 ? paragraphs : ['']).map((text) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: text.trim() }],
  }))
  return { root: { type: 'root', children } }
}
