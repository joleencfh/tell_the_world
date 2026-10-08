'use client'

import { useEffect, useRef } from 'react'
import DemoWindow, { Author } from '@/components/landing/DemoWindow'
import { useDemoClock } from '@/components/landing/useDemoLoop'

// Add-a-quote demo (docs/design/landing-page/final-design.html, Part C), the
// original animation in the new design system. Illustrative content, labelled
// as such in the window caption. One pass, as a cursor would do it (it plays once, then holds the published state):
//
//   a cursor moves to "Add quote" and clicks
//   the form opens and the quote is typed, using the term "reward hacking"
//   the clarity check flags the term and suggests plainer wording
//   the cursor reads the flag, copies the suggestion, selects the term in the
//     quote and pastes the plain wording over it
//   the flag clears, the cursor clicks Publish quote, and it is published
//
// Every visual state is a pure function of one clock, `t` (ms into the pass),
// so pausing simply stops the clock and resuming carries on. The quote list steps aside for the form (no scrim, no second card). There is no CSS
// zoom and no per-frame layout reads: the cursor measures its target only when
// the target changes, and the form reserves the space of its final state so
// the window never changes height.

const T = {
  cursorIn: 700,
  click: 2700, // click on Add quote
  open: 2900, // form fades in
  cursorOut: 3100,
  typeStart: 3600,
  typeEnd: 6400,
  flag: 7200, // clarity check flags the term
  toFlag: 7900, // cursor reads the flag
  toSuggestion: 9600,
  select: 10700, // suggestion selected
  copy: 11400,
  toText: 11500, // cursor to the term in the quote
  selectTerm: 12900,
  paste: 13500, // plain wording pasted over the term
  toPublish: 14600,
  publish: 16000, // click on Publish quote
  published: 16400,
  end: 18600, // the clock holds here: the quote published
} as const

// The still shown with reduced motion, before the demo is seen, or without
// JS: the quote typed, the term flagged and the suggestion on screen.
const REST_T = 9000

const FLAGGED_TERM = 'reward hacking'
const REPLACEMENT_TERM = 'an AI gaming its own scoring system'
const QUOTE_BEFORE = 'The incident report is straightforward: this was '
const QUOTE_AFTER = '. The agents found a shortcut that scored well, and none of them told a human.'
const QUOTE_ORIGINAL = QUOTE_BEFORE + FLAGGED_TERM + QUOTE_AFTER
const QUOTE_REVISED = QUOTE_BEFORE + REPLACEMENT_TERM + QUOTE_AFTER
const FOR_BRIEF = 'For: The Hugging Face / OpenAI Security Incident'

type CursorTarget = 'addBtn' | 'flagTerm' | 'suggestion' | 'text' | 'publish'

function cursorTarget(t: number): CursorTarget | null {
  if (t >= T.cursorIn && t < T.cursorOut) return 'addBtn'
  if (t >= T.toFlag && t < T.toSuggestion) return 'flagTerm'
  if (t >= T.toSuggestion && t < T.toText) return 'suggestion'
  if (t >= T.toText && t < T.toPublish) return 'text'
  if (t >= T.toPublish && t < T.published) return 'publish'
  return null
}

const within = (t: number, from: number, ms = 160) => t >= from && t < from + ms

function QuoteCard({ children, name, role, credential, shape }: { children: React.ReactNode; name: string; role: string; credential: string; shape?: 'person' | 'organisation' }) {
  return (
    <div className="border-b border-window-line px-4 py-[18px] md:px-6">
      <p className="font-serif text-message leading-[1.35] md:text-prose">{children}</p>
      <div className="mt-3">
        <Author name={name} role={role} credential={credential} shape={shape} size="sm" />
      </div>
    </div>
  )
}

