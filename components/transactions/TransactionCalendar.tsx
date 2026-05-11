'use client'
import { useState, useRef, useEffect } from 'react'
import { Transaction, FixedBudget } from '@/types'
import { format, parseISO, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, PenLine, RotateCcw, Coins, Check, X, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Inline sub-components ────────────────────────────────────────────────────

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
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="0"
          className="w-20 text-[10px] text-right bg-transparent outline-none border-b"
          style={{ borderColor: '#4ec994', color: '#4ec994' }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} disabled={saving} className="p-0.5">
          <Check size={10} style={{ color: '#4ec994' }} />
        </button>
        <button onClick={() => setOpen(false)} className="p-0.5">
          <X size={10} style={{ color: '#9098b0' }} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(txn.reimbursed_amount ?? 0) > 0 && (
        <span className="text-[9px] tabular-nums" style={{ color: '#4ec994' }}>
          abono ${(txn.reimbursed_amount!).toLocaleString('es-CL')} → neto ${net.toLocaleString('es-CL')}
        </span>
      )}
      <button
        onClick={() => setOpen(true)}
        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[9px]"
        style={{ color: '#8aabf0' }}
      >
        <Coins size={9} /> abono
      </button>
    </div>
  )
}

function FixedBudgetAssigner({ txn, budgets }: { txn: Transaction; budgets: FixedBudget[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const expenseBudgets = budgets.filter(b => b.type === 'expense')
  const current = expenseBudgets.find(b => b.id === txn.fixed_budget_id)

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

  if (expenseBudgets.length === 0) return null

  return (
    <div ref={ref} className="relative inline-block">
      {current ? (
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
          style={{ background: `${current.color}20`, color: current.color }}
        >
          <span style={{ fontSize: 8 }}>{current.icon}</span>
          {current.name}
          <X size={8} style={{ opacity: 0.7 }} />
        </button>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          disabled={saving}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[9px]"
          style={{ color: '#8aabf0' }}
        >
          <Tag size={9} /> asignar
        </button>
      )}
      {open && (
        <div
          className="absolute left-0 bottom-full mb-1 z-30 rounded-lg shadow-xl border py-1 min-w-[150px]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {current && (
            <button
              onClick={() => assign(null)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover"
              style={{ color: '#9098b0' }}
            >
              Sin asignar
            </button>
          )}
          {expenseBudgets.map(b => (
            <button
              key={b.id}
              onClick={() => assign(b.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover flex items-center gap-2"
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

// ─── Transaction card within a day column ─────────────────────────────────────

function TxnCard({ txn, fixedBudgets }: { txn: Transaction; fixedBudgets: FixedBudget[] }) {
  return (
    <div
      className="group rounded-lg p-2 transition-colors"
      style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--border)' }}
    >
      {/* Icon + merchant + amount */}
      <div className="flex items-start gap-1.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
          style={{ background: txn.category?.color ? `${txn.category.color}20` : '#2a2d3a' }}
        >
          {txn.category?.icon || '💰'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-200 truncate leading-tight">{txn.merchant}</span>
            {txn.is_recurring && <RotateCcw size={9} className="text-amber-400 flex-shrink-0" />}
            {txn.source === 'gmail'
              ? <Mail size={9} className="flex-shrink-0" style={{ color: '#4ec994', opacity: 0.7 }} />
              : <PenLine size={9} className="flex-shrink-0" style={{ color: '#9098b0', opacity: 0.7 }} />
            }
          </div>
          <p className="text-[11px] font-semibold tabular-nums" style={{ color: '#e05555' }}>
            -${Number(txn.amount).toLocaleString('es-CL')}
          </p>
          {txn.category && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[9px] mt-0.5"
              style={{ background: `${txn.category.color}20`, color: txn.category.color }}
            >
              {txn.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Inline actions */}
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <ReimbursementInline txn={txn} />
        <FixedBudgetAssigner txn={txn} budgets={fixedBudgets} />
      </div>
    </div>
  )
}

// ─── Day column ───────────────────────────────────────────────────────────────

function DayColumn({
  date,
  transactions,
  fixedBudgets,
}: {
  date: string
  transactions: Transaction[]
  fixedBudgets: FixedBudget[]
}) {
  const d = parseISO(date)
  const today = isToday(d)
  const dayTotal = transactions.reduce((s, t) => s + t.amount - (t.reimbursed_amount || 0), 0)
  const isEmpty = transactions.length === 0

  return (
    <div
      className="flex-shrink-0 w-36 sm:w-40 flex flex-col"
      style={{ opacity: isEmpty ? 0.4 : 1 }}
    >
      {/* Day header */}
      <div
        className="sticky top-0 z-10 rounded-lg px-2 py-1.5 mb-2 text-center"
        style={{
          background: today
            ? 'rgba(91,127,232,0.2)'
            : 'rgba(255,255,255,0.04)',
          border: `0.5px solid ${today ? 'rgba(91,127,232,0.5)' : 'var(--border)'}`,
        }}
      >
        <p className="text-[10px] uppercase tracking-widest" style={{ color: today ? '#8aabf0' : '#9098b0' }}>
          {format(d, 'EEE', { locale: es })}
        </p>
        <p className="text-xl font-bold leading-none" style={{ color: today ? '#8aabf0' : '#e2e8f0' }}>
          {format(d, 'd')}
        </p>
        <p className="text-[10px]" style={{ color: '#9098b0' }}>
          {format(d, 'MMM', { locale: es })}
        </p>
        {dayTotal > 0 && (
          <p className="text-[10px] tabular-nums mt-1 font-medium" style={{ color: '#e05555' }}>
            -${Math.round(dayTotal).toLocaleString('es-CL')}
          </p>
        )}
      </div>

      {/* Transactions */}
      <div className="space-y-2 flex-1">
        {transactions.map(txn => (
          <TxnCard key={txn.id} txn={txn} fixedBudgets={fixedBudgets} />
        ))}
      </div>
    </div>
  )
}

// ─── Main calendar ────────────────────────────────────────────────────────────

export function TransactionCalendar({
  transactions,
  fixedBudgets,
  startDate,
  endDate,
}: {
  transactions: Transaction[]
  fixedBudgets: FixedBudget[]
  startDate: string
  endDate: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Group transactions by date
  const byDate: Record<string, Transaction[]> = {}
  transactions.forEach(t => {
    if (!byDate[t.txn_date]) byDate[t.txn_date] = []
    byDate[t.txn_date].push(t)
  })

  // Build list of all days in the period
  const days: string[] = []
  const cursor = new Date(startDate)
  const end = new Date(endDate)
  while (cursor <= end) {
    days.push(cursor.toISOString().split('T')[0])
    cursor.setDate(cursor.getDate() + 1)
  }

  // Scroll to today or last transaction day on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const todayStr = new Date().toISOString().split('T')[0]
    const todayIndex = days.indexOf(todayStr)
    const targetIndex = todayIndex >= 0 ? todayIndex : days.length - 1
    const colWidth = 160 + 12 // w-40 + gap-3
    const scrollLeft = Math.max(0, targetIndex * colWidth - scrollRef.current.clientWidth / 2)
    scrollRef.current.scrollLeft = scrollLeft
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPeriod = transactions.reduce((s, t) => s + t.amount - (t.reimbursed_amount || 0), 0)

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-gray-500">
          {transactions.length} transacciones en el período
        </p>
        <p className="text-sm font-semibold tabular-nums" style={{ color: '#e05555' }}>
          -{`$${Math.round(totalPeriod).toLocaleString('es-CL')}`} netos
        </p>
      </div>

      {/* Horizontal scroll calendar */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        <div className="flex gap-3" style={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
          {days.map(date => (
            <DayColumn
              key={date}
              date={date}
              transactions={byDate[date] || []}
              fixedBudgets={fixedBudgets}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
