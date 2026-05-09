// components/dashboard/BudgetProgress.tsx
'use client'
import { CategorySummary, MonthSummary } from '@/types'

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.min(pct, 100)
  const overBudget = pct > 100
  return (
    <div className="progress-track mt-1.5">
      <div
        className="progress-fill"
        style={{
          width: `${clamped}%`,
          background: overBudget ? '#e05555' : pct > 80 ? '#f0a020' : color,
        }}
      />
    </div>
  )
}

export function BudgetProgress({
  categories,
  summary,
}: {
  categories: CategorySummary[]
  summary: MonthSummary | null
}) {
  const catsWithBudget = categories.filter(c => c.budget !== null && c.budget > 0)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Presupuesto mensual</h3>
        {summary?.budget_total ? (
          <span className="text-xs text-gray-500">
            ${Math.round(summary.budget_used_pct)}% usado
          </span>
        ) : null}
      </div>

      {/* Barra global */}
      {summary?.budget_total ? (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Total del mes</span>
            <span className={summary.budget_used_pct > 90 ? 'text-red-400' : 'text-gray-400'}>
              ${summary.total_expenses.toLocaleString('es-CL')} / ${summary.budget_total.toLocaleString('es-CL')}
            </span>
          </div>
          <ProgressBar pct={summary.budget_used_pct} color="#5b7fe8" />
        </div>
      ) : (
        <p className="text-xs text-gray-600 mb-4">Sin presupuesto global definido</p>
      )}

      {/* Por categoría */}
      <div className="space-y-3">
        {catsWithBudget.length === 0 ? (
          <p className="text-xs text-gray-600">No hay presupuestos por categoría aún.</p>
        ) : (
          catsWithBudget.map(c => (
            <div key={c.category_id}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <span>{c.category_icon}</span>
                  {c.category_name}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    color:
                      c.budget_used_pct! > 100
                        ? '#e05555'
                        : c.budget_used_pct! > 80
                        ? '#f0a020'
                        : '#9098b0',
                  }}
                >
                  {c.budget_used_pct}%
                </span>
              </div>
              <ProgressBar pct={c.budget_used_pct!} color={c.category_color} />
              <p className="text-[10px] text-gray-600 mt-0.5">
                ${c.total.toLocaleString('es-CL')} de ${c.budget!.toLocaleString('es-CL')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
