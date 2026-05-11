'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/settings', label: 'Config', icon: Settings },
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
    <>
      {/* Top bar — desktop */}
      <nav
        className="sticky top-0 z-50 border-b px-4"
        style={{ background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-200 mr-4">💸 Finanzas</span>
            {/* Links only visible on desktop */}
            <div className="hidden md:flex items-center gap-1">
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
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-600 truncate max-w-[160px]">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors p-1.5"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom tab bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t"
        style={{ background: 'rgba(13,15,26,0.97)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? '#8aabf0' : '#555d75' }}
            >
              <Icon size={18} />
              <span className="text-[10px]">{label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full" style={{ background: '#8aabf0' }} />
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}
