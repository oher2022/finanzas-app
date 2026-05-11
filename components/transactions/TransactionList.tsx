// components/transactions/TransactionList.tsx
'use client'
import { useState } from 'react'
import { Transaction, FixedBudget } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, PenLine, RotateCcw, Coins, Check, X, Tag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function CategoryBadge({ color, icon, name }: { color: string; icon: string; name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
      style={{ background: `${color}20`, color }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      {name}
    </span>
  )
}

function FixedBudgetAssigner({ txn, budgets }: { txn: Transaction; budgets: FixedBudget[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function assign(id: string | null) {
    setSaving(true)
    setOpen(false)
    await fetch(`/api/transactions/${txn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixed_budget_id: id }),
    })
    setSaving(false)
    router.refresh()
  }

  const expenseBudgets = budgets.filter(b => b.type === 'expense')
  const current = expenseBudgets.find(b => b.id === txn.fixed_budget_id)

  return (
    <div className="relative inline-block">
      {current ? (
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full mt-0.5"
          style={{ background: `${current.color}20`, color: current.color }}
        >
          <span style={{ fontSize: 9 }}>{current.icon}</span>
          {current.name}
          <X size={9} style={{ opacity: 0.7 }} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          disabled={saving}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] mt-0.5"
          style={{ color: '#8aabf0' }}
          title="Asignar gasto fijo"
        >
          <Tag size={10} />
          asignar
        </button>
      )}

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-20 rounded-lg shadow-xl border py-1 min-w-[160px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {current && (
            <button
              onClick={() => assign(null)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors"
              style={{ color: '#9098b0' }}
            >
              Sin asignar
            </button>
          )}
          {expenseBudgets.map(b => (
            <button
              key={b.id}
              onClick={() => assign(b.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover transition-colors flex items-center gap-2"
            >
              <span>{b.icon}</span>
              <span style={{ color: b.id === txn.fixed_budget_id ? b.color : 'var(--text-primary)' }}>
                {b.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReimbursementInline({ txn }: { txn: Transaction }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(String(txn.reimbursed_amount || ''))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/transactions/${txn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reimbursed_amount: Number(value.replace(/\./g, '').replace(',', '.')) || 0 }),
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const net = txn.amount - (txn.reimbursed_amount || 0)

  if (open) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-gray-500">Abono:</span>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="0"
          className="w-24 text-xs text-right bg-transparent outline-none border-b"
          style={{ borderColor: '#4ec994', color: '#4ec994' }}
        />
        <button onClick={handleSave} disabled={saving} className="p-0.5">
          <Check size={11} style={{ color: '#4ec994' }} />
        </button>
        <button onClick={() => setOpen(false)} className="p-0.5">
          <X size={11} style={{ color: '#9098b0' }} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {(txn.reimbursed_amount ?? 0) > 0 && (
        <span className="text-[10px] tabular-nums" style={{ color: '#4ec994' }}>
          abono +${(txn.reimbursed_amount!).toLocaleString('es-CL')} → neto ${net.toLocaleString('es-CL')}
        </span>
      )}
      <button
        onClick={() => setOpen(true)}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px]"
        style={{ color: '#8aabf0' }}
        title="Añadir abono"
      >
        <Coins size={10} />
        abono
      </button>
    </div>
  )
}

export function TransactionList({
  transactions,
  title = 'Transacciones',
  showViewAll,
  fixedBudgets = [],
}: {
  transactions: Transaction[]
  title?: string
  showViewAll?: boolean
  fixedBudgets?: FixedBudget[]
}) {
  if (transactions.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
        <p className="text-xs text-gray-600 text-center py-6">
          No hay transacciones aún.{' '}
          <Link href="/transactions/new" className="text-blue-400 hover:underline">
            Agregar una manualmente
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        {showViewAll && (
          <Link
            href="/transactions"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver todas →
          </Link>
        )}
      </div>

      <div className="divide-y divide-surface-border" style={{ borderColor: 'var(--border)' }}>
        {transactions.map(txn => (
          <div
            key={txn.id}
            className="flex items-start gap-3 py-2.5 hover:bg-surface-hover rounded-lg px-1 -mx-1 transition-colors group"
          >
            {/* Icono categoría */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
              style={{ background: txn.category?.color ? `${txn.category.color}20` : '#2a2d3a' }}
            >
              {txn.category?.icon || '💰'}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-200 truncate">{txn.merchant}</span>
                {txn.is_recurring && <RotateCcw size={10} className="text-amber-400 flex-shrink-0" />}
                {txn.source === 'gmail'
                  ? <Mail size={10} className="flex-shrink-0" style={{ color: '#4ec994', opacity: 0.7 }} />
                  : <PenLine size={10} className="flex-shrink-0" style={{ color: '#9098b0', opacity: 0.7 }} />
                }
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-gray-600">
                  {format(parseISO(txn.txn_date), "d 'de' MMM", { locale: es })}
                </span>
                {txn.category && (
                  <CategoryBadge color={txn.category.color} icon={txn.category.icon} name={txn.category.name} />
                )}
                {!txn.is_reviewed && txn.source === 'gmail' && (
                  <span className="badge text-[9px]" style={{ background: 'rgba(240,160,32,0.15)', color: '#f0a020' }}>
                    Sin revisar
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ReimbursementInline txn={txn} />
                {fixedBudgets.length > 0 && (
                  <FixedBudgetAssigner txn={txn} budgets={fixedBudgets} />
                )}
              </div>
            </div>

            {/* Monto */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium tabular-nums" style={{ color: '#e05555' }}>
                -${Number(txn.amount).toLocaleString('es-CL')}
              </p>
              {txn.card_last4 && <p className="text-[10px] text-gray-600">•••{txn.card_last4}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
