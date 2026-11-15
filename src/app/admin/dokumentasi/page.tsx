import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { DokumentasiClient } from './DokumentasiClient'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Dokumentasi Integrasi MenPAN-RB - PEKPPP.ext'
}

export default async function AdminDokumentasiPage() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login?redirect=/admin/dokumentasi')
  }

  return (
    <div className="space-y-6 w-full pb-12">
      <Suspense fallback={null}>
        <DokumentasiClient />
      </Suspense>
    </div>
  )
}
