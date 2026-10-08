'use client'

import DemoWindow, { Author } from '@/components/landing/DemoWindow'
import { useDemoClock } from '@/components/landing/useDemoLoop'

// Community Q&A demo (docs/design/landing-page/final-design.html, Part C).
// Illustrative content, labelled as such in the window caption. It reads as
// a thread: a labelled Question, then Answers indented beneath it, so an
// answer can never be mistaken for a question. Answers sit directly on the
// window, separated by space alone: no card inside the window.
//
// It plays once, when first in view, then holds the full thread:
//   the question is already there
//   1 Elena Vasquez answers (Endorsed 1)
//   2 her Endorsed count ticks to 2
//   3 Foresight Commons answers
// Both answers are always in the DOM, so the window never changes height as
// they appear; an unseen one is simply transparent.
const ANSWER_1_AT = 600
const ENDORSE_AT = 2600
const ANSWER_2_AT = 3600
const DURATION = 4200

const reveal = (show: boolean) =>
  `transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
    show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
  }`

function Answer({
  show,
  name,
  role,
  credential,
  shape,
  endorsed,
  ticked,
  children,
}: {
  show: boolean
  name: string
  role: string
  credential: string
  shape?: 'person' | 'organisation'
  endorsed: number
  /** Re-keys the count so the tick animation plays when it changes. */
  ticked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={reveal(show)}>
      <span className="font-mono text-label uppercase text-umber-soft">Answer</span>
      <div className="mt-2.5">
        <Author name={name} role={role} credential={credential} shape={shape} />
      </div>
      <p className="mt-3 font-serif text-message">{children}</p>
      <div className="mt-3 font-mono text-label uppercase tabular-nums text-cobalt">
        Endorsed ·{' '}
        <span key={String(ticked)} className={`inline-block ${ticked ? 'animate-tick' : ''}`}>
          {endorsed}
        </span>
      </div>
    </div>
  )
}

export default function QACommunityDemo() {
  const { ref, t, live, playing, toggle } = useDemoClock({ durationMs: DURATION, restMs: DURATION, tickMs: 100 })
  const endorsedNow = t >= ENDORSE_AT

  return (
    <div ref={ref}>
      <DemoWindow
        title="The Hugging Face / OpenAI Security Incident"
        ariaLabel="Example: a creator asks how bad the Hugging Face / OpenAI security incident really was, and an expert and an organisation answer on the record."
        playing={playing}
        onToggle={toggle}
      >
        <div className="flex gap-3.5 border-b border-window-line px-3.5 font-mono text-label uppercase text-umber-soft md:gap-[22px] md:px-5">
          <span className="py-2.5">Brief</span>
          <span className="-mb-px border-b-2 border-umber py-2.5 text-umber">Q&amp;A</span>
          <span className="py-2.5">Quotes</span>
          <span className="py-2.5">Sources</span>
        </div>

        <div className="px-4 pb-6 pt-5 md:px-6">
          <div>
            <span className="font-mono text-label uppercase text-umber-soft">Question</span>
            <div className="mt-2.5">
              <Author name="Priya Sharma" role="Creator" credential="The Priya Sharma Show" />
            </div>
            <p className="mt-3 font-serif text-[1.3125rem] leading-[1.35]">
              This new report on the Hugging Face / OpenAI incident just came to my attention. How bad is it, really?
            </p>
          </div>

          <div className="ml-4 mt-6 grid gap-6 md:ml-8">
            <Answer
              show={t >= ANSWER_1_AT}
              name="Elena Vasquez"
              role="Expert"
              credential="Independent Researcher"
              endorsed={endorsedNow ? 2 : 1}
              ticked={live && endorsedNow}
            >
              This is the clearest warning shot we&rsquo;ve had. A handful of the agents involved even considered
              alerting a human, and every one of them decided not to. That&rsquo;s not a story about one bug.
              It&rsquo;s a preview of how hard oversight gets once these systems start coordinating.
            </Answer>
            <Answer
              show={t >= ANSWER_2_AT}
              name="Foresight Commons"
              role="Organisation"
              credential="AI policy · existential risk"
              shape="organisation"
              endorsed={1}
            >
              We study incidents like this closely, and this one is worse than what came before it, not just more
              widely covered. The real question isn&rsquo;t only what these systems can do today. It&rsquo;s whether
              anyone stays in control as more capable ones arrive, and that&rsquo;s what we research and push
              lawmakers on.
            </Answer>
          </div>
        </div>
      </DemoWindow>
    </div>
  )
}
