'use server'

import { db } from '../services/db'
import { EvaluationService } from '../services/evaluation-service'
import { revalidatePath } from 'next/cache'

export async function getActivePeriodsAction() {
  return db.evaluationPeriod.findMany({
    orderBy: { year: 'desc' }
  })
}

export async function createPeriodAction({
  year,
  targetF03Quota = 30,
  unitIds = []
}: {
  year: number
  targetF03Quota?: number
  unitIds?: string[]
}) {
  const existing = await db.evaluationPeriod.findUnique({ where: { year } })
  if (existing) return { success: false, error: `Tahun Penilaian ${year} sudah ada.` }

  // Close all other periods so only the newly created one becomes active
  await db.evaluationPeriod.updateMany({
    data: { isOpen: false }
  })

  const period = await db.evaluationPeriod.create({
    data: {
      year,
      title: `Evaluasi PEKPPP Tahun ${year}`,
      targetF03Quota,
      isOpen: true
    }
  })

  // Jika terdapat lokus yang dipilih pada saat pembuatan tahun, langsung daftarkan secara massal
  if (unitIds.length > 0) {
    await enrollUnitsBulkAction(year, unitIds)
  }

  revalidatePath('/admin/periode')
  revalidatePath(`/admin/periode/${year}`)
  revalidatePath('/admin/peserta')
  revalidatePath('/admin')
  return { success: true, period }
}


export async function updatePeriodAction({
  id,
  newYear,
  targetF03Quota,
  title
}: {
  id: string
  newYear: number
  targetF03Quota?: number
  title?: string
}) {
  const currentPeriod = await db.evaluationPeriod.findUnique({ where: { id } })
  if (!currentPeriod) return { success: false, error: 'Tahun Penilaian tidak ditemukan.' }

  const oldYear = currentPeriod.year

  // Jika angka tahun diubah, periksa apakah tahun tujuan sudah dipakai oleh periode lain
  if (newYear !== oldYear) {
    const existing = await db.evaluationPeriod.findUnique({ where: { year: newYear } })
    if (existing && existing.id !== id) {
      return { success: false, error: `Tahun Penilaian ${newYear} sudah ada dalam sistem.` }
    }

    // Jalankan pembaruan dalam transaksi database agar integritas relasi tetap terjaga
    await db.$transaction(async (tx) => {
      // 1. Update Evaluations
      await tx.evaluation.updateMany({
        where: { year: oldYear },
        data: { year: newYear }
      })

      // 2. Update EvaluationAgendas
      await tx.evaluationAgenda.updateMany({
        where: { year: oldYear },
        data: { year: newYear }
      })

      // 4. Update EvaluationPeriod
      await tx.evaluationPeriod.update({
        where: { id },
        data: {
          year: newYear,
          title: title || `Evaluasi PEKPPP Tahun ${newYear}`,
          ...(targetF03Quota !== undefined ? { targetF03Quota } : {})
        }
      })
    })
  } else {
    // Hanya update title atau quota
    await db.evaluationPeriod.update({
      where: { id },
      data: {
        title: title || currentPeriod.title,
        ...(targetF03Quota !== undefined ? { targetF03Quota } : {})
      }
    })
  }

  revalidatePath('/admin/periode')
  revalidatePath(`/admin/periode/${newYear}`)
  revalidatePath(`/admin/periode/${oldYear}`)
  revalidatePath('/admin/peserta')
  revalidatePath('/admin')
  revalidatePath('/hasil')
  revalidatePath('/')

  return { success: true }
}

