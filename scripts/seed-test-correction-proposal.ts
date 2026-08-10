import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Find any brief
  const { data: brief, error: briefError } = await supabase
    .from('briefs')
    .select('id, title')
    .limit(1)
    .single()

  if (briefError || !brief) {
    console.error('No briefs found. Create a brief first.', briefError?.message)
    process.exit(1)
  }

  // Find any expert or organisation user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, display_name, role')
    .in('role', ['expert', 'organisation'])
    .limit(1)
    .single()

  if (userError || !user) {
    console.error('No expert or organisation users found.', userError?.message)
    process.exit(1)
  }

  // Insert test correction proposal
  const { data, error } = await supabase
    .from('brief_correction_proposals')
    .insert({
      brief_id: brief.id,
      user_id: user.id,
      contribution_text:
        'This is a test correction proposal. The section on recent developments should mention the EU AI Act enforcement timeline — enforcement begins in stages from 2025, with the highest-risk systems facing obligations first. A link to the official EU AI Act page would strengthen the sources section.',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to insert correction proposal:', error.message)
    process.exit(1)
  }

  console.log('✓ Test correction proposal inserted')
  console.log(`  Brief:       ${brief.title}`)
  console.log(`  Contributor: ${user.display_name ?? user.id} (${user.role})`)
  console.log(`  ID:          ${data.id}`)
}

main()
