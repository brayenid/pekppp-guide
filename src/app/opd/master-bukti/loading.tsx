// src/app/opd/master-bukti/loading.tsx
import { Skeleton } from '../../../components/ui/Skeleton'

export default function OpdMasterBuktiLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Workspace Header Skeleton */}
      <div className="rounded-2xl border border-stroke/70 bg-surface p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-56 h-6 rounded-lg" />
              <Skeleton className="w-24 h-5 rounded-md" />
            </div>
            <Skeleton className="w-72 h-3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-7 rounded-full" />
            <Skeleton className="w-24 h-7 rounded-full" />
          </div>
        </div>

        {/* Toolbar Skeleton (Aspect Selector & Actions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-stroke/50">
          <Skeleton className="w-full sm:w-80 h-9 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-8 rounded-xl" />
            <Skeleton className="w-20 h-8 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-stroke/70 bg-surface p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-4 rounded" />
                  <Skeleton className="w-20 h-4 rounded" />
                </div>
                <Skeleton className="w-3/4 h-4 rounded" />
              </div>
              <Skeleton className="w-10 h-5 rounded-full" />
            </div>
            <Skeleton className="w-full h-8 rounded-lg" />
            <div className="pt-2 border-t border-stroke/40 flex items-center justify-between">
              <Skeleton className="w-28 h-6 rounded-md" />
              <Skeleton className="w-24 h-6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
