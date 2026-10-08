// src/actions/evidence-slot-actions.ts
// Server Actions untuk Pengelolaan Slot Bukti Dukung Terarah & Jejak Aktivitas

'use server'

import { db } from '../services/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import {
  getEvidenceSlotsByAspect,
  normalizeAspectCode,
  extractAttachments,
  EvidenceAttachmentItem,
  FileVersionItem
} from '../core/domain/evidence-slots-preset'
import { StorageService } from '../services/storage-service'
import {
  getDynamicAspectEvidenceGuides,
  saveDynamicAspectSlotExample,
  deleteDynamicAspectSlotExample
} from '../services/system-setting-service'
import { createNotificationHelper } from './notification-actions'

export type { EvidenceAttachmentItem, FileVersionItem }

export interface EvidenceActivityItem {
  id: string
  timestamp: string
  action: 'UPLOAD' | 'REPLACE' | 'UPDATE_LINK' | 'DELETE'
  actorName?: string
  fileName?: string
  fileUrl?: string
  previousUrl?: string | null
  note?: string
}

export interface EvidenceSlotItem {
  slotKey: string
  title: string
  description?: string
  isMandatory: boolean
  orderIndex: number
  documentType?: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT' | 'HYBRID'
  exampleImages?: string[]
  submissionId?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  storageProvider?: string
  uploaderName?: string
  attachments?: EvidenceAttachmentItem[]
  history?: EvidenceActivityItem[]
  isInherited?: boolean
  aiStatus?: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  aiInsights?: any
  updatedAt?: Date
}

 /**
 * Mengambil seluruh slot bukti (Wajib Preset + Tambahan Kustom) beserta submisi file & jejak aktivitas
 */
export async function getIndicatorEvidenceAction(evaluationId: string, aspectCode: string) {
  try {
    const norm = normalizeAspectCode(aspectCode)
    const presets = getEvidenceSlotsByAspect(aspectCode)
    
    // Ambil seluruh submisi berkas untuk evaluationId dan aspectCode ini serta panduan dinamis
    const [submissions, dynamicGuides] = await Promise.all([
      db.indicatorEvidenceSubmission.findMany({
        where: {
          evaluationId,
          aspectCode: { in: [aspectCode, norm] }
        },
        orderBy: { createdAt: 'asc' }
      }),
      getDynamicAspectEvidenceGuides()
    ])

    const submissionMap = new Map<string, typeof submissions[0]>()
    submissions.forEach((sub) => {
      submissionMap.set(sub.slotKey, sub)
    })

    // 1. Map mandatory & standard preset slots
    const resultSlots: EvidenceSlotItem[] = presets.map((p) => {
      const sub = submissionMap.get(p.slotKey)
      const historyData = Array.isArray(sub?.history) ? (sub!.history as unknown as EvidenceActivityItem[]) : []
      const dynamicGuide = dynamicGuides[`${p.aspectCode}_${p.slotKey}`] || dynamicGuides[`${norm}_${p.slotKey}`]
      const dynamicImages = dynamicGuide && Array.isArray(dynamicGuide.exampleImages)
        ? dynamicGuide.exampleImages
        : p.exampleImages
      const attachments = extractAttachments(sub)

      return {
        slotKey: p.slotKey,
        title: p.title,
        description: p.description,
        isMandatory: p.isMandatory,
        orderIndex: p.orderIndex,
        documentType: p.documentType,
        exampleImages: dynamicImages,
        submissionId: sub?.id,
        fileUrl: sub?.fileUrl,
        fileName: sub?.fileName || undefined,
        fileSize: sub?.fileSize || undefined,
        fileType: sub?.fileType || undefined,
        storageProvider: sub?.storageProvider,
        uploaderName: sub?.uploaderName || undefined,
        attachments,
        history: historyData,
        isInherited: sub?.isInherited,
        aiStatus: sub?.aiStatus as any,
        aiInsights: sub?.aiInsights,
        updatedAt: sub?.updatedAt
      }
    })

    // 2. Map additional custom slots that were created by OPD
    submissions.forEach((sub) => {
      if (!presets.some((p) => p.slotKey === sub.slotKey)) {
        const historyData = Array.isArray(sub.history) ? (sub.history as unknown as EvidenceActivityItem[]) : []
        const attachments = extractAttachments(sub)

        resultSlots.push({
          slotKey: sub.slotKey,
          title: sub.title,
          description: 'Dokumen pendukung tambahan yang diunggah oleh OPD.',
          isMandatory: false,
          orderIndex: 99,
          documentType: (sub.fileType as any) || 'DOCUMENT',
          submissionId: sub.id,
          fileUrl: sub.fileUrl,
          fileName: sub.fileName || undefined,
          fileSize: sub.fileSize || undefined,
          fileType: sub.fileType || undefined,
          storageProvider: sub.storageProvider,
          uploaderName: sub.uploaderName || undefined,
          attachments,
          history: historyData,
          isInherited: sub.isInherited,
          aiStatus: sub.aiStatus as any,
          aiInsights: sub.aiInsights,
          updatedAt: sub.updatedAt
        })
      }
    })

    return { success: true, slots: resultSlots }
  } catch (error) {
    console.error('Error fetching indicator evidence:', error)
    return { success: false, error: 'Gagal mengambil data bukti dukung.', slots: [] }
  }
}


