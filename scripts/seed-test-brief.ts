import { createClient } from '@supabase/supabase-js'
// Bun natively reads .env.local — no dotenv needed

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// The one mock brief for local dev/manual verification of the brief-v2 page.
// Bare-minimum placeholder text only — this seeds page STRUCTURE, not real
// reviewed content. Real briefs are authored via the admin editor.
async function seed() {
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .upsert(
      {
        title: 'AI Alignment: The Core Problem',
        slug: 'ai-alignment-core-problem',
        subtitle: '[Placeholder subtitle] One sentence, allowed a point of view.',
        topic_tag: 'alignment',
        pinned_media_post_id: null,
        visibility: 'public',
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (briefError || !brief) {
    console.error('Brief upsert failed:', briefError)
    process.exit(1)
  }

  console.log('✓ Brief upserted:', brief.id)

  // Delete existing sections so re-running this script is safe.
  await supabase.from('brief_sections').delete().eq('brief_id', brief.id)

  // TLDR text moved from the (now-retired) briefs.tldr column to its own
  // tldr-type section — see migration 017_brief_feature_schema.sql. Content
  // format changed in Two-Ink Bold Part 1: one bullet per line, optionally
  // starting with a **bold lead term** — em dash (parseTLDR in
  // app/briefs/[slug]/section-content.tsx).
  const sections = [
    {
      brief_id: brief.id,
      section_type: 'tldr',
      display_order: 1,
      // parseTLDR only recognizes a bold lead term when the line STARTS with
      // "**" — the placeholder marker has to go inside the bold span, not
      // before it, or the line falls back to unparsed plain text.
      content:
        '**[Placeholder] Compute race** — a short bullet line goes here.\n' +
        '[Placeholder] A second bullet line without a bold lead term goes here.\n' +
        '**[Placeholder] A third term** — a third bullet line goes here.',
    },
    // Explainer subsection with a title and an inline keyterm — Two-Ink Bold
    // Part 3: brief_sections.title (migration 018) + {{term|definition}}
    // authoring convention (tokenizeKeyterms in app/briefs/[slug]/explainer.tsx).
    {
      brief_id: brief.id,
      section_type: 'explainer',
      display_order: 2,
      title: '[Placeholder] A titled explainer subsection',
      content:
        '[Placeholder] A paragraph explaining the topic, with an inline {{keyterm|its placeholder definition}} to exercise the tooltip.\n\n' +
        '[Placeholder] A second paragraph goes here.',
    },
    {
      brief_id: brief.id,
      section_type: 'going_deeper',
      display_order: 3,
      // parseSources (app/briefs/[slug]/sources.tsx) needs at least 2 source
      // blocks to render at all — one block alone renders nothing.
      content:
        '• "[Placeholder] First source title" — a short description of the source\n' +
        'https://example.com/placeholder-source-1\n\n' +
        '• "[Placeholder] Second source title" — a short description of the source\n' +
        'https://example.com/placeholder-source-2',
    },
    {
      brief_id: brief.id,
      section_type: 'faq',
      display_order: 4,
      // Two questions: one gets seeded brief_faq_answers below (to exercise
      // "More answers"), one deliberately gets none (to confirm the toggle
      // correctly doesn't render at all when there are zero — two-ink-bold-
      // plan.md Part 4b).
      content:
        '[Placeholder]\nQ: A frequently asked question goes here.\nA: Its answer goes here.\n\n' +
        'Q: A second frequently asked question goes here.\nA: Its answer goes here.',
    },
  ]

  const { error: sectionsError } = await supabase.from('brief_sections').insert(sections)

  if (sectionsError) {
    console.error('Sections insert failed:', sectionsError)
    process.exit(1)
  }

  console.log('✓ Sections inserted:', sections.length)

  // Seed a couple of published brief_faq_answers rows under the first FAQ
  // question only — the second question intentionally gets none (Part 4b's
  // "More answers should not render at all when there are zero" case).
  // Reuses whatever expert/organisation accounts already exist rather than
  // hardcoding ids, so this stays safe to run against any environment.
  await supabase.from('brief_faq_answers').delete().eq('brief_id', brief.id)

  const { data: answerAuthors } = await supabase
    .from('users')
    .select('id, role')
    .in('role', ['expert', 'organisation'])
    .limit(2)

  if (!answerAuthors || answerAuthors.length === 0) {
    console.log('⚠ No expert/organisation users found — skipping brief_faq_answers seed.')
  } else {
    const question = 'A frequently asked question goes here.'
    const faqAnswers = answerAuthors.map((author, i) => ({
      brief_id: brief.id,
      question,
      author_user_id: author.id,
      body: `[Placeholder] Additional expert answer #${i + 1} to the above question goes here.`,
      status: 'published' as const,
    }))
    // Need at least 2 answers to exercise "More answers (N)" — reuse the
    // first author again if only one expert/org account exists locally.
    if (faqAnswers.length === 1) {
      faqAnswers.push({
        brief_id: brief.id,
        question,
        author_user_id: answerAuthors[0].id,
        body: '[Placeholder] Additional expert answer #2 to the above question goes here.',
        status: 'published' as const,
      })
    }

    const { error: faqAnswersError } = await supabase.from('brief_faq_answers').insert(faqAnswers)
    if (faqAnswersError) {
      console.error('brief_faq_answers insert failed:', faqAnswersError)
    } else {
      console.log('✓ brief_faq_answers seeded:', faqAnswers.length)
    }
  }

  // Seed published brief_ctas rows — enough to overflow the carousel (Part 6)
  // so its scroll/fade/prev-next behavior is actually exercisable, not just
  // a single static card. Mixes editorial (author_user_id null) and expert/
  // org-authored rows, and includes one long description to exercise the
  // card's line-clamp truncation.
  await supabase.from('brief_ctas').delete().eq('brief_id', brief.id)

  const ctaAuthors = answerAuthors && answerAuthors.length > 0 ? answerAuthors : []
  const authorFor = (i: number) => (ctaAuthors.length > 0 ? ctaAuthors[i % ctaAuthors.length].id : null)

  const ctas = [
    {
      brief_id: brief.id,
      author_user_id: null,
      title: '[Placeholder] Read the full report',
      description: '[Placeholder] The complete write-up this brief was distilled from.',
      link_url: 'https://example.com/placeholder-report',
      status: 'published' as const,
    },
    {
      brief_id: brief.id,
      author_user_id: null,
      title: '[Placeholder] Watch our explainer video',
      description: null,
      link_url: 'https://example.com/placeholder-video',
      status: 'published' as const,
    },
    {
      brief_id: brief.id,
      author_user_id: authorFor(0),
      title: '[Placeholder] Download the technical appendix',
      description: '[Placeholder] Methodology, data sources, and supporting figures.',
      link_url: 'https://example.com/placeholder-appendix',
      status: 'published' as const,
    },
    {
      brief_id: brief.id,
      author_user_id: authorFor(1),
      title: '[Placeholder] Subscribe to our policy briefing',
      description: '[Placeholder] A short recurring newsletter covering developments on this topic.',
      link_url: 'https://example.com/placeholder-subscribe',
      status: 'published' as const,
    },
    {
      brief_id: brief.id,
      author_user_id: authorFor(0),
      title: '[Placeholder] Long description example',
      description:
        '[Placeholder] This description is deliberately long to demonstrate the card\'s line-clamp truncation once it runs past four wrapped lines inside the fixed-width carousel card, so the overflow behavior is visible rather than assumed.',
      link_url: 'https://example.com/placeholder-long',
      status: 'published' as const,
    },
    {
      brief_id: brief.id,
      author_user_id: null,
      title: '[Placeholder] Explore the interactive model',
      description: '[Placeholder] A hands-on tool for exploring the scenarios discussed above.',
      link_url: 'https://example.com/placeholder-explore',
      status: 'published' as const,
    },
  ]

  const { error: ctasError } = await supabase.from('brief_ctas').insert(ctas)
  if (ctasError) {
    console.error('brief_ctas insert failed:', ctasError)
  } else {
    console.log('✓ brief_ctas seeded:', ctas.length)
  }

  console.log('\nNavigate to: http://localhost:3000/briefs/ai-alignment-core-problem')
}

seed()
