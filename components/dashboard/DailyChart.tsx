// components/dashboard/DailyChart.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { DailyExpense } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">
        {format(parseISO(label), "EEE d 'de' MMM", { locale: es })}
      </p>
      <p className="text-gray-100 font-medium">
        ${Number(payload[0].value).toLocaleString('es-CL')}
      </p>
      {payload[0].payload.count > 0 && (
        <p className="text-gray-500">{payload[0].payload.count} transacción{payload[0].payload.count !== 1 ? 'es' : ''}</p>
      )}
    </div>
  )
}

export function DailyChart({ data, average }: { data: DailyExpense[]; average: number }) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Gasto diario</h3>
        <span className="text-xs text-gray-500">
          Promedio: ${average.toLocaleString('es-CL')}/día
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={8}>
          <XAxis
            dataKey="date"
            tickFormatter={d => {
              try { return format(parseISO(d), 'd') } catch { return '' }
            }}
            tick={{ fill: '#555d75', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(91,127,232,0.08)' }} />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#5b7fe8"
              strokeDasharray="4 4"
              strokeWidth={0.8}
              strokeOpacity={0.5}
            />
          )}
          <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.date}
                fill={
                  entry.date === today
                    ? '#5b7fe8'
                    : entry.amount > average * 1.5
                    ? '#e05555'
                    : entry.amount > average
                    ? '#f0a020'
                    : '#3a4266'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#3a4266' }} />
          <span className="text-xs text-gray-600">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#f0a020' }} />
          <span className="text-xs text-gray-600">Sobre promedio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#e05555' }} />
          <span className="text-xs text-gray-600">Muy alto</span>
        </div>
      </div>
    </div>
  )
}
