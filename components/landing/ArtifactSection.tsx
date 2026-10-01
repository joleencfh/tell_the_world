interface ArtifactSectionProps {
  eyebrow: string
  heading: string
  body: string
  /** The demo window shown beside the text. */
  children: React.ReactNode
}

// Text on the left, a framed artifact on the right (design-system.md, Framed
// window). Stacks on mobile. Hairline above, no band.
export default function ArtifactSection({ eyebrow, heading, body, children }: ArtifactSectionProps) {
  return (
    <section className="border-t border-rule py-14 md:py-section">
      <div className="mx-auto grid max-w-page items-center gap-8 px-5 md:grid-cols-[.78fr_1.22fr] md:gap-16 md:px-gutter">
        <div>
          <span className="font-mono text-label uppercase text-cobalt">{eyebrow}</span>
          <h2 className="mt-4 font-serif text-heading-sm text-umber">{heading}</h2>
          <p className="mt-5 font-serif text-[1.25rem] leading-[1.5] text-umber-soft md:text-prose">{body}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}
