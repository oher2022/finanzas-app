// app/transactions/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { TransactionCalendar } from '@/components/transactions/TransactionCalendar'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { getTransactionsInPeriod, getFixedBudgets, getUserSettings } from '@/lib/dashboard-queries'
import { getPeriodBounds } from '@/lib/period-utils'
import Link from 'next/link'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const offset = parseInt(searchParams.period ?? '0') || 0
  const settings = await getUserSettings()
  const period = getPeriodBounds(settings.period_start_day, offset)

  const [transactions, fixedBudgets] = await Promise.all([
    getTransactionsInPeriod(period.startStr, period.endStr),
    getFixedBudgets(),
  ])

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <PeriodSelector label={period.label} offset={offset} />
            <h1 className="text-sm text-gray-400">Transacciones</h1>
          </div>
          <Link
            href="/transactions/new"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(91,127,232,0.2)', color: '#8aabf0', border: '0.5px solid rgba(91,127,232,0.3)' }}
          >
            + Agregar manual
          </Link>
        </div>

        <TransactionCalendar
          transactions={transactions}
          fixedBudgets={fixedBudgets}
          startDate={period.startStr}
          endDate={period.endStr}
        />
      </main>
    </div>
  )
}
