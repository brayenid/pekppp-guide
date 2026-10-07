import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton } from '../../components/ui/Skeleton'

export default function HasilLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeaderSkeleton />
      <StatCardSkeleton count={3} />
      <TableSkeleton rows={7} />
    </div>
  )
}
