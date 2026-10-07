'use client'

import React from 'react'

export interface PageHeaderProps {
  tag?: string
  title: string
  description?: string | React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  tag,
  title,
  description,
  icon,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stroke ${className}`}
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
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

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
