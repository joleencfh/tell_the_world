// The landing page's fonts (EB Garamond, Inter) are loaded once for every
// route in the root layout; this wrapper only scopes the landing-only base
// styles in app/app-theme.css (.landing-root) and sets the UI face.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="landing-root font-ui">{children}</div>
}
