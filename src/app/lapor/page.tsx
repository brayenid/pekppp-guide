import { Suspense } from 'react'
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
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 pb-16">
      <Suspense fallback={<div className="p-12 text-center text-xs text-ink-muted">Memuat portal layanan...</div>}>
        <LaporClient currentUser={currentUser} units={units} />
      </Suspense>
    </div>
  )
}
