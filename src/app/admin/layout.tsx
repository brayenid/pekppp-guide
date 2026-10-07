import { db } from '../../services/db'
import { requireSuperAdmin } from '../../services/auth-guard'
import AdminSidebar from '../../components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin()

  const periods = await db.evaluationPeriod.findMany({
    orderBy: { year: 'desc' }
  })

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden -mt-6 -mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
      <AdminSidebar periods={periods} />
      <main className="flex-1 overflow-auto p-6 lg:p-8 bg-canvas">
        {children}
      </main>
    </div>
  )
}
