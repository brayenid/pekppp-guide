'use server'

import {
  ActivityLogService,
  GetActivityLogsFilter,
  RetentionPurgeOptions
} from '../services/activity-log-service'
import { requireSuperAdmin } from '../services/auth-guard'
import { revalidatePath } from 'next/cache'
import { ActivityCategory } from '@prisma/client'

export async function getActivityLogsAction(filter: GetActivityLogsFilter = {}) {
  await requireSuperAdmin()
  return await ActivityLogService.getLogs(filter)
}

export async function getActivityLogStatsAction() {
  await requireSuperAdmin()
  return await ActivityLogService.getStats()
}

export async function purgeActivityLogsAction(options: {
  olderThanDays: number
  category?: ActivityCategory
}) {
  const user = await requireSuperAdmin()

  const result = await ActivityLogService.purgeRetention({
    olderThanDays: options.olderThanDays,
    category: options.category,
    actorId: user.id,
    actorName: user.fullName || user.email,
    actorRole: user.role
  })

  revalidatePath('/admin/log-aktivitas')
  return result
}
