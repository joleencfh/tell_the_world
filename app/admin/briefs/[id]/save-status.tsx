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
        <p className="font-mono text-[10px] text-red-600">{saveError}</p>
      )}
      {saved && (
        <p className="font-mono text-[10px] text-green-700">Saved.</p>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
