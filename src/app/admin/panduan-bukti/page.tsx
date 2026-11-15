// src/app/admin/panduan-bukti/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '../../../actions/evidence-slot-actions'
import { EvidenceGuideManagerClient } from './EvidenceGuideManagerClient'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Master Panduan Bukti - PEKPPP.ext'
}

export default async function PanduanBuktiAdminPage() {
  await requireSuperAdmin()

  const res = await getAllAspectEvidenceSlotsWithGuidesAction()

  return <EvidenceGuideManagerClient initialSlots={res.slots || []} />
}
