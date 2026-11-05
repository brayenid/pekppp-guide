'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  LayoutDashboard,
  LogOut,
  Sun,
  Moon,
  Monitor,
  FolderOpen,
  Newspaper,
  MessageSquare
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserNavDropdown } from './UserNavDropdown'

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/alur-proses', label: 'Alur Proses', icon: Workflow },
  { href: '/hasil', label: 'Hasil Evaluasi', icon: BarChart3 },
  { href: '/kabar', label: 'Kabar & Artikel', icon: Newspaper },
  { href: '/wiki', label: 'Wiki Indikator', icon: BookOpen },
  { href: '/contoh-berkas', label: 'Contoh Berkas', icon: FolderOpen },
  { href: '/panduan', label: 'Panduan', icon: FileText },
  { href: '/lapor', label: 'Lapor & Bantuan', icon: MessageSquare }
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserSession | null>(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>('system')

  const isLoginPage = pathname === '/login'
  useEffect(() => {
    if (!isLoginPage) {
      getCurrentUserAction().then(setUser)
    }
  }, [isLoginPage])

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
  const isHome = pathname === '/'

  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position to transition from transparent (hero) to frosted brand glass
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Dynamic navbar styling:
  // - Homepage (/): completely transparent at top (merging into the jumbotron), frosts when scrolling.
  // - Sub-pages (/alur-proses, /hasil, etc.): solid fixed brand navbar.
  const navbarClasses = isHome
    ? isScrolled
      ? 'bg-[#154E9E]/95 dark:bg-[#0B0C10]/95 backdrop-blur-md border-b border-white/10 shadow-md text-white'
      : 'bg-transparent border-b border-transparent text-white'
    : 'bg-[#154E9E] dark:bg-[#0B0C10]/95 backdrop-blur-md border-b border-white/10 shadow-sm text-white'

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${navbarClasses}`}>
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group py-0.5 min-w-0 shrink-0">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Image
                src="/kubar.png"
                alt="Logo Kutai Barat"
                width={32}
                height={32}
                className="w-full h-full object-contain dark:grayscale dark:contrast-125 dark:brightness-110 group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white dark:text-ink">PEKPPP.ext</span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-white/80 dark:text-ink-muted">Kutai Barat</span>
            </div>
          </Link>

          {/* Center Section: Public Nav Pills */}
          {!isEvaluation && (
            <div className="hidden lg:flex items-center gap-1 p-1 bg-black/15 backdrop-blur-sm border border-white/15 rounded-full shadow-inner dark:bg-white/[0.06] dark:border-white/10">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-brand dark:bg-brand dark:text-white font-semibold shadow-sm'
                        : 'text-white/85 hover:text-white hover:bg-white/10 dark:text-ink-secondary dark:hover:text-white dark:hover:bg-white/[0.08] font-normal'
                    }`}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Section: Notification Bell + Profile (Desktop) + Hamburger (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isEvaluation && <EvaluationNavbarStatus variant="navbar" className="flex" />}
            {user && <NotificationBell />}

            {/* Desktop User Dropdown */}
            <div className="hidden lg:block">
              {user ? (
                <UserNavDropdown user={user} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-white/90 text-brand dark:bg-brand dark:hover:bg-brand-hover dark:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button (unified 36x36px matching Bell) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white dark:bg-surface-elevated dark:hover:bg-surface-subtle dark:border-stroke dark:text-ink flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0">
              <Menu className="w-4 h-4" />
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
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain dark:grayscale dark:contrast-125"
                />
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
              <div className="p-3 rounded-xl bg-surface border border-stroke/60 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink truncate">{user.fullName}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/20 shrink-0">
                    {user.role === 'SUPER_ADMIN' ? 'Admin' : 'OPD'}
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted truncate font-mono">
                  {user.email}
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

          {/* Drawer Footer: Dashboard Shortcut & Auth Action */}
          <div className="p-4 border-t border-stroke bg-surface space-y-2">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user.role === 'SUPER_ADMIN' ? 'Admin Dashboard' : 'Dashboard OPD'}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </>
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

export function EvaluationNavbarStatus({
  userRole,
  className,
  variant = 'navbar'
}: {
  userRole?: string
  className?: string
  variant?: 'navbar' | 'page'
}) {
  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false)
  const [unsavedCount, setUnsavedCount] = useState<number>(0)
  const [justChanged, setJustChanged] = useState<boolean>(false)
  const prevHasUnsavedRef = useRef<boolean | null>(null)

  useEffect(() => {
    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ hasUnsaved: boolean; count: number }>
      if (customEvent.detail) {
        const nextHasUnsaved = customEvent.detail.hasUnsaved
        const nextCount = customEvent.detail.count

        if (prevHasUnsavedRef.current !== null && prevHasUnsavedRef.current !== nextHasUnsaved) {
          setJustChanged(true)
          const popTimer = setTimeout(() => setJustChanged(false), 500)
          prevHasUnsavedRef.current = nextHasUnsaved
          setHasUnsaved(nextHasUnsaved)
          setUnsavedCount(nextCount)
          return () => clearTimeout(popTimer)
        }

        prevHasUnsavedRef.current = nextHasUnsaved
        setHasUnsaved(nextHasUnsaved)
        setUnsavedCount(nextCount)
      }
    }

    window.addEventListener('evaluation-status-change', handleStatusChange)
    return () => {
      window.removeEventListener('evaluation-status-change', handleStatusChange)
    }
  }, [])

  const tooltipText = hasUnsaved
    ? `Belum Disimpan (${unsavedCount} perubahan)`
    : 'Seluruh perubahan telah tersimpan'

  if (variant === 'page') {
    return (
      <div
        title={tooltipText}
        className={`${className || 'flex'} h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border items-center gap-1.5 transition-colors shrink-0 ${
          hasUnsaved
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        } ${justChanged ? 'animate-status-pop' : ''}`}>
        {hasUnsaved ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium">Belum Disimpan {unsavedCount > 0 ? `(${unsavedCount})` : ''}</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium">Tersimpan</span>
          </>
        )}
      </div>
    )
  }

  // Variant: navbar
  return (
    <div
      title={tooltipText}
      className={`${className || 'flex'} relative h-9 w-9 sm:w-auto sm:px-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white dark:bg-surface-elevated dark:hover:bg-surface-subtle dark:border-stroke dark:text-ink items-center justify-center sm:justify-start gap-1.5 shrink-0 shadow-sm transition-all select-none ${
        justChanged ? 'animate-status-pop' : ''
      }`}>
      {hasUnsaved ? (
        <>
          <AlertCircle className="w-4 h-4 text-amber-300 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline text-xs font-medium text-amber-200 dark:text-amber-300 whitespace-nowrap">
            Belum Disimpan {unsavedCount > 0 ? `(${unsavedCount})` : ''}
          </span>
          {unsavedCount > 0 && (
            <span className="sm:hidden absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-mono font-bold flex items-center justify-center border-2 border-brand dark:border-[#0B0C10] shadow-xs">
              {unsavedCount > 9 ? '9+' : unsavedCount}
            </span>
          )}
        </>
      ) : (
        <>
          <Check className="w-4 h-4 text-emerald-300 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline text-xs font-medium text-white/95 dark:text-ink whitespace-nowrap">
            Tersimpan
          </span>
        </>
      )}
    </div>
  )
}
