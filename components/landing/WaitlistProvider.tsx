'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import WaitlistModal from '@/components/landing/WaitlistModal'
import type { UserRole } from '@/lib/types'

type ModalMode = 'waitlist' | 'early-tester'

interface WaitlistContextValue {
  openWaitlist: (role: UserRole) => void
  openEarlyTester: () => void
}

const WaitlistContext = createContext<WaitlistContextValue | null>(null)

export function useWaitlist() {
  const ctx = useContext(WaitlistContext)
  if (!ctx) throw new Error('useWaitlist must be used inside <WaitlistProvider>')
  return ctx
}

// Owns the one piece of landing-page state that needs the client (which
// waitlist modal is open), so the page itself can stay a server component.
// Making the page behind inert and returning focus to whatever opened the
// modal are the shared Modal's job (components/ui/Modal.tsx).
export default function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [role, setRole] = useState<UserRole>('creator')

  const openWaitlist = useCallback((r: UserRole) => {
    setRole(r)
    setModalMode('waitlist')
  }, [])

  const openEarlyTester = useCallback(() => {
    setModalMode('early-tester')
  }, [])

  const close = useCallback(() => setModalMode(null), [])

  const value = useMemo(() => ({ openWaitlist, openEarlyTester }), [openWaitlist, openEarlyTester])

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      {modalMode && (
        <WaitlistModal
          mode={modalMode}
          onClose={close}
          defaultRole={modalMode === 'waitlist' ? role : undefined}
        />
      )}
    </WaitlistContext.Provider>
  )
}