/**
 * Menyimpan / memperbarui isi file URL pada slot tertentu
 */
export async function saveIndicatorEvidenceSlotAction(params: {
  evaluationId: string
  aspectCode: string
  slotKey: string
  title: string
  fileUrl: string
  uploaderName?: string
  note?: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, slotKey, title, fileUrl, uploaderName, note, path } = params
    const norm = normalizeAspectCode(aspectCode)
    const cleankedUrl = fileUrl.trim()

    if (!cleankedUrl) {
      return { success: false, error: 'Tautan file bukti dukung tidak boleh kosong.' }
    }

    // Guard hak akses jendela waktu unggah bukti dukung untuk OPD
    const { getCurrentUserAction } = await import('./auth-actions')
    const user = await getCurrentUserAction()
    if (user && user.role === 'OPD') {
      const evalData = await db.evaluation.findUnique({
        where: { id: evaluationId },
        select: { year: true }
      })
      if (evalData) {
        const { getPeriodTimeline } = await import('../services/period-window-service')
        const timeline = await getPeriodTimeline(evalData.year)
        if (!timeline.effectivePermissions.canUploadEvidence) {
          return {
            success: false,
            error: `Unggah atau pembaruan bukti dukung Tahun ${evalData.year} saat ini ditutup sesuai jadwal tahapan penilaian.`
          }
        }
      }
    }

    // Ambil record lama untuk audit trail
    const existing = await db.indicatorEvidenceSubmission.findFirst({
      where: {
        evaluationId,
        aspectCode: { in: [aspectCode, norm] },
        slotKey
      }
    })

    const existingHistory = Array.isArray(existing?.history) ? (existing!.history as unknown as EvidenceActivityItem[]) : []
    const newActivity: EvidenceActivityItem = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: existing ? 'UPDATE_LINK' : 'UPLOAD',
      actorName: uploaderName || 'Admin OPD',
      fileName: existing?.fileName || title,
      fileUrl: cleankedUrl,
      previousUrl: existing?.fileUrl || null,
      note: note || (existing ? 'Memperbarui tautan dokumen.' : 'Menyematkan tautan dokumen.')
    }

    const submission = await db.indicatorEvidenceSubmission.upsert({
      where: {
        evaluationId_aspectCode_slotKey: {
          evaluationId,
          aspectCode: existing?.aspectCode || norm,
          slotKey
        }
      },
      update: {
        fileUrl: cleankedUrl,
        title,
        uploaderName: uploaderName || undefined,
        history: [...existingHistory, newActivity] as any,
        isInherited: false
      },
      create: {
        evaluationId,
        aspectCode: norm,
        slotKey,
        title,
        fileUrl: cleankedUrl,
        storageProvider: 'EXTERNAL_LINK',
        uploaderName,
        history: [newActivity] as any,
        isInherited: false
      }
    })

    // SOKET AI PRE-EVALUATOR: Pemicu Otomatis Saat Tautan Berkas Disimpan
    try {
      const { AiEvaluatorService } = await import('../services/ai-evaluator-service')
      await AiEvaluatorService.runPreEvaluation(evaluationId, norm)
    } catch (aiErr) {
      console.warn('AI Pre-Evaluation trigger error (non-fatal):', aiErr)
    }

    // Notifikasi Spesifik Bukti Dukung ke Super Admin / Evaluator
    try {
      const evalData = await db.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          unit: true,
          scores: { select: { score: true, notes: true } }
        }
      })
      if (evalData) {
        const isPostEvaluation = evalData.scores.some(
          (s) => s.score !== null || (s.notes && s.notes.trim() !== '')
        )
        const unitName = evalData.unit.name
        const targetHash = `#bukti-${norm}`

        await createNotificationHelper({
          roleTarget: 'SUPER_ADMIN',
          unitId: evalData.unitId,
          title: isPostEvaluation
            ? `[Revisi Pasca Penilaian] Bukti Aspek ${norm}: ${unitName}`
            : `Pembaruan Bukti Aspek ${norm}: ${unitName}`,
          message: isPostEvaluation
            ? `OPD memperbarui dokumen bukti dukung "${title}" pada Aspek ${norm} untuk unit yang telah dinilai. Evaluator dimohon meninjau ulang.`
            : `OPD telah mengunggah/memperbarui bukti dukung "${title}" pada Aspek ${norm}.`,
          type: isPostEvaluation ? 'F01_REVISION' : 'PROOF_TRIGGER',
          link: `/evaluasi/${evalData.unitId}?mode=evidence&aspek=${norm}&targetSlot=${encodeURIComponent(slotKey)}`
        })
      }
    } catch (notifErr) {
      console.error('Failed to trigger evidence notification:', notifErr)
    }

    if (path) revalidatePath(path)

    return { success: true, submission }
  } catch (error) {
    console.error('Error saving indicator evidence slot:', error)
    return { success: false, error: 'Gagal menyimpan bukti dukung.' }
  }
}


