'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealOnScrollProps {
  children: React.ReactNode
  className?: string
}

// Fades content in via the existing .anim-rise keyframe (app/globals.css)
// the moment it scrolls into view, instead of playing on mount before
// anyone's looking. Starts at opacity-0 and swaps in .anim-rise once, then
// stops observing — .anim-rise's own reduced-motion query (globals.css)
// takes it from there.
export default function RevealOnScroll({ children, className = '' }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${visible ? 'anim-rise' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  )
}
