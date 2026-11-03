// src/actions/master-evidence-actions.ts
// Server Actions untuk Pengelolaan Langsung Master Bukti Dukung (Living Document)

'use server'

import { db } from '../services/db'
import { revalidatePath } from 'next/cache'
import { StorageService } from '../services/storage-service'
import { EvidenceMasterService } from '../services/evidence-master-service'
import { getRuleForSlot } from '../services/system-setting-service'
import {
  normalizeAspectCode,
  extractAttachments,
  EvidenceAttachmentItem
} from '../core/domain/evidence-slots-preset'

/**
 * Mengambil seluruh record Master Bukti Dukung aktif untuk satu Unit
 */
export async function getUnitMasterEvidenceAction(unitId: string) {
  try {
    if (!unitId) return { success: false, records: [] }

    await EvidenceMasterService.bootstrapUnitMasterFromExisting(unitId)

    const masterRecords = await db.unitEvidenceMaster.findMany({
      where: {
        unitId,
        NOT: { fileUrl: '' }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const serialized = masterRecords.map((m) => ({
      id: m.id,
      unitId: m.unitId,
      aspectCode: normalizeAspectCode(m.aspectCode),
      slotKey: m.slotKey,
      title: m.title,
      fileUrl: m.fileUrl,
      storageProvider: m.storageProvider,
      fileType: m.fileType,
      fileSize: m.fileSize,
      fileName: m.fileName,
      uploaderName: m.uploaderName,
      lastSourceYear: m.lastSourceYear,
      attachments: extractAttachments(m),
      history: Array.isArray(m.history) ? (m.history as any[]) : [],
      updatedAt: m.updatedAt.toISOString()
    }))

    return { success: true, records: serialized }
  } catch (error: any) {
    console.error('Error fetching unit master evidence:', error)
    return { success: false, error: error.message, records: [] }
  }
}

/**
 * Menyimpan / menyematkan tautan eksternal langsung pada slot Master Bukti Dukung
 */
export async function saveMasterEvidenceLinkAction(params: {
  unitId: string
  aspectCode: string
  slotKey: string
  title: string
  fileUrl: string
  fileName?: string
  uploaderName?: string
  note?: string
}) {
  try {
    const { unitId, aspectCode, slotKey, title, fileUrl, fileName, uploaderName, note } = params
    const norm = normalizeAspectCode(aspectCode)
    const cleanUrl = fileUrl.trim()

    if (!unitId || !cleanUrl) {
      return { success: false, error: 'Tautan bukti dukung tidak boleh kosong.' }
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
          aspectCode: norm,
          slotKey
        }
      }
    })

    const existingAttachments = extractAttachments(existing)
    const newAttachment: EvidenceAttachmentItem = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      fileUrl: cleanUrl,
      fileName: fileName?.trim() || title,
      fileSize: 0,
      fileType: 'LINK',
      storageProvider: 'EXTERNAL_LINK',
      uploadedAt: new Date().toISOString(),
      uploaderName: uploaderName || 'Admin OPD',
      version: 1,
      versions: []
    }

    const nextAttachments = [...existingAttachments, newAttachment]
    const existingHistory = Array.isArray(existing?.history) ? (existing!.history as any[]) : []
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: existing ? 'UPDATE_LINK' : 'UPLOAD',
      actorName: uploaderName || 'Admin OPD',
      fileName: newAttachment.fileName,
      fileUrl: cleanUrl,
      previousUrl: existing?.fileUrl || null,
      note: note || `Menyematkan tautan dokumen di Master: ${newAttachment.fileName}`
    }

    await db.unitEvidenceMaster.upsert({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      },
      update: {
        title: existing?.title || title,
        fileUrl: cleanUrl,
        fileName: newAttachment.fileName,
        fileType: 'LINK',
        storageProvider: 'EXTERNAL_LINK',
        uploaderName: uploaderName || 'Admin OPD',
        lastSourceYear: sourceYear,
        attachments: nextAttachments as any,
        history: [newActivity, ...existingHistory] as any
      },
      create: {
        unitId,
        aspectCode: norm,
        slotKey,
        title,
        fileUrl: cleanUrl,
        fileName: newAttachment.fileName,
        fileType: 'LINK',
        storageProvider: 'EXTERNAL_LINK',
        uploaderName: uploaderName || 'Admin OPD',
        lastSourceYear: sourceYear,
        attachments: nextAttachments as any,
        history: [newActivity] as any
      }
    })

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true }
  } catch (error: any) {
    console.error('Error saving master evidence link:', error)
    return { success: false, error: error.message || 'Gagal menyimpan tautan ke Master.' }
  }
}

