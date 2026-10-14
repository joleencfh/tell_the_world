import { cn } from './cn'

// Form section (design-system.md 3.2): a fieldset whose legend is a mono
// label with a hairline under it, 24px between fields.
export default function FormSection({
  legend,
  children,
  className,
}: {
  legend: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="w-full border-b border-rule pb-2 font-mono text-label uppercase text-umber-soft">
        {legend}
      </legend>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </fieldset>
  )
}
