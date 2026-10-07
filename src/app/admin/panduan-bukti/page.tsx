// src/app/admin/panduan-bukti/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '../../../actions/evidence-slot-actions'
import { EvidenceGuideManagerClient } from './EvidenceGuideManagerClient'

export const revalidate = 0

export default async function PanduanBuktiAdminPage() {
  await requireSuperAdmin()

  const res = await getAllAspectEvidenceSlotsWithGuidesAction()

  return <EvidenceGuideManagerClient initialSlots={res.slots || []} />
}
