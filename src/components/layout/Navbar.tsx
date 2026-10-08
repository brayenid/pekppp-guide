'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUserAction, logoutAction, UserSession } from '../../actions/auth-actions'
import { useState, useEffect, useRef } from 'react'
import {
  LogIn,
  Check,
  AlertCircle,
  Menu,
  X,
  Home,
  Workflow,
  BarChart3,
  BookOpen,
  FileText,
  Shield,
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserNavDropdown } from './UserNavDropdown'

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/alur-proses', label: 'Alur Proses', icon: Workflow },
  { href: '/hasil', label: 'Hasil Evaluasi', icon: BarChart3 },
  { href: '/wiki', label: 'Wiki Indikator', icon: BookOpen },
  { href: '/panduan', label: 'Panduan', icon: FileText },
  { href: '/regulasi', label: 'Regulasi', icon: Shield }
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserSession | null>(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>('system')

  useEffect(() => {
    getCurrentUserAction().then(setUser)
  }, [pathname])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [pathname])

  // Sync theme mode for mobile drawer
  useEffect(() => {
    try {
      const stored = (localStorage.getItem('pekppp-theme') as 'system' | 'dark' | 'light') || 'system'
      setThemeMode(stored)
    } catch {}
  }, [mobileDrawerOpen])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileDrawerOpen])

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const applyTheme = (mode: 'system' | 'dark' | 'light') => {
    setThemeMode(mode)
    try {
      localStorage.setItem('pekppp-theme', mode)
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = mode === 'dark' || (mode === 'system' && systemDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }

  const handleLogout = async () => {
    try {
      await logoutAction()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  const isAdmin = pathname.startsWith('/admin')
  const isOpd = pathname.startsWith('/opd')
  const isEvaluation = pathname.startsWith('/evaluasi')
  const dashboardHref = user?.role === 'SUPER_ADMIN' ? '/admin' : '/opd'

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-canvas border-b border-stroke shadow-2xs">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group py-0.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform shadow-hz-button">
              P
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base tracking-tight text-ink">PEKPPP.ext</span>
              <span className="text-[11px] font-medium tracking-wider text-ink-muted">Kutai Barat</span>
            </div>
          </Link>

          {/* Center Section: Admin / OPD / Evaluation Context Capsule or Public Nav Pills (Desktop only) */}
          {isAdmin ? (
            <div className="hidden lg:flex items-center gap-3 p-1.5 pl-4 pr-2 bg-surface-subtle border border-stroke/60 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-xs font-medium text-ink">Portal Super Admin</span>
              <span className="text-stroke">|</span>
              <Link
                href="/"
                className="px-4 py-1.5 rounded-full bg-surface-elevated text-ink-secondary text-xs font-medium hover:text-brand transition-colors shadow-pill">
                Lihat Situs Publik →
              </Link>
            </div>
          ) : isOpd ? (
            <div className="hidden lg:flex items-center gap-3 p-1.5 pl-4 pr-2 bg-surface-subtle border border-stroke/60 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-xs font-medium text-ink">Portal Unit Pelayanan (OPD)</span>
              <span className="text-stroke">|</span>
              <Link
                href="/"
                className="px-4 py-1.5 rounded-full bg-surface-elevated text-ink-secondary text-xs font-medium hover:text-brand transition-colors shadow-pill">
                Lihat Situs Publik →
              </Link>
            </div>
          ) : isEvaluation ? (
            <EvaluationNavbarStatus userRole={user?.role} />
          ) : (
            <div className="hidden lg:flex items-center gap-1 p-1.5 bg-surface-subtle border border-stroke/60 rounded-full shadow-2xs">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-surface-elevated text-ink font-medium shadow-pill'
                        : 'text-ink-secondary hover:text-ink font-normal'
                    }`}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Section: Notification Bell + Profile (Desktop) + Hamburger (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {user && <NotificationBell />}

            {/* Desktop User Dropdown */}
            <div className="hidden lg:block">
              {user ? (
                <UserNavDropdown user={user} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button cursor-pointer">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button (min 44x44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-surface-elevated hover:bg-surface-subtle border border-stroke/70 text-ink flex items-center justify-center transition-all cursor-pointer shadow-2xs">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide Drawer Overlay & Aside Sheet */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
          mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileDrawerOpen}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileDrawerOpen(false)}
        />

        {/* Drawer Panel */}
        <aside
          className={`absolute top-0 right-0 bottom-0 w-[85vw] max-w-[340px] bg-canvas border-l border-stroke shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out ${
            mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stroke flex items-center justify-between gap-3 bg-surface">
            <Link
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-xs shadow-hz-button">
                P
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight text-ink">PEKPPP.ext</span>
                <span className="text-[10px] font-medium tracking-wider text-ink-muted">Kutai Barat</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Tutup menu navigasi"
              className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-full bg-surface-subtle hover:bg-stroke/30 text-ink flex items-center justify-center transition-colors cursor-pointer border border-stroke/50">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-4 space-y-5 flex-1 overflow-y-auto">
            {/* Context Capsule for Logged-In Roles */}
            {user && (
              <div className="p-3 rounded-xl bg-surface border border-stroke/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink truncate">{user.fullName}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/20 shrink-0">
                    {user.role === 'SUPER_ADMIN' ? 'Admin' : 'OPD'}
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted truncate font-mono">
                  {user.email}
                </div>
                <div className="pt-1.5 border-t border-stroke/40 flex items-center gap-2">
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium text-center transition-colors shadow-2xs">
                    {user.role === 'SUPER_ADMIN' ? 'Admin Dashboard' : 'Dashboard OPD'}
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2 pb-1.5">
                Navigasi Halaman
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-brand text-white font-semibold shadow-2xs'
                          : 'text-ink-secondary hover:text-ink hover:bg-surface border border-transparent'
                      }`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Theme Mode Segmented Switcher (System, Dark, Light) */}
            <div className="space-y-1.5 pt-2 border-t border-stroke/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2">
                Tampilan Tema
              </div>
              <div className="grid grid-cols-3 p-1 bg-surface-subtle rounded-xl border border-stroke/60 gap-1">
                <button
                  type="button"
                  onClick={() => applyTheme('system')}
                  className={`py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-surface-elevated text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Sistem</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('light')}
                  className={`py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-surface-elevated text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('dark')}
                  className={`py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-surface-elevated text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}>
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gelap</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer: Auth action */}
          <div className="p-4 border-t border-stroke bg-surface">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-hz-button">
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Portal</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}

export function EvaluationNavbarStatus({ userRole, className }: { userRole?: string; className?: string }) {
  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false)
  const [unsavedCount, setUnsavedCount] = useState<number>(0)
  const [showTransientIcon, setShowTransientIcon] = useState<boolean>(false)
  const [justChanged, setJustChanged] = useState<boolean>(false)
  const prevHasUnsavedRef = useRef<boolean | null>(null)
  const iconTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ hasUnsaved: boolean; count: number }>
      if (customEvent.detail) {
        const nextHasUnsaved = customEvent.detail.hasUnsaved
        const nextCount = customEvent.detail.count

        // Trigger transient icon & animation only when status genuinely toggles
        if (prevHasUnsavedRef.current !== null && prevHasUnsavedRef.current !== nextHasUnsaved) {
          setJustChanged(true)
          setShowTransientIcon(true)

          if (iconTimerRef.current) clearTimeout(iconTimerRef.current)
          iconTimerRef.current = setTimeout(() => {
            setShowTransientIcon(false)
          }, 3000)

          const popTimer = setTimeout(() => setJustChanged(false), 500)
          prevHasUnsavedRef.current = nextHasUnsaved
          setHasUnsaved(nextHasUnsaved)
          setUnsavedCount(nextCount)
          return () => {
            clearTimeout(popTimer)
          }
        }

        prevHasUnsavedRef.current = nextHasUnsaved
        setHasUnsaved(nextHasUnsaved)
        setUnsavedCount(nextCount)
      }
    }

    window.addEventListener('evaluation-status-change', handleStatusChange)
    return () => {
      window.removeEventListener('evaluation-status-change', handleStatusChange)
      if (iconTimerRef.current) clearTimeout(iconTimerRef.current)
    }
  }, [])

  return (
    <div
      className={`${className || 'hidden lg:flex'} items-center px-3.5 py-1.5 border rounded-full transition-all duration-300 ${
        hasUnsaved
          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 shadow-2xs'
          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 shadow-2xs'
      }`}>
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-transform duration-300 ${
          justChanged ? 'animate-status-pop' : ''
        }`}>
        {hasUnsaved ? (
          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            {/* Morphing Icon Container */}
            <span className="relative flex items-center justify-center w-3.5 h-3.5">
              {/* Alert Icon */}
              <AlertCircle
                className={`absolute w-3.5 h-3.5 text-amber-600 dark:text-amber-300 transition-all duration-500 ease-out ${
                  showTransientIcon
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-50 -rotate-45 pointer-events-none'
                }`}
              />
              {/* Dotted Indicator */}
              <span
                className={`w-2 h-2 rounded-full bg-amber-500 transition-all duration-500 ease-out ${
                  showTransientIcon
                    ? 'opacity-0 scale-0'
                    : 'opacity-100 scale-100 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                }`}
              />
            </span>
            <span>Belum Disimpan {unsavedCount > 0 ? `(${unsavedCount})` : ''}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            {/* Morphing Icon Container */}
            <span className="relative flex items-center justify-center w-3.5 h-3.5">
              {/* Checkmark Icon */}
              <Check
                className={`absolute w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 transition-all duration-500 ease-out ${
                  showTransientIcon
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-50 rotate-45 pointer-events-none'
                }`}
              />
              {/* Dotted Indicator with soft bloom on reveal */}
              <span
                className={`w-2 h-2 rounded-full bg-emerald-500 transition-all duration-500 ease-out ${
                  showTransientIcon
                    ? 'opacity-0 scale-0'
                    : 'opacity-100 scale-100 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                }`}
              />
            </span>
            <span>Telah Disimpan</span>
          </span>
        )}
      </div>
    </div>
  )
}
