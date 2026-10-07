'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import f03Schema from '../../data/f03.json'

export interface PublicSurveySubmitPayload {
  token: string
  answers: Record<string, number> // { "1.a.K1": 5, ... }
}

/**
 * Mengambil data kuesioner publik berdasarkan token (dapat diakses masyarakat tanpa login)
 */
export async function getPublicSurveyDataAction(token: string) {
  try {
    if (!token || token.trim() === '') {
      return { success: false, error: 'Token kuesioner tidak valid.' }
    }

    const evaluation = await db.evaluation.findUnique({
      where: { publicSurveyToken: token },
      include: {
        unit: {
          include: {
            category: true
          }
        }
      }
    })

    if (!evaluation) {
      return {
        success: false,
        error: 'Kuesioner tidak ditemukan. Pastikan tautan yang Anda buka sudah benar.'
      }
    }

    const period = await db.evaluationPeriod.findUnique({
      where: { year: evaluation.year }
    })

    const { getPeriodTimeline } = await import('../services/period-window-service')
    const timeline = await getPeriodTimeline(evaluation.year)

    const targetQuota = period?.targetF03Quota || 30
    const filledCount = await db.f03Respondent.count({
      where: { evaluationId: evaluation.id }
    })

    // Kuesioner hanya aktif jika:
    // 1. Periode tahun evaluasi isOpen: true
    // 2. Izin efektif F03 mengizinkan (timeline window F03 aktif atau tidak ada window restriction)
    const isPeriodOpen = Boolean(timeline.isPeriodOpen)
    const canFillF03 = Boolean(timeline.effectivePermissions.canFillF03)
    const isSurveyOpen = Boolean(evaluation.isPublicSurveyOpen)
    const isQuotaFull = filledCount >= targetQuota

    let closedReason: string | null = null
    if (!isPeriodOpen) {
      closedReason = `Tahun evaluasi ${evaluation.year} tidak aktif atau telah ditutup.`
    } else if (!canFillF03) {
      closedReason = `Tahapan survei kepuasan masyarakat (F03) untuk tahun ${evaluation.year} sedang tidak aktif atau belum dibuka.`
    } else if (!isSurveyOpen) {
      closedReason = `Pengisian kuesioner untuk unit pelayanan ini sedang ditutup oleh pihak penyelenggara.`
    }

    return {
      success: true,
      data: {
        evaluationId: evaluation.id,
        year: evaluation.year,
        unitName: evaluation.unit.name,
        unitCode: evaluation.unit.code,
        categoryName: evaluation.unit.category?.name || 'Unit Pelayanan Publik',
        isPeriodOpen,
        canFillF03,
        isSurveyOpen,
        isQuotaFull,
        closedReason,
        targetQuota,
        filledCount,
        schema: f03Schema
      }
    }
  } catch (error: any) {
    console.error('Error getPublicSurveyDataAction:', error)
    return { success: false, error: 'Gagal memuat kuesioner.' }
  }
}

/**
 * Menerima submisi kuesioner dari masyarakat (anonim tanpa identitas)
 */
