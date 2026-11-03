// src/services/evidence-compliance-service.ts
// Layanan Analitik Kepatuhan Layanan Publik & Peringatan Dini Bukti Dukung (PEKPPP)
// Menilai 5 Pilar Layanan Publik (SP, Sarpras Rentan, SKM, Pengaduan, Inovasi) berdasarkan Master Bukti Dukung.

import { db } from './db'
import { extractAttachments, normalizeAspectCode } from '../core/domain/evidence-slots-preset'

export interface PillarSpStatus {
  hasFile: boolean
  documentNumber: string | null
  documentDate: string | null
  year: number | null
  isAging: boolean // Berusia >= 3 tahun (perlu ditinjau ulang lewat FKP)
  fileUrl: string | null
  fileName: string | null
}

export interface PillarSaprasRentanStatus {
  hasFile: boolean
  photoCount: number
  photos: Array<{ fileUrl: string; fileName: string }>
}

export interface PillarSkmStatus {
  hasFile: boolean
  year: number | null
  isExpired: boolean // Tahun dokumen < tahun evaluasi berjalan
  hasPublication: boolean
  fileUrl: string | null
  fileName: string | null
}

export interface PillarPengaduanStatus {
  hasFile: boolean
  hasSpanLapor: boolean
  fileUrl: string | null
  fileName: string | null
}

export interface PillarInovasiStatus {
  hasFile: boolean
  documentNumber: string | null
  title: string | null
  year: number | null
  fileUrl: string | null
}

export interface ComplianceActionItem {
  pillar: 'SP' | 'SAPRAS' | 'SKM' | 'PENGADUAN' | 'INOVASI'
  severity: 'DANGER' | 'WARNING' | 'INFO'
  message: string
  slotKey: string
  aspectCode: string
}

export interface UnitComplianceProfile {
  unitId: string
  unitName: string
  unitCode: string | null
  categoryName: string
  sp: PillarSpStatus
  saprasRentan: PillarSaprasRentanStatus
  skm: PillarSkmStatus
  pengaduan: PillarPengaduanStatus
  inovasi: PillarInovasiStatus
  readinessScore: number // 0 - 100 (%)
  actionItems: ComplianceActionItem[]
}

export interface RegionalComplianceOverview {
  activeYear: number
  totalUnits: number
  stats: {
    unitsWithSp: number
    unitsWithAgingSp: number
    unitsWithSaprasRentan: number
    unitsWithActiveSkm: number
    unitsWithExpiredSkm: number
    unitsWithPengaduan: number
    unitsWithInovasi: number
    averageReadiness: number
  }
  unitProfiles: UnitComplianceProfile[]
}

