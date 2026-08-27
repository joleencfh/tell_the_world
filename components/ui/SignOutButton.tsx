'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

interface SignOutButtonProps {
  className?: string
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <button onClick={handleSignOut} className={className}>
      Sign out
    </button>
  )
}
