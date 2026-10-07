// The page's one status line: the product is not open yet. A plain chip in the
// UI face, not a label above a heading. The header shows it from md up; below
// md there is no room next to the logo, so the hero shows it instead.
export default function StatusChip({ className = '' }: { className?: string }) {
  return (
    <span className={`items-center rounded-control bg-bone px-2.5 py-1 font-ui text-ui-sm text-umber-soft ${className}`}>
      Opening soon
    </span>
  )
}
