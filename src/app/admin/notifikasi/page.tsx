import { Metadata } from 'next'
import { db } from '../../../services/db'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { getPushSubscriptionStatsAction } from '../../../actions/push-actions'
import { AdminBroadcastClient } from './AdminBroadcastClient'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Broadcast & Notifikasi PWA | Admin PEKPPP Kutai Barat',
  description: 'Pengiriman Web Push Notification dan Broadcast Pesan Evaluasi PEKPPP'
}

export default async function AdminNotifikasiPage() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const [units, stats] = await Promise.all([
    db.unit.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    }),
    getPushSubscriptionStatsAction()
  ])

  return <AdminBroadcastClient units={units} stats={stats} />
}