/**
 * Mengunggah versi baru (v2, v3, dst.) atau menimpa versi aktif pada lampiran di Master Bukti Dukung
 */
export async function uploadMasterAttachmentVersionAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    const unitId = formData.get('unitId') as string
    const aspectCode = formData.get('aspectCode') as string
    const slotKey = formData.get('slotKey') as string
    const attachmentId = formData.get('attachmentId') as string
    const uploaderName = (formData.get('uploaderName') as string) || 'Admin OPD'
    const note = (formData.get('note') as string) || ''
    const saveMode = (formData.get('saveMode') as string) || 'new_version' // 'new_version' | 'overwrite'

    if (!file || !unitId || !aspectCode || !slotKey || !attachmentId) {
      return {
        success: false,
        error: 'Data tidak lengkap untuk memperbarui versi berkas di Master.'
      }
    }

    const norm = normalizeAspectCode(aspectCode)
    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      }
    })

    if (!master) {
      return { success: false, error: 'Slot Master Bukti Dukung tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
    const targetIdx = attachments.findIndex((a) => a.id === attachmentId)
    if (targetIdx === -1) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan di slot Master ini.' }
    }

    const targetAtt = attachments[targetIdx]

    // Validasi aturan dinamis berkas (Tipe & Ukuran Maksimal)
    const rule = await getRuleForSlot(slotKey)

    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    const isDoc =
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('officedocument')

    if (rule.allowedDocumentType === 'PDF_ONLY' && isImg) {
      return {
        success: false,
        error: `Slot "${master.title || slotKey}" hanya menerima dokumen resmi PDF/Word. Berkas foto "${file.name}" ditolak.`
      }
    }

    if (rule.allowedDocumentType === 'IMAGE_ONLY' && !isImg) {
      return {
        success: false,
        error: `Slot "${master.title || slotKey}" khusus untuk dokumentasi foto/gambar. Berkas dokumen "${file.name}" ditolak.`
      }
    }

    if (!isImg && !isDoc) {
      return {
        success: false,
        error: `Format berkas "${file.name}" tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`
      }
    }

    const allowedLimitMb = isImg
      ? (rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3)
      : (rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20)
    const maxSizeBytes = allowedLimitMb * 1024 * 1024

    if (file.size > maxSizeBytes) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1)
      return {
        success: false,
        error: `Ukuran berkas ${isImg ? 'foto' : 'dokumen'} "${file.name}" (${actualMb} MB) melebihi batas maksimal ${allowedLimitMb} MB untuk slot ini.`
      }
    }

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
      return { success: false, error: uploadResult.error || 'Gagal mengunggah berkas versi baru.' }
    }

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    const sourceYear = activePeriod?.year || new Date().getFullYear()
    const activeEv = activePeriod
      ? await db.evaluation.findUnique({
          where: { year_unitId: { year: activePeriod.year, unitId } },
          select: { id: true }
        })
      : null

    const currentVersionNum = targetAtt.version || 1
    const previousVersions = targetAtt.versions || []
    const isOverwrite = saveMode === 'overwrite'

    if (isOverwrite) {
      if (targetAtt.fileUrl && targetAtt.fileUrl !== uploadResult.fileUrl) {
        try {
          await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
            targetAtt.fileUrl,
            unitId,
            activeEv?.id
          )
        } catch (err) {
          console.warn('Gagal menghapus berkas fisik lama saat overwrite di Master:', err)
        }
      }

      attachments[targetIdx] = {
        ...targetAtt,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        storageProvider: uploadResult.provider,
        uploadedAt: new Date().toISOString(),
        uploaderName
      }
    } else {
      const archivedVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        version: currentVersionNum,
        fileName: targetAtt.fileName,
        fileUrl: targetAtt.fileUrl,
        fileSize: targetAtt.fileSize,
        fileType: targetAtt.fileType,
        uploadedAt: targetAtt.uploadedAt,
        uploaderName: targetAtt.uploaderName || uploaderName,
        note: note || undefined
      }

      const nextVersionNum = currentVersionNum + 1

      attachments[targetIdx] = {
        ...targetAtt,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        storageProvider: uploadResult.provider,
        uploadedAt: new Date().toISOString(),
        uploaderName,
        version: nextVersionNum,
        versions: [archivedVersion, ...previousVersions]
      }
    }

    const finalVersionNum = isOverwrite ? currentVersionNum : currentVersionNum + 1
    const historyList = (Array.isArray(master.history) ? [...master.history] : []) as any[]
    historyList.unshift({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REPLACE',
      actorName: uploaderName,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      previousUrl: targetAtt.fileUrl,
      note: isOverwrite
        ? `Menimpa berkas di Master (v${finalVersionNum}): ${uploadResult.fileName}${note ? ` — ${note}` : ''}`
        : `Memperbarui versi v${finalVersionNum} di Master: ${uploadResult.fileName}${note ? ` — ${note}` : ''}`
    })

    const latestAtt = attachments[attachments.length - 1]

    await db.unitEvidenceMaster.update({
      where: { id: master.id },
      data: {
        fileUrl: latestAtt.fileUrl,
        fileName: latestAtt.fileName,
        fileSize: latestAtt.fileSize,
        fileType: latestAtt.fileType,
        storageProvider: latestAtt.storageProvider,
        uploaderName,
        lastSourceYear: sourceYear,
        attachments: attachments as any,
        history: historyList as any
      }
    })

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true, newVersion: finalVersionNum, isOverwrite }
  } catch (error: any) {
    console.error('Error uploading master attachment version:', error)
    return { success: false, error: error.message || 'Gagal memperbarui versi berkas di Master.' }
  }
}

