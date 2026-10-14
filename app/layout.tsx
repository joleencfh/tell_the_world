import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// The reference artifact's --font-display/--font-body both resolve to the
// system UI font stack ("Segoe UI" > Helvetica Neue > Arial), not a webfont
// — see globals.css. Only the mono face is loaded from Google Fonts.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// The design system's two typefaces (docs/design/design-system/design-system.md,
// 2.2), self-hosted so a failed Google Fonts download can never break the
// build (it failed a Vercel deploy on 2026-10-06). Latin subset, variable
// files from @fontsource-variable/eb-garamond and @fontsource-variable/inter.
// Both fonts are licensed under the SIL Open Font License 1.1. The CSS
// variables feed --font-serif / --font-ui in app/app-theme.css.
const garamond = localFont({
  variable: "--font-eb-garamond",
  src: [
    { path: "./fonts/eb-garamond-latin-wght-normal.woff2", weight: "400 800", style: "normal" },
    { path: "./fonts/eb-garamond-latin-wght-italic.woff2", weight: "400 800", style: "italic" },
  ],
  display: "swap",
});

const inter = localFont({
  variable: "--font-inter",
  src: [{ path: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tell The World",
  description: "Where AI safety expertise meets independent media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The font variables are registered on <body> but the body's own font and
  // background are unchanged: unmigrated screens must look as they do today.
  // Each migrated page sets its own `bg-parchment text-umber font-ui`.
  //
  // #app-root is what the shared Modal makes inert while it is open. Toasts
  // live outside it so they stay reachable.
  return (
    <html lang="en">
      <body
        className={`${plexMono.variable} ${garamond.variable} ${inter.variable} font-body antialiased`}
      >
        <ToastProvider>
          <div id="app-root">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