export async function setPeriodStatusAction(id: string, isOpen: boolean) {
  if (isOpen) {
    // Close all periods first so strictly 1 period is open at a time
    await db.evaluationPeriod.updateMany({
      data: { isOpen: false }
    })
  }
  await db.evaluationPeriod.update({ where: { id }, data: { isOpen } })
  revalidatePath('/admin/periode')
  revalidatePath('/admin/peserta')
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

export async function togglePeriodPublishAction(id: string, isPublished: boolean) {
  const period = await db.evaluationPeriod.findUnique({ where: { id } })
  if (!period) return { success: false, error: 'Tahun Penilaian tidak ditemukan.' }

  await db.evaluationPeriod.update({
    where: { id },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null
    }
  })

  // Sinkronkan juga isPublished pada semua evaluasi dalam tahun tersebut
  await db.evaluation.updateMany({
    where: { year: period.year },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null
    }
  })

  revalidatePath('/admin/periode')
  revalidatePath(`/admin/periode/${period.year}`)
  revalidatePath('/admin/peserta')
  revalidatePath('/admin')
  revalidatePath('/hasil')
  revalidatePath('/')

  return { success: true }
}

export async function toggleEvaluationPublishAction(evaluationId: string, isPublished: boolean) {
  const evaluation = await db.evaluation.findUnique({ where: { id: evaluationId } })
  if (!evaluation) return { success: false, error: 'Evaluasi tidak ditemukan.' }

  await db.evaluation.update({
    where: { id: evaluationId },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null
    }
  })

  revalidatePath(`/admin/periode/${evaluation.year}`)
  revalidatePath('/admin/peserta')
  revalidatePath('/hasil')
  revalidatePath(`/hasil/${evaluationId}`)
  revalidatePath('/')

  return { success: true }
}

export async function deletePeriodAction(id: string) {
  const period = await db.evaluationPeriod.findUnique({ where: { id } })
  if (period) {
    // Delete all evaluations for this year (and cascade scores, f03Respondents, submissions, comments)
    await db.evaluation.deleteMany({ where: { year: period.year } })
    // Delete all agendas for this year
    await db.evaluationAgenda.deleteMany({ where: { year: period.year } })
    // Delete the period
    await db.evaluationPeriod.delete({ where: { id } })
  }
  revalidatePath('/admin/periode')
  revalidatePath('/admin/peserta')
  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}



export async function enrollUnitToYearAction(year: number, unitId: string) {
  const evaluation = await EvaluationService.enrollUnitToPeriod(year, unitId)
  revalidatePath(`/evaluasi/${unitId}`)
  revalidatePath('/admin/peserta')
  revalidatePath('/hasil')
  return evaluation
}

export async function deleteEvaluationAction(evaluationId: string) {
  try {
    await db.evaluation.delete({
      where: { id: evaluationId }
    })
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Gagal mengeluarkan lokus peserta dari periode ini.' }
  }
}

