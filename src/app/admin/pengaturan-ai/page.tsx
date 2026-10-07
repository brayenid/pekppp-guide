// src/app/admin/pengaturan-ai/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getAiEvaluatorConfig } from '../../../services/system-setting-service'
import { AiSettingsClient } from './AiSettingsClient'

export const revalidate = 0

export default async function PengaturanAiPage() {
  await requireSuperAdmin()

  const config = await getAiEvaluatorConfig()
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY?.trim())

  return <AiSettingsClient initialConfig={config} hasApiKey={hasApiKey} />
}
