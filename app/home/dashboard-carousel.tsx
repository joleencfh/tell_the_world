'use client'

import type { ReactNode } from 'react'
import { Carousel } from '@/components/ui/Carousel'

// app/home/page.tsx is a Server Component; every other consumer of the
// Carousel compound object (quotes.tsx, coverage.tsx, ctas.tsx,
// related-briefs.tsx) is itself a 'use client' file, so this is the first
// place it's reached across the RSC boundary. React only proxies a client
// module's top-level exports, not property access on them (`Carousel.
// Provider`) from a genuine Server Component — that resolved to undefined
// and crashed with "Element type is invalid". This thin wrapper owns the
// client boundary instead, taking the server-rendered cards as children.
export default function DashboardCarousel({
  fadeColor,
  ariaLabel,
  children,
}: {
  fadeColor: string
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor={fadeColor} ariaLabel={ariaLabel}>
        {children}
      </Carousel.Track>
    </Carousel.Provider>
  )
}
