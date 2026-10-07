import { db } from './db'

export interface SyncValidationResult {
  isEligible: boolean
  f01Complete: boolean
  f01FilledCount: number
  f02Complete: boolean
  f02FilledCount: number
  f03Complete: boolean
  f03FilledCount: number
  targetQuota: number
  hasProofUrl: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Memvalidasi kelayakan data evaluasi suatu unit lokus sebelum disinkronkan ke Portal KemenPAN-RB.
 * - Memeriksa instrumen F-01 (Mandiri OPD): memastikan ke-31 indikator telah diisi.
 * - Memeriksa instrumen F-02 (Evaluasi Evaluator): memastikan ke-31 indikator telah dinilai.
 * - Memeriksa instrumen F-03 (Survei Kepuasan): memastikan jumlah responden memenuhi kuota target (default 30 orang).
 * - Menghimpun peringatan jika tautan bukti dukung instrumen belum diisi.
 * @param evaluationId ID evaluasi lokus yang akan divalidasi.
 * @returns Status kelayakan (`isEligible`), rekapitulasi jumlah terisi, serta daftar error dan warning.
 */
export async function validateEvaluationForSync(evaluationId: string): Promise<SyncValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true,
      scores: {
        include: {
          indicator: true
        }
      },
      f03Respondents: true
    }
  })

  if (!evaluation) {
    return {
      isEligible: false,
      f01Complete: false,
      f01FilledCount: 0,
      f02Complete: false,
      f02FilledCount: 0,
      f03Complete: false,
      f03FilledCount: 0,
      targetQuota: 0,
      hasProofUrl: false,
      errors: ['Evaluasi unit tidak ditemukan.'],
      warnings: []
    }
  }

  // Active Period Target Quota
  const period = await db.evaluationPeriod.findFirst({
    where: { year: evaluation.year }
  })
  const targetQuota = period?.targetF03Quota || 30

  // 1. Validate F-01 (Mandiri OPD)
  const filledF01 = evaluation.scores.filter(
    (s) => s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)
  )
  const f01FilledCount = filledF01.length
  const f01Complete = f01FilledCount >= 31

  if (!f01Complete) {
    errors.push(`F-01 Mandiri OPD belum lengkap (${f01FilledCount}/31 indikator terisi).`)
  }

  // Check aspect proof URLs
  const missingProofAspects = evaluation.scores.filter((s) => !s.proofUrl)
  if (missingProofAspects.length > 0) {
    warnings.push(`Beberapa indikator belum memiliki tautan bukti dukung Google Drive.`)
  }

  // 2. Validate F-02 (Evaluasi Evaluator)
  const filledF02 = evaluation.scores.filter((s) => s.score !== null && s.score !== undefined)
  const f02FilledCount = filledF02.length
  const f02Complete = f02FilledCount >= 31

  if (!f02Complete) {
    errors.push(`F-02 Penilaian Evaluator belum lengkap (${f02FilledCount}/31 indikator dinilai).`)
  }

  // 3. Validate F-03 (Survei Responden)
  const f03FilledCount = evaluation.f03Respondents.length
  const f03Complete = f03FilledCount >= targetQuota

  if (!f03Complete) {
    errors.push(`F-03 Kuota responden survei belum terpenuhi (${f03FilledCount}/${targetQuota} responden).`)
  }

  const hasProofUrl = Boolean(evaluation.f03ProofUrl)
  if (!hasProofUrl) {
    warnings.push(`Tautan berkas bukti dukung survei F-03 per lokus belum diisi.`)
  }

  const isEligible = errors.length === 0

  return {
    isEligible,
    f01Complete,
    f01FilledCount,
    f02Complete,
    f02FilledCount,
    f03Complete,
    f03FilledCount,
    targetQuota,
    hasProofUrl,
    errors,
    warnings
  }
}
