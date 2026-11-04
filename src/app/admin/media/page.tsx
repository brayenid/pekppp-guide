// src/app/admin/media/page.tsx
import { requireSuperAdmin } from '../../../services/auth-guard'
import { getMediaAssetsAction } from '../../../actions/media-actions'
import { MediaManagerClient } from './MediaManagerClient'

export const revalidate = 0

export const metadata = {
  title: 'Media Manager & Pustaka Berkas - Admin PEKPPP.ext',
  description: 'Pusat pengelolaan berkas agnostik, format template dokumen, dan meta data keterkaitan.'
}

export default async function AdminMediaPage() {
  await requireSuperAdmin()

  // Ambil initial batch page pertama (18 item) secara real server-side
  const res = await getMediaAssetsAction({ page: 1, limit: 18 })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <MediaManagerClient
        initialItems={res.items || []}
        totalCount={res.totalCount || 0}
        categoryCounts={res.categoryCounts || {}}
        fileTypeCounts={res.fileTypeCounts || {}}
      />
    </div>
  )
}
