'use server'

import { db } from '../services/db'
import { getCurrentUserAction } from './auth-actions'
import { revalidatePath } from 'next/cache'

import { WhatsAppService } from '../services/whatsapp-service'
import { getFonnteWaConfig } from '../services/system-setting-service'

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

    // 2. Integrasi Otomatis WhatsApp Gateway (Fonnte)
    // Berjalan di background (asinkron & fail-safe) tanpa memperlambat response web
    ;(async () => {
      try {
        const config = await getFonnteWaConfig()
        if (!config.enabled || !config.apiToken) return

        let recipientPhone = ''

        if (data.userId) {
          // Jika notifikasi ditujukan ke pengguna spesifik
          const targetUser = await db.profile.findUnique({
            where: { id: data.userId },
            select: { phone: true }
          })
          if (targetUser?.phone) {
            recipientPhone = targetUser.phone
          }
        }

        if (!recipientPhone && data.roleTarget === 'SUPER_ADMIN') {
          // Kirim ke nomor WhatsApp Admin / Evaluator dari dashboard
          recipientPhone = config.adminPhone
        } else if (!recipientPhone && data.unitId) {
          // Kirim ke seluruh akun OPD yang terikat (bind) pada unit lokus ini
          const boundUserUnits = await db.userUnit.findMany({
            where: { unitId: data.unitId },
            include: { user: { select: { phone: true, role: true } } }
          })

          const phones = boundUserUnits
            .map((bu) => bu.user.phone)
            .filter((p): p is string => Boolean(p && p.trim() !== ''))

          if (phones.length > 0) {
            recipientPhone = Array.from(new Set(phones)).join(',')
          }
        }

        if (recipientPhone) {
          const waText = `*[PEKPPP Online - Notifikasi]*\n\n📌 *${data.title}*\n${data.message}`
          await WhatsAppService.sendMessage({
            target: recipientPhone,
            message: waText,
            url: data.link ? `${process.env.NEXTAUTH_URL || ''}${data.link}` : undefined
          })
        }
      } catch (waErr) {
        console.error('[Notification] Gagal trigger WhatsApp:', waErr)
      }
    })()
  } catch (error) {
    console.error('Failed to create notification:', error)
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
      // Super Admin menerima notifikasi miliknya, atau yang ditujukan ke SUPER_ADMIN
      whereCondition = {
        OR: [
          { userId: user.id },
          { roleTarget: 'SUPER_ADMIN' }
        ]
      }
    } else {
      // OPD: hanya menerima notifikasi miliknya, atau notifikasi unit yang dibind ke akunnya
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
          }
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
      if (resolvedLink && !resolvedLink.includes('#')) {
        const indMatch = n.message.match(/Indikator\s*#(\d+)/i) || n.title.match(/Indikator\s*#(\d+)/i)
        if (indMatch) {
          resolvedLink = `${resolvedLink}#soal-${indMatch[1]}`
        } else if (n.type === 'PROOF_TRIGGER') {
          const aspectMatch = n.title.match(/Aspek\s+([A-Za-z0-9]+)/i) || n.message.match(/Aspek\s+([A-Za-z0-9]+)/i)
          if (aspectMatch) {
            resolvedLink = `${resolvedLink}#bukti-${aspectMatch[1]}`
          } else {
            resolvedLink = `${resolvedLink}#matriks-bukti`
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
