// src/services/evidence-metadata-service.ts
// Layanan Ekstraksi Cerdas Metadata Berkas Bukti Dukung (Tahun, Nomor Dokumen, Tanggal Penetapan)
// Memanfaatkan Gemini Multimodal Vision untuk memindai dokumen scan PDF dan foto dokumen resmi instansi.

import { db } from './db'
import { PdfOptimizerService } from './pdf-optimizer-service'
import { getAiEvaluatorConfig, trackAiUsage } from './system-setting-service'
import {
  extractAttachments,
  EvidenceAttachmentItem,
  SlotMetadataCategory,
  getSlotMetadataSchema,
  getConditionStatusLabel,
  getOperationalStatusLabel
} from '../core/domain/evidence-slots-preset'
import { Prisma } from '@prisma/client'

export interface ExtractedDocumentMetadata {
  category?: SlotMetadataCategory
  detectedYear: number | null
  documentNumber: string | null
  documentDate: string | null
  documentTitle: string | null
  facilityType?: string | null
  conditionStatus?: string | null
  locationDescription?: string | null
  photoDate?: string | null
  systemName?: string | null
  url?: string | null
  operationalStatus?: string | null
  screenshotDate?: string | null
  notes?: string | null
  confidence: number
  summary?: string
}

export class EvidenceMetadataService {
  /**
   * Mengekstrak metadata dari berkas (PDF atau Gambar) menggunakan Gemini Multimodal Vision.
   * Menyesuaikan skema ekstraksi dengan kategori slot:
   * - LEGAL_DOCUMENT: Tahun penetapan, Nomor SK/Dokumen, Tanggal pengesahan.
   * - PHYSICAL_FACILITY: Jenis fasilitas sarpras, Kondisi fisik, Lokasi area, Tanggal foto.
   * - DIGITAL_SYSTEM: Nama sistem/kanal, Status operasional, URL, Tanggal tangkapan layar.
   */
  static async extractMetadataWithVision(params: {
    fileUrl: string
    fileName?: string | null
    slotTitle?: string
    slotKey?: string
    fileType?: string | null
  }): Promise<ExtractedDocumentMetadata> {
    const {
      fileUrl,
      fileName = '',
      slotTitle = 'Bukti Dukung',
      slotKey = '',
      fileType = null
    } = params

    const schema = getSlotMetadataSchema(slotKey, undefined, fileType)

    // 1. Ambil file buffer
    const fileData = await PdfOptimizerService.fetchFileBuffer(fileUrl)
    if (!fileData) {
      // Fallback heuristik regex jika berkas tidak bisa di-fetch
      return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    const config = await getAiEvaluatorConfig().catch(() => ({
      model: 'gemini-2.5-flash',
      executionMode: 'FULL_AI'
    }))

    if (!apiKey || config.executionMode === 'HEURISTIC_ONLY') {
      return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
    }

    try {
      let inlinePart: { mimeType: string; data: string } | null = null
      const isPdf = fileData.mimeType.includes('pdf') || (fileName || '').toLowerCase().endsWith('.pdf')

      if (isPdf) {
        // Ambil maksimal 4 halaman (halaman awal + lembar pengesahan terakhir)
        const opt = await PdfOptimizerService.optimizePdfForAi(fileData.buffer, {
          maxPages: 4,
          keepLastPage: true,
          stripMetadata: true
        })
        inlinePart = {
          mimeType: 'application/pdf',
          data: opt.optimizedBuffer.toString('base64')
        }
      } else if (fileData.mimeType.startsWith('image/')) {
        inlinePart = {
          mimeType: fileData.mimeType,
          data: fileData.buffer.toString('base64')
        }
      }

      if (!inlinePart) {
        return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
      }

      let systemPrompt = ''

      if (schema.category === 'PHYSICAL_FACILITY') {
        const optionHints = schema.quickOptions.length > 0
          ? `Pilihan jenis fasilitas yang disarankan: ${schema.quickOptions.map((o) => `"${o}"`).join(', ')}.`
          : ''
        systemPrompt = `Anda adalah Asisten AI Vision untuk verifikasi sarana & prasarana pelayanan publik pemerintah Indonesia (PEKPPP KemenPAN-RB).
Gambar yang diberikan adalah foto dokumentasi fasilitas pelayanan publik pada slot "${slotTitle}".

TUGAS ANDA:
Analisis foto fasilitas tersebut dan ekstrak informasi berikut:
1. "facilityType": Nama/jenis fasilitas yang tampak pada foto (string). ${optionHints} Pilih yang paling sesuai atau sebutkan secara spesifik (misal: "Parkir Khusus Disabilitas", "Jalur Landai / Ramp", "Ruang Laktasi", dll.).
2. "conditionStatus": Kondisi kelayakan fasilitas yang terlihat, pilih salah satu dari: "LAYAK_BERFUNGSI" | "BARU_DIRENOVASI" | "PERLU_PERBAIKAN".
3. "locationDescription": Perkiraan area/lokasi penempatan fasilitas yang tampak di foto (misal: "Area Parkir Depan Gedung", "Ruang Tunggu Pelayanan", "Toilet Pengguna Layanan").
4. "photoDate": Jika terdapat timestamp kamera pada sudut foto, ekstrak tanggalnya dalam format ISO "YYYY-MM-DD". Jika tidak ada, isi null.
5. "detectedYear": Tahun pengambilan foto dari timestamp foto atau nama berkas (angka integer, misal 2024 atau 2025). Jika tidak tertera di foto, isi null.
6. "notes": Deskripsi singkat 1 kalimat mengenai kelengkapan/visibilitas fasilitas pada foto (misal: "Rambu dan marka simbol kursi roda terlihat jelas dan area parkir tertata rapi").
7. "confidence": Tingkat keyakinan identifikasi objek fasilitas (0.0 sampai 1.0).

PENTING: Hasilkan HANYA JSON valid:
{
  "facilityType": "Parkir Khusus Disabilitas",
  "conditionStatus": "LAYAK_BERFUNGSI",
  "locationDescription": "Area Parkir Utama",
  "photoDate": null,
  "detectedYear": 2025,
  "notes": "Terdapat rambu parkir disabilitas dan marka khusus di dekat akses masuk gedung.",
  "confidence": 0.95
}`
      } else if (schema.category === 'DIGITAL_SYSTEM') {
        const optionHints = schema.quickOptions.length > 0
          ? `Pilihan jenis kanal/sistem yang disarankan: ${schema.quickOptions.map((o) => `"${o}"`).join(', ')}.`
          : ''
        systemPrompt = `Anda adalah Asisten AI Vision untuk verifikasi Sistem Informasi Pelayanan Publik (SIPP) & kanal digital pemerintah Indonesia (PEKPPP KemenPAN-RB).
Gambar yang diberikan adalah tangkapan layar (screenshot) portal/aplikasi pada slot "${slotTitle}".

TUGAS ANDA:
Analisis tangkapan layar tersebut dan ekstrak informasi berikut:
1. "systemName": Nama aplikasi, portal, atau modul kanal digital yang tampil (string). ${optionHints}
2. "operationalStatus": Status tampilan sistem, pilih salah satu dari: "AKTIF_TERVERIFIKASI" | "AKTIF_BERJALAN" | "DALAM_PEMELIHARAAN".
3. "url": Alamat URL website atau nama akun media sosial jika terlihat pada address bar / layar. Jika tidak terlihat, isi null.
4. "screenshotDate": Tanggal yang tertera pada layar (berita terbaru/log update/jam sistem) dalam format ISO "YYYY-MM-DD" jika ada, atau null.
5. "detectedYear": Tahun yang terlihat pada konten/log pemutakhiran/layar (angka integer, misal 2025). Jika tidak ada, isi null.
6. "notes": Catatan ringkas 1 kalimat tentang informasi layanan yang tampil pada tangkapan layar.
7. "confidence": Tingkat keyakinan pembacaan tangkapan layar (0.0 sampai 1.0).

PENTING: Hasilkan HANYA JSON valid:
{
  "systemName": "Dashboard Profil Akun Aktif SIPPN KemenPAN-RB",
  "operationalStatus": "AKTIF_TERVERIFIKASI",
  "url": "https://sippn.menpan.go.id",
  "screenshotDate": "2025-02-10",
  "detectedYear": 2025,
  "notes": "Menampilkan profil instansi dan daftar standar pelayanan yang telah dipublikasikan.",
  "confidence": 0.92
}`
      } else {
        systemPrompt = `Anda adalah Asisten AI Vision untuk ekstraksi metadata dokumen administrasi publik pemerintah Indonesia (PEKPPP KemenPAN-RB).
Dokumen yang diberikan adalah pindaian/scan PDF atau foto dokumen resmi instansi daerah (seperti SK Standar Pelayanan, Laporan Pelaksanaan SKM, SOP, Berita Acara FKP, dsb.).

TUGAS ANDA:
Pindai isi gambar/dokumen untuk menemukan data identitas dokumen berikut:
1. "detectedYear": Tahun penetapan atau tahun laporan dokumen (angka integer, misal: 2024). Cari pada:
   - Bagian penutup "Ditetapkan di ... Pada tanggal [Hari Bulan TAHUN]" di dekat tanda tangan/cap basah Kepala Dinas/Bupati/Walikota.
   - Judul cover laporan (misal "Laporan SKM Tahun 2024").
   - Nomor surat/SK jika mengandung tahun (misal: "188.4/45/Kep/2024" => 2024).
2. "documentNumber": Nomor surat resmi / Nomor Keputusan Kepala Daerah / SK Kepala OPD (string, misal: "188.4/12/Disdukcapil/2024"). Jika tidak tertera, isi null.
3. "documentDate": Tanggal lengkap penetapan bila tertera dengan jelas (format ISO: "YYYY-MM-DD", misal: "2024-03-15"). Jika hanya tahun atau bulan yang jelas, isi null.
4. "documentTitle": Judul dokumen yang tertera di dokumen (string, misal: "Keputusan Kepala Dinas tentang Standar Pelayanan").
5. "confidence": Tingkat keyakinan pembacaan tahun (angka desimal 0.0 sampai 1.0).
6. "summary": Catatan ringkas 1 kalimat tentang temuan tahun dan keabsahan tanda tangan/stempel.

PENTING:
- Hasilkan HANYA JSON valid sesuai skema berikut tanpa tanda petik markdown:
{
  "detectedYear": 2024,
  "documentNumber": "188.4/12/2024",
  "documentDate": "2024-03-15",
  "documentTitle": "Standar Pelayanan Publik",
  "confidence": 0.95,
  "summary": "Ditetapkan pada 15 Maret 2024 dengan tanda tangan dan cap basah sah."
}`
      }

      let activeModel = config.model || 'gemini-2.5-flash'
      if (activeModel.includes('3.6')) {
        activeModel = 'gemini-2.5-flash'
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: inlinePart },
              {
                text: `${systemPrompt}\n\nJudul Slot Bukti: "${slotTitle}". Nama Berkas: "${fileName}". Harap ekstrak metadatanya sekarang.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        console.warn(`[EvidenceMetadataService] Gemini Vision HTTP ${res.status}:`, await res.text())
        return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
      }

      const data = await res.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
      }

      // Track AI Token Usage
      try {
        const usageMetadata = data.usageMetadata
        if (usageMetadata?.totalTokenCount) {
          await trackAiUsage(usageMetadata.totalTokenCount, {
            promptTokens: usageMetadata.promptTokens,
            candidatesTokens: usageMetadata.candidatesTokens,
            model: activeModel
          })
        }
      } catch {}

      const parsed = JSON.parse(rawText)
      let year =
        typeof parsed.detectedYear === 'number' &&
        parsed.detectedYear >= 2000 &&
        parsed.detectedYear <= 2040
          ? parsed.detectedYear
          : null

      const dateCandidate = parsed.photoDate || parsed.screenshotDate || parsed.documentDate
      if (!year && typeof dateCandidate === 'string') {
        const ym = dateCandidate.match(/\b(20[1-3][0-9])\b/)
        if (ym) year = parseInt(ym[1], 10)
      }

      return {
        category: schema.category,
        detectedYear: year,
        documentNumber: parsed.documentNumber ? String(parsed.documentNumber).trim() : null,
        documentDate: parsed.documentDate ? String(parsed.documentDate).trim() : null,
        documentTitle: parsed.documentTitle ? String(parsed.documentTitle).trim() : null,
        facilityType: parsed.facilityType ? String(parsed.facilityType).trim() : null,
        conditionStatus: parsed.conditionStatus ? String(parsed.conditionStatus).trim() : null,
        locationDescription: parsed.locationDescription
          ? String(parsed.locationDescription).trim()
          : null,
        photoDate: parsed.photoDate ? String(parsed.photoDate).trim() : null,
        systemName: parsed.systemName ? String(parsed.systemName).trim() : null,
        url: parsed.url ? String(parsed.url).trim() : null,
        operationalStatus: parsed.operationalStatus
          ? String(parsed.operationalStatus).trim()
          : null,
        screenshotDate: parsed.screenshotDate ? String(parsed.screenshotDate).trim() : null,
        notes: parsed.notes ? String(parsed.notes).trim() : parsed.summary || null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        summary: parsed.summary || parsed.notes || undefined
      }
    } catch (err: any) {
      console.warn('[EvidenceMetadataService] Error extracting with Gemini Vision:', err.message)
      return this.extractFallbackFromFilename(fileName, slotTitle, slotKey, fileType)
    }
  }

  /**
   * Fallback heuristik berbasis teks nama berkas dan judul jika AI offline/gagal.
   */
  private static extractFallbackFromFilename(
    fileName: string | null | undefined,
    slotTitle: string,
    slotKey: string = '',
    fileType: string | null = null
  ): ExtractedDocumentMetadata {
    const schema = getSlotMetadataSchema(slotKey, undefined, fileType)
    const safeName = fileName || ''
    const cleanFileBase = safeName
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim()
    const combined = `${safeName} ${slotTitle}`

    // Cari 4 digit angka tahun antara 2015 s/d 2035
    const yearMatch = combined.match(/\b(20[1-3][0-9])\b/)
    const detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : null

    if (schema.category === 'PHYSICAL_FACILITY') {
      const matchedOption = schema.quickOptions.find((opt) => {
        const keywords = opt
          .toLowerCase()
          .split(/[\s/(),&-]+/)
          .filter((w) => w.length >= 4)
        return keywords.some((kw) => cleanFileBase.toLowerCase().includes(kw))
      })
      return {
        category: 'PHYSICAL_FACILITY',
        detectedYear: detectedYear || new Date().getFullYear(),
        documentNumber: null,
        documentDate: null,
        documentTitle: slotTitle,
        facilityType: matchedOption || cleanFileBase || schema.quickOptions[0] || slotTitle,
        conditionStatus: 'LAYAK_BERFUNGSI',
        locationDescription: null,
        photoDate: null,
        notes: null,
        confidence: 0.7,
        summary: `Fasilitas diidentifikasi dari nama berkas (${cleanFileBase || slotTitle}).`
      }
    }

    if (schema.category === 'DIGITAL_SYSTEM') {
      const matchedOption = schema.quickOptions.find((opt) => {
        const keywords = opt
          .toLowerCase()
          .split(/[\s/(),&-]+/)
          .filter((w) => w.length >= 4)
        return keywords.some((kw) => cleanFileBase.toLowerCase().includes(kw))
      })
      return {
        category: 'DIGITAL_SYSTEM',
        detectedYear: detectedYear || new Date().getFullYear(),
        documentNumber: null,
        documentDate: null,
        documentTitle: slotTitle,
        systemName: matchedOption || cleanFileBase || schema.quickOptions[0] || slotTitle,
        operationalStatus: 'AKTIF_TERVERIFIKASI',
        url: null,
        screenshotDate: null,
        notes: null,
        confidence: 0.7,
        summary: `Kanal sistem digital diidentifikasi dari nama berkas (${cleanFileBase || slotTitle}).`
      }
    }

    // Default: LEGAL_DOCUMENT
    const numMatch = combined.match(/(?:No\.?|Nomor)\s*[:.]?\s*([0-9A-Za-z./_-]+)/i)
    const documentNumber = numMatch ? numMatch[1].trim() : null

    return {
      category: 'LEGAL_DOCUMENT',
      detectedYear,
      documentNumber,
      documentDate: null,
      documentTitle: slotTitle,
      confidence: detectedYear ? 0.6 : 0.2,
      summary: detectedYear
        ? `Tahun ${detectedYear} terdeteksi dari nama berkas secara otomatis.`
        : 'Tahun belum terdeteksi dari nama berkas.'
    }
  }

  /**
   * Mengekstrak metadata dan menyimpannya langsung ke record UnitEvidenceMaster.
   */
  static async extractAndSaveForMaster(
    masterId: string,
    actorName: string = 'Admin (AI Vision)'
  ): Promise<{
    success: boolean
    metadata?: ExtractedDocumentMetadata
    error?: string
  }> {
    const master = await db.unitEvidenceMaster.findUnique({
      where: { id: masterId }
    })
    if (!master) {
      return { success: false, error: 'Record Master Bukti Dukung tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
    const targetFileUrl = attachments[0]?.fileUrl || master.fileUrl
    const targetFileName = attachments[0]?.fileName || master.fileName || master.title
    const targetFileType = attachments[0]?.fileType || master.fileType

    if (!targetFileUrl || targetFileUrl.trim() === '') {
      return { success: false, error: 'Belum ada berkas terunggah pada slot master ini.' }
    }

    const metadata = await this.extractMetadataWithVision({
      fileUrl: targetFileUrl,
      fileName: targetFileName,
      slotTitle: master.title,
      slotKey: master.slotKey,
      fileType: targetFileType
    })

    const updatedAttachments: EvidenceAttachmentItem[] = attachments.map((att, idx) => {
      if (idx === 0) {
        return {
          ...att,
          metadata: {
            ...att.metadata,
            category: metadata.category,
            detectedYear: metadata.detectedYear,
            documentNumber: metadata.documentNumber,
            documentDate: metadata.documentDate,
            documentTitle: metadata.documentTitle,
            facilityType: metadata.facilityType,
            conditionStatus: metadata.conditionStatus,
            locationDescription: metadata.locationDescription,
            photoDate: metadata.photoDate,
            systemName: metadata.systemName,
            url: metadata.url,
            operationalStatus: metadata.operationalStatus,
            screenshotDate: metadata.screenshotDate,
            notes: metadata.notes,
            confidence: metadata.confidence,
            extractedAt: new Date().toISOString(),
            extractedBy: 'AI_VISION'
          }
        }
      }
      return att
    })

    let historyNote = ''
    if (metadata.category === 'PHYSICAL_FACILITY') {
      historyNote = `AI Vision mengidentifikasi fasilitas: "${metadata.facilityType || master.title}" (${getConditionStatusLabel(metadata.conditionStatus) || 'Layak & Berfungsi'}).`
    } else if (metadata.category === 'DIGITAL_SYSTEM') {
      historyNote = `AI Vision mengidentifikasi sistem/kanal: "${metadata.systemName || master.title}" (${getOperationalStatusLabel(metadata.operationalStatus) || 'Aktif'}).`
    } else {
      historyNote = metadata.detectedYear
        ? `Tahun ${metadata.detectedYear} terdeteksi oleh AI Vision (${Math.round(metadata.confidence * 100)}% keyakinan). No. SK: ${metadata.documentNumber || '-'}`
        : 'AI Vision telah memindai berkas, namun tahun penetapan tidak ditemukan secara eksplisit.'
    }

    const prevHistory = Array.isArray(master.history) ? (master.history as any[]) : []
    const newHistoryItem = {
      id: `ai_meta_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'AI_METADATA_EXTRACTED',
      actorName,
      fileName: targetFileName,
      fileUrl: targetFileUrl,
      note: historyNote
    }

    await db.unitEvidenceMaster.update({
      where: { id: masterId },
      data: {
        lastSourceYear: metadata.detectedYear || master.lastSourceYear,
        attachments: updatedAttachments as unknown as Prisma.InputJsonValue,
        history: [newHistoryItem, ...prevHistory] as unknown as Prisma.InputJsonValue
      }
    })

    return {
      success: true,
      metadata
    }
  }

  /**
   * Memperbarui metadata master secara manual oleh Admin/Pengguna (Human-in-the-Loop Override).
   * Mendukung ketiga kategori metadata: LEGAL_DOCUMENT, PHYSICAL_FACILITY, dan DIGITAL_SYSTEM.
   */
  static async updateManualMetadataForMaster(
    masterId: string,
    data: {
      category?: SlotMetadataCategory
      detectedYear?: number | null
      documentNumber?: string | null
      documentDate?: string | null
      documentTitle?: string | null
      facilityType?: string | null
      conditionStatus?: string | null
      locationDescription?: string | null
      photoDate?: string | null
      systemName?: string | null
      url?: string | null
      operationalStatus?: string | null
      screenshotDate?: string | null
      notes?: string | null
      attachmentId?: string | null
    },
    actorName: string = 'Admin (Manual)'
  ): Promise<{ success: boolean; error?: string }> {
    const master = await db.unitEvidenceMaster.findUnique({
      where: { id: masterId }
    })
    if (!master) {
      return { success: false, error: 'Record Master Bukti Dukung tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
    const targetAtt =
      (data.attachmentId ? attachments.find((a) => a.id === data.attachmentId) : attachments[0]) ||
      attachments[0]
    const schema = getSlotMetadataSchema(master.slotKey, undefined, targetAtt?.fileType || master.fileType)
    const activeCategory = data.category || schema.category

    // Turunkan detectedYear otomatis dari tanggal foto/screenshot/dokumen bila perlu
    let resolvedYear = data.detectedYear ?? null
    const dateStr = data.photoDate || data.screenshotDate || data.documentDate
    if (!resolvedYear && dateStr) {
      const m = dateStr.match(/\b(20[0-4][0-9])\b/)
      if (m) resolvedYear = parseInt(m[1], 10)
    }
    if (!resolvedYear && activeCategory !== 'LEGAL_DOCUMENT') {
      resolvedYear = targetAtt?.metadata?.detectedYear || master.lastSourceYear || new Date().getFullYear()
    }

    const updatedAttachments: EvidenceAttachmentItem[] = attachments.map((att, idx) => {
      const isTarget = data.attachmentId ? att.id === data.attachmentId : idx === 0
      if (isTarget) {
        return {
          ...att,
          metadata: {
            ...att.metadata,
            category: activeCategory,
            detectedYear: resolvedYear,
            documentNumber:
              data.documentNumber !== undefined
                ? data.documentNumber?.trim() || null
                : att.metadata?.documentNumber ?? null,
            documentDate:
              data.documentDate !== undefined
                ? data.documentDate?.trim() || null
                : att.metadata?.documentDate ?? null,
            documentTitle:
              data.documentTitle !== undefined
                ? data.documentTitle?.trim() || null
                : att.metadata?.documentTitle ?? null,
            facilityType:
              data.facilityType !== undefined
                ? data.facilityType?.trim() || null
                : att.metadata?.facilityType ?? null,
            conditionStatus:
              data.conditionStatus !== undefined
                ? data.conditionStatus?.trim() || null
                : att.metadata?.conditionStatus ?? null,
            locationDescription:
              data.locationDescription !== undefined
                ? data.locationDescription?.trim() || null
                : att.metadata?.locationDescription ?? null,
            photoDate:
              data.photoDate !== undefined
                ? data.photoDate?.trim() || null
                : att.metadata?.photoDate ?? null,
            systemName:
              data.systemName !== undefined
                ? data.systemName?.trim() || null
                : att.metadata?.systemName ?? null,
            url:
              data.url !== undefined
                ? data.url?.trim() || null
                : att.metadata?.url ?? null,
            operationalStatus:
              data.operationalStatus !== undefined
                ? data.operationalStatus?.trim() || null
                : att.metadata?.operationalStatus ?? null,
            screenshotDate:
              data.screenshotDate !== undefined
                ? data.screenshotDate?.trim() || null
                : att.metadata?.screenshotDate ?? null,
            notes:
              data.notes !== undefined
                ? data.notes?.trim() || null
                : att.metadata?.notes ?? null,
            confidence: 1.0,
            extractedAt: new Date().toISOString(),
            extractedBy: 'MANUAL'
          }
        }
      }
      return att
    })

    let historyNote = ''
    if (activeCategory === 'PHYSICAL_FACILITY') {
      historyNote = `Metadata fasilitas diperbarui: ${data.facilityType || '-'} • Kondisi: ${getConditionStatusLabel(data.conditionStatus) || '-'}${data.locationDescription ? ` • Lokasi: ${data.locationDescription}` : ''}`
    } else if (activeCategory === 'DIGITAL_SYSTEM') {
      historyNote = `Metadata sistem digital diperbarui: ${data.systemName || '-'} • Status: ${getOperationalStatusLabel(data.operationalStatus) || '-'}${data.url ? ` • URL: ${data.url}` : ''}`
    } else {
      historyNote = `Metadata dokumen diperbarui manual. Tahun: ${resolvedYear || '-'}, Nomor: ${data.documentNumber || '-'}`
    }

    const prevHistory = Array.isArray(master.history) ? (master.history as any[]) : []
    const newHistoryItem = {
      id: `man_meta_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MANUAL_METADATA_UPDATED',
      actorName,
      fileName: targetAtt?.fileName || master.fileName || master.title,
      fileUrl: targetAtt?.fileUrl || master.fileUrl,
      note: historyNote
    }

    await db.unitEvidenceMaster.update({
      where: { id: masterId },
      data: {
        lastSourceYear: resolvedYear !== null ? resolvedYear : master.lastSourceYear,
        attachments: updatedAttachments as unknown as Prisma.InputJsonValue,
        history: [newHistoryItem, ...prevHistory] as unknown as Prisma.InputJsonValue
      }
    })

    return { success: true }
  }

  /**
   * Pindai massal seluruh berkas master milik suatu unit yang belum memiliki metadata tahun.
   */
  static async batchExtractUnitMaster(
    unitId: string,
    forceAll: boolean = false
  ): Promise<{
    success: boolean
    processedCount: number
    updatedCount: number
    error?: string
  }> {
    if (!unitId) return { success: false, processedCount: 0, updatedCount: 0 }

    const masters = await db.unitEvidenceMaster.findMany({
      where: {
        unitId,
        NOT: { fileUrl: '' }
      }
    })

    const targets = forceAll
      ? masters
      : masters.filter((m) => {
          const atts = extractAttachments(m)
          const firstAtt = atts[0]
          return !m.lastSourceYear || !firstAtt?.metadata?.detectedYear
        })

    let updatedCount = 0

    for (const item of targets) {
      try {
        const res = await this.extractAndSaveForMaster(item.id, 'Admin Batch AI')
        if (res.success && res.metadata?.detectedYear) {
          updatedCount++
        }
      } catch (e) {
        console.warn(`[EvidenceMetadataService] Batch extract failed for slot ${item.slotKey}:`, e)
      }
    }

    return {
      success: true,
      processedCount: targets.length,
      updatedCount
    }
  }
}
