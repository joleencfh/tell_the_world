import type { UserRole } from '@/lib/types'
import { cn } from './cn'
import Avatar, { type AvatarSize } from './Avatar'
import RoleLabel from './RoleLabel'

// Author (design-system.md 3.4), the most important small component. Every
// person or organisation named anywhere uses it. Three parts, each in its own
// place so none can be mistaken for another:
//   1. a filled initial (or the photo),
//   2. the name in Inter 600 with the role label beside it,
//   3. the affiliation on its own line underneath.

export default function Author({
  name,
  role,
  affiliation,
  avatarUrl = null,
  size = 'md',
  className,
}: {
  name: string
  role?: UserRole
  affiliation?: string | null
  avatarUrl?: string | null
  size?: AvatarSize
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Avatar name={name} avatarUrl={avatarUrl} role={role} size={size} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-ui text-[0.9375rem] font-semibold leading-tight text-umber">{name}</span>
          {role && <RoleLabel role={role} />}
        </div>
        {affiliation && <p className="mt-0.5 font-ui text-caption text-umber-soft">{affiliation}</p>}
      </div>
    </div>
  )
}
