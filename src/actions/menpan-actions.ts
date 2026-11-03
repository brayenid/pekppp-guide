'use server'

import { getMenpanApiConfig, saveMenpanApiConfig, MenpanApiConfig } from '../services/system-setting-service'
import { MenpanApiService } from '../services/menpan-api-service'
import { validateEvaluationForSync } from '../services/sync-validator-service'
import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

export async function getMenpanApiConfigAction() {
  return getMenpanApiConfig()
}

export async function saveMenpanApiConfigAction(config: Partial<MenpanApiConfig>) {
  await saveMenpanApiConfig(config)
  revalidatePath('/admin/pengaturan-api')
  revalidatePath('/admin/peserta')
  return { success: true }
}

export async function testMenpanConnectionAction() {
  return MenpanApiService.testConnection()
}

export async function getMenpanRemoteEvaluationsAction(year?: number) {
  return MenpanApiService.getRemoteEvaluations(year)
}

export async function validateEvaluationSyncAction(evaluationId: string) {
  return validateEvaluationForSync(evaluationId)
}

export async function checkEvaluationConflictAction(evaluationId: string) {
  const config = await getMenpanApiConfig()
  const isConfigured = Boolean(config.baseUrl && config.apiKey)

  if (!isConfigured) {
    return {
      success: false,
      isConfigured: false,
      message:
        'Kredensial API MenPAN-RB (Base URL & Bearer Token) belum dikonfigurasi di menu Pengaturan API. Silakan tetapkan kredensial terlebih dahulu (baik untuk server Sandbox resmi MenPAN maupun Production).'
    }
  }

  // 1. Ambil data lokal
  const localEval = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true,
      scores: {
        include: { indicator: true },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    }
  })

  if (!localEval) {
    return { success: false, message: 'Evaluasi lokal tidak ditemukan.' }
  }

  // 2. Ambil daftar remote evaluations dari MenPAN
  const remoteRes = await MenpanApiService.getRemoteEvaluations(localEval.year)
  if (!remoteRes.success || !remoteRes.data) {
    return {
      success: false,
      message: remoteRes.message || 'Gagal mengambil data evaluasi dari server MenPAN-RB.'
    }
  }

  // Cari remote evaluation yang cocok berdasarkan menpanEvaluationId atau kemiripan nama unit
  const matchedRemote = localEval.menpanEvaluationId
    ? remoteRes.data.find((r) => r.uuid === localEval.menpanEvaluationId)
    : remoteRes.data.find((r) => {
        const localName = localEval.unit.name.toLowerCase().trim()
        const remoteName = r.name.toLowerCase().trim()
        return (
          localName === remoteName ||
          localName.includes(remoteName) ||
          remoteName.includes(localName)
        )
      })

  // Hitung perbedaan status & kelengkapan lokal
  const localFilledCount = localEval.scores.filter(
    (s) => s.score !== null || s.f01Submitted
  ).length

  const syncLogs = localEval.syncLogs as any
  const isQuestionsMapped = Boolean(syncLogs?.questionMap && syncLogs.questionMap.length > 0)
  const questionsCount = syncLogs?.questionsCount || syncLogs?.questionMap?.length || 0

  const localEvalInfo = {
    id: localEval.id,
    name: localEval.unit.name,
    year: localEval.year,
    score: localEval.totalScore,
    percentage: localEval.percentage,
    finalIpp: localEval.finalIppScore,
    filledCount: localFilledCount,
    totalIndicators: 31,
    menpanEvaluationId: localEval.menpanEvaluationId,
    isQuestionsMapped,
    questionsCount
  }

  if (!matchedRemote) {
    return {
      success: true,
      hasMatchedRemote: false,
      availableRemotes: remoteRes.data || [],
      localEval: localEvalInfo,
      isConfigured,
      localName: localEval.unit.name,
      message: 'Belum ditemukan pasangan evaluasi di portal MenPAN-RB. Silakan pilih secara manual.'
    }
  }

  // 3. Ambil remote answers untuk mendeteksi perbedaan (konflik)
  const answersRes = await MenpanApiService.getRemoteAnswers(matchedRemote.uuid)
  const remoteAnswers = answersRes.data || []

  return {
    success: true,
    hasMatchedRemote: true,
    matchedRemote,
    availableRemotes: remoteRes.data || [],
    localEval: localEvalInfo,
    isConfigured,
    remoteAnswersCount: remoteAnswers.length,
    hasConflict: Boolean(
      remoteAnswers.length > 0 &&
      (matchedRemote.status === 'Selesai' || matchedRemote.status === 'Sedang Diisi')
    )
  }
}

