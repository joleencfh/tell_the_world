import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// The reference artifact's --font-display/--font-body both resolve to the
// system UI font stack ("Segoe UI" > Helvetica Neue > Arial), not a webfont
// — see globals.css. Only the mono face is an actual loaded font.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  return (
    <html lang="en">
      <body
        className={`${plexMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
