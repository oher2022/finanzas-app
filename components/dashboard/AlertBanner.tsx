// components/dashboard/AlertBanner.tsx
'use client'
import { AlertTriangle, Info } from 'lucide-react'

type Alert = { type: 'warning' | 'info'; msg: string }

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm"
          style={{
            background: a.type === 'warning' ? 'rgba(224,85,85,0.08)' : 'rgba(91,127,232,0.08)',
            border: `0.5px solid ${a.type === 'warning' ? 'rgba(224,85,85,0.25)' : 'rgba(91,127,232,0.25)'}`,
          }}
        >
          {a.type === 'warning' ? (
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#e05555' }} />
          ) : (
            <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#5b7fe8' }} />
          )}
          <span style={{ color: a.type === 'warning' ? '#e08080' : '#8aabf0' }}>{a.msg}</span>
        </div>
      ))}
    </div>
  )
}
