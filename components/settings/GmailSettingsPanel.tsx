'use client'
import { Mail, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

type TokenInfo = { is_active: boolean; last_sync: string | null; expires_at: string } | null

export function GmailSettingsPanel({ token }: { token: TokenInfo }) {
  const isConnected = token?.is_active === true

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(78,201,148,0.12)' }}>
            <Mail size={18} style={{ color: '#4ec994' }} />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-200">Gmail</h2>
            <p className="text-xs text-gray-500 mt-0.5">Importación automática de gastos bancarios</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <CheckCircle size={14} style={{ color: '#4ec994' }} />
          ) : (
            <AlertCircle size={14} style={{ color: '#f0a020' }} />
          )}
          <span className="text-xs" style={{ color: isConnected ? '#4ec994' : '#f0a020' }}>
            {isConnected ? 'Conectado' : 'No conectado'}
          </span>
        </div>
      </div>

      {isConnected && token?.last_sync && (
        <p className="text-xs text-gray-600 mt-3">
          Último sync: {new Date(token.last_sync).toLocaleString('es-CL')}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {!isConnected ? (
          <a
            href="/api/gmail/auth"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(91,127,232,0.2)', color: '#8aabf0', border: '0.5px solid rgba(91,127,232,0.3)' }}
          >
            <ExternalLink size={13} /> Conectar Gmail
          </a>
        ) : (
          <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(78,201,148,0.06)', border: '0.5px solid rgba(78,201,148,0.2)' }}>
            <p className="text-gray-400">✓ Detecta gastos de Santander, BCI y Falabella</p>
            <p className="text-gray-400">✓ Solo lectura — nunca escribe en tu Gmail</p>
            <p className="text-gray-400">✓ Clasifica automáticamente con IA</p>
          </div>
        )}
      </div>
    </div>
  )
}
