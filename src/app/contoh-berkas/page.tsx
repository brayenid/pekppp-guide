// src/app/contoh-berkas/page.tsx
import React from 'react'
import { getContohBerkasListAction } from '../../actions/contoh-berkas-actions'
import { getCurrentUserAction } from '../../actions/auth-actions'
import { ContohBerkasClient } from './ContohBerkasClient'

export const revalidate = 0

export const metadata = {
  title: 'Format & Contoh Berkas PEKPPP - Kutai Barat',
  description:
    'Pusat format dokumen baku, formulir isian, panduan teknis, dan regulasi resmi dalam bentuk PDF, DOCX, dan XLSX untuk seluruh unit lokus pelayanan di lingkungan Pemerintah Kabupaten Kutai Barat.'
}

export default async function ContohBerkasPage() {
  const [res, user] = await Promise.all([
    getContohBerkasListAction({ onlyActive: true }),
    getCurrentUserAction()
  ])

  return (
    <ContohBerkasClient
      initialItems={res.items || []}
      totalCount={res.totalCount || 0}
      categoryCounts={res.categoryCounts || {}}
      fileTypeCounts={res.fileTypeCounts || {}}
      isAdmin={user?.role === 'SUPER_ADMIN'}
    />
  )
}
