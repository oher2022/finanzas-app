// app/transactions/new/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Category } from '@/types'

export default function NewTransactionPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    txn_date: new Date().toISOString().split('T')[0],
    category_id: '',
    currency: 'CLP',
    payment_method: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => setCategories(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount.replace(/\./g, '').replace(',', '.')),
        category_id: form.category_id || null,
      }),
    })
    if (res.ok) router.push('/transactions')
    else {
      const d = await res.json()
      setError(d.error || 'Error al guardar')
    }
    setLoading(false)
  }

  const field = 'w-full px-3 py-2 rounded-lg text-sm outline-none'
  const fieldStyle = { background: 'var(--surface)', border: '0.5px solid var(--border)', color: '#f0f0f2' }

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/transactions" className="text-sm text-gray-500 hover:text-gray-300">← Volver</Link>
          <h1 className="text-lg font-medium text-gray-100">Nuevo gasto</h1>
        </div>

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comercio / Descripción *</label>
              <input className={field} style={fieldStyle} value={form.merchant}
                onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} required placeholder="Jumbo, Uber, Netflix..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto * (CLP)</label>
                <input className={field} style={fieldStyle} value={form.amount} type="text" inputMode="numeric"
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="50000" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha *</label>
                <input className={field} style={fieldStyle} type="date" value={form.txn_date}
                  onChange={e => setForm(f => ({ ...f, txn_date: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select className={field} style={fieldStyle} value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Medio de pago</label>
              <select className={field} style={fieldStyle} value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option value="">No especificado</option>
                <option>Tarjeta de crédito</option>
                <option>Tarjeta de débito</option>
                <option>Efectivo</option>
                <option>Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
              <input className={field} style={fieldStyle} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="..." />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(91,127,232,0.8)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
