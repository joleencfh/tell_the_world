'use client'

import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

interface CarouselContextValue {
  trackRef: RefObject<HTMLDivElement | null>
  atStart: boolean
  atEnd: boolean
  scroll: (direction: 'prev' | 'next') => void
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarouselContext(caller: string): CarouselContextValue {
  const ctx = use(CarouselContext)
  if (!ctx) throw new Error(`${caller} must be rendered inside <Carousel.Provider>`)
  return ctx
}

function updateEdges(el: HTMLDivElement, setAtStart: (v: boolean) => void, setAtEnd: (v: boolean) => void) {
  setAtStart(el.scrollLeft <= 1)
  setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
}

function CarouselProvider({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onUpdate = () => updateEdges(el, setAtStart, setAtEnd)
    onUpdate()

    el.addEventListener('scroll', onUpdate, { passive: true })
    const resizeObserver = new ResizeObserver(onUpdate)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', onUpdate)
      resizeObserver.disconnect()
    }
  }, [])

  const scroll = (direction: 'prev' | 'next') => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85 * (direction === 'prev' ? -1 : 1)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: amount, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <CarouselContext value={{ trackRef, atStart, atEnd, scroll }}>
      <div className="relative">{children}</div>
    </CarouselContext>
  )
}

function CarouselTrack({
  children,
  fadeColor,
  ariaLabel,
}: {
  children: ReactNode
  fadeColor: string
  ariaLabel?: string
}) {
  const { trackRef, atStart, atEnd } = useCarouselContext('Carousel.Track')

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 transition-opacity duration-200 motion-reduce:transition-none"
        style={{
          background: `linear-gradient(to right, ${fadeColor}, transparent)`,
          opacity: atStart ? 0 : 1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 transition-opacity duration-200 motion-reduce:transition-none"
        style={{
          background: `linear-gradient(to left, ${fadeColor}, transparent)`,
          opacity: atEnd ? 0 : 1,
        }}
      />
      <div
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-label={ariaLabel}
        className="carousel-track flex gap-4 overflow-x-auto"
        style={{ touchAction: 'pan-x' }}
      >
        {children}
      </div>
    </div>
  )
}

const buttonBaseClasses =
  'absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none hover:bg-paper-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:pointer-events-none disabled:opacity-0'

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M8 3 3 8l5 5' : 'M4 3l5 5-5 5'
  return (
    <svg viewBox="0 0 11 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CarouselPrevButton() {
  const { atStart, scroll } = useCarouselContext('Carousel.PrevButton')
  return (
    <button
      type="button"
      aria-label="Previous"
      disabled={atStart}
      onClick={() => scroll('prev')}
      className={`${buttonBaseClasses} left-2`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      <ChevronIcon direction="left" />
    </button>
  )
}

function CarouselNextButton() {
  const { atEnd, scroll } = useCarouselContext('Carousel.NextButton')
  return (
    <button
      type="button"
      aria-label="Next"
      disabled={atEnd}
      onClick={() => scroll('next')}
      className={`${buttonBaseClasses} right-2`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      <ChevronIcon direction="right" />
    </button>
  )
}

export const Carousel = {
  Provider: CarouselProvider,
  Track: CarouselTrack,
  PrevButton: CarouselPrevButton,
  NextButton: CarouselNextButton,
}
