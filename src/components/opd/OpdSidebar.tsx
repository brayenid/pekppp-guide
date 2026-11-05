// src/components/opd/OpdSidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import {
  ArrowLeft,
  Menu,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react'
import {
  BuildingDuotoneIcon,
  ArchiveDuotoneIcon,
  FolderNotchDuotoneIcon,
  TicketDuotoneIcon
} from '../ui/icons/SidebarIcons'
import { OpdYearSelect } from '../features/OpdYearSelect'

export interface OpdSidebarProps {
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
  allBoundUnits: {
    id: string
    code: string | null
    name: string
    categoryName: string
  }[]
  availableYears: number[]
  defaultYear: number | null
  unitStatsMap?: Record<
    string,
    {
      evaluasiPercentage?: number
      filledMandatory?: number
      totalMandatory?: number
    }
  >
}

export function OpdSidebar({
  user,
  allBoundUnits,
  availableYears,
  defaultYear,
  unitStatsMap = {}
}: OpdSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Auto-close drawer on route change
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

  // Resolve active unit from URL searchParams
  const queryUnitId = searchParams.get('unitId')
  const selectedUnitId =
    queryUnitId && allBoundUnits.some((u) => u.id === queryUnitId)
      ? queryUnitId
      : allBoundUnits[0]?.id || ''

  // Resolve active year from URL searchParams
  const queryYear = searchParams.get('tahun')
    ? parseInt(searchParams.get('tahun')!, 10)
    : null
  const selectedYear =
    queryYear && availableYears.includes(queryYear)
      ? queryYear
      : defaultYear || availableYears[0] || null

  const activeUnit =
    allBoundUnits.find((u) => u.id === selectedUnitId) || allBoundUnits[0] || null

  const activeStats = unitStatsMap[selectedUnitId]

  const handleSelectUnit = (nextUnitId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('unitId', nextUnitId)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
      router.refresh()
    })
  }

  const handleSelectYear = (nextYear: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextYear === defaultYear) {
      params.delete('tahun')
    } else {
      params.set('tahun', String(nextYear))
    }
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
      router.refresh()
    })
  }

  const getHrefWithParams = (targetPath: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const qs = params.toString()
    return qs ? `${targetPath}?${qs}` : targetPath
  }

  const isEvaluasiActive = pathname === '/opd' || pathname === '/opd/evaluasi'
  const isMasterActive =
    pathname === '/opd/master-bukti' || pathname.startsWith('/opd/master-bukti')

  const NAV_ITEMS = [
    {
      id: 'evaluasi',
      href: '/opd',
      label: 'Evaluasi Tahunan',
      icon: BuildingDuotoneIcon,
      isActive: isEvaluasiActive,
      badge: (active: boolean) =>
        activeStats?.evaluasiPercentage !== undefined ? (
          <span
            title={`Progres Kuesioner Mandiri F01 (${activeUnit?.name || 'Lokus Aktif'} - Tahun ${selectedYear}): ${activeStats.evaluasiPercentage}%`}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              active
                ? 'bg-white/20 text-white'
                : activeStats.evaluasiPercentage === 100
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-brand/10 text-brand'
            }`}>
            {activeStats.evaluasiPercentage}%
          </span>
        ) : null
    },
    {
      id: 'master-bukti',
      href: '/opd/master-bukti',
      label: 'Master Bukti Dukung',
      icon: ArchiveDuotoneIcon,
      isActive: isMasterActive,
      badge: (active: boolean) =>
        activeStats?.filledMandatory !== undefined ? (
          <span
            title={`Keterisian Dokumen Induk Tetap (${activeUnit?.name || 'Lokus Aktif'}): ${activeStats.filledMandatory} dari ${activeStats.totalMandatory || 29} Slot Bukti Terunggah`}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              active ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand'
            }`}>
            {activeStats.filledMandatory}/{activeStats.totalMandatory || 29}
          </span>
        ) : null
    },
    {
      id: 'contoh-berkas',
      href: '/opd/contoh-berkas',
      label: 'Format & Contoh Berkas',
      icon: FolderNotchDuotoneIcon,
      isActive: pathname.startsWith('/opd/contoh-berkas'),
      badge: () => null
    },
    {
      id: 'tiket',
      href: '/opd/tiket',
      label: 'Tiket & Pengaduan',
      icon: TicketDuotoneIcon,
      isActive: pathname.startsWith('/opd/tiket'),
      badge: () => null
    }
  ]

  const currentNav = NAV_ITEMS.find((n) => n.isActive) || NAV_ITEMS[0]
  const CurrentIcon = currentNav.icon

  return (
    <>
      {/* ── Mobile OPD Drawer Overlay & Aside (< lg) ──────────────── */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}>
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />

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
                  className="w-full h-full object-contain dark:grayscale dark:contrast-125 dark:brightness-110"
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
              aria-label="Tutup menu OPD"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white dark:bg-surface-elevated dark:hover:bg-surface-subtle dark:text-ink dark:border-stroke flex items-center justify-center transition-colors cursor-pointer border border-white/20 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-2.5 space-y-3">
            {/* Lokus & Tahun Selector */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block">
                    Lokus Pelayanan
                  </span>
                  {isPending && (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-300 dark:text-brand" />
                  )}
                </div>
                {allBoundUnits.length > 1 ? (
                  <div className="relative">
                    <select
                      value={selectedUnitId}
                      onChange={(e) => handleSelectUnit(e.target.value)}
                      disabled={isPending}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-white/10 dark:bg-surface-elevated text-white dark:text-ink border border-white/20 dark:border-stroke text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400/30 cursor-pointer disabled:opacity-60 disabled:cursor-wait">
                      {allBoundUnits.map((u) => (
                        <option key={u.id} value={u.id} className="text-ink bg-surface">
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/70 dark:text-ink-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : activeUnit ? (
                  <div className="px-3 py-2 rounded-xl bg-white/10 dark:bg-surface-elevated border border-white/20 dark:border-stroke text-xs font-semibold text-white dark:text-ink truncate">
                    {activeUnit.name}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block">
                  Tahun Evaluasi
                </span>
                <OpdYearSelect
                  years={availableYears}
                  selectedYear={selectedYear}
                  defaultYear={defaultYear}
                  className="!bg-white/10 dark:!bg-surface-elevated !text-white dark:!text-ink !border-white/20 dark:!border-stroke"
                  onChangeYear={handleSelectYear}
                />
              </div>
            </div>

            {/* Navigasi Utama */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block mb-1.5">
                Menu
              </span>
              <nav className="space-y-1.5">
                {NAV_ITEMS.map(({ id, href, label, icon: Icon, isActive, badge }) => (
                  <Link
                    key={id}
                    href={getHrefWithParams(href)}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#1D5BB9] font-bold shadow-md dark:bg-brand dark:text-white dark:shadow-none'
                        : 'text-white/80 hover:bg-white/10 hover:text-white dark:text-ink-secondary dark:hover:bg-white/[0.08] dark:hover:text-ink'
                    }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1D5BB9] dark:text-white' : 'text-white/70 dark:text-ink-muted'}`}
                      />
                      <span className="truncate">{label}</span>
                    </div>
                    {badge(isActive)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Back to Site */}
          <div className="p-3 shrink-0">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-white/90 hover:text-white hover:bg-white/15 dark:bg-surface-elevated dark:border-stroke dark:text-ink dark:hover:bg-surface-subtle font-medium transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 text-white dark:text-ink" />
              <span>Kembali ke Situs</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Desktop Persistent Sidebar (≥ lg) ───────────────────────── */}
      <aside className="hidden lg:flex w-64 h-screen shrink-0 bg-brand dark:bg-[#0B0C10] text-white dark:text-ink flex-col overflow-hidden z-20 transition-colors">
        {/* Top 56px Header: Website Title & Logo (Stay Pinned) */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <Image
                src="/kubar.png"
                alt="Logo Kutai Barat"
                width={28}
                height={28}
                className="w-full h-full object-contain dark:grayscale dark:contrast-125 dark:brightness-110 group-hover:scale-105 transition-transform"
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

        {/* Sidebar Content (Only Content & Menu Scrolls) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2.5 space-y-3">
          {/* Lokus & Tahun Selector */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block">
                  Lokus Pelayanan
                </span>
                {isPending && (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-300 dark:text-brand" />
                )}
              </div>
              {allBoundUnits.length > 1 ? (
                <div className="relative">
                  <select
                    value={selectedUnitId}
                    onChange={(e) => handleSelectUnit(e.target.value)}
                    disabled={isPending}
                    aria-label="Pilih Lokus Pelayanan"
                    className="w-full px-2.5 py-1.5 pr-7 rounded-lg bg-white/10 hover:bg-white/15 dark:bg-surface-elevated dark:hover:bg-surface-subtle border border-white/20 dark:border-stroke text-xs font-semibold text-white dark:text-ink appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400/30 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait">
                    {allBoundUnits.map((u) => (
                      <option key={u.id} value={u.id} className="text-ink bg-surface">
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70 dark:text-ink-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : activeUnit ? (
                <div className="px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-surface-elevated border border-white/20 dark:border-stroke text-xs font-semibold text-white dark:text-ink truncate">
                  {activeUnit.name}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block">
                Tahun Evaluasi
              </span>
              <OpdYearSelect
                years={availableYears}
                selectedYear={selectedYear}
                defaultYear={defaultYear}
                className="!bg-white/10 hover:!bg-white/15 dark:!bg-surface-elevated dark:hover:!bg-surface-subtle !border-white/20 dark:!border-stroke !text-white dark:!text-ink"
                onChangeYear={handleSelectYear}
              />
            </div>
          </div>

          {/* Nav Items */}
          <div className="pt-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 dark:text-ink-muted block mb-1">
              Menu
            </span>
            <nav className="space-y-1.5">
              {NAV_ITEMS.map(({ id, href, label, icon: Icon, isActive, badge }) => (
                <Link
                  key={id}
                  href={getHrefWithParams(href)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1D5BB9] font-bold shadow-md dark:bg-brand dark:text-white dark:shadow-none'
                      : 'text-white/80 hover:bg-white/10 hover:text-white dark:text-ink-secondary dark:hover:bg-white/[0.08] dark:hover:text-ink'
                  }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1D5BB9] dark:text-white' : 'text-white/70 dark:text-ink-muted'}`}
                    />
                    <span className="truncate">{label}</span>
                  </div>
                  {badge(isActive)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Back to Site */}
        <div className="p-3 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-xs text-white hover:text-white hover:bg-white/20 dark:bg-surface-elevated dark:border-stroke dark:text-ink dark:hover:bg-surface-subtle font-semibold transition-all shadow-2xs">
            <ArrowLeft className="w-3.5 h-3.5 text-white dark:text-ink" />
            <span>Kembali ke Situs</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
