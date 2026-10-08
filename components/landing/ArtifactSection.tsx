interface ArtifactSectionProps {
  heading: string
  body: string
  /** The demo window shown beside the text. */
  children: React.ReactNode
}

// Text on the left, a framed artifact on the right (design-system.md, Framed
// window). Stacks on mobile. Hairline above, no band. The heading opens the
// section; there is no label above it.
export default function ArtifactSection({ heading, body, children }: ArtifactSectionProps) {
  return (
    <section className="border-t border-rule py-14 md:py-section">
      <div className="mx-auto grid max-w-page items-center gap-8 px-5 md:grid-cols-[.78fr_1.22fr] md:gap-16 md:px-gutter">
        <div>
          <h2 className="font-serif text-heading-sm text-umber">{heading}</h2>
          <p className="mt-5 font-serif text-prose-sm text-umber-soft md:text-prose">{body}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}
