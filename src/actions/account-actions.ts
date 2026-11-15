'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '../lib/jwt-auth'
import { requireSuperAdmin } from '../services/auth-guard'
import { ActivityLogService } from '../services/activity-log-service'

export async function listProfilesAction() {
  await requireSuperAdmin()
  return db.profile.findMany({
    include: { userUnits: { include: { unit: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProfileAction(data: {
  email: string
  password: string
  fullName: string
  phone?: string | null
  role: 'SUPER_ADMIN' | 'OPD'
}) {
  await requireSuperAdmin()

  const emailLower = data.email.trim().toLowerCase()
  const existing = await db.profile.findUnique({ where: { email: emailLower } })
  if (existing) return { success: false, error: 'Email sudah terdaftar.' }

  const hashedPassword = await hashPassword(data.password.trim())

  const created = await db.profile.create({
    data: {
      email: emailLower,
      password: hashedPassword,
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      role: data.role
    }
  })

  await ActivityLogService.log({
    category: 'USER_MGMT',
    action: 'USER_CREATE',
    description: `Admin membuat akun baru: "${created.fullName}" (${created.email}) dengan peran ${created.role}.`,
    metadata: { targetUserId: created.id, email: created.email, role: created.role }
  })

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function deleteProfileAction(id: string) {
  await requireSuperAdmin()
  const existing = await db.profile.findUnique({ where: { id } })
  await db.profile.delete({ where: { id } })

  if (existing) {
    await ActivityLogService.log({
      category: 'USER_MGMT',
      action: 'USER_DELETE',
      description: `Admin menghapus akun pengguna: "${existing.fullName}" (${existing.email}).`,
      metadata: { targetUserId: id, email: existing.email, role: existing.role }
    })
  }

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function updateProfileAction(
  id: string,
  data: {
    email: string
    password?: string
    fullName: string
    phone?: string | null
    role: 'SUPER_ADMIN' | 'OPD'
  }
) {
  await requireSuperAdmin()

  const emailLower = data.email.trim().toLowerCase()
  const existing = await db.profile.findFirst({
    where: {
      email: emailLower,
      NOT: { id }
    }
  })
  if (existing) return { success: false, error: 'Email sudah digunakan oleh akun lain.' }

  const updateData: any = {
    email: emailLower,
    fullName: data.fullName.trim(),
    role: data.role
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone?.trim() ? data.phone.trim() : null
  }

  const isPasswordChanged = Boolean(data.password && data.password.trim() !== '')
  if (isPasswordChanged) {
    updateData.password = await hashPassword(data.password!.trim())
  }

  const updated = await db.profile.update({
    where: { id },
    data: updateData
  })

  await ActivityLogService.log({
    category: 'USER_MGMT',
    action: 'USER_UPDATE',
    description: `Admin memperbarui data akun "${updated.fullName}" (${updated.email}).${isPasswordChanged ? ' (Termasuk reset password)' : ''}`,
    metadata: { targetUserId: id, email: updated.email, role: updated.role, isPasswordChanged }
  })

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function bindUnitToProfileAction(userId: string, unitId: string) {
  await requireSuperAdmin()
  await db.userUnit.upsert({
    where: { userId_unitId: { userId, unitId } },
    update: {},
    create: { userId, unitId }
  })

  const [profile, unit] = await Promise.all([
    db.profile.findUnique({ where: { id: userId }, select: { fullName: true, email: true } }),
    db.unit.findUnique({ where: { id: unitId }, select: { name: true } })
  ])

  await ActivityLogService.log({
    category: 'USER_MGMT',
    action: 'USER_BIND_UNIT',
    description: `Admin menautkan akses lokus "${unit?.name || unitId}" ke akun "${profile?.fullName || userId}".`,
    unitId,
    unitName: unit?.name,
    metadata: { targetUserId: userId, unitId }
  })

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function unbindUnitFromProfileAction(userId: string, unitId: string) {
  await requireSuperAdmin()
  await db.userUnit.deleteMany({ where: { userId, unitId } })

  const [profile, unit] = await Promise.all([
    db.profile.findUnique({ where: { id: userId }, select: { fullName: true, email: true } }),
    db.unit.findUnique({ where: { id: unitId }, select: { name: true } })
  ])

  await ActivityLogService.log({
    category: 'USER_MGMT',
    action: 'USER_UNBIND_UNIT',
    description: `Admin melepas akses lokus "${unit?.name || unitId}" dari akun "${profile?.fullName || userId}".`,
    unitId,
    unitName: unit?.name,
    metadata: { targetUserId: userId, unitId }
  })

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function importProfilesAction(
  items: Array<{
    email: string
    password?: string
    fullName: string
    phone?: string
    role: 'SUPER_ADMIN' | 'OPD'
    conflictResolution: 'OVERWRITE' | 'SKIP'
  }>
) {
  await requireSuperAdmin()

  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const item of items) {
    const emailLower = item.email.trim().toLowerCase()
    const existing = await db.profile.findUnique({
      where: { email: emailLower }
    })

    if (existing) {
      if (item.conflictResolution === 'OVERWRITE') {
        const updateData: any = {
          fullName: item.fullName.trim(),
          role: item.role
        }
        if (item.phone !== undefined) {
          updateData.phone = item.phone?.trim() ? item.phone.trim() : null
        }
        if (item.password && item.password.trim() !== '') {
          updateData.password = await hashPassword(item.password.trim())
        }
        await db.profile.update({
          where: { id: existing.id },
          data: updateData
        })
        updatedCount++
      } else {
        skippedCount++
      }
    } else {
      const rawPassword = item.password?.trim() || '123456'
      const hashedPassword = await hashPassword(rawPassword)

      await db.profile.create({
        data: {
          email: emailLower,
          password: hashedPassword,
          fullName: item.fullName.trim(),
          phone: item.phone?.trim() ? item.phone.trim() : null,
          role: item.role
        }
      })
      createdCount++
    }
  }

  revalidatePath('/admin/akun')
  return { success: true, createdCount, updatedCount, skippedCount }
}
