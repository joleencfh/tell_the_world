import { GLOSSARY } from './glossary'

// Deterministic glossary-match clarity check. Pure function — no
// server/client-only imports — so it's usable from both 'use server'
// actions (authoritative) and 'use client' components (the fix-it-loop UI
// in useClarityGate.ts). Readability scoring was considered and dropped for
// v1: a hand-rolled syllable-count heuristic would be noisy, and nothing
// here is meant to gate on anything but an actual glossary match.

export interface FlaggedTerm {
  id: string
  label: string
  matchedText: string
  explanation: string
  suggestion?: string
}

export interface ClarityCheckResult {
  flaggedTerms: FlaggedTerm[]
  isClean: boolean
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Not \b — \b only fires at a word-char/non-word-char transition, which
// mishandles a pattern whose own edge is punctuation (e.g. "p(doom)" ends
// in ")"). This instead checks the character immediately outside the match
// isn't itself alphanumeric, regardless of the pattern's own edge chars.
function boundaryRegex(pattern: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9_])${escapeRegex(pattern)}(?![A-Za-z0-9_])`, 'i')
}

export function checkClarity(text: string): ClarityCheckResult {
  const flaggedTerms: FlaggedTerm[] = []
  for (const term of GLOSSARY) {
    for (const pattern of term.patterns) {
      const match = boundaryRegex(pattern).exec(text)
      if (match) {
        flaggedTerms.push({
          id: term.id,
          label: term.label,
          matchedText: match[0],
          explanation: term.explanation,
          suggestion: term.suggestion,
        })
        break // one hit per term is enough to flag it
      }
    }
  }
  return { flaggedTerms, isClean: flaggedTerms.length === 0 }
}
