import { getPublicTicketStatusAction } from '../../../actions/ticket-actions'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { TicketDetailClient } from './TicketDetailClient'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export const revalidate = 0

export default async function PublicTicketDetailPage({
  params
}: {
  params: Promise<{ code: string }>
}) {
  const resolvedParams = await params
  const ticketCode = resolvedParams.code

  const [ticketRes, currentUser] = await Promise.all([
    getPublicTicketStatusAction(ticketCode),
    getCurrentUserAction()
  ])

  if (!ticketRes.success || !ticketRes.ticket) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-ink">Tiket Tidak Ditemukan</h1>
            <p className="text-xs text-ink-muted">
              Kode tiket <span className="font-mono font-semibold text-ink">"{ticketCode}"</span> tidak terdaftar dalam basis data sistem.
            </p>
          </div>
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pusat Laporan</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <TicketDetailClient ticket={ticketRes.ticket} currentUser={currentUser} />
      </div>
    </div>
  )
}
