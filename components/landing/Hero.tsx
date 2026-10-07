import { useId } from 'react'
import CirclePair from '@/components/landing/CirclePair'
import StatusChip from '@/components/landing/StatusChip'
import WaitlistButton from '@/components/landing/WaitlistButton'

// design-system.md, Audience card: one sentence per audience, side by side
// from md up. Rose = creators & journalists, cobalt = researchers &
// organisations. The card's own button pre-selects the matching role.
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
      className={`rounded-control shadow-hairline ${isRose ? 'bg-card-rose' : 'bg-card-cobalt'}`}
    >
      <h2
        id={headingId}
        className={`m-0 flex items-center gap-2.5 px-[22px] pb-0 pt-[18px] font-mono text-label font-normal uppercase ${isRose ? 'text-rose-deep' : 'text-cobalt'}`}
      >
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-current" />
        {label}
      </h2>
      <p className="max-w-[17em] px-[22px] pb-1.5 pt-3 font-serif text-[1.4375rem] leading-[1.3] text-umber md:text-card">
        {children}
      </p>
      <div className="px-[22px] pb-[22px] pt-[18px]">
        <WaitlistButton role={isRose ? 'creator' : 'expert'} variant={isRose ? 'rose' : 'cobalt'} />
      </div>
    </section>
  )
}

export default function Hero() {
  return (
    <section className="mx-auto max-w-page px-5 md:px-gutter">
      <div className="grid gap-6 pt-9 md:grid-cols-[1fr_230px] md:items-start md:gap-14 md:pt-16">
        <div>
          <h1 className="mb-6 max-w-[13em] font-serif text-display text-umber">
            AI safety research rarely reaches the people who could{' '}
            <em className="whitespace-nowrap text-rose">tell its story.</em>
          </h1>
          <p className="max-w-[28em] font-serif text-[1.3125rem] leading-[1.42] text-umber-soft md:text-lead">
            Tell The World connects AI safety researchers and organisations with the creators and
            journalists who can put their work in front of real audiences.
          </p>
        </div>

        {/* design-system.md, Circle pair: hero size with a two-line legend. */}
        <div className="flex items-center gap-4 md:block md:pt-11">
          <CirclePair className="block h-auto w-[132px] shrink-0 md:w-full" label="Two overlapping circles: creators and journalists in pink, researchers and organisations in blue" />
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
      </div>

      <div className="mt-9 grid gap-4 md:mt-14 md:grid-cols-2">
        <AudienceCard tone="rose" label="Creators & journalists">
          Know how to turn complicated research into stories people can relate to.
        </AudienceCard>
        <AudienceCard tone="cobalt" label="Researchers & organisations">
          Have important messages on how to make AI go well.
        </AudienceCard>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-11 pt-5 md:pb-16">
        <StatusChip className="inline-flex md:hidden" />
        <p className="max-w-[46em] text-base text-umber-soft">Members are approved before they can post or sign in.</p>
      </div>
    </section>
  )
}
