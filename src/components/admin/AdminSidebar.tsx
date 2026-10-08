'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Building2,
  Users,
  UserCog,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  FileCheck,
  MessageSquare,
  Menu,
  X
} from 'lucide-react'

const ADMIN_NAV = [
  {
    href: '/admin/periode',
    label: 'Tahun Penilaian PEKPPP',
    icon: CalendarDays,
    description: 'Lokus & evaluasi PEKPPP'
  },
  {
    href: '/admin/lokus',
    label: 'Master Lokus',
    icon: Building2,
    description: 'Daftar master unit kerja'
  },
  {
    href: '/admin/panduan-bukti',
    label: 'Master Panduan Bukti',
    icon: FileCheck,
    description: 'Contoh berkas 6 Aspek'
  },
  {
    href: '/admin/akun',
    label: 'Manajemen Akun',
    icon: UserCog,
    description: 'Super Admin & OPD'
  },
  {
    href: '/admin/pengaturan-ai',
    label: 'Pengaturan & Konteks AI',
    icon: Sparkles,
    description: 'Model, biaya & 6 Aspek Utama'
  },
  {
    href: '/admin/pengaturan-api',
    label: 'Pengaturan API',
    icon: ShieldCheck,
    description: 'Integrasi API MenPAN-RB'
  },
  {
    href: '/admin/pengaturan-wa',
    label: 'Pengaturan WhatsApp',
    icon: MessageSquare,
    description: 'Bot Gateway Fonnte & Notifikasi'
  }
]

export interface PeriodItem {
  id: string
  year: number
  title?: string | null
  isOpen: boolean
}

export default function AdminSidebar({ periods = [] }: { periods?: PeriodItem[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-close on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentNav =
    ADMIN_NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + '/')) || ADMIN_NAV[0]
  const CurrentIcon = currentNav.icon

  return (
    <>
      {/* ── Mobile Admin Subheader Bar (< lg) ────────────────────────── */}
      <div className="lg:hidden sticky top-16 z-30 w-full bg-surface border-b border-stroke px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0 border border-brand/20">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold block leading-none">
              Super Admin
            </span>
            <span className="text-xs font-semibold text-ink truncate block mt-0.5">
              {currentNav.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-subtle hover:bg-stroke/30 text-ink text-xs font-semibold border border-stroke/60 transition-colors shadow-2xs min-h-[38px] cursor-pointer shrink-0">
          <Menu className="w-3.5 h-3.5 text-brand" />
          <span>Menu Admin</span>
        </button>
      </div>

      {/* ── Mobile Admin Drawer Overlay & Aside (< lg) ──────────────── */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer Panel from Left */}
        <aside
          className={`absolute top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-canvas border-r border-stroke shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          {/* Drawer Header */}
          <div className="p-4 border-b border-stroke flex items-center justify-between gap-3 bg-surface">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">Super Admin</div>
              <div className="font-semibold text-sm text-ink tracking-tight">Admin Dashboard</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu admin"
              className="w-9 h-9 rounded-full bg-surface-subtle hover:bg-stroke/30 text-ink flex items-center justify-center transition-colors cursor-pointer border border-stroke/50">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {ADMIN_NAV.map(({ href, label, icon: Icon, description }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-brand text-white font-semibold shadow-2xs'
                      : 'text-ink-secondary hover:bg-surface hover:text-ink border border-transparent'
                  }`}>
                  <div
                    className={`p-1.5 rounded-xl transition-colors shrink-0 mt-0.5 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-ink-muted'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs leading-tight ${isActive ? 'font-semibold text-white' : 'font-medium text-ink'}`}>
                      {label}
                    </div>
                    <div className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>
                      {description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Back to Site */}
          <div className="p-4 border-t border-stroke bg-surface">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle border border-stroke/50 text-xs text-ink-secondary hover:text-ink font-semibold transition-all min-h-[44px]">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Situs Publik</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Desktop Persistent Sidebar (≥ lg) ───────────────────────── */}
      <aside className="hidden lg:flex sticky top-20 h-[calc(100vh-80px)] w-72 shrink-0 bg-surface/95 border-r border-stroke flex-col overflow-y-auto self-start z-30">
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-stroke bg-surface-subtle/30">
          <div className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">Super Admin</div>
          <div className="font-medium text-sm text-ink tracking-tight">Admin Dashboard</div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3.5 space-y-1.5">
          {ADMIN_NAV.map(({ href, label, icon: Icon, description }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-surface-elevated text-ink font-medium shadow-soft-card border border-stroke/60'
                    : 'text-ink-secondary hover:bg-surface-subtle/80 hover:text-ink'
                }`}>
                <div
                  className={`p-1.5 rounded-xl transition-colors shrink-0 mt-0.5 ${
                    isActive ? 'bg-brand-light text-brand' : 'bg-transparent text-ink-muted group-hover:text-ink'
                  }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs leading-tight ${isActive ? 'font-semibold text-ink' : 'font-normal text-ink-secondary group-hover:text-ink'}`}>
                    {label}
                  </div>
                  <div className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
                    {description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Back to Site */}
        <div className="p-4 border-t border-stroke/40">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-subtle border border-stroke/50 text-xs text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-all font-medium shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Situs</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
