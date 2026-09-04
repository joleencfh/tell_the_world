import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import {
  RICH_TEXT_BOLD_FORMAT,
  type RichTextBlockNode,
  type RichTextHeadingLevel,
  type RichTextInlineNode,
  type RichTextParagraphNode,
  type RichTextRoot,
  type RichTextTextNode,
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

function renderTextNode(node: RichTextTextNode, key: string | number): ReactNode {
  const isBold = ((node.format ?? 0) & RICH_TEXT_BOLD_FORMAT) !== 0
  return isBold ? <strong key={key}>{node.text}</strong> : <Fragment key={key}>{node.text}</Fragment>
}

// Renders one text-token's slice of a keyterm-tokenized run, re-splitting it
// against the original per-node boundaries so bold formatting on either side
// of a keyterm (or split mid-run by something else entirely, e.g. Grammarly
// or another extension silently applying its own formatting) survives —
// see renderTextRunWithKeyterms below for why this reconstruction exists.
function pushTextSlice(
  output: ReactNode[],
  fullText: string,
  start: number,
  end: number,
  boundaries: { start: number; end: number; format?: number }[],
  keyPrefix: string,
) {
  let i = 0
  for (const b of boundaries) {
    const segStart = Math.max(start, b.start)
    const segEnd = Math.min(end, b.end)
    if (segStart >= segEnd) continue
    const segText = fullText.slice(segStart, segEnd)
    const isBold = ((b.format ?? 0) & RICH_TEXT_BOLD_FORMAT) !== 0
    output.push(isBold ? <strong key={`${keyPrefix}-${i}`}>{segText}</strong> : <Fragment key={`${keyPrefix}-${i}`}>{segText}</Fragment>)
    i += 1
  }
}

// {{term|definition}} can land split across sibling Lexical text nodes even
// though the author typed it as one continuous run — Lexical gives every
// contiguous span of *uniform* formatting its own text node, so anything
// that nudges formatting mid-span (selecting just the definition and
// bolding it, a spellcheck/grammar extension applying its own highlight)
// splits `{{term|` into one node and `definition}}` into the next. Matching
// per node (as this used to) then sees neither half's `{{`/`}}` and falls
// through to literal text. Fixed by tokenizing the *concatenated* text of a
// run of sibling text nodes, then re-slicing each resulting text token back
// against the original node boundaries so per-node bold formatting is still
// respected outside the keyterm span itself.
function renderTextRunWithKeyterms(run: RichTextTextNode[], keyPrefix: string, keyterms: KeytermState): ReactNode[] {
  const fullText = run.map((n) => n.text).join('')
  const tokens = tokenizeKeyterms(fullText)
  if (tokens.length === 1 && tokens[0].type === 'text') {
    return run.map((n, i) => renderTextNode(n, `${keyPrefix}-${i}`))
  }

  let offset = 0
  const boundaries = run.map((n) => {
    const start = offset
    offset += n.text.length
    return { start, end: offset, format: n.format }
  })

  const output: ReactNode[] = []
  tokens.forEach((token, i) => {
    if (token.type === 'keyterm') {
      output.push(
        <Keyterm
          key={`${keyPrefix}-kt${i}`}
          term={token.text}
          definition={token.definition ?? ''}
          id={`${keyterms.sectionId}-kt${keyterms.counter.n++}`}
        />,
      )
    } else {
      pushTextSlice(output, fullText, token.start, token.end, boundaries, `${keyPrefix}-t${i}`)
    }
  })
  return output
}

function renderInline(node: RichTextInlineNode, key: number, keyterms: KeytermState | null): ReactNode {
  if (node.type === 'linebreak') return <br key={key} />

  if (node.type === 'text') return renderTextNode(node, key)

  // node.type === 'link'
  const linkClassName =
    'text-blue-ink underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-blue'
  const children = renderInlineList(node.children, `${key}`, keyterms)

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

// Walks a sibling inline-node list, grouping consecutive 'text' nodes into
// runs so keyterm matching sees each run's full concatenated text rather
// than one node at a time (see renderTextRunWithKeyterms). A link or
// linebreak ends a run — a keyterm isn't expected to span into/out of a
// link, same as before this fix.
function renderInlineList(nodes: RichTextInlineNode[], keyPrefix: string, keyterms: KeytermState | null): ReactNode[] {
  const output: ReactNode[] = []
  let i = 0
  while (i < nodes.length) {
    const node = nodes[i]
    if (node.type !== 'text' || !keyterms) {
      output.push(renderInline(node, i, keyterms))
      i += 1
      continue
    }
    const runStart = i
    const run: RichTextTextNode[] = []
    while (i < nodes.length && nodes[i].type === 'text') {
      run.push(nodes[i] as RichTextTextNode)
      i += 1
    }
    output.push(...renderTextRunWithKeyterms(run, `${keyPrefix}-${runStart}`, keyterms))
  }
  return output
}

// Renders a bare inline-node list with no block wrapper (no keyterms — no
// caller needs them yet) — the TL;DR rich-text path (section-content.tsx's
// TLDRList) needs each bullet's inline content without the <p> renderParagraph
// wraps it in, since the bullet's own markup wraps it instead.
export function renderRichTextInline(nodes: RichTextInlineNode[]): ReactNode {
  return renderInlineList(nodes, 'i', null)
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
      {renderInlineList(paragraph.children, 'p', keyterms)}
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
        {renderInlineList(node.children, 'h', keyterms)}
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