/**
 * Memulihkan (restore) versi terdahulu menjadi versi aktif pada Master Bukti Dukung
 */
export async function restoreMasterAttachmentVersionAction(params: {
  unitId: string
  aspectCode: string
  slotKey: string
  attachmentId: string
  targetVersionId: string
  uploaderName?: string
}) {
  try {
    const { unitId, aspectCode, slotKey, attachmentId, targetVersionId, uploaderName } = params
    const norm = normalizeAspectCode(aspectCode)

    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      }
    })
    if (!master) {
      return { success: false, error: 'Slot Master Bukti Dukung tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
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

    const archivedCurrent = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: currentActiveVersion,
      fileName: targetAtt.fileName,
      fileUrl: targetAtt.fileUrl,
      fileSize: targetAtt.fileSize,
      fileType: targetAtt.fileType,
      uploadedAt: targetAtt.uploadedAt,
      uploaderName: targetAtt.uploaderName || uploaderName || 'Admin OPD',
      note: 'Diarsipkan saat memulihkan versi terdahulu di Master'
    }

    const remainingVersions = versions.filter((_, idx) => idx !== selectedVerIdx)
    remainingVersions.unshift(archivedCurrent)

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

    const historyList = (Array.isArray(master.history) ? [...master.history] : []) as any[]
    historyList.unshift({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REPLACE',
      actorName: uploaderName || 'Admin OPD',
      fileName: selectedVer.fileName,
      fileUrl: selectedVer.fileUrl,
      previousUrl: targetAtt.fileUrl,
      note: `Memulihkan berkas Master ke Versi v${selectedVer.version}: ${selectedVer.fileName}`
    })

    const latestAtt = attachments[attachments.length - 1]

    await db.unitEvidenceMaster.update({
      where: { id: master.id },
      data: {
        fileUrl: latestAtt.fileUrl,
        fileName: latestAtt.fileName,
        attachments: attachments as any,
        history: historyList as any
      }
    })

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true, restoredVersion: selectedVer.version }
  } catch (error: any) {
    console.error('Error restoring master attachment version:', error)
    return { success: false, error: error.message || 'Gagal memulihkan versi berkas.' }
  }
}

/**
 * Menghapus satu versi arsip tertentu pada lampiran di Master Bukti Dukung
 */
export async function deleteMasterAttachmentVersionAction(params: {
  unitId: string
  aspectCode: string
  slotKey: string
  attachmentId: string
  versionId: string
  actorName?: string
}) {
  try {
    const { unitId, aspectCode, slotKey, attachmentId, versionId, actorName } = params
    const norm = normalizeAspectCode(aspectCode)

    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      }
    })
    if (!master) {
      return { success: false, error: 'Slot Master tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
    const targetIdx = attachments.findIndex((a) => a.id === attachmentId)
    if (targetIdx === -1) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan.' }
    }

    const targetAtt = attachments[targetIdx]
    const versions = targetAtt.versions || []
    const selectedVer = versions.find((v) => v.id === versionId)
    if (!selectedVer) {
      return { success: false, error: 'Versi tidak ditemukan.' }
    }

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    const activeEv = activePeriod
      ? await db.evaluation.findUnique({
          where: { year_unitId: { year: activePeriod.year, unitId } },
          select: { id: true }
        })
      : null

    if (selectedVer.fileUrl) {
      try {
        await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
          selectedVer.fileUrl,
          unitId,
          activeEv?.id
        )
      } catch (err) {
        console.warn('Gagal menghapus berkas fisik versi Master:', err)
      }
    }

    const updatedVersions = versions.filter((v) => v.id !== versionId)
    attachments[targetIdx] = {
      ...targetAtt,
      versions: updatedVersions
    }

    const historyList = (Array.isArray(master.history) ? [...master.history] : []) as any[]
    historyList.unshift({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE',
      actorName: actorName || 'Admin OPD',
      fileName: selectedVer.fileName,
      fileUrl: null,
      note: `Menghapus arsip Versi v${selectedVer.version} di Master: ${selectedVer.fileName}`
    })

    await db.unitEvidenceMaster.update({
      where: { id: master.id },
      data: {
        attachments: attachments as any,
        history: historyList as any
      }
    })

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting master attachment version:', error)
    return { success: false, error: error.message || 'Gagal menghapus arsip versi.' }
  }
}

