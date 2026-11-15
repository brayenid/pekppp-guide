// src/app/admin/pengaturan-ai/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getAiEvaluatorConfig } from '../../../services/system-setting-service'
import { AiSettingsClient } from './AiSettingsClient'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Pengaturan Asisten AI - PEKPPP.ext'
}

export default async function PengaturanAiPage() {
  await requireSuperAdmin()

  const config = await getAiEvaluatorConfig()
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY?.trim())

  return <AiSettingsClient initialConfig={config} hasApiKey={hasApiKey} />
}
