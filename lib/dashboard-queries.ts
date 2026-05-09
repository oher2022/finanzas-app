// lib/dashboard-queries.ts
// Todas las queries del dashboard. Corren server-side.

import { createClient } from '@/lib/supabase/server'
import { MonthSummary, DailyExpense, CategorySummary, Transaction, IncomeEntry, UserSettings, PeriodSummary, FixedBudget, FixedBudgetStatus } from '@/types'

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user_id: '', period_start_day: 1 }

  const { data } = await supabase
    .from('user_settings')
    .select('user_id, period_start_day')
    .eq('user_id', user.id)
    .single()

  return data ?? { user_id: user.id, period_start_day: 1 }
}

export async function getIncomeEntries(startDate: string, endDate: string): Promise<IncomeEntry[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('income_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return (data as IncomeEntry[]) ?? []
}

export async function getPeriodSummary(startDate: string, endDate: string): Promise<PeriodSummary> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const empty: PeriodSummary = {
    period_start: startDate, period_end: endDate,
    total_income: 0, total_expenses: 0, total_reimbursed: 0,
    net_expenses: 0, available: 0, available_pct: 0,
  }
  if (!user) return empty

  const [{ data: txns }, { data: incomes }] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, reimbursed_amount')
      .eq('user_id', user.id)
      .gte('txn_date', startDate)
      .lte('txn_date', endDate),
    supabase
      .from('income_entries')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  const totalExpenses  = txns?.reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const totalReimbursed = txns?.reduce((s, t) => s + Number(t.reimbursed_amount ?? 0), 0) ?? 0
  const totalIncome    = incomes?.reduce((s, i) => s + Number(i.amount), 0) ?? 0
  const netExpenses    = totalExpenses - totalReimbursed
  const available      = totalIncome - netExpenses
  const availablePct   = totalIncome > 0 ? Math.round((available / totalIncome) * 100) : 0

  return {
    period_start: startDate,
    period_end: endDate,
    total_income: Math.round(totalIncome),
    total_expenses: Math.round(totalExpenses),
    total_reimbursed: Math.round(totalReimbursed),
    net_expenses: Math.round(netExpenses),
    available: Math.round(available),
    available_pct: availablePct,
  }
}

export async function getMonthSummary(year: number, month: number): Promise<MonthSummary | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  // Gastos del mes actual
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, txn_date')
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)

  const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  // Gastos del mes anterior
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]

  const { data: prevTxns } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .gte('txn_date', prevStart)
    .lte('txn_date', prevEnd)

  const prevMonthTotal = prevTxns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  // Presupuesto mensual
  const { data: monthBudget } = await supabase
    .from('monthly_budgets')
    .select('amount')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)
    .single()

  const budgetTotal = monthBudget?.amount || 0

  // Categoría top
  const { data: topCatData } = await supabase
    .from('transactions')
    .select('amount, categories(name)')
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .not('category_id', 'is', null)

  const catTotals: Record<string, number> = {}
  topCatData?.forEach((t: any) => {
    const name = t.categories?.name || 'Otros'
    catTotals[name] = (catTotals[name] || 0) + Number(t.amount)
  })
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  // Proyección fin de mes
  const today = new Date()
  const daysElapsed = today.getDate()
  const daysInMonth = new Date(year, month, 0).getDate()
  const dailyAvg = daysElapsed > 0 ? totalExpenses / daysElapsed : 0
  const projectedTotal = Math.round(dailyAvg * daysInMonth)

  // TODO: ingresos (para versión futura con soporte de ingresos)
  const totalIncome = 0

  const vsPrevMonth = prevMonthTotal > 0
    ? ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100
    : 0

  return {
    month,
    year,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_balance: totalIncome - totalExpenses,
    savings_pct: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    daily_avg: Math.round(dailyAvg),
    projected_total: projectedTotal,
    budget_remaining: Math.max(0, budgetTotal - totalExpenses),
    budget_total: budgetTotal,
    budget_used_pct: budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0,
    top_category: topCategory,
    vs_prev_month_pct: Math.round(vsPrevMonth),
  }
}

export async function getDailyExpenses(startDate: string, endDate: string): Promise<DailyExpense[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select('txn_date, amount')
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .order('txn_date', { ascending: true })

  if (!data) return []

  const byDay: Record<string, { amount: number; count: number }> = {}
  data.forEach(t => {
    if (!byDay[t.txn_date]) byDay[t.txn_date] = { amount: 0, count: 0 }
    byDay[t.txn_date].amount += Number(t.amount)
    byDay[t.txn_date].count++
  })

  // Generar todos los días del período
  const days: DailyExpense[] = []
  const cursor = new Date(startDate)
  const end = new Date(endDate)
  while (cursor <= end) {
    const date = cursor.toISOString().split('T')[0]
    days.push({ date, amount: Math.round(byDay[date]?.amount || 0), count: byDay[date]?.count || 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export async function getCategoryBreakdown(startDate: string, endDate: string): Promise<CategorySummary[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`
      amount,
      categories (
        id, name, color, icon,
        monthly_budget
      )
    `)
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)

  if (!data) return []

  const byCategory: Record<string, CategorySummary> = {}
  let total = 0

  data.forEach((t: any) => {
    const cat = t.categories
    const key = cat?.id || 'no-category'
    total += Number(t.amount)

    if (!byCategory[key]) {
      byCategory[key] = {
        category_id: cat?.id || '',
        category_name: cat?.name || 'Sin categoría',
        category_color: cat?.color || '#888888',
        category_icon: cat?.icon || '💰',
        total: 0,
        pct: 0,
        budget: cat?.monthly_budget ? Number(cat.monthly_budget) : null,
        budget_used_pct: null,
      }
    }
    byCategory[key].total += Number(t.amount)
  })

  // Calcular porcentajes
  return Object.values(byCategory)
    .map(c => ({
      ...c,
      total: Math.round(c.total),
      pct: total > 0 ? Math.round((c.total / total) * 100) : 0,
      budget_used_pct: c.budget ? Math.round((c.total / c.budget) * 100) : null,
    }))
    .sort((a, b) => b.total - a.total)
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`*, categories (id, name, color, icon)`)
    .eq('user_id', user.id)
    .order('txn_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as Transaction[]) || []
}

export async function getTransactionsInPeriod(startDate: string, endDate: string): Promise<Transaction[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`*, categories (id, name, color, icon)`)
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .order('txn_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (data as Transaction[]) || []
}

export async function getMonthlyHistory(months = 6): Promise<Array<{ month: string; total: number }>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const result = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('txn_date', startDate)
      .lte('txn_date', endDate)

    const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    result.push({
      month: d.toLocaleString('es-CL', { month: 'short' }),
      total: Math.round(total),
    })
  }

  return result
}

export async function getFixedBudgets(): Promise<FixedBudget[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('fixed_budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('type', 'expense')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (data as FixedBudget[]) ?? []
}

export async function getSavingsAllocations(): Promise<FixedBudget[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('fixed_budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('type', 'saving')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (data as FixedBudget[]) ?? []
}

export async function getFixedBudgetStatuses(startDate: string, endDate: string): Promise<FixedBudgetStatus[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: budgets }, { data: txns }] = await Promise.all([
    supabase
      .from('fixed_budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('type', 'expense')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('transactions')
      .select('fixed_budget_id, amount, reimbursed_amount')
      .eq('user_id', user.id)
      .gte('txn_date', startDate)
      .lte('txn_date', endDate)
      .not('fixed_budget_id', 'is', null),
  ])

  // Agrupar pagos por fixed_budget_id
  const paidMap: Record<string, number> = {}
  txns?.forEach(t => {
    const net = Number(t.amount) - Number(t.reimbursed_amount ?? 0)
    paidMap[t.fixed_budget_id!] = (paidMap[t.fixed_budget_id!] ?? 0) + net
  })

  return (budgets ?? []).map((b: FixedBudget) => {
    const paid = Math.round(paidMap[b.id] ?? 0)
    const pct = b.amount > 0 ? Math.round((paid / b.amount) * 100) : 0
    return {
      ...b,
      paid_amount: paid,
      pct,
      status: paid >= b.amount ? 'paid' : paid > 0 ? 'partial' : 'pending',
    }
  })
}

export async function getPersonalExpenses(startDate: string, endDate: string): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('transactions')
    .select('amount, reimbursed_amount')
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .is('fixed_budget_id', null)

  return Math.round(data?.reduce((s, t) => s + Number(t.amount) - Number(t.reimbursed_amount ?? 0), 0) ?? 0)
}
