import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Showcase from './Showcase'

export const metadata: Metadata = { title: 'Design system (dev)', robots: { index: false } }

// Development-only reference: every shared primitive in every state, so
// reviews and later migration phases have one place to look. It does not
// exist in production builds.
export default function DesignSystemDevPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <Showcase />
}
