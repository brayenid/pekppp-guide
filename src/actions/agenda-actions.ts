// src/actions/agenda-actions.ts
// Server Actions untuk Hierarki Baru: Tahun -> Agenda Penilaian -> Form & Penentuan Lokus

'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

/**
 * Otomatis memastikan setiap tahun memiliki Agenda Default "PEKPPP {year}"
 * dan menghubungkan evaluasi yang belum memiliki agendaId.
 */
/**
 * Menghubungkan evaluasi legacy yang belum memiliki agendaId ke agenda yang tersedia jika ada.
 */
export async function ensureDefaultAgendasAction() {
  try {
    const periods = await db.evaluationPeriod.findMany()
    
    for (const period of periods) {
      const unlinkedCount = await db.evaluation.count({
        where: { year: period.year, agendaId: null }
      })

      if (unlinkedCount > 0) {
        let targetAgenda = await db.evaluationAgenda.findFirst({
          where: { year: period.year }
        })

        if (targetAgenda) {
          await db.evaluation.updateMany({
            where: {
              year: period.year,
              agendaId: null
            },
            data: {
              agendaId: targetAgenda.id
            }
          })
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error ensuring default agendas:', error)
    return { success: false, error: 'Gagal menginisialisasi agenda default.' }
  }
}

/**
 * Mengambil daftar Agenda di suatu tahun tertentu
 */
export async function getAgendasByYearAction(year: number) {
  try {
    const agendas = await db.evaluationAgenda.findMany({
      where: { year },
      include: {
        evaluations: {
          include: {
            unit: { include: { category: true } },
            scores: { select: { score: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return { success: true, agendas }
  } catch (error) {
    console.error('Error getting agendas by year:', error)
    return { success: false, error: 'Gagal mengambil agenda.', agendas: [] }
  }
}

/**
 * Membuat Agenda Baru di bawah suatu Tahun Penilaian
 */
export async function createAgendaAction(params: {
  year: number
  title: string
  description?: string
  forms: string[] // e.g. ['F01_F02', 'F03']
  targetF03Quota?: number
  unitIds?: string[] // Lokus terpilih
  path?: string
}) {
  const { year, title, description, forms, targetF03Quota = 30, unitIds = [], path } = params

  try {
    // 1. Pastikan period year ada
    let period = await db.evaluationPeriod.findUnique({ where: { year } })
    if (!period) {
      period = await db.evaluationPeriod.create({
        data: { year, title: `${year}`, isOpen: true, targetF03Quota }
      })
    }

    // 2. Buat Agenda
    const agenda = await db.evaluationAgenda.create({
      data: {
        year,
        periodId: period.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'ACTIVE',
        forms: forms.length > 0 ? forms : ['F01_F02', 'F03'],
        targetF03Quota
      }
    })

    // 3. Daftarkan Lokus Terpilih (Enroll Participants)
    if (unitIds.length > 0) {
      const indicators = await db.indicator.findMany({ select: { id: true } })

      for (const unitId of unitIds) {
        // Cek apakah evaluation sudah ada untuk year + unitId ini
        let evalRecord = await db.evaluation.findUnique({
          where: { year_unitId: { year, unitId } }
        })

        if (!evalRecord) {
          evalRecord = await db.evaluation.create({
            data: {
              year,
              unitId,
              agendaId: agenda.id,
              scores: {
                create: indicators.map((ind) => ({
                  indicatorId: ind.id
                }))
              }
            }
          })
        } else {
          // Update agendaId ke agenda ini jika belum ada
          await db.evaluation.update({
            where: { id: evalRecord.id },
            data: { agendaId: agenda.id }
          })
        }
      }
    }

    if (path) revalidatePath(path)
    return { success: true, agendaId: agenda.id }
  } catch (error: any) {
    console.error('Error creating agenda:', error)
    return { success: false, error: error?.message || 'Gagal membuat agenda penilaian.' }
  }
}

/**
 * Menambahkan Lokus Peserta ke Agenda Tertentu
 */
export async function enrollUnitsToAgendaAction(params: {
  agendaId: string
  year: number
  unitIds: string[]
  path?: string
}) {
  const { agendaId, year, unitIds, path } = params

  try {
    const indicators = await db.indicator.findMany({ select: { id: true } })

    for (const unitId of unitIds) {
      const existing = await db.evaluation.findUnique({
        where: { year_unitId: { year, unitId } }
      })

      if (!existing) {
        await db.evaluation.create({
          data: {
            year,
            unitId,
            agendaId,
            scores: {
              create: indicators.map((ind) => ({
                indicatorId: ind.id
              }))
            }
          }
        })
      } else {
        await db.evaluation.update({
          where: { id: existing.id },
          data: { agendaId }
        })
      }
    }

    if (path) revalidatePath(path)
    return { success: true }
  } catch (error) {
    console.error('Error enrolling units to agenda:', error)
    return { success: false, error: 'Gagal mendaftarkan peserta ke agenda.' }
  }
}

/**
 * Mengubah status Agenda (ACTIVE / DRAFT / CLOSED)
 */
export async function setAgendaStatusAction(agendaId: string, status: string, path?: string) {
  try {
    await db.evaluationAgenda.update({
      where: { id: agendaId },
      data: { status }
    })
    if (path) revalidatePath(path)
    return { success: true }
  } catch (error) {
    console.error('Error updating agenda status:', error)
    return { success: false, error: 'Gagal mengubah status agenda.' }
  }
}

/**
 * Menghapus Agenda Penilaian
 */
export async function deleteAgendaAction(agendaId: string, path?: string) {
  try {
    await db.evaluationAgenda.delete({
      where: { id: agendaId }
    })
    if (path) revalidatePath(path)
    return { success: true }
  } catch (error) {
    console.error('Error deleting agenda:', error)
    return { success: false, error: 'Gagal menghapus agenda penilaian.' }
  }
}
