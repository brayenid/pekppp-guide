import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton } from '../../../../components/ui/Skeleton'

export default function PeriodDetailLoading() {
  return (
    <div className="space-y-6 w-full pb-12">
      <PageHeaderSkeleton />
      <StatCardSkeleton count={4} />
      <TableSkeleton rows={6} />
    </div>
  )
}
