// components/dashboard/KpiGrid.tsx
'use client'
import { MonthSummary } from '@/types'
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react'

function fmt(n: number) {
  return n.toLocaleString('es-CL')
}

function KpiCard({
  label,
  value,
  sub,
  subUp,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  subUp?: boolean
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="card p-4 animate-in">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}20` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-medium text-gray-100 tabular-nums">{value}</p>
      {sub && (
        <p
          className="text-xs mt-1.5 flex items-center gap-1"
          style={{ color: subUp ? '#e05555' : '#4ec994' }}
        >
          {subUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {sub}
        </p>
      )}
    </div>
  )
}

export function KpiGrid({ summary }: { summary: MonthSummary }) {
  const overBudget = summary.budget_total > 0 && summary.total_expenses > summary.budget_total

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Gastos del mes"
        value={`$${fmt(summary.total_expenses)}`}
        sub={`${summary.vs_prev_month_pct > 0 ? '+' : ''}${summary.vs_prev_month_pct}% vs mes anterior`}
        subUp={summary.vs_prev_month_pct > 0}
        icon={TrendingDown}
        accent="#e05555"
      />
      <KpiCard
        label="Gasto promedio/día"
        value={`$${fmt(summary.daily_avg)}`}
        sub="Basado en días transcurridos"
        icon={Calendar}
        accent="#5b7fe8"
      />
      <KpiCard
        label="Proyección fin de mes"
        value={`$${fmt(summary.projected_total)}`}
        sub={
          summary.budget_total > 0
            ? overBudget
              ? `+$${fmt(summary.projected_total - summary.budget_total)} sobre presupuesto`
              : `$${fmt(summary.budget_total - summary.projected_total)} bajo presupuesto`
            : 'Sin presupuesto definido'
        }
        subUp={overBudget}
        icon={TrendingUp}
        accent={overBudget ? '#e05555' : '#4ec994'}
      />
      <KpiCard
        label="Presupuesto restante"
        value={
          summary.budget_total > 0
            ? `$${fmt(summary.budget_remaining)}`
            : '—'
        }
        sub={
          summary.budget_total > 0
            ? `${Math.round(summary.budget_used_pct)}% usado de $${fmt(summary.budget_total)}`
            : 'Configura tu presupuesto'
        }
        subUp={summary.budget_used_pct > 90}
        icon={Target}
        accent={summary.budget_used_pct > 90 ? '#f0a020' : '#4ec994'}
      />
    </div>
  )
}
