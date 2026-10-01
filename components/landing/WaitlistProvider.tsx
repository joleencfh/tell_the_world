'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
// While the modal is open the page behind it is `inert`: it can't be tabbed
// into, clicked, or read by a screen reader, which is what makes the dialog
// genuinely modal. Focus goes back to whatever opened the modal when it
// closes.
export default function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [role, setRole] = useState<UserRole>('creator')
  const trigger = useRef<HTMLElement | null>(null)
  const restoreFocus = useRef(false)

  const remember = () => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }

  const openWaitlist = useCallback((r: UserRole) => {
    remember()
    setRole(r)
    setModalMode('waitlist')
  }, [])

  const openEarlyTester = useCallback(() => {
    remember()
    setModalMode('early-tester')
  }, [])

  const close = useCallback(() => {
    restoreFocus.current = true
    setModalMode(null)
  }, [])

  // The page is inert until the render that closes the modal commits, so
  // focus goes back to the trigger from an effect, not straight from close().
  useEffect(() => {
    if (modalMode === null && restoreFocus.current) {
      restoreFocus.current = false
      trigger.current?.focus()
    }
  }, [modalMode])

  const value = useMemo(() => ({ openWaitlist, openEarlyTester }), [openWaitlist, openEarlyTester])

  return (
    <WaitlistContext.Provider value={value}>
      <div inert={modalMode !== null}>{children}</div>
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
