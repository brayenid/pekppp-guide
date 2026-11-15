import { ActivityLogClient } from './ActivityLogClient'
import { getActivityLogsAction, getActivityLogStatsAction } from '../../../actions/activity-log-actions'
import { requireSuperAdmin } from '../../../services/auth-guard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log Aktivitas & Audit Trail - PEKPPP.ext'
}

export default async function AdminActivityLogPage() {
  await requireSuperAdmin()

  const [logsRes, statsRes] = await Promise.all([
    getActivityLogsAction({ page: 1, pageSize: 20 }),
    getActivityLogStatsAction()
  ])

  return (
    <ActivityLogClient
      initialLogs={logsRes.logs as any}
      initialTotal={logsRes.total}
      initialTotalPages={logsRes.totalPages}
      initialCurrentPage={logsRes.currentPage}
      initialStats={statsRes as any}
    />
  )
}
