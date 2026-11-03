import { db } from '../../services/db'
import { requireSuperAdmin } from '../../services/auth-guard'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { DashboardHeader } from '../../components/layout/DashboardHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin()

  const periods = await db.evaluationPeriod.findMany({
    orderBy: { year: 'desc' }
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand dark:bg-[#0B0C10]">
      {/* Kolom 1: Sidebar Desktop (100vh) & Drawer Mobile */}
      <AdminSidebar periods={periods} />

      {/* Kolom 2: Lane Kerja Terpadu (Header + Konten dalam 1 Kolom Vertikal) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-brand dark:bg-[#0B0C10]">
        <DashboardHeader role="admin" />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-7 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-7 bg-canvas dark:bg-[#141418] min-w-0 rounded-t-2xl lg:rounded-tr-none lg:rounded-tl-[24px] shadow-[-2px_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[-4px_-4px_24px_rgba(0,0,0,0.6)] dark:border-t lg:dark:border-t dark:border-l lg:dark:border-l dark:border-white/[0.07]">
          {children}
        </main>
      </div>
    </div>
  )
}
