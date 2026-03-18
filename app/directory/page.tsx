import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchUsers, searchQuotes } from '@/lib/directory/queries'
import type { SearchParams } from '@/lib/directory/queries'
import DirectoryView from './DirectoryView'

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const raw = await searchParams

  // Coerce to optional strings — drop empty values so query functions skip those filters
  function str(v: string | string[] | undefined): string | undefined {
    const s = typeof v === 'string' ? v.trim() : undefined
    return s || undefined
  }

  const params: SearchParams = {
    q:            str(raw.q),
    role:         str(raw.role),
    language:     str(raw.language),
    topic:        str(raw.topic),
    availability: str(raw.availability),
  }

  const [users, quotes] = await Promise.all([
    searchUsers(supabase, params),
    searchQuotes(supabase, params),
  ])

  return (
    <DirectoryView
      users={users}
      quotes={quotes}
      searchParams={params}
      currentUserId={user.id}
    />
  )
}
