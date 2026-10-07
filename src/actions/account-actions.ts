'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

export async function listProfilesAction() {
  return db.profile.findMany({
    include: { userUnits: { include: { unit: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProfileAction(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'SUPER_ADMIN' | 'OPD'
}) {
  const existing = await db.profile.findUnique({ where: { email: data.email } })
  if (existing) return { success: false, error: 'Email sudah terdaftar.' }

  await db.profile.create({
    data: {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone?.trim() || null,
      role: data.role
    }
  })
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function deleteProfileAction(id: string) {
  await db.profile.delete({ where: { id } })
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function updateProfileAction(id: string, data: {
  email: string
  password?: string
  fullName: string
  phone?: string
  role: 'SUPER_ADMIN' | 'OPD'
}) {
  const existing = await db.profile.findFirst({
    where: {
      email: data.email,
      NOT: { id }
    }
  })
  if (existing) return { success: false, error: 'Email sudah digunakan oleh akun lain.' }

  const updateData: any = {
    email: data.email,
    fullName: data.fullName,
    phone: data.phone !== undefined ? (data.phone?.trim() || null) : undefined,
    role: data.role
  }

  if (data.password && data.password.trim() !== '') {
    updateData.password = data.password.trim()
  }

  await db.profile.update({
    where: { id },
    data: updateData
  })

  revalidatePath('/admin/akun')
  return { success: true }
}

export async function bindUnitToProfileAction(userId: string, unitId: string) {
  await db.userUnit.upsert({
    where: { userId_unitId: { userId, unitId } },
    update: {},
    create: { userId, unitId }
  })
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function unbindUnitFromProfileAction(userId: string, unitId: string) {
  await db.userUnit.deleteMany({ where: { userId, unitId } })
  revalidatePath('/admin/akun')
  return { success: true }
}

export async function importProfilesAction(
  items: Array<{
    email: string
    password?: string
    fullName: string
    role: 'SUPER_ADMIN' | 'OPD'
    conflictResolution: 'OVERWRITE' | 'SKIP'
  }>
) {
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
        if (item.password && item.password.trim() !== '') {
          updateData.password = item.password.trim()
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
      await db.profile.create({
        data: {
          email: emailLower,
          password: item.password?.trim() || '123456',
          fullName: item.fullName.trim(),
          role: item.role
        }
      })
      createdCount++
    }
  }

  revalidatePath('/admin/akun')
  return { success: true, createdCount, updatedCount, skippedCount }
}
