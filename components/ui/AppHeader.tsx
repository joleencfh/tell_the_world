'use client'

import Link from 'next/link'
import type { UserRole } from '@/lib/types'
import Avatar from './Avatar'
import { cn } from './cn'
import Logo from './Logo'
import Menu from './Menu'
import { useSignOut } from './SignOutButton'

// The signed-in app header (design-system.md 3.3 and 3.4): logo to /home, the
// primary text links, and the member's avatar as an account menu. Parchment,
// 1px rule underneath, sticky, no uppercase mono links. The public pages use
// SiteHeader instead.

export type AppHeaderPage = 'home' | 'directory' | 'briefs' | 'profile'

export interface AppHeaderUser {
  id: string
  name: string
  avatarUrl: string | null
  role?: UserRole
}

const LINKS: { page: AppHeaderPage; href: string; label: string }[] = [
  { page: 'home', href: '/home', label: 'Home' },
  { page: 'directory', href: '/directory', label: 'Directory' },
  { page: 'briefs', href: '/briefs', label: 'Briefs' },
]

export default function AppHeader({
  user,
  current,
}: {
  /** The signed-in member. Null hides the account menu. */
  user: AppHeaderUser | null
  /** Which page this is, for aria-current. */
  current?: AppHeaderPage
}) {
  const signOut = useSignOut()

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-parchment">
      <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-2 md:px-gutter md:py-3">
        <Logo href="/home" />
        <div className="flex items-center gap-1 md:gap-2">
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => {
              const active = current === link.page
              return (
                <Link
                  key={link.page}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-control px-2.5 font-ui text-ui-sm hover:text-umber hover:underline hover:underline-offset-[3px] focus-ring',
                    active ? 'text-umber underline underline-offset-[3px]' : 'text-umber-soft',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          {user && (
            <Menu
              label="Account menu"
              trigger={<Avatar name={user.name} avatarUrl={user.avatarUrl} role={user.role} size="xs" />}
              items={[
                { label: 'Profile', href: `/profile/${user.id}` },
                { label: 'Sign out', onSelect: signOut },
              ]}
            />
          )}
        </div>
      </div>
    </header>
  )
}
