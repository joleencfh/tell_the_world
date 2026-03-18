import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Insert briefs (upsert so re-running is safe)
  const { data: briefs, error: briefError } = await supabase
    .from('briefs')
    .upsert([
      {
        title: 'Test Public Brief',
        slug: 'test-public-brief',
        tldr: 'This is a publicly visible test brief used for end-to-end testing. It is safe to ignore.',
        visibility: 'public',
      },
      {
        title: 'Test Members Brief',
        slug: 'test-members-brief',
        tldr: 'This is a members-only test brief used for end-to-end testing. It is safe to ignore.',
        visibility: 'members_only',
      },
    ], { onConflict: 'slug' })
    .select('id, slug')

  if (briefError) {
    console.error('Failed to insert briefs:', briefError.message)
    process.exit(1)
  }

  console.log('✓ Test briefs upserted')

  // Insert one section per brief so section headings render
  for (const brief of briefs!) {
    // Clear existing sections first so re-runs are safe
    await supabase.from('brief_sections').delete().eq('brief_id', brief.id)

    const { error: sectionError } = await supabase
      .from('brief_sections')
      .insert([
        {
          brief_id: brief.id,
          section_type: 'recent_developments',
          content: 'Test content for recent developments.',
          display_order: 1,
        },
        {
          brief_id: brief.id,
          section_type: 'sources_basic',
          content: '• Test Source — A basic source for testing.\nhttps://example.com',
          display_order: 2,
        },
      ])

    if (sectionError) {
      console.error(`Failed to insert sections for ${brief.slug}:`, sectionError.message)
      process.exit(1)
    }

    console.log(`  ✓ Sections added for ${brief.slug}`)
  }

  console.log('\nAll test data seeded. Run: bun run playwright test tests/briefs.spec.ts')
}

main()
