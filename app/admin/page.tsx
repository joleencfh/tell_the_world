import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingApplications, getRecentlyApproved } from '@/lib/admin/actions'
import AdminScreen from './AdminScreen'

export default async function AdminPage() {
  // Auth check — server-side, before any data is fetched or UI is rendered
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  // Fetch data with the service-role client (bypasses RLS)
  const [pendingResult, approvedResult] = await Promise.all([
    getPendingApplications(),
    getRecentlyApproved(),
  ])

  return (
    <AdminScreen
      adminEmail={user.email!}
      pending={pendingResult.data}
      approved={approvedResult.data}
    />
  )
}
