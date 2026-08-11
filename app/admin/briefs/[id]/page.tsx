import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBrief, getMediaPickerOptions } from '@/lib/admin/brief-actions'
import EditBriefScreen from './EditBriefScreen'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBriefPage({ params }: Props) {
  const { id } = await params

  // Same auth check as the main admin page
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  const [{ brief, sections, error }, mediaOptions] = await Promise.all([
    getBrief(id),
    getMediaPickerOptions(),
  ])

  if (error || !brief) notFound()

  return (
    <EditBriefScreen
      adminEmail={user.email!}
      brief={brief}
      sections={sections}
      mediaOptions={mediaOptions}
    />
  )
}
