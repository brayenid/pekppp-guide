'use server'

import { db } from '../services/db'
import { getCurrentUserAction } from './auth-actions'
import { revalidatePath } from 'next/cache'
import { sendWebPush, PushPayload } from '../lib/web-push'

export interface NotificationData {
  id: string
  userId: string | null
  roleTarget: 'SUPER_ADMIN' | 'OPD' | null
  unitId: string | null
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  createdAt: Date
}

export async function createNotificationHelper(data: {
  userId?: string | null
  roleTarget?: 'SUPER_ADMIN' | 'OPD' | null
  unitId?: string | null
  title: string
  message: string
  type: string
  link?: string | null
}) {
  try {
    // 1. Simpan ke database notification (In-app Bell & Notifikasi Page)
    await db.notification.create({
      data: {
        userId: data.userId || null,
        roleTarget: data.roleTarget || null,
        unitId: data.unitId || null,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null
      }
    })

    // 2. Kirim Web Push Notification ke perangkat penerima yang relevan
    let whereCondition: any = {}
    if (data.userId) {
      whereCondition = { userId: data.userId }
    } else if (data.unitId) {
      whereCondition = { role: 'OPD', unitId: data.unitId }
    } else if (data.roleTarget === 'SUPER_ADMIN') {
      whereCondition = { role: 'SUPER_ADMIN' }
    } else if (data.roleTarget === 'OPD') {
      whereCondition = { role: 'OPD' }
    }

    const subscriptions = await db.pushSubscription.findMany({
      where: whereCondition
    })

    if (subscriptions.length > 0) {
      const payload: PushPayload = {
        title: data.title,
        body: data.message,
        url: data.link || '/notifikasi',
        icon: '/kubar.png',
        badge: '/kubar.png',
        tag: `notif-${(data.type || 'alert').toLowerCase()}-${Date.now()}`
      }

      const staleEndpoints: string[] = []
      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await sendWebPush(sub, payload)
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              staleEndpoints.push(sub.endpoint)
            }
          }
        })
      )

      if (staleEndpoints.length > 0) {
        await db.pushSubscription.deleteMany({
          where: { endpoint: { in: staleEndpoints } }
        }).catch(() => {})
      }
    }
  } catch (error) {
    console.error('Failed to create notification or dispatch push:', error)
  }
}

export async function getNotificationsAction(): Promise<{
  notifications: NotificationData[]
  unreadCount: number
}> {
  const user = await getCurrentUserAction()
  if (!user) {
    return { notifications: [], unreadCount: 0 }
  }

  try {
    let whereCondition: any = {}

    if (user.role === 'SUPER_ADMIN') {
      // Super Admin menerima notifikasi miliknya, ditujukan ke SUPER_ADMIN, atau pengumuman umum (roleTarget null)
      whereCondition = {
        OR: [
          { userId: user.id },
          { roleTarget: 'SUPER_ADMIN' },
          { roleTarget: null }
        ]
      }
    } else {
      // OPD: menerima notifikasi miliknya, notifikasi unit yang dibind ke akunnya, atau pengumuman umum (roleTarget null)
      const userUnits = await db.userUnit.findMany({
        where: { userId: user.id },
        select: { unitId: true }
      })
      const boundUnitIds = userUnits.map((u) => u.unitId)

      whereCondition = {
        OR: [
          { userId: user.id },
          {
            roleTarget: 'OPD',
            unitId: { in: boundUnitIds }
          },
          {
            roleTarget: 'OPD',
            unitId: null
          },
          { roleTarget: null }
        ]
      }
    }

    const rawNotifications = await db.notification.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    const notifications: NotificationData[] = rawNotifications.map((n) => {
      let resolvedLink = n.link
      if (resolvedLink && !resolvedLink.includes('#') && !resolvedLink.includes('mode=')) {
        const indMatch = n.message.match(/Indikator\s*#(\d+)/i) || n.title.match(/Indikator\s*#(\d+)/i)
        const sep = resolvedLink.includes('?') ? '&' : '?'
        if (indMatch) {
          resolvedLink = `${resolvedLink}${sep}mode=questions&soal=${indMatch[1]}`
        } else if (n.type === 'PROOF_TRIGGER') {
          const aspectMatch = n.title.match(/Aspek\s+([A-Za-z0-9]+)/i) || n.message.match(/Aspek\s+([A-Za-z0-9]+)/i)
          if (aspectMatch) {
            resolvedLink = `${resolvedLink}${sep}mode=evidence&aspek=${aspectMatch[1]}`
          } else {
            resolvedLink = `${resolvedLink}${sep}mode=evidence`
          }
        }
      }

      return {
        id: n.id,
        userId: n.userId,
        roleTarget: n.roleTarget as any,
        unitId: n.unitId,
        title: n.title,
        message: n.message,
        type: n.type,
        link: resolvedLink,
        isRead: n.isRead,
        createdAt: n.createdAt
      }
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return { notifications, unreadCount }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return { notifications: [], unreadCount: 0 }
  }
}

export async function markAsReadAction(notificationId: string) {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })
    revalidatePath('/notifikasi')
    revalidatePath('/')
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

export async function markAllAsReadAction() {
  const user = await getCurrentUserAction()
  if (!user) return

  try {
    let whereCondition: any = { isRead: false }

    if (user.role === 'SUPER_ADMIN') {
      whereCondition.OR = [
        { userId: user.id },
        { roleTarget: 'SUPER_ADMIN' }
      ]
    } else {
      const userUnits = await db.userUnit.findMany({
        where: { userId: user.id },
        select: { unitId: true }
      })
      const boundUnitIds = userUnits.map((u) => u.unitId)

      whereCondition.OR = [
        { userId: user.id },
        {
          roleTarget: 'OPD',
          unitId: { in: boundUnitIds }
        }
      ]
    }

    await db.notification.updateMany({
      where: whereCondition,
      data: { isRead: true }
    })
    revalidatePath('/notifikasi')
    revalidatePath('/')
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

export async function triggerProofNotificationAction(unitId: string, aspectName: string) {
  const user = await getCurrentUserAction()
  if (!user) throw new Error('Not authenticated')

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    include: {
      evaluations: {
        orderBy: { year: 'desc' },
        take: 1,
        include: {
          scores: true
        }
      }
    }
  })

  const unitName = unit?.name || 'Unit Pelayanan'
  const latestEvaluation = unit?.evaluations?.[0]
  // Periksa apakah lokus ini sudah mulai/selesai dinilai oleh evaluator
  const hasEvaluatorScored = latestEvaluation?.scores.some(
    (s) => s.score !== null || (s.notes && s.notes.trim() !== '')
  )

  const isPostEvaluation = Boolean(hasEvaluatorScored)

  await createNotificationHelper({
    roleTarget: 'SUPER_ADMIN',
    unitId,
    title: isPostEvaluation
      ? `[Revisi Pasca Penilaian] Bukti Dukung: ${unitName}`
      : `Pembaruan Bukti Dukung: ${unitName}`,
    message: isPostEvaluation
      ? `Pengguna OPD (${user.fullName}) memperbarui berkas Drive untuk ${aspectName} pada unit yang telah dinilai. Evaluator dimohon meninjau ulang.`
      : `Pengguna OPD (${user.fullName}) telah mengunggah/memperbarui berkas Bukti Dukung untuk ${aspectName}.`,
    type: isPostEvaluation ? 'F01_REVISION' : 'PROOF_TRIGGER',
    link: `/evaluasi/${unitId}`
  })

  revalidatePath(`/evaluasi/${unitId}`)
  revalidatePath('/notifikasi')
}
