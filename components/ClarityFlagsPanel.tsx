import type { FlaggedTerm } from '@/lib/clarity/check'

// Shared between PostModal.tsx (plain rounded/gray-600 UI) and
// app/briefs/[slug]/quote-modals.tsx's AddQuoteModal (the "ink/paper"
// design system used sitewide on brief pages) — the two surfaces don't
// share a visual language, so this takes a `variant` rather than forcing
// one style onto both. Purely presentational: no submit button of its own,
// callers decide what "Review flags" / "submit anyway" does.

export function ClarityFlagsPanel({
  flaggedTerms,
  variant = 'default',
}: {
  flaggedTerms: FlaggedTerm[]
  variant?: 'default' | 'ink'
}) {
  if (flaggedTerms.length === 0) return null

  if (variant === 'ink') {
    return (
      <div className="space-y-3 border-l-[3px] border-pink-ink bg-paper-sunken-blue p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pink-ink">
          {flaggedTerms.length === 1 ? '1 term flagged' : `${flaggedTerms.length} terms flagged`}
        </p>
        <ul className="space-y-2.5">
          {flaggedTerms.map((term) => (
            <li key={term.id} className="font-body text-xs leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">&ldquo;{term.matchedText}&rdquo;</span> — {term.explanation}
              {term.suggestion && (
                <span className="block mt-0.5 text-ink-faint">Try: {term.suggestion}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
      <p className="text-xs font-medium text-amber-800">
        {flaggedTerms.length === 1 ? '1 term flagged' : `${flaggedTerms.length} terms flagged`} — a non-technical
        reader may not know these:
      </p>
      <ul className="space-y-1.5">
        {flaggedTerms.map((term) => (
          <li key={term.id} className="text-xs leading-relaxed text-amber-900">
            <span className="font-semibold">&ldquo;{term.matchedText}&rdquo;</span> — {term.explanation}
            {term.suggestion && <span className="block text-amber-700">Try: {term.suggestion}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
