'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUserAction, UserSession } from '../../actions/auth-actions'
import { useState, useEffect, useRef } from 'react'
import { LogIn, Check, AlertCircle } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserNavDropdown } from './UserNavDropdown'

const NAV_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/alur-proses', label: 'Alur Proses' },
  { href: '/hasil', label: 'Hasil Evaluasi' },
  { href: '/wiki', label: 'Wiki Indikator' },
  { href: '/panduan', label: 'Panduan' },
  { href: '/regulasi', label: 'Regulasi' }
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserSession | null>(null)

  useEffect(() => {
    getCurrentUserAction().then(setUser)
  }, [pathname])

  const isAdmin = pathname.startsWith('/admin')
  const isOpd = pathname.startsWith('/opd')
  const isEvaluation = pathname.startsWith('/evaluasi')

  return (
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

        {/* Center Section: Admin / OPD / Evaluation Context Capsule or Public Nav Pills */}
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

        {/* Right Section: Notification Bell + Profile / Login */}
        <div className="flex items-center gap-2.5">
          {user && <NotificationBell />}

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
      </div>
    </nav>
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
