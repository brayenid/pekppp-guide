// src/actions/evidence-compliance-actions.ts
// Server Actions untuk Analitik Kepatuhan Layanan Publik & Peringatan Dini

'use server'

import { EvidenceComplianceService } from '../services/evidence-compliance-service'
import { requireAuth, requireSuperAdmin } from '../services/auth-guard'

/**
 * Mengambil ringkasan kepatuhan seluruh OPD se-daerah (Khusus Super Admin)
 */
export async function getRegionalComplianceOverviewAction(year?: number) {
  try {
    await requireSuperAdmin()
    const overview = await EvidenceComplianceService.getRegionalComplianceOverview(year)
    return { success: true, overview }
  } catch (error: any) {
    console.error('Error fetching regional compliance overview:', error)
    return { success: false, error: error.message || 'Gagal memuat rekapitulasi kepatuhan daerah.' }
  }
}

/**
 * Mengambil profil kepatuhan 5 pilar khusus 1 unit lokus (Untuk OPD / Lokus)
 */
export async function getUnitComplianceProfileAction(unitId: string, year?: number) {
  try {
    await requireAuth()
    const profile = await EvidenceComplianceService.getUnitComplianceProfile(unitId, year)
    if (!profile) {
      return { success: false, error: 'Data unit tidak ditemukan.' }
    }
    return { success: true, profile }
  } catch (error: any) {
    console.error('Error fetching unit compliance profile:', error)
    return { success: false, error: error.message || 'Gagal memuat profil kepatuhan unit.' }
  }
}
