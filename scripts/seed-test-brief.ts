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
  // tldr-type section — see migration 017_brief_feature_schema.sql.
  const sections = [
    {
      brief_id: brief.id,
      section_type: 'tldr',
      display_order: 1,
      content: '[Placeholder TLDR] A 3–5 sentence quotable summary of the brief goes here.',
    },
    {
      brief_id: brief.id,
      section_type: 'featured_news',
      display_order: 2,
      content: '[Placeholder] A dated, recent news item and why it matters goes here.',
    },
    {
      brief_id: brief.id,
      section_type: 'going_deeper',
      display_order: 3,
      content: '[Placeholder] A resource pointer goes here.',
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

  console.log('\nNavigate to: http://localhost:3000/briefs/ai-alignment-core-problem')
}

seed()