/**
 * Menghapus satu lampiran berkas dari slot Master Bukti Dukung
 */
export async function deleteMasterEvidenceAttachmentAction(params: {
  unitId: string
  aspectCode: string
  slotKey: string
  attachmentId: string
  actorName?: string
}) {
  try {
    const { unitId, aspectCode, slotKey, attachmentId, actorName } = params
    const norm = normalizeAspectCode(aspectCode)

    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      }
    })
    if (!master) {
      return { success: false, error: 'Data Master tidak ditemukan.' }
    }

    const attachments = extractAttachments(master)
    const target = attachments.find((a) => a.id === attachmentId)
    if (!target) {
      return { success: false, error: 'Berkas lampiran tidak ditemukan.' }
    }

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    const activeEv = activePeriod
      ? await db.evaluation.findUnique({
          where: { year_unitId: { year: activePeriod.year, unitId } },
          select: { id: true }
        })
      : null

    try {
      await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
        target.fileUrl,
        unitId,
        activeEv?.id
      )
    } catch {}

    if (target.versions && target.versions.length > 0) {
      for (const ver of target.versions) {
        if (ver.fileUrl) {
          try {
            await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
              ver.fileUrl,
              unitId,
              activeEv?.id
            )
          } catch {}
        }
      }
    }

    const remaining = attachments.filter((a) => a.id !== attachmentId)
    const historyList = (Array.isArray(master.history) ? [...master.history] : []) as any[]
    historyList.unshift({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE',
      actorName: actorName || 'Admin OPD',
      fileName: target.fileName,
      fileUrl: null,
      note: `Menghapus lampiran berkas di Master: ${target.fileName}`
    })

    if (remaining.length === 0) {
      if (slotKey.startsWith('additional_')) {
        await db.unitEvidenceMaster.delete({ where: { id: master.id } })
      } else {
        await db.unitEvidenceMaster.update({
          where: { id: master.id },
          data: {
            fileUrl: '',
            fileName: null,
            fileSize: null,
            fileType: null,
            attachments: [] as any,
            history: historyList as any
          }
        })
      }
    } else {
      const latest = remaining[remaining.length - 1]
      await db.unitEvidenceMaster.update({
        where: { id: master.id },
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

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true, remainingCount: remaining.length }
  } catch (error: any) {
    console.error('Error deleting master evidence attachment:', error)
    return { success: false, error: error.message || 'Gagal menghapus lampiran di Master.' }
  }
}

/**
 * Menghapus seluruh berkas pada satu slot di Master Bukti Dukung (Hapus Semua)
 */
