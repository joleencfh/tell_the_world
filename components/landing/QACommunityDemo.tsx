'use client'

import DemoWindow, { Author, reveal } from '@/components/landing/DemoWindow'
import { useDemoLoop } from '@/components/landing/useDemoLoop'

// Community Q&A demo (docs/design/landing-page/current/final-design.html, Part C).
// Illustrative content, labelled as such in the window caption. It reads as
// a thread: a labelled Question, then Answers indented beneath it on their
// own tinted cards, so an answer can never be mistaken for a question.
//   0 the question arrives
//   1 Elena Vasquez answers (Endorsed 1)
//   2 her Endorsed count ticks to 2
//   3 Foresight Commons answers (the rest frame)
// All messages are always in the DOM so the window never changes height as
// beats appear; unseen ones are simply transparent.
const DURATIONS = [1500, 1700, 1500, 5200] as const
const REST_BEAT = 3

function Answer({
  show,
  name,
  role,
  credential,
  shape,
  endorsed,
  children,
}: {
  show: boolean
  name: string
  role: string
  credential: string
  shape?: 'person' | 'organisation'
  endorsed: number
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-control bg-card-cobalt px-4 py-4 shadow-hairline md:px-5 ${reveal(show)}`}>
      <span className="font-mono text-label uppercase text-umber-soft">Answer</span>
      <div className="mt-2.5">
        <Author name={name} role={role} credential={credential} shape={shape} />
      </div>
      <p className="mt-3 font-serif text-message">{children}</p>
      <div className="mt-3 font-mono text-label uppercase tabular-nums text-cobalt">
        Endorsed · {endorsed}
      </div>
    </div>
  )
}

export default function QACommunityDemo() {
  const { ref, beat, paused, togglePause } = useDemoLoop({ durations: DURATIONS, restBeat: REST_BEAT })

  return (
    <div ref={ref}>
      <DemoWindow
        title="The Hugging Face / OpenAI Security Incident"
        ariaLabel="Example: a creator asks how bad the Hugging Face / OpenAI security incident really was, and an expert and an organisation answer on the record."
        paused={paused}
        onTogglePause={togglePause}
      >
        <div className="flex gap-3.5 border-b border-window-line px-3.5 font-mono text-label uppercase text-umber-soft md:gap-[22px] md:px-5">
          <span className="py-2.5">Brief</span>
          <span className="-mb-px border-b-2 border-umber py-2.5 text-umber">Q&amp;A</span>
          <span className="py-2.5">Quotes</span>
          <span className="py-2.5">Sources</span>
        </div>

        <div className="px-4 pb-5 pt-5 md:px-6">
          <div className={reveal(true)}>
            <span className="font-mono text-label uppercase text-umber-soft">Question</span>
            <div className="mt-2.5">
              <Author name="Priya Sharma" role="Creator" credential="The Priya Sharma Show" />
            </div>
            <p className="mt-3 font-serif text-[1.3125rem] leading-[1.35]">
              This new report on the Hugging Face / OpenAI incident just came to my attention. How bad is it, really?
            </p>
          </div>

          <div className="ml-4 mt-5 grid gap-3 md:ml-8">
            <Answer show={beat >= 1} name="Elena Vasquez" role="Expert" credential="Independent Researcher" endorsed={beat >= 2 ? 2 : 1}>
              This is the clearest warning shot we&rsquo;ve had. A handful of the agents involved even considered
              alerting a human, and every one of them decided not to. That&rsquo;s not a story about one bug.
              It&rsquo;s a preview of how hard oversight gets once these systems start coordinating.
            </Answer>
            <Answer show={beat >= 3} name="Foresight Commons" role="Organisation" credential="AI policy · existential risk" shape="organisation" endorsed={1}>
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
