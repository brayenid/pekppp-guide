// src/actions/ai-settings-actions.ts
// Server Actions untuk Pengaturan Konteks & Biaya AI Pre-Evaluator
'use server'

import {
  getAiEvaluatorConfig,
  saveAiEvaluatorConfig,
  DEFAULT_ASPECT_CONTEXTS,
  AiEvaluatorConfig
} from '../services/system-setting-service'
import { revalidatePath } from 'next/cache'

export async function getAiSettingsAction(): Promise<AiEvaluatorConfig> {
  return getAiEvaluatorConfig()
}

export async function saveAiSettingsAction(config: {
  executionMode?: 'BATCH' | 'INSTANT' | 'HEURISTIC_ONLY'
  model?: 'gemini-3.6-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite'
  maxPdfPages?: number
  maxUploadSizeMb?: number
  aspectContexts?: Record<string, string>
}) {
  try {
    await saveAiEvaluatorConfig(config)
    revalidatePath('/admin/pengaturan-ai')
    return { success: true }
  } catch (error: any) {
    console.error('Error saving AI settings:', error)
    return { success: false, error: error.message || 'Gagal menyimpan pengaturan AI.' }
  }
}

export async function resetAiContextToDefaultAction(aspectKey?: string) {
  try {
    if (aspectKey && DEFAULT_ASPECT_CONTEXTS[aspectKey]) {
      await saveAiEvaluatorConfig({
        aspectContexts: {
          [aspectKey]: DEFAULT_ASPECT_CONTEXTS[aspectKey].defaultDirective
        }
      })
    } else {
      const allDefaults: Record<string, string> = {}
      for (const [key, item] of Object.entries(DEFAULT_ASPECT_CONTEXTS)) {
        allDefaults[key] = item.defaultDirective
      }
      await saveAiEvaluatorConfig({ aspectContexts: allDefaults })
    }
    revalidatePath('/admin/pengaturan-ai')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mereset konteks default.' }
  }
}
