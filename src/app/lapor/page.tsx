import { db } from '../../services/db'
import { getCurrentUserAction } from '../../actions/auth-actions'
import { LaporClient } from './LaporClient'

export const metadata = {
  title: 'Lapor & Tiket Pengaduan - PEKPPP.ext',
  description: 'Pusat layanan pengaduan, aspirasi, dan konsultasi pelayanan publik terbuka Kabupaten Kutai Barat.'
}

export const revalidate = 0

export default async function LaporPage() {
  const [currentUser, units] = await Promise.all([
    getCurrentUserAction(),
    db.unit.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="min-h-screen bg-canvas py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <LaporClient currentUser={currentUser} units={units} />
      </div>
    </div>
  )
}
