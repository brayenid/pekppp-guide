// src/components/ui/Breadcrumb.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: React.ReactNode
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /**
   * Optional standalone back link/button that renders a quick navigation button on the left
   */
  backLink?: {
    href?: string
    onClick?: () => void
    label?: string
  }
  /**
   * If true, renders a back arrow icon before the first item instead of a separate backLink button
   */
  showBackOnFirst?: boolean
  /**
   * Separator style: default is subtle chevron
   */
  separator?: 'chevron' | 'slash'
  className?: string
}

export function Breadcrumb({
  items,
  backLink,
  showBackOnFirst = false,
  separator = 'chevron',
  className = ''
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-1 sm:gap-1.5 text-xs text-ink-muted mb-4 sm:mb-6 pt-0.5 min-h-[32px] min-w-0 max-w-full overflow-hidden ${className}`}>
      {backLink && (
        <>
          {backLink.href ? (
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 -ml-1 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-elevated/80 border border-transparent hover:border-stroke/60 transition-all group shrink-0 active:scale-[0.98]">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{backLink.label || 'Kembali'}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={backLink.onClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 -ml-1 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-elevated/80 border border-transparent hover:border-stroke/60 transition-all group shrink-0 active:scale-[0.98] cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{backLink.label || 'Kembali'}</span>
            </button>
          )}
          <span className="w-px h-3.5 bg-stroke/80 mx-1 shrink-0" aria-hidden="true" />
        </>
      )}

      <ol className="flex items-center flex-wrap gap-1 sm:gap-1.5 min-w-0 max-w-full">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0
          const Icon = item.icon

          return (
            <li key={index} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              {index > 0 && (
                <span className="text-ink-muted/40 select-none shrink-0 px-0.5" aria-hidden="true">
                  {separator === 'slash' ? (
                    <span className="text-ink-muted/30 font-light select-none">/</span>
                  ) : (
                    <ChevronRight className="w-3 h-3 text-ink-muted/40" />
                  )}
                </span>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-ink text-ink-muted hover:bg-surface-elevated/70 px-2 py-1 -my-1 rounded-md font-medium transition-all inline-flex items-center gap-1.5 max-w-[130px] sm:max-w-[260px] md:max-w-none truncate min-w-0 group">
                  {showBackOnFirst && isFirst && !backLink && (
                    <ArrowLeft className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  )}
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : item.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-ink text-ink-muted hover:bg-surface-elevated/70 px-2 py-1 -my-1 rounded-md font-medium transition-all inline-flex items-center gap-1.5 max-w-[130px] sm:max-w-[260px] md:max-w-none truncate min-w-0 group cursor-pointer">
                  {showBackOnFirst && isFirst && !backLink && (
                    <ArrowLeft className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  )}
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-1 py-0.5 max-w-[150px] sm:max-w-[340px] md:max-w-none truncate min-w-0 ${
                    isLast ? 'text-ink font-semibold' : 'font-medium'
                  }`}
                  aria-current={isLast ? 'page' : undefined}>
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-brand" />}
                  <span className="truncate">{item.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
