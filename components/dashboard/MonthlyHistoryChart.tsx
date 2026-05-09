// components/dashboard/MonthlyHistoryChart.tsx
'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="text-gray-400 capitalize">{label}</p>
      <p className="text-gray-100 font-medium">${Number(payload[0].value).toLocaleString('es-CL')}</p>
    </div>
  )
}

export function MonthlyHistoryChart({ data }: { data: Array<{ month: string; total: number }> }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Evolución mensual</h3>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5b7fe8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5b7fe8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fill: '#555d75', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            className="capitalize"
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#5b7fe8', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#5b7fe8"
            strokeWidth={1.5}
            fill="url(#areaGrad)"
            dot={{ fill: '#5b7fe8', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: '#5b7fe8', r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
