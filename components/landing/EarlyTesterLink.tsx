'use client'

import { useWaitlist } from '@/components/landing/WaitlistProvider'

// An inline text link (design-system.md, Text link) that opens the same
// waitlist modal at its early-tester intro step.
export default function EarlyTesterLink() {
  const { openEarlyTester } = useWaitlist()
  return (
    <button
      type="button"
      onClick={openEarlyTester}
      className="underline decoration-1 underline-offset-[5px] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber"
    >
      Become an early tester
    </button>
  )
}
