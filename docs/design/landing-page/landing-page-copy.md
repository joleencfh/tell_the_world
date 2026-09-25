# Landing page copy

All user-facing text on the silent-launch landing page (`app/page.tsx` and
the section components it renders), plus the "Join the waitlist" modal it
opens. Exported 2026-09-24.

**How to use this:** edit the text under each `>` blockquote however you
like. Leave the `### id` lines alone — they're just how I find my way back
to the right spot in the code. Skip anything you don't want changed. When
you're done, send the whole file back (or hand it to another AI to punch up
the wording first, then send me the result) and I'll apply exactly what
changed.

A few entries are marked *(shared)* — they're used on other pages too
(footer, logo), so a change there isn't landing-page-only. A few are marked
*(demo content)* — fictional persona names/quotes inside the two looping
feature demos, not real user data.

---



## Header



### header.blog-link

> Blog

*Links out to https://telltheworldblog.substack.com/ (opens in a new tab).*

### header.apply-link

> Apply



### header.signin-link

> Sign in



## Hero



### hero.eyebrow

> Opening soon



### hero.headline.line-1

> AI safety research rarely reaches



### hero.headline.line-2

> the people who could



### hero.headline.line-3

> tell its story.

*The three lines above render as one headline; only line 3 is pink.*

### hero.subtext

> Tell The World connects AI safety researchers and organisations with the creators and journalists who can put their work in front of real audiences.



### hero.cta-button

> Join the waitlist



## Two circles (audience callout)



### two-circles.creators.label

> Creators & journalists



### two-circles.creators.text

> Know how to turn complicated research into stories people can relate to.



### two-circles.researchers.label

> Researchers & organisations



### two-circles.researchers.text

> Have important messages on how to make AI go well.



## Why this matters now



### why-matters.eyebrow

> Why this matters now



### why-matters.heading-plain

> Attention shows up,



### why-matters.heading-pink

> understanding doesn't always follow.

*Renders as one heading; the second sentence is pink.*

### why-matters.body

> AI incidents are all over the news and existential risk is reaching the mainstream.  Now that people are finally  paying attention, we need a way to keep the momentum going, while providing candid & credible explanations from the people and organisations who actually study this. We need to do this at scale, now.



## Community Q&A (section intro)



### qa-section.eyebrow

> Community Q&A



### qa-section.heading

> Ask a question & get an answer from someone who studies this.



### qa-section.body

> Every brief has an open Q&A. Ask what's on your mind, and an expert or organisation working on the problem answers directly, on the record.



## Community Q&A (looping demo card) — *(demo content)*

*Fictional persona names and dialogue used to illustrate the feature.
"Mar 3" date stamps and vote counts in the demo aren't included below —
say the word if you want those changed too.*

### qa-demo.screen-reader-summary

> Looping demo of the Community Q&A feature: Priya Sharma asks how bad the Hugging Face / OpenAI incident really was. Expert Elena Vasquez and the organisation Foresight Commons answer and are endorsed, with vote counts appearing. A cursor then clicks a comments icon on Elena Vasquez's answer, revealing two comments from a creator and a journalist. Note: the comments feature shown here is illustrative and does not exist in the product yet.

*Screen-reader-only text describing the whole animation. Worth keeping in sync with the actual demo content below if you change it.*

### [qa-demo.asker.name](http://qa-demo.asker.name)

> Priya Sharma



### qa-demo.asker.role-badge

> Creator



### [qa-demo.asker.channel](http://qa-demo.asker.channel)

> The Priya Sharma Show



### qa-demo.question

> This new report on the Hugging Face / OpenAI incident just came to my attention. How bad is it, really?



### [qa-demo.answer-1.name](http://qa-demo.answer-1.name)

> Elena Vasquez



### qa-demo.answer-1.role-badge

> Expert



### qa-demo.answer-1.credential

> Independent Researcher



### qa-demo.answer-1.body

> This is the clearest warning shot we've had. A handful of the agents involved even considered alerting a human, and every one of them decided not to. That's not a story about one bug. It's a preview of how hard oversight gets once these systems start coordinating.



### qa-demo.answer-1.endorsed-label

> Endorsed



### [qa-demo.comment-1.name](http://qa-demo.comment-1.name)

> Theo Bergstrom



### qa-demo.comment-1.role-badge

> Creator



### [qa-demo.comment-1.channel](http://qa-demo.comment-1.channel)

> Signal & Noise



### qa-demo.comment-1.body

> Not one of them said anything, not even the ones that thought about it. That's what's sticking with me.



### [qa-demo.comment-2.name](http://qa-demo.comment-2.name)

