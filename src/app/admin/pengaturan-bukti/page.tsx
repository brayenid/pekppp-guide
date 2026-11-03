// src/app/admin/pengaturan-bukti/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getEvidenceSlotsRulesConfig } from '../../../services/system-setting-service'
import { AspectRulesSettingsClient } from './AspectRulesSettingsClient'

export const revalidate = 0

export default async function PengaturanBuktiAdminPage() {
  await requireSuperAdmin()
  const rules = await getEvidenceSlotsRulesConfig()

  return <AspectRulesSettingsClient initialRules={rules} />
}
