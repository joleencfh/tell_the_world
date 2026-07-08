"use client";

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

export function inputClass(hasError: boolean) {
  return [
    "w-full border bg-card px-4 py-3 font-serif text-sm text-text",
    "focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50",
    "transition-colors placeholder:text-soft/50",
    hasError ? "border-red-400" : "border-edge",
  ].join(" ");
}

export function TextInput({
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  autoComplete,
  min,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError: boolean;
  autoComplete?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      min={min}
      className={inputClass(hasError)}
    />
  );
}

export function TextareaInput({
  value,
  onChange,
  placeholder,
  rows,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows: number;
  hasError: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputClass(hasError)} resize-y`}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  hasError,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass(hasError)} cursor-pointer`}
    >
      {children}
    </select>
  );
}

export function FormSection({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-10">
      <legend className="font-mono text-[9px] tracking-[0.22em] uppercase text-soft border-b border-edge pb-2 mb-6 w-full">
        {legend}
      </legend>
      <div className="flex flex-col gap-5">{children}</div>
    </fieldset>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  fieldId,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldId?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={fieldId}
      className="flex flex-col gap-1.5"
      data-field-error={error ? true : undefined}
    >
      <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft">
        {label}
        {required && (
          <span className="text-live ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {hint && (
        <p className="font-serif text-xs text-soft/80 leading-relaxed -mt-0.5 mb-0.5">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="font-mono text-[10px] text-red-600 mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
