// Icon set for the design system (design-system.md 2.6): 1.5px stroke,
// currentColor, rounded joins, 16 or 20px, never the only carrier of meaning.
// All are decorative (aria-hidden); pair them with words.

import type { SVGProps } from 'react'

export type IconName =
  | 'check'
  | 'x'
  | 'clock'
  | 'info'
  | 'alert'
  | 'warning'
  | 'chevron-down'
  | 'chevron-right'
  | 'search'
  | 'lock'
  | 'video'
  | 'article'
  | 'paper'
  | 'quote'
  | 'link'

const PATHS: Record<IconName, React.ReactNode> = {
  check: <path d="M3.5 8.5l3 3 6-7" />,
  x: <path d="M4 4l8 8M12 4l-8 8" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75V8l2.25 1.5" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 7.25V11M8 5v.01" />
    </>
  ),
  alert: (
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 4.75V8.5M8 11v.01" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.5l6 10.5H2L8 2.5z" />
      <path d="M8 6.75V9.5M8 11.25v.01" />
    </>
  ),
  'chevron-down': <path d="M4 6l4 4 4-4" />,
  'chevron-right': <path d="M6 4l4 4-4 4" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25L13.5 13.5" />
    </>
  ),
  lock: (
    <>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
      <path d="M5.5 7V5.25a2.5 2.5 0 015 0V7" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
      <path d="M6.75 6v4l3.25-2-3.25-2z" />
    </>
  ),
  article: (
    <>
      <rect x="3" y="2.5" width="10" height="11" rx="1" />
      <path d="M5.5 5.75h5M5.5 8h5M5.5 10.25h3" />
    </>
  ),
  paper: (
    <>
      <path d="M4 2.5h5.5L12.5 5.5v8H4v-11z" />
      <path d="M9.5 2.5v3h3M6 8.5h4M6 10.75h4" />
    </>
  ),
  quote: (
    <>
      <path d="M3 11.5V8a3 3 0 013-3M9 11.5V8a3 3 0 013-3" />
      <path d="M3 8h3v3.5H3zM9 8h3v3.5H9z" />
    </>
  ),
  link: (
    <>
      <path d="M6.75 9.25l2.5-2.5" />
      <path d="M7 5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11l-1 1A2.5 2.5 0 014.5 8.5l1-1" />
    </>
  ),
}

export function Icon({
  name,
  size = 16,
  ...rest
}: { name: IconName; size?: 16 | 20 } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