/**
 * Menambah slot bukti fleksibel / tambahan baru yang diunggah OPD
 */
export async function addCustomAdditionalEvidenceSlotAction(params: {
  evaluationId: string
  aspectCode: string
  title: string
  fileUrl: string
  fileName?: string
  storageProvider?: string
  uploaderName?: string
  note?: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, title, fileUrl, uploaderName, fileName, storageProvider, note, path } = params

    const cleanTitle = title.trim()
    const cleanUrl = fileUrl.trim()

    if (!cleanTitle || !cleanUrl) {
      return { success: false, error: 'Judul dokumen dan tautan/file wajib diisi.' }
    }

    const norm = normalizeAspectCode(aspectCode)
    const slotKey = `additional_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const activity: EvidenceActivityItem = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPLOAD',
      actorName: uploaderName || 'Admin OPD',
      fileName: fileName || cleanTitle,
      fileUrl: cleanUrl,
      previousUrl: null,
      note: note || `Menambah dokumen pendukung tambahan: ${cleanTitle}`
    }

    const submission = await db.indicatorEvidenceSubmission.create({
      data: {
        evaluationId,
        aspectCode: norm,
        slotKey,
        title: cleanTitle,
        fileUrl: cleanUrl,
        fileName: fileName || cleanTitle,
        storageProvider: storageProvider || 'EXTERNAL_LINK',
        uploaderName,
        history: [activity] as any,
        isInherited: false
      }
    })

    // SOKET AI PRE-EVALUATOR: Pemicu Otomatis Saat Dokumen Tambahan Dibuat
    try {
      const { AiEvaluatorService } = await import('../services/ai-evaluator-service')
      await AiEvaluatorService.runPreEvaluation(evaluationId, norm)
    } catch (aiErr) {
      console.warn('AI Pre-Evaluation trigger error (non-fatal):', aiErr)
    }

    // Notifikasi Dokumen Tambahan ke Super Admin / Evaluator
    try {
      const evalData = await db.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          unit: true,
          scores: { select: { score: true, notes: true } }
        }
      })
      if (evalData) {
        const isPostEvaluation = evalData.scores.some(
          (s) => s.score !== null || (s.notes && s.notes.trim() !== '')
        )
        const unitName = evalData.unit.name
        const targetHash = `#bukti-${norm}`

        await createNotificationHelper({
          roleTarget: 'SUPER_ADMIN',
          unitId: evalData.unitId,
          title: isPostEvaluation
            ? `[Revisi Pasca Penilaian] Dokumen Tambahan Aspek ${norm}: ${unitName}`
            : `Dokumen Tambahan Aspek ${norm}: ${unitName}`,
          message: isPostEvaluation
            ? `OPD menambahkan dokumen bukti baru "${cleanTitle}" pada Aspek ${norm} untuk unit yang telah dinilai. Evaluator dimohon meninjau.`
            : `OPD menambahkan dokumen bukti pendukung "${cleanTitle}" pada Aspek ${norm}.`,
          type: isPostEvaluation ? 'F01_REVISION' : 'PROOF_TRIGGER',
          link: `/evaluasi/${evalData.unitId}?mode=evidence&aspek=${norm}&targetSlot=${encodeURIComponent(slotKey)}`
        })
      }
    } catch (notifErr) {
      console.error('Failed to trigger custom evidence notification:', notifErr)
    }

    if (path) revalidatePath(path)

    return { success: true, submission }
  } catch (error) {
    console.error('Error adding custom evidence slot:', error)
    return { success: false, error: 'Gagal menambah dokumen bukti tambahan.' }
  }
}


