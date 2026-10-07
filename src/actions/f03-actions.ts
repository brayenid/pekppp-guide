'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import f03Schema from '../../data/f03.json'

export interface F03RespondentInput {
  respondentNo?: number
  name?: string
  answers: Record<string, number> // { "1.a.K1": 5, ... }
}

export async function getF03DataAction(evaluationId: string) {
  let evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true,
      f03Respondents: {
        orderBy: { respondentNo: 'asc' }
      }
    }
  })

  if (!evaluation) {
    throw new Error('Evaluation not found')
  }

  // Ensure publicSurveyToken exists
  if (!evaluation.publicSurveyToken) {
    const randomHex = Math.random().toString(36).substring(2, 8)
    const token = `f03-${evaluation.unitId.substring(0, 8)}-${randomHex}`
    evaluation = await db.evaluation.update({
      where: { id: evaluationId },
      data: { publicSurveyToken: token },
      include: {
        unit: true,
        f03Respondents: {
          orderBy: { respondentNo: 'asc' }
        }
      }
    })
  }

  // Get active period or period for this evaluation year to know target quota
  const period = await db.evaluationPeriod.findUnique({
    where: { year: evaluation.year }
  })

  const targetQuota = period?.targetF03Quota || 30

  return {
    evaluation,
    targetQuota,
    schema: f03Schema,
    respondents: evaluation.f03Respondents
  }
}

export async function togglePublicSurveyAction(evaluationId: string, isPublicSurveyOpen: boolean) {
  const evaluation = await db.evaluation.update({
    where: { id: evaluationId },
    data: { isPublicSurveyOpen }
  })

  revalidatePath(`/evaluasi/${evaluation.unitId}`)
  revalidatePath(`/lokus/${evaluation.unitId}/f03`)
  return { success: true, isPublicSurveyOpen: evaluation.isPublicSurveyOpen }
}

export async function regeneratePublicSurveyTokenAction(evaluationId: string) {
  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId }
  })
  if (!evaluation) return { success: false, error: 'Evaluasi tidak ditemukan' }

  const randomHex = Math.random().toString(36).substring(2, 8)
  const newToken = `f03-${evaluation.unitId.substring(0, 8)}-${randomHex}`

  const updated = await db.evaluation.update({
    where: { id: evaluationId },
    data: { publicSurveyToken: newToken }
  })

  revalidatePath(`/evaluasi/${evaluation.unitId}`)
  return { success: true, publicSurveyToken: updated.publicSurveyToken }
}

export async function updatePeriodQuotaAction(periodId: string, targetF03Quota: number) {
  if (targetF03Quota < 1) {
    return { success: false, error: 'Kuota target minimal 1' }
  }

  await db.evaluationPeriod.update({
    where: { id: periodId },
    data: { targetF03Quota }
  })

  revalidatePath('/admin/periode')
  return { success: true }
}

export async function updateF03ProofUrlAction(evaluationId: string, f03ProofUrl: string) {
  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId }
  })

  if (!evaluation) {
    return { success: false, error: 'Evaluasi tidak ditemukan' }
  }

  await db.evaluation.update({
    where: { id: evaluationId },
    data: { f03ProofUrl: f03ProofUrl.trim() || null }
  })

  revalidatePath(`/lokus/${evaluation.unitId}/f03`)
  revalidatePath(`/evaluasi/${evaluation.unitId}/f03`)
  revalidatePath(`/admin/evaluasi/${evaluation.unitId}`)
  return { success: true }
}

