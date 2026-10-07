// src/actions/ai-evaluator-actions.ts
// Server Action untuk memicu AI Pre-Evaluasi PEKPPP
'use server'

import { AiEvaluatorService } from '../services/ai-evaluator-service'
import { revalidatePath } from 'next/cache'

export async function triggerAiPreEvaluationAction(params: {
  evaluationId: string
  aspectCode: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, path } = params
    if (!evaluationId || !aspectCode) {
      return { success: false, error: 'Parameter evaluationId dan aspectCode wajib disertakan.' }
    }

    const result = await AiEvaluatorService.runPreEvaluation(evaluationId, aspectCode)

    if (path) {
      revalidatePath(path)
    }

    return { success: true, result }
  } catch (error: any) {
    console.error('Error in triggerAiPreEvaluationAction:', error)
    return {
      success: false,
      error: error.message || 'Gagal menjalankan analisis AI Pre-Evaluator.'
    }
  }
}

export async function checkDocumentComplianceAction(params: {
  evaluationId: string
  aspectCode: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, path } = params
    if (!evaluationId || !aspectCode) {
      return { success: false, error: 'Parameter evaluationId dan aspectCode wajib disertakan.' }
    }

    const result = await AiEvaluatorService.runDocumentComplianceCheck(evaluationId, aspectCode)

    if (path) {
      revalidatePath(path)
    }

    return { success: true, result }
  } catch (error: any) {
    console.error('Error in checkDocumentComplianceAction:', error)
    return {
      success: false,
      error: error.message || 'Gagal memeriksa kelayakan berkas.'
    }
  }
}