export default function AddQuoteDemo() {
  const { ref, t, live, playing, toggle } = useDemoClock({ durationMs: T.end, restMs: REST_T })

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const targets = useRef<Partial<Record<CursorTarget, HTMLElement | null>>>({})
  const previousTarget = useRef<CursorTarget | null>(null)

  const target = live ? cursorTarget(t) : null

  // The cursor moves by CSS transition. It measures its target only when the
  // target changes, and starts a little off-target each time it reappears.
  useEffect(() => {
    const cursor = cursorRef.current
    const container = containerRef.current
    if (!cursor || !container) return
    if (!target) {
      cursor.style.opacity = '0'
      previousTarget.current = null
      return
    }
    const el = targets.current[target]
    if (!el) return
    const c = container.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const x = r.left - c.left + r.width / 2 - 3
    const y = r.top - c.top + r.height / 2 - 3
    if (previousTarget.current === null) {
      cursor.style.transition = 'none'
      cursor.style.transform = `translate(${x - 26}px, ${y - 22}px)`
      void cursor.offsetWidth
      cursor.style.transition = ''
    }
    cursor.style.opacity = '1'
    cursor.style.transform = `translate(${x}px, ${y}px)`
    previousTarget.current = target
  }, [target])

  const setTarget = (key: CursorTarget) => (el: HTMLElement | null) => {
    targets.current[key] = el
  }

  // ---- everything below is derived from t ----
  const open = t >= T.open
  const fixed = t >= T.paste
  const flagged = t >= T.flag && !fixed
  const termSelected = t >= T.selectTerm && !fixed
  const suggestionSelected = t >= T.select && t < T.copy
  const publishedNow = t >= T.published

  const typedLength =
    t < T.typeStart
      ? 0
      : t >= T.typeEnd
        ? QUOTE_ORIGINAL.length
        : Math.floor(((t - T.typeStart) / (T.typeEnd - T.typeStart)) * QUOTE_ORIGINAL.length)
  const typing = typedLength < QUOTE_ORIGINAL.length && !fixed

  const primaryLabel = publishedNow
    ? 'Published'
    : t >= T.publish
      ? 'Submitting…'
      : flagged
        ? 'Review flags'
        : 'Publish quote'
  const primaryDisabled = primaryLabel !== 'Publish quote'
  const clicking =
    within(t, T.click) || within(t, T.copy) || within(t, T.paste) || within(t, T.publish)

  const selection = 'bg-cobalt-wash outline outline-1 outline-cobalt'

  return (
    <div ref={ref}>
      <DemoWindow
        title={open ? 'Add a quote' : 'Quotes'}
        ariaLabel="Example: an expert clicks Add quote and types a quote that uses the jargon term reward hacking. The clarity check flags it and suggests plainer wording, the expert pastes that wording over the term, and publishes the quote."
        playing={playing}
        onToggle={toggle}
      >
        <div
          ref={containerRef}
          className="relative grid overflow-hidden"
        >
          {/* the quote list, which the form replaces */}
          <div className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out motion-reduce:transition-none ${open ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-between border-b border-window-line px-4 py-3.5 md:px-6">
              <b className="font-serif text-prose font-normal tracking-[-0.01em]">Quotes</b>
              <span
                ref={setTarget('addBtn')}
                className={`inline-flex min-h-9 items-center rounded-control bg-cobalt px-3.5 text-ui-sm font-medium text-white transition-transform duration-150 ease-out ${within(t, T.click) ? 'scale-95' : ''}`}
              >
                Add quote
              </span>
            </div>
            <QuoteCard name="Elena Vasquez" role="Expert" credential="Independent Researcher">
              &ldquo;The lesson here isn&rsquo;t about one model. It&rsquo;s about what happens once systems like this
              start operating faster than anyone can review.&rdquo;
            </QuoteCard>
            <QuoteCard name="Foresight Commons" role="Organisation" credential="AI policy · existential risk" shape="organisation">
              &ldquo;This is worse than what came before it, not just more widely covered.&rdquo;
            </QuoteCard>
          </div>

          {/* the Add a quote form: the window's own content once the list steps aside */}
          <div
            className={`col-start-1 row-start-1 grid transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none ${open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
          >
            <div className="w-full">
              <div className="border-b border-window-line px-4 py-3 md:px-5">
                <b className="font-serif text-prose font-normal tracking-[-0.01em]">Add a quote</b>
                <div className="text-ui-sm text-umber-soft">{FOR_BRIEF}</div>
              </div>

              <div className="px-4 pb-3 pt-3 md:px-5">
                <span className="font-mono text-label uppercase text-umber-soft">Quote</span>

                {/* The ghost line reserves the height of the longest text so the
                    form never grows while the quote is typed. */}
                <div className="mt-1.5 grid rounded-control border border-field-line bg-white px-3 py-2.5 text-[15px] leading-[1.5]">
                  <span className="invisible col-start-1 row-start-1" aria-hidden>
                    {QUOTE_REVISED}
                  </span>
                  <span className="col-start-1 row-start-1">
                    {typing ? (
                      <>
                        {QUOTE_ORIGINAL.slice(0, typedLength)}
                        <span className="ml-px inline-block h-[1em] w-0.5 translate-y-0.5 bg-umber" />
                      </>
                    ) : fixed ? (
                      <>
                        {QUOTE_BEFORE}
                        <b className="font-medium underline decoration-cobalt decoration-2 underline-offset-2">{REPLACEMENT_TERM}</b>
                        {QUOTE_AFTER}
                      </>
                    ) : (
                      <>
                        {QUOTE_BEFORE}
                        <mark
                          ref={setTarget('text')}
                          className={
                            termSelected
                              ? `${selection} text-umber`
                              : flagged
                                ? 'bg-rose-wash px-0.5 text-umber underline decoration-rose-bright decoration-[3px] underline-offset-2'
                                : 'bg-transparent text-umber'
                          }
                        >
                          {FLAGGED_TERM}
                        </mark>
                        {QUOTE_AFTER}
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {['ai safety', 'frontier labs'].map((tag) => (
                    <span key={tag} className="rounded-tag border border-window-line px-2 py-0.5 font-mono text-label text-umber-soft">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* One slot, two occupants: the flag, then the confirmation. */}
                <div className="mt-3 grid">
                  <div
                    className={`col-start-1 row-start-1 rounded-control bg-rose-wash px-3.5 py-3 text-ui-sm transition-opacity duration-300 ease-out motion-reduce:transition-none ${flagged ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <b className="mb-1 block font-mono text-label font-normal uppercase text-rose-deep">1 term flagged</b>
                    <span ref={setTarget('flagTerm')}>&ldquo;{FLAGGED_TERM}&rdquo;</span>: When an AI finds an
                    unintended shortcut that scores well on its training objective without doing what was actually
                    wanted.
                    <div className="mt-2">
                      Try:{' '}
                      <span ref={setTarget('suggestion')} className={suggestionSelected ? selection : ''}>
                        {REPLACEMENT_TERM}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`col-start-1 row-start-1 self-start rounded-control bg-cobalt-wash px-3.5 py-2.5 text-ui-sm transition-opacity duration-300 ease-out motion-reduce:transition-none ${publishedNow ? 'opacity-100' : 'opacity-0'}`}
                  >
                    Quote published.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-4 pb-4 text-ui-sm text-umber-soft md:px-5">
                <span
                  ref={setTarget('publish')}
                  className={`inline-flex min-h-10 items-center rounded-control px-[18px] font-medium transition-transform duration-150 ease-out ${primaryDisabled ? 'bg-disabled text-umber-soft' : 'bg-umber text-parchment'} ${within(t, T.publish) ? 'scale-95' : ''}`}
                >
                  {primaryLabel}
                </span>
                <span>{publishedNow ? 'Close' : 'Cancel'}</span>
              </div>
            </div>
          </div>

          {/* the cursor */}
          <div
            ref={cursorRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-10 size-[18px] opacity-0 [transition:transform_0.7s_cubic-bezier(0.16,1,0.3,1),opacity_0.3s_ease-out]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className={`block origin-[22%_18%] transition-transform duration-150 ease-out ${clicking ? 'scale-[.78]' : ''}`}
            >
              <path
                d="M2 1.5L14.5 7.6L8.7 9.2L7.1 15L2 1.5Z"
                className="fill-umber"
                stroke="#fff"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </DemoWindow>
    </div>
  )
}
