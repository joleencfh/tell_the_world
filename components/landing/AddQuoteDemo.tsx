'use client'

import { useEffect, useRef } from 'react'

// Ported from docs/design/landing-page/quote-feature-loop-concept.html
// (built and signed off — see conference-landing-page-plan.md §0's sign-off
// history). Same markup, CSS and animation-timeline logic as the concept
// file, translated into refs + useEffect instead of getElementById + an
// inline <script>. Persona (Elena Vasquez) is unchanged — this is the demo
// the Q&A loop unified onto, not the other way round.
//
// The fixed-height fade-viewport mechanic is kept exactly as built: measure
// both possible resting states (clarity-flagged vs. published) by briefly
// forcing each visible, keep the max, then refit on ResizeObserver — same
// "measure the resting content, let anything past it fade instead of
// resize" approach as the Q&A loop, adapted for a modal with two possible
// end states instead of one collapsed one.
//
// One deliberate change from the concept file: the dark backdrop is its own
// element (.modal-backdrop, position:absolute;inset:0) instead of being the
// background/opacity of .modal-overlay itself. In the concept file,
// .modal-overlay only grows as tall as its own content (the modal card), so
// in the shorter "published" resting state it left the remainder of the
// fixed-height card-viewport showing plain white behind it instead of
// staying darkened. Splitting the backdrop out to its own full-height layer
// fixes that with no dependency on flexbox stretch behavior — .modal-overlay
// keeps doing only what it did before (centering the card), the backdrop
// always covers the full box regardless of the card's height.
//
// CSS is scoped under .aq-demo rather than renamed per-class, so it ports
// close to verbatim from the concept file (which already references the
// app's real design tokens via var(--color-x)/var(--font-x)). The concept
// file's 2px pink outline on the card viewport was a debug aid for viewing
// it in isolation; production uses the signed-off layout mockup's plain 2px
// ink border instead.
export default function AddQuoteDemo() {
  const FLAGGED_TERM = 'reward hacking'
  const REPLACEMENT_TERM = 'an AI gaming its own scoring system'
  const QUOTE_ORIGINAL =
    'The incident report is straightforward: this was reward hacking. The agents found a shortcut that scored well, and none of them told a human.'
  const QUOTE_REVISED = QUOTE_ORIGINAL.replace(FLAGGED_TERM, REPLACEMENT_TERM)

  const cardViewportRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const idleScreenRef = useRef<HTMLDivElement>(null)
  const addQuoteBtnRef = useRef<HTMLButtonElement>(null)
  const modalBackdropRef = useRef<HTMLDivElement>(null)
  const modalOverlayRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)
  const fieldQuoteRef = useRef<HTMLDivElement>(null)
  const fieldTagsRef = useRef<HTMLDivElement>(null)
  const fakeTextareaRef = useRef<HTMLDivElement>(null)
  const typedTextRef = useRef<HTMLSpanElement>(null)
  const clarityPanelRef = useRef<HTMLDivElement>(null)
  const clarityTermRef = useRef<HTMLSpanElement>(null)
  const claritySuggestionRef = useRef<HTMLSpanElement>(null)
  const feedbackMsgRef = useRef<HTMLParagraphElement>(null)
  const primaryBtnRef = useRef<HTMLButtonElement>(null)
  const secondaryBtnRef = useRef<HTMLButtonElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorGlyphRef = useRef<SVGSVGElement>(null)
  const clickRingRef = useRef<HTMLDivElement>(null)
  const selectionHighlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cardViewport = cardViewportRef.current
    const fade = fadeRef.current
    const idleScreen = idleScreenRef.current
    const addQuoteBtn = addQuoteBtnRef.current
    const modalBackdrop = modalBackdropRef.current
    const modalOverlay = modalOverlayRef.current
    const modalCard = modalCardRef.current
    const fieldQuote = fieldQuoteRef.current
    const fieldTags = fieldTagsRef.current
    const fakeTextarea = fakeTextareaRef.current
    const typedText = typedTextRef.current
    const clarityPanel = clarityPanelRef.current
    const clarityTerm = clarityTermRef.current
    const claritySuggestion = claritySuggestionRef.current
    const feedbackMsg = feedbackMsgRef.current
    const primaryBtn = primaryBtnRef.current
    const secondaryBtn = secondaryBtnRef.current
    const cursor = cursorRef.current
    const cursorGlyph = cursorGlyphRef.current
    const clickRing = clickRingRef.current
    const selectionHighlight = selectionHighlightRef.current

    if (
      !cardViewport || !fade || !idleScreen || !addQuoteBtn || !modalBackdrop || !modalOverlay || !modalCard ||
      !fieldQuote || !fieldTags || !fakeTextarea || !typedText || !clarityPanel || !clarityTerm ||
      !claritySuggestion || !feedbackMsg || !primaryBtn || !secondaryBtn || !cursor || !cursorGlyph ||
      !clickRing || !selectionHighlight
    ) {
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const FADE_BUFFER_PX = 30

    function computeModalHeight() {
      const clarityWasShown = clarityPanel!.classList.contains('show')
      const feedbackWasShown = feedbackMsg!.classList.contains('show')

      clarityPanel!.classList.add('show')
      feedbackMsg!.classList.remove('show')
      const hFlagged = modalCard!.scrollHeight

      clarityPanel!.classList.remove('show')
      feedbackMsg!.classList.add('show')
      const hPublished = modalCard!.scrollHeight

      clarityPanel!.classList.toggle('show', clarityWasShown)
      feedbackMsg!.classList.toggle('show', feedbackWasShown)

      return Math.max(hFlagged, hPublished)
    }

    function fitViewport() {
      const modalHeight = computeModalHeight()
      const fadeHeight = fade!.getBoundingClientRect().height || 72
      cardViewport!.style.height = `${modalHeight + fadeHeight + FADE_BUFFER_PX}px`
    }

    function fitViewportSoon() {
      requestAnimationFrame(() => requestAnimationFrame(fitViewport))
    }

    fitViewport()
    fitViewportSoon()
    const fontsSafetyNet = setTimeout(fitViewport, 350)
    document.fonts?.ready?.then(fitViewportSoon)

    let lastWidth = cardViewport!.getBoundingClientRect().width
    const resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (Math.abs(w - lastWidth) > 1) {
        lastWidth = w
        fitViewport()
      }
    })
    resizeObserver.observe(cardViewport!)

    function showModal(show: boolean) {
      modalBackdrop!.classList.toggle('show', show)
      modalOverlay!.classList.toggle('show', show)
    }

    // .aq-demo carries a CSS `zoom` (the size-reduction pass) on an ancestor
    // of cardViewport, cursor, and every element these functions measure.
    // getBoundingClientRect() reports PHYSICAL (post-zoom) coordinates, but
    // `transform: translate()` — like every other layout/paint property —
    // is resolved in the LOCAL (pre-zoom) coordinate system and gets
    // zoomed again on top of whatever value we hand it. Feeding a raw
    // physical delta straight into translate() double-applies the zoom and
    // makes the cursor undershoot every move (worse the smaller zoom is —
    // this went from a subtle 15% undershoot to an obvious 25% one when
    // the Add-a-quote demo's zoom was tightened from .85 to .75), which is
    // what read as "the cursor sits too high" — it wasn't nudged up, it
    // just never travelled as far down/right as it was supposed to.
    // Dividing the measured delta by zoom converts it back to the local
    // value that actually produces the intended physical displacement.
    // zoom is set on .aq-demo (an ANCESTOR of cardViewport), and CSS zoom
    // isn't an inherited property for computed-style purposes — reading it
    // off cardViewport itself would just report the initial value (1), a
    // silent no-op. closest('.aq-demo') gets the element the rule actually
    // applies to.
    const aqRoot = cardViewport!.closest('.aq-demo') as HTMLElement
    const zoom = parseFloat(getComputedStyle(aqRoot).zoom) || 1

    function rectToLocal(rect: DOMRect) {
      const hostBox = cardViewport!.getBoundingClientRect()
      return {
        x: (rect.left - hostBox.left) / zoom,
        y: (rect.top - hostBox.top) / zoom,
        width: rect.width / zoom,
        height: rect.height / zoom,
      }
    }

    function positionCursorNear(el: Element, dx: number, dy: number) {
      const hostBox = cardViewport!.getBoundingClientRect()
      const elBox = el.getBoundingClientRect()
      cursor!.style.transition = 'none'
      cursor!.style.transform = `translate(${(elBox.left - hostBox.left) / zoom + dx}px, ${(elBox.top - hostBox.top) / zoom + dy}px)`
      cursor!.getBoundingClientRect()
      cursor!.style.transition = ''
    }

    function moveCursorTo(el: Element) {
      const r = rectToLocal(el.getBoundingClientRect())
      const x = r.x + r.width / 2 - 3
      const y = r.y + r.height / 2 - 3
      cursor!.style.transform = `translate(${x}px, ${y}px)`
    }

    function moveCursorToRect(rect: DOMRect) {
      const r = rectToLocal(rect)
      const x = r.x + r.width / 2 - 3
      const y = r.y + r.height / 2 - 3
      cursor!.style.transform = `translate(${x}px, ${y}px)`
    }

    function clickPulse(targetEl?: HTMLElement) {
      cursorGlyph!.classList.add('pulse')
      setTimeout(() => cursorGlyph!.classList.remove('pulse'), 150)
      clickRing!.classList.remove('ping')
      void clickRing!.offsetWidth
      clickRing!.classList.add('ping')
      if (targetEl) {
        targetEl.classList.add('pressed')
        setTimeout(() => targetEl.classList.remove('pressed'), 160)
      }
    }

    // Finds the on-screen rect of a substring inside the typed-text node via
    // the Range API, so the cursor/highlight can point at the exact flagged
    // phrase without adding inline highlighting to the text itself — the
    // real ClarityFlagsPanel never highlights jargon inline, only lists it
    // below the field.
    function findTextRect(phrase: string) {
      const node = typedText!.firstChild
      if (!node || !node.textContent) return null
      const full = node.textContent
      const idx = full.indexOf(phrase)
      if (idx === -1) return null
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + phrase.length)
      return range.getBoundingClientRect()
    }

    function showSelectionHighlight(rect: DOMRect) {
      const r = rectToLocal(rect)
      selectionHighlight!.style.transform = `translate(${r.x - 2}px, ${r.y - 1}px)`
      selectionHighlight!.style.width = `${r.width + 4}px`
      selectionHighlight!.style.height = `${r.height + 2}px`
      selectionHighlight!.classList.add('show')
    }

    function hideSelectionHighlight() {
      selectionHighlight!.classList.remove('show')
    }

    if (reduced) {
      idleScreen!.style.opacity = '0'
      showModal(true)
      fieldQuote!.classList.add('show')
      fieldTags!.classList.add('show')
      typedText!.textContent = QUOTE_REVISED
      clarityPanel!.classList.remove('show')
      feedbackMsg!.classList.add('show')
      primaryBtn!.textContent = 'Published'
      primaryBtn!.classList.add('disabled')
      secondaryBtn!.textContent = 'Close'
      hideSelectionHighlight()
      fitViewportSoon()
      return () => {
        clearTimeout(fontsSafetyNet)
        resizeObserver.disconnect()
      }
    }

    let timers: ReturnType<typeof setTimeout>[] = []
    let typeTimer: ReturnType<typeof setInterval> | null = null
    function clearTimers() {
      timers.forEach(clearTimeout)
      timers = []
      if (typeTimer) {
        clearInterval(typeTimer)
        typeTimer = null
      }
    }
    function at(ms: number, fn: () => void) {
      timers.push(setTimeout(fn, ms))
    }

    function typeTextIn(text: string, totalMs: number, onDone?: () => void) {
      typedText!.textContent = ''
      let i = 0
      const interval = Math.max(14, totalMs / text.length)
      typeTimer = setInterval(() => {
        i++
        typedText!.textContent = text.slice(0, i)
        if (i >= text.length) {
          if (typeTimer) clearInterval(typeTimer)
          typeTimer = null
          onDone?.()
        }
      }, interval)
    }

    // There's no "apply suggestion" button in the real ClarityFlagsPanel —
    // it's a read-only list, the author has to fix the field themselves. So
    // the fix is played as copy-paste: select the panel's own suggested
    // wording, then paste it over the flagged phrase — instant, the way a
    // paste actually lands, not retyped.
    function pasteReplacement() {
      hideSelectionHighlight()
      const idx = QUOTE_ORIGINAL.indexOf(FLAGGED_TERM)
      const prefix = QUOTE_ORIGINAL.slice(0, idx)
      const suffix = QUOTE_ORIGINAL.slice(idx + FLAGGED_TERM.length)
      fakeTextarea!.style.opacity = '0.4'
      setTimeout(() => {
        typedText!.textContent = prefix + REPLACEMENT_TERM + suffix
        fakeTextarea!.style.opacity = '1'
      }, 160)
    }

    function runCycle() {
      clearTimers()

      cardViewport!.style.transition = 'none'
      cardViewport!.style.opacity = '1'
      idleScreen!.style.transition = 'none'
      idleScreen!.style.opacity = '1'
      addQuoteBtn!.classList.remove('pressed')
      primaryBtn!.classList.remove('pressed')
      clickRing!.classList.remove('ping')
      showModal(false)
      fieldQuote!.classList.remove('show')
      fieldTags!.classList.remove('show')
      clarityPanel!.classList.remove('show')
      feedbackMsg!.classList.remove('show')
      cursor!.classList.remove('visible')
      hideSelectionHighlight()
      typedText!.textContent = ''
      fakeTextarea!.style.opacity = '1'
      primaryBtn!.textContent = 'Publish quote'
      primaryBtn!.classList.remove('disabled')
      secondaryBtn!.textContent = 'Cancel'
      cardViewport!.getBoundingClientRect()
      cardViewport!.style.transition = 'opacity .5s ease'
      idleScreen!.style.transition = 'opacity .4s ease'

      at(900, () => {
        positionCursorNear(addQuoteBtn!, -26, -22)
        cursor!.classList.add('visible')
      })
      at(1600, () => moveCursorTo(addQuoteBtn!))
      at(3350, () => clickPulse(addQuoteBtn!))
      at(3600, () => {
        idleScreen!.style.opacity = '0'
        showModal(true)
      })
      at(3900, () => cursor!.classList.remove('visible'))

      at(4100, () => fieldQuote!.classList.add('show'))
      at(4400, () => fieldTags!.classList.add('show'))
      at(4700, () => {
        typeTextIn(QUOTE_ORIGINAL, 2800, () => {
          at(1000, () => {
            clarityPanel!.classList.add('show')
            primaryBtn!.textContent = 'Review flags'
          })
        })
      })

      at(9600, () => {
        positionCursorNear(clarityTerm!, -22, -18)
        cursor!.classList.add('visible')
      })
      at(9850, () => moveCursorTo(clarityTerm!))

      at(12950, () => moveCursorTo(claritySuggestion!))
      at(14550, () => showSelectionHighlight(claritySuggestion!.getBoundingClientRect()))
      at(15250, () => {
        hideSelectionHighlight()
        clickPulse()
      })

      at(15400, () => {
        const rect = findTextRect(FLAGGED_TERM)
        if (rect) moveCursorToRect(rect)
      })
      at(17000, () => {
        const rect = findTextRect(FLAGGED_TERM)
        if (rect) showSelectionHighlight(rect)
      })
      at(17700, () => {
        pasteReplacement()
        clickPulse()
      })
      at(17900, () => {
        clarityPanel!.classList.remove('show')
        primaryBtn!.textContent = 'Publish quote'
      })

      at(19200, () => moveCursorTo(primaryBtn!))
      at(20700, () => {
        clickPulse(primaryBtn!)
        primaryBtn!.textContent = 'Submitting…'
      })
      at(21000, () => {
        cursor!.classList.remove('visible')
        primaryBtn!.textContent = 'Published'
        primaryBtn!.classList.add('disabled')
        secondaryBtn!.textContent = 'Close'
        feedbackMsg!.classList.add('show')
      })

      at(23200, () => {
        cardViewport!.style.opacity = '0.15'
      })
      at(24000, runCycle)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="aq-demo mx-auto w-full max-w-[26rem]">
      <p className="sr-only">
        Looping demo of the real Add a quote feature. Expert Elena Vasquez opens the Add a quote form on
        the brief about the Hugging Face / OpenAI security incident, types a quote that uses the jargon
        term &ldquo;reward hacking,&rdquo; and the platform&rsquo;s deterministic clarity check flags it
        and explains what it means. She copies the panel&rsquo;s own suggested plain-language wording and
        pastes it over the flagged phrase, the flag clears, and she publishes. This is an existing, shipped
        feature, reproduced faithfully rather than invented for the demo.
      </p>

      <div ref={cardViewportRef} className="card-viewport">
        <div ref={idleScreenRef} className="idle-screen">
          <div className="sec-rule-row">
            <span className="sec-num">03</span>
            <span className="sec-rule" />
          </div>
          <div className="sec-head-row">
            <div>
              <h2 className="sec-title">Quotes</h2>
              <p className="sec-desc">Pulled from the platform &amp; source documents on this topic</p>
            </div>
            <button ref={addQuoteBtnRef} className="add-quote-btn" type="button">+ Add quote</button>
          </div>
          <div className="idle-cards" aria-hidden="true">
            <div className="idle-card">
              <div className="idle-card-top">
                <span className="idle-card-date">MAR 3</span>
                <div className="idle-card-icons">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="5.5" y="5.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2.5 10.5v-8a1 1 0 0 1 1-1h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="idle-card-heart">
                    <svg width="12" height="11" viewBox="0 0 16 14" aria-hidden>
                      <path d="M8 13.2S1.4 9.3 1.4 4.9C1.4 2.7 3.1 1 5.2 1c1.2 0 2.2.6 2.8 1.5C8.6 1.6 9.6 1 10.8 1c2.1 0 3.8 1.7 3.8 3.9 0 4.4-6.6 8.3-6.6 8.3Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    4
                  </span>
                </div>
              </div>
              <p className="idle-card-body">&ldquo;The lesson here isn&rsquo;t about one model. It&rsquo;s about what happens once systems like this start operating faster than anyone can review.&rdquo;</p>
              <div className="idle-card-foot">
                <span className="idle-avatar">E</span>
                <div>
                  <p className="idle-card-name">Elena Vasquez</p>
                  <p className="idle-card-cred">Independent Researcher</p>
                </div>
              </div>
            </div>
            <div className="idle-card">
              <div className="idle-card-top">
                <span className="idle-card-date">MAR 3</span>
                <div className="idle-card-icons">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="5.5" y="5.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2.5 10.5v-8a1 1 0 0 1 1-1h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="idle-card-heart">
                    <svg width="12" height="11" viewBox="0 0 16 14" aria-hidden>
                      <path d="M8 13.2S1.4 9.3 1.4 4.9C1.4 2.7 3.1 1 5.2 1c1.2 0 2.2.6 2.8 1.5C8.6 1.6 9.6 1 10.8 1c2.1 0 3.8 1.7 3.8 3.9 0 4.4-6.6 8.3-6.6 8.3Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    1
                  </span>
                </div>
              </div>
              <p className="idle-card-body">&ldquo;This is worse than what came before it, not just more widely covered.&rdquo;</p>
              <div className="idle-card-foot">
                <span className="idle-avatar square">F</span>
                <div>
                  <p className="idle-card-name">Foresight Commons</p>
                  <p className="idle-card-cred">AI policy &middot; existential risk</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={modalBackdropRef} className="modal-backdrop" />

        <div ref={modalOverlayRef} className="modal-overlay">
          <div ref={modalCardRef} className="modal-card">
            <div className="modal-head">
              <div>
                <p className="modal-eyebrow">Quotes</p>
                <h2 className="modal-title">Add a quote</h2>
                <p className="modal-sub">For: The Hugging Face / OpenAI Security Incident</p>
              </div>
              <span className="modal-close" aria-hidden="true">&times;</span>
            </div>
            <div className="modal-body">
              <div ref={fieldQuoteRef} className="reveal">
                <label className="field-label">Quote</label>
                <div ref={fakeTextareaRef} className="fake-textarea">
                  <span ref={typedTextRef} />
                  <span className="caret" />
                </div>
              </div>

              <div ref={fieldTagsRef} className="reveal">
                <label className="field-label">Tags</label>
                <div className="tags-row">
                  <span className="tag-chip">ai safety</span>
                  <span className="tag-chip">frontier labs</span>
                </div>
                <p className="hint">Pre-filled from this brief&rsquo;s tags. Edit as needed.</p>
              </div>

              <div ref={clarityPanelRef} className="reveal">
                <div className="clarity-box">
                  <p className="clarity-count">1 term flagged</p>
                  <p className="clarity-item">
                    <span ref={clarityTermRef} className="clarity-term">&ldquo;reward hacking&rdquo;</span>: When an AI
                    finds an unintended shortcut that scores well on its training objective without doing
                    what was actually wanted.
                    <span ref={claritySuggestionRef} className="clarity-suggestion">Try: an AI gaming its own scoring system</span>
                  </p>
                </div>
              </div>

              <p ref={feedbackMsgRef} className="feedback-text reveal">Quote published.</p>

              <div className="modal-actions">
                <button ref={primaryBtnRef} className="primary-btn" type="button">Publish quote</button>
                <button ref={secondaryBtnRef} className="secondary-btn" type="button">Cancel</button>
              </div>
            </div>
          </div>

          <div ref={selectionHighlightRef} className="selection-highlight" aria-hidden="true" />
          <div ref={cursorRef} className="cursor" aria-hidden="true">
            <svg ref={cursorGlyphRef} className="cursor-glyph" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 1.5L14.5 7.6L8.7 9.2L7.1 15L2 1.5Z" fill="var(--color-ink)" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
            </svg>
            <div ref={clickRingRef} className="click-ring" />
          </div>
        </div>

        <div ref={fadeRef} className="card-fade" />
      </div>

      <style>{`
        /* Proportional size reduction (2026-09-24, .85; tightened to .75
           2026-09-26) — same reasoning as QACommunityDemo.tsx's matching
           comment: zoom shrinks real layout, so every measurement the
           effect above takes already reflects the smaller size
           consistently, no JS changes needed. The extra reduction fixes
           .sec-head-row (the idle screen's "Quotes" title + "+ Add quote"
           button) wrapping onto two lines on narrow phones — .sec-desc's
           13rem max-width makes its flex sibling claim a full 208px of
           local width regardless of how little the actual text needs, and
           at .85 zoom a phone-width column doesn't have enough local room
           left over for the button once that's accounted for. A lower zoom
           gives every local measurement more physical room to work with
           without changing anything's *relative* proportions.
           (Desktop/tablet columns are wide enough that .sec-head-row was
           never actually short on room — max-w-[26rem] binds there, not
           the viewport, so this only bites on phones.) */
        .aq-demo{zoom:.75;}
        .aq-demo .card-viewport{position:relative;overflow:hidden;background:var(--color-paper);border:2px solid var(--color-ink);transition:opacity .5s ease;}
        .aq-demo .card-fade{position:absolute;left:0;right:0;bottom:0;height:4.5rem;background:linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--color-paper) 78%);pointer-events:none;z-index:6;}

        .aq-demo .reveal{opacity:0;transform:translateY(8px);transition:opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1);}
        .aq-demo .reveal.show{opacity:1;transform:translateY(0);}

        .aq-demo .idle-screen{position:absolute;inset:0;overflow:hidden;padding:28px 26px 0;transition:opacity .4s ease;}
        .aq-demo .sec-rule-row{display:flex;align-items:center;gap:14px;margin-bottom:14px;}
        .aq-demo .sec-num{font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:.18em;color:var(--color-blue);}
        .aq-demo .sec-rule{height:1px;flex:1;background:var(--color-line);}
        .aq-demo .sec-head-row{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:22px;}
        .aq-demo .sec-title{font-family:var(--font-display);font-weight:800;text-transform:uppercase;letter-spacing:.01em;font-size:1.55rem;line-height:1;color:var(--color-ink);margin:0;}
        .aq-demo .sec-desc{font-family:var(--font-display);font-style:italic;font-size:.76rem;color:var(--color-ink-soft);margin:8px 0 0;max-width:13rem;}
        .aq-demo .add-quote-btn{flex-shrink:0;border:2px solid var(--color-blue);background:var(--color-blue);color:#fff;padding:10px 18px;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;transition:transform .12s ease,box-shadow .12s ease;}
        .aq-demo .add-quote-btn.pressed{transform:scale(.93);box-shadow:inset 0 0 0 999px rgba(0,0,0,.15);}

        .aq-demo .idle-cards{display:flex;align-items:stretch;gap:14px;}
        .aq-demo .idle-card{width:196px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;border:1px solid var(--color-line);border-top:3px solid var(--color-blue);background:var(--color-paper);padding:14px;opacity:.55;}
        .aq-demo .idle-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
        .aq-demo .idle-card-date{font-family:var(--font-mono);font-size:9px;letter-spacing:.04em;color:var(--color-ink-faint);}
        .aq-demo .idle-card-icons{display:flex;align-items:center;gap:7px;color:var(--color-ink-faint);}
        .aq-demo .idle-card-heart{display:flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:9px;font-variant-numeric:tabular-nums;}
        .aq-demo .idle-card-body{flex:1;font-family:var(--font-display);font-size:.78rem;line-height:1.5;color:var(--color-ink);margin:0;}
        .aq-demo .idle-card-foot{display:flex;align-items:center;gap:8px;border-top:1px solid var(--color-line);padding-top:10px;}
        .aq-demo .idle-avatar{width:24px;height:24px;border-radius:50%;background:var(--color-blue);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:10px;flex-shrink:0;}
        .aq-demo .idle-avatar.square{border-radius:5px;background:var(--color-blue-ink);}
        .aq-demo .idle-card-name{font-family:var(--font-display);font-weight:800;font-size:.72rem;color:var(--color-ink);}
        .aq-demo .idle-card-cred{font-family:var(--font-mono);font-size:.58rem;color:var(--color-ink-soft);margin-top:1px;}

        /* Full-height dark scrim, decoupled from .modal-overlay (see the
           file header comment) so it always covers the whole card
           regardless of how tall the centered modal card is. */
        .aq-demo .modal-backdrop{position:absolute;inset:0;background:rgba(12,13,14,.55);opacity:0;pointer-events:none;transition:opacity .4s ease;}
        .aq-demo .modal-backdrop.show{opacity:1;}
        .aq-demo .modal-overlay{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;padding:1.75rem 1.1rem;opacity:0;pointer-events:none;transition:opacity .4s ease;}
        .aq-demo .modal-overlay.show{opacity:1;}
        .aq-demo .modal-card{width:100%;max-width:23rem;border:1px solid var(--color-line);background:var(--color-paper);box-shadow:0 18px 44px rgba(12,13,14,.18);}
        .aq-demo .modal-head{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid var(--color-line);padding:19px 21px 15px;}
        .aq-demo .modal-eyebrow{font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:.2em;color:var(--color-blue-ink);margin:0 0 5px;}
        .aq-demo .modal-title{font-family:var(--font-display);font-size:1.12rem;font-weight:800;text-transform:uppercase;color:var(--color-ink);margin:0;line-height:1.2;}
        .aq-demo .modal-sub{font-family:var(--font-display);font-size:.71rem;font-style:italic;color:var(--color-ink-soft);margin:5px 0 0;}
        .aq-demo .modal-close{width:25px;height:25px;flex-shrink:0;border-radius:999px;background:var(--color-paper-raised);color:var(--color-ink-soft);display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;margin-left:12px;}
        .aq-demo .modal-body{padding:17px 21px 26px;display:flex;flex-direction:column;gap:15px;}
        .aq-demo .field-label{display:block;font-family:var(--font-mono);font-size:9.5px;text-transform:uppercase;letter-spacing:.16em;color:var(--color-ink-faint);margin-bottom:7px;}
        .aq-demo .fake-textarea{border:1px solid var(--color-line);background:var(--color-paper);padding:10px 13px;font-family:var(--font-display);font-size:.83rem;color:var(--color-ink);min-height:5.5em;line-height:1.5;white-space:pre-wrap;transition:opacity .2s ease;}
        .aq-demo .caret{display:inline-block;width:1px;height:1em;background:var(--color-ink);vertical-align:text-bottom;margin-left:1px;animation:aq-demo-blink 1s step-start infinite;}
        @keyframes aq-demo-blink{50%{opacity:0;}}
        .aq-demo .tags-row{display:flex;flex-wrap:wrap;gap:6px;}
        .aq-demo .tag-chip{border:1px solid var(--color-line);padding:3px 9px;font-family:var(--font-mono);font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-ink-soft);}
        .aq-demo .hint{font-family:var(--font-display);font-size:.66rem;color:var(--color-ink-faint);margin:6px 0 0;}
        .aq-demo .clarity-box{border-left:3px solid var(--color-pink-ink);background:var(--color-paper-sunken-blue);padding:13px 15px;}
        .aq-demo .clarity-count{font-family:var(--font-mono);font-size:9.5px;text-transform:uppercase;letter-spacing:.16em;color:var(--color-pink-ink);margin:0 0 8px;}
        .aq-demo .clarity-item{font-family:var(--font-display);font-size:.76rem;line-height:1.55;color:var(--color-ink-soft);}
        .aq-demo .clarity-term{font-weight:700;color:var(--color-ink);}
        .aq-demo .clarity-suggestion{display:block;margin-top:3px;color:var(--color-ink-faint);}
        .aq-demo .feedback-text{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.09em;color:var(--color-blue-ink);line-height:1.5;margin:0;}
        .aq-demo .modal-actions{display:flex;align-items:center;gap:16px;padding-top:1px;}
        .aq-demo .primary-btn{background:var(--color-ink);color:var(--color-paper);padding:10px 19px;font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;transition:opacity .2s ease, transform .12s ease;}
        .aq-demo .primary-btn.disabled{opacity:.5;}
        .aq-demo .primary-btn.pressed{transform:scale(.94);}
        .aq-demo .secondary-btn{font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--color-ink-faint);}

        .aq-demo .cursor{position:absolute;top:0;left:0;width:18px;height:18px;opacity:0;transition:transform 1.4s cubic-bezier(.65,0,.35,1), opacity .3s ease;pointer-events:none;z-index:5;}
        .aq-demo .cursor.visible{opacity:1;}
        .aq-demo .cursor-glyph{display:block;transition:transform .15s ease;transform-origin:22% 18%;}
        .aq-demo .cursor-glyph.pulse{transform:scale(.78);}
        .aq-demo .click-ring{position:absolute;top:2px;left:2px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid var(--color-blue);opacity:0;}
        .aq-demo .click-ring.ping{animation:aq-demo-click-ring .55s ease-out;}
        @keyframes aq-demo-click-ring{0%{opacity:.9;transform:scale(.3);}100%{opacity:0;transform:scale(2.1);}}

        .aq-demo .selection-highlight{position:absolute;top:0;left:0;background:rgba(30,79,235,.28);border-radius:2px;pointer-events:none;opacity:0;transition:opacity .15s ease;z-index:3;}
        .aq-demo .selection-highlight.show{opacity:1;}
      `}</style>
    </div>
  )
}
