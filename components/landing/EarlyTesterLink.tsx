'use client'

import { useWaitlist } from '@/components/landing/WaitlistProvider'

// An inline text link (design-system.md, Text link) that opens the same
// waitlist modal at its early-tester intro step. It sits inside a sentence, so
// its box is one line tall; the ::after layer extends the tap area 12px above
// and below the text to reach 44px without changing the line spacing.
export default function EarlyTesterLink() {
  const { openEarlyTester } = useWaitlist()
  return (
    <button
      type="button"
      onClick={openEarlyTester}
      className="relative underline decoration-1 underline-offset-[5px] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
    >
      Become an early tester
    </button>
  )
}
