import { db } from './db'
import { ActivityCategory, Role } from '@prisma/client'

export interface LogActivityParams {
  category: ActivityCategory
  action: string
  description: string
  userId?: string | null
  userName?: string | null
  userRole?: Role | null
  unitId?: string | null
  unitName?: string | null
  evaluationId?: string | null
  metadata?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface GetActivityLogsFilter {
  page?: number
  pageSize?: number
  category?: ActivityCategory | 'ALL'
  unitId?: string
  search?: string
  startDate?: string
  endDate?: string
}

export interface RetentionPurgeOptions {
  olderThanDays: number
  category?: ActivityCategory
  actorId?: string
  actorName?: string
  actorRole?: Role
}

export class ActivityLogService {
  /**
   * Mencatat satu entri log aktivitas ke database secara fail-safe.
   * Kesalahan pada logger tidak akan menggagalkan flow utama aplikasi.
   */
  static async log(params: LogActivityParams): Promise<void> {
    try {
      let finalUserId = params.userId
      let finalUserName = params.userName
      let finalUserRole = params.userRole

      // Jika data aktor belum disediakan secara eksplisit, coba deteksi sesi pengguna aktif
      if (!finalUserName) {
        try {
          const { getCurrentUserAction } = await import('../actions/auth-actions')
          const currentUser = await getCurrentUserAction()
          if (currentUser) {
            finalUserId = finalUserId || currentUser.id
            finalUserName = currentUser.fullName || currentUser.email
            finalUserRole = finalUserRole || (currentUser.role as Role)
          }
        } catch {
          // Abaikan jika dipanggil di luar konteks request auth
        }
      }

      await db.activityLog.create({
        data: {
          category: params.category,
          action: params.action,
          description: params.description,
          userId: finalUserId || null,
          userName: finalUserName || 'Sistem / Anonim',
          userRole: finalUserRole || null,
          unitId: params.unitId || null,
          unitName: params.unitName || null,
          evaluationId: params.evaluationId || null,
          metadata: params.metadata ? (params.metadata as any) : undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null
        }
      })
    } catch (err) {
      console.error('[ActivityLogService] Gagal menyimpan log aktivitas:', err)
    }
  }

  /**
   * Mengambil daftar log aktivitas dengan filter dan paginasi untuk kebutuhan tabel Admin.
   */
  static async getLogs(filter: GetActivityLogsFilter = {}) {
    const page = Math.max(1, Number(filter.page) || 1)
    const pageSize = Math.max(5, Math.min(100, Number(filter.pageSize) || 20))
    const skip = (page - 1) * pageSize

    const where: any = {}

    if (filter.category && filter.category !== 'ALL') {
      where.category = filter.category
    }

    if (filter.unitId) {
      where.unitId = filter.unitId
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim()
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { userName: { contains: q, mode: 'insensitive' } },
        { unitName: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {}
      if (filter.startDate) {
        const start = new Date(filter.startDate)
        start.setHours(0, 0, 0, 0)
        where.createdAt.gte = start
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      db.activityLog.count({ where })
    ])

    return {
      logs,
      total,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  }

  /**
   * Mengambil statistik ringkas log aktivitas untuk dasbor & pertimbangan retensi.
   */
  static async getStats() {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      total,
      todayCount,
      sevenDaysCount,
      thirtyDaysCount,
      oldestLog,
      categoryCounts
    ] = await Promise.all([
      db.activityLog.count(),
      db.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
      db.activityLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.activityLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.activityLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      }),
      db.activityLog.groupBy({
        by: ['category'],
        _count: { _all: true }
      })
    ])

    const categoryMap: Partial<Record<ActivityCategory, number>> = {}
    categoryCounts.forEach((c) => {
      categoryMap[c.category] = c._count._all
    })

    return {
      total,
      todayCount,
      sevenDaysCount,
      thirtyDaysCount,
      oldestDate: oldestLog?.createdAt ? oldestLog.createdAt.toISOString() : null,
      categoryCounts: categoryMap
    }
  }

  /**
   * FITUR RETENSI MANUAL:
   * Menghapus log lama yang telah melampaui batas waktu tertentu (misal > 30, 60, 90, 180, 365 hari).
   * Tindakan pembersihan retensi ini sendiri akan dicatat sebagai log audit permanen.
   */
  static async purgeRetention(options: RetentionPurgeOptions): Promise<{
    success: boolean
    deletedCount: number
    cutoffDate: string
    message: string
  }> {
    const days = Math.max(1, options.olderThanDays)
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: any = {
      createdAt: { lt: cutoffDate }
    }

    if (options.category) {
      where.category = options.category
    }

    // 1. Hitung jumlah yang akan dibersihkan
    const eligibleCount = await db.activityLog.count({ where })

    if (eligibleCount === 0) {
      return {
        success: true,
        deletedCount: 0,
        cutoffDate: cutoffDate.toISOString(),
        message: `Tidak ditemukan log yang lebih lama dari ${days} hari untuk dibersihkan.`
      }
    }

    // 2. Eksekusi penghapusan
    const deleteResult = await db.activityLog.deleteMany({ where })

    // 3. Catat aktivitas retensi ke dalam ActivityLog baru sebagai jejak audit
    await db.activityLog.create({
      data: {
        category: 'SYSTEM',
        action: 'RETENTION_PURGE',
        description: `${options.actorName || 'Super Admin'} membersihkan ${deleteResult.count} riwayat log aktivitas yang lebih dari ${days} hari.`,
        userId: options.actorId || null,
        userName: options.actorName || 'Super Admin',
        userRole: options.actorRole || 'SUPER_ADMIN',
        metadata: {
          olderThanDays: days,
          cutoffDate: cutoffDate.toISOString(),
          deletedCount: deleteResult.count,
          targetCategory: options.category || 'ALL'
        }
      }
    })

    return {
      success: true,
      deletedCount: deleteResult.count,
      cutoffDate: cutoffDate.toISOString(),
      message: `Berhasil membersihkan ${deleteResult.count} baris log yang lebih dari ${days} hari (sebelum ${cutoffDate.toLocaleDateString('id-ID')}).`
    }
  }
}
