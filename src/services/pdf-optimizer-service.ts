// src/services/pdf-optimizer-service.ts
// Service untuk kompresi, pemangkasan cerdas, dan optimasi PDF sebelum dikirim ke AI (Gemini)

import { PDFDocument } from 'pdf-lib'
import path from 'path'
import fs from 'fs'

export interface PdfOptimizationOptions {
  maxPages?: number
  keepLastPage?: boolean
  stripMetadata?: boolean
}

export interface PdfOptimizationResult {
  optimizedBuffer: Buffer
  originalSize: number
  optimizedSize: number
  originalPages: number
  extractedPages: number
  compressionRatio: number // e.g. 35.5 (%)
  pageIndicesKept: number[]
  applied: boolean
}

export class PdfOptimizerService {
  /**
   * Mengoptimalkan dan mengompresi buffer PDF sebelum dikirim ke model AI multimodal (Gemini).
   * - Menerapkan teknik 'Smart Slicing': mengambil (maxPages - 1) halaman awal (batang tubuh/komponen standar)
   *   dan 1 halaman paling akhir (lembar pengesahan SK/tanda tangan/cap basah) jika total halaman melebihi maxPages.
   * - Menghilangkan metadata yang tidak perlu untuk memangkas overhead ukuran berkas.
   * - Mengaktifkan kompresi object streams pada pdf-lib.
   * @param pdfBuffer Buffer dokumen PDF asli.
   * @param options Opsi optimasi (maxPages, keepLastPage, stripMetadata).
   * @returns Hasil optimasi berisi buffer hasil kompresi, perbandingan ukuran, dan daftar halaman yang dipertahankan.
   */
  static async optimizePdfForAi(
    pdfBuffer: Buffer,
    options: PdfOptimizationOptions = {}
  ): Promise<PdfOptimizationResult> {
    const originalSize = pdfBuffer.length
    const maxPages = options.maxPages || 15
    const keepLastPage = options.keepLastPage ?? true
    const stripMetadata = options.stripMetadata ?? true

    try {
      const srcDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true
      })

      const originalPages = srcDoc.getPageCount()

      // Jika PDF kosong
      if (originalPages === 0) {
        return {
          optimizedBuffer: pdfBuffer,
          originalSize,
          optimizedSize: originalSize,
          originalPages: 0,
          extractedPages: 0,
          compressionRatio: 0,
          pageIndicesKept: [],
          applied: false
        }
      }

      // Tentukan halaman mana yang akan diambil
      let pageIndicesToKeep: number[] = []

      if (originalPages <= maxPages) {
        // Jika dokumen lebih pendek atau sama dengan batas, ambil semua halaman
        pageIndicesToKeep = Array.from({ length: originalPages }, (_, i) => i)
      } else {
        // Smart Slicing:
        // Dokumen regulasi/SK PEKPPP memiliki tanda tangan/stempel sah pada halaman terakhir.
        // Maka kita ambil (maxPages - 1) halaman pertama (Batang Tubuh & Komponen Standar)
        // dan 1 halaman paling akhir (Lembar Pengesahan).
        const firstBatchCount = keepLastPage ? Math.max(1, maxPages - 1) : maxPages
        for (let i = 0; i < firstBatchCount && i < originalPages; i++) {
          pageIndicesToKeep.push(i)
        }

        if (keepLastPage && originalPages > firstBatchCount) {
          const lastIndex = originalPages - 1
          if (!pageIndicesToKeep.includes(lastIndex)) {
            pageIndicesToKeep.push(lastIndex)
          }
        }
      }

      // Buat dokumen PDF baru yang ramping
      const optimizedDoc = await PDFDocument.create()

      // Salin halaman yang dipilih
      const copiedPages = await optimizedDoc.copyPages(srcDoc, pageIndicesToKeep)
      for (const page of copiedPages) {
        optimizedDoc.addPage(page)
      }