/**
 * Menghapus satu lampiran spesifik dari sebuah slot bukti dukung
 */
export async function deleteEvidenceAttachmentAction(params: {
  evaluationId: string
  aspectCode: string
  slotKey: string
  attachmentId: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, slotKey, attachmentId, path } = params
    const norm = normalizeAspectCode(aspectCode)

    const sub = await db.indicatorEvidenceSubmission.findFirst({
      where: {
        evaluationId,
        aspectCode: { in: [aspectCode, norm] },
        slotKey
      }
    })

    if (!sub) {
      return { success: false, error: 'Submisi bukti tidak ditemukan.' }
    }

    const attachments = extractAttachments(sub)
    const target = attachments.find((a) => a.id === attachmentId)

    if (!target) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan.' }
    }

    // 1. Hapus berkas fisik aktif dari storage
    try {
      await StorageService.deleteFile(target.fileUrl)
    } catch (e) {
      console.warn('Gagal menghapus berkas fisik:', target.fileUrl, e)
    }

    // 1b. Hapus seluruh berkas fisik dari versi-versi lampau berkas ini
    if (target.versions && target.versions.length > 0) {
      for (const ver of target.versions) {
        if (ver.fileUrl) {
          try {
            await StorageService.deleteFile(ver.fileUrl)
          } catch (verErr) {
            console.warn('Gagal menghapus berkas versi fisik:', ver.fileUrl, verErr)
          }
        }
      }
    }

    // 2. Filter lampiran tersisa
    const remaining = attachments.filter((a) => a.id !== attachmentId)
    const historyList = (Array.isArray(sub.history) ? [...sub.history] : []) as any[]
    historyList.push({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE',
      actorName: 'Admin OPD',
      fileName: target.fileName,
      fileUrl: null, // Berkas fisik sudah di-unlink/dihapus, jadi tidak ada link mati
      previousUrl: null,
      note: `Menghapus lampiran berkas: ${target.fileName}`
    })

    if (remaining.length === 0) {
      // Jika seluruh lampiran terhapus, kosongkan berkas aktif tapi PERTAHANKAN history riwayat
      await db.indicatorEvidenceSubmission.update({
        where: { id: sub.id },
        data: {
          fileUrl: '',
          fileName: null,
          fileSize: null,
          fileType: null,
          attachments: [] as any,
          history: historyList as any
        }
      })

      await db.evaluationScore.updateMany({
        where: {
          evaluationId: sub.evaluationId,
          proofUrl: target.fileUrl
        },
        data: { proofUrl: null }
      })
    } else {
      const latest = remaining[remaining.length - 1]
      await db.indicatorEvidenceSubmission.update({
        where: { id: sub.id },
        data: {
          fileUrl: latest.fileUrl,
          fileName: latest.fileName,
          fileSize: latest.fileSize,
          fileType: latest.fileType,
          storageProvider: latest.storageProvider,
          attachments: remaining as any,
          history: historyList as any
        }
      })
    }

    if (path) revalidatePath(path)
    return { success: true, remainingCount: remaining.length }
  } catch (error: any) {
    console.error('Error deleting evidence attachment:', error)
    return { success: false, error: error.message || 'Gagal menghapus lampiran berkas.' }
  }
}

/**
 * Menghapus submisi bukti dukung, berkas fisik dari storage, riwayat, dan unlink dari instrumen (Deep Purge)
 */
