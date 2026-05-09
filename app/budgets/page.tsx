// app/budgets/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'

export default async function BudgetsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-medium text-gray-100 mb-2">Presupuestos</h1>
        <p className="text-sm text-gray-500">Próximamente: gestión de presupuestos por categoría.</p>
      </main>
    </div>
  )
}
