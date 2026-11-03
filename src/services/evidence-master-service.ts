// src/services/evidence-master-service.ts
// Layanan Pengelolaan Master Bukti Dukung Unit (Living Document Lintas Tahun & Snapshot Tahunan)

import { Prisma } from '@prisma/client'
import { db } from './db'
import { StorageService } from './storage-service'
import {
  extractAttachments,
  normalizeAspectCode,
  EvidenceAttachmentItem
} from '../core/domain/evidence-slots-preset'

export class EvidenceMasterService {
  /**
   * 1. Bootstrap Master Bukti Dukung untuk suatu Unit dari data submisi evaluasi yang sudah ada.
   * Mengambil state terbaru per (aspectCode, slotKey) dari evaluasi tahun paling mutakhir milik unit tersebut
   * apabila slot tersebut belum tercatat di UnitEvidenceMaster.
   * CATATAN: Ini adalah inisialisasi SATU KALI (one-time bootstrap). Sekali unit telah di-bootstrap,
   * Master menjadi Source of Truth mandiri sehingga penghapusan berkas oleh pengguna tidak akan
   * dibangkitkan ulang dari data historis masa lalu.
   */
  static async bootstrapUnitMasterFromExisting(unitId: string): Promise<void> {
    if (!unitId) return

    const flagKey = `master_bootstrapped_${unitId}`
    const alreadyBootstrapped = await db.systemSetting.findUnique({
      where: { key: flagKey }
    })
    if (alreadyBootstrapped?.value === 'true') {
      return
    }

    const [existingMasters, evaluations] = await Promise.all([
      db.unitEvidenceMaster.findMany({
        where: { unitId }
      }),
      db.evaluation.findMany({
        where: { unitId },
        orderBy: { year: 'desc' },
        select: {
          id: true,
          year: true,
          evidenceSubmissions: {
            where: {
              NOT: { fileUrl: '' }
            }
          }
        }
      })
    ])

    // Jika unit ini sudah memiliki record master bukti dukung, tandai sudah dibootstrap
    if (existingMasters.length > 0) {
      await db.systemSetting
        .upsert({
          where: { key: flagKey },
          update: { value: 'true' },
          create: { key: flagKey, value: 'true' }
        })
        .catch(() => {})
      return
    }

    const masterMap = new Map<string, (typeof existingMasters)[number]>()
    for (const m of existingMasters) {
      const normAspect = normalizeAspectCode(m.aspectCode)
      masterMap.set(`${normAspect}::${m.slotKey}`, m)
    }

    // Iterasi dari evaluasi tahun terbaru ke tahun terlama
    for (const ev of evaluations) {
      for (const sub of ev.evidenceSubmissions) {
        const normAspect = normalizeAspectCode(sub.aspectCode)
        const key = `${normAspect}::${sub.slotKey}`

        const attachments = extractAttachments(sub)
        if (attachments.length === 0 && (!sub.fileUrl || sub.fileUrl.trim() === '')) {
          continue
        }

        const existingMaster = masterMap.get(key)
        // Buat di Master jika belum ada, atau jika Master yang ada berasal dari tahun yang lebih tua
        // dan saat ini kosong sedangkan tahun lebih baru punya data
        const shouldBootstrap =
          !existingMaster ||
          ((!existingMaster.fileUrl || existingMaster.fileUrl.trim() === '') &&
            (existingMaster.lastSourceYear || 0) <= ev.year)

        if (shouldBootstrap) {
          const primaryAtt = attachments[0]
          const upserted = await db.unitEvidenceMaster.upsert({
            where: {
              unitId_aspectCode_slotKey: {
                unitId,
                aspectCode: normAspect,
                slotKey: sub.slotKey
              }
            },
            update: {
              title: sub.title,
              fileUrl: primaryAtt ? primaryAtt.fileUrl : sub.fileUrl,
              storageProvider: primaryAtt?.storageProvider || sub.storageProvider || 'EXTERNAL_LINK',
              fileType: primaryAtt?.fileType || sub.fileType || 'DOCUMENT',
              fileSize: primaryAtt?.fileSize ?? sub.fileSize ?? 0,
              fileName: primaryAtt?.fileName || sub.fileName || sub.title,
              uploaderName: primaryAtt?.uploaderName || sub.uploaderName || 'OPD',
              lastSourceYear: ev.year,
              attachments: attachments as unknown as Prisma.InputJsonValue,
              history: (Array.isArray(sub.history) ? sub.history : []) as unknown as Prisma.InputJsonValue
            },
            create: {
              unitId,
              aspectCode: normAspect,
              slotKey: sub.slotKey,
              title: sub.title,
              fileUrl: primaryAtt ? primaryAtt.fileUrl : sub.fileUrl,
              storageProvider: primaryAtt?.storageProvider || sub.storageProvider || 'EXTERNAL_LINK',
              fileType: primaryAtt?.fileType || sub.fileType || 'DOCUMENT',
              fileSize: primaryAtt?.fileSize ?? sub.fileSize ?? 0,
              fileName: primaryAtt?.fileName || sub.fileName || sub.title,
              uploaderName: primaryAtt?.uploaderName || sub.uploaderName || 'OPD',
              lastSourceYear: ev.year,
              attachments: attachments as unknown as Prisma.InputJsonValue,
              history: (Array.isArray(sub.history) ? sub.history : []) as unknown as Prisma.InputJsonValue
            }
          })
          masterMap.set(key, upserted)
        }
      }
    }

    // Tandai unit ini telah selesai di-bootstrap
    await db.systemSetting
      .upsert({
        where: { key: flagKey },
        update: { value: 'true' },
        create: { key: flagKey, value: 'true' }
      })
      .catch(() => {})
  }

