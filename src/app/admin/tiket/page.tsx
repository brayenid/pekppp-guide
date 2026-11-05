import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { getAdminTicketsAction, getActiveUnitsForTicketAction } from '../../../actions/ticket-actions'
import { AdminTicketListClient } from './AdminTicketListClient'

export const metadata = {
  title: 'Manajemen Tiket & Pengaduan - Admin PEKPPP',
  description: 'Pusat pemantauan, telaah, dan disposisi tiket laporan pelayanan publik Kabupaten Kutai Barat.'
}

export const revalidate = 0

export default async function AdminTicketPage() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const [ticketsRes, unitsRes] = await Promise.all([
    getAdminTicketsAction({ page: 1, limit: 15 }),
    getActiveUnitsForTicketAction()
  ])

  return (
    <AdminTicketListClient
      initialData={ticketsRes.items || []}
      initialPagination={ticketsRes.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 }}
      initialStats={ticketsRes.stats || { total: 0, open: 0, inProgress: 0, dispatched: 0, resolved: 0 }}
      units={unitsRes.units || []}
    />
  )
}
