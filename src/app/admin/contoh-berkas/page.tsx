// src/app/admin/contoh-berkas/page.tsx
import React from 'react'
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getContohBerkasListAction } from '../../../actions/contoh-berkas-actions'
import { AdminContohBerkasClient } from './AdminContohBerkasClient'

export const revalidate = 0

export const metadata = {
  title: 'Pengelolaan Contoh Berkas - Admin PEKPPP',
  description: 'Kurasi dan tentukan format berkas baku dari Pustaka Media yang ditampilkan ke unit lokus.'
}

export default async function AdminContohBerkasPage() {
  await requireSuperAdmin()

  const res = await getContohBerkasListAction({ onlyActive: false })

  return (
    <AdminContohBerkasClient
      initialItems={res.items || []}
      totalCount={res.totalCount || 0}
      categoryCounts={res.categoryCounts || {}}
      fileTypeCounts={res.fileTypeCounts || {}}
    />
  )
}
