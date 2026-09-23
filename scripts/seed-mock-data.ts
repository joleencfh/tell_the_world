import { createClient } from '@supabase/supabase-js'
// Bun natively reads .env.local — no dotenv needed.
//
// Populates the app with realistic-looking demo data: 20 users (5 per
// public-facing role), 25 quote posts, 14 media posts, and 4 fully-fleshed
// briefs (explainer, sources, FAQ, CTAs, coverage, community Q&A). Titles,
// names, and other label-type text are written to sound credible; all
// paragraph-level body copy is genuine lorem ipsum filler — this seeds
// layout/volume for demo purposes, not real editorial content. Safe to
// re-run: users are looked up by email before creating an auth account, and
// each brief's owned rows (sections, FAQ answers, CTAs, coverage, questions)
// are deleted and reinserted every run. Never touches the 3 real accounts
// or the two `test-*` Playwright-fixture briefs already in the database.
//
// Mock data lives alongside this file in scripts/seed-mock-data/ (split
// 2026-09-17, max-lines cleanup) — lorem.ts (filler text generator),
// format.ts (section-content formatters), users.ts, content.ts (quotes/
// media), briefs.ts. This file keeps the seeding logic that writes it all
// to Supabase.

import { lorem, keytermParagraph } from './seed-mock-data/lorem'
import { formatTLDR, formatSources, formatFAQ, slugify } from './seed-mock-data/format'
import { ALL_USERS, AFFILIATIONS, type MockUser } from './seed-mock-data/users'
import { QUOTES, MEDIA } from './seed-mock-data/content'
import { BRIEFS } from './seed-mock-data/briefs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function ensureUser(u: MockUser): Promise<string> {
  const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).maybeSingle()
  let id: string
  if (existing) {
    id = existing.id
  } else {
    const { data: authData, error } = await supabase.auth.admin.createUser({ email: u.email, email_confirm: true })
    if (error || !authData.user) throw new Error(`createUser failed for ${u.email}: ${error?.message}`)
    id = authData.user.id
  }
  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id,
        email: u.email,
        full_name: u.full_name,
        display_name: u.full_name,
        bio: u.bio,
        avatar_url: u.avatar_url,
        role: u.role,
        availability: u.availability,
        preferred_language: 'en',
        ...u.fields,
      },
      { onConflict: 'id' },
    )
  if (upsertError) throw new Error(`users upsert failed for ${u.email}: ${upsertError.message}`)
  return id
}

