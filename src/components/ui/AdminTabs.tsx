// src/components/ui/AdminTabs.tsx
'use client'

import React from 'react'
import { cn } from '../../lib/utils'

export interface AdminTabItem<T extends string = string> {
  id: T
  label: React.ReactNode
  icon?: React.ReactNode // e.g. Lucide icon element
  badge?: React.ReactNode // e.g. "I", "II", atau custom prefix badge
  count?: React.ReactNode // e.g. "6 Slot", 12, "Aktif", 60
  disabled?: boolean
}

export interface AdminTabsProps<T extends string = string> {
  items: AdminTabItem<T>[]
  activeId: T
  onChange: (id: T) => void
  className?: string
  bordered?: boolean // Default true: border-b border-stroke/60
  size?: 'sm' | 'default'
  variant?: 'chips' | 'underline'
  rightContent?: React.ReactNode
}

/**
 * Reusable Admin Tabs Component
 * Mendukung dua varian visual utama:
 * 1. 'chips' (default): Tab card-chip dengan rounded-xl & border-stroke/60 (Bento modern style)
 * 2. 'underline': Tab minimalis elegan dengan border-b-2 indikator brand aktif, icon, dan pill counter (Modern Editorial / Operate style)
 */
export function AdminTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  className,
  bordered = true,
  size = 'default',
  variant = 'chips',
  rightContent
}: AdminTabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        className={cn(
          'w-full min-w-0 flex items-center justify-between gap-3',
          bordered && 'border-b border-stroke/60',
          className
        )}>
        <div
          role="tablist"
          className="w-full min-w-0 flex items-center gap-1 overflow-x-auto overflow-y-hidden no-scrollbar">
          {items.map((item) => {
            const isActive = activeId === item.id
            const iconNode = item.icon || (item.badge && typeof item.badge !== 'string' ? item.badge : null)

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={item.disabled}
                onClick={() => !item.disabled && onChange(item.id)}
                className={cn(
                  'font-semibold transition-all cursor-pointer flex items-center gap-2 select-none shrink-0 border-b-2 -mb-px',
                  size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-secondary hover:text-ink hover:border-stroke',
                  item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                )}>
                {iconNode && <span className="shrink-0">{iconNode}</span>}
                {item.badge && !iconNode && (
                  <span
                    className={cn(
                      'w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden leading-none',
                      isActive ? 'bg-brand/10 text-brand' : 'bg-surface-subtle text-ink'
                    )}>
                    {item.badge}
                  </span>
                )}
                <span className="whitespace-nowrap">{item.label}</span>
                {item.count !== undefined && item.count !== null && (
                  React.isValidElement(item.count) ? (
                    <span className="shrink-0 leading-none">{item.count}</span>
                  ) : (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none shrink-0 transition-colors',
                        isActive
                          ? 'bg-brand/10 text-brand font-semibold'
                          : 'bg-surface-subtle text-ink-muted'
                      )}>
                      {item.count}
                    </span>
                  )
                )}
              </button>
            )
          })}
        </div>

        {rightContent && <div className="shrink-0 pl-2">{rightContent}</div>}
      </div>
    )
  }

  // Varian 'chips' (default)
  return (
    <div
      className={cn(
        'w-full min-w-0 flex items-center justify-between gap-2',
        bordered && 'border-b border-stroke/60',
        className
      )}>
      <div
        role="tablist"
        className="w-full min-w-0 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden pb-1 no-scrollbar">
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
              {item.icon && <span className="shrink-0">{item.icon}</span>}
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

      {rightContent && <div className="shrink-0 pb-1 pl-2">{rightContent}</div>}
    </div>
  )
}

/**
 * Shortcut wrapper untuk Tab bergaya Underline
 */
export interface UnderlineTabsProps<T extends string = string> extends Omit<AdminTabsProps<T>, 'variant'> {}

export function UnderlineTabs<T extends string = string>(props: UnderlineTabsProps<T>) {
  return <AdminTabs variant="underline" {...props} />
}