export async function linkEvaluationToMenpanAction(
  evaluationId: string,
  menpanUuid: string
) {
  try {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message:
          'Kredensial API MenPAN-RB belum dikonfigurasi di menu Pengaturan API. Harap tetapkan kredensial terlebih dahulu.'
      }
    }

    // Tarik struktur pertanyaan resmi dari MenPAN saat menautkan UUID
    const questionsRes = await MenpanApiService.getRemoteQuestions(menpanUuid)
    const questions = questionsRes.data || []

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        menpanEvaluationId: menpanUuid,
        syncLogs: {
          action: 'MANUAL_LINK_UUID',
          linkedAt: new Date().toISOString(),
          uuid: menpanUuid,
          questionsCount: questions.length,
          questionMap: questions.map((q) => ({
            id: q.id,
            index: q.index,
            name: q.name,
            bobot: q.bobot,
            is_required: q.is_required,
            option_type: q.option_type,
            options: q.options
          }))
        }
      }
    })
    revalidatePath('/admin/peserta')
    return {
      success: true,
      questionsCount: questions.length,
      message:
        questions.length > 0
          ? `Lokus berhasil ditautkan! ${questions.length} butir pertanyaan resmi MenPAN-RB berhasil dipetakan.`
          : 'Lokus berhasil ditautkan dengan UUID MenPAN-RB.'
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menautkan lokus.' }
  }
}

export async function syncAllLokusFromMenpanAction(year: number) {
  try {
    // 1. Ambil daftar remote evaluations resmi dari MenPAN
    const remoteRes = await MenpanApiService.getRemoteEvaluations(year)
    if (!remoteRes.success || !remoteRes.data) {
      return {
        success: false,
        message: remoteRes.message || 'Gagal mengambil data lokus dari server MenPAN-RB.'
      }
    }

    // 2. Ambil seluruh evaluasi lokal di tahun yang sama
    const localEvals = await db.evaluation.findMany({
      where: { year },
      include: { unit: true }
    })

    if (localEvals.length === 0) {
      return {
        success: false,
        message: `Tidak ada evaluasi unit lokal terdaftar di tahun ${year}.`
      }
    }

    let matchedCount = 0
    const questionsCache = new Map<number, any[]>() // Cache pertanyaan per form_sheet.id

    for (const localEval of localEvals) {
      const localName = localEval.unit.name.toLowerCase().trim()
      const matchedRemote = remoteRes.data.find((r) => {
        const remoteName = r.name.toLowerCase().trim()
        return (
          localName === remoteName ||
          localName.includes(remoteName) ||
          remoteName.includes(localName)
        )
      })

      if (matchedRemote) {
        let qList: any[] = []
        const fsId = matchedRemote.form_sheet?.id || 1

        if (questionsCache.has(fsId)) {
          qList = questionsCache.get(fsId)!
        } else {
          const qRes = await MenpanApiService.getRemoteQuestions(matchedRemote.uuid)
          if (qRes.success && qRes.data) {
            qList = qRes.data
            questionsCache.set(fsId, qList)
          }
        }

        await db.evaluation.update({
          where: { id: localEval.id },
          data: {
            menpanEvaluationId: matchedRemote.uuid,
            isPriority: Boolean(matchedRemote.is_priority),
            syncLogs: {
              action: 'AUTO_BATCH_LINK',
              linkedAt: new Date().toISOString(),
              uuid: matchedRemote.uuid,
              formSheet: matchedRemote.form_sheet,
              questionsCount: qList.length,
              questionMap: qList.map((q) => ({
                id: q.id,
                index: q.index,
                name: q.name,
                bobot: q.bobot,
                is_required: q.is_required,
                option_type: q.option_type,
                options: q.options
              }))
            }
          }
        })
        matchedCount++
      }
    }

    revalidatePath('/admin/peserta')
    return {
      success: true,
      matchedCount,
      totalRemote: remoteRes.data.length,
      message: `Berhasil menautkan otomatis ${matchedCount} dari ${localEvals.length} unit dengan lokus resmi MenPAN-RB!`
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal melakukan sinkronisasi massal lokus MenPAN.'
    }
  }
}

