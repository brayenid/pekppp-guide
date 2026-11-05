'use server'

import { db } from '../services/db'
import { getCurrentUserAction } from './auth-actions'
import { sendWebPush, PushPayload } from '../lib/web-push'
import { revalidatePath } from 'next/cache'

export interface SaveSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}

export async function saveSubscriptionAction(input: SaveSubscriptionInput) {
  try {
    const user = await getCurrentUserAction()

    let role: 'SUPER_ADMIN' | 'OPD' | null = null
    let unitId: string | null = null

    if (user) {
      role = user.role
      if (user.role === 'OPD') {
        const userUnit = await db.userUnit.findFirst({
          where: { userId: user.id },
          select: { unitId: true }
        })
        unitId = userUnit?.unitId || null
      }
    }

    await db.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userId: user?.id || null,
        role: role as any,
        unitId,
        userAgent: input.userAgent || null,
        updatedAt: new Date()
      },
      create: {
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userId: user?.id || null,
        role: role as any,
        unitId,
        userAgent: input.userAgent || null
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to save push subscription:', error)
    return { success: false, error: 'Gagal menyimpan langganan notifikasi push.' }
  }
}

export async function removeSubscriptionAction(endpoint: string) {
  try {
    await db.pushSubscription.deleteMany({
      where: { endpoint }
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to remove push subscription:', error)
    return { success: false }
  }
}

export interface BroadcastNotificationInput {
  title: string
  message: string
  targetType: 'ALL' | 'SUPER_ADMIN' | 'OPD' | 'UNIT'
  unitId?: string | null
  type?: string
  link?: string | null
}

export async function sendBroadcastNotificationAction(input: BroadcastNotificationInput) {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Akses ditolak. Hanya Super Admin yang berwenang mengirim broadcast.' }
  }

  const title = input.title?.trim()
  const message = input.message?.trim()
  const targetType = input.targetType || 'ALL'
  const notifType = input.type || 'PENGUMUMAN'
  const link = input.link?.trim() || '/notifikasi'

  if (!title || !message) {
    return { success: false, error: 'Judul dan konten notifikasi wajib diisi.' }
  }

  try {
    // 1. Simpan ke database notification (In-app Bell & Notifikasi Page)
    let roleTarget: 'SUPER_ADMIN' | 'OPD' | null = null
    let targetUnitId: string | null = null

    if (targetType === 'SUPER_ADMIN') {
      roleTarget = 'SUPER_ADMIN'
    } else if (targetType === 'OPD') {
      roleTarget = 'OPD'
    } else if (targetType === 'UNIT') {
      roleTarget = 'OPD'
      targetUnitId = input.unitId || null
    }

    // Jika target ALL, kita bisa membuat record general (roleTarget null, unitId null)
    // agar semua orang yang fetch list notifikasi bisa melihatnya
    await db.notification.create({
      data: {
        userId: null,
        roleTarget: roleTarget as any,
        unitId: targetUnitId,
        title,
        message,
        type: notifType,
        link
      }
    })

    // 2. Query target subscriptions untuk Web Push
    let whereCondition: any = {}
    if (targetType === 'SUPER_ADMIN') {
      whereCondition = { role: 'SUPER_ADMIN' }
    } else if (targetType === 'OPD') {
      whereCondition = { role: 'OPD' }
    } else if (targetType === 'UNIT' && targetUnitId) {
      whereCondition = {
        role: 'OPD',
        unitId: targetUnitId
      }
    }
    // Jika 'ALL', whereCondition kosong (semua device)

    const subscriptions = await db.pushSubscription.findMany({
      where: whereCondition
    })

    const payload: PushPayload = {
      title,
      body: message,
      url: link,
      icon: '/kubar.png',
      badge: '/kubar.png',
      tag: `broadcast-${Date.now()}`
    }

    let successCount = 0
    let failedCount = 0
    const staleEndpoints: string[] = []

    // 3. Tembak Web Push secara paralel
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await sendWebPush(sub, payload)
          successCount++
        } catch (err: any) {
          failedCount++
          // Status 404 atau 410 berarti browser telah revoke/uninstall/expired subscription
          if (err.statusCode === 404 || err.statusCode === 410) {
            staleEndpoints.push(sub.endpoint)
          }
        }
      })
    )

    // Bersihkan subscription yang sudah kadaluarsa/tidak aktif
    if (staleEndpoints.length > 0) {
      await db.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } }
      })
    }

    revalidatePath('/notifikasi')
    revalidatePath('/')
    revalidatePath('/admin/notifikasi')

    return {
      success: true,
      totalTargetDevices: subscriptions.length,
      successCount,
      failedCount,
      staleCleaned: staleEndpoints.length
    }
  } catch (error: any) {
    console.error('Failed to send broadcast push notification:', error)
    return { success: false, error: error.message || 'Gagal mengirim broadcast notifikasi.' }
  }
}

export async function getPushSubscriptionStatsAction() {
  const user = await getCurrentUserAction()
  if (!user || user.role !== 'SUPER_ADMIN') {
    return { total: 0, adminCount: 0, opdCount: 0, guestCount: 0 }
  }

  const [total, adminCount, opdCount, guestCount] = await Promise.all([
    db.pushSubscription.count(),
    db.pushSubscription.count({ where: { role: 'SUPER_ADMIN' } }),
    db.pushSubscription.count({ where: { role: 'OPD' } }),
    db.pushSubscription.count({ where: { role: null } })
  ])

  return { total, adminCount, opdCount, guestCount }
}

export async function sendSelfTestPushAction() {
  const user = await getCurrentUserAction()
  if (!user) {
    return { success: false, error: 'Pengguna belum terautentikasi.' }
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: user.id }
  })

  if (subscriptions.length === 0) {
    return {
      success: false,
      error: 'Perangkat ini belum mengaktifkan notifikasi push browser. Silakan klik tombol "Aktifkan Push" terlebih dahulu.'
    }
  }

  const payload: PushPayload = {
    title: '🔔 Uji Coba Push Notifikasi Sukses!',
    body: `Halo ${user.fullName}, sistem PWA & Web Push Notification PEKPPP Kutai Barat berfungsi optimal.`,
    url: '/admin/notifikasi',
    icon: '/kubar.png',
    badge: '/kubar.png',
    tag: `test-${Date.now()}`
  }

  let successCount = 0
  for (const sub of subscriptions) {
    try {
      await sendWebPush(sub, payload)
      successCount++
    } catch (e) {
      console.error('Self test push error:', e)
    }
  }

  return { success: true, count: successCount }
}
