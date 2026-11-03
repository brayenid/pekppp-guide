'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, LogIn } from 'lucide-react'
import { getCurrentUserAction, UserSession } from '../../actions/auth-actions'
import { NotificationBell } from './NotificationBell'
import { UserNavDropdown } from './UserNavDropdown'
import { useHeaderContext } from './HeaderContext'

export function DashboardHeader({
  role = 'admin'
}: {
  role?: 'admin' | 'opd'
}) {
  const { headerConfig } = useHeaderContext()
  const [user, setUser] = useState<UserSession | null>(null)

  useEffect(() => {
    getCurrentUserAction().then(setUser)
  }, [])

  const handleToggleMobileMenu = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-dashboard-drawer'))
    }
  }

  return (
    <header className="h-14 bg-brand text-white px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Mobile: Hamburger & Active Page Title */}
      <div className="flex items-center gap-2.5 lg:hidden min-w-0">
        <button
          type="button"
          onClick={handleToggleMobileMenu}
          aria-label="Buka Menu Navigasi"
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shrink-0">
          <Menu className="w-4.5 h-4.5" />
        </button>
        <span className="text-xs sm:text-sm font-medium text-white truncate">
          {headerConfig.title || (role === 'admin' ? 'Admin Dashboard' : 'Portal OPD')}
        </span>
      </div>

      {/* Desktop: Active Page Title (Unbolded, Clean, No Icon) */}
      <div className="hidden lg:flex items-center gap-2.5 min-w-0 flex-1 mr-4">
        <h1 className="text-sm font-normal text-white/95 tracking-normal truncate">
          {headerConfig.title || (role === 'admin' ? 'Admin Dashboard' : 'Portal OPD')}
        </h1>
        {headerConfig.badge}
      </div>

      {/* Right Controls: Action Buttons (h-9) + Bell (h-9) + User Profile (h-9) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Action Buttons Slot (e.g. + Tambah Tahun Penilaian, Tambah Lokus, etc.) */}
        {headerConfig.actions && (
          <div className="hidden sm:flex items-center gap-2 shrink-0 [&_button]:!h-9 [&_button]:!px-3.5 [&_button]:!text-xs [&_button]:!rounded-full [&_button]:font-medium [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:transition-all [&_button]:cursor-pointer [&_button.bg-brand]:!bg-white [&_button.bg-brand]:!text-brand [&_button.bg-brand]:hover:!bg-white/90 [&_button.bg-brand]:!shadow-sm [&_button.bg-brand]:!border-0 [&_button.bg-brand_svg]:!text-brand [&_button.bg-surface-elevated]:!bg-white/15 [&_button.bg-surface-elevated]:!text-white [&_button.bg-surface-elevated]:hover:!bg-white/25 [&_button.bg-surface-elevated]:!border-white/25 [&_button.bg-surface-elevated_svg]:!text-white">
            {headerConfig.actions}
          </div>
        )}

        {/* Notification Bell */}
        {user && <NotificationBell />}

        {/* User Account Dropdown */}
        {user ? (
          <UserNavDropdown user={user} />
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white hover:bg-white/90 text-brand text-xs font-semibold transition-all shadow-sm cursor-pointer">
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
        )}
      </div>
    </header>
  )
}
