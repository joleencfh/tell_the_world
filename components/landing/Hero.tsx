import { useId } from 'react'
import CirclePair from '@/components/landing/CirclePair'
import StatusChip from '@/components/landing/StatusChip'
import WaitlistButton from '@/components/landing/WaitlistButton'

// Audience card: one sentence per audience. Rose = creators & journalists,
// cobalt = researchers & organisations. The card's own button pre-selects the
// matching role. The two cards are mirrored: the creator card leads with its
// marker on the left, the expert card closes with its marker on the right.
function AudienceCard({
  tone,
  label,
  children,
}: {
  tone: 'rose' | 'cobalt'
  label: string
  children: React.ReactNode
}) {
  const isRose = tone === 'rose'
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-control p-4 shadow-hairline md:px-[22px] md:py-5 ${isRose ? 'bg-card-rose' : 'bg-card-cobalt'}`}
    >
      <h2
        id={headingId}
        className={`m-0 flex items-center gap-2.5 font-mono text-label font-normal uppercase ${isRose ? 'text-rose-deep' : 'flex-row-reverse justify-between text-cobalt'}`}
      >
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-current" />
        {label}
      </h2>
      <p className="mt-2.5 max-w-[17em] font-serif text-[1.25rem] leading-[1.3] text-umber md:mt-3 md:text-card">
        {children}
      </p>
      <div className="mt-4 md:mt-auto md:pt-5">
        <WaitlistButton role={isRose ? 'creator' : 'expert'} variant={isRose ? 'rose' : 'cobalt'} />
      </div>
    </section>
  )
}

// Mobile reads top to bottom as headline, both audience buttons, then the
// supporting lead, the circle pair and the trust line, so both calls to
// action land in the first screen and a half of a 375x667 phone. From md the
// headline and lead sit left of the pair and the cards span the full width.
export default function Hero() {
  return (
    <section className="mx-auto max-w-page px-5 md:px-gutter">
      <div className="grid gap-x-14 pt-6 md:grid-cols-[1fr_230px] md:pt-16">
        <h1 className="max-w-[13em] font-serif text-display text-umber md:col-start-1 md:row-start-1">
          AI safety research rarely reaches the people who could{' '}
          <em className="whitespace-nowrap text-rose">tell its story.</em>
        </h1>

        <div className="mt-5 grid gap-3 md:col-span-2 md:col-start-1 md:row-start-3 md:mt-14 md:grid-cols-2 md:gap-4">
          <AudienceCard tone="rose" label="Creators & journalists">
            Know how to turn complicated research into stories people can relate to.
          </AudienceCard>
          <AudienceCard tone="cobalt" label="Researchers & organisations">
            Have important messages on how to make AI go well.
          </AudienceCard>
        </div>

        <p className="mt-7 max-w-[28em] font-serif text-[1.3125rem] leading-[1.42] text-umber-soft md:col-start-1 md:row-start-2 md:mt-6 md:text-lead">
          Tell The World connects AI safety researchers and organisations with the creators and
          journalists who can put their work in front of real audiences.
        </p>

        {/* Circle pair with its two-line legend. */}
        <div className="mt-6 flex items-center gap-4 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:block md:pt-3">
          <CirclePair className="block h-auto w-[104px] shrink-0 md:w-full" label="Two overlapping circles: creators and journalists in pink, researchers and organisations in blue" />
          <ul className="m-0 grid list-none gap-1.5 p-0 font-ui text-ui-sm md:mt-3.5">
            <li className="flex items-center gap-2 text-rose">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-rose-bright" />
              Creators &amp; journalists
            </li>
            <li className="flex items-center gap-2 text-cobalt">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-cobalt-bright" />
              Researchers &amp; organisations
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-11 pt-6 md:col-span-2 md:row-start-4 md:pb-16 md:pt-5">
          <StatusChip className="inline-flex md:hidden" />
          <p className="max-w-[46em] text-base text-umber-soft">Members are approved before they can post or sign in.</p>
        </div>
      </div>
    </section>
  )
}
