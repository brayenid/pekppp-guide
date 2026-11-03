// src/app/opd/loading.tsx
import { Skeleton } from '../../components/ui/Skeleton'

export default function OpdEvaluasiLoading() {
  return (
    <div className="space-y-6 w-full pb-12 animate-pulse">
      {/* PageHeader Skeleton */}
      <div className="pb-6 border-b border-stroke space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-md shrink-0" />
          <Skeleton className="w-64 h-8 rounded-lg" />
        </div>
        <Skeleton className="w-96 h-3.5 rounded" />
      </div>

      {/* Timeline Strip Skeleton */}
      <div className="rounded-2xl border border-line bg-card p-5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="w-48 h-4 rounded" />
              <Skeleton className="w-64 h-3 rounded" />
            </div>
          </div>
          <Skeleton className="w-28 h-6 rounded-full" />
        </div>
        <Skeleton className="w-full h-2 rounded-full" />
      </div>

      {/* DataTable Skeleton */}
      <div className="bg-card border border-line rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-3.5 bg-surface-subtle/30 border-b border-stroke/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-44 h-4 rounded" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
        </div>
        <div className="divide-y divide-line">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-56 h-4 rounded" />
                  <Skeleton className="w-24 h-4 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-28 h-5 rounded-full" />
                  <Skeleton className="w-44 h-5 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-32 h-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
