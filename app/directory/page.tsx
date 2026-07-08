import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchUsers, searchQuotes } from '@/lib/directory/queries'
import type { SearchParams } from '@/lib/directory/queries'
import DirectoryView from './DirectoryView'

function toPage(v: string | string[] | undefined): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 1
}

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
    upage:        str(raw.upage),
    qpage:        str(raw.qpage),
  }

  const [users, quotes] = await Promise.all([
    searchUsers(supabase, params, toPage(raw.upage)),
    searchQuotes(supabase, params, toPage(raw.qpage)),
  ])

  return (
    <DirectoryView
      users={users.data}
      usersCount={users.count}
      quotes={quotes.data}
      quotesCount={quotes.count}
      searchParams={params}
      currentUserId={user.id}
    />
  )
}
