// "Why this matters now": the page's one argument. Copy is from
// landing-copy-PROPOSALS.md (accepted rows). It is the page's pale band, set between hairlines; the
// closing band is the soft one.
export default function WhyThisMatters() {
  return (
    <section className="border-y border-rule bg-band-pale py-14 md:py-20">
      <div className="mx-auto grid max-w-page gap-0 px-5 md:grid-cols-[1.15fr_.85fr] md:gap-[72px] md:px-gutter">
        <h2 className="font-serif text-heading text-umber">
          People are paying attention to AI risk. Clear answers are hard to find.
        </h2>
        <p className="pt-6 font-serif text-prose-sm text-umber-body md:pt-3 md:text-prose">
          AI incidents are in the news, and existential risk is reaching the mainstream. Creators and
          journalists are being asked to explain it. The people who study it are hard to reach, and their
          work is hard to reuse. Tell The World puts them in touch, and gives the work a form that creators
          can use.
        </p>
      </div>
    </section>
  )
}
