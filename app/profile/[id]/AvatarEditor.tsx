'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadAvatar, removeAvatar } from './actions'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import type { UserRole } from './page'

interface AvatarEditorProps {
  userId: string
  displayName: string
  role: UserRole
  avatarUrl: string | null
  onAvatarChange: (avatarUrl: string | null) => void
}

export default function AvatarEditor({
  userId,
  displayName,
  role,
  avatarUrl,
  onAvatarChange,
}: AvatarEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadAvatar(userId, fd)
      if (result.error) {
        setError(result.error)
        return
      }
      onAvatarChange(result.avatarUrl ?? null)
      router.refresh()
    })
  }

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await removeAvatar(userId)
      if (result.error) {
        setError(result.error)
        return
      }
      onAvatarChange(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="relative shrink-0">
        <Avatar name={displayName} avatarUrl={avatarUrl} size="xl" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs leading-none hover:bg-blue-700 disabled:opacity-50"
          aria-label="Change photo"
        >
          {isPending ? '…' : '✎'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
          <RoleBadge role={role} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Change photo
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </>
  )
}
