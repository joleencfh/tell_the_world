import { EB_Garamond, Inter } from 'next/font/google'

// The landing page's two typefaces (docs/design/landing-page/design-system.md)
// are loaded here, in the route group's own layout, so no other route pays
// for them. The CSS variables feed --font-serif / --font-ui in
// app/landing-theme.css. IBM Plex Mono (the mono face) is the app's existing
// font from the root layout and is not loaded again.
const garamond = EB_Garamond({
  variable: '--font-eb-garamond',
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`landing-root ${garamond.variable} ${inter.variable} font-ui`}>{children}</div>
}
