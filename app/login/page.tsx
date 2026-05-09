// app/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Revisa tu correo para confirmar tu cuenta.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">💸</div>
          <h1 className="text-xl font-medium text-gray-100">Centro financiero</h1>
          <p className="text-sm text-gray-500 mt-1">Control total de tus gastos</p>
        </div>

        <div className="card p-6">
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--surface)' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-1.5 text-xs rounded-md transition-all"
                style={{
                  background: mode === m ? 'var(--surface-card)' : 'transparent',
                  color: mode === m ? '#f0f0f2' : '#555d75',
                  border: mode === m ? '0.5px solid var(--border)' : 'none',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '0.5px solid var(--border)',
                  color: '#f0f0f2',
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '0.5px solid var(--border)',
                  color: '#f0f0f2',
                }}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {info && <p className="text-xs text-green-400">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all mt-2"
              style={{
                background: loading ? 'rgba(91,127,232,0.4)' : 'rgba(91,127,232,0.8)',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