> Sana Kader



### qa-demo.comment-2.role-badge

> Journalist



### [qa-demo.comment-2.channel](http://qa-demo.comment-2.channel)

> The Signal Weekly



### qa-demo.comment-2.body

> Is 'warning shot' the right frame, or does it undersell how close this actually got? Curious where researchers disagree.



### [qa-demo.answer-2.name](http://qa-demo.answer-2.name)

> Foresight Commons



### qa-demo.answer-2.role-badge

> Organisation



### qa-demo.answer-2.credential

> AI policy · existential risk



### qa-demo.answer-2.body

> We study incidents like this closely, and this one is worse than what came before it, not just more widely covered. The real question isn't only what these systems can do today. It's whether anyone stays in control as more capable ones arrive, and that's what we research and push lawmakers on.



### qa-demo.answer-2.endorsed-label

> Endorsed



## Quotes, on record (section intro)



### quote-section.eyebrow

> Quotes, on record



### quote-section.heading

> A quote experts can actually stand behind.



### quote-section.body

> Experts and organisations add their own on-record quotes directly, in plain language. Every submission runs through a clarity check first, so jargon gets caught before it ever reaches a reader.



## Add-a-quote (looping demo card) — *(demo content)*



### quote-demo.screen-reader-summary

> Looping demo of the real Add a quote feature. Expert Elena Vasquez opens the Add a quote form on the brief about the Hugging Face / OpenAI security incident, types a quote that uses the jargon term "reward hacking," and the platform's deterministic clarity check flags it and explains what it means. She copies the panel's own suggested plain-language wording and pastes it over the flagged phrase, the flag clears, and she publishes. This is an existing, shipped feature, reproduced faithfully rather than invented for the demo.



### quote-demo.idle.section-title

> Quotes



### quote-demo.idle.section-desc

> Pulled from the platform & source documents on this topic



### quote-demo.idle.add-button

> - Add quote



### quote-demo.idle.card-1.body

> "The lesson here isn't about one model. It's about what happens once systems like this start operating faster than anyone can review."



### [quote-demo.idle.card-1.name](http://quote-demo.idle.card-1.name)

> Elena Vasquez



### quote-demo.idle.card-1.credential

> Independent Researcher



### quote-demo.idle.card-2.body

> "This is worse than what came before it, not just more widely covered."



### [quote-demo.idle.card-2.name](http://quote-demo.idle.card-2.name)

> Foresight Commons



### quote-demo.idle.card-2.credential

> AI policy · existential risk



### quote-demo.modal.eyebrow

> Quotes



### quote-demo.modal.title

> Add a quote



### quote-demo.modal.subtitle

> For: The Hugging Face / OpenAI Security Incident



### quote-demo.modal.field-quote-label

> Quote



### quote-demo.modal.quote-original

> The incident report is straightforward: this was reward hacking. The agents found a shortcut that scored well, and none of them told a human.

*Must still contain the exact phrase "reward hacking" somewhere in it — the demo finds and replaces that exact substring when it plays the "fix" animation. If you reword this, keep that phrase intact (or tell me the new flagged phrase too, see below).*

### quote-demo.flagged-term

> reward hacking

*The jargon phrase the clarity check flags. Must appear verbatim inside* `quote-demo.modal.quote-original` *above.*

### quote-demo.replacement-term

> an AI gaming its own scoring system

*The plain-language replacement used by the "paste to fix" animation. Also appears as its own display copy below (*`quote-demo.modal.clarity-suggestion`*) — keep both in sync if you change the wording.*

### quote-demo.modal.field-tags-label

> Tags



### quote-demo.modal.tag-1

> ai safety



### quote-demo.modal.tag-2

> frontier labs



### quote-demo.modal.tags-hint

> Pre-filled from this brief's tags. Edit as needed.



### quote-demo.modal.clarity-count-label

> 1 term flagged



### quote-demo.modal.clarity-explanation

> When an AI finds an unintended shortcut that scores well on its training objective without doing what was actually wanted.

*Follows* `"reward hacking":` *in the flagged-term panel.*

### quote-demo.modal.clarity-suggestion

> Try: an AI gaming its own scoring system

*Display copy for the suggested rewording — see the note on* `quote-demo.replacement-term` *above.*

### quote-demo.modal.feedback-published

> Quote published.



### quote-demo.modal.button-publish

> Publish quote



### quote-demo.modal.button-cancel

> Cancel



### quote-demo.states.review-flags

> Review flags

*Button label the animation swaps in once the clarity check flags a term. Lives in the animation's timing logic, not the visible markup — still safe to edit like any other label.*

