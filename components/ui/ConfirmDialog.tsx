'use client'

import Button from './Button'
import Modal from './Modal'

// Confirm dialog (design-system.md 3.7). A small modal with a plain-language
// question, what happens, and two buttons: the safe one first, the action
// second. The action label repeats the action ("Delete brief"), never "OK".
// Name the object in the title.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  pending,
  onConfirm,
  onCancel,
  onExited,
}: {
  open: boolean
  title: string
  /** What happens, in a sentence or two. */
  children: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  /** Shows the pending look on the action while it runs. */
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
  onExited?: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} onExited={onExited} title={title} size="narrow" dismissible={!pending}>
      <p className="font-ui text-ui text-umber-soft">{children}</p>
      <div className="mt-6 flex flex-col gap-2 md:flex-row md:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} pending={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
