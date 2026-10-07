import { getFonnteSettingsAction } from '../../../actions/whatsapp-actions'
import { WaSettingsClient } from './WaSettingsClient'
import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'

export const revalidate = 0

export default async function AdminPengaturanWaPage() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login?redirect=/admin/pengaturan-wa')
  }

  const initialConfig = await getFonnteSettingsAction()

  return (
    <div className="space-y-6 w-full pb-12">
      <WaSettingsClient initialConfig={initialConfig} />
    </div>
  )
}
