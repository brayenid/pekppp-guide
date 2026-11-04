'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, X, ChevronDown } from 'lucide-react'
import {
  CalendarBlankDuotoneIcon,
  BuildingDuotoneIcon,
  ArchiveDuotoneIcon,
  FilesDuotoneIcon,
  FolderNotchDuotoneIcon,
  GavelDuotoneIcon,
  UsersDuotoneIcon,
  SparkleDuotoneIcon,
  CodeBlockDuotoneIcon,
  BookBookmarkDuotoneIcon,
  NewspaperDuotoneIcon
} from '../ui/icons/SidebarIcons'

export interface NavChildItem {
  href: string
  label: string
  description?: string
}

export interface NavItem {
  id: string
  label: string
  description?: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavChildItem[]
}

const ADMIN_NAV_STRUCTURE: NavItem[] = [
  {
    id: 'periode',
    href: '/admin/periode',
    label: 'Tahun Penilaian PEKPPP',
    icon: CalendarBlankDuotoneIcon,
    description: 'Lokus & evaluasi PEKPPP'
  },
  {
    id: 'lokus',
    href: '/admin/lokus',
    label: 'Master Lokus',
    icon: BuildingDuotoneIcon,
    description: 'Daftar master unit kerja'
  },
  {
    id: 'bukti-dukung',
    label: 'Bukti Dukung & Berkas',
    icon: ArchiveDuotoneIcon,
    description: 'Manajemen berkas & panduan',
    children: [
      {
        href: '/admin/master-bukti',
        label: 'Master Bukti Dukung',
        description: 'Living document & versi berkas'
      },
      {
        href: '/admin/panduan-bukti',
        label: 'Master Panduan Bukti',
        description: 'Contoh berkas 6 Aspek'
      },
      {
        href: '/admin/media',
        label: 'Media & Pustaka Berkas',
        description: 'Katalog berkas & template format'
      },
      {
        href: '/admin/contoh-berkas',
        label: 'Katalog Contoh Berkas',
        description: 'Kurasi format template untuk lokus'
      },
      {
        href: '/admin/pengaturan-bukti',
        label: 'Aturan Bukti Dukung',
        description: 'Format, kuota & ukuran 6 Aspek'
      }
    ]
  },
  {
    id: 'artikel',
    href: '/admin/artikel',
    label: 'Artikel & Kabar',
    icon: NewspaperDuotoneIcon,
    description: 'Publikasi berita & panduan SEO'
  },
  {
    id: 'akun',
    href: '/admin/akun',
    label: 'Manajemen Akun',
    icon: UsersDuotoneIcon,
    description: 'Super Admin & OPD'
  },
  {
    id: 'integrasi-ai-api',
    label: 'Integrasi & Sistem',
    icon: CodeBlockDuotoneIcon,
    description: 'AI, API & dokumentasi sistem',
    children: [
      {
        href: '/admin/pengaturan-ai',
        label: 'Pengaturan & Konteks AI',
        description: 'Model, biaya & 6 Aspek Utama'
      },
      {
        href: '/admin/pengaturan-api',
        label: 'Pengaturan API',
        description: 'Integrasi API MenPAN-RB'
      },
      {
        href: '/admin/dokumentasi',
        label: 'Dokumentasi & Spec API',
        description: 'Fitur & skema JSON MenPAN-RB'
      }
    ]
  }
]

export interface PeriodItem {
  id: string
  year: number
  title?: string | null
  status?: string
  isOpen?: boolean
}

interface AdminSidebarProps {
  periods?: PeriodItem[]
  selectedYear?: number | null
}

