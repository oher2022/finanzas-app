// types/index.ts

export type Category = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  monthly_budget: number | null
  parent_id: string | null
}

export type FixedBudget = {
  id: string
  user_id: string
  name: string
  amount: number
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  type: 'expense' | 'saving' | 'debt'
  created_at: string
}

export type FixedBudgetStatus = FixedBudget & {
  paid_amount: number
  status: 'paid' | 'partial' | 'pending'
  pct: number
}

export type Transaction = {
  id: string
  user_id: string
  category_id: string | null
  category?: Category
  fixed_budget_id: string | null
  fixed_budget?: Pick<FixedBudget, 'id' | 'name' | 'icon' | 'color'>
  txn_date: string
  merchant: string
  amount: number
  reimbursed_amount: number
  currency: string
  payment_method: string | null
  card_last4: string | null
  source: 'gmail' | 'manual'
  is_recurring: boolean
  is_reviewed: boolean
  installments: number | null
  bank_issuer: string | null
  notes: string | null
  created_at: string
}

export type IncomeEntry = {
  id: string
  user_id: string
  amount: number
  description: string
  date: string
  is_recurring: boolean
  created_at: string
}

export type UserSettings = {
  user_id: string
  period_start_day: number
}

export type PeriodSummary = {
  period_start: string
  period_end: string
  total_income: number
  total_expenses: number
  total_reimbursed: number
  net_expenses: number
  available: number
  available_pct: number
}

export type Budget = {
  id: string
  user_id: string
  category_id: string | null
  category?: Category
  amount: number
  period: 'monthly'
  year: number
  month: number
}

export type GmailToken = {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  last_sync: string | null
  is_active: boolean
}

export type GmailEmail = {
  id: string
  user_id: string
  gmail_message_id: string
  raw_subject: string
  parsed_merchant: string | null
  parsed_amount: number | null
  parse_status: 'pending' | 'parsed' | 'failed' | 'ignored'
  received_at: string
}

export type MonthSummary = {
  month: number
  year: number
  total_income: number
  total_expenses: number
  net_balance: number
  savings_pct: number
  daily_avg: number
  projected_total: number
  budget_remaining: number
  budget_total: number
  budget_used_pct: number
  top_category: string
  vs_prev_month_pct: number
}

export type DailyExpense = {
  date: string
  amount: number
  count: number
}

export type CategorySummary = {
  category_id: string
  category_name: string
  category_color: string
  category_icon: string
  total: number
  pct: number
  budget: number | null
  budget_used_pct: number | null
}

export type Insight = {
  id: string
  type: 'warning' | 'info' | 'success' | 'tip'
  message: string
  detail: string | null
}

export type ParsedBankEmail = {
  merchant: string
  amount: number
  currency: string
  date: string
  card_last4: string | null
  installments: number | null
  bank_issuer: string
  raw_subject: string
  gmail_message_id: string
}
