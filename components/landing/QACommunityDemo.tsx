'use client'

import { useEffect, useRef } from 'react'

// Ported from docs/design/landing-page/qa-feature-loop-concept.html (built
// and signed off — see conference-landing-page-plan.md §0's sign-off
// history). Same markup, CSS and animation-timeline logic as the concept
// file, translated into refs + useEffect instead of getElementById + an
// inline <script>. Persona unified to Elena Vasquez per 2026-09-24
// sign-off (the concept file's own persona was Dr. Sarah Chen; the Add a
// Quote demo already used Elena Vasquez).
//
// The fixed-height fade-viewport mechanic — measure the collapsed content's
// height via a double rAF + a document.fonts.ready hook + a 350ms timeout
// safety net, then refit on ResizeObserver — is kept exactly as built. An
// early measurement taken before fonts/layout settle undersizes the box and
// clips the resting state; that happened once already, so this isn't
// simplified away.
//
// CSS is scoped under .qa-demo rather than renamed per-class, so it can be
// pasted close to verbatim from the concept file (which already references
// the app's real design tokens via var(--color-x)/var(--font-x) — no need
// to redeclare them here, unlike the standalone concept file which did).
// The concept file's 2px pink outline on the card viewport was a debug aid
// for viewing it in isolation; production uses the signed-off layout
// mockup's plain 2px ink border instead.
export default function QACommunityDemo() {
  const frameRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const authorBarRef = useRef<HTMLDivElement>(null)
  const qtextRef = useRef<HTMLParagraphElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const answersRef = useRef<HTMLDivElement>(null)
  const answer1Ref = useRef<HTMLDivElement>(null)
  const answer2Ref = useRef<HTMLDivElement>(null)
  const qVotesRef = useRef<HTMLSpanElement>(null)
  const a1VotesRef = useRef<HTMLSpanElement>(null)
  const a2VotesRef = useRef<HTMLSpanElement>(null)
  const commentsIconRef = useRef<HTMLSpanElement>(null)
  const commentsPanelRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorGlyphRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const viewport = viewportRef.current
    const card = cardRef.current
    const fade = fadeRef.current
    const commentsIcon = commentsIconRef.current
    const commentsPanel = commentsPanelRef.current
    const answers = answersRef.current
    const answer1 = answer1Ref.current
    const cursor = cursorRef.current
    const cursorGlyph = cursorGlyphRef.current
    if (!frame || !viewport || !card || !fade || !commentsIcon || !commentsPanel || !answers || !answer1 || !cursor || !cursorGlyph) {
      return
    }

    const steps = [authorBarRef, qtextRef, statsRef, answer1Ref, answer2Ref]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const FADE_BUFFER_PX = 28

    function fitViewportToCollapsedContent() {
      const wasOpen = commentsPanel!.classList.contains('open')
      commentsPanel!.classList.remove('open')
      const collapsedHeight = card!.scrollHeight
      const fadeHeight = fade!.getBoundingClientRect().height || 72
      viewport!.style.height = `${collapsedHeight + fadeHeight + FADE_BUFFER_PX}px`
      if (wasOpen) commentsPanel!.classList.add('open')
    }

    function fitViewportSoon() {
      requestAnimationFrame(() => requestAnimationFrame(fitViewportToCollapsedContent))
    }

    fitViewportToCollapsedContent()
    fitViewportSoon()
    const fontsSafetyNet = setTimeout(fitViewportToCollapsedContent, 350)
    document.fonts?.ready?.then(fitViewportSoon)

    let lastWidth = frame!.getBoundingClientRect().width
    const resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (Math.abs(w - lastWidth) > 1) {
        lastWidth = w
        fitViewportToCollapsedContent()
      }
    })
    resizeObserver.observe(frame!)

    function pulse(ref: React.RefObject<HTMLSpanElement | null>, to: string) {
      const el = ref.current
      if (!el) return
      el.classList.add('pulse')
      el.textContent = to
      setTimeout(() => el.classList.remove('pulse'), 260)
    }

    function positionCursorAtStart() {
      const answersBox = answers!.getBoundingClientRect()
      const answer1Box = answer1!.getBoundingClientRect()
      cursor!.style.transition = 'none'
      cursor!.style.transform = `translate(${answer1Box.right - answersBox.left - 30}px, ${answer1Box.top - answersBox.top + 6}px)`
      cursor!.getBoundingClientRect()
      cursor!.style.transition = ''
    }

    function moveCursorToIcon() {
      const answersBox = answers!.getBoundingClientRect()
      const iconBox = commentsIcon!.getBoundingClientRect()
      const x = iconBox.left - answersBox.left + iconBox.width / 2 - 3
      const y = iconBox.top - answersBox.top + iconBox.height / 2 - 3
      cursor!.style.transform = `translate(${x}px, ${y}px)`
    }

    function setAll(show: boolean) {
      steps.forEach((ref) => ref.current?.classList.toggle('show', show))
      viewport!.style.opacity = show ? '1' : '0'
    }

    if (reduced) {
      setAll(true)
      if (qVotesRef.current) qVotesRef.current.textContent = '14'
      if (a1VotesRef.current) a1VotesRef.current.textContent = '7'
      if (a2VotesRef.current) a2VotesRef.current.textContent = '5'
      commentsPanel.classList.add('open')
      commentsIcon.classList.add('clicked')
      return () => {
        clearTimeout(fontsSafetyNet)
        resizeObserver.disconnect()
      }
    }

    let timers: ReturnType<typeof setTimeout>[] = []
    function clearTimers() {
      timers.forEach(clearTimeout)
      timers = []
    }
    function at(ms: number, fn: () => void) {
      timers.push(setTimeout(fn, ms))
    }

    function runCycle() {
      clearTimers()
      if (qVotesRef.current) qVotesRef.current.textContent = '12'
      if (a1VotesRef.current) a1VotesRef.current.textContent = '6'
      if (a2VotesRef.current) a2VotesRef.current.textContent = '4'
      steps.forEach((ref) => ref.current?.classList.remove('show'))
      commentsPanel!.classList.remove('open')
      commentsIcon!.classList.remove('clicked')
      cursor!.classList.remove('visible')
      viewport!.style.transition = 'opacity .5s ease'
      viewport!.style.opacity = '1'

      at(300, () => authorBarRef.current?.classList.add('show'))
      at(900, () => qtextRef.current?.classList.add('show'))
      at(1600, () => statsRef.current?.classList.add('show'))
      at(2000, () => pulse(qVotesRef, '14'))
      at(2900, () => answer1Ref.current?.classList.add('show'))
      at(3900, () => pulse(a1VotesRef, '7'))
      at(4900, () => answer2Ref.current?.classList.add('show'))
      at(5900, () => pulse(a2VotesRef, '5'))
      at(7000, () => {
        positionCursorAtStart()
        cursor!.classList.add('visible')
      })
      at(7500, moveCursorToIcon)
      at(8250, () => {
        cursorGlyph!.classList.add('pulse')
        commentsIcon!.classList.add('clicked')
        commentsPanel!.classList.add('open')
        setTimeout(() => cursorGlyph!.classList.remove('pulse'), 200)
      })
      at(8900, () => cursor!.classList.remove('visible'))
      at(12200, () => {
        viewport!.style.opacity = '0.15'
      })
      at(13000, runCycle)
    }

    function onVisibilityChange() {
      if (document.hidden) clearTimers()
      else runCycle()
    }

    runCycle()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimers()
      clearTimeout(fontsSafetyNet)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div ref={frameRef} className="qa-demo mx-auto w-full max-w-[30rem]">
      <p className="sr-only">
        Looping demo of the Community Q&amp;A feature: Priya Sharma asks how bad the Hugging Face / OpenAI
        incident really was. Expert Elena Vasquez and the organisation Foresight Commons answer and are
        endorsed, with vote counts appearing. A cursor then clicks a comments icon on Elena Vasquez&rsquo;s
        answer, revealing two comments from a creator and a journalist. Note: the comments feature shown
        here is illustrative and does not exist in the product yet.
      </p>

      <div ref={viewportRef} className="card-viewport">
        <div ref={cardRef} className="card">
          <div ref={authorBarRef} className="author-bar reveal">
            <span className="av av-2xs" style={{ background: '#B45309' }}>P</span>
            <span className="name-strong">Priya Sharma</span>
            <span className="rolebadge pink">Creator</span>
            <span className="faint">&middot;</span>
            <span className="faint">The Priya Sharma Show</span>
            <span className="faint">&middot;</span>
            <span className="faint">Mar 3</span>
          </div>

          <p ref={qtextRef} className="qtext reveal">
            This new report on the Hugging Face / OpenAI incident just came to my attention. How bad is it, really?
          </p>

          <div ref={statsRef} className="stats-row reveal">
            <span className="stat">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L9 8H1L5 1Z" stroke="var(--color-pink)" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <span className="n" ref={qVotesRef}>12</span>
            </span>
            <span className="stat">
              <svg viewBox="0 0 14 12" width="13" height="12" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" fill="none" stroke="var(--color-pink)">
                <path d="M1.5 1.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5.3L2.3 12v-2.5h-.8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
              </svg>
              <span>2</span>
            </span>
          </div>

          <div ref={answersRef} className="answers">
            <div ref={answer1Ref} className="answer reveal">
              <div className="author-row">
                <span className="av av-xs">E</span>
                <div className="meta">
                  <div className="aname-row">
                    <span className="aname">Elena Vasquez</span>
                    <span className="rolebadge blue">Expert</span>
                  </div>
                  <div className="cred">Independent Researcher &middot; Mar 3</div>
                </div>
              </div>
              <p className="abody">
                This is the clearest warning shot we&rsquo;ve had. A handful of the agents involved even
                considered alerting a human, and every one of them decided not to. That&rsquo;s not a story
                about one bug. It&rsquo;s a preview of how hard oversight gets once these systems start
                coordinating.
              </p>
              <div className="afoot">
                <span className="stat">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L9 8H1L5 1Z" stroke="var(--color-blue)" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  <span className="n" ref={a1VotesRef}>6</span>
                </span>
                <span ref={commentsIconRef} className="stat comments-toggle">
                  <svg viewBox="0 0 14 12" width="13" height="12" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" fill="none" stroke="var(--color-blue)">
                    <path d="M1.5 1.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5.3L2.3 12v-2.5h-.8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
                  </svg>
                  <span>2</span>
                </span>
                <span className="endorsed">
                  <span className="star">&#9733;</span> Endorsed <span className="ecount">2</span>
                </span>
              </div>
              <div ref={commentsPanelRef} className="comments-panel">
                <div className="comment-row">
                  <div className="chead">
                    <span className="av av-2xs" style={{ background: '#BE123C' }}>T</span>
                    <span className="cname">Theo Bergstrom</span>
                    <span className="rolebadge pink">Creator</span>
                    <span className="ctime">&middot; Signal &amp; Noise &middot; Mar 3</span>
                  </div>
                  <p className="cbody">Not one of them said anything, not even the ones that thought about it. That&rsquo;s what&rsquo;s sticking with me.</p>
                  <div className="cfoot">
                    <span className="stat">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1L9 8H1L5 1Z" stroke="var(--color-ink-faint)" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                      <span className="n">3</span>
                    </span>
                  </div>
                </div>
                <div className="comment-row">
                  <div className="chead">
                    <span className="av av-2xs" style={{ background: '#7E22CE' }}>S</span>
                    <span className="cname">Sana Kader</span>
                    <span className="rolebadge pink">Journalist</span>
                    <span className="ctime">&middot; The Signal Weekly &middot; Mar 3</span>
                  </div>
                  <p className="cbody">Is &lsquo;warning shot&rsquo; the right frame, or does it undersell how close this actually got? Curious where researchers disagree.</p>
                  <div className="cfoot">
                    <span className="stat">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1L9 8H1L5 1Z" stroke="var(--color-ink-faint)" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                      <span className="n">1</span>
                    </span>
                  </div>
                </div>
              </div>
              <div ref={cursorRef} className="cursor" aria-hidden="true">
                <svg ref={cursorGlyphRef} className="cursor-glyph" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 1.5L14.5 7.6L8.7 9.2L7.1 15L2 1.5Z" fill="var(--color-ink)" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div ref={answer2Ref} className="answer reveal">
              <div className="author-row">
                <span className="av av-xs square" style={{ background: 'var(--color-blue-ink)' }}>F</span>
                <div className="meta">
                  <div className="aname-row">
                    <span className="aname">Foresight Commons</span>
                    <span className="rolebadge blue">Organisation</span>
                  </div>
                  <div className="cred">AI policy &middot; existential risk &middot; Mar 3</div>
                </div>
              </div>
              <p className="abody">
                We study incidents like this closely, and this one is worse than what came before it, not
                just more widely covered. The real question isn&rsquo;t only what these systems can do
                today. It&rsquo;s whether anyone stays in control as more capable ones arrive, and that&rsquo;s
                what we research and push lawmakers on.
              </p>
              <div className="afoot">
                <span className="stat">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L9 8H1L5 1Z" stroke="var(--color-blue)" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  <span className="n" ref={a2VotesRef}>4</span>
                </span>
                <span className="endorsed">
                  <span className="star">&#9733;</span> Endorsed <span className="ecount">1</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div ref={fadeRef} className="card-fade" />
      </div>

      <style>{`
        /* Proportional 15% size reduction (2026-09-24) — zoom shrinks real
           layout (unlike transform:scale, which only shrinks the paint and
           leaves the pre-shrink space reserved in the grid row), so every
           getBoundingClientRect()/scrollHeight call in the effect above
           already sees the smaller, post-zoom numbers consistently — no
           changes needed to the cursor/height-fit math above. */
        .qa-demo{zoom:.85;}
        .qa-demo .card-viewport{position:relative;height:40rem;overflow:hidden;border:2px solid var(--color-ink);background:var(--color-paper);}
        .qa-demo .card{padding:20px 24px;}
        .qa-demo .card-fade{position:absolute;left:0;right:0;bottom:0;height:4.5rem;background:linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--color-paper) 78%);pointer-events:none;z-index:6;}

        .qa-demo .reveal{opacity:0;transform:translateY(8px);transition:opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1);}
        .qa-demo .reveal.show{opacity:1;transform:translateY(0);}

        .qa-demo .author-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-family:var(--font-mono);font-size:9.5px;color:var(--color-ink-soft);}
        .qa-demo .av{border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-weight:700;}
        .qa-demo .av-2xs{width:18px;height:18px;font-size:7px;}
        .qa-demo .av-xs{width:32px;height:32px;font-size:12px;background:var(--color-blue);}
        .qa-demo .av.square{border-radius:5px;}
        .qa-demo .name-strong{font-weight:700;color:var(--color-ink);}
        .qa-demo .rolebadge{font-family:var(--font-mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;border-radius:4px;padding:2px 6px;flex-shrink:0;}
        .qa-demo .rolebadge.pink{color:var(--color-pink-ink);border:1px solid rgba(240,25,126,.2);}
        .qa-demo .rolebadge.blue{color:var(--color-blue);border:1px solid rgba(30,79,235,.2);}
        .qa-demo .faint{color:var(--color-ink-faint);}

        .qa-demo .qtext{font-family:var(--font-display);font-size:1.22rem;font-weight:800;color:var(--color-ink);line-height:1.28;margin:14px 0 16px;}

        .qa-demo .stats-row{display:flex;align-items:center;gap:16px;margin-bottom:18px;}
        .qa-demo .stat{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:11px;color:var(--color-ink-soft);font-variant-numeric:tabular-nums;}
        .qa-demo .stat svg{flex-shrink:0;}
        .qa-demo .stat .n{display:inline-block;transition:transform .25s ease, color .25s ease;}
        .qa-demo .stat .n.pulse{transform:scale(1.35);color:var(--color-pink-ink);}

        .qa-demo .answers{display:flex;flex-direction:column;gap:12px;position:relative;}
        .qa-demo .answer{border-left:3px solid var(--color-blue);background:var(--color-paper-sunken-blue);padding:14px 16px;display:flex;flex-direction:column;gap:10px;position:relative;}
        .qa-demo .author-row{display:flex;align-items:center;gap:8px;}
        .qa-demo .author-row .meta{min-width:0;}
        .qa-demo .author-row .aname-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
        .qa-demo .author-row .aname{font-family:var(--font-display);font-size:.85rem;font-weight:800;color:var(--color-ink);}
        .qa-demo .author-row .cred{font-family:var(--font-mono);font-size:9px;color:var(--color-ink-faint);margin-top:2px;}
        .qa-demo .abody{font-family:var(--font-display);font-size:.96rem;line-height:1.68;color:var(--color-ink);}
        .qa-demo .afoot{display:flex;align-items:center;gap:16px;padding-top:2px;}
        .qa-demo .comments-toggle{cursor:pointer;}
        .qa-demo .comments-toggle.clicked svg{stroke:var(--color-pink-ink);}
        .qa-demo .comments-toggle.clicked span{color:var(--color-pink-ink);}

        .qa-demo .endorsed{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--color-blue-ink);}
        .qa-demo .endorsed .star{font-size:11px;line-height:1;}
        .qa-demo .endorsed .ecount{font-variant-numeric:tabular-nums;}

        .qa-demo .comments-panel{max-height:0;opacity:0;overflow:hidden;transition:max-height .5s cubic-bezier(.16,1,.3,1), opacity .35s ease;
          margin-left:22px;padding-left:14px;border-left:2px solid var(--color-line-strong);display:flex;flex-direction:column;gap:8px;}
        .qa-demo .comments-panel.open{max-height:16rem;opacity:1;margin-top:6px;}
        .qa-demo .comment-row{background:var(--color-paper);border:1px solid var(--color-line);border-radius:3px;padding:8px 10px;}
        .qa-demo .comment-row .chead{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-bottom:4px;}
        .qa-demo .comment-row .av-2xs{width:16px;height:16px;font-size:6.5px;}
        .qa-demo .comment-row .cname{font-family:var(--font-display);font-size:.72rem;font-weight:700;color:var(--color-ink);}
        .qa-demo .comment-row .rolebadge{font-size:7px;padding:1.5px 5px;}
        .qa-demo .comment-row .ctime{font-family:var(--font-mono);font-size:8px;color:var(--color-ink-faint);}
        .qa-demo .comment-row .cbody{font-family:var(--font-display);font-size:.82rem;line-height:1.5;color:var(--color-ink-soft);margin-bottom:6px;}
        .qa-demo .comment-row .cfoot{display:flex;align-items:center;}
        .qa-demo .comment-row .stat{font-size:9.5px;gap:4px;}
        .qa-demo .comment-row .stat svg{width:8px;height:8px;}

        .qa-demo .cursor{position:absolute;top:0;left:0;width:18px;height:18px;opacity:0;transition:transform .7s cubic-bezier(.65,0,.35,1), opacity .3s ease;pointer-events:none;z-index:5;}
        .qa-demo .cursor.visible{opacity:1;}
        .qa-demo .cursor-glyph{display:block;transition:transform .15s ease;transform-origin:22% 18%;}
        .qa-demo .cursor-glyph.pulse{transform:scale(.78);}
      `}</style>
    </div>
  )
}
