'use client'

import { useWaitlist } from '@/components/landing/WaitlistProvider'
import type { UserRole } from '@/lib/types'

type Variant = 'primary' | 'rose' | 'cobalt'

// design-system.md, Button: primary (umber), rose (creators), cobalt
// (researchers). One action everywhere: join the waitlist.
const VARIANT: Record<Variant, string> = {
  primary: 'bg-umber text-parchment hover:bg-umber-hover',
  rose: 'bg-rose text-white hover:bg-rose-deep',
  cobalt: 'bg-cobalt text-white hover:bg-cobalt-deep',
}

interface WaitlistButtonProps {
  /** Role pre-selected in the form (creator unless this is the experts card). */
  role?: UserRole
  variant?: Variant
  /** 'sm' is the 36px header button for a pointer; it is 44px on any touch screen and below md. */
  size?: 'md' | 'sm'
  className?: string
}

export default function WaitlistButton({ role = 'creator', variant = 'primary', size = 'md', className = '' }: WaitlistButtonProps) {
  const { openWaitlist } = useWaitlist()
  const sizing = size === 'sm' ? 'min-h-11 px-1.5 text-ui-sm min-[375px]:px-2 md:min-h-9 md:px-3.5 pointer-coarse:md:min-h-11' : 'min-h-11 px-[22px] text-ui'
  return (
    <button
      type="button"
      onClick={() => openWaitlist(role)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-control border-2 border-transparent font-ui font-medium leading-none transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber ${sizing} ${VARIANT[variant]} ${className}`}
    >
      Join the waitlist
    </button>
  )
}