export async function submitPublicSurveyAction(payload: PublicSurveySubmitPayload) {
  try {
    const { token, answers } = payload
    if (!token) {
      return { success: false, error: 'Token kuesioner tidak valid.' }
    }

    const evaluation = await db.evaluation.findUnique({
      where: { publicSurveyToken: token },
      include: { unit: true }
    })

    if (!evaluation) {
      return { success: false, error: 'Data evaluasi tidak ditemukan.' }
    }

    // 1. Guard: Cek apakah tahun evaluasi aktif & jadwal F03 mengizinkan
    const { getPeriodTimeline } = await import('../services/period-window-service')
    const timeline = await getPeriodTimeline(evaluation.year)

    if (!timeline.isPeriodOpen) {
      return {
        success: false,
        error: `Periode evaluasi tahun ${evaluation.year} tidak aktif atau telah ditutup secara resmi.`
      }
    }

    if (!timeline.effectivePermissions.canFillF03) {
      return {
        success: false,
        error: `Tahapan pengisian survei publik (F03) untuk tahun ${evaluation.year} sedang tidak aktif.`
      }
    }

    // 2. Guard: Cek apakah kuesioner dibuka oleh Lokus
    if (!evaluation.isPublicSurveyOpen) {
      return {
        success: false,
        error: 'Pengisian kuesioner untuk unit pelayanan ini sedang ditutup oleh pihak penyelenggara.'
      }
    }

    // 3. Guard: Cek target kuota
    const period = await db.evaluationPeriod.findUnique({
      where: { year: evaluation.year }
    })
    const targetQuota = period?.targetF03Quota || 30
    const currentCount = await db.f03Respondent.count({
      where: { evaluationId: evaluation.id }
    })

    if (currentCount >= targetQuota) {
      return {
        success: false,
        error: `Terima kasih! Target kuota responden (${targetQuota} responden) untuk unit ini telah terpenuhi.`
      }
    }

    // 4. Validasi 14 indikator harus lengkap dan bernilai 0..5
    const requiredCodes = [
      '1.a.K1', '2.a.K1', '3.a.K1', '4.a.K1',
      '1.a.K2', '2.a.K2', '3.a.K2',
      '1.a.K3', '2.a.K3', '3.a.K3',
      '1.a.K4', '2.a.K4',
      '1.a.K5', '2.a.K5'
    ]

    let totalScore = 0
    for (const code of requiredCodes) {
      const val = answers[code]
      if (val === undefined || val === null || val < 0 || val > 5) {
        return {
          success: false,
          error: `Harap berikan penilaian yang valid (0 - 5) untuk seluruh pertanyaan survei.`
        }
      }
      totalScore += Number(val)
    }

    const scale5 = (totalScore / 70) * 5

    // Tentukan respondentNo berikutnya
    const lastRespondent = await db.f03Respondent.findFirst({
      where: { evaluationId: evaluation.id },
      orderBy: { respondentNo: 'desc' }
    })
    const nextNo = (lastRespondent?.respondentNo || 0) + 1

    // Simpan data responden publik anonim
    await db.f03Respondent.create({
      data: {
        evaluationId: evaluation.id,
        respondentNo: nextNo,
        name: `Masyarakat (Responden #${nextNo})`,
        answers,
        totalScore,
        scale5,
        submittedVia: 'PUBLIC'
      }
    })

    // Hitung ulang agregat F03 & Final IPP
    const allRespondents = await db.f03Respondent.findMany({
      where: { evaluationId: evaluation.id }
    })

    const f03Count = allRespondents.length
    const sumScore = allRespondents.reduce((acc, r) => acc + r.totalScore, 0)
    const avgF03Score = sumScore / f03Count
    const avgF03Scale5 = (avgF03Score / 70) * 5
    const avgF03Percentage = (avgF03Score / 70) * 100

    const f02Percentage = evaluation.percentage || 0
    const finalIppPercentage = 0.75 * f02Percentage + 0.25 * avgF03Percentage
    const finalIppScore = (finalIppPercentage / 100) * 5

    await db.evaluation.update({
      where: { id: evaluation.id },
      data: {
        f03Count,
        f03Score: avgF03Score,
        f03Scale5: avgF03Scale5,
        f03Percentage: avgF03Percentage,
        finalIppScore
      }
    })

    revalidatePath(`/evaluasi/${evaluation.unitId}`)
    revalidatePath(`/lokus/${evaluation.unitId}/f03`)
    revalidatePath(`/admin/evaluasi/${evaluation.unitId}`)
    revalidatePath('/hasil')

    return {
      success: true,
      respondentNo: nextNo,
      message: 'Penilaian Anda berhasil dikirim. Terima kasih atas partisipasi Anda!'
    }
  } catch (error: any) {
    console.error('Error submitPublicSurveyAction:', error)
    return { success: false, error: 'Terjadi kendala saat menyimpan jawaban survei.' }
  }
}
