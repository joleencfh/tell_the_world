export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center px-4 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border-b-2 -mb-px transition-colors',
        active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-soft hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
