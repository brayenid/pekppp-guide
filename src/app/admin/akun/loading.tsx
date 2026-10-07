import { PageHeaderSkeleton, TableSkeleton } from '../../../components/ui/Skeleton'

export default function AkunLoading() {
  return (
    <div className="space-y-6 w-full pb-12">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  )
}