export async function deleteIndicatorEvidenceSlotAction(params: {
  submissionId?: string
  evaluationId: string
  slotKey?: string
  aspectCode?: string
  path?: string
}) {
  try {
    const { submissionId, evaluationId, slotKey, aspectCode, path } = params

    // 1. Cari submisi berdasarkan submissionId atau (evaluationId + aspectCode + slotKey)
    let sub = submissionId
      ? await db.indicatorEvidenceSubmission.findUnique({ where: { id: submissionId } })
      : null

    if (!sub && evaluationId && slotKey && aspectCode) {
      const norm = normalizeAspectCode(aspectCode)
      sub = await db.indicatorEvidenceSubmission.findFirst({
        where: {
          evaluationId,
          aspectCode: { in: [aspectCode, norm] },
          slotKey
        }
      })
    }

    if (!sub || !sub.fileUrl) {
      return { success: true, message: 'Berkas sudah kosong atau tidak ditemukan.' }
    }

    // 2. Hapus SEMUA berkas fisik lampiran dari Cloudflare R2 atau Local Disk
    const allAttachments = extractAttachments(sub)
    for (const att of allAttachments) {
      if (att.fileUrl) {
        try {
          await StorageService.deleteFile(att.fileUrl)
        } catch (storageErr) {
          console.warn('Gagal menghapus berkas fisik:', att.fileUrl, storageErr)
        }
      }
    }

    if (sub.fileUrl && !allAttachments.some((a) => a.fileUrl === sub.fileUrl)) {
      try {
        await StorageService.deleteFile(sub.fileUrl)
      } catch {}
    }

    // 3. Hapus data submisi
    await db.indicatorEvidenceSubmission.delete({
      where: { id: sub.id }
    })

    // Unlink dari butir pertanyaan instrumen
    await db.evaluationScore.updateMany({
      where: {
        evaluationId: sub.evaluationId,
        proofUrl: sub.fileUrl
      },
      data: {
        proofUrl: null
      }
    })

    if (path) revalidatePath(path)

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting indicator evidence slot:', error)
    return { success: false, error: error.message || 'Gagal menghapus berkas bukti dukung.' }
  }
}

/**
 * Menghapus satu item versi tertentu di dalam riwayat berkas
 */
export async function deleteHistoryItemAction(params: {
  submissionId: string
  activityId: string
  path?: string
}) {
  try {
    const { submissionId, activityId, path } = params
    const sub = await db.indicatorEvidenceSubmission.findUnique({
      where: { id: submissionId }
    })

    if (!sub) {
      return { success: false, error: 'Data berkas tidak ditemukan.' }
    }

    const historyList = (Array.isArray(sub.history) ? [...sub.history] : []) as any[]
    const targetItem = historyList.find((h) => h.id === activityId)

    if (!targetItem) {
      return { success: false, error: 'Riwayat versi berkas tidak ditemukan.' }
    }

    // Jika yang dihapus di riwayat adalah berkas aktif saat ini, jalankan single delete slot
    if (targetItem.fileUrl === sub.fileUrl) {
      return deleteIndicatorEvidenceSlotAction({
        submissionId: sub.id,
        evaluationId: sub.evaluationId,
        path
      })
    }

    // Jika yang dihapus adalah berkas riwayat lama
    if (targetItem.fileUrl) {
      try {
        await StorageService.deleteFile(targetItem.fileUrl)
      } catch (storageErr) {
        console.warn('Gagal menghapus berkas fisik riwayat:', targetItem.fileUrl, storageErr)
      }
    }

    const updatedHistory = historyList.filter((h) => h.id !== activityId)

    await db.indicatorEvidenceSubmission.update({
      where: { id: sub.id },
      data: {
        history: updatedHistory as any
      }
    })

    if (path) revalidatePath(path)
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting history item:', error)
    return { success: false, error: error.message || 'Gagal menghapus versi riwayat berkas.' }
  }
}

/**
 * Mengunggah versi baru untuk berkas lampiran spesifik (True Versioning ala Google Drive)
 */
export async function uploadNewAttachmentVersionAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    const evaluationId = formData.get('evaluationId') as string
    const aspectCode = formData.get('aspectCode') as string
    const slotKey = formData.get('slotKey') as string
    const attachmentId = formData.get('attachmentId') as string
    const unitId = (formData.get('unitId') as string) || 'unit_shared'
    const uploaderName = (formData.get('uploaderName') as string) || 'Admin OPD'
    const path = formData.get('path') as string | null

    if (!file || !evaluationId || !aspectCode || !slotKey || !attachmentId) {
      return { success: false, error: 'Data tidak lengkap untuk memperbarui versi berkas.' }
    }

    const norm = normalizeAspectCode(aspectCode)
    const sub = await db.indicatorEvidenceSubmission.findFirst({
      where: {
        evaluationId,
        aspectCode: { in: [aspectCode, norm] },
        slotKey
      }
    })

    if (!sub) {
      return { success: false, error: 'Submisi berkas tidak ditemukan.' }
    }

    const attachments = extractAttachments(sub)
    const targetIdx = attachments.findIndex((a) => a.id === attachmentId)
    if (targetIdx === -1) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan di slot ini.' }
    }

    const targetAtt = attachments[targetIdx]

    // Unggah berkas baru ke storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadResult = await StorageService.uploadFile({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      unitId,
      aspectCode: norm,
      slotKey
    })

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || 'Gagal menyimpan berkas versi baru.' }
    }

    // Arsipkan versi lama ke versions array milik berkas ini
    const currentVersionNum = targetAtt.version || 1
    const previousVersions = targetAtt.versions || []

    const archivedVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: currentVersionNum,
      fileName: targetAtt.fileName,
      fileUrl: targetAtt.fileUrl,
      fileSize: targetAtt.fileSize,
      fileType: targetAtt.fileType,
      uploadedAt: targetAtt.uploadedAt,
      uploaderName: uploaderName
    }

    const nextVersionNum = currentVersionNum + 1

    // Update target attachment dengan versi baru
    attachments[targetIdx] = {
      ...targetAtt,
      fileUrl: uploadResult.fileUrl,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
      storageProvider: uploadResult.provider,
      uploadedAt: new Date().toISOString(),
      version: nextVersionNum,
      versions: [archivedVersion, ...previousVersions]
    }

    // Catat log aktivitas slot
    const historyList = (Array.isArray(sub.history) ? [...sub.history] : []) as any[]
    historyList.push({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REPLACE',
      actorName: uploaderName,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      previousUrl: targetAtt.fileUrl,
      note: `Memperbarui versi ${nextVersionNum} untuk berkas: ${uploadResult.fileName} (menggantikan ${targetAtt.fileName})`
    })

    // Update database
    await db.indicatorEvidenceSubmission.update({
      where: { id: sub.id },
      data: {
        fileUrl: attachments[attachments.length - 1].fileUrl,
        fileName: attachments[attachments.length - 1].fileName,
        attachments: attachments as any,
        history: historyList as any
      }
    })

    // SOKET AI PRE-EVALUATOR trigger
    try {
      const { AiEvaluatorService } = await import('../services/ai-evaluator-service')
      await AiEvaluatorService.runPreEvaluation(evaluationId, norm)
    } catch {}

    if (path) revalidatePath(path)
    return { success: true, newVersion: nextVersionNum }
  } catch (error: any) {
    console.error('Error uploading new version:', error)
    return { success: false, error: error.message || 'Gagal mengunggah versi baru.' }
  }
}

/**
 * Memulihkan (restore) versi terdahulu menjadi versi aktif utama berkas
 */
export async function restoreAttachmentVersionAction(params: {
  evaluationId: string
  aspectCode: string
  slotKey: string
  attachmentId: string
  targetVersionId: string
  uploaderName?: string
  path?: string
}) {
  try {
    const { evaluationId, aspectCode, slotKey, attachmentId, targetVersionId, uploaderName, path } = params
    const norm = normalizeAspectCode(aspectCode)

    const sub = await db.indicatorEvidenceSubmission.findFirst({
      where: {
        evaluationId,
        aspectCode: { in: [aspectCode, norm] },
        slotKey
      }
    })

    if (!sub) {
      return { success: false, error: 'Submisi berkas tidak ditemukan.' }
    }

    const attachments = extractAttachments(sub)
    const targetIdx = attachments.findIndex((a) => a.id === attachmentId)
    if (targetIdx === -1) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan.' }
    }

    const targetAtt = attachments[targetIdx]
    const versions = targetAtt.versions || []
    const selectedVerIdx = versions.findIndex((v) => v.id === targetVersionId)

    if (selectedVerIdx === -1) {
      return { success: false, error: 'Versi yang ingin dipulihkan tidak ditemukan.' }
    }

    const selectedVer = versions[selectedVerIdx]
    const currentActiveVersion = targetAtt.version || 1

    // Tukar posisi: versi yang saat ini aktif dimasukkan ke daftar versions
    const archivedCurrent = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: currentActiveVersion,
      fileName: targetAtt.fileName,
      fileUrl: targetAtt.fileUrl,
      fileSize: targetAtt.fileSize,
      fileType: targetAtt.fileType,
      uploadedAt: targetAtt.uploadedAt,
      uploaderName: uploaderName || 'Admin OPD',
      note: 'Diarsipkan saat memulihkan versi terdahulu'
    }

    // Hapus versi yang dipulihkan dari list versions dan tambahkan versi lama yang tadinya aktif
    const remainingVersions = versions.filter((_, idx) => idx !== selectedVerIdx)
    remainingVersions.unshift(archivedCurrent)

    // Pasang versi yang dipulihkan sebagai versi aktif
    attachments[targetIdx] = {
      ...targetAtt,
      fileUrl: selectedVer.fileUrl,
      fileName: selectedVer.fileName,
      fileSize: selectedVer.fileSize,
      fileType: selectedVer.fileType,
      uploadedAt: new Date().toISOString(),
      version: selectedVer.version,
      versions: remainingVersions
    }

    const historyList = (Array.isArray(sub.history) ? [...sub.history] : []) as any[]
    historyList.push({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REPLACE',
      actorName: uploaderName || 'Admin OPD',
      fileName: selectedVer.fileName,
      fileUrl: selectedVer.fileUrl,
      previousUrl: targetAtt.fileUrl,
      note: `Memulihkan berkas ke Versi ${selectedVer.version}: ${selectedVer.fileName}`
    })

    await db.indicatorEvidenceSubmission.update({
      where: { id: sub.id },
      data: {
        fileUrl: attachments[attachments.length - 1].fileUrl,
        fileName: attachments[attachments.length - 1].fileName,
        attachments: attachments as any,
        history: historyList as any
      }
    })

    if (path) revalidatePath(path)
    return { success: true, restoredVersion: selectedVer.version }
  } catch (error: any) {
    console.error('Error restoring attachment version:', error)
    return { success: false, error: error.message || 'Gagal memulihkan versi berkas.' }
  }
}

