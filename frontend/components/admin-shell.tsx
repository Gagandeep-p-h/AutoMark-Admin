'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Shield,
  FileText
} from 'lucide-react'

// Common UI Components
export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block text-foreground">
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

export function Inp({
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  disabled,
  className,
  ...props
}: {
  type?: string
  value?: string
  onChange?: (e: any) => void
  placeholder?: string
  prefix?: ReactNode
  suffix?: ReactNode
  disabled?: boolean
  className?: string
  [key: string]: any
}) {
  return (
    <div className={`relative ${className || ''}`}>
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          {prefix}
        </div>
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => {
          if (onChange) onChange(e)
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}
        `}
        {...props}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  const isBlue = ['linked', 'registered'].includes(s)
  const isGreen = ['active', 'present', 'bound'].includes(s)
  const isWarn = ['pending', 'leave', 'not registered', 'not linked', 'inactive'].includes(s)

  let bgClass = 'bg-muted text-muted-foreground border-border'
  let dotClass = 'bg-muted-foreground'

  if (isBlue) {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200'
    dotClass = 'bg-blue-600'
  } else if (isGreen) {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    dotClass = 'bg-emerald-500'
  } else if (isWarn) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200'
    dotClass = 'bg-amber-500'
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {status}
    </div>
  )
}

const SIDEBAR_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Students', icon: GraduationCap, href: '/admin/students' },
  { label: 'Faculty', icon: Users, href: '/admin/faculty' },
  { label: 'Timetable', icon: Calendar, href: '/admin/timetable' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

interface UserSession {
  name: string
  role: string
  email: string
  departmentCode?: string | null
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<{
    name: string
    email: string
    role: string
    dept?: string
  }>({
    name: 'Department Admin',
    email: 'admin@cse',
    role: 'DEPT_ADMIN',
    dept: 'CSE',
  })

  const [backendStatus, setBackendStatus] = useState<'checking' | 'live' | 'offline'>('checking')

  useEffect(() => {
    let mounted = true
    try {
      const storedUser = localStorage.getItem('smartattend_admin_user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        if (parsed?.name) setCurrentUser(parsed)
      }
      const storedDept = localStorage.getItem('smartattend_admin_dept')
      if (storedDept) {
        setCurrentUser(prev => ({ ...prev, dept: storedDept }))
      }
    } catch {}

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user)
          try {
            localStorage.setItem('smartattend_admin_user', JSON.stringify(data.user))
            if (data.user.dept) {
              localStorage.setItem('smartattend_admin_dept', data.user.dept)
            }
          } catch {}
        }
      })
      .catch(() => {})

    import('@/lib/api').then(({ checkBackendHealth }) => {
      checkBackendHealth().then(res => {
        if (mounted) {
          setBackendStatus(res.status === 'OK' ? 'live' : 'offline')
        }
      })
    }).catch(() => {
      if (mounted) setBackendStatus('offline')
    })

    return () => { mounted = false }
  }, [])

  const handleLogout = async () => {
    try {
      localStorage.removeItem('smartattend_admin_dept')
      localStorage.removeItem('smartattend_admin_user')
    } catch {}
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const initials = currentUser.name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD'

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="h-14 border-b border-border flex items-center px-4 gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Shield className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground tracking-tight text-sm leading-tight">Automark</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Portal</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-accent text-accent-foreground font-semibold border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <Icon className={`size-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-muted transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {initials}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-foreground leading-none truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {currentUser.dept ? `${currentUser.dept} Department` : 'Administrator'}
                </p>
              </div>
            </div>
            <LogOut className="size-4 text-muted-foreground shrink-0 ml-2" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Automark Admin Portal</span>
            <span>/</span>
            <span className="text-primary font-medium capitalize">
              {pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {backendStatus === 'live' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : backendStatus === 'offline' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-ping" />
                Connecting...
              </span>
            )}

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {currentUser.dept || 'CSE'} Department
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function AdminContent({ children }: { children: ReactNode }) {
  // AdminContent is now just a pass-through since AdminShell handles layout
  return <>{children}</>
}

// Re-export constants with clean royal blue & dark slate tokens
export const C = {
  navy: '#0B192C',
  blue: '#0D59D6',
  blueLight: '#EFF6FF',
  blueFaint: '#F8FAFC',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#DC2626',
  redLight: '#FEE2E2',
  orange: '#EA580C',
  orangeLight: '#FFEDD5',
  purple: '#7C3AED',
  purpleLight: '#F3E8FF',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF'
}

