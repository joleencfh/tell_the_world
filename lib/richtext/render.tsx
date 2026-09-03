import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import {
  RICH_TEXT_BOLD_FORMAT,
  type RichTextBlockNode,
  type RichTextHeadingLevel,
  type RichTextInlineNode,
  type RichTextParagraphNode,
  type RichTextRoot,
} from './types'
import { tokenizeKeyterms, Keyterm } from './keyterms'

// Walks a Lexical JSON tree (lib/richtext/types.ts) and emits plain React
// elements — never dangerouslySetInnerHTML, never a raw HTML string from the
// editor (docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0b
// step 3). Server-safe: no 'use client', no dependency on the `lexical`
// package, so the read-only render path stays out of the client bundle.

// A link is "internal" (rendered via next/link, no new tab) when its URL is
// a site-relative path — the editor's link toggle asks authors to type
// paths like /briefs/some-slug for internal links. Anything else (absolute
// http(s) URLs) is external and opens in a new tab.
function isInternalPath(url: string): boolean {
  return url.startsWith('/')
}

// Mutable per-render counter for Keyterm's aria-describedby id — plain
// object rather than React state since this whole module is a synchronous
// tree walk, not a component; created fresh inside renderRichText per call
// so it never leaks across separate documents/requests.
interface KeytermState {
  sectionId: string
  counter: { n: number }
}

// {{term|definition}} inside a single text node's raw string (2026-09-02
// port of the legacy plain-text path's tokenizeKeyterms — see
// lib/richtext/keyterms.tsx). Applied per text node rather than per
// paragraph: a keyterm split across a bold/plain formatting boundary (the
// `{{` in one run, the `|def}}` in another) won't be recognized, but an
// author would have to deliberately bold only part of the {{...}} span to
// hit that — not worth flattening the tree to avoid.
function renderTextWithKeyterms(text: string, keyterms: KeytermState): ReactNode {
  const tokens = tokenizeKeyterms(text)
  if (tokens.length === 1 && tokens[0].type === 'text') return text
  return tokens.map((token, i) =>
    token.type === 'text' ? (
      <Fragment key={i}>{token.text}</Fragment>
    ) : (
      <Keyterm key={i} term={token.text} definition={token.definition ?? ''} id={`${keyterms.sectionId}-kt${keyterms.counter.n++}`} />
    ),
  )
}

function renderInline(node: RichTextInlineNode, key: number, keyterms: KeytermState | null): ReactNode {
  if (node.type === 'linebreak') return <br key={key} />

  if (node.type === 'text') {
    const isBold = ((node.format ?? 0) & RICH_TEXT_BOLD_FORMAT) !== 0
    const content = keyterms ? renderTextWithKeyterms(node.text, keyterms) : node.text
    return isBold ? <strong key={key}>{content}</strong> : <Fragment key={key}>{content}</Fragment>
  }

  // node.type === 'link'
  const linkClassName =
    'text-blue-ink underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-blue'
  const children = node.children.map((child, i) => renderInline(child, i, keyterms))

  return isInternalPath(node.url) ? (
    <Link key={key} href={node.url} className={linkClassName}>
      {children}
    </Link>
  ) : (
    <a key={key} href={node.url} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {children}
    </a>
  )
}

// Renders a bare inline-node list with no block wrapper (no keyterms — no
// caller needs them yet) — the TL;DR rich-text path (section-content.tsx's
// TLDRList) needs each bullet's inline content without the <p> renderParagraph
// wraps it in, since the bullet's own markup wraps it instead.
export function renderRichTextInline(nodes: RichTextInlineNode[]): ReactNode {
  return nodes.map((node, i) => renderInline(node, i, null))
}

function renderParagraph(
  paragraph: RichTextParagraphNode,
  key: number,
  paragraphIndex: number,
  paragraphClassName: (index: number) => string,
  keyterms: KeytermState | null,
): ReactNode {
  return (
    <p key={key} className={paragraphClassName(paragraphIndex)}>
      {paragraph.children.map((node, i) => renderInline(node, i, keyterms))}
    </p>
  )
}

const DEFAULT_PARAGRAPH_CLASSNAME = 'font-body text-[0.95rem] leading-[1.7] text-ink-soft'
const DEFAULT_HEADING_CLASSNAME: Record<RichTextHeadingLevel, string> = {
  h2: 'font-display text-[1.5rem] font-extrabold leading-[1.25] text-ink',
  h3: 'font-display text-[1.2rem] font-bold leading-[1.3] text-ink',
}

function renderBlock(
  node: RichTextBlockNode,
  key: number,
  paragraphIndex: number,
  paragraphClassName: (index: number) => string,
  headingClassName: (level: RichTextHeadingLevel) => string,
  keyterms: KeytermState | null,
): ReactNode {
  // paragraphIndex counts only paragraph nodes (e.g. "is this the lead
  // paragraph" styling, explainer.tsx's explainerParagraphClassName) —
  // separate from `key`, the node's position among every block including
  // headings/images, so a heading or image before the first paragraph
  // doesn't shift which paragraph reads as "first".
  if (node.type === 'paragraph') return renderParagraph(node, key, paragraphIndex, paragraphClassName, keyterms)

  if (node.type === 'heading') {
    const Tag = node.tag
    return (
      <Tag key={key} className={headingClassName(node.tag)}>
        {node.children.map((child, i) => renderInline(child, i, keyterms))}
      </Tag>
    )
  }

  // node.type === 'image' — re-hosted on Supabase storage
  // (uploadExplainerImage, lib/admin/brief-actions.ts), same "plain img, not
  // next/image" tradeoff as every other user-submitted image on the site
  // (Avatar.tsx, coverage.tsx).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={key} src={node.url} alt={node.alt} referrerPolicy="no-referrer" className="w-full border border-line" />
  )
}

export function renderRichText(
  doc: RichTextRoot,
  options?: {
    paragraphClassName?: (index: number) => string
    headingClassName?: (level: RichTextHeadingLevel) => string
    // Opt-in (Explainer only, as of 2026-09-02) — undefined leaves every
    // other caller (e.g. FAQ answers, app/briefs/[slug]/faq-answers.tsx)
    // exactly as before, with {{term|definition}} rendered as literal text.
    // sectionId only needs to be unique within the page (feeds Keyterm's
    // aria-describedby id, mirrors the legacy path's `${sectionId}-p${i}-kt${j}`).
    keyterms?: { sectionId: string }
  },
): ReactNode {
  const paragraphClassName = options?.paragraphClassName ?? (() => DEFAULT_PARAGRAPH_CLASSNAME)
  const headingClassName = options?.headingClassName ?? ((level: RichTextHeadingLevel) => DEFAULT_HEADING_CLASSNAME[level])
  const keyterms: KeytermState | null = options?.keyterms ? { sectionId: options.keyterms.sectionId, counter: { n: 0 } } : null
  let paragraphIndex = -1
  return doc.root.children.map((node, i) => {
    if (node.type === 'paragraph') paragraphIndex += 1
    return renderBlock(node, i, paragraphIndex, paragraphClassName, headingClassName, keyterms)
  })
}
