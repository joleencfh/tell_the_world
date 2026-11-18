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
      aria-current={active ? 'page' : undefined}
      className={[
        'flex min-h-11 items-center whitespace-nowrap px-4 font-ui text-ui-sm border-b-2 -mb-px transition-colors focus-ring',
        active
          ? 'border-umber text-umber font-semibold'
          : 'border-transparent text-umber-soft hover:text-umber',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
