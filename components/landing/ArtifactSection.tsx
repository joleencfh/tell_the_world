interface ArtifactSectionProps {
  heading: string
  body: string
  /** Put the framed window on the left and the text on the right (from md). */
  flip?: boolean
  /** The demo window shown beside the text. */
  children: React.ReactNode
}

// Text beside a framed artifact (design-system.md, Framed window). Stacks on
// mobile with the text first. The two sections on the page do not mirror each
// other by accident: the first gives the window the wider column, text left;
// the second flips sides and narrows the window. Hairline above, no band. The
// heading opens the section; there is no label above it.
export default function ArtifactSection({ heading, body, flip = false, children }: ArtifactSectionProps) {
  return (
    <section className="border-t border-rule py-14 md:py-section">
      <div
        className={`mx-auto grid max-w-page items-center gap-8 px-5 md:gap-16 md:px-gutter ${
          flip ? 'md:grid-cols-[1fr_.9fr]' : 'md:grid-cols-[.78fr_1.22fr]'
        }`}
      >
        <div className={flip ? 'md:order-2' : undefined}>
          <h2 className="font-serif text-heading-sm text-umber">{heading}</h2>
          <p className="mt-5 font-serif text-prose-sm text-umber-soft md:text-prose">{body}</p>
        </div>
        <div className={flip ? 'md:order-1' : undefined}>{children}</div>
      </div>
    </section>
  )
}
