import { Skeleton } from '../../../components/ui/Skeleton'

export default function EvaluasiLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-stroke/50 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-48 sm:w-64 h-5 rounded-md" />
            <Skeleton className="w-36 h-3 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-28 h-8 rounded-full" />
        </div>
      </div>

      {/* Main Grid: Aspect Navigation & Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Aspect Navigator Column */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-surface border border-stroke/50 space-y-3 shadow-2xs">
            <Skeleton className="w-32 h-4 rounded-md" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl border border-stroke/30 flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Skeleton className="w-28 h-3.5 rounded-md" />
                    <Skeleton className="w-40 h-2.5 rounded-md" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Questionnaire / Evidence Content Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl bg-surface border border-stroke/50 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-stroke/40">
              <Skeleton className="w-48 h-5 rounded-md" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>

            {/* Question Card Skeletons */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-stroke/30 bg-surface-subtle/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-24 h-4 rounded-md" />
                    <Skeleton className="w-16 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-full h-3.5 rounded-md" />
                  <Skeleton className="w-4/5 h-3.5 rounded-md" />
                  <div className="pt-2 flex gap-2">
                    <Skeleton className="w-24 h-7 rounded-xl" />
                    <Skeleton className="w-32 h-7 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
