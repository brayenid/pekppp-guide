import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { getContohBerkasListAction } from '../../../actions/contoh-berkas-actions'
import { OpdContohBerkasClient } from './OpdContohBerkasClient'

export const metadata = {
  title: 'Format & Contoh Berkas - OPD PEKPPP',
  description: 'Pusat format dokumen baku, regulasi, dan contoh instrumen bukti dukung PEKPPP Kabupaten Kutai Barat.'
}

export const revalidate = 0

export default async function OpdContohBerkasPage() {
  const user = await getCurrentUserAction()
  if (!user) {
    redirect('/login')
  }

  const res = await getContohBerkasListAction({ onlyActive: true })

  return (
    <OpdContohBerkasClient
      initialItems={res.items || []}
      totalCount={res.totalCount || 0}
      categoryCounts={res.categoryCounts || {}}
      fileTypeCounts={res.fileTypeCounts || {}}
    />
  )
}