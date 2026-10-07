'use server'

import { getCurrentUserAction } from './auth-actions'
import { getFonnteWaConfig, saveFonnteWaConfig, FonnteWaConfig } from '../services/system-setting-service'
import { WhatsAppService } from '../services/whatsapp-service'
import { revalidatePath } from 'next/cache'

export async function getFonnteSettingsAction(): Promise<FonnteWaConfig> {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Hanya Super Admin yang diizinkan mengakses pengaturan WhatsApp.')
  }
  return await getFonnteWaConfig()
}

export async function saveFonnteSettingsAction(config: Partial<FonnteWaConfig>) {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Hanya Super Admin yang diizinkan menyimpan pengaturan WhatsApp.')
  }

  await saveFonnteWaConfig(config)
  revalidatePath('/admin/pengaturan-wa')
  return { success: true }
}

export async function testFonnteConnectionAction(targetPhone: string) {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Error('Hanya Super Admin yang dapat menguji koneksi WhatsApp.')
  }

  return await WhatsAppService.testConnection(targetPhone)
}