/**
 * Unggah berkas contoh format/panduan bukti dukung oleh Admin/Evaluator
 */
export async function uploadAspectSlotExampleAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    const aspectCode = formData.get('aspectCode') as string
    const slotKey = formData.get('slotKey') as string
    const path = formData.get('path') as string | null

    if (!file || !aspectCode || !slotKey) {
      return { success: false, error: 'Berkas, aspectCode, dan slotKey wajib disertakan.' }
    }

    const norm = normalizeAspectCode(aspectCode)
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let mimeType = file.type

    // Optimasi & Kompresi PDF secara cerdas sebelum disimpan
    if (file.name.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
      try {
        const { PDFDocument } = await import('pdf-lib')
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
        // Bersihkan metadata berlebih dan simpan dengan stream kompresi maksimal
        srcDoc.setTitle('')
        srcDoc.setAuthor('')
        srcDoc.setProducer('PEKPPP Evidence Optimizer')
        srcDoc.setCreator('PEKPPP')
        const compressedBytes = await srcDoc.save({ useObjectStreams: true, addDefaultPage: false })
        if (compressedBytes.length < buffer.length) {
          buffer = Buffer.from(compressedBytes)
        }
      } catch (pdfErr) {
        console.warn('PDF compression skipped or failed, using original buffer:', pdfErr)
      }
    }

    const uploadResult = await StorageService.uploadFile({
      buffer,
      fileName: file.name,
      mimeType,
      unitId: 'admin_guidance_examples',
      aspectCode: norm,
      slotKey
    })

    if (!uploadResult.success || !uploadResult.fileUrl) {
      return { success: false, error: uploadResult.error || 'Gagal mengunggah berkas contoh.' }
    }

    const saved = await saveDynamicAspectSlotExample(norm, slotKey, uploadResult.fileUrl)
    if (!saved) {
      return { success: false, error: 'Gagal menyimpan contoh panduan ke konfigurasi sistem.' }
    }

    if (path) revalidatePath(path)
    return { success: true, fileUrl: uploadResult.fileUrl, fileName: uploadResult.fileName }
  } catch (error: any) {
    console.error('Error uploading aspect slot example:', error)
    return { success: false, error: error.message || 'Gagal mengunggah berkas contoh.' }
  }
}

/**
 * Hapus berkas contoh format/panduan bukti dukung oleh Admin/Evaluator
 */
export async function deleteAspectSlotExampleAction(params: {
  aspectCode: string
  slotKey: string
  exampleImageUrl: string
  path?: string
}) {
  try {
    const { aspectCode, slotKey, exampleImageUrl, path } = params
    const norm = normalizeAspectCode(aspectCode)

    try {
      await StorageService.deleteFile(exampleImageUrl)
    } catch (storageErr) {
      console.warn('Gagal menghapus berkas fisik contoh:', exampleImageUrl, storageErr)
    }

    await deleteDynamicAspectSlotExample(norm, slotKey, exampleImageUrl)

    if (path) revalidatePath(path)
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting aspect slot example:', error)
    return { success: false, error: error.message || 'Gagal menghapus berkas contoh.' }
  }
}