export async function getEvaluationDetailsAction(unitId: string, year?: number) {
  let targetYear = year
  if (!targetYear) {
    const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
    targetYear = activePeriod?.year || new Date().getFullYear()
  }

  let evaluation = await db.evaluation.findUnique({
    where: {
      year_unitId: { year: targetYear, unitId }
    },
    include: {
      unit: { include: { category: true } },
      scores: {
        include: {
          indicator: { include: { aspect: true } },
          comments: {
            where: { parentId: null },
            include: { 
              author: true,
              replies: {
                include: { author: true },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    }
  })

  // Only run sync enrollment if evaluation doesn't exist or indicator scores are incomplete (< 31)
  if (!evaluation || evaluation.scores.length < 31) {
    await EvaluationService.enrollUnitToPeriod(targetYear, unitId)
    evaluation = await db.evaluation.findUnique({
      where: {
        year_unitId: { year: targetYear, unitId }
      },
      include: {
        unit: { include: { category: true } },
        scores: {
          include: {
            indicator: { include: { aspect: true } },
            comments: {
              where: { parentId: null },
              include: { 
                author: true,
                replies: {
                  include: { author: true },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { indicator: { indicatorNumber: 'asc' } }
        }
      }
    })
  }

  return evaluation
}

import { createNotificationHelper } from './notification-actions'
import { getF01QuestionByNumber } from '../lib/f01-parser'

export async function saveScoresAction(
  evaluationId: string,
  scoresData: Array<{ indicatorId: string; score: number | null; notes?: string; proofUrl?: string }>
) {
  const result = await EvaluationService.saveEvaluationScores(evaluationId, scoresData)

  try {
    const evalData = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: true,
        scores: {
          include: { indicator: true }
        }
      }
    })
    if (evalData) {
      const scoredIndicators = evalData.scores.filter((s) =>
        scoresData.some((input) => input.indicatorId === s.indicatorId && (input.score !== null || (input.notes && input.notes.trim() !== '')))
      )

      const validCount = scoredIndicators.length
      const firstScored = scoredIndicators[0]
      const targetQuery = firstScored ? `?mode=questions&soal=${firstScored.indicator.indicatorNumber}` : ''

      let title = `Penilaian F02: ${evalData.unit.name}`
      let message = ''

      if (validCount === 1 && firstScored) {
        const indNum = firstScored.indicator.indicatorNumber
        const indCode = firstScored.indicator.code
        const scoreVal = firstScored.score !== null ? ` (Skor ${firstScored.score})` : ''
        const noteExcerpt = firstScored.notes?.trim()
          ? ` Catatan: "${firstScored.notes.slice(0, 60)}${firstScored.notes.length > 60 ? '...' : ''}"`
          : ''
        title = `Penilaian Indikator #${indNum}: ${evalData.unit.name}`
        message = `Evaluator memberi penilaian${scoreVal} pada Indikator #${indNum} (${indCode}).${noteExcerpt}`
      } else if (validCount > 1) {
        const numbersList = scoredIndicators.slice(0, 5).map((s) => `#${s.indicator.indicatorNumber}`).join(', ')
        const extra = validCount > 5 ? ` dan ${validCount - 5} lainnya` : ''
        title = `Penilaian ${validCount} Indikator F02: ${evalData.unit.name}`
        message = `Evaluator telah menilai dan memberi catatan pada Indikator: ${numbersList}${extra}.`
      } else {
        message = `Evaluator telah memperbarui data penilaian F02 pada unit Anda.`
      }

      await createNotificationHelper({
        roleTarget: 'OPD',
        unitId: evalData.unitId,
        title,
        message,
        type: 'F02_UPDATE',
        link: `/evaluasi/${evalData.unitId}${targetQuery}`
      })
    }
  } catch (err) {
    console.error('Failed to trigger F02 notification:', err)
  }

  revalidatePath('/hasil')
  revalidatePath('/')
  return result
}

export async function saveF01BatchAction({
  items,
  path
}: {
  items: Array<{
    evaluationScoreId: string
    f01Data: Record<string, any>
    proofUrl?: string
  }>
  path?: string
}) {
  if (!items || items.length === 0) return { success: true }

  // Cek otentikasi & hak akses jendela waktu jika user adalah OPD
  const { getCurrentUserAction } = await import('./auth-actions')
  const user = await getCurrentUserAction()

  if (user && user.role === 'OPD') {
    const firstItem = await db.evaluationScore.findUnique({
      where: { id: items[0].evaluationScoreId },
      include: { evaluation: true }
    })
    if (firstItem?.evaluation) {
      const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
      const isPeriodOpen = activePeriod?.year === firstItem.evaluation.year
      const { getPeriodTimeline } = await import('../services/period-window-service')
      const timeline = await getPeriodTimeline(firstItem.evaluation.year)
      if (!isPeriodOpen || !timeline.effectivePermissions.canFillF01) {
        return {
          success: false,
          error: `Pengisian formulir F-01 untuk Tahun ${firstItem.evaluation.year} saat ini ditutup (mode arsip / di luar jadwal tahapan).`
        }
      }
    }
  }

  // Cek terlebih dahulu apakah salah satu skor yang diperbarui sudah pernah dinilai oleh evaluator
  const existingScores = await db.evaluationScore.findMany({
    where: { id: { in: items.map((i) => i.evaluationScoreId) } },
    select: { id: true, score: true, notes: true, indicator: { select: { indicatorNumber: true, code: true } } }
  })
  const isPostEvaluation = existingScores.some(
    (s) => s.score !== null || (s.notes && s.notes.trim() !== '')
  )

  const updates = items.map((item) =>
    db.evaluationScore.update({
      where: { id: item.evaluationScoreId },
      data: {
        f01Data: item.f01Data,
        proofUrl: item.proofUrl || undefined,
        f01Submitted: true
      },
      include: {
        evaluation: { include: { unit: true } },
        indicator: true
      }
    })
  )

  const updatedScores = await db.$transaction(updates)

  try {
    const firstScore = updatedScores[0]
    if (firstScore?.evaluation) {
      const numbersList = updatedScores.slice(0, 5).map((s) => `#${s.indicator.indicatorNumber}`).join(', ')
      const extra = updatedScores.length > 5 ? ` dan ${updatedScores.length - 5} lainnya` : ''
      const targetQuery = `?mode=questions&soal=${firstScore.indicator.indicatorNumber}`

      await createNotificationHelper({
        roleTarget: 'SUPER_ADMIN',
        unitId: firstScore.evaluation.unitId,
        title: isPostEvaluation
          ? `[Revisi Pasca Penilaian] Isian F01: ${firstScore.evaluation.unit.name}`
          : `Update Isian F01: ${firstScore.evaluation.unit.name}`,
        message: isPostEvaluation
          ? `OPD memperbarui isian F01 pada Indikator ${numbersList}${extra} yang telah dinilai sebelumnya. Evaluator dimohon meninjau ulang.`
          : `OPD memperbarui isian F01 untuk Indikator ${numbersList}${extra} secara serentak.`,
        type: isPostEvaluation ? 'F01_REVISION' : 'F01_UPDATE',
        link: `/evaluasi/${firstScore.evaluation.unitId}${targetQuery}`
      })
    }
  } catch (err) {
    console.error('Failed to trigger bulk F01 notification:', err)
  }

  if (path) revalidatePath(path)
  return { success: true }
}

export async function saveF01DataAction({
  evaluationScoreId,
  f01Data,
  proofUrl,
  path
}: {
  evaluationScoreId: string
  f01Data: Record<string, any>
  proofUrl?: string
  path?: string
}) {
  // Cek otentikasi & hak akses jendela waktu jika user adalah OPD
  const { getCurrentUserAction } = await import('./auth-actions')
  const user = await getCurrentUserAction()

  const existing = await db.evaluationScore.findUnique({
    where: { id: evaluationScoreId },
    select: { score: true, notes: true, f01Data: true, evaluation: { select: { year: true } } }
  })

  if (user && user.role === 'OPD' && existing?.evaluation) {
    const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
    const isPeriodOpen = activePeriod?.year === existing.evaluation.year
    const { getPeriodTimeline } = await import('../services/period-window-service')
    const timeline = await getPeriodTimeline(existing.evaluation.year)
    if (!isPeriodOpen || !timeline.effectivePermissions.canFillF01) {
      throw new Error(`Pengisian formulir F-01 untuk Tahun ${existing.evaluation.year} saat ini ditutup (mode arsip / di luar jadwal tahapan).`)
    }
  }

  const isPostEvaluation = Boolean(
    existing && (existing.score !== null || (existing.notes && existing.notes.trim() !== ''))
  )

  // Deteksi kunci butir pertanyaan F01 mana yang diubah
  const prevData = (existing?.f01Data as Record<string, any>) || {}
  const changedKey = Object.keys(f01Data).find((key) => JSON.stringify(f01Data[key]) !== JSON.stringify(prevData[key]))

  const updated = await db.evaluationScore.update({
    where: { id: evaluationScoreId },
    data: {
      f01Data,
      proofUrl: proofUrl || undefined,
      f01Submitted: true
    },
    include: {
      evaluation: { include: { unit: true } },
      indicator: true
    }
  })

  try {
    if (updated.evaluation) {
      const indNum = updated.indicator.indicatorNumber
      const indCode = updated.indicator.code
      const indQuestion = updated.indicator.question
      const questionExcerpt = indQuestion ? ` - ${indQuestion.slice(0, 45)}${indQuestion.length > 45 ? '...' : ''}` : ''
      const targetItemQuery = changedKey ? `&targetItem=${encodeURIComponent(changedKey)}` : ''

      // Cari teks pertanyaan spesifik dari f01.json
      let itemQuestionLabel = ''
      if (changedKey) {
        const f01Q = getF01QuestionByNumber(indNum)
        const matchedItem = f01Q?.items.find((it) => it.id === changedKey)
        if (matchedItem) {
          itemQuestionLabel = ` pada butir "${matchedItem.text.slice(0, 60)}${matchedItem.text.length > 60 ? '...' : ''}"`
        }
      }

      await createNotificationHelper({
        roleTarget: 'SUPER_ADMIN',
        unitId: updated.evaluation.unitId,
        title: isPostEvaluation
          ? `[Revisi Pasca Penilaian] Indikator #${indNum}: ${updated.evaluation.unit.name}`
          : `Update Isian F01 #${indNum}: ${updated.evaluation.unit.name}`,
        message: isPostEvaluation
          ? `OPD memperbarui isian Formulir F01 Indikator #${indNum} (${indCode}${questionExcerpt})${itemQuestionLabel} yang telah dinilai sebelumnya.`
          : `OPD memperbarui isian Formulir F01 Indikator #${indNum} (${indCode}${questionExcerpt})${itemQuestionLabel}.`,
        type: isPostEvaluation ? 'F01_REVISION' : 'F01_UPDATE',
        link: `/evaluasi/${updated.evaluation.unitId}?mode=questions&soal=${indNum}${targetItemQuery}`
      })
    }
  } catch (err) {
    console.error('Failed to trigger F01 notification:', err)
  }

  if (path) revalidatePath(path)
  return { success: true, score: updated }
}

export async function saveAspectNoteAction({
  evaluationId,
  aspectCode,
  note,
  unitId,
}: {
  evaluationId: string
  aspectCode: string
  note: string
  unitId: string
}) {
  // Read current aspectNotes JSON
  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    select: { aspectNotes: true }
  })
  const current = (evaluation?.aspectNotes as Record<string, string>) || {}
  const updated = { ...current, [aspectCode]: note }

  await db.evaluation.update({
    where: { id: evaluationId },
    data: { aspectNotes: updated }
  })

  revalidatePath(`/evaluasi/${unitId}`)
  return { success: true }
}

export async function enrollUnitsBulkAction(year: number, unitIds: string[]) {
  try {
    // 1. Ambil seluruh master 31 indikator sekali saja
    const indicators = await db.indicator.findMany()

    // 2. Ambil data tahun lalu untuk transfer Living Document secara massal
    const previousEvaluations = await db.evaluation.findMany({
      where: { year: year - 1, unitId: { in: unitIds } },
      include: { scores: true }
    })

    const prevScoresByUnit = new Map<string, Map<string, string>>() // unitId -> Map(indicatorId -> proofUrl)
    previousEvaluations.forEach((ev) => {
      const scoreMap = new Map<string, string>()
      ev.scores.forEach((s) => {
        if (s.proofUrl) scoreMap.set(s.indicatorId, s.proofUrl)
      })
      prevScoresByUnit.set(ev.unitId, scoreMap)
    })

    // 3. Ambil data evaluasi tahun saat ini yang sudah terdaftar
    const existingEvaluations = await db.evaluation.findMany({
      where: { year, unitId: { in: unitIds } }
    })
    const existingUnitIds = new Set(existingEvaluations.map((e) => e.unitId))

    // 4. Buat header Evaluasi yang belum ada secara massal
    const missingUnitIds = unitIds.filter((id) => !existingUnitIds.has(id))
    if (missingUnitIds.length > 0) {
      await db.evaluation.createMany({
        data: missingUnitIds.map((uid) => ({
          year,
          unitId: uid,
          status: 'DRAFT'
        }))
      })
    }

    // 5. Ambil ulang seluruh header evaluasi tahun aktif untuk mendapatkan ID evaluasinya
    const allYearEvaluations = await db.evaluation.findMany({
      where: { year, unitId: { in: unitIds } }
    })

    // 6. Ambil EvaluationScore yang sudah ada untuk menghindari duplikasi key unique
    const existingScores = await db.evaluationScore.findMany({
      where: { evaluationId: { in: allYearEvaluations.map((e) => e.id) } }
    })
    const existingScoreKeys = new Set(existingScores.map((s) => `${s.evaluationId}_${s.indicatorId}`))

    // 7. Siapkan payload scores baru untuk dimasukkan secara massal (createMany)
    const createScoresData: Array<{ evaluationId: string; indicatorId: string; proofUrl?: string | null }> = []

    for (const ev of allYearEvaluations) {
      const prevScores = prevScoresByUnit.get(ev.unitId)
      for (const ind of indicators) {
        const key = `${ev.id}_${ind.id}`
        if (!existingScoreKeys.has(key)) {
          const inheritedProofUrl = prevScores?.get(ind.id) ?? null
          createScoresData.push({
            evaluationId: ev.id,
            indicatorId: ind.id,
            proofUrl: inheritedProofUrl
          })
        }
      }
    }

    if (createScoresData.length > 0) {
      await db.evaluationScore.createMany({
        data: createScoresData
      })
    }

    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    return { success: true, count: unitIds.length }
  } catch (error: any) {
    console.error('Bulk enroll failed:', error)
    return { success: false, error: error.message || 'Gagal mendaftarkan peserta secara massal.' }
  }
}

export async function deleteEvaluationsBulkAction(evaluationIds: string[]) {
  try {
    await db.evaluation.deleteMany({
      where: { id: { in: evaluationIds } }
    })
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    revalidatePath('/')
    return { success: true, count: evaluationIds.length }
  } catch (error: any) {
    console.error('Bulk delete failed:', error)
    return { success: false, error: error.message || 'Gagal mengeluarkan peserta secara massal.' }
  }
}

export async function toggleEvaluationFinishedAction(evaluationId: string, targetState?: boolean) {
  try {
    const existing = await db.evaluation.findUnique({
      where: { id: evaluationId }
    })
    if (!existing) return { success: false, error: 'Data evaluasi tidak ditemukan.' }

    const isFinished = targetState !== undefined ? targetState : !existing.isFinished

    const updated = await db.evaluation.update({
      where: { id: evaluationId },
      data: { isFinished }
    })

    revalidatePath(`/evaluasi/${existing.unitId}`)
    revalidatePath('/hasil')
    revalidatePath(`/hasil/${evaluationId}`)
    revalidatePath(`/hasil/berita-acara/${evaluationId}`)
    revalidatePath('/admin/peserta')
    revalidatePath('/opd')
    revalidatePath('/')

    return { success: true, isFinished: updated.isFinished }
  } catch (error: any) {
    console.error('Failed to toggle evaluation finished status:', error)
    return { success: false, error: error.message || 'Gagal memperbarui status selesai penilaian.' }
  }
}

export async function toggleEvaluationPriorityAction(evaluationId: string, targetState?: boolean) {
  try {
    const existing = await db.evaluation.findUnique({
      where: { id: evaluationId }
    })
    if (!existing) return { success: false, error: 'Data evaluasi tidak ditemukan.' }

    const isPriority = targetState !== undefined ? targetState : !existing.isPriority

    const updated = await db.evaluation.update({
      where: { id: evaluationId },
      data: { isPriority }
    })

    revalidatePath(`/admin/periode/${existing.year}`)
    revalidatePath('/admin/peserta')
    revalidatePath('/hasil')
    revalidatePath('/')

    return { success: true, isPriority: updated.isPriority }
  } catch (error: any) {
    console.error('Failed to toggle evaluation priority status:', error)
    return { success: false, error: error.message || 'Gagal memperbarui status prioritas lokus.' }
  }
}


