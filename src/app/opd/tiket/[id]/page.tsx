import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../../actions/auth-actions'
import { getTicketDetailAction } from '../../../../actions/ticket-actions'
import { OpdTicketDetailClient } from './OpdTicketDetailClient'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Tindak Lanjut Tiket - OPD PEKPPP',
  description: 'Tindak lanjut laporan pengaduan unit lokus pelayanan publik.'
}

export const revalidate = 0

export default async function OpdTicketDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUserAction()
  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params
  const ticketId = resolvedParams.id

  const ticketRes = await getTicketDetailAction(ticketId)

  if (!ticketRes.success || !ticketRes.ticket) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-ink">Tiket Tidak Ditemukan</h1>
        <p className="text-xs text-ink-muted">
          Tiket tidak terdaftar atau unit Anda tidak memiliki akses ke laporan ini.
        </p>
        <Link
          href="/opd/tiket"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tiket</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <OpdTicketDetailClient
        ticket={ticketRes.ticket as any}
        permissions={ticketRes.permissions!}
        currentUser={user}
      />
    </div>
  )
}