export async function pushEvaluationSyncAction(evaluationId: string) {
  // 1. First run validation
  const validation = await validateEvaluationForSync(evaluationId)
  if (!validation.isEligible) {
    return {
      success: false,
      message: `Validasi gagal: ${validation.errors.join(' ')}`
    }
  }

  // 2. Perform push
  const result = await MenpanApiService.pushEvaluation(evaluationId)
  revalidatePath('/admin/peserta')
  revalidatePath(`/evaluasi/${evaluationId}`)
  return result
}

export interface ReconciliationRowItem {
  remoteUuid: string
  remoteName: string
  remoteYear: number
  remoteStatus: string
  isPriority: boolean
  formSheetName?: string
  progressPercentage?: number
  status: 'ALREADY_BOUND' | 'EXACT_MATCH' | 'SUGGESTED_MATCH' | 'UNMATCHED'
  matchScore: number
  evaluationId?: string | null
  unitId?: string | null
  unitName?: string | null
  unitCategoryName?: string | null
  isEnrolled: boolean
  suggestedUnitId?: string | null
  suggestedUnitName?: string | null
}

export interface BulkReconciliationEntry {
  remoteUuid: string
  remoteName: string
  formSheetName?: string
  isPriority?: boolean
  unitId: string // UUID lokus lokal, 'CREATE_NEW', atau 'SKIP'
  newUnitName?: string
  newUnitCategoryId?: string
}

function computeSimilarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  if (s1 === s2) return 1.0

  const n1 = s1.replace(/[^a-z0-9]/g, '')
  const n2 = s2.replace(/[^a-z0-9]/g, '')
  if (n1 === n2 && n1.length > 0) return 0.98
  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length)
    const maxLen = Math.max(n1.length, n2.length)
    if (minLen / maxLen >= 0.5) return 0.9
  }

  // Token based overlap
  const words1 = s1.split(/\s+/).filter((w) => w.length > 1)
  const words2 = s2.split(/\s+/).filter((w) => w.length > 1)
  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  for (const w1 of words1) {
    if (words2.some((w2) => w2 === w1 || w2.includes(w1) || w1.includes(w2))) {
      matches++
    }
  }
  const score = (2 * matches) / (words1.length + words2.length)
  return Math.min(score, 0.88)
}

