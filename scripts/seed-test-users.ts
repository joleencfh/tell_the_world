/**
 * Creates the fixture accounts the Playwright suite signs in as: a confirmed
 * auth user plus a matching row in public.users. Idempotent. Refuses to run
 * against the production project. CI runs it against the local Supabase stack.
 *
 *   bun scripts/seed-test-users.ts
 *
 * Briefs are seeded separately by scripts/seed-test-briefs.ts.
 */
import { createClient } from '@supabase/supabase-js'
import { assertNotProduction } from '../tests/helpers/db-guard'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assertNotProduction(url, 'seed-test-users')

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Names must not contain role words ("Expert"...): specs match badge text.
const fixtures = [
  { env: 'TEST_ADMIN_EMAIL', role: 'admin', name: 'Sam Fixture' },
  { env: 'TEST_CREATOR_EMAIL', role: 'creator', name: 'Robin Fixture' },
  { env: 'TEST_EXPERT_EMAIL', role: 'expert', name: 'Quinn Fixture' },
] as const

async function findAuthUserId(email: string): Promise<string | null> {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < 200) return null
  }
  return null
}

async function main() {
  for (const f of fixtures) {
    const email = process.env[f.env]
    if (!email) throw new Error(`${f.env} is not set`)

    let id = await findAuthUserId(email)
    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true })
      if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`)
      id = data.user.id
    }

    const { error } = await supabase.from('users').upsert(
      { id, email, role: f.role, full_name: f.name, display_name: f.name },
      { onConflict: 'id' },
    )
    if (error) throw new Error(`users upsert ${email}: ${error.message}`)
    console.log(`✓ ${f.role} fixture ready`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
