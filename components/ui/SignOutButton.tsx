'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

const DEFAULT_CLASSES =
  'inline-flex min-h-11 items-center rounded-control px-2.5 font-ui text-ui-sm text-umber-soft hover:text-umber hover:underline hover:underline-offset-[3px] focus-ring'

interface SignOutButtonProps {
  className?: string
}

// Shared sign-out behaviour: the server action, then back to the login page.
export function useSignOut() {
  const router = useRouter()
  return async function handleSignOut() {
    await signOut()
    router.push('/login')
  }
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const handleSignOut = useSignOut()

  return (
    <button onClick={handleSignOut} className={className ?? DEFAULT_CLASSES}>
      Sign out
    </button>
  )
}