export async function getMenpanReconciliationDataAction(year: number) {
  try {
    const config = await getMenpanApiConfig()
    const isConfigured = Boolean(config.baseUrl && config.apiKey)

    if (!isConfigured) {
      return {
        success: false,
        year,
        isConfigured: false,
        message:
          'Kredensial API MenPAN-RB (Base URL & Bearer Token) belum ditetapkan di Pengaturan API. Harap tentukan kredensial terlebih dahulu (baik untuk server Sandbox resmi MenPAN maupun Production).',
        allUnits: [],
        rows: []
      }
    }

    // 1. Ambil seluruh unit Master Lokus
    const allUnits = await db.unit.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    })

    // 2. Ambil evaluasi lokal yang sudah terdaftar di tahun ini
    const localEvals = await db.evaluation.findMany({
      where: { year },
      include: {
        unit: {
          include: { category: true }
        }
      }
    })

    // 3. Ambil daftar lokus resmi dari MenPAN untuk tahun ini
    const remoteRes = await MenpanApiService.getRemoteEvaluations(year)
    if (!remoteRes.success || !remoteRes.data) {
      return {
        success: false,
        message: remoteRes.message || 'Gagal memuat daftar lokus dari server MenPAN-RB.',
        isConfigured,
        allUnits: [],
        rows: []
      }
    }

    const remoteList = remoteRes.data
    const rows: ReconciliationRowItem[] = []

    // Map evaluasi lokal berdasarkan menpanEvaluationId & unitId
    const boundByUuid = new Map<string, (typeof localEvals)[0]>()
    localEvals.forEach((ev) => {
      if (ev.menpanEvaluationId) {
        boundByUuid.set(ev.menpanEvaluationId, ev)
      }
    })

    for (const remote of remoteList) {
      const alreadyBound = boundByUuid.get(remote.uuid)

      if (alreadyBound) {
        rows.push({
          remoteUuid: remote.uuid,
          remoteName: remote.name,
          remoteYear: remote.year,
          remoteStatus: remote.status,
          isPriority: Boolean(remote.is_priority),
          formSheetName: remote.form_sheet?.name,
          progressPercentage: remote.progress_percentage,
          status: 'ALREADY_BOUND',
          matchScore: 100,
          evaluationId: alreadyBound.id,
          unitId: alreadyBound.unitId,
          unitName: alreadyBound.unit.name,
          unitCategoryName: alreadyBound.unit.category?.name,
          isEnrolled: true,
          suggestedUnitId: alreadyBound.unitId,
          suggestedUnitName: alreadyBound.unit.name
        })
        continue
      }

      // Jika belum terikat secara pasti lewat UUID, cari kemiripan terbaik dengan Master Lokus
      let bestUnit: (typeof allUnits)[0] | null = null
      let bestScore = 0

      for (const unit of allUnits) {
        const score = computeSimilarityScore(remote.name, unit.name)
        if (score > bestScore) {
          bestScore = score
          bestUnit = unit
        }
      }

      const matchScorePct = Math.round(bestScore * 100)
      const isExact = matchScorePct >= 95
      const isSuggested = matchScorePct >= 50

      const enrolledEval = bestUnit
        ? localEvals.find((ev) => ev.unitId === bestUnit!.id)
        : null

      rows.push({
        remoteUuid: remote.uuid,
        remoteName: remote.name,
        remoteYear: remote.year,
        remoteStatus: remote.status,
        isPriority: Boolean(remote.is_priority),
        formSheetName: remote.form_sheet?.name,
        progressPercentage: remote.progress_percentage,
        status: isExact ? 'EXACT_MATCH' : isSuggested ? 'SUGGESTED_MATCH' : 'UNMATCHED',
        matchScore: matchScorePct,
        evaluationId: enrolledEval?.id || null,
        unitId: isExact ? bestUnit?.id : null,
        unitName: isExact ? bestUnit?.name : null,
        unitCategoryName: isExact ? bestUnit?.category?.name : null,
        isEnrolled: Boolean(enrolledEval),
        suggestedUnitId: isSuggested ? bestUnit?.id : null,
        suggestedUnitName: isSuggested ? bestUnit?.name : null
      })
    }

    return {
      success: true,
      year,
      isConfigured,
      allUnits: allUnits.map((u) => ({
        id: u.id,
        name: u.name,
        categoryId: u.categoryId,
        category: u.category ? { id: u.category.id, name: u.category.name } : null
      })),
      rows
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat memuat data rekonsiliasi.',
      isConfigured: false,
      allUnits: [],
      rows: []
    }
  }
}

