import Button from '@/components/ui/Button'

// Save button + inline status — identical at the top and bottom of the
// edit screen, extracted so the two call sites can't drift.
export function SaveStatus({
  saving,
  saveError,
  saved,
  onSave,
}: {
  saving: boolean
  saveError: string | null
  saved: boolean
  onSave: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      {saveError && (
        <p role="alert" className="font-ui text-caption text-brick">{saveError}</p>
      )}
      {saved && (
        <p role="status" className="font-ui text-caption text-moss">Saved.</p>
      )}
      <Button variant="primary" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
