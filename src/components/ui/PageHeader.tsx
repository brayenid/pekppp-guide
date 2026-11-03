'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useHeaderContext } from '../layout/HeaderContext'
import { SpeedDial, SpeedDialItem } from './SpeedDial'

export interface PageHeaderProps {
  tag?: string
  title: string
  titleClassName?: string
  description?: string | React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  speedDialItems?: SpeedDialItem[]
  hideMobileTitle?: boolean
  className?: string
}

export function PageHeader({
  tag,
  title,
  titleClassName = '',
  description,
  icon,
  badge,
  actions,
  speedDialItems,
  hideMobileTitle,
  className = '',
}: PageHeaderProps) {
  const pathname = usePathname()
  const { setHeaderConfig, clearHeader } = useHeaderContext()
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/opd')
  const shouldHideMobileTitle = hideMobileTitle !== undefined ? hideMobileTitle : isDashboard

  useEffect(() => {
    setHeaderConfig({
      title,
      icon,
      badge: tag ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold border border-white/20">
          {tag}
        </span>
      ) : badge,
      actions
    })

    return () => {
      clearHeader()
    }
  }, [title, icon, tag, badge, actions, setHeaderConfig, clearHeader])

  return (
    <>
      {/* ── Mobile Floating Speed Dial for Dashboard Actions ────────── */}
      {isDashboard && (actions || (speedDialItems && speedDialItems.length > 0)) && (
        <SpeedDial actions={actions} items={speedDialItems} label={`Aksi ${title}`} />
      )}

      {/* ── Main Component Header (Hidden on dashboard pages; shown on public pages) ── */}
      <div
        className={`${shouldHideMobileTitle ? 'hidden' : isDashboard ? 'lg:hidden flex' : 'flex'} flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stroke ${className}`}
      >
        <div className="space-y-2 max-w-3xl">
          {tag && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-brand-light text-brand text-[11px] font-medium">
                {tag}
              </span>
              {badge}
            </div>
          )}

          <div className="flex items-center gap-3">
            {icon && <div className="shrink-0">{icon}</div>}
            <h1 className={titleClassName || "text-2xl sm:text-3xl font-semibold text-ink tracking-tight"}>
              {title}
            </h1>
            {!tag && badge && <div>{badge}</div>}
          </div>

          {description && (
            <div className="text-xs text-ink-muted leading-relaxed">
              {description}
            </div>
          )}
        </div>

        {actions && !isDashboard && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </>
  )
}
