// src/components/ui/AdminTabs.tsx
'use client'

import React from 'react'
import { cn } from '../../lib/utils'

export interface AdminTabItem<T extends string = string> {
  id: T
  label: React.ReactNode
  badge?: React.ReactNode // e.g. "I", "II", atau Lucide icon
  count?: React.ReactNode // e.g. "6 Slot", 12, "Aktif"
  disabled?: boolean
}

export interface AdminTabsProps<T extends string = string> {
  items: AdminTabItem<T>[]
  activeId: T
  onChange: (id: T) => void
  className?: string
  bordered?: boolean // Default true: border-b border-stroke/60
  size?: 'sm' | 'default'
}

/**
 * Reusable Admin Tabs Component
 * Mengadopsi bahasa desain bento modern dari /admin/pengaturan-bukti:
 * - Tab card-chip dengan rounded-xl & border-stroke/60
 * - Kotak badge / prefix seragam (20x20)
 * - Counter pill badge monospaced
 * - State aktif dengan warna brand utama (Navy / Dark Slate) dan shadow lembut
 */
export function AdminTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  className,
  bordered = true,
  size = 'default'
}: AdminTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar',
        bordered && 'border-b border-stroke/60',
        className
      )}>
      {items.map((item) => {
        const isActive = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={cn(
              'rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-2 border select-none',
              size === 'sm' ? 'px-2.5 text-xs h-8' : 'px-3.5 py-2 text-xs sm:text-sm',
              isActive
                ? 'bg-brand text-white border-brand shadow-2xs font-semibold'
                : 'bg-surface text-ink-secondary hover:text-ink hover:bg-surface-subtle border-stroke/60',
              item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}>
            {item.badge !== undefined && item.badge !== null && (
              <span
                className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden leading-none',
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-ink'
                )}>
                {item.badge}
              </span>
            )}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.count !== undefined && item.count !== null && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono shrink-0 leading-none',
                  isActive ? 'bg-white/20 text-white font-semibold' : 'bg-surface-subtle text-ink-muted'
                )}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
