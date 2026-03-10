'use client'
// src/app/(app)/layout.tsx
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Layers, LayoutDashboard, FolderKanban, LogOut,
  ChevronLeft, Menu, X, Bell, Settings
} from 'lucide-react'
import { getInitials, getAvatarGradient } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const navLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects',  icon: FolderKanban,    label: 'Projects'  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--surface)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    )
  }

  async function handleLogout() {
    await signOut({ redirect: false })
    toast.success('Sampai jumpa!')
    router.push('/login')
  }

  const user = session?.user as any
  const displayName = user?.name?.trim() || user?.email?.split('@')?.[0] || 'Pengguna'
  const avatarGrad = getAvatarGradient(user?.id || 'a')

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)', minHeight: '72px' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
          <Layers size={17} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg tracking-tight animate-in"
            style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
            TaskFlow
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn('nav-item', active && 'active')}
              title={collapsed ? label : undefined}>
              <span className="icon-wrap">
                <Icon size={16} />
              </span>
              {!collapsed && <span className="animate-in">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t pt-3 space-y-1" style={{ borderColor: 'var(--border)' }}>
        {/* User */}
        <div className={cn('flex items-center gap-3 px-2 py-2.5 rounded-xl',
          !collapsed && 'pr-3')} style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className={cn('avatar flex-shrink-0 text-xs font-bold text-white', collapsed ? 'w-8 h-8' : 'w-8 h-8')}
            style={{ background: `linear-gradient(135deg, ${avatarGrad.split('to-')[0].replace('from-', '')} 0%, ${avatarGrad.split('to-')[1]} 100%)` }}>
            <div className={`avatar w-8 h-8 text-xs bg-gradient-to-br ${avatarGrad}`}>
              {getInitials(displayName)}
            </div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-in">
              <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                Project Admin
              </p>
            </div>
          )}
        </div>

        <button onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: '#f87171' }}
          title={collapsed ? 'Keluar' : undefined}>
          <span className="icon-wrap"><LogOut size={15} /></span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--surface)' }}>
      {/* Desktop sidebar */}
      <aside className={cn('sidebar hidden lg:flex', collapsed && 'collapsed')}>
        <Sidebar />
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          <ChevronLeft size={13} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar mobile-open" style={{ width: '240px', transform: 'none' }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 btn btn-icon btn-ghost" style={{ padding: '6px' }}>
              <X size={16} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className={cn('main-content', collapsed && 'sidebar-collapsed')}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <button onClick={() => setMobileOpen(true)} className="btn btn-icon btn-ghost">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-indigo-400" />
            <span className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>TaskFlow</span>
          </div>
          <div className="w-9" />
        </div>

        {children}
      </div>
    </div>
  )
}