export async function upsertF03RespondentAction(
  evaluationId: string,
  respondentId: string | null,
  input: F03RespondentInput
) {
  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId }
  })

  if (!evaluation) {
    return { success: false, error: 'Evaluasi tidak ditemukan' }
  }

  // Calculate score for this respondent (14 questions, max 70)
  let totalScore = 0
  for (const val of Object.values(input.answers)) {
    totalScore += Number(val) || 0
  }
  const scale5 = (totalScore / 70) * 5

  if (respondentId) {
    // Update existing respondent
    await db.f03Respondent.update({
      where: { id: respondentId },
      data: {
        name: input.name?.trim() || null,
        answers: input.answers,
        totalScore,
        scale5
      }
    })
  } else {
    // Check quota
    const period = await db.evaluationPeriod.findUnique({
      where: { year: evaluation.year }
    })
    const targetQuota = period?.targetF03Quota || 30
    const currentCount = await db.f03Respondent.count({ where: { evaluationId } })

    if (currentCount >= targetQuota) {
      return { success: false, error: `Kuota maksimal responden (${targetQuota}) telah tercapai.` }
    }

    // Determine next respondentNo
    const lastRespondent = await db.f03Respondent.findFirst({
      where: { evaluationId },
      orderBy: { respondentNo: 'desc' }
    })
    const nextNo = (lastRespondent?.respondentNo || 0) + 1

    await db.f03Respondent.create({
      data: {
        evaluationId,
        respondentNo: nextNo,
        name: input.name?.trim() || `Responden #${nextNo}`,
        answers: input.answers,
        totalScore,
        scale5
      }
    })
  }

  // Recalculate F03 aggregates & Final IPP Score for evaluation
  await recalculateF03AndFinalIpp(evaluationId)

  revalidatePath(`/evaluasi/${evaluation.unitId}`)
  revalidatePath(`/lokus/${evaluation.unitId}/f03`)
  revalidatePath(`/admin/evaluasi/${evaluation.unitId}`)
  revalidatePath('/hasil')
  return { success: true }
}

export async function deleteF03RespondentAction(respondentId: string) {
  const respondent = await db.f03Respondent.findUnique({
    where: { id: respondentId },
    include: { evaluation: true }
  })

  if (!respondent) {
    return { success: false, error: 'Responden tidak ditemukan' }
  }

  const evaluationId = respondent.evaluationId
  const unitId = respondent.evaluation.unitId

  await db.f03Respondent.delete({
    where: { id: respondentId }
  })

  // Recalculate aggregates
  await recalculateF03AndFinalIpp(evaluationId)

  revalidatePath(`/evaluasi/${unitId}`)
  revalidatePath(`/lokus/${unitId}/f03`)
  revalidatePath(`/admin/evaluasi/${unitId}`)
  revalidatePath('/hasil')
  return { success: true }
}

async function recalculateF03AndFinalIpp(evaluationId: string) {
  const respondents = await db.f03Respondent.findMany({
    where: { evaluationId }
  })

  const f03Count = respondents.length
  let avgF03Score = 0
  let avgF03Scale5 = 0
  let avgF03Percentage = 0

  if (f03Count > 0) {
    const sumScore = respondents.reduce((acc, r) => acc + r.totalScore, 0)
    avgF03Score = sumScore / f03Count
    avgF03Scale5 = (avgF03Score / 70) * 5
    avgF03Percentage = (avgF03Score / 70) * 100
  }

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId }
  })

  if (!evaluation) return

  // F-02 percentage is evaluation.percentage (0-100%)
  const f02Percentage = evaluation.percentage || 0

  // Final IPP = 75% F-02 + 25% F-03
  let finalIppPercentage = 0
  if (f03Count > 0) {
    finalIppPercentage = 0.75 * f02Percentage + 0.25 * avgF03Percentage
  } else {
    // If no F-03 filled yet, Final IPP uses F-02 percentage as baseline
    finalIppPercentage = f02Percentage
  }

  const finalIppScore = (finalIppPercentage / 100) * 5

  await db.evaluation.update({
    where: { id: evaluationId },
    data: {
      f03Count,
      f03Score: avgF03Score,
      f03Scale5: avgF03Scale5,
      f03Percentage: avgF03Percentage,
      finalIppScore
    }
  })
}