export async function saveMenpanBulkReconciliationAction(data: {
  year: number
  entries: BulkReconciliationEntry[]
}) {
  try {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message:
          'Kredensial API MenPAN-RB belum dikonfigurasi. Harap tentukan Base URL dan Bearer Token terlebih dahulu di menu Pengaturan API.'
      }
    }

    const { year, entries } = data
    if (!entries || entries.length === 0) {
      return { success: false, message: 'Tidak ada baris rekonsiliasi yang dipilih.' }
    }

    let linkedCount = 0
    let createdUnitsCount = 0
    const questionsCache = new Map<string, any[]>() // cache remote questions per form_sheet name/uuid

    for (const entry of entries) {
      if (!entry.unitId || entry.unitId === 'SKIP') {
        // Jika disetel lewati, jika sebelumnya ada yang terikat ke UUID ini di tahun ini, lepaskan
        const existing = await db.evaluation.findFirst({
          where: { year, menpanEvaluationId: entry.remoteUuid }
        })
        if (existing) {
          await db.evaluation.update({
            where: { id: existing.id },
            data: {
              menpanEvaluationId: null,
              menpanEvaluationName: null,
              menpanFormSheetName: null,
              syncStatus: 'IDLE'
            }
          })
        }
        continue
      }

      let targetUnitId = entry.unitId

      // Kasus: User memilih buat Unit Baru di Master Lokus
      if (entry.unitId === 'CREATE_NEW') {
        const targetName = entry.newUnitName?.trim() || entry.remoteName.trim()
        let existingUnit = await db.unit.findFirst({
          where: { name: { equals: targetName, mode: 'insensitive' } }
        })

        if (!existingUnit) {
          existingUnit = await db.unit.create({
            data: {
              name: targetName,
              categoryId: entry.newUnitCategoryId || undefined
            }
          })
          createdUnitsCount++
        }
        targetUnitId = existingUnit.id
      }

      // Ambil pertanyaan dari MenPAN untuk lokus ini jika belum ada di cache
      let qList: any[] = []
      const cacheKey = entry.formSheetName || entry.remoteUuid
      if (questionsCache.has(cacheKey)) {
        qList = questionsCache.get(cacheKey)!
      } else {
        const qRes = await MenpanApiService.getRemoteQuestions(entry.remoteUuid)
        if (qRes.success && qRes.data) {
          qList = qRes.data
          questionsCache.set(cacheKey, qList)
        }
      }

      // Cari atau buat Evaluation record
      const existingEval = await db.evaluation.findUnique({
        where: {
          year_unitId: {
            year,
            unitId: targetUnitId
          }
        }
      })

      const syncLogsData = {
        action: 'RECONCILIATION_BULK_LINK',
        linkedAt: new Date().toISOString(),
        remoteUuid: entry.remoteUuid,
        remoteName: entry.remoteName,
        formSheetName: entry.formSheetName,
        questionsCount: qList.length,
        questionMap: qList.map((q) => ({
          id: q.id,
          index: q.index,
          name: q.name,
          bobot: q.bobot,
          is_required: q.is_required,
          option_type: q.option_type,
          options: q.options
        }))
      }

      if (existingEval) {
        await db.evaluation.update({
          where: { id: existingEval.id },
          data: {
            menpanEvaluationId: entry.remoteUuid,
            menpanEvaluationName: entry.remoteName,
            menpanFormSheetName: entry.formSheetName,
            isPriority: Boolean(entry.isPriority),
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
            syncLogs: syncLogsData
          }
        })
      } else {
        await db.evaluation.create({
          data: {
            year,
            unitId: targetUnitId,
            menpanEvaluationId: entry.remoteUuid,
            menpanEvaluationName: entry.remoteName,
            menpanFormSheetName: entry.formSheetName,
            isPriority: Boolean(entry.isPriority),
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
            syncLogs: syncLogsData
          }
        })
      }

      linkedCount++
    }

    revalidatePath(`/admin/periode/${year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')

    let msg = `Berhasil merekonsiliasi ${linkedCount} lokus dengan portal MenPAN-RB.`
    if (createdUnitsCount > 0) {
      msg += ` (${createdUnitsCount} unit baru otomatis ditambahkan ke Master Lokus)`
    }

    return {
      success: true,
      linkedCount,
      createdUnitsCount,
      message: msg
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menyimpan rekonsiliasi lokus MenPAN.'
    }
  }
}

export async function unbindEvaluationFromMenpanAction(evaluationId: string) {
  try {
    const updated = await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        menpanEvaluationId: null,
        menpanEvaluationName: null,
        menpanFormSheetName: null,
        syncStatus: 'IDLE'
      }
    })
    revalidatePath(`/admin/periode/${updated.year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    return {
      success: true,
      message: 'Tautan lokus dengan portal MenPAN-RB berhasil dilepaskan.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal melepaskan tautan lokus.'
    }
  }
}
