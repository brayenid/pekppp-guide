// src/actions/period-window-actions.ts
'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import {
  getPeriodTimeline,
  ensureDefaultWindowsForPeriod,
  DEFAULT_WINDOW_PRESETS
} from '../services/period-window-service'

/**
 * Mengambil informasi timeline dan status tahapan dinamis untuk tahun penilaian
 */
export async function getPeriodTimelineAction(year: number) {
  try {
    const timeline = await getPeriodTimeline(year)
    return { success: true, timeline }
  } catch (error: any) {
    console.error('Error fetching period timeline:', error)
    return { success: false, error: error?.message || 'Gagal memuat jadwal tahapan tahun.' }
  }
}

/**
 * Memperbarui atau membuat entri jendela waktu tahapan
 */
export async function upsertPeriodWindowAction(params: {
  id?: string
  periodId: string
  year: number
  phaseKey: string
  title: string
  description?: string
  startDate?: string | null
  endDate?: string | null
  canFillF01: boolean
  canUploadEvidence: boolean
  canFillF03: boolean
  canEvaluateF02: boolean
  isActiveOverride?: boolean | null
  path?: string
}) {
  try {
    const {
      id,
      periodId,
      year,
      phaseKey,
      title,
      description,
      startDate,
      endDate,
      canFillF01,
      canUploadEvidence,
      canFillF03,
      canEvaluateF02,
      isActiveOverride,
      path
    } = params

    const parsedStart = startDate ? new Date(startDate) : null
    const parsedEnd = endDate ? new Date(endDate) : null

    if (id) {
      await db.periodWindow.update({
        where: { id },
        data: {
          title,
          description: description || null,
          startDate: parsedStart,
          endDate: parsedEnd,
          canFillF01,
          canUploadEvidence,
          canFillF03,
          canEvaluateF02,
          isActiveOverride: isActiveOverride !== undefined ? isActiveOverride : undefined
        }
      })
    } else {
      await db.periodWindow.upsert({
        where: {
          periodId_phaseKey: { periodId, phaseKey }
        },
        create: {
          periodId,
          phaseKey,
          title,
          description: description || null,
          startDate: parsedStart,
          endDate: parsedEnd,
          canFillF01,
          canUploadEvidence,
          canFillF03,
          canEvaluateF02,
          isActiveOverride: isActiveOverride !== undefined ? isActiveOverride : null
        },
        update: {
          title,
          description: description || null,
          startDate: parsedStart,
          endDate: parsedEnd,
          canFillF01,
          canUploadEvidence,
          canFillF03,
          canEvaluateF02,
          isActiveOverride: isActiveOverride !== undefined ? isActiveOverride : undefined
        }
      })
    }

    revalidatePath(`/admin/periode/${year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/opd')
    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error('Error upserting period window:', error)
    return { success: false, error: error?.message || 'Gagal menyimpan konfigurasi jendela waktu.' }
  }
}

/**
 * Mengubah manual override status tahapan (null = otomatis, true = force active, false = force closed)
 */
export async function toggleWindowOverrideAction(params: {
  windowId: string
  year: number
  override: boolean | null
  path?: string
}) {
  try {
    const { windowId, year, override, path } = params

    // Jika override diaktifkan (true), nonaktifkan override jendela lain di periode yang sama
    // agar hanya 1 jendela yang di-force active dalam 1 waktu
    const target = await db.periodWindow.findUnique({
      where: { id: windowId }
    })

    if (!target) {
      return { success: false, error: 'Jendela waktu tidak ditemukan.' }
    }

    if (override === true) {
      await db.periodWindow.updateMany({
        where: {
          periodId: target.periodId,
          id: { not: windowId }
        },
        data: { isActiveOverride: null }
      })
    }

    await db.periodWindow.update({
      where: { id: windowId },
      data: { isActiveOverride: override }
    })

    revalidatePath(`/admin/periode/${year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/opd')
    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error('Error toggling window override:', error)
    return { success: false, error: error?.message || 'Gagal mengubah status override tahapan.' }
  }
}

/**
 * Menghapus satu tahapan jendela waktu tertentu
 */
export async function deletePeriodWindowAction(windowId: string, year: number, path?: string) {
  try {
    await db.periodWindow.delete({
      where: { id: windowId }
    })

    revalidatePath(`/admin/periode/${year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/opd')
    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting period window:', error)
    return { success: false, error: error?.message || 'Gagal menghapus tahapan.' }
  }
}

/**
 * Reset jendela waktu kembali ke template bawaan 6 tahapan resmi PEKPPP
 */
export async function resetPeriodWindowsToDefaultAction(year: number, path?: string) {
  try {
    const period = await db.evaluationPeriod.findUnique({
      where: { year }
    })

    if (!period) return { success: false, error: 'Tahun penilaian tidak ditemukan.' }

    // Hapus seluruh window yang ada untuk periode ini
    await db.periodWindow.deleteMany({
      where: { periodId: period.id }
    })

    // Inisialisasi ulang
    await ensureDefaultWindowsForPeriod(period.id, period.year)

    revalidatePath(`/admin/periode/${year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/opd')
    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error('Error resetting period windows:', error)
    return { success: false, error: error?.message || 'Gagal mereset jadwal tahapan.' }
  }
}