export async function deleteMasterEvidenceSlotAction(params: {
  unitId: string
  aspectCode: string
  slotKey: string
  actorName?: string
}) {
  try {
    const { unitId, aspectCode, slotKey } = params
    const norm = normalizeAspectCode(aspectCode)

    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: norm,
          slotKey
        }
      }
    })

    if (!master) {
      return { success: true }
    }

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    const activeEv = activePeriod
      ? await db.evaluation.findUnique({
          where: { year_unitId: { year: activePeriod.year, unitId } },
          select: { id: true }
        })
      : null

    const allAttachments = extractAttachments(master)
    for (const att of allAttachments) {
      if (att.fileUrl) {
        try {
          await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
            att.fileUrl,
            unitId,
            activeEv?.id
          )
        } catch {}
      }
      if (att.versions && att.versions.length > 0) {
        for (const ver of att.versions) {
          if (ver.fileUrl) {
            try {
              await EvidenceMasterService.safeDeletePhysicalFileFromMaster(
                ver.fileUrl,
                unitId,
                activeEv?.id
              )
            } catch {}
          }
        }
      }
    }

    const historyList = (Array.isArray(master.history) ? [...master.history] : []) as any[]
    historyList.unshift({
      id: `act_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELETE_ALL',
      actorName: params.actorName || 'Admin OPD',
      fileName: master.fileName,
      fileUrl: null,
      note: `Menghapus seluruh berkas pada slot Master: ${master.title}`
    })

    if (slotKey.startsWith('additional_')) {
      await db.unitEvidenceMaster.delete({
        where: { id: master.id }
      })
    } else {
      await db.unitEvidenceMaster.update({
        where: { id: master.id },
        data: {
          fileUrl: '',
          fileName: null,
          fileSize: null,
          fileType: null,
          attachments: [] as any,
          history: historyList as any
        }
      })
    }

    await EvidenceMasterService.syncMasterToActivePeriodEvaluation(unitId, norm, slotKey)

    revalidatePath('/opd')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/admin/master-bukti')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting master evidence slot:', error)
    return { success: false, error: error.message || 'Gagal menghapus seluruh berkas pada slot Master.' }
  }
}

import type { ExtractedDocumentMetadata } from '../services/evidence-metadata-service'

/**
 * Mengekstrak metadata berkas master secara on-demand via Gemini AI Vision.
 * Dapat dipicu langsung oleh Admin / Pengguna per slot dokumen.
 */
export async function extractMasterEvidenceMetadataAction(params: {
  masterId: string
  actorName?: string
}): Promise<{
  success: boolean
  metadata?: ExtractedDocumentMetadata
  error?: string
}> {
  try {
    const { EvidenceMetadataService } = await import('../services/evidence-metadata-service')
    const res = await EvidenceMetadataService.extractAndSaveForMaster(
      params.masterId,
      params.actorName || 'Admin (AI Vision)'
    )

    revalidatePath('/admin/master-bukti')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/master-bukti')

    return res
  } catch (error: any) {
    console.error('Error extracting master evidence metadata with AI Vision:', error)
    return {
      success: false,
      error: error.message || 'Gagal mengekstrak metadata dokumen menggunakan AI Vision.'
    }
  }
}

/**
 * Memperbarui metadata berkas master secara manual (Human-in-the-Loop Override).
 * Mendukung dokumen legal (SK/Laporan), fasilitas fisik (Sarpras), dan sistem digital (Screenshot).
 */
export async function updateMasterEvidenceManualMetadataAction(params: {
  masterId: string
  attachmentId?: string | null
  category?: 'LEGAL_DOCUMENT' | 'PHYSICAL_FACILITY' | 'DIGITAL_SYSTEM'
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
  actorName?: string
}) {
  try {
    const { EvidenceMetadataService } = await import('../services/evidence-metadata-service')
    const res = await EvidenceMetadataService.updateManualMetadataForMaster(
      params.masterId,
      {
        category: params.category,
        detectedYear: params.detectedYear,
        documentNumber: params.documentNumber,
        documentDate: params.documentDate,
        documentTitle: params.documentTitle,
        facilityType: params.facilityType,
        conditionStatus: params.conditionStatus,
        locationDescription: params.locationDescription,
        photoDate: params.photoDate,
        systemName: params.systemName,
        url: params.url,
        operationalStatus: params.operationalStatus,
        screenshotDate: params.screenshotDate,
        notes: params.notes,
        attachmentId: params.attachmentId
      },
      params.actorName || 'Admin (Manual)'
    )

    revalidatePath('/admin/master-bukti')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/master-bukti')

    return res
  } catch (error: any) {
    console.error('Error updating manual metadata for master evidence:', error)
    return {
      success: false,
      error: error.message || 'Gagal memperbarui metadata dokumen secara manual.'
    }
  }
}

/**
 * Pindai massal seluruh berkas master milik suatu unit yang belum memiliki metadata tahun.
 */
export async function batchExtractMasterEvidenceMetadataAction(params: {
  unitId: string
  forceAll?: boolean
}) {
  try {
    const { EvidenceMetadataService } = await import('../services/evidence-metadata-service')
    const res = await EvidenceMetadataService.batchExtractUnitMaster(
      params.unitId,
      Boolean(params.forceAll)
    )

    revalidatePath('/admin/master-bukti')
    revalidatePath('/opd/master-bukti')
    revalidatePath('/master-bukti')

    return res
  } catch (error: any) {
    console.error('Error batch extracting master evidence metadata:', error)
    return {
      success: false,
      processedCount: 0,
      updatedCount: 0,
      error: error.message || 'Gagal menjalankan pemindaian massal metadata master.'
    }
  }
}


