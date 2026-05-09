import { FixedBudget, FixedBudgetStatus } from '@/types'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString('es-CL')}`
}

function StatusIcon({ status }: { status: FixedBudgetStatus['status'] }) {
  if (status === 'paid') return <CheckCircle2 size={13} style={{ color: '#4ec994' }} />
  if (status === 'partial') return <Clock size={13} style={{ color: '#f0a020' }} />
  return <Circle size={13} style={{ color: '#9098b0' }} />
}

function FixedBudgetRow({ budget }: { budget: FixedBudgetStatus }) {
  const pct = Math.min(100, budget.pct)
  const barColor =
    budget.status === 'paid' ? '#4ec994' : budget.status === 'partial' ? '#f0a020' : '#3a3e52'

  return (
    <div className="py-2">
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0"
          style={{ background: `${budget.color}20` }}
        >
          {budget.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <StatusIcon status={budget.status} />
            <span className="text-xs text-gray-300 truncate">{budget.name}</span>
            <span className="ml-auto text-[10px] tabular-nums text-gray-500 flex-shrink-0">
              {fmt(budget.paid_amount)} / {fmt(budget.amount)}
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FixedBudgetPanel({
  fixedStatuses,
  savings,
  personalExpenses,
  totalIncome,
}: {
  fixedStatuses: FixedBudgetStatus[]
  savings: FixedBudget[]
  personalExpenses: number
  totalIncome: number
}) {
  const hasAnything = fixedStatuses.length > 0 || savings.length > 0
  if (!hasAnything) return null

  const totalFixed = fixedStatuses.reduce((s, b) => s + b.amount, 0)
  const totalSavings = savings.reduce((s, b) => s + b.amount, 0)
  const personalBudget = totalIncome - totalFixed - totalSavings
  const personalAvailable = personalBudget - personalExpenses
  const personalPct =
    personalBudget > 0
      ? Math.max(0, Math.min(100, Math.round((personalAvailable / personalBudget) * 100)))
      : 0
  const barColor = personalPct > 50 ? '#4ec994' : personalPct > 20 ? '#f0a020' : '#e05555'

  return (
    <div className="card p-4 space-y-3">
      {/* Desglose presupuestal */}
      <div className="space-y-1.5">
        {totalIncome > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Ingresos del período</span>
            <span className="tabular-nums font-medium" style={{ color: '#4ec994' }}>+{fmt(totalIncome)}</span>
          </div>
        )}
        {totalFixed > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Gastos fijos</span>
            <span className="tabular-nums" style={{ color: '#8aabf0' }}>-{fmt(totalFixed)}</span>
          </div>
        )}
        {totalSavings > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Ahorros</span>
            <span className="tabular-nums" style={{ color: '#4ec994' }}>-{fmt(totalSavings)}</span>
          </div>
        )}
        {totalIncome > 0 && (
          <>
            <div className="flex justify-between text-xs pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-gray-400">Presupuesto personal</span>
              <span className="tabular-nums text-gray-300">{fmt(personalBudget)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Gasto personal</span>
              <span className="tabular-nums" style={{ color: '#e05555' }}>-{fmt(personalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-medium text-gray-300">Disponible personal</span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: personalAvailable >= 0 ? '#4ec994' : '#e05555' }}
              >
                {personalAvailable < 0 ? '-' : ''}{fmt(personalAvailable)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${personalPct}%`, background: barColor }}
              />
            </div>
            <p className="text-[10px] text-gray-600 text-right">{personalPct}% disponible del presupuesto personal</p>
          </>
        )}
      </div>

      {/* Gastos fijos */}
      {fixedStatuses.length > 0 && (
        <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Gastos fijos</p>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {fixedStatuses.map(b => (
              <FixedBudgetRow key={b.id} budget={b} />
            ))}
          </div>
        </div>
      )}

      {/* Ahorros */}
      {savings.length > 0 && (
        <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Ahorros</p>
          <div className="space-y-1.5">
            {savings.map(b => (
              <div key={b.id} className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: `${b.color}20` }}
                >
                  {b.icon}
                </div>
                <span className="flex-1 text-xs text-gray-300 truncate">{b.name}</span>
                <span className="text-xs tabular-nums font-medium" style={{ color: b.color }}>
                  {fmt(b.amount)}/mes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
