'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  FolderArchive,
  Sliders,
  BookOpen,
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
    href: '/admin/master-bukti',
    label: 'Master Bukti Dukung',
    icon: FolderArchive,
    description: 'Living document & versi berkas'
  },
  {
    href: '/admin/panduan-bukti',
    label: 'Master Panduan Bukti',
    icon: FileCheck,
    description: 'Contoh berkas 6 Aspek'
  },
  {
    href: '/admin/pengaturan-bukti',
    label: 'Aturan Bukti Dukung',
    icon: Sliders,
    description: 'Format, kuota & ukuran 6 Aspek'
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
    href: '/admin/dokumentasi',
    label: 'Dokumentasi & Spec API',
    icon: BookOpen,
    description: 'Fitur & skema JSON MenPAN-RB'
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

  // Listen to toggle event from DashboardHeader
  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev)
    window.addEventListener('toggle-dashboard-drawer', handleToggle)
    return () => window.removeEventListener('toggle-dashboard-drawer', handleToggle)
  }, [])

  const currentNav =
    ADMIN_NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + '/')) || ADMIN_NAV[0]
  const CurrentIcon = currentNav.icon

  return (
    <>
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
          className={`absolute top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-brand text-white border-r border-[#154694] shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          {/* Drawer Header (Stay Pinned) */}
          <div className="p-4 border-b border-[#154694] flex items-center justify-between gap-3 bg-black/10 shrink-0">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm ring-1 ring-white/20 shrink-0">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight text-white">
                  PEKPPP<span className="text-sky-200 font-medium">.ext</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-sky-100">
                  Kutai Barat
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu admin"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items (Only Menu Scrolls) */}
          <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1.5">
            {ADMIN_NAV.map(({ href, label, icon: Icon, description }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-white text-brand font-bold shadow-md'
                      : 'text-white/85 hover:bg-white/10 hover:text-white border border-transparent'
                  }`}>
                  <div
                    className={`p-1.5 rounded-xl transition-colors shrink-0 mt-0.5 ${
                      isActive ? 'bg-brand-light text-brand' : 'bg-white/10 text-white/75'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs leading-tight ${isActive ? 'font-bold text-brand' : 'font-medium text-white'}`}>
                      {label}
                    </div>
                    <div className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${isActive ? 'text-brand/80 font-medium' : 'text-white/60'}`}>
                      {description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Back to Site (Stay Pinned) */}
          <div className="p-4 border-t border-[#154694] bg-black/10 shrink-0">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white hover:text-white hover:bg-white/20 font-semibold transition-all min-h-[44px]">
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
              <span>Kembali ke Situs Publik</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Desktop Persistent Sidebar (≥ lg) ───────────────────────── */}
      <aside className="hidden lg:flex w-72 h-screen shrink-0 bg-brand border-r border-[#154694] flex-col overflow-hidden shadow-md z-20">
        {/* Top 64px Header: Website Title & Logo (Stay Pinned) */}
        <div className="h-16 px-5 border-b border-[#154694] bg-black/10 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ring-1 ring-white/20 shrink-0">
              <Image
                src="/kubar.png"
                alt="Logo Kutai Barat"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base tracking-tight text-white">
                PEKPPP<span className="text-sky-200 font-medium">.ext</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-sky-100">
                Kutai Barat
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Items (Only Menu Scrolls) */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-1.5">
          {ADMIN_NAV.map(({ href, label, icon: Icon, description }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-brand font-bold shadow-md'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}>
                <div
                  className={`p-1.5 rounded-xl transition-colors shrink-0 mt-0.5 ${
                    isActive ? 'bg-brand-light text-brand' : 'bg-white/10 text-white/75 group-hover:text-white group-hover:bg-white/15'
                  }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs leading-tight ${isActive ? 'font-bold text-brand' : 'font-medium text-white group-hover:text-white'}`}>
                    {label}
                  </div>
                  <div className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${isActive ? 'text-brand/80 font-medium' : 'text-white/60 group-hover:text-white/80'}`}>
                    {description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Back to Site (Stay Pinned) */}
        <div className="p-4 border-t border-[#154694] bg-black/10 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs text-white hover:text-white hover:bg-white/20 transition-all font-semibold shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>Kembali ke Situs</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
