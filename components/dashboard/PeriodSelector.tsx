'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export function PeriodSelector({ label, offset }: { label: string; offset: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(delta: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', String(offset + delta))
    router.push(`/dashboard?${params.toString()}`)
  }

  function goToCurrent() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('period')
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-lg transition-colors hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center"
        title="Período anterior"
      >
        <ChevronLeft size={16} style={{ color: '#8aabf0' }} />
      </button>

      <span
        className="text-sm font-medium px-2 py-1.5 rounded-lg"
        style={{ color: '#c5d3f0', background: 'rgba(91,127,232,0.1)' }}
      >
        {label}
      </span>

      <button
        onClick={() => navigate(1)}
        className="p-2 rounded-lg transition-colors hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center"
        title="Período siguiente"
      >
        <ChevronRight size={16} style={{ color: '#8aabf0' }} />
      </button>

      {offset !== 0 && (
        <button
          onClick={goToCurrent}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5 min-h-[36px]"
          style={{ color: '#4ec994' }}
          title="Volver al período actual"
        >
          <CalendarDays size={12} />
          Hoy
        </button>
      )}
    </div>
  )
}
