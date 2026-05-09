// components/dashboard/GmailSyncButton.tsx
'use client'
import { useState } from 'react'
import { RefreshCw, Mail, CheckCircle, AlertCircle } from 'lucide-react'

type SyncState = 'idle' | 'syncing' | 'success' | 'error'

export function GmailSyncButton({ userId }: { userId: string }) {
  const [state, setState] = useState<SyncState>('idle')
  const [result, setResult] = useState<string>('')

  async function handleSync() {
    setState('syncing')
    setResult('')
    try {
      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()

      if (data.requiresAuth) {
        if (data.reason === 'insufficient_permission') {
          setState('error')
          setResult('Permisos insuficientes — reconectando Gmail...')
          setTimeout(() => { window.location.href = '/api/gmail/auth' }, 1500)
        } else {
          window.location.href = '/api/gmail/auth'
        }
      } else if (res.ok) {
        setState('success')
        const parts: string[] = [`${data.newTransactions} nuevas`]
        if (data.ignored > 0) parts.push(`${data.ignored} ignoradas`)
        if (data.duplicates > 0) parts.push(`${data.duplicates} ya procesadas`)
        parts.push(`(${data.processed ?? 0} encontradas)`)
        setResult(parts.join(' · '))
        console.log('[Gmail Sync]', data)
        setTimeout(() => setState('idle'), 8000)
      } else {
        setState('error')
        setResult(data.error || 'Error desconocido')
        setTimeout(() => setState('idle'), 4000)
      }
    } catch {
      setState('error')
      setResult('Error de conexión')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span
          className="text-xs"
          style={{ color: state === 'success' ? '#4ec994' : '#e05555' }}
        >
          {result}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={state === 'syncing'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: 'rgba(91,127,232,0.12)',
          border: '0.5px solid rgba(91,127,232,0.3)',
          color: '#8aabf0',
          opacity: state === 'syncing' ? 0.7 : 1,
        }}
      >
        {state === 'syncing' ? (
          <RefreshCw size={12} className="animate-spin" />
        ) : state === 'success' ? (
          <CheckCircle size={12} style={{ color: '#4ec994' }} />
        ) : state === 'error' ? (
          <AlertCircle size={12} style={{ color: '#e05555' }} />
        ) : (
          <Mail size={12} />
        )}
        {state === 'syncing' ? 'Sincronizando...' : 'Sync Gmail'}
      </button>
    </div>
  )
}
