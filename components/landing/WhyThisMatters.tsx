// "Why this matters now": the page's one argument. Copy is verbatim from
// landing-page-copy.md. It sits on the page ground under a hairline; the
// closing band is the page's only tinted band.
export default function WhyThisMatters() {
  return (
    <section className="border-t border-rule py-14 md:py-section">
      <div className="mx-auto grid max-w-page gap-0 px-5 md:grid-cols-[1.15fr_.85fr] md:gap-[72px] md:px-gutter">
        <h2 className="font-serif text-heading text-umber">
          Attention shows up, understanding doesn&rsquo;t always follow.
        </h2>
        <p className="pt-6 font-serif text-prose-sm text-umber-body md:pt-3 md:text-prose">
          AI incidents are all over the news and existential risk is reaching the mainstream. Now that
          people are finally paying attention, we need a way to keep the momentum going, while providing
          candid &amp; credible explanations from the people and organisations who actually study this.
          We need to do this at scale, now.
        </p>
      </div>
    </section>
  )
}
