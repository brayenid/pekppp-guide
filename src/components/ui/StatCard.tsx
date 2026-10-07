'use client'

import React from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  badge,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-surface border border-stroke/50 rounded-bento p-5 shadow-soft-card flex flex-col justify-between transition-all duration-200 hover:border-stroke hover:shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-xs font-medium text-ink-muted">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center text-ink-secondary shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-normal text-ink tracking-tight">
            {value}
          </span>
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-pastel-green-text' : 'text-pastel-rose-text'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>

        {sublabel && (
          <p className="text-xs text-ink-muted truncate" title={sublabel}>
            {sublabel}
          </p>
        )}
      </div>

      {badge && <div className="mt-3 pt-3 border-t border-line">{badge}</div>}
    </div>
  )
}
