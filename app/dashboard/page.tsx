// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getDailyExpenses,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyHistory,
  getUserSettings,
  getIncomeEntries,
  getPeriodSummary,
  getFixedBudgetStatuses,
  getPersonalExpenses,
  getSavingsAllocations,
} from '@/lib/dashboard-queries'
import { getPeriodBounds } from '@/lib/period-utils'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { DailyChart } from '@/components/dashboard/DailyChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { TransactionList } from '@/components/transactions/TransactionList'
import { MonthlyHistoryChart } from '@/components/dashboard/MonthlyHistoryChart'
import { GmailSyncButton } from '@/components/dashboard/GmailSyncButton'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { IncomePanel } from '@/components/dashboard/IncomePanel'
import { FixedBudgetPanel } from '@/components/dashboard/FixedBudgetPanel'
import { Navbar } from '@/components/ui/Navbar'

export default async function DashboardPage({
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

  const [periodSummary, incomes, dailyExpenses, categories, recentTxns, history, fixedStatuses, personalExpenses, savings] = await Promise.all([
    getPeriodSummary(period.startStr, period.endStr),
    getIncomeEntries(period.startStr, period.endStr),
    getDailyExpenses(period.startStr, period.endStr),
    getCategoryBreakdown(period.startStr, period.endStr),
    getRecentTransactions(8),
    getMonthlyHistory(6),
    getFixedBudgetStatuses(period.startStr, period.endStr),
    getPersonalExpenses(period.startStr, period.endStr),
    getSavingsAllocations(),
  ])

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <PeriodSelector label={period.label} offset={offset} />
          <GmailSyncButton userId={user.id} />
        </div>

        {/* Fila principal: Ingresos + Gastos fijos + Categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <IncomePanel
            incomes={incomes}
            periodStart={period.startStr}
            periodEnd={period.endStr}
          />
          {(fixedStatuses.length > 0 || savings.length > 0) && (
            <FixedBudgetPanel
              fixedStatuses={fixedStatuses}
              savings={savings}
              personalExpenses={personalExpenses}
              totalIncome={periodSummary.total_income}
            />
          )}
          <BudgetProgress categories={categories} summary={null} />
        </div>

        {/* Fila: Barras diarias + Historial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <DailyChart data={dailyExpenses} average={Math.round(periodSummary.net_expenses / Math.max(dailyExpenses.filter(d => d.amount > 0).length, 1))} />
          <MonthlyHistoryChart data={history} />
        </div>

        {/* Desglose por categoría */}
        <CategoryBreakdown categories={categories} />

        {/* Transacciones recientes */}
        <TransactionList transactions={recentTxns} title="Últimas transacciones" showViewAll fixedBudgets={fixedStatuses} />
      </main>
    </div>
  )
}
