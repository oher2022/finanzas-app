'use client'
import { useState } from 'react'
import { CalendarDays, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PeriodSettingsPanel({ currentDay }: { currentDay: number }) {
  const router = useRouter()
  const [day, setDay] = useState(String(currentDay))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    const n = parseInt(day)
    if (!n || n < 1 || n > 28) return
    setSaving(true)
    const res = await fetch('/api/user-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start_day: n }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays size={14} style={{ color: '#8aabf0' }} />
        <h2 className="text-sm font-medium text-gray-300">Período de facturación</h2>
      </div>
      <p className="text-xs text-gray-500">
        Define el día del mes en que inicia tu período. Por ejemplo, si tu tarjeta factura el 20, pon 20.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Día de inicio:</span>
          <input
            type="number"
            min={1}
            max={28}
            value={day}
            onChange={e => setDay(e.target.value)}
            className="w-16 text-sm text-center rounded-lg px-2 py-1 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border)', color: '#c5d3f0' }}
          />
          <span className="text-xs text-gray-500">de cada mes</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || parseInt(day) === currentDay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: saved ? 'rgba(78,201,148,0.15)' : 'rgba(91,127,232,0.15)',
            color: saved ? '#4ec994' : '#8aabf0',
            border: `0.5px solid ${saved ? 'rgba(78,201,148,0.3)' : 'rgba(91,127,232,0.3)'}`,
            opacity: saving || parseInt(day) === currentDay ? 0.5 : 1,
          }}
        >
          {saved ? <Check size={11} /> : null}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
      <p className="text-[11px] text-gray-600">
        Período actual: del día {currentDay} al día {currentDay - 1} del mes siguiente
      </p>
    </div>
  )
}