export class EvidenceComplianceService {
  /**
   * Menghitung profil kepatuhan 5 pilar layanan publik untuk seluruh unit di daerah.
   * Mendukung preloadedUnits & preloadedMasters untuk menghindari query duplikat.
   */
  static async getRegionalComplianceOverview(
    optionsOrYear?:
      | number
      | {
          targetYear?: number
          preloadedUnits?: Array<{
            id: string
            code: string | null
            name: string
            category?: { name: string } | null
          }>
          preloadedMasters?: Array<any>
        }
  ): Promise<RegionalComplianceOverview> {
    let targetYear: number | undefined
    let preloadedUnits:
      | Array<{
          id: string
          code: string | null
          name: string
          category?: { name: string } | null
        }>
      | undefined
    let preloadedMasters: Array<any> | undefined

    if (typeof optionsOrYear === 'number') {
      targetYear = optionsOrYear
    } else if (optionsOrYear && typeof optionsOrYear === 'object') {
      targetYear = optionsOrYear.targetYear
      preloadedUnits = optionsOrYear.preloadedUnits
      preloadedMasters = optionsOrYear.preloadedMasters
    }

    let currentYear = targetYear
    if (!currentYear) {
      const activePeriod = await db.evaluationPeriod.findFirst({
        where: { isOpen: true },
        orderBy: { year: 'desc' }
      })
      currentYear = activePeriod?.year || new Date().getFullYear()
    }

    let units = preloadedUnits
    let masterRecords = preloadedMasters

    if (!units || !masterRecords) {
      const [fetchedUnits, fetchedMasters] = await Promise.all([
        units
          ? Promise.resolve(units)
          : db.unit.findMany({
              include: { category: true },
              orderBy: { name: 'asc' }
            }),
        masterRecords
          ? Promise.resolve(masterRecords)
          : db.unitEvidenceMaster.findMany({
              where: {
                NOT: { fileUrl: '' }
              }
            })
      ])
      units = fetchedUnits
      masterRecords = fetchedMasters
    }

    // Buat index master records: key = `${unitId}::${aspectCode}::${slotKey}`
    const masterMap = new Map<string, (typeof masterRecords)[number]>()
    for (const m of masterRecords) {
      const normAspect = normalizeAspectCode(m.aspectCode)
      masterMap.set(`${m.unitId}::${normAspect}::${m.slotKey}`, m)
    }

    const unitProfiles: UnitComplianceProfile[] = units.map((u) => {
      return this.computeUnitProfile(u, masterMap, currentYear)
    })

    // Hitung ringkasan statistik KPI
    let unitsWithSp = 0
    let unitsWithAgingSp = 0
    let unitsWithSaprasRentan = 0
    let unitsWithActiveSkm = 0
    let unitsWithExpiredSkm = 0
    let unitsWithPengaduan = 0
    let unitsWithInovasi = 0
    let totalScoreSum = 0

    for (const p of unitProfiles) {
      if (p.sp.hasFile) unitsWithSp++
      if (p.sp.isAging) unitsWithAgingSp++
      if (p.saprasRentan.hasFile) unitsWithSaprasRentan++
      if (p.skm.hasFile && !p.skm.isExpired) unitsWithActiveSkm++
      if (p.skm.hasFile && p.skm.isExpired) unitsWithExpiredSkm++
      if (p.pengaduan.hasFile) unitsWithPengaduan++
      if (p.inovasi.hasFile) unitsWithInovasi++
      totalScoreSum += p.readinessScore
    }

    const totalUnits = units.length
    const averageReadiness = totalUnits > 0 ? Math.round(totalScoreSum / totalUnits) : 0

    return {
      activeYear: currentYear,
      totalUnits,
      stats: {
        unitsWithSp,
        unitsWithAgingSp,
        unitsWithSaprasRentan,
        unitsWithActiveSkm,
        unitsWithExpiredSkm,
        unitsWithPengaduan,
        unitsWithInovasi,
        averageReadiness
      },
      unitProfiles
    }
  }