async function main() {
  console.log(`Seeding ${ALL_USERS.length} mock users...`)
  const idByName = new Map<string, string>()
  for (const u of ALL_USERS) {
    const id = await ensureUser(u)
    idByName.set(u.full_name, id)
  }
  console.log('✓ Users seeded:', idByName.size)

  // user_affiliations
  await supabase.from('user_affiliations').delete().in(
    'user_id',
    AFFILIATIONS.map(([expert]) => idByName.get(expert)!),
  )
  const affiliationRows = AFFILIATIONS.map(([expert, org]) => ({
    user_id: idByName.get(expert)!,
    organisation_id: idByName.get(org)!,
    is_primary: true,
  }))
  const { error: affError } = await supabase.from('user_affiliations').insert(affiliationRows)
  if (affError) console.error('user_affiliations insert failed:', affError)
  else console.log('✓ Affiliations seeded:', affiliationRows.length)

  // Clear any previously-seeded quotes/media owned by these mock users (idempotent re-run)
  const mockUserIds = ALL_USERS.map((u) => idByName.get(u.full_name)!)
  await supabase.from('content_posts').delete().in('user_id', mockUserIds)

  console.log(`Seeding ${QUOTES.length} quotes...`)
  const quoteRows = QUOTES.map((q) => ({
    user_id: idByName.get(q.author)!,
    post_type: 'quote' as const,
    title: q.title,
    body: lorem(24 + (q.title.length % 12)),
    topic_tags: [q.tag],
  }))
  const { error: quoteError } = await supabase.from('content_posts').insert(quoteRows)
  if (quoteError) throw new Error(`quotes insert failed: ${quoteError.message}`)
  console.log('✓ Quotes seeded:', quoteRows.length)

  console.log(`Seeding ${MEDIA.length} media posts...`)
  const mediaRows = MEDIA.map((m) => ({
    user_id: idByName.get(m.author)!,
    post_type: m.post_type,
    title: m.title,
    body: lorem(40),
    url: `https://example.com/media/${slugify(m.title)}`,
    topic_tags: [m.tag],
  }))
  const { data: insertedMedia, error: mediaError } = await supabase.from('content_posts').insert(mediaRows).select('id, topic_tags')
  if (mediaError || !insertedMedia) throw new Error(`media insert failed: ${mediaError?.message}`)
  console.log('✓ Media seeded:', insertedMedia.length)

  // Pin the first media post per tag as each brief's pinned_media_post_id
  const pinnedByTag = new Map<string, string>()
  for (const m of insertedMedia) {
    const tag = m.topic_tags[0]
    if (tag && !pinnedByTag.has(tag)) pinnedByTag.set(tag, m.id)
  }

  for (const brief of BRIEFS) {
    console.log(`\nSeeding brief: ${brief.title}`)

    const { data: briefRow, error: briefError } = await supabase
      .from('briefs')
      .upsert(
        {
          title: brief.title,
          slug: brief.slug,
          subtitle: brief.subtitle,
          topic_tags: [brief.topic_tag],
          pinned_media_post_id: pinnedByTag.get(brief.topic_tag) ?? null,
          visibility: brief.visibility,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single()
    if (briefError || !briefRow) throw new Error(`brief upsert failed for ${brief.slug}: ${briefError?.message}`)
    const briefId = briefRow.id

    // brief_sections — delete then reinsert, mirroring seed-test-brief.ts
    await supabase.from('brief_sections').delete().eq('brief_id', briefId)

    const explainerParagraphs = brief.explainer.map(
      (s) =>
        keytermParagraph(s.term1, s.def1, 140) + '\n\n' + keytermParagraph(s.term2, s.def2, 140),
    )

    const sectionsToInsert = [
      { brief_id: briefId, section_type: 'tldr' as const, display_order: 1, content: formatTLDR(brief.tldr) },
      ...brief.explainer.map((s, i) => ({
        brief_id: briefId,
        section_type: 'explainer' as const,
        display_order: 2 + i,
        title: s.title,
        content: explainerParagraphs[i],
      })),
      {
        brief_id: briefId,
        section_type: 'going_deeper' as const,
        display_order: 2 + brief.explainer.length,
        content: formatSources(brief.sources),
      },
      {
        brief_id: briefId,
        section_type: 'faq' as const,
        display_order: 3 + brief.explainer.length,
        content: formatFAQ(brief.faq),
      },
    ]
    const { data: insertedSections, error: sectionsError } = await supabase
      .from('brief_sections')
      .insert(sectionsToInsert)
      .select('id, section_type, display_order')
    if (sectionsError || !insertedSections) throw new Error(`sections insert failed for ${brief.slug}: ${sectionsError?.message}`)
    console.log('  ✓ Sections:', insertedSections.length)

    const explainerSectionIds = insertedSections
      .filter((s) => s.section_type === 'explainer')
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.id)

    // brief_faq_answers
    await supabase.from('brief_faq_answers').delete().eq('brief_id', briefId)
    const faqAnswerRows = brief.extraAnswerQuestions.flatMap(([question, authors]) =>
      authors.map((author) => ({
        brief_id: briefId,
        question,
        author_user_id: idByName.get(author)!,
        body: lorem(35),
        status: 'published' as const,
      })),
    )
    if (faqAnswerRows.length > 0) {
      const { error } = await supabase.from('brief_faq_answers').insert(faqAnswerRows)
      if (error) console.error('  brief_faq_answers insert failed:', error)
      else console.log('  ✓ FAQ answers:', faqAnswerRows.length)
    }

    // brief_ctas
    await supabase.from('brief_ctas').delete().eq('brief_id', briefId)
    const ctaRows = brief.ctas.map((c) => ({
      brief_id: briefId,
      author_user_id: c.author ? idByName.get(c.author)! : null,
      title: c.title,
      description: lorem(20),
      link_url: `https://example.com/ctas/${slugify(c.title)}`,
      status: 'published' as const,
    }))
    const { error: ctaError } = await supabase.from('brief_ctas').insert(ctaRows)
    if (ctaError) console.error('  brief_ctas insert failed:', ctaError)
    else console.log('  ✓ CTAs:', ctaRows.length)

    // brief_coverage
    await supabase.from('brief_coverage').delete().eq('brief_id', briefId)
    const submitter = idByName.get(brief.questions[0].asker)!
    const coverageRows = brief.coverage.map((c, i) => ({
      brief_id: briefId,
      outlet_name: c.outlet,
      title: c.title,
      url: `https://example.com/coverage/${slugify(c.outlet)}/${slugify(c.title)}`,
      image_url: `https://picsum.photos/seed/${slugify(brief.slug + '-' + i)}/560/315`,
      published_date: new Date(Date.now() - (i + 1) * 4 * 86400000).toISOString().slice(0, 10),
      score: c.score,
      submitted_by: submitter,
      status: 'published' as const,
    }))
    const { error: coverageError } = await supabase.from('brief_coverage').insert(coverageRows)
    if (coverageError) console.error('  brief_coverage insert failed:', coverageError)
    else console.log('  ✓ Coverage:', coverageRows.length)

    // questions + question_answers (+ a light sprinkle of votes/endorsements)
    await supabase.from('questions').delete().eq('brief_id', briefId)
    for (const q of brief.questions) {
      const { data: questionRow, error: questionError } = await supabase
        .from('questions')
        .insert({ brief_id: briefId, user_id: idByName.get(q.asker)!, question_text: q.text, status: 'approved' as const })
        .select('id')
        .single()
      if (questionError || !questionRow) {
        console.error('  question insert failed:', questionError)
        continue
      }
      const answerRows = q.answerers.map((a) => ({
        question_id: questionRow.id,
        author_user_id: idByName.get(a)!,
        body: lorem(45),
      }))
      const { data: insertedAnswers, error: answerError } = await supabase.from('question_answers').insert(answerRows).select('id')
      if (answerError) console.error('  question_answers insert failed:', answerError)

      // Light vote/endorsement sprinkle on the first question only, from a
      // couple of the brief's own asker/answerer pool — just enough to show
      // the pink/blue vote-split UI isn't empty.
      if (q === brief.questions[0]) {
        const voters = [q.asker, ...q.answerers].map((n) => idByName.get(n)!)
        await supabase.from('question_votes').insert(voters.map((user_id) => ({ question_id: questionRow.id, user_id })))
        if (insertedAnswers && insertedAnswers[0]) {
          await supabase
            .from('question_answer_votes')
            .insert(voters.map((user_id) => ({ answer_id: insertedAnswers[0].id, user_id })))
          await supabase
            .from('question_answer_endorsements')
            .insert({ answer_id: insertedAnswers[0].id, user_id: idByName.get(q.asker)! })
        }
      }
    }
    console.log('  ✓ Questions:', brief.questions.length)

    // brief_contributions — brief-level + per-explainer-section endorsements
    // so the "Reviewed by N experts" bar and subsection badges aren't empty.
    await supabase.from('brief_contributions').delete().eq('brief_id', briefId).is('section_id', null)
    for (const id of explainerSectionIds) {
      await supabase.from('brief_contributions').delete().eq('brief_id', briefId).eq('section_id', id)
    }
    const reviewerPool = brief.questions.flatMap((q) => q.answerers).filter((n, i, arr) => arr.indexOf(n) === i)
    const briefLevelReviewers = reviewerPool.slice(0, 3)
    const { error: contribError } = await supabase.from('brief_contributions').insert(
      briefLevelReviewers.map((name) => ({
        brief_id: briefId,
        user_id: idByName.get(name)!,
        type: 'endorsement' as const,
        status: 'published' as const,
        section_id: null,
        section_version: 1,
      })),
    )
    if (contribError) console.error('  brief-level contributions insert failed:', contribError)

    if (explainerSectionIds[0]) {
      await supabase.from('brief_contributions').insert(
        reviewerPool.slice(0, 2).map((name) => ({
          brief_id: briefId,
          user_id: idByName.get(name)!,
          type: 'endorsement' as const,
          status: 'published' as const,
          section_id: explainerSectionIds[0],
          section_version: 1,
        })),
      )
    }
    if (explainerSectionIds[1] && reviewerPool[2]) {
      await supabase.from('brief_contributions').insert({
        brief_id: briefId,
        user_id: idByName.get(reviewerPool[2])!,
        type: 'review' as const,
        status: 'published' as const,
        section_id: explainerSectionIds[1],
        section_version: 1,
      })
    }
    console.log('  ✓ Contributions seeded')

    console.log(`Navigate to: http://localhost:3000/briefs/${brief.slug}`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
