'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

export async function getCategoriesAction() {
  return db.category.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getUnitsAction() {
  return db.unit.findMany({
    include: {
      category: true,
      userUnits: {
        include: { user: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function createUnitAction(data: { name: string; categoryId?: string; driveFolderUrl?: string }) {
  const unit = await db.unit.create({
    data: {
      name: data.name,
      categoryId: data.categoryId || null,
      driveFolderUrl: data.driveFolderUrl || null
    }
  })
  revalidatePath('/admin/units')
  revalidatePath('/hasil')
  return unit
}

export async function updateUnitAction(id: string, data: { name: string; categoryId?: string; driveFolderUrl?: string; isActive?: boolean }) {
  const unit = await db.unit.update({
    where: { id },
    data: {
      name: data.name,
      categoryId: data.categoryId || null,
      driveFolderUrl: data.driveFolderUrl || null,
      isActive: data.isActive
    }
  })
  revalidatePath('/admin/lokus')
  revalidatePath('/admin/peserta')
  revalidatePath('/hasil')
  return { success: true, unit }
}

export async function deleteUnitAction(id: string) {
  try {
    await db.unit.delete({ where: { id } })
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Gagal menghapus lokus. Pastikan lokus tidak memiliki data terikat yang tidak bisa dihapus.' }
  }
}

export async function updateUnitsBulkAction(
  entries: { id: string; name: string; categoryId?: string }[]
) {
  try {
    await Promise.all(
      entries.map((e) =>
        db.unit.update({
          where: { id: e.id },
          data: {
            name: e.name.trim(),
            categoryId: e.categoryId || null
          }
        })
      )
    )
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    return { success: true, count: entries.length }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui lokus secara massal.' }
  }
}

export async function createUnitsBulkAction(entries: { name: string; categoryId?: string }[]) {
  try {
    const data = entries
      .map(e => e.name.trim())
      .filter(Boolean)
      .map(name => ({
        name,
        categoryId: entries.find(e => e.name.trim() === name)?.categoryId || null
      }))

    await db.unit.createMany({ data, skipDuplicates: true })
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    return { success: true, count: data.length }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menambahkan lokus secara massal.' }
  }
}

export async function deleteUnitsBulkAction(unitIds: string[]) {
  try {
    await db.unit.deleteMany({ where: { id: { in: unitIds } } })
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    revalidatePath('/')
    return { success: true, count: unitIds.length }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus lokus secara massal.' }
  }
}

