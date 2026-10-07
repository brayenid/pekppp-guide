'use client'

import React from 'react'

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  headerTitle?: string
  headerMeta?: React.ReactNode
  headerActions?: React.ReactNode
  emptyMessage?: string
  isEmpty?: boolean
  isLoading?: boolean
  emptyIcon?: React.ReactNode
}

export function DataTable({
  children,
  headerTitle,
  headerMeta,
  headerActions,
  emptyMessage = 'Belum ada data.',
  isEmpty = false,
  isLoading = false,
  emptyIcon,
  className = '',
  ...props
}: DataTableProps) {
  return (
    <div
      className={`bg-card border border-line rounded-2xl overflow-hidden shadow-2xs ${className}`}
      {...props}
    >
      {(headerTitle || headerMeta || headerActions) && (
        <div className="px-6 py-3.5 bg-surface-subtle/30 border-b border-stroke/40 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            {headerTitle && (
              <span className="text-xs font-medium text-ink">
                {headerTitle}
              </span>
            )}
            {headerMeta}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="divide-y divide-stroke/30">
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-stroke/20 shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="w-3/4 h-3.5 rounded-md bg-surface-subtle border border-stroke/20" />
                  <div className="w-1/2 h-2.5 rounded-md bg-surface-subtle border border-stroke/20" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="w-20 h-5 rounded-full bg-surface-subtle border border-stroke/20" />
                <div className="w-16 h-4 rounded-md bg-surface-subtle border border-stroke/20" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="py-14 px-6 text-center space-y-2">
          {emptyIcon && (
            <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted mx-auto mb-3">
              {emptyIcon}
            </div>
          )}
          <p className="text-xs text-ink-muted">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