/**
 * Mengambil seluruh slot bukti untuk 6 Aspek beserta panduan/contoh dinamis untuk dashboard admin
 */
export async function getAllAspectEvidenceSlotsWithGuidesAction() {
  try {
    const { PEKPPP_EVIDENCE_SLOTS } = await import('../core/domain/evidence-slots-preset')
    const dynamicGuides = await getDynamicAspectEvidenceGuides()

    const slots = PEKPPP_EVIDENCE_SLOTS.map((p) => {
      const dynamicGuide = dynamicGuides[`${p.aspectCode}_${p.slotKey}`]
      // Jika dynamicGuide ada dan mendefinisikan exampleImages (meskipun array kosong karena dihapus), gunakan itu
      const dynamicImages = dynamicGuide && Array.isArray(dynamicGuide.exampleImages)
        ? dynamicGuide.exampleImages
        : (p.exampleImages || [])

      return {
        ...p,
        exampleImages: dynamicImages,
        hasCustomExample: Boolean(dynamicGuide?.exampleImages && dynamicGuide.exampleImages.length > 0)
      }
    })

    return { success: true, slots }
  } catch (error: any) {
    console.error('Error fetching all slots with guides:', error)
    return { success: false, error: error.message, slots: [] }
  }
}

export interface AspectOverviewItem {
  aspectCode: string
  aspectName: string
  totalRequired: number
  uploadedCount: number
  percentage: number
  isComplete: boolean
  hasAiAnalysis: boolean
}

/**
 * Mengambil ringkasan progres kelengkapan bukti dukung 6 Aspek untuk Bento Grid Index
 */
export async function getAspectEvidenceOverviewAction(evaluationId: string) {
  try {
    const { getEvidenceSlotsByAspect } = await import('../core/domain/evidence-slots-preset')

    const submissions = await db.indicatorEvidenceSubmission.findMany({
      where: { evaluationId },
      select: {
        aspectCode: true,
        slotKey: true,
        fileUrl: true,
        aiStatus: true
      }
    })

    const aspectDefs = [
      { code: 'I', name: 'Kebijakan Pelayanan' },
      { code: 'II', name: 'Profesionalisme SDM' },
      { code: 'III', name: 'Sarana Prasarana' },
      { code: 'IV', name: 'Sistem Informasi Pelayanan Publik' },
      { code: 'V', name: 'Konsultasi & Pengaduan' },
      { code: 'VI', name: 'Inovasi Pelayanan Publik' },
      { code: 'TAMBAHAN', name: 'Informasi / Pertanyaan Tambahan' }
    ]

    const overview: AspectOverviewItem[] = aspectDefs.map((asp) => {
      const presets = getEvidenceSlotsByAspect(asp.code)
      const mandatorySlots = presets.filter((p) => p.isMandatory)
      const totalRequired = mandatorySlots.length || presets.length

      const aspectSubs = submissions.filter(
        (s) => s.aspectCode === asp.code || normalizeAspectCode(s.aspectCode) === asp.code
      )
      const uploadedValidSlots = aspectSubs.filter((s) => s.fileUrl && s.fileUrl.trim().length > 0)

      const uploadedCount = uploadedValidSlots.length
      const percentage = Math.min(100, Math.round((uploadedCount / Math.max(totalRequired, 1)) * 100))
      const isComplete = uploadedCount >= totalRequired
      const hasAi = aspectSubs.some((s) => s.aiStatus && s.aiStatus !== 'IDLE')

      return {
        aspectCode: asp.code,
        aspectName: asp.name,
        totalRequired,
        uploadedCount,
        percentage,
        isComplete,
        hasAiAnalysis: hasAi
      }
    })

    const totalUploadedAll = overview.reduce((acc, curr) => acc + curr.uploadedCount, 0)
    const totalRequiredAll = overview.reduce((acc, curr) => acc + curr.totalRequired, 0)
    const totalPercentageAll = Math.min(
      100,
      Math.round((totalUploadedAll / Math.max(totalRequiredAll, 1)) * 100)
    )

    return {
      success: true,
      overview,
      totalUploadedAll,
      totalRequiredAll,
      totalPercentageAll
    }
  } catch (error: any) {
    console.error('Error fetching aspect evidence overview:', error)
    return {
      success: false,
      error: error.message,
      overview: [],
      totalUploadedAll: 0,
      totalRequiredAll: 0,
      totalPercentageAll: 0
    }
  }
}