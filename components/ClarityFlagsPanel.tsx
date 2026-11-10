import type { FlaggedTerm } from '@/lib/clarity/check'
import Alert from '@/components/ui/Alert'

// Shared between PostModal.tsx and app/briefs/[slug]/quote-modals.tsx's
// AddQuoteModal. Both now render the same design-system warning Alert; the
// `variant` prop is kept for caller compatibility and only changes the lead-in
// copy. Purely presentational: no submit button of its own, callers decide
// what "Review flags" / "submit anyway" does.

export function ClarityFlagsPanel({
  flaggedTerms,
  variant = 'default',
}: {
  flaggedTerms: FlaggedTerm[]
  variant?: 'default' | 'ink'
}) {
  if (flaggedTerms.length === 0) return null

  const count = flaggedTerms.length === 1 ? '1 term flagged' : `${flaggedTerms.length} terms flagged`

  return (
    <Alert tone="warning" lead={variant === 'ink' ? count : `${count} \u2014`}>
      {variant !== 'ink' && 'a non-technical reader may not know these:'}
      <ul className="mt-2 space-y-2">
        {flaggedTerms.map((term) => (
          <li key={term.id} className="leading-relaxed text-umber-body">
            <span className="font-semibold text-umber">&ldquo;{term.matchedText}&rdquo;</span> — {term.explanation}
            {term.suggestion && <span className="block text-umber-soft">Try: {term.suggestion}</span>}
          </li>
        ))}
      </ul>
    </Alert>
  )
}
