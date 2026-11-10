'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadAvatar, removeAvatar } from './actions'
import Alert from '@/components/ui/Alert'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import RoleLabel from '@/components/ui/RoleLabel'
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
  const [confirmOpen, setConfirmOpen] = useState(false)
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
      setConfirmOpen(false)
      if (result.error) {
        setError(result.error)
        return
      }
      onAvatarChange(null)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={displayName} avatarUrl={avatarUrl} role={role} size="2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate font-ui text-ui font-semibold text-umber">{displayName}</p>
            <RoleLabel role={role} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              small
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              Change photo
            </Button>
            {avatarUrl && (
              <Button type="button" variant="ghost" small onClick={() => setConfirmOpen(true)} disabled={isPending}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Choose a photo"
        />
      </div>
      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Remove profile photo"
        confirmLabel="Remove photo"
        pending={isPending}
        onConfirm={handleRemove}
        onCancel={() => setConfirmOpen(false)}
      >
        Your photo will be removed and your initial shown instead.
      </ConfirmDialog>
    </div>
  )
}