export function AdminSidebar({
  periods = [],
  selectedYear = null
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Otomatis buka group jika salah satu sub-itemnya aktif
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {
      'bukti-dukung': true,
      'integrasi-ai-api': false
    }
    // Cek apakah halaman sekarang ada di dalam salah satu children
    ADMIN_NAV_STRUCTURE.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (c) => pathname === c.href || pathname.startsWith(c.href + '/')
        )
        if (hasActiveChild) {
          initialState[item.id] = true
        }
      }
    })
    return initialState
  })

  // Sinkronkan expanded state ketika pathname berpindah rute
  useEffect(() => {
    ADMIN_NAV_STRUCTURE.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (c) => pathname === c.href || pathname.startsWith(c.href + '/')
        )
        if (hasActiveChild) {
          setExpandedGroups((prev) => ({ ...prev, [item.id]: true }))
        }
      }
    })
  }, [pathname])

  // Listen to toggle event from DashboardHeader
  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev)
    window.addEventListener('toggle-dashboard-drawer', handleToggle)
    return () => window.removeEventListener('toggle-dashboard-drawer', handleToggle)
  }, [])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // Komponen render item navigasi (dipakai di mobile & desktop)
  const renderNavItems = (isMobile = false) => {
    return (
      <div className="space-y-1.5">
        {ADMIN_NAV_STRUCTURE.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0

          if (!hasChildren && item.href) {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-brand font-bold shadow-md dark:bg-brand dark:text-white dark:shadow-none'
                    : 'text-white/85 hover:bg-white/10 hover:text-white dark:text-ink-secondary dark:hover:bg-white/[0.08] dark:hover:text-ink'
                }`}>
                <div
                  className={`p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-brand-light text-brand dark:bg-white/20 dark:text-white'
                      : 'bg-white/10 text-white/75 group-hover:text-white group-hover:bg-white/15 dark:bg-white/[0.06] dark:text-ink-muted dark:group-hover:text-ink dark:group-hover:bg-white/10'
                  }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs leading-tight ${
                      isActive
                        ? 'font-bold text-brand dark:text-white'
                        : 'font-medium text-white group-hover:text-white dark:text-ink-secondary dark:group-hover:text-ink'
                    }`}>
                    {item.label}
                  </div>
                  {item.description && (
                    <div
                      className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${
                        isActive
                          ? 'text-brand/80 font-medium dark:text-sky-100'
                          : 'text-white/60 group-hover:text-white/80 dark:text-ink-muted dark:group-hover:text-ink-secondary'
                      }`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            )
          }

          // Collapsible Parent with Children
          const isExpanded = !!expandedGroups[item.id]
          const isAnyChildActive =
            item.children?.some(
              (c) => pathname === c.href || pathname.startsWith(c.href + '/')
            ) ?? false

          return (
            <div key={item.id} className="space-y-1">
              {/* Header Group Trigger */}
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all duration-200 text-left select-none cursor-pointer group ${
                  isAnyChildActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/85 hover:bg-white/10 hover:text-white dark:text-ink-secondary dark:hover:bg-white/[0.08] dark:hover:text-ink'
                }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isAnyChildActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-white/75 group-hover:text-white group-hover:bg-white/15 dark:bg-white/[0.06] dark:text-ink-muted'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight text-white dark:text-ink truncate">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-[10px] text-white/60 dark:text-ink-muted line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-white/70 ${
                    isExpanded ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Children Submenu with connecting tree-line */}
              {isExpanded && item.children && (
                <div className="relative pl-5 ml-4 mt-0.5 space-y-1">
                  {item.children.map((child, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === (item.children?.length ?? 0) - 1
                    const isChildActive =
                      pathname === child.href || pathname.startsWith(child.href + '/')

                    return (
                      <div key={child.href} className="relative">
                        {/* Garis vertikal & lengkungan cabang individual */}
                        {isLast ? (
                          // Item terakhir: Garis vertikal dari atas (-top-1 untuk menyambung anak sebelumnya) sampai titik tengah lalu melengkung lembut ke kanan
                          <div
                            aria-hidden="true"
                            className="absolute -left-3.5 -top-1 h-[calc(50%+4px)] w-3 rounded-bl-lg border-b border-l border-white/30 dark:border-white/20 pointer-events-none"
                          />
                        ) : (
                          // Item selain terakhir: Garis vertikal tembus menghubungkan antar anak + cabang horizontal
                          <>
                            <div
                              aria-hidden="true"
                              className={`absolute -left-3.5 bottom-0 w-px bg-white/25 dark:bg-white/15 pointer-events-none ${
                                isFirst ? 'top-0' : '-top-1'
                              }`}
                            />
                            <div
                              aria-hidden="true"
                              className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-px transition-colors ${
                                isChildActive
                                  ? 'bg-white dark:bg-white'
                                  : 'bg-white/30 dark:bg-white/20 group-hover:bg-white/60'
                              }`}
                            />
                          </>
                        )}

                        <Link
                          href={child.href}
                          onClick={() => isMobile && setMobileOpen(false)}
                          className={`relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 group ${
                            isChildActive
                              ? 'bg-white text-brand font-bold shadow-xs dark:bg-brand dark:text-white'
                              : 'text-white/80 hover:text-white hover:bg-white/10 dark:text-ink-secondary dark:hover:text-ink dark:hover:bg-white/[0.06]'
                          }`}>
                          <span className="truncate leading-snug">{child.label}</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile Drawer (≤ md) ────────────────────────────────────── */}
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
          className={`absolute top-0 left-0 bottom-0 w-[80vw] max-w-[280px] bg-brand dark:bg-[#0B0C10] text-white dark:text-ink shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          {/* Drawer Header (Stay Pinned) */}
          <div className="h-14 px-4 flex items-center justify-between gap-3 shrink-0">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain grayscale contrast-125 brightness-110"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm tracking-tight text-white dark:text-ink">
                  PEKPPP<span className="text-sky-200 dark:text-brand font-medium">.ext</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-sky-100 dark:text-ink-muted">
                  Kutai Barat
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu admin"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white dark:bg-surface-elevated dark:hover:bg-surface-subtle dark:text-ink dark:border-stroke flex items-center justify-center transition-colors cursor-pointer border border-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items (Only Menu Scrolls) */}
          <nav className="flex-1 overflow-y-auto min-h-0 p-2.5">
            {renderNavItems(true)}
          </nav>

          {/* Back to Site (Stay Pinned) */}
          <div className="p-3 shrink-0">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white hover:text-white hover:bg-white/20 dark:bg-surface-elevated dark:border-stroke dark:text-ink dark:hover:bg-surface-subtle font-semibold transition-all min-h-[40px]">
              <ArrowLeft className="w-3.5 h-3.5 text-white dark:text-ink" />
              <span>Kembali ke Situs Publik</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Desktop Persistent Sidebar (≥ lg) ───────────────────────── */}
      <aside className="hidden lg:flex w-64 h-screen shrink-0 bg-brand dark:bg-[#0B0C10] flex-col overflow-hidden z-20 transition-colors">
        {/* Top 56px Header: Website Title & Logo (Stay Pinned) */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <Image
                src="/kubar.png"
                alt="Logo Kutai Barat"
                width={28}
                height={28}
                className="w-full h-full object-contain grayscale contrast-125 brightness-110 group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight text-white dark:text-ink">
                PEKPPP<span className="text-sky-200 dark:text-brand font-medium">.ext</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-sky-100 dark:text-ink-muted">
                Kutai Barat
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Items (Only Menu Scrolls) */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-2.5">
          {renderNavItems(false)}
        </nav>

        {/* Back to Site (Stay Pinned) */}
        <div className="p-3 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-xs text-white hover:text-white hover:bg-white/20 dark:bg-surface-elevated dark:border-stroke dark:text-ink dark:hover:bg-surface-subtle transition-all font-semibold shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 text-white dark:text-ink" />
            <span>Kembali ke Situs</span>
          </Link>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar

