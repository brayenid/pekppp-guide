'use server'

import { getMenpanApiConfig, saveMenpanApiConfig, MenpanApiConfig } from '../services/system-setting-service'
import { MenpanApiService } from '../services/menpan-api-service'
import { validateEvaluationForSync } from '../services/sync-validator-service'
import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

export async function getMenpanApiConfigAction() {
  return getMenpanApiConfig()
}

export async function saveMenpanApiConfigAction(config: Partial<MenpanApiConfig>) {
  await saveMenpanApiConfig(config)
  revalidatePath('/admin/pengaturan-api')
  revalidatePath('/admin/peserta')
  return { success: true }
}

export async function testMenpanConnectionAction() {
  return MenpanApiService.testConnection()
}

export async function getMenpanRemoteEvaluationsAction(year?: number) {
  return MenpanApiService.getRemoteEvaluations(year)
}

export async function validateEvaluationSyncAction(evaluationId: string) {
  return validateEvaluationForSync(evaluationId)
}

export async function checkEvaluationConflictAction(evaluationId: string) {
  // 1. Ambil data lokal
  const localEval = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true,
      scores: {
        include: { indicator: true },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    }
  })

  if (!localEval) {
    return { success: false, message: 'Evaluasi lokal tidak ditemukan.' }
  }

  // 2. Ambil daftar remote evaluations dari MenPAN
  const remoteRes = await MenpanApiService.getRemoteEvaluations(localEval.year)
  if (!remoteRes.success || !remoteRes.data) {
    return {
      success: false,
      message: remoteRes.message || 'Gagal mengambil data evaluasi dari server MenPAN-RB.'
    }
  }

  // Cari remote evaluation yang cocok berdasarkan menpanEvaluationId atau kemiripan nama unit
  const matchedRemote = localEval.menpanEvaluationId
    ? remoteRes.data.find((r) => r.uuid === localEval.menpanEvaluationId)
    : remoteRes.data.find((r) => {
        const localName = localEval.unit.name.toLowerCase().trim()
        const remoteName = r.name.toLowerCase().trim()
        return (
          localName === remoteName ||
          localName.includes(remoteName) ||
          remoteName.includes(localName)
        )
      })

  if (!matchedRemote) {
    return {
      success: true,
      hasMatchedRemote: false,
      availableRemotes: remoteRes.data,
      localName: localEval.unit.name,
      message: 'Belum ditemukan pasangan evaluasi di portal MenPAN-RB. Silakan pilih secara manual.'
    }
  }

  // 3. Ambil remote answers untuk mendeteksi perbedaan (konflik)
  const answersRes = await MenpanApiService.getRemoteAnswers(matchedRemote.uuid)
  const remoteAnswers = answersRes.data || []

  // Hitung perbedaan status & kelengkapan
  const localFilledCount = localEval.scores.filter(
    (s) => s.score !== null || s.f01Submitted
  ).length

  return {
    success: true,
    hasMatchedRemote: true,
    matchedRemote,
    availableRemotes: remoteRes.data,
    localEval: {
      id: localEval.id,
      name: localEval.unit.name,
      year: localEval.year,
      score: localEval.totalScore,
      percentage: localEval.percentage,
      finalIpp: localEval.finalIppScore,
      filledCount: localFilledCount,
      totalIndicators: 31,
      menpanEvaluationId: localEval.menpanEvaluationId
    },
    remoteAnswersCount: remoteAnswers.length,
    hasConflict: Boolean(
      remoteAnswers.length > 0 &&
      (matchedRemote.status === 'Selesai' || matchedRemote.status === 'Sedang Diisi')
    )
  }
}

export async function linkEvaluationToMenpanAction(
  evaluationId: string,
  menpanUuid: string
) {
  try {
    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        menpanEvaluationId: menpanUuid,
        syncLogs: {
          action: 'MANUAL_LINK_UUID',
          linkedAt: new Date().toISOString(),
          uuid: menpanUuid
        }
      }
    })
    revalidatePath('/admin/peserta')
    return { success: true, message: 'Lokus berhasil ditautkan dengan UUID MenPAN-RB.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menautkan lokus.' }
  }
}

export async function pushEvaluationSyncAction(evaluationId: string) {
  // 1. First run validation
  const validation = await validateEvaluationForSync(evaluationId)
  if (!validation.isEligible) {
    return {
      success: false,
      message: `Validasi gagal: ${validation.errors.join(' ')}`
    }
  }

  // 2. Perform push
  const result = await MenpanApiService.pushEvaluation(evaluationId)
  revalidatePath('/admin/peserta')
  revalidatePath(`/evaluasi/${evaluationId}`)
  return result
}
