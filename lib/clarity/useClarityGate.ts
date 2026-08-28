'use client'

import { useEffect, useRef, useState } from 'react'
import { checkClarity, type FlaggedTerm } from './check'

export type ClarityGateStatus = 'clean' | 'flagged'

export interface ClarityGate {
  flaggedTerms: FlaggedTerm[]
  status: ClarityGateStatus
  /** true once the author has explicitly chosen "submit anyway" with flags still present */
  confirmedAnyway: boolean
  confirmAnyway: () => void
}

// Debounced (400ms), full-text re-check on every change — never
// incremental, since editing could introduce new jargon anywhere in the
// text, not just near what was previously flagged. `enabled` gates the
// whole feature off for roles the clarity check doesn't apply to
// (creator/journalist/admin) — when false this always reports 'clean' with
// no flags, so callers don't need a separate branch for "not gated."
export function useClarityGate(text: string, enabled: boolean): ClarityGate {
  const [flaggedTerms, setFlaggedTerms] = useState<FlaggedTerm[]>([])
  const [confirmedAnyway, setConfirmedAnyway] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Both branches set state from inside the timeout callback, not
    // synchronously in the effect body (react-hooks/set-state-in-effect) —
    // the disabled branch still defers via a 0ms timeout rather than
    // calling setState directly here.
    debounceRef.current = setTimeout(
      () => {
        setFlaggedTerms(enabled ? checkClarity(text).flaggedTerms : [])
        setConfirmedAnyway(false) // any re-check invalidates a prior "submit anyway"
      },
      enabled ? 400 : 0,
    )
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text, enabled])

  return {
    flaggedTerms,
    status: flaggedTerms.length === 0 ? 'clean' : 'flagged',
    confirmedAnyway,
    confirmAnyway: () => setConfirmedAnyway(true),
  }
}
