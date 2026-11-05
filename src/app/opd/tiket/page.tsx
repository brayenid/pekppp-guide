import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { getOpdTicketsAction } from '../../../actions/ticket-actions'
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

  const ticketsRes = await getOpdTicketsAction({ page: 1, limit: 20 })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <OpdTicketListClient
        initialData={ticketsRes.items || []}
        pagination={ticketsRes.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }}
        stats={ticketsRes.stats || { total: 0, open: 0, inProgress: 0, dispatched: 0, resolved: 0 }}
      />
    </div>
  )
}
