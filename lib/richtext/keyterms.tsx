// Keyterm tooltips — authoring convention: {{term|definition}} inline in
// explainer text, pattern-matched the same way parseFAQ parses structured
// text out of a single content field (two-ink-bold-plan.md §3 Part 3 step 4).
// Shared between the legacy plain-text Explainer path (explainer.tsx, which
// tokenizes a whole paragraph's raw string) and the rich-text renderer
// (render.tsx, which tokenizes per run of sibling text nodes — 2026-09-03
// fix, see renderTextRunWithKeyterms). No editor support needed for the
// rich-text side: an author just types the same {{term|definition}}
// literally into a paragraph/heading, same as before.

export interface ExplainerToken {
  type: 'text' | 'keyterm'
  text: string
  definition?: string
  // Exact (untrimmed) span this token consumed from the source string — a
  // 'text' token's start/end always equal its own text.length, but a
  // 'keyterm' token's matched span ({{term|definition}}, brackets and pipe
  // included) is longer than `text`/`definition` since those are trimmed.
  // Needed by render.tsx to re-align formatting when a keyterm has been
  // split across multiple sibling Lexical text nodes (see
  // renderTextRunWithKeyterms) — plain string callers can ignore these.
  start: number
  end: number
}

const KEYTERM_PATTERN = /\{\{(.+?)\|(.+?)\}\}/g

export function tokenizeKeyterms(text: string): ExplainerToken[] {
  const tokens: ExplainerToken[] = []
  let lastIndex = 0
  for (const match of text.matchAll(KEYTERM_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) tokens.push({ type: 'text', text: text.slice(lastIndex, index), start: lastIndex, end: index })
    const end = index + match[0].length
    tokens.push({ type: 'keyterm', text: match[1].trim(), definition: match[2].trim(), start: index, end })
    lastIndex = end
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', text: text.slice(lastIndex), start: lastIndex, end: text.length })
  return tokens
}

// CSS-only hover/focus reveal (group-hover/group-focus-within), keyboard
// reachable via the term's own tabIndex — but the tooltip's text also needs
// to reach assistive tech, not just sighted hover/focus users, hence
// aria-describedby rather than relying on the visual reveal alone (§1.4).
export function Keyterm({ term, definition, id }: { term: string; definition: string; id: string }) {
  return (
    <span className="group relative" style={{ touchAction: 'manipulation' }}>
      <span
        tabIndex={0}
        aria-describedby={id}
        className="cursor-help border-b-2 border-blue font-semibold not-italic text-blue-ink outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        {term}
      </span>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded bg-ink px-3 py-2 text-left font-body text-xs font-normal not-italic leading-snug text-paper opacity-0 shadow-lg transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {definition}
      </span>
    </span>
  )
}
