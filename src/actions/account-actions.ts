'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '../lib/jwt-auth'
import { requireSuperAdmin } from '../services/auth-guard'

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

  await db.profile.create({
    data: {
      email: emailLower,
      password: hashedPassword,
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      role: data.role
    }
  })
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function deleteProfileAction(id: string) {
  await requireSuperAdmin()
  await db.profile.delete({ where: { id } })
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

  if (data.password && data.password.trim() !== '') {
    updateData.password = await hashPassword(data.password.trim())
  }

  await db.profile.update({
    where: { id },
    data: updateData
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
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function unbindUnitFromProfileAction(userId: string, unitId: string) {
  await requireSuperAdmin()
  await db.userUnit.deleteMany({ where: { userId, unitId } })
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
