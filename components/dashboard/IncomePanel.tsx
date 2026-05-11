'use client'
import { useState } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { IncomeEntry } from '@/types'
import { useRouter } from 'next/navigation'

function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString('es-CL')}`
}

export function IncomePanel({
  incomes,
  periodStart,
  periodEnd,
}: {
  incomes: IncomeEntry[]
  periodStart: string
  periodEnd: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setLoading(true)
    await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount.replace(/\./g, '').replace(',', '.')) }),
    })
    setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/income?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const total = incomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: '#4ec994' }} />
          <h3 className="text-sm font-medium text-gray-300">Ingresos del período</h3>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
          style={{ background: 'rgba(78,201,148,0.12)', color: '#4ec994', border: '0.5px solid rgba(78,201,148,0.3)' }}
        >
          <Plus size={11} />
          Añadir
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)' }}>
          <input
            type="text"
            placeholder="Descripción (ej: Sueldo mayo)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full text-xs bg-transparent outline-none text-gray-200 placeholder-gray-600 border-b pb-1"
            style={{ borderColor: 'var(--border)' }}
            required
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Monto (ej: 2.500.000)"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="flex-1 text-xs bg-transparent outline-none text-gray-200 placeholder-gray-600"
              required
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="text-xs bg-transparent outline-none text-gray-400"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 rounded text-xs font-medium"
              style={{ background: '#4ec994', color: '#0d0f17' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-gray-400">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {incomes.length > 0 ? (
        <div className="space-y-1.5">
          {incomes.map(inc => (
            <div key={inc.id} className="flex items-center gap-2 group">
              <div className="flex-1">
                <span className="text-xs text-gray-300">{inc.description}</span>
                <span className="text-[10px] text-gray-600 ml-2">{inc.date}</span>
              </div>
              <span className="text-xs font-medium tabular-nums" style={{ color: '#4ec994' }}>
                +{fmt(inc.amount)}
              </span>
              <button
                onClick={() => handleDelete(inc.id)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 rounded"
                title="Eliminar"
              >
                <Trash2 size={11} style={{ color: '#e05555' }} />
              </button>
            </div>
          ))}
          <div className="pt-1 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] text-gray-500">Total ingresos</span>
            <span className="text-sm font-semibold" style={{ color: '#4ec994' }}>+{fmt(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center py-3">Sin ingresos registrados este período</p>
      )}
    </div>
  )
}
