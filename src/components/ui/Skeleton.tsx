import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-subtle/80 border border-stroke/20 ${className}`}
      {...props}
    />
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="w-48 sm:w-64 h-6 rounded-lg" />
          <Skeleton className="w-64 sm:w-96 h-3.5 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-24 h-8 rounded-full" />
        <Skeleton className="w-32 h-8 rounded-full" />
      </div>
    </div>
  )
}

export function StatCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-3.5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-bento border border-stroke/50 bg-surface p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <Skeleton className="w-28 h-3.5 rounded-md" />
            <Skeleton className="w-7 h-7 rounded-xl" />
          </div>
          <Skeleton className="w-20 h-7 rounded-lg" />
          <Skeleton className="w-36 h-3 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-bento border border-stroke/50 bg-surface overflow-hidden shadow-2xs">
      {/* Table Header Skeleton */}
      <div className="px-6 py-4 bg-surface-subtle/40 border-b border-stroke/40 flex items-center justify-between gap-4">
        <Skeleton className="w-40 h-4 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-44 h-7 rounded-full" />
          <Skeleton className="w-28 h-7 rounded-full" />
        </div>
      </div>

      {/* Rows Skeleton */}
      <div className="divide-y divide-stroke/30">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <Skeleton className="w-3/4 h-4 rounded-md" />
                <Skeleton className="w-1/2 h-3 rounded-md" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <Skeleton className="w-20 h-5 rounded-full" />
              <Skeleton className="w-16 h-4 rounded-md" />
              <Skeleton className="w-24 h-7 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-bento border border-stroke/50 bg-surface p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="w-24 h-6 rounded-lg" />
              <Skeleton className="w-36 h-3.5 rounded-md" />
            </div>
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <Skeleton className="w-20 h-3 rounded-md" />
              <Skeleton className="w-10 h-3 rounded-md" />
            </div>
            <Skeleton className="w-full h-2 rounded-full" />
          </div>

          <div className="pt-4 border-t border-stroke/40 flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="w-28 h-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
