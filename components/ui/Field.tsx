import { useId, type InputHTMLAttributes, type Ref, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from './cn'
import { Icon } from './icons'

// Field set (design-system.md 3.2): label above, optional hint, the control,
// optional error. Required fields are unmarked; optional ones say "(Optional)"
// (no red asterisks). Errors are linked with aria-describedby and announced.

/** The control recipe. Error state is driven by aria-invalid, not a prop. */
export const CONTROL =
  'w-full min-h-11 rounded-control border border-field-line bg-white px-3 py-2.5 font-ui text-base text-umber placeholder:text-umber-soft hover:border-umber-soft focus-visible:border-umber focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-umber disabled:border-disabled disabled:bg-disabled disabled:text-umber-soft aria-[invalid=true]:border-2 aria-[invalid=true]:border-brick aria-[invalid=true]:px-[11px] aria-[invalid=true]:py-[9px]'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

/**
 * Wraps one control with its label, hint and error. The control is a render
 * prop so the ids and aria attributes always line up:
 *
 *   <Field label="Email" error={err}>{(p) => <TextInput type="email" {...p} />}</Field>
 */
export default function Field({
  id: idProp,
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  /** Fixed control id, for a control something else has to scroll to or focus. Defaults to a generated one. */
  id?: string
  label: string
  hint?: React.ReactNode
  /** Message text. Presence marks the control invalid. */
  error?: React.ReactNode
  optional?: boolean
  className?: string
  children: (props: FieldControlProps) => React.ReactNode
}) {
  const uid = useId()
  const id = idProp ?? `${uid}-control`
  const hintId = `${uid}-hint`
  const errorId = `${uid}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-ui text-caption font-medium text-umber">
        {label}
        {optional && <span className="font-normal text-umber-soft"> (Optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="mt-1 font-ui text-caption text-umber-soft">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

/** Icon + words, never colour alone. Announced when it appears. */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 font-ui text-caption text-brick">
      <Icon name="alert" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function TextInput({
  className,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} type="text" className={cn(CONTROL, className)} {...rest} />
}

export function SearchInput({
  className,
  ref,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-umber-soft" />
      <input ref={ref} type="search" className={cn(CONTROL, 'pl-9 aria-[invalid=true]:pl-[35px]', className)} {...rest} />
    </div>
  )
}

export function Textarea({
  className,
  ref,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(CONTROL, 'resize-y', className)} {...rest} />
}

export function Select({
  className,
  children,
  ref,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(CONTROL, 'appearance-none pr-9 aria-[invalid=true]:pr-[35px]', className)} {...rest}>
        {children}
      </select>
      <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-umber-soft" />
    </div>
  )
}
