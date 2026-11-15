// src/app/admin/pengaturan-bukti/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getEvidenceSlotsRulesConfig } from '../../../services/system-setting-service'
import { AspectRulesSettingsClient } from './AspectRulesSettingsClient'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Aturan Bukti Dukung - PEKPPP.ext'
}

export default async function PengaturanBuktiAdminPage() {
  await requireSuperAdmin()
  const rules = await getEvidenceSlotsRulesConfig()

  return <AspectRulesSettingsClient initialRules={rules} />
}
