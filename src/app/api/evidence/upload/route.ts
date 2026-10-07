// src/app/api/evidence/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../services/db'
import { StorageService } from '../../../../services/storage-service'
import {
  normalizeAspectCode,
  extractAttachments,
  EvidenceAttachmentItem
} from '../../../../core/domain/evidence-slots-preset'

// Batasan Wajar Sesuai Arahan Pengguna:
// 1. Dokumen Resmi (PDF/DOCX): Maks 4 berkas, Maks 20 MB / berkas
const MAX_PDF_COUNT = 4
const MAX_PDF_SIZE_MB = 20
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

// 2. Foto / Gambar (JPG/PNG/WEBP): Maks 6 foto, Maks 1 MB / foto
const MAX_IMAGE_COUNT = 6
const MAX_IMAGE_SIZE_MB = 1
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const evaluationId = formData.get('evaluationId') as string
    const rawAspectCode = formData.get('aspectCode') as string
    const aspectCode = normalizeAspectCode(rawAspectCode)
    const slotKey = formData.get('slotKey') as string
    const title = (formData.get('title') as string) || 'Dokumen Bukti Dukung'
    const unitId = (formData.get('unitId') as string) || 'unit_shared'
    const uploaderName = (formData.get('uploaderName') as string) || 'Admin OPD'
    const note = (formData.get('note') as string) || undefined

    // Ambil berkas-berkas yang dikirim (bisa multiple via 'files' atau 'file')
    const filesRaw = formData.getAll('files').length > 0
      ? formData.getAll('files')
      : formData.getAll('file')
    const files = filesRaw.filter((f): f is File => f instanceof File && f.size > 0)

    if (!evaluationId || !rawAspectCode || !slotKey) {
      return NextResponse.json(
        { success: false, error: 'Parameter evaluationId, aspectCode, dan slotKey wajib diisi.' },
        { status: 400 }
      )
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada berkas file yang disertakan.' },
        { status: 400 }
      )
    }

    // Ambil data preset slot untuk identifikasi tipe dokumen (PDF vs IMAGE vs HYBRID)
    const { PEKPPP_EVIDENCE_SLOTS } = await import('../../../../core/domain/evidence-slots-preset')
    const preset = PEKPPP_EVIDENCE_SLOTS.find((s) => s.slotKey === slotKey)
    const isImageOnlySlot = preset?.documentType === 'IMAGE'
    const isDocOnlySlot = preset?.documentType === 'PDF' && preset?.slotKey === 'sk_sp'
    const isHybridSlot = !isImageOnlySlot && !isDocOnlySlot

    // Ambil data submission yang sudah ada untuk memeriksa kuota berkas
    const existing = await db.indicatorEvidenceSubmission.findFirst({
      where: {
        evaluationId,
        aspectCode: { in: [rawAspectCode, aspectCode] },
        slotKey
      }
    })

    const existingAttachments = extractAttachments(existing)

    // Validasi Kuota Jumlah Berkas
    const MAX_TOTAL_FILES = isImageOnlySlot ? MAX_IMAGE_COUNT : 6
    if (existingAttachments.length + files.length > MAX_TOTAL_FILES) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas kuota terlampaui! Maksimal ${MAX_TOTAL_FILES} berkas per slot. Saat ini sudah ada ${existingAttachments.length} berkas, dan Anda mencoba menambah ${files.length} berkas baru.`
        },
        { status: 400 }
      )
    }

    // Validasi Format & Ukuran Tiap Berkas
    for (const file of files) {
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
      const isDoc =
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/pdf' ||
        file.type.includes('word') ||
        file.type.includes('officedocument')

      if (isImageOnlySlot) {
        if (!isImg) {
          return NextResponse.json(
            {
              success: false,
              error: `Berkas "${file.name}" ditolak! Slot "${preset?.title || title}" khusus untuk foto/gambar (JPG, PNG, WEBP). Dokumen teks tidak diizinkan.`
            },
            { status: 400 }
          )
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(2)
          return NextResponse.json(
            {
              success: false,
              error: `Ukuran foto "${file.name}" (${actualMb} MB) melebihi batas maksimal ${MAX_IMAGE_SIZE_MB} MB. Silakan kompresi foto sebelum mengunggah.`
            },
            { status: 413 }
          )
        }
      } else if (isDocOnlySlot) {
        if (isImg) {
          return NextResponse.json(
            {
              success: false,
              error: `Format ditolak! Berkas "${file.name}" adalah gambar. Slot "${preset?.title || title}" adalah dokumen resmi wajib PDF atau DOCX (file foto dilarang).`
            },
            { status: 400 }
          )
        }
        if (!isDoc) {
          return NextResponse.json(
            {
              success: false,
              error: `Format berkas "${file.name}" tidak didukung. Harap unggah berkas PDF atau DOCX resmi.`
            },
            { status: 400 }
          )
        }
        if (file.size > MAX_PDF_SIZE_BYTES) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(1)
          return NextResponse.json(
            {
              success: false,
              error: `Ukuran dokumen "${file.name}" (${actualMb} MB) melebihi batas maksimal ${MAX_PDF_SIZE_MB} MB per dokumen.`
            },
            { status: 413 }
          )
        }
      } else {
        // Slot HYBRID: Menerima PDF / DOCX maupun FOTO / GAMBAR
        if (!isImg && !isDoc) {
          return NextResponse.json(
            {
              success: false,
              error: `Format berkas "${file.name}" tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`
            },
            { status: 400 }
          )
        }
        if (isImg && file.size > MAX_IMAGE_SIZE_BYTES) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(2)
          return NextResponse.json(
            {
              success: false,
              error: `Ukuran foto "${file.name}" (${actualMb} MB) melebihi batas maksimal ${MAX_IMAGE_SIZE_MB} MB per foto.`
            },
            { status: 413 }
          )
        }
        if (isDoc && file.size > MAX_PDF_SIZE_BYTES) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(1)
          return NextResponse.json(
            {
              success: false,
              error: `Ukuran dokumen "${file.name}" (${actualMb} MB) melebihi batas maksimal ${MAX_PDF_SIZE_MB} MB per dokumen.`
            },
            { status: 413 }
          )
        }
      }
    }

    // Proses Unggah Seluruh Berkas ke Storage
    const newAttachments: EvidenceAttachmentItem[] = [...existingAttachments]
    const newActivities: any[] = []

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadResult = await StorageService.uploadFile({
        buffer,
        fileName: file.name,
        mimeType: file.type,
        unitId,
        aspectCode,
        slotKey
      })

      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error || `Gagal mengunggah berkas ${file.name}.` },
          { status: 500 }
        )
      }

      const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(7)}`
      newAttachments.push({
        id: attachmentId,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        storageProvider: uploadResult.provider,
        uploadedAt: new Date().toISOString()
      })

      newActivities.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString(),
        action: 'UPLOAD',
        actorName: uploaderName,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        previousUrl: null,
        note: note || `Mengunggah berkas: ${uploadResult.fileName}`
      })
    }

    // Sinkronkan ke Basis Data (upsert dengan array attachments)
    const latestAttachment = newAttachments[newAttachments.length - 1]
    const existingHistory = (Array.isArray(existing?.history) ? existing!.history : []) as any[]
    const updatedHistory = [...existingHistory, ...newActivities]

    const submission = await db.indicatorEvidenceSubmission.upsert({
      where: {
        evaluationId_aspectCode_slotKey: {
          evaluationId,
          aspectCode,
          slotKey
        }
      },
      update: {
        fileUrl: latestAttachment.fileUrl,
        fileName: latestAttachment.fileName,
        fileSize: latestAttachment.fileSize,
        fileType: latestAttachment.fileType,
        storageProvider: latestAttachment.storageProvider,
        attachments: newAttachments as any,
        uploaderName,
        history: updatedHistory,
        isInherited: false
      },
      create: {
        evaluationId,
        aspectCode,
        slotKey,
        title,
        fileUrl: latestAttachment.fileUrl,
        fileName: latestAttachment.fileName,
        fileSize: latestAttachment.fileSize,
        fileType: latestAttachment.fileType,
        storageProvider: latestAttachment.storageProvider,
        attachments: newAttachments as any,
        uploaderName,
        history: updatedHistory,
        isInherited: false
      }
    })

    // SOKET AI PRE-EVALUATOR: Hanya dipicu otomatis jika mode diatur INSTANT oleh Admin.
    try {
      const { getAiEvaluatorConfig } = await import('../../../../services/system-setting-service')
      const config = await getAiEvaluatorConfig()
      if (config.executionMode === 'INSTANT') {
        const { AiEvaluatorService } = await import('../../../../services/ai-evaluator-service')
        await AiEvaluatorService.runPreEvaluation(evaluationId, aspectCode)
      }
    } catch (aiErr) {
      console.warn('AI Pre-Evaluation trigger error (non-fatal):', aiErr)
    }

    return NextResponse.json({
      success: true,
      submission,
      uploadedCount: files.length,
      totalAttachments: newAttachments.length
    })
  } catch (err: any) {
    console.error('Error in evidence upload route:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
