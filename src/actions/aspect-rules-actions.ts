// src/actions/aspect-rules-actions.ts
// Server Actions untuk Pengaturan Aturan Berkas Bukti Dukung per Aspek & Indikator

'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '../services/auth-guard'
import {
  getAspectRulesConfig,
  saveAspectRulesConfig,
  resetAspectRuleToDefault,
  AspectRulesConfig,
  getEvidenceSlotsRulesConfig,
  saveEvidenceSlotsRulesConfig,
  resetEvidenceSlotRule,
  SlotUploadRule
} from '../services/system-setting-service'

/**
 * Mengambil konfigurasi aturan berkas per slot bukti dukung
 */
export async function getEvidenceSlotsRulesAction() {
  try {
    await requireSuperAdmin()
    const rules = await getEvidenceSlotsRulesConfig()
    return { success: true, rules }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil aturan slot bukti dukung.' }
  }
}

/**
 * Menyimpan seluruh konfigurasi aturan per slot bukti dukung
 */
export async function saveEvidenceSlotsRulesAction(rules: Record<string, SlotUploadRule>) {
  try {
    await requireSuperAdmin()
    const res = await saveEvidenceSlotsRulesConfig(rules)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/admin/pengaturan-bukti')
    revalidatePath('/admin/master-bukti')
    revalidatePath('/admin/panduan-bukti')
    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/evaluasi')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan aturan slot bukti dukung.' }
  }
}

/**
 * Mereset aturan slot tertentu (atau semua slot) ke default standar PermenPAN-RB
 */
export async function resetEvidenceSlotRuleAction(slotKey?: string) {
  try {
    await requireSuperAdmin()
    const res = await resetEvidenceSlotRule(slotKey)
    if (!res.success) {
      return { success: false, error: 'Gagal mereset aturan slot.' }
    }

    revalidatePath('/admin/pengaturan-bukti')
    revalidatePath('/admin/master-bukti')
    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/evaluasi')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mereset aturan slot bukti dukung.' }
  }
}

/**
 * Mengambil konfigurasi aturan berkas per aspek
 */
export async function getAspectRulesAction() {
  try {
    await requireSuperAdmin()
    const config = await getAspectRulesConfig()
    return { success: true, config }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengambil aturan bukti dukung.' }
  }
}

/**
 * Menyimpan seluruh konfigurasi aturan berkas bukti dukung per aspek
 */
export async function saveAspectRulesAction(config: AspectRulesConfig) {
  try {
    await requireSuperAdmin()
    const res = await saveAspectRulesConfig(config)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    revalidatePath('/admin/pengaturan-bukti')
    revalidatePath('/admin/master-bukti')
    revalidatePath('/admin/panduan-bukti')
    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/evaluasi')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan aturan bukti dukung.' }
  }
}

/**
 * Mereset aturan aspek tertentu (atau semua) ke default standar PermenPAN-RB
 */
export async function resetAspectRuleAction(aspectCode?: string) {
  try {
    await requireSuperAdmin()
    const res = await resetAspectRuleToDefault(aspectCode)
    if (!res.success) {
      return { success: false, error: 'Gagal mereset aturan.' }
    }

    revalidatePath('/admin/pengaturan-bukti')
    revalidatePath('/admin/master-bukti')
    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/evaluasi')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mereset aturan bukti dukung.' }
  }
}