  /**
   * 2. Dual-Sync: Sinkronkan perubahan pada satu slot di IndicatorEvidenceSubmission ke UnitEvidenceMaster.
   * Hanya menyinkronkan ke Master apabila tahun evaluasi >= lastSourceYear di Master
   * (agar pengeditan arsip tahun lama tidak menimpa dokumen Master dari tahun yang lebih baru).
   */
  static async syncSubmissionToMaster(
    evaluationId: string,
    aspectCode: string,
    slotKey: string
  ): Promise<void> {
    if (!evaluationId || !aspectCode || !slotKey) return

    const normAspect = normalizeAspectCode(aspectCode)

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, unitId: true, year: true }
    })
    if (!evaluation) return

    const [submission, existingMaster] = await Promise.all([
      db.indicatorEvidenceSubmission.findUnique({
        where: {
          evaluationId_aspectCode_slotKey: {
            evaluationId,
            aspectCode: normAspect,
            slotKey
          }
        }
      }),
      db.unitEvidenceMaster.findUnique({
        where: {
          unitId_aspectCode_slotKey: {
            unitId: evaluation.unitId,
            aspectCode: normAspect,
            slotKey
          }
        }
      })
    ])

    // Jangan timpa Master jika Master sudah diperbarui oleh tahun evaluasi yang lebih baru
    if (
      existingMaster &&
      existingMaster.lastSourceYear &&
      existingMaster.lastSourceYear > evaluation.year
    ) {
      return
    }

    // Jika submission dihapus sepenuhnya (misal slot tambahan kustom dihapus)
    if (!submission) {
      if (existingMaster) {
        if (slotKey.startsWith('additional_')) {
          await db.unitEvidenceMaster.delete({
            where: { id: existingMaster.id }
          })
        } else {
          await db.unitEvidenceMaster.update({
            where: { id: existingMaster.id },
            data: {
              fileUrl: '',
              fileName: null,
              fileSize: null,
              attachments: [] as unknown as Prisma.InputJsonValue,
              lastSourceYear: evaluation.year
            }
          })
        }
      }
      return
    }

    const attachments = extractAttachments(submission)
    const hasFiles = attachments.length > 0 && submission.fileUrl && submission.fileUrl.trim() !== ''
    const primaryAtt = attachments[0]

    if (!hasFiles) {
      // Slot dikosongkan pada tahun berjalan
      if (existingMaster) {
        await db.unitEvidenceMaster.update({
          where: { id: existingMaster.id },
          data: {
            title: submission.title,
            fileUrl: '',
            fileName: null,
            fileSize: null,
            lastSourceYear: evaluation.year,
            attachments: [] as unknown as Prisma.InputJsonValue,
            history: (Array.isArray(submission.history)
              ? submission.history
              : existingMaster.history || []) as unknown as Prisma.InputJsonValue
          }
        })
      }
      return
    }

    await db.unitEvidenceMaster.upsert({
      where: {
        unitId_aspectCode_slotKey: {
          unitId: evaluation.unitId,
          aspectCode: normAspect,
          slotKey
        }
      },
      update: {
        title: submission.title,
        fileUrl: primaryAtt ? primaryAtt.fileUrl : submission.fileUrl,
        storageProvider: primaryAtt?.storageProvider || submission.storageProvider || 'EXTERNAL_LINK',
        fileType: primaryAtt?.fileType || submission.fileType || 'DOCUMENT',
        fileSize: primaryAtt?.fileSize ?? submission.fileSize ?? 0,
        fileName: primaryAtt?.fileName || submission.fileName || submission.title,
        uploaderName: primaryAtt?.uploaderName || submission.uploaderName || 'OPD',
        lastSourceYear: evaluation.year,
        attachments: attachments as unknown as Prisma.InputJsonValue,
        history: (Array.isArray(submission.history) ? submission.history : []) as unknown as Prisma.InputJsonValue
      },
      create: {
        unitId: evaluation.unitId,
        aspectCode: normAspect,
        slotKey,
        title: submission.title,
        fileUrl: primaryAtt ? primaryAtt.fileUrl : submission.fileUrl,
        storageProvider: primaryAtt?.storageProvider || submission.storageProvider || 'EXTERNAL_LINK',
        fileType: primaryAtt?.fileType || submission.fileType || 'DOCUMENT',
        fileSize: primaryAtt?.fileSize ?? submission.fileSize ?? 0,
        fileName: primaryAtt?.fileName || submission.fileName || submission.title,
        uploaderName: primaryAtt?.uploaderName || submission.uploaderName || 'OPD',
        lastSourceYear: evaluation.year,
        attachments: attachments as unknown as Prisma.InputJsonValue,
        history: (Array.isArray(submission.history) ? submission.history : []) as unknown as Prisma.InputJsonValue
      }
    })
  }

  /**
   * 3. Wariskan seluruh Bukti Dukung aktif dari UnitEvidenceMaster ke Evaluation tertentu.
   * Hanya mengisi slot (aspectCode, slotKey) yang belum memiliki record di Evaluation tersebut.
   * Menyertakan pohon versi (version, versions[]) dan jejak audit lintas tahun,
   * sementara aiStatus di-reset menjadi IDLE untuk tahun baru.
   */
  static async inheritMasterToEvaluation(
    evaluationId: string,
    unitIdParam?: string,
    yearParam?: number
  ): Promise<number> {
    if (!evaluationId) return 0

    let unitId = unitIdParam
    let year = yearParam

    if (!unitId || !year) {
      const ev = await db.evaluation.findUnique({
        where: { id: evaluationId },
        select: { id: true, unitId: true, year: true }
      })
      if (!ev) return 0
      unitId = ev.unitId
      year = ev.year
    }

    // Pastikan Master Unit sudah ter-bootstrap dari evaluasi yang pernah ada
    await this.bootstrapUnitMasterFromExisting(unitId)

    const [activeMasters, existingSubmissions, slotConfigs] = await Promise.all([
      db.unitEvidenceMaster.findMany({
        where: {
          unitId,
          NOT: { fileUrl: '' }
        }
      }),
      db.indicatorEvidenceSubmission.findMany({
        where: { evaluationId },
        select: { aspectCode: true, slotKey: true }
      }),
      db.evidenceSlotConfig.findMany({
        select: { id: true, aspectCode: true, slotKey: true }
      })
    ])

    if (activeMasters.length === 0) return 0

    const existingKeys = new Set(
      existingSubmissions.map((s) => `${normalizeAspectCode(s.aspectCode)}::${s.slotKey}`)
    )
    const configMap = new Map<string, string>()
    for (const cfg of slotConfigs) {
      configMap.set(`${normalizeAspectCode(cfg.aspectCode)}::${cfg.slotKey}`, cfg.id)
    }

    const toCreate: Prisma.IndicatorEvidenceSubmissionCreateManyInput[] = []

    for (const master of activeMasters) {
      const normAspect = normalizeAspectCode(master.aspectCode)
      const key = `${normAspect}::${master.slotKey}`

      if (existingKeys.has(key)) continue

      // Jika master berasal dari tahun yang lebih baru dari evaluasi target (misal membuka evaluasi masa lalu yang kosong), jangan wariskan mundur
      if (master.lastSourceYear && master.lastSourceYear > year) continue

      const attachments: EvidenceAttachmentItem[] = extractAttachments(master)
      if (attachments.length === 0 && (!master.fileUrl || master.fileUrl.trim() === '')) {
        continue
      }

      const prevHistory = Array.isArray(master.history) ? (master.history as any[]) : []
      const inheritLog = {
        id: `hist_inherit_${year}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        action: 'UPLOAD',
        actorName: 'Master Living Document',
        fileName: master.fileName || master.title,
        fileUrl: master.fileUrl,
        note: `Diwariskan otomatis dari Master Bukti Dukung${master.lastSourceYear ? ` (Periode ${master.lastSourceYear})` : ''} ke Periode ${year}`
      }

      const nextHistory = [inheritLog, ...prevHistory]
      const primaryAtt = attachments[0]

      toCreate.push({
        evaluationId,
        aspectCode: normAspect,
        slotKey: master.slotKey,
        slotConfigId: configMap.get(key) || null,
        title: master.title,
        fileUrl: primaryAtt ? primaryAtt.fileUrl : master.fileUrl,
        storageProvider: primaryAtt?.storageProvider || master.storageProvider || 'EXTERNAL_LINK',
        fileType: primaryAtt?.fileType || master.fileType || 'DOCUMENT',
        fileSize: primaryAtt?.fileSize ?? master.fileSize ?? 0,
        fileName: primaryAtt?.fileName || master.fileName || master.title,
        uploaderName: primaryAtt?.uploaderName || master.uploaderName || 'OPD',
        isInherited: true,
        attachments: attachments as unknown as Prisma.InputJsonValue,
        history: nextHistory as unknown as Prisma.InputJsonValue,
        aiStatus: 'IDLE',
        aiInsights: Prisma.DbNull
      })
    }

    if (toCreate.length > 0) {
      await db.indicatorEvidenceSubmission.createMany({
        data: toCreate,
        skipDuplicates: true
      })
    }

    return toCreate.length
  }

  /**
   * 4. Pengecekan ringan (Lazy Auto-Inherit) saat membuka halaman Evaluasi / Bukti Dukung.
   * Jika evaluasi belum memiliki satu pun baris di IndicatorEvidenceSubmission,
   * otomatis tarik warisan dari Master Bukti Dukung unit tersebut.
   */
  static async ensureEvaluationInherited(evaluationId: string): Promise<void> {
    if (!evaluationId) return
    const count = await db.indicatorEvidenceSubmission.count({
      where: { evaluationId }
    })
    if (count > 0) return

    await this.inheritMasterToEvaluation(evaluationId)
  }

  /**
   * 5. Bulk Auto-Inherit untuk seluruh evaluasi pada suatu periode tahun yang masih 0 submisi.
   * Dipanggil saat enrollUnitsBulkAction atau saat membuka daftar lokus periode baru.
   */
  static async inheritMasterBulkForPeriod(year: number, unitIds?: string[]): Promise<void> {
    const evaluations = await db.evaluation.findMany({
      where: {
        year,
        ...(unitIds && unitIds.length > 0 ? { unitId: { in: unitIds } } : {})
      },
      select: {
        id: true,
        unitId: true,
        year: true,
        _count: {
          select: { evidenceSubmissions: true }
        }
      }
    })

    const emptyEvaluations = evaluations.filter((ev) => ev._count.evidenceSubmissions === 0)
    if (emptyEvaluations.length === 0) return

    for (const ev of emptyEvaluations) {
      await this.inheritMasterToEvaluation(ev.id, ev.unitId, ev.year)
    }
  }

  /**
   * 6. Proteksi Snapshot Tahunan (Safe Physical File Delete):
   * Hanya menghapus file fisik dari R2 / Local Storage apabila URL file tersebut
   * TIDAK direferensikan oleh IndicatorEvidenceSubmission pada tahun evaluasi lainnya.
   */
  static async safeDeletePhysicalFile(
    fileUrl: string | null | undefined,
    currentEvaluationId: string
  ): Promise<void> {
    if (!fileUrl || fileUrl.trim() === '') return

    const trimmedUrl = fileUrl.trim()

    // Cari unitId dari evaluasi saat ini untuk mempersempit & mempercepat pengecekan lintas tahun
    const currentEv = await db.evaluation.findUnique({
      where: { id: currentEvaluationId },
      select: { unitId: true }
    })

    const otherSubmissions = await db.indicatorEvidenceSubmission.findMany({
      where: {
        evaluationId: { not: currentEvaluationId },
        ...(currentEv ? { evaluation: { unitId: currentEv.unitId } } : {})
      },
      select: {
        fileUrl: true,
        attachments: true
      }
    })

    const isReferencedElsewhere = otherSubmissions.some((sub) => {
      if (sub.fileUrl === trimmedUrl) return true
      if (sub.attachments) {
        const rawJson = JSON.stringify(sub.attachments)
        if (rawJson.includes(trimmedUrl)) return true
      }
      return false
    })

    if (isReferencedElsewhere) {
      // File masih menjadi bagian dari snapshot tahun evaluasi lain! Jangan hapus fisik file.
      return
    }

    await StorageService.deleteFile(trimmedUrl)
  }

  /**
   * 7. Sinkronkan perubahan langsung pada UnitEvidenceMaster ke Evaluasi pada Tahun Penilaian Aktif (jika ada).
   * Evaluasi tahun-tahun yang sudah ditutup (arsip) TIDAK disentuh agar snapshot historis tetap utuh.
   */
  static async syncMasterToActivePeriodEvaluation(
    unitId: string,
    aspectCode: string,
    slotKey: string
  ): Promise<string | null> {
    if (!unitId || !aspectCode || !slotKey) return null
    const normAspect = normalizeAspectCode(aspectCode)

    const activePeriod = await db.evaluationPeriod.findFirst({
      where: { isOpen: true },
      select: { year: true }
    })
    if (!activePeriod) return null

    const activeEv = await db.evaluation.findUnique({
      where: {
        year_unitId: {
          year: activePeriod.year,
          unitId
        }
      },
      select: { id: true, year: true }
    })
    if (!activeEv) return null

    const master = await db.unitEvidenceMaster.findUnique({
      where: {
        unitId_aspectCode_slotKey: {
          unitId,
          aspectCode: normAspect,
          slotKey
        }
      }
    })

    if (!master || !master.fileUrl || master.fileUrl.trim() === '') {
      const existingSub = await db.indicatorEvidenceSubmission.findUnique({
        where: {
          evaluationId_aspectCode_slotKey: {
            evaluationId: activeEv.id,
            aspectCode: normAspect,
            slotKey
          }
        }
      })
      if (existingSub) {
        if (slotKey.startsWith('additional_')) {
          await db.indicatorEvidenceSubmission.delete({ where: { id: existingSub.id } })
        } else {
          await db.indicatorEvidenceSubmission.update({
            where: { id: existingSub.id },
            data: {
              fileUrl: '',
              fileName: null,
              fileSize: null,
              fileType: null,
              attachments: [] as unknown as Prisma.InputJsonValue,
              history: (master?.history || existingSub.history || []) as unknown as Prisma.InputJsonValue,
              isInherited: false
            }
          })
        }
      }
      return activeEv.id
    }

    const attachments = extractAttachments(master)
    const primaryAtt = attachments[0]

    await db.indicatorEvidenceSubmission.upsert({
      where: {
        evaluationId_aspectCode_slotKey: {
          evaluationId: activeEv.id,
          aspectCode: normAspect,
          slotKey
        }
      },
      update: {
        title: master.title,
        fileUrl: primaryAtt ? primaryAtt.fileUrl : master.fileUrl,
        storageProvider: primaryAtt?.storageProvider || master.storageProvider || 'EXTERNAL_LINK',
        fileType: primaryAtt?.fileType || master.fileType || 'DOCUMENT',
        fileSize: primaryAtt?.fileSize ?? master.fileSize ?? 0,
        fileName: primaryAtt?.fileName || master.fileName || master.title,
        uploaderName: primaryAtt?.uploaderName || master.uploaderName || 'OPD',
        attachments: attachments as unknown as Prisma.InputJsonValue,
        history: (Array.isArray(master.history) ? master.history : []) as unknown as Prisma.InputJsonValue,
        isInherited: false
      },
      create: {
        evaluationId: activeEv.id,
        aspectCode: normAspect,
        slotKey,
        title: master.title,
        fileUrl: primaryAtt ? primaryAtt.fileUrl : master.fileUrl,
        storageProvider: primaryAtt?.storageProvider || master.storageProvider || 'EXTERNAL_LINK',
        fileType: primaryAtt?.fileType || master.fileType || 'DOCUMENT',
        fileSize: primaryAtt?.fileSize ?? master.fileSize ?? 0,
        fileName: primaryAtt?.fileName || master.fileName || master.title,
        uploaderName: primaryAtt?.uploaderName || master.uploaderName || 'OPD',
        attachments: attachments as unknown as Prisma.InputJsonValue,
        history: (Array.isArray(master.history) ? master.history : []) as unknown as Prisma.InputJsonValue,
        isInherited: false
      }
    })

    return activeEv.id
  }

  /**
   * 8. Proteksi penghapusan fisik berkas saat dihapus/ditimpa langsung dari Master Bukti Dukung.
   * Memastikan berkas fisik tidak dihapus apabila masih dipakai oleh snapshot evaluasi arsip.
   */
  static async safeDeletePhysicalFileFromMaster(
    fileUrl: string | null | undefined,
    unitId: string,
    excludeEvaluationId?: string | null
  ): Promise<void> {
    if (!fileUrl || fileUrl.trim() === '') return
    const trimmedUrl = fileUrl.trim()

    const otherSubmissions = await db.indicatorEvidenceSubmission.findMany({
      where: {
        evaluation: { unitId },
        ...(excludeEvaluationId ? { evaluationId: { not: excludeEvaluationId } } : {})
      },
      select: {
        fileUrl: true,
        attachments: true
      }
    })

    const isReferencedInSnapshot = otherSubmissions.some((sub) => {
      if (sub.fileUrl === trimmedUrl) return true
      if (sub.attachments) {
        const rawJson = JSON.stringify(sub.attachments)
        if (rawJson.includes(trimmedUrl)) return true
      }
      return false
    })

    if (isReferencedInSnapshot) return

    await StorageService.deleteFile(trimmedUrl)
  }
}
