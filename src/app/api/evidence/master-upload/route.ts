// src/app/api/evidence/master-upload/route.ts
// Endpoint Unggah Berkas Langsung ke Master Bukti Dukung Unit (Living Document)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../services/db'
import { StorageService } from '../../../../services/storage-service'
import { EvidenceMasterService } from '../../../../services/evidence-master-service'
import { getRuleForSlot } from '../../../../services/system-setting-service'
import {
  normalizeAspectCode,
  extractAttachments,
  EvidenceAttachmentItem
} from '../../../../core/domain/evidence-slots-preset'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const unitId = formData.get('unitId') as string
    const rawAspectCode = formData.get('aspectCode') as string
    const aspectCode = normalizeAspectCode(rawAspectCode)
    const slotKey = formData.get('slotKey') as string
    const title = (formData.get('title') as string) || 'Dokumen Bukti Dukung'
    const uploaderName = (formData.get('uploaderName') as string) || 'Admin OPD'
    const note = (formData.get('note') as string) || ''

    const rawFiles = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null
    const files: File[] =
      rawFiles.length > 0 ? rawFiles : singleFile ? [singleFile] : []

    if (!unitId || !aspectCode || !slotKey || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter unitId, aspectCode, slotKey, dan minimal 1 berkas wajib disertakan.'
        },
        { status: 400 }
      )
    }

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    const sourceYear = activePeriod?.year || new Date().getFullYear()

    const existing = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode,
          slotKey
        }
      }
    })

    const existingAttachments = extractAttachments(existing)
    const rule = await getRuleForSlot(slotKey)

    // Cek batas total file per slot
    if (existingAttachments.length + files.length > rule.maxTotalFiles) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas kuota terlampaui! Maksimal ${rule.maxTotalFiles} berkas untuk slot "${title}". Saat ini sudah ada ${existingAttachments.length} berkas.`
        },
        { status: 400 }
      )
    }

    const isImageFile = (f: File) =>
      f.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name)

    const isDocFile = (f: File) =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.doc') ||
      f.name.toLowerCase().endsWith('.docx') ||
      f.type === 'application/pdf' ||
      f.type.includes('word') ||
      f.type.includes('officedocument')

    for (const file of files) {
      const isImg = isImageFile(file)
      const isDoc = isDocFile(file)

      // Validasi tipe dokumen yang diizinkan untuk slot ini
      if (rule.allowedDocumentType === 'PDF_ONLY' && isImg) {
        return NextResponse.json(
          {
            success: false,
            error: `Slot "${title}" hanya menerima dokumen resmi PDF/Word. Berkas foto "${file.name}" ditolak.`
          },
          { status: 400 }
        )
      }

      if (rule.allowedDocumentType === 'IMAGE_ONLY' && !isImg) {
        return NextResponse.json(
          {
            success: false,
            error: `Slot "${title}" khusus untuk dokumentasi foto/gambar. Berkas dokumen "${file.name}" ditolak.`
          },
          { status: 400 }
        )
      }

      if (!isImg && !isDoc) {
        return NextResponse.json(
          {
            success: false,
            error: `Format berkas "${file.name}" tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`
          },
          { status: 400 }
        )
      }

      const allowedLimitMb = isImg
        ? (rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3)
        : (rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20)
      const maxSizeBytes = allowedLimitMb * 1024 * 1024

      if (file.size > maxSizeBytes) {
        const actualMb = (file.size / (1024 * 1024)).toFixed(1)
        return NextResponse.json(
          {
            success: false,
            error: `Ukuran berkas ${isImg ? 'foto' : 'dokumen'} "${file.name}" (${actualMb} MB) melebihi batas maksimal ${allowedLimitMb} MB untuk slot ini.`
          },
          { status: 413 }
        )
      }
    }

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
          {
            success: false,
            error: uploadResult.error || `Gagal mengunggah berkas ${file.name}.`
          },
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
        uploadedAt: new Date().toISOString(),
        uploaderName,
        version: 1,
        versions: []
      })

      newActivities.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString(),
        action: 'UPLOAD',
        actorName: uploaderName,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        previousUrl: null,
        note: note || `Mengunggah berkas ke Master: ${uploadResult.fileName}`
      })
    }

    const latestAttachment = newAttachments[newAttachments.length - 1]
    const existingHistory = (Array.isArray(existing?.history) ? existing!.history : []) as any[]
    const updatedHistory = [...newActivities, ...existingHistory]

    const masterRecord = await db.unitEvidenceMaster.upsert({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode,
          slotKey
        }
      },
      update: {
        title: existing?.title || title,
        fileUrl: latestAttachment.fileUrl,
        fileName: latestAttachment.fileName,
        fileSize: latestAttachment.fileSize,
        fileType: latestAttachment.fileType,
        storageProvider: latestAttachment.storageProvider,
        uploaderName,
        lastSourceYear: sourceYear,
        attachments: newAttachments as any,
        history: updatedHistory as any
      },
      create: {
        unitId,
        aspectCode,
        slotKey,
        title,
        fileUrl: latestAttachment.fileUrl,
        fileName: latestAttachment.fileName,
        fileSize: latestAttachment.fileSize,
        fileType: latestAttachment.fileType,
        storageProvider: latestAttachment.storageProvider,
        uploaderName,
        lastSourceYear: sourceYear,
        attachments: newAttachments as any,
        history: updatedHistory as any
      }
    })

    // Sinkronkan juga ke evaluasi tahun aktif yang sedang berjalan (jika ada)
    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(
      unitId,
      aspectCode,
      slotKey
    )

    return NextResponse.json({
      success: true,
      masterRecord,
      uploadedCount: files.length,
      totalAttachments: newAttachments.length
    })
  } catch (err: any) {
    console.error('Error in master evidence upload route:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
