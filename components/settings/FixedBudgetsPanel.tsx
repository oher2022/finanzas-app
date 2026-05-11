'use client'
import { useState, useEffect } from 'react'
import { FixedBudget } from '@/types'
import { Plus, Trash2, Pencil, Check, X, GripVertical, Wallet, PiggyBank } from 'lucide-react'

const COLORS = ['#8aabf0', '#4ec994', '#f0a020', '#e05555', '#a78bfa', '#f472b6', '#38bdf8', '#fb923c']
const DEFAULT_ICONS: Record<FixedBudget['type'], string> = { expense: '📌', saving: '🐷' }

function BudgetRow({
  budget,
  onDelete,
  onSave,
}: {
  budget: FixedBudget
  onDelete: (id: string) => void
  onSave: (id: string, updates: Partial<FixedBudget>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(budget.name)
  const [amount, setAmount] = useState(String(budget.amount))
  const [icon, setIcon] = useState(budget.icon)
  const [color, setColor] = useState(budget.color)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(budget.id, {
      name,
      amount: Number(amount.replace(/\./g, '').replace(',', '.')),
      icon,
      color,
    })
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 rounded-lg border" style={{ borderColor: color, background: `${color}10` }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-10 text-center bg-transparent border rounded p-1 text-lg"
            style={{ borderColor: 'var(--border)' }}
            maxLength={2}
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 bg-transparent border rounded px-2 py-1 text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Monto"
            className="w-28 text-right bg-transparent border rounded px-2 py-1 text-sm tabular-nums"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={12} /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded font-medium"
            style={{ background: color, color: '#0d0f1a' }}
          >
            <Check size={12} /> Guardar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 rounded-lg group hover:bg-surface-hover transition-colors">
      <GripVertical size={14} className="text-gray-700 cursor-grab flex-shrink-0" />
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: `${budget.color}20` }}
      >
        {budget.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200">{budget.name}</p>
      </div>
      <p className="text-sm tabular-nums font-medium" style={{ color: budget.color }}>
        ${budget.amount.toLocaleString('es-CL')}
      </p>
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded hover:bg-surface-hover"
          title="Editar"
        >
          <Pencil size={13} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="p-1.5 rounded hover:bg-surface-hover"
          title="Eliminar"
        >
          <Trash2 size={13} style={{ color: '#e05555' }} />
        </button>
      </div>
    </div>
  )
}

function AddForm({
  type,
  onAdd,
  onCancel,
}: {
  type: FixedBudget['type']
  onAdd: (data: { name: string; amount: number; icon: string; color: string }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ICONS[type])
  const [color, setColor] = useState(type === 'saving' ? '#4ec994' : COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !amount) return
    setSaving(true)
    await onAdd({
      name: name.trim(),
      amount: Number(amount.replace(/\./g, '').replace(',', '.')),
      icon,
      color,
    })
    setSaving(false)
  }

  return (
    <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: color, background: `${color}10` }}>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={icon}
          onChange={e => setIcon(e.target.value)}
          className="w-10 text-center bg-transparent border rounded p-1 text-lg"
          style={{ borderColor: 'var(--border)' }}
          maxLength={2}
        />
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={type === 'saving' ? 'Nombre (ej. Auto, Casa)' : 'Nombre (ej. CAE, Internet)'}
          className="flex-1 bg-transparent border rounded px-2 py-1 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Monto/mes"
          className="w-28 text-right bg-transparent border rounded px-2 py-1 text-sm tabular-nums"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
          />
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={12} /> Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim() || !amount}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded font-medium disabled:opacity-50"
          style={{ background: color, color: '#0d0f1a' }}
        >
          <Check size={12} /> Añadir
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  items,
  type,
  total,
  onDelete,
  onSave,
  onAdd,
}: {
  title: string
  icon: React.ReactNode
  items: FixedBudget[]
  type: FixedBudget['type']
  total: number
  onDelete: (id: string) => void
  onSave: (id: string, updates: Partial<FixedBudget>) => void
  onAdd: (data: { name: string; amount: number; icon: string; color: string }) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-medium text-gray-400">{title}</span>
        </div>
        {total > 0 && (
          <span className="text-xs tabular-nums text-gray-500">
            ${total.toLocaleString('es-CL')}/mes
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {items.map(b => (
            <BudgetRow key={b.id} budget={b} onDelete={onDelete} onSave={onSave} />
          ))}
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-xs text-gray-700 py-2">Sin configurar aún.</p>
      )}

      {adding ? (
        <AddForm
          type={type}
          onAdd={async data => {
            await onAdd(data)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1.5 text-xs w-full justify-center py-1.5 rounded-lg border border-dashed transition-colors hover:border-blue-500"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Plus size={11} /> Añadir {type === 'saving' ? 'meta de ahorro' : 'gasto fijo'}
        </button>
      )}
    </div>
  )
}

export function FixedBudgetsPanel() {
  const [items, setItems] = useState<FixedBudget[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/fixed-budgets?all=1')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(type: FixedBudget['type'], data: { name: string; amount: number; icon: string; color: string }) {
    const res = await fetch('/api/fixed-budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type }),
    })
    if (res.ok) {
      const created = await res.json()
      setItems(prev => [...prev, created])
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/fixed-budgets?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(b => b.id !== id))
  }

  async function handleSave(id: string, updates: Partial<FixedBudget>) {
    await fetch(`/api/fixed-budgets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setItems(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const expenses = items.filter(b => b.type === 'expense')
  const savings = items.filter(b => b.type === 'saving')
  const totalExpenses = expenses.reduce((s, b) => s + b.amount, 0)
  const totalSavings = savings.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-200">Compromisos mensuales</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gastos fijos y metas de ahorro que se descuentan del sueldo</p>
        </div>
        {(totalExpenses + totalSavings) > 0 && (
          <span className="text-xs tabular-nums text-gray-500">
            Total: <span className="text-gray-200 font-medium">${(totalExpenses + totalSavings).toLocaleString('es-CL')}</span>
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-600 text-center py-4">Cargando...</p>
      ) : (
        <div className="space-y-5">
          <Section
            title="Gastos fijos"
            icon={<Wallet size={13} style={{ color: '#8aabf0' }} />}
            items={expenses}
            type="expense"
            total={totalExpenses}
            onDelete={handleDelete}
            onSave={handleSave}
            onAdd={data => handleAdd('expense', data)}
          />
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
          <Section
            title="Ahorros"
            icon={<PiggyBank size={13} style={{ color: '#4ec994' }} />}
            items={savings}
            type="saving"
            total={totalSavings}
            onDelete={handleDelete}
            onSave={handleSave}
            onAdd={data => handleAdd('saving', data)}
          />
        </div>
      )}
    </div>
  )
}
