import { PageHeaderSkeleton, CardGridSkeleton } from '../../components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-8 w-full pb-12">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} />
    </div>
  )
}
