'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Target, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/budgets', label: 'Presupuestos', icon: Target },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Navbar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b px-4"
      style={{ background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-200 mr-4">💸 Finanzas</span>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                color: pathname === href ? '#f0f0f2' : '#555d75',
                background: pathname === href ? 'rgba(91,127,232,0.12)' : 'transparent',
              }}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 truncate max-w-[160px]">{user.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <LogOut size={12} /> Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
