// components/dashboard/CategoryBreakdown.tsx
'use client'
import { CategorySummary } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-200 font-medium">{d.category_icon} {d.category_name}</p>
      <p className="text-gray-400 mt-0.5">${d.total.toLocaleString('es-CL')} · {d.pct}%</p>
    </div>
  )
}

export function CategoryBreakdown({ categories }: { categories: CategorySummary[] }) {
  const top = categories.slice(0, 6)
  const totalShown = top.reduce((s, c) => s + c.total, 0)

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Por categoría</h3>
      <div className="flex items-center gap-4">
        {/* Pie */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={top}
                cx={50}
                cy={50}
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="total"
                strokeWidth={0}
              >
                {top.map((c, i) => (
                  <Cell key={c.category_id || i} fill={c.category_color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista */}
        <div className="flex-1 space-y-2">
          {top.map(c => (
            <div key={c.category_id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: c.category_color }}
              />
              <span className="text-xs text-gray-400 flex-1 truncate">
                {c.category_icon} {c.category_name}
              </span>
              <span className="text-xs tabular-nums text-gray-300">
                {c.pct}%
              </span>
              <span className="text-xs tabular-nums text-gray-500 text-right min-w-[70px]">
                ${c.total.toLocaleString('es-CL')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
