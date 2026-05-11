// app/settings/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { GmailSettingsPanel } from '@/components/settings/GmailSettingsPanel'
import { PeriodSettingsPanel } from '@/components/settings/PeriodSettingsPanel'
import { FixedBudgetsPanel } from '@/components/settings/FixedBudgetsPanel'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: token }, { data: settings }] = await Promise.all([
    supabase
      .from('gmail_tokens')
      .select('is_active, last_sync, expires_at')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('user_settings')
      .select('period_start_day')
      .eq('user_id', user.id)
      .single(),
  ])

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-20 md:pb-6">
        <h1 className="text-xl font-medium text-gray-100">Configuración</h1>
        <PeriodSettingsPanel currentDay={settings?.period_start_day ?? 1} />
        <FixedBudgetsPanel />
        <GmailSettingsPanel token={token} />
      </main>
    </div>
  )
}
