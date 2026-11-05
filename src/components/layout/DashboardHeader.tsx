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
    <header className="h-14 bg-brand dark:bg-[#0B0C10] text-white dark:text-ink px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
      {/* Mobile: Hamburger & Active Page Title */}
      <div className="flex items-center gap-2.5 lg:hidden min-w-0">
        <button
          type="button"
          onClick={handleToggleMobileMenu}
          aria-label="Buka Menu Navigasi"
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white dark:bg-surface-elevated dark:hover:bg-surface-subtle dark:border-stroke dark:text-ink flex items-center justify-center transition-colors cursor-pointer shrink-0">
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-xs sm:text-sm font-medium text-white dark:text-ink truncate">
          {headerConfig.title || (role === 'admin' ? 'Admin Dashboard' : 'Portal OPD')}
        </span>
      </div>

      {/* Desktop: Active Page Title (Unbolded, Clean, No Icon) */}
      <div className="hidden lg:flex items-center gap-2.5 min-w-0 flex-1 mr-4">
        <h1 className="text-sm font-normal text-white/95 dark:text-ink tracking-normal truncate">
          {headerConfig.title || (role === 'admin' ? 'Admin Dashboard' : 'Portal OPD')}
        </h1>
        {headerConfig.badge}
      </div>

      {/* Right Controls: Action Buttons (h-9) + Bell (h-9) + User Profile (h-9) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Action Buttons Slot (e.g. + Tambah Tahun Penilaian, Tambah Lokus, etc.) */}
        {headerConfig.actions && (
          <div className="hidden sm:flex items-center gap-2 shrink-0 [&_button:not(.dropdown-item)]:!h-9 [&_a:not(.dropdown-item)]:!h-9 [&_button:not(.dropdown-item)]:!px-3.5 [&_a:not(.dropdown-item)]:!px-3.5 [&_button:not(.dropdown-item)]:!text-xs [&_a:not(.dropdown-item)]:!text-xs [&_button:not(.dropdown-item)]:!rounded-full [&_a:not(.dropdown-item)]:!rounded-full [&_button:not(.dropdown-item)]:font-medium [&_a:not(.dropdown-item)]:font-medium [&_button:not(.dropdown-item)]:inline-flex [&_a:not(.dropdown-item)]:inline-flex [&_button:not(.dropdown-item)]:items-center [&_a:not(.dropdown-item)]:items-center [&_button:not(.dropdown-item)]:justify-center [&_a:not(.dropdown-item)]:justify-center [&_button:not(.dropdown-item)]:transition-all [&_a:not(.dropdown-item)]:transition-all [&_button:not(.dropdown-item)]:cursor-pointer [&_a:not(.dropdown-item)]:cursor-pointer [&_button:not(.dropdown-item)]:box-border [&_a:not(.dropdown-item)]:box-border [&_button.bg-brand:not(.dropdown-item)]:!bg-white [&_button.bg-brand:not(.dropdown-item)]:!text-brand [&_button.bg-brand:not(.dropdown-item)]:hover:!bg-white/90 [&_button.bg-brand:not(.dropdown-item)]:!shadow-sm [&_button.bg-brand:not(.dropdown-item)]:!border-0 [&_button.bg-brand:not(.dropdown-item)_svg]:!text-brand [&_button.bg-brand:not(.dropdown-item)_span]:!text-brand dark:[&_button.bg-brand:not(.dropdown-item)]:!bg-brand dark:[&_button.bg-brand:not(.dropdown-item)]:!text-white dark:[&_button.bg-brand:not(.dropdown-item)_svg]:!text-white dark:[&_button.bg-brand:not(.dropdown-item)_span]:!text-white [&_button:not(.bg-brand):not(.dropdown-item)]:!bg-white/15 [&_button:not(.bg-brand):not(.dropdown-item)]:!text-white [&_button:not(.bg-brand):not(.dropdown-item)]:hover:!bg-white/25 [&_button:not(.bg-brand):not(.dropdown-item)]:!border-white/25 [&_button:not(.bg-brand):not(.dropdown-item)_svg]:!text-white [&_button:not(.bg-brand):not(.dropdown-item)_span]:!text-white dark:[&_button:not(.bg-brand):not(.dropdown-item)]:!bg-surface-elevated dark:[&_button:not(.bg-brand):not(.dropdown-item)]:!text-ink dark:[&_button:not(.bg-brand):not(.dropdown-item)]:!border-stroke dark:[&_button:not(.bg-brand):not(.dropdown-item)_svg]:!text-ink dark:[&_button:not(.bg-brand):not(.dropdown-item)_span]:!text-ink [&_.dropdown-menu_button]:!h-auto [&_.dropdown-menu_button]:!px-3 [&_.dropdown-menu_button]:!py-2 [&_.dropdown-menu_button]:!rounded-xl [&_.dropdown-menu_button]:!bg-transparent [&_.dropdown-menu_button]:!border-0 [&_.dropdown-menu_button]:!text-ink [&_.dropdown-menu_button:hover]:!bg-surface-subtle [&_.dropdown-menu_button:hover]:!text-brand [&_.dropdown-menu_button_span]:!text-inherit [&_.dropdown-menu_svg]:![color:inherit]">
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
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white hover:bg-white/90 text-brand dark:bg-brand dark:hover:bg-brand-hover dark:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer">
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
        )}
      </div>
    </header>
  )
}
