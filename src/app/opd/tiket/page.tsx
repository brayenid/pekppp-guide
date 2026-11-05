import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { getOpdTicketsAction } from '../../../actions/ticket-actions'
import { db } from '../../../services/db'
import { OpdTicketListClient } from './OpdTicketListClient'

export const metadata = {
  title: 'Tiket & Pengaduan Lokus - OPD PEKPPP',
  description: 'Tindak lanjut laporan masyarakat dan pengaduan layanan publik unit lokus.'
}

export const revalidate = 0

export default async function OpdTicketPage() {
  const user = await getCurrentUserAction()
  if (!user) {
    redirect('/login')
  }

  const [ticketsRes, units] = await Promise.all([
    getOpdTicketsAction({ page: 1, limit: 15 }),
    db.unit.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <OpdTicketListClient
      initialData={ticketsRes.items || []}
      initialPagination={ticketsRes.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 }}
      initialStats={ticketsRes.stats || { total: 0, open: 0, inProgress: 0, dispatched: 0, resolved: 0 }}
      units={units}
      currentUser={user}
    />
  )
}
