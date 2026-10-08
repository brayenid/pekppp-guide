'use client'

import React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export type NoticeBannerVariant = 'warning' | 'info' | 'success' | 'danger' | 'neutral'

export interface NoticeBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: NoticeBannerVariant
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon | null
  badge?: React.ReactNode
  action?: React.ReactNode
  /**
   * Jika true, gunakan tampilan yang lebih compact (misal untuk callout / catatan pendek)
   */
  compact?: boolean
}

const variantStyles: Record<
  NoticeBannerVariant,
  {
    container: string
    iconColor: string
    titleColor: string
    descColor: string
    defaultIcon: LucideIcon
    badgeBg: string
  }
> = {
  warning: {
    container:
      'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-950 dark:text-amber-200 font-semibold',
    descColor: 'text-amber-900/90 dark:text-amber-300/90',
    defaultIcon: AlertTriangle,
    badgeBg:
      'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  },
  info: {
    container:
      'bg-sky-500/10 border-sky-500/30 text-sky-950 dark:bg-sky-500/15 dark:border-sky-500/40 dark:text-sky-100',
    iconColor: 'text-sky-600 dark:text-sky-400',
    titleColor: 'text-sky-950 dark:text-sky-200 font-semibold',
    descColor: 'text-sky-900/90 dark:text-sky-300/90',
    defaultIcon: Info,
    badgeBg:
      'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
  },
  success: {
    container:
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-emerald-950 dark:text-emerald-200 font-semibold',
    descColor: 'text-emerald-900/90 dark:text-emerald-300/90',
    defaultIcon: CheckCircle2,
    badgeBg:
      'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
  },
  danger: {
    container:
      'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
    titleColor: 'text-rose-950 dark:text-rose-200 font-semibold',
    descColor: 'text-rose-900/90 dark:text-rose-300/90',
    defaultIcon: AlertCircle,
    badgeBg:
      'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
  },
  neutral: {
    container:
      'bg-surface-subtle border-stroke/70 text-ink dark:bg-surface-elevated dark:border-stroke dark:text-ink',
    iconColor: 'text-ink-muted',
    titleColor: 'text-ink font-semibold',
    descColor: 'text-ink-secondary',
    defaultIcon: Info,
    badgeBg: 'bg-surface text-ink-secondary border-stroke',
  },
}

/**
 * NoticeBanner: Komponen box notifikasi / warning / callout yang reusable
 * dan 100% konsisten readable baik di Light Mode maupun Dark Mode.
 */
export function NoticeBanner({
  variant = 'warning',
  title,
  description,
  icon,
  badge,
  action,
  compact = false,
  className = '',
  children,
  ...props
}: NoticeBannerProps) {
  const config = variantStyles[variant]
  const IconComponent = icon === null ? null : (icon || config.defaultIcon)

  return (
    <div
      role="alert"
      className={`rounded-2xl border transition-colors shadow-2xs ${config.container} ${
        compact ? 'p-3 sm:p-3.5 text-xs' : 'p-4 sm:p-4.5 text-xs'
      } ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {IconComponent && (
            <IconComponent
              className={`w-4 h-4 shrink-0 mt-0.5 ${config.iconColor}`}
              aria-hidden="true"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {title && (
              <div className={`leading-snug ${config.titleColor}`}>
                {title}
              </div>
            )}
            {description && (
              <div className={`leading-relaxed font-normal ${config.descColor}`}>
                {description}
              </div>
            )}
            {children && (
              <div className={`leading-relaxed font-normal ${config.descColor}`}>
                {children}
              </div>
            )}
          </div>
        </div>

        {(badge || action) && (
          <div className="flex items-center gap-2 shrink-0 self-start">
            {badge && (
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${config.badgeBg}`}
              >
                {badge}
              </span>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
