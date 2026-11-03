'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export interface SpeedDialItem {
  id?: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'brand' | 'secondary' | 'danger' | 'success'
  badge?: React.ReactNode
  disabled?: boolean
}

export interface SpeedDialProps {
  /**
   * Structured action items (recommended)
   */
  items?: SpeedDialItem[]
  /**
   * Raw React nodes (e.g. from existing actions prop)
   */
  actions?: React.ReactNode
  children?: React.ReactNode
  /**
   * Custom main FAB icon (default: Plus that rotates 45deg)
   */
  icon?: React.ReactNode
  /**
   * Main button label for screen readers
   */
  label?: string
  className?: string
}

export function SpeedDial({
  items,
  actions,
  children,
  icon,
  label = 'Menu Aksi Cepat',
  className = ''
}: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialRef = useRef<HTMLDivElement>(null)

  // Close on Escape key & lock scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const hasItems = Boolean(items && items.length > 0)
  const hasActions = Boolean(actions || children)

  if (!hasItems && !hasActions) return null

  const handleActionClick = (onClick?: () => void) => {
    setIsOpen(false)
    onClick?.()
  }

  return (
    <div
      ref={dialRef}
      className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-5 sm:right-6 z-50 lg:hidden flex flex-col items-end pointer-events-none ${className}`}
    >
      {/* ── Semi-transparent Dark Backdrop ──────────────────────────── */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ── Action Items Menu (Expands Upward) ────────────────────────── */}
      <div
        className={`flex flex-col items-end gap-3 mb-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 translate-y-6 pointer-events-none scale-95'
        }`}
        role="menu"
        aria-label={label}
      >
        {/* Priority 1: Render Structured Items if available (Never duplicate with actions) */}
        {hasItems ? (
          <div className="flex flex-col items-end gap-3 pointer-events-auto">
            {items!.map((item, index) => {
              const isBrand = item.variant === 'brand' || !item.variant
              const isDanger = item.variant === 'danger'
              const isSuccess = item.variant === 'success'

              const iconBadgeClass = isDanger
                ? 'bg-rose-500 text-white shadow-sm'
                : isSuccess
                ? 'bg-emerald-500 text-white shadow-sm'
                : isBrand
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface-subtle text-ink-secondary'

              const buttonClass =
                'flex items-center justify-end gap-3 h-12 pl-4 pr-2.5 rounded-full bg-surface-elevated dark:bg-[#1E1E23] text-ink shadow-[0_10px_28px_rgba(0,0,0,0.14)] hover:bg-surface-subtle active:scale-95 transition-all duration-150 cursor-pointer select-none group'

              const content = (
                <>
                  {item.badge && <span className="mr-0.5">{item.badge}</span>}
                  <span className="text-xs sm:text-sm font-semibold tracking-tight text-ink group-hover:text-brand transition-colors whitespace-nowrap">
                    {item.label}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-108 ${iconBadgeClass}`}
                  >
                    {item.icon || <Plus className="w-4 h-4" />}
                  </div>
                </>
              )

              if (item.href) {
                return (
                  <Link
                    key={item.id || index}
                    href={item.href}
                    onClick={() => handleActionClick(item.onClick)}
                    role="menuitem"
                    className={buttonClass}
                    style={{
                      transitionDelay: isOpen ? `${(items!.length - index) * 40}ms` : '0ms'
                    }}
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={item.id || index}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => handleActionClick(item.onClick)}
                  role="menuitem"
                  className={`${buttonClass} disabled:opacity-50`}
                  style={{
                    transitionDelay: isOpen ? `${(items!.length - index) * 40}ms` : '0ms'
                  }}
                >
                  {content}
                </button>
              )
            })}
          </div>
        ) : (
          /* Priority 2: Fallback to Raw Actions / Children Nodes (Only when no items provided) */
          <div
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('button, a')) {
                setIsOpen(false)
              }
            }}
            className="flex flex-col items-end gap-2.5 pointer-events-auto [&_div.flex]:!flex-col [&_div.flex]:!items-end [&_div.flex]:!gap-2.5 [&_button]:!h-12 [&_button]:!px-5 [&_button]:!text-xs [&_button]:!font-semibold [&_button]:!shadow-[0_10px_24px_rgba(0,0,0,0.14)] [&_button]:!rounded-full [&_button]:!inline-flex [&_button]:!items-center [&_button]:!gap-2.5 [&_a]:!h-12 [&_a]:!px-5 [&_a]:!text-xs [&_a]:!font-semibold [&_a]:!shadow-[0_10px_24px_rgba(0,0,0,0.14)] [&_a]:!rounded-full [&_a]:!inline-flex [&_a]:!items-center [&_a]:!gap-2.5"
          >
            {actions}
            {children}
          </div>
        )}
      </div>

      {/* ── Main Circular Floating Trigger Button (FAB - 56x56px, Borderless) ───── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={isOpen ? 'Tutup Menu Aksi' : label}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_24px_rgba(29,91,185,0.38)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer pointer-events-auto active:scale-95 ${
          isOpen
            ? 'bg-slate-900 hover:bg-slate-800 scale-105 shadow-2xl'
            : 'bg-brand hover:bg-brand-hover hover:scale-105'
        }`}
      >
        <span
          className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          {icon || <Plus className="w-6 h-6 stroke-[2.75]" />}
        </span>
      </button>
    </div>
  )
}
