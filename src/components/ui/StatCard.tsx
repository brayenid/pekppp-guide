'use client'

import React from 'react'
import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: React.ReactNode
  suffix?: React.ReactNode
  sublabel?: React.ReactNode
  sublabelClassName?: string
  valueClassName?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  compact?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  suffix,
  sublabel,
  sublabelClassName = '',
  valueClassName = '',
  icon,
  badge,
  trend,
  compact = false,
  className = '',
}: StatCardProps) {
  return (
    <Card
      padding={compact ? 'sm' : 'md'}
      hoverable
      className={`flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2.5 mb-2">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-surface-subtle flex items-center justify-center text-ink-secondary shrink-0 border border-stroke/50 shadow-2xs">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`${
              compact ? 'text-2xl font-semibold' : 'text-2xl sm:text-3xl font-semibold'
            } text-ink tracking-tight font-mono tabular-nums ${valueClassName}`}
          >
            {value}
          </span>
          {suffix && (
            <span className="text-xs font-normal text-ink-muted">{suffix}</span>
          )}
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
          <div
            className={`text-[11px] text-ink-muted truncate ${sublabelClassName}`}
            title={typeof sublabel === 'string' ? sublabel : undefined}
          >
            {sublabel}
          </div>
        )}
      </div>

      {badge && <div className="mt-3 pt-2.5 border-t border-stroke/40">{badge}</div>}
    </Card>
  )
}