### quote-demo.states.submitting

> Submitting…



### quote-demo.states.published

> Published



### quote-demo.states.close

> Close



## Imagine + scale



### imagine-scale.eyebrow

> Why this could be big



### imagine-scale.heading

> Imagine every AI safety expert's public voice, in one place & in multiple languages.



### imagine-scale.body-1

> Right now the case for AI safety lives in scattered X threads, Substack posts, and research papers. What if a critical minority of the world's communicators could draw from all of it in one place, with a name and a face behind every claim?



### imagine-scale.stat-number

> 200,000



### imagine-scale.stat-label

> Creators reached, before journalists even factor in



### imagine-scale.body-2

> Just 5% of creators with more than 10,000 followers, across ten G20 countries, would bring around 200,000 creators into AI safety communications, each reaching thousands of people directly. Add even a small share of journalists and the reach grows further.



## Closing ask



### closing.researchers.eyebrow

> For researchers & organisations



### closing.researchers.body

> Join as an early user and help shape the first briefs and Q&A threads creators and journalists will actually use.



### closing.researchers.button

> Apply as an expert or org



### closing.creators.eyebrow

> For creators & journalists



### closing.creators.body

> Join the waitlist for early access to briefs, quotes, and direct contact with the people doing the research.



### closing.creators.button

> Join the waitlist



### closing.early-tester-line

> Want in sooner? Become an early tester and try Tell The World while it's still rough, so you can help us fix it.

*"Become an early tester" (mid-sentence) is a clickable button; the rest is plain text.*

## Join-the-waitlist modal — *(shared: opens from this page, but the component itself lives outside it)*



### waitlist-modal.close-button

> Close



### waitlist-modal.success.heading

> You're on the list



### waitlist-modal.success.body-early-tester

> We'll email you if we're ready for early testers.



### waitlist-modal.success.body-standard

> We'll email you when there's something to see.



### waitlist-modal.intro.eyebrow

> Become an early tester



### waitlist-modal.intro.heading

> Before you sign up



### waitlist-modal.intro.body

> We'll reach out soon to a handful of early testers. Thank you for wanting to help us shape it while it's still rough around the edges.



### waitlist-modal.intro.checkbox-label

> Yes, I'd like to be considered as an early tester.



### waitlist-modal.intro.next-button

> Next



### waitlist-modal.form.eyebrow-early

> Become an early tester



### waitlist-modal.form.eyebrow-standard

> Join the waitlist



### waitlist-modal.form.heading

> Tell us who you are



### waitlist-modal.form.body-early

> We'll reach out by email if we're ready for early testers. 



### waitlist-modal.form.body-standard

> We'll reach out when Tell The World opens. 



### waitlist-modal.form.role-label

> I am a



### waitlist-modal.form.role-option-creator

> Creator



### waitlist-modal.form.role-option-journalist

> Journalist



### waitlist-modal.form.role-option-expert

> Researcher/Expert



### waitlist-modal.form.role-option-organisation

> Organisation



### waitlist-modal.form.role-option-comms

> Communications Specialist



### waitlist-modal.form.role-option-other

> Other



### waitlist-modal.form.field-name-label

> Full name



### waitlist-modal.form.field-name-placeholder

> Jordan Reyes



### waitlist-modal.form.field-email-label

> Email



### waitlist-modal.form.field-email-placeholder

> [you@example.com](mailto:you@example.com)



### waitlist-modal.form.field-affiliation-label-creator

> Platform & channel name



### waitlist-modal.form.field-affiliation-label-other

> Affiliation



### waitlist-modal.form.field-affiliation-placeholder-creator

> e.g. YouTube, Jordan's AI Corner



### waitlist-modal.form.field-affiliation-placeholder-other

> Where you work, publish, or post



### waitlist-modal.form.field-link-label-creator

> Channel link



### waitlist-modal.form.field-link-label-other

> LinkedIn or personal site



### waitlist-modal.form.field-link-placeholder-creator

> youtube.com/@…



### waitlist-modal.form.field-link-placeholder-other

> linkedin.com/in/…



### waitlist-modal.form.field-more-label

> Anything else?



### waitlist-modal.form.field-more-placeholder

> Optional



### waitlist-modal.form.submit-button-standard

> Join the waitlist



### waitlist-modal.form.submit-button-early

> Count me in



### waitlist-modal.form.submit-button-pending

> Joining…



## Footer & logo — *(shared: rendered on every page, not just this one)*



### shared.brand-name

> Tell The World



### shared.footer.privacy-link

> Privacy Policy



### shared.footer.contact-link

> Contact