  /**
   * Menghitung profil kepatuhan 5 pilar khusus untuk satu unit lokus (OPD).
   */
  static async getUnitComplianceProfile(
    unitId: string,
    targetYear?: number
  ): Promise<UnitComplianceProfile | null> {
    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      orderBy: { year: 'desc' }
    })
    const currentYear = targetYear || activePeriod?.year || new Date().getFullYear()

    const [unit, masterRecords] = await Promise.all([
      db.unit.findUnique({
        where: { id: unitId },
        include: { category: true }
      }),
      db.unitEvidenceMaster.findMany({
        where: {
          unitId,
          NOT: { fileUrl: '' }
        }
      })
    ])

    if (!unit) return null

    const masterMap = new Map<string, (typeof masterRecords)[number]>()
    for (const m of masterRecords) {
      const normAspect = normalizeAspectCode(m.aspectCode)
      masterMap.set(`${m.unitId}::${normAspect}::${m.slotKey}`, m)
    }

    return this.computeUnitProfile(unit, masterMap, currentYear)
  }

  /**
   * Helper internal untuk memproses evaluasi 5 pilar per unit
   */
  private static computeUnitProfile(
    unit: { id: string; name: string; code: string | null; category?: { name: string } | null },
    masterMap: Map<string, any>,
    currentYear: number
  ): UnitComplianceProfile {
    const actionItems: ComplianceActionItem[] = []

    // 1. Pilar I: Standar Pelayanan (slotKey: 'sk_sp', aspectCode: 'I')
    const spMaster = masterMap.get(`${unit.id}::I::sk_sp`)
    const spAtts = extractAttachments(spMaster)
    const spPrimary = spAtts[0]
    const spMeta = spPrimary?.metadata
    const spYear = spMeta?.detectedYear || spMaster?.lastSourceYear || null
    const spHasFile = Boolean(spPrimary?.fileUrl || (spMaster?.fileUrl && spMaster.fileUrl.trim() !== ''))
    const spIsAging = Boolean(spHasFile && spYear && currentYear - spYear >= 3)

    const spStatus: PillarSpStatus = {
      hasFile: spHasFile,
      documentNumber: spMeta?.documentNumber || null,
      documentDate: spMeta?.documentDate || null,
      year: spYear,
      isAging: spIsAging,
      fileUrl: spPrimary?.fileUrl || spMaster?.fileUrl || null,
      fileName: spPrimary?.fileName || spMaster?.fileName || null
    }

    if (!spHasFile) {
      actionItems.push({
        pillar: 'SP',
        severity: 'DANGER',
        message: 'SK Standar Pelayanan belum terunggah. Dokumen ini merupakan syarat mutlak pelayanan publik.',
        slotKey: 'sk_sp',
        aspectCode: 'I'
      })
    } else if (spIsAging) {
      actionItems.push({
        pillar: 'SP',
        severity: 'WARNING',
        message: `SK Standar Pelayanan terbit tahun ${spYear} (sudah berusia ${currentYear - (spYear || 0)} tahun). Disarankan melakukan peninjauan/FKP ulang.`,
        slotKey: 'sk_sp',
        aspectCode: 'I'
      })
    }

    // 2. Pilar III: Sarpras Ramah Kelompok Rentan (slotKey: 'sarpras_kelompok_rentan', aspectCode: 'III')
    const saprasMaster = masterMap.get(`${unit.id}::III::sarpras_kelompok_rentan`)
    const saprasAtts = extractAttachments(saprasMaster)
    const saprasHasFile = Boolean(saprasAtts.length > 0 || (saprasMaster?.fileUrl && saprasMaster.fileUrl.trim() !== ''))
    const photos = saprasAtts.map((a) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName || 'Foto Sarpras'
    }))

    const saprasStatus: PillarSaprasRentanStatus = {
      hasFile: saprasHasFile,
      photoCount: photos.length,
      photos
    }

    if (!saprasHasFile) {
      actionItems.push({
        pillar: 'SAPRAS',
        severity: 'DANGER',
        message: 'Foto sarana prasarana ramah kelompok rentan (jalur landai, kursi roda, ruang laktasi) belum dilampirkan.',
        slotKey: 'sarpras_kelompok_rentan',
        aspectCode: 'III'
      })
    } else if (photos.length < 3) {
      actionItems.push({
        pillar: 'SAPRAS',
        severity: 'INFO',
        message: `Baru ada ${photos.length} foto sarpras rentan. Disarankan melengkapi foto ramp, kursi roda, dan ruang laktasi.`,
        slotKey: 'sarpras_kelompok_rentan',
        aspectCode: 'III'
      })
    }

    // 3. Pilar I: Laporan Pelaksanaan & Publikasi SKM (slotKey: 'laporan_skm', aspectCode: 'I')
    const skmMaster = masterMap.get(`${unit.id}::I::laporan_skm`)
    const skmAtts = extractAttachments(skmMaster)
    const skmPrimary = skmAtts[0]
    const skmMeta = skmPrimary?.metadata
    const skmYear = skmMeta?.detectedYear || skmMaster?.lastSourceYear || null
    const skmHasFile = Boolean(skmPrimary?.fileUrl || (skmMaster?.fileUrl && skmMaster.fileUrl.trim() !== ''))
    const skmIsExpired = Boolean(skmHasFile && skmYear && skmYear < currentYear)
    const hasPublication = skmAtts.some(
      (a) => a.fileType === 'IMAGE' || /\.(jpe?g|png|webp)$/i.test(a.fileName || '')
    )

    const skmStatus: PillarSkmStatus = {
      hasFile: skmHasFile,
      year: skmYear,
      isExpired: skmIsExpired,
      hasPublication,
      fileUrl: skmPrimary?.fileUrl || skmMaster?.fileUrl || null,
      fileName: skmPrimary?.fileName || skmMaster?.fileName || null
    }

    if (!skmHasFile) {
      actionItems.push({
        pillar: 'SKM',
        severity: 'DANGER',
        message: 'Laporan pelaksanaan SKM belum tersedia. Evaluasi tahunan mewajibkan pelaporan SKM terbaru.',
        slotKey: 'laporan_skm',
        aspectCode: 'I'
      })
    } else if (skmIsExpired) {
      actionItems.push({
        pillar: 'SKM',
        severity: 'WARNING',
        message: `Laporan SKM terakhir bertahun ${skmYear}. Wajib diperbarui dengan laporan SKM tahun berjalan (${currentYear}).`,
        slotKey: 'laporan_skm',
        aspectCode: 'I'
      })
    } else if (!hasPublication) {
      actionItems.push({
        pillar: 'SKM',
        severity: 'WARNING',
        message: 'Laporan SKM sudah ada, tetapi foto/screenshot publikasi hasil SKM ke masyarakat belum dilampirkan.',
        slotKey: 'laporan_skm',
        aspectCode: 'I'
      })
    }

    // 4. Pilar V: Pengelolaan Pengaduan & SP4N-LAPOR! (slotKey: 'kanal_span_lapor' atau 'sk_sop_pengaduan', aspectCode: 'V')
    const spanMaster = masterMap.get(`${unit.id}::V::kanal_span_lapor`)
    const sopMaster = masterMap.get(`${unit.id}::V::sk_sop_pengaduan`)
    const spanHas = Boolean(spanMaster?.fileUrl && spanMaster.fileUrl.trim() !== '')
    const sopHas = Boolean(sopMaster?.fileUrl && sopMaster.fileUrl.trim() !== '')
    const pengaduanHas = spanHas || sopHas

    const pengaduanStatus: PillarPengaduanStatus = {
      hasFile: pengaduanHas,
      hasSpanLapor: spanHas,
      fileUrl: spanMaster?.fileUrl || sopMaster?.fileUrl || null,
      fileName: spanMaster?.fileName || sopMaster?.fileName || null
    }

    if (!pengaduanHas) {
      actionItems.push({
        pillar: 'PENGADUAN',
        severity: 'DANGER',
        message: 'Bukti pengelolaan pengaduan / pemanfaatan kanal SP4N-LAPOR! belum terunggah.',
        slotKey: 'kanal_span_lapor',
        aspectCode: 'V'
      })
    }

    // 5. Pilar VI: Inovasi Pelayanan Publik (slotKey: 'proposal_sk_inovasi', aspectCode: 'VI')
    const inovasiMaster = masterMap.get(`${unit.id}::VI::proposal_sk_inovasi`)
    const inovasiAtts = extractAttachments(inovasiMaster)
    const inovasiPrimary = inovasiAtts[0]
    const inovasiMeta = inovasiPrimary?.metadata
    const inovasiHas = Boolean(inovasiPrimary?.fileUrl || (inovasiMaster?.fileUrl && inovasiMaster.fileUrl.trim() !== ''))

    const inovasiStatus: PillarInovasiStatus = {
      hasFile: inovasiHas,
      documentNumber: inovasiMeta?.documentNumber || null,
      title: inovasiMaster?.title || null,
      year: inovasiMeta?.detectedYear || inovasiMaster?.lastSourceYear || null,
      fileUrl: inovasiPrimary?.fileUrl || inovasiMaster?.fileUrl || null
    }

    if (!inovasiHas) {
      actionItems.push({
        pillar: 'INOVASI',
        severity: 'INFO',
        message: 'Belum ada dokumen SK Inovasi pelayanan publik. Inovasi memberikan nilai tambah signifikan pada Aspek VI.',
        slotKey: 'proposal_sk_inovasi',
        aspectCode: 'VI'
      })
    }

    // Hitung bobot kesiapan 5 pilar (SP: 25%, Sapras: 25%, SKM: 25%, Pengaduan: 15%, Inovasi: 10%)
    let score = 0
    if (spHasFile && !spIsAging) score += 25
    else if (spHasFile) score += 15 // Tetap dapat nilai jika ada SK meski aging

    if (saprasHasFile) score += 25

    if (skmHasFile && !skmIsExpired) score += 25
    else if (skmHasFile) score += 10 // Berkas lama tetap dihargai parsial

    if (pengaduanHas) score += 15
    if (inovasiHas) score += 10

    return {
      unitId: unit.id,
      unitName: unit.name,
      unitCode: unit.code,
      categoryName: unit.category?.name || 'Perangkat Daerah',
      sp: spStatus,
      saprasRentan: saprasStatus,
      skm: skmStatus,
      pengaduan: pengaduanStatus,
      inovasi: inovasiStatus,
      readinessScore: Math.min(100, score),
      actionItems
    }
  }
}
