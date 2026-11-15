import { getMenpanApiConfigAction } from '../../../actions/menpan-actions'
import { ApiSettingsClient } from './ApiSettingsClient'
import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Pengaturan API MenPAN-RB - PEKPPP.ext'
}

export default async function AdminPengaturanApiPage() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login?redirect=/admin/pengaturan-api')
  }

  const initialConfig = await getMenpanApiConfigAction()

  return (
    <div className="space-y-6 w-full pb-12">
      <ApiSettingsClient initialConfig={initialConfig} />
    </div>
  )
}
