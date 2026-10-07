import { PageHeaderSkeleton, TableSkeleton } from '../../../components/ui/Skeleton'

export default function LokusLoading() {
  return (
    <div className="space-y-6 w-full pb-12">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  )
}
