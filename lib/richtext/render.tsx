import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import {
  RICH_TEXT_BOLD_FORMAT,
  type RichTextInlineNode,
  type RichTextParagraphNode,
  type RichTextRoot,
} from './types'

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

function renderInline(node: RichTextInlineNode, key: number): ReactNode {
  if (node.type === 'linebreak') return <br key={key} />

  if (node.type === 'text') {
    const isBold = ((node.format ?? 0) & RICH_TEXT_BOLD_FORMAT) !== 0
    return isBold ? <strong key={key}>{node.text}</strong> : <Fragment key={key}>{node.text}</Fragment>
  }

  // node.type === 'link'
  const linkClassName =
    'text-blue-ink underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-blue'
  const children = node.children.map((child, i) => renderInline(child, i))

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

function renderParagraph(
  paragraph: RichTextParagraphNode,
  index: number,
  paragraphClassName: (index: number) => string,
): ReactNode {
  return (
    <p key={index} className={paragraphClassName(index)}>
      {paragraph.children.map((node, i) => renderInline(node, i))}
    </p>
  )
}

const DEFAULT_PARAGRAPH_CLASSNAME = 'font-body text-[0.95rem] leading-[1.7] text-ink-soft'

export function renderRichText(
  doc: RichTextRoot,
  options?: { paragraphClassName?: (index: number) => string },
): ReactNode {
  const paragraphClassName = options?.paragraphClassName ?? (() => DEFAULT_PARAGRAPH_CLASSNAME)
  return doc.root.children.map((paragraph, i) => renderParagraph(paragraph, i, paragraphClassName))
}
