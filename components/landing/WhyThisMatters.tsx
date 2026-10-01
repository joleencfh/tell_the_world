// "Why this matters now": the page's one argument, on the pale band
// (design-system.md, Band). Copy is verbatim from landing-page-copy.md.
export default function WhyThisMatters() {
  return (
    <section className="border-t border-rule bg-band-pale py-14 md:py-section">
      <div className="mx-auto grid max-w-page gap-0 px-5 md:grid-cols-[1.15fr_.85fr] md:gap-[72px] md:px-gutter">
        <div>
          <span className="font-mono text-label uppercase text-rose">Why this matters now</span>
          <h2 className="mt-4 font-serif text-heading text-umber">
            Attention shows up, <em className="text-rose">understanding doesn&rsquo;t always follow.</em>
          </h2>
        </div>
        <p className="pt-6 font-serif text-[1.25rem] leading-[1.55] text-umber-body md:pt-10 md:text-prose">
          AI incidents are all over the news and existential risk is reaching the mainstream. Now that
          people are finally paying attention, we need a way to keep the momentum going, while providing
          candid &amp; credible explanations from the people and organisations who actually study this.
          We need to do this at scale, now.
        </p>
      </div>
    </section>
  )
}
