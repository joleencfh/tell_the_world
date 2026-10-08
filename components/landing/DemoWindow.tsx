'use client'

interface DemoWindowProps {
  /** Centred title in the window chrome. */
  title: string
  /** Describes the whole example once, to assistive technology. */
  ariaLabel: string
  paused: boolean
  onTogglePause: () => void
  children: React.ReactNode
}

// design-system.md, Framed window: the artifact frame both demos live in.
// The window is announced once through its aria-label; its animated interior
// is aria-hidden and not focusable, so a screen reader or keyboard user never
// lands on a control that does nothing. The Pause button is the only
// interactive part and sits outside the hidden subtree.
export default function DemoWindow({ title, ariaLabel, paused, onTogglePause, children }: DemoWindowProps) {
  return (
    <div>
      <div role="group" aria-label={ariaLabel} className="overflow-hidden rounded-control bg-vellum shadow-window">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-window-line py-1.5 pl-3.5 pr-2 md:pl-4 md:pr-3">
          <div aria-hidden className="truncate text-left text-ui-sm text-umber-soft">
            {title}
          </div>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={paused ? 'Play the animated example' : 'Pause the animated example'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control border border-field-line px-2.5 font-mono text-label uppercase text-umber transition-colors duration-150 ease-standard hover:bg-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber md:min-h-8"
          >
            {paused ? (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                <path d="M0 0L10 6L0 12Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                <rect width="3.5" height="12" fill="currentColor" />
                <rect x="6.5" width="3.5" height="12" fill="currentColor" />
              </svg>
            )}
            <span className="hidden md:inline">{paused ? 'Play' : 'Pause'}</span>
          </button>
        </div>
        <div aria-hidden="true">{children}</div>
      </div>
      <p className="mt-3 text-right text-ui-sm text-umber-soft">Illustrative example, sample content</p>
    </div>
  )
}

/** Fade + rise used for every beat that appears (design-system.md, Motion). */
export function reveal(show: boolean) {
  return `transition-[opacity,transform] duration-[600ms] ease-standard motion-reduce:transition-none ${
    show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
  }`
}

/**
 * Role label (design-system.md, Role label): a short mono label in a thin
 * border, rose for creators and cobalt for the expert side. The border is the
 * role colour at 40%, so it reads as a label and not as a button.
 */
export function RoleTag({ tone, children }: { tone: 'rose' | 'cobalt'; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-tag border px-1.5 py-px font-mono text-label uppercase ${
        tone === 'rose' ? 'border-rose/40 text-rose' : 'border-cobalt/40 text-cobalt'
      }`}
    >
      {children}
    </span>
  )
}

/**
 * Author block (design-system.md, Author): a filled initial, then the name in
 * bold with the role label beside it, and the affiliation on its own line
 * underneath. Name, role and affiliation each have their own place, so none
 * can be mistaken for another. Rose = creator, cobalt = expert, a square
 * cobalt-deep initial = organisation.
 */
export function Author({
  name,
  role,
  credential,
  shape = 'person',
  size = 'md',
}: {
  name: string
  role: string
  credential: string
  shape?: 'person' | 'organisation'
  size?: 'md' | 'sm'
}) {
  const creator = role === 'Creator'
  const tone = creator ? 'rose' : 'cobalt'
  const avatar =
    shape === 'organisation' ? 'rounded-control bg-cobalt-deep' : creator ? 'rounded-full bg-rose-deep' : 'rounded-full bg-cobalt'
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center font-ui font-semibold text-white ${avatar} ${size === 'sm' ? 'size-7 text-ui-sm' : 'size-9 text-[15px]'}`}
      >
        {name.charAt(0)}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b className="font-ui text-[0.9375rem] font-semibold leading-tight text-umber">{name}</b>
          <RoleTag tone={tone}>{role}</RoleTag>
        </div>
        <div className="mt-0.5 text-ui-sm leading-snug text-umber-soft">{credential}</div>
      </div>
    </div>
  )
}