      // Bersihkan metadata berlebih jika diminta
      if (stripMetadata) {
        optimizedDoc.setTitle('')
        optimizedDoc.setAuthor('')
        optimizedDoc.setSubject('')
        optimizedDoc.setKeywords([])
        optimizedDoc.setProducer('PEKPPP AI Document Optimizer')
        optimizedDoc.setCreator('PEKPPP Kutai Barat')
      }

      // Simpan dengan kompresi object stream
      const optimizedUint8Array = await optimizedDoc.save({
        useObjectStreams: true,
        addDefaultPage: false
      })

      const optimizedBuffer = Buffer.from(optimizedUint8Array)
      const optimizedSize = optimizedBuffer.length
      const compressionRatio = Number(
        (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)
      )

      return {
        optimizedBuffer,
        originalSize,
        optimizedSize,
        originalPages,
        extractedPages: pageIndicesToKeep.length,
        compressionRatio,
        pageIndicesKept: pageIndicesToKeep,
        applied: true
      }
    } catch (error) {
      console.warn('[PdfOptimizerService] Gagal mengompresi PDF, menggunakan buffer asli:', error)
      return {
        optimizedBuffer: pdfBuffer,
        originalSize,
        optimizedSize: originalSize,
        originalPages: 0,
        extractedPages: 0,
        compressionRatio: 0,
        pageIndicesKept: [],
        applied: false
      }
    }
  }

  /**
   * Mengambil buffer berkas dari local storage path (`/uploads/...`) atau remote URL (R2 / Cloud Storage).
   * Menangani deteksi MIME type dan pembatalan otomatis (timeout 12 detik) untuk menjaga stabilitas.
   * @param fileUrl Path lokal atau URL remote dari berkas bukti dukung.
   * @returns Objek `{ buffer: Buffer, mimeType: string }` atau null jika gagal diunduh.
   */
  static async fetchFileBuffer(fileUrl?: string | null): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!fileUrl || typeof fileUrl !== 'string') return null
    const cleanUrl = fileUrl.trim()
    if (!cleanUrl) return null

    try {
      // 1. Berkas Lokal (/uploads/...)
      if (cleanUrl.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', cleanUrl.replace(/^\//, ''))
        if (fs.existsSync(localPath)) {
          const buffer = fs.readFileSync(localPath)
          const ext = path.extname(cleanUrl).toLowerCase()
          const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg'
          return { buffer, mimeType }
        }
      }

      // 2. Berkas Remote (R2 / Cloud / Web)
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        // Jangan fetch URL Google Drive viewer / folders yang bukan file langsung
        if (cleanUrl.includes('drive.google.com/drive/folders')) return null

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)
        try {
          const res = await fetch(cleanUrl, { signal: controller.signal })
          if (!res.ok) return null
          const arrayBuffer = await res.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const contentType = res.headers.get('content-type') || (cleanUrl.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
          return { buffer, mimeType: contentType.split(';')[0].trim() }
        } finally {
          clearTimeout(timeout)
        }
      }
    } catch (e) {
      console.warn(`[PdfOptimizerService] Gagal membaca berkas dari ${cleanUrl}:`, e)
    }

    return null
  }

  /**
   * Menyiapkan bagian dokumen multimodal (`inlineData`) untuk berkas PDF & gambar bukti dukung.
   * - Mendukung berkas lampiran tunggal maupun berganda (multiple attachments) per slot.
   * - Mengompresi dan memangkas halaman PDF secara otomatis menggunakan `optimizePdfForAi`.
   * - Menjaga agar total ukuran payload base64 tidak melampaui batas aman API Gemini (default 16 MB).
   * @param submissions Daftar berkas bukti dukung yang disubmit per slot.
   * @param options Opsi batas halaman PDF dan kapasitas total payload API.
   * @returns Bagian dokumen multimodal (`parts`) siap kirim beserta log ringkasan optimasi (`summaryLogs`).
   */
  static async prepareOptimizedDocumentParts(
    submissions: Array<{
      slotKey: string
      title: string
      fileName?: string | null
      fileUrl?: string | null
      fileType?: string | null
      attachments?: any[]
    }>,
    options: {
      maxPages?: number
      maxTotalPayloadBytes?: number
    } = {}
  ): Promise<{
    parts: Array<{ inlineData: { mimeType: string; data: string } }>
    summaryLogs: Array<{
      slotKey: string
      fileName: string
      originalSize: number
      optimizedSize: number
      compressionRatio: number
      pagesKept: number[]
      status: string
    }>
  }> {
    const parts: Array<{ inlineData: { mimeType: string; data: string } }> = []
    const summaryLogs: Array<any> = []
    const maxPages = options.maxPages || 15
    const maxTotalPayload = options.maxTotalPayloadBytes || 16 * 1024 * 1024 // 16MB safe limit
    let currentTotalPayload = 0

    // Kumpulkan seluruh item berkas (mendukung multiple attachments per slot)
    const itemsToProcess: Array<{
      slotKey: string
      title: string
      fileName: string
      fileUrl: string
    }> = []

    for (const sub of submissions) {
      if (Array.isArray(sub.attachments) && sub.attachments.length > 0) {
        for (const att of sub.attachments) {
          if (att.fileUrl) {
            itemsToProcess.push({
              slotKey: sub.slotKey,
              title: sub.title,
              fileName: att.fileName || sub.title,
              fileUrl: att.fileUrl
            })
          }
        }
      } else if (sub.fileUrl) {
        itemsToProcess.push({
          slotKey: sub.slotKey,
          title: sub.title,
          fileName: sub.fileName || sub.title,
          fileUrl: sub.fileUrl
        })
      }
    }

    for (const item of itemsToProcess) {
      const fileData = await this.fetchFileBuffer(item.fileUrl)
      if (!fileData) continue

      const isPdf = fileData.mimeType.includes('pdf') || (item.fileName || '').toLowerCase().endsWith('.pdf')

      if (isPdf) {
        // Kompresi & Smart Slicing PDF
        const optResult = await this.optimizePdfForAi(fileData.buffer, {
          maxPages,
          keepLastPage: true,
          stripMetadata: true
        })

        const base64Data = optResult.optimizedBuffer.toString('base64')
        const payloadBytes = Buffer.byteLength(base64Data, 'utf8')

        if (currentTotalPayload + payloadBytes <= maxTotalPayload) {
          currentTotalPayload += payloadBytes
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          })

          summaryLogs.push({
            slotKey: item.slotKey,
            fileName: item.fileName,
            originalSize: optResult.originalSize,
            optimizedSize: optResult.optimizedSize,
            compressionRatio: optResult.compressionRatio,
            pagesKept: optResult.pageIndicesKept,
            status: `Telah dikompresi (${optResult.compressionRatio}% lebih hemat, ${optResult.extractedPages}/${optResult.originalPages} hal)`
          })
        } else {
          summaryLogs.push({
            slotKey: item.slotKey,
            fileName: item.fileName,
            originalSize: optResult.originalSize,
            optimizedSize: optResult.optimizedSize,
            compressionRatio: optResult.compressionRatio,
            pagesKept: optResult.pageIndicesKept,
            status: 'Dilewati dari payload multimodal (melebihi batas total payload API)'
          })
        }
      } else if (fileData.mimeType.startsWith('image/')) {
        // Gambar (JPG/PNG/WEBP)
        const base64Data = fileData.buffer.toString('base64')
        const payloadBytes = Buffer.byteLength(base64Data, 'utf8')

        if (currentTotalPayload + payloadBytes <= maxTotalPayload) {
          currentTotalPayload += payloadBytes
          parts.push({
            inlineData: {
              mimeType: fileData.mimeType,
              data: base64Data
            }
          })

          summaryLogs.push({
            slotKey: item.slotKey,
            fileName: item.fileName,
            originalSize: fileData.buffer.length,
            optimizedSize: fileData.buffer.length,
            compressionRatio: 0,
            pagesKept: [1],
            status: 'Gambar diproses langsung'
          })
        }
      }
    }

    return { parts, summaryLogs }
  }
}
