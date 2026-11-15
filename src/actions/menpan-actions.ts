'use server'

import { getMenpanApiConfig, saveMenpanApiConfig, MenpanApiConfig } from '../services/system-setting-service'
import {
  MenpanApiService,
  MenpanEvaluationItem,
  MenpanFormBindingInfo,
  PekpppFormCode,
  PEKPPP_FORM_CODES,
  normalizePekpppFormCode,
  MENPAN_BAP_SECTION_CONFIG,
  MenpanBapSectionItem,
  MenpanBapSignerItem,
  MenpanBapSigningLinks
} from '../services/menpan-api-service'
import { validateEvaluationForSync } from '../services/sync-validator-service'
import { requireSuperAdmin } from '../services/auth-guard'
import { ActivityLogService } from '../services/activity-log-service'
import { db } from '../services/db'
import { revalidatePath } from 'next/cache'

export interface RemoteFormEntry {
  formCode: PekpppFormCode
  uuid: string
  formSheetId?: number
  formSheetName: string
  remoteStatus?: string
  progressPercentage?: number
}

export interface GroupedRemoteLokus {
  remoteKey: string
  primaryUuid: string
  remoteName: string
  remoteYear: number
  remoteStatus: string
  isPriority: boolean
  formSheetName: string
  forms: Partial<Record<PekpppFormCode, RemoteFormEntry>>
  formsList: RemoteFormEntry[]
}

/**
 * Mengelompokkan daftar evaluasi MenPAN-RB (F01, F02, F03) berdasarkan nama lokus
 * sehingga 1 lokus (misal "KECAMATAN BARONG TONGKOK") menjadi 1 paket utuh berisi 3 UUID (F01, F02, F03).
 */
function groupRemoteEvaluationsByLokus(items: MenpanEvaluationItem[]): GroupedRemoteLokus[] {
  const map = new Map<string, GroupedRemoteLokus>()

  for (const item of items) {
    const formCode = normalizePekpppFormCode(item.form_sheet?.name, item.form_sheet?.id)
    if (!formCode) continue // Eksklusi form non-PEKPPP (seperti Kelompok Rentan)

    const cleanName = (item.name || '').trim()
    const normKey = cleanName.toUpperCase().replace(/\s+/g, ' ')

    if (!map.has(normKey)) {
      map.set(normKey, {
        remoteKey: normKey,
        primaryUuid: item.uuid,
        remoteName: cleanName,
        remoteYear: Number(item.year) || new Date().getFullYear(),
        remoteStatus: item.status || 'Belum Diisi',
        isPriority: Boolean(item.is_priority),
        formSheetName: formCode,
        forms: {},
        formsList: []
      })
    }

    const group = map.get(normKey)!
    if (item.is_priority) group.isPriority = true
    if (item.status && item.status !== 'Belum Diisi') {
      group.remoteStatus = item.status
    }

    group.forms[formCode] = {
      formCode,
      uuid: item.uuid,
      formSheetId: item.form_sheet?.id,
      formSheetName: item.form_sheet?.name || formCode,
      remoteStatus: item.status,
      progressPercentage: item.progress_percentage
    }
  }

  const result: GroupedRemoteLokus[] = []
  for (const group of map.values()) {
    const ordered: RemoteFormEntry[] = []
    for (const code of PEKPPP_FORM_CODES) {
      if (group.forms[code]) {
        ordered.push(group.forms[code]!)
      }
    }
    group.formsList = ordered
    group.primaryUuid =
      group.forms.F02?.uuid ||
      group.forms.F01?.uuid ||
      group.forms.F03?.uuid ||
      group.primaryUuid
    group.formSheetName = ordered.map((f) => f.formCode).join(' · ')
    result.push(group)
  }

  return result
}

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

  // 2. Ambil daftar remote evaluations PEKPPP (F01, F02, F03) dari MenPAN
  const remoteRes = await MenpanApiService.getRemoteEvaluations(localEval.year)
  if (!remoteRes.success || !remoteRes.data) {
    return {
      success: false,
      message: remoteRes.message || 'Gagal mengambil data evaluasi dari server MenPAN-RB.'
    }
  }

  const groupedRemotes = groupRemoteEvaluationsByLokus(remoteRes.data)
  const syncLogs = (localEval.syncLogs as any) || {}
  const storedForms = (syncLogs.forms || {}) as Partial<
    Record<PekpppFormCode, MenpanFormBindingInfo>
  >

  // Kumpulkan semua UUID yang saat ini terikat pada evaluasi lokal ini
  const localBoundUuids = new Set<string>()
  if (localEval.menpanEvaluationId) localBoundUuids.add(localEval.menpanEvaluationId)
  for (const code of PEKPPP_FORM_CODES) {
    if (storedForms[code]?.uuid) localBoundUuids.add(storedForms[code]!.uuid)
  }

  // Cari paket lokus remote yang cocok berdasarkan UUID terikat atau kemiripan nama unit
  const matchedGroup =
    localBoundUuids.size > 0
      ? groupedRemotes.find((g) => g.formsList.some((f) => localBoundUuids.has(f.uuid)))
      : groupedRemotes.find((g) => {
          const localName = localEval.unit.name.toLowerCase().trim()
          const remoteName = g.remoteName.toLowerCase().trim()
          return (
            localName === remoteName ||
            localName.includes(remoteName) ||
            remoteName.includes(localName)
          )
        })

  const localFilledCount = localEval.scores.filter(
    (s) => s.score !== null || s.f01Submitted
  ).length

  const boundFormsSummary = PEKPPP_FORM_CODES.map((code) => {
    const stored = storedForms[code]
    const matchedForm = matchedGroup?.forms[code]
    return {
      formCode: code,
      uuid: stored?.uuid || matchedForm?.uuid || null,
      isBound: Boolean(stored?.uuid || (matchedForm && localBoundUuids.has(matchedForm.uuid))),
      questionsCount:
        stored?.questionsCount ||
        stored?.questionMap?.length ||
        (code === 'F01' ? 90 : code === 'F02' ? 31 : 14),
      isQuestionsMapped: Boolean(stored?.questionMap && stored.questionMap.length > 0),
      syncStatus: stored?.syncStatus || 'IDLE',
      syncedAt: stored?.syncedAt || null
    }
  })

  const isQuestionsMapped =
    boundFormsSummary.some((f) => f.isQuestionsMapped) ||
    Boolean(syncLogs?.questionMap && syncLogs.questionMap.length > 0)
  const questionsCount =
    boundFormsSummary.find((f) => f.formCode === 'F02')?.questionsCount ||
    syncLogs?.questionsCount ||
    syncLogs?.questionMap?.length ||
    31

  let latestScoreUpdate = localEval.updatedAt
  for (const s of localEval.scores) {
    if (s.updatedAt && s.updatedAt > latestScoreUpdate) {
      latestScoreUpdate = s.updatedAt
    }
  }

  const lastPushedAt =
    syncLogs.lastPushedAt ||
    (syncLogs.syncedAt && syncLogs.lastPushedForms ? syncLogs.syncedAt : null)
  const lastPulledAt = syncLogs.lastPulledAt || null
  const lastSyncDirection =
    syncLogs.lastSyncDirection ||
    (lastPulledAt && !lastPushedAt ? 'PULL' : lastPushedAt ? 'PUSH' : null)
  const lastPullSummary = syncLogs.lastPullSummary || null
  const lastPushSummary = syncLogs.lastPushSummary || null
  const localUpdatedAt = latestScoreUpdate ? latestScoreUpdate.toISOString() : null

  let freshnessStatus: 'PULL_FRESH' | 'PUSH_FRESH' | 'LOCAL_MODIFIED' | 'NEVER_SYNCED' =
    'NEVER_SYNCED'
  let freshnessLabel = 'Belum Pernah Disinkronkan'
  let freshnessDescription =
    'Evaluasi lokal ini belum pernah ditarik (PULL) maupun dikirim (PUSH) ke server MenPAN-RB.'

  if (lastPushedAt || lastPulledAt) {
    const pushTime = lastPushedAt ? new Date(lastPushedAt).getTime() : 0
    const pullTime = lastPulledAt ? new Date(lastPulledAt).getTime() : 0
    const editTime = latestScoreUpdate ? new Date(latestScoreUpdate).getTime() : 0
    const lastSyncTime = Math.max(pushTime, pullTime)

    if (editTime > lastSyncTime + 5000) {
      freshnessStatus = 'LOCAL_MODIFIED'
      freshnessLabel = 'Data Lokal Lebih Baru (Ada Perubahan)'
      freshnessDescription =
        'Terdapat perubahan skor atau isian di sistem lokal setelah sinkronisasi terakhir. Lakukan PUSH jika ingin mengirim pembaruan ini ke MenPAN-RB.'
    } else if (pullTime >= pushTime) {
      freshnessStatus = 'PULL_FRESH'
      freshnessLabel = 'Selaras (Hasil PULL MenPAN-RB)'
      freshnessDescription =
        'Data lokal saat ini adalah hasil tarikan (PULL) terbaru langsung dari portal MenPAN-RB.'
    } else {
      freshnessStatus = 'PUSH_FRESH'
      freshnessLabel = 'Selaras (Hasil PUSH ke MenPAN-RB)'
      freshnessDescription =
        'Data lokal saat ini telah berhasil dikirimkan (PUSH) dan tersimpan di portal MenPAN-RB.'
    }
  }

  const syncMeta = {
    lastPushedAt,
    lastPulledAt,
    lastSyncDirection,
    lastPullSummary,
    lastPushSummary,
    localUpdatedAt,
    freshnessStatus,
    freshnessLabel,
    freshnessDescription
  }

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
    menpanFormSheetName: localEval.menpanFormSheetName,
    isQuestionsMapped,
    questionsCount,
    boundForms: boundFormsSummary,
    updatedAt: localUpdatedAt
  }

  // Bentuk daftar pilihan lokus terkelompok untuk dropdown (95 lokus, bukan 380 baris duplikat)
  const availableRemotes = groupedRemotes.map((g) => ({
    uuid: g.primaryUuid,
    name: g.remoteName,
    year: g.remoteYear,
    status: g.remoteStatus,
    is_priority: g.isPriority,
    form_sheet: {
      id: 2,
      name: g.formSheetName
    },
    forms: g.formsList
  }))

  if (!matchedGroup) {
    return {
      success: true,
      hasMatchedRemote: false,
      availableRemotes,
      localEval: localEvalInfo,
      syncMeta,
      isConfigured,
      localName: localEval.unit.name,
      message:
        'Belum ditemukan pasangan evaluasi di portal MenPAN-RB. Silakan pilih secara manual.'
    }
  }

  // Ambil detail dan jawaban untuk form utama (F02 atau primaryUuid)
  const targetCheckUuid = matchedGroup.forms.F02?.uuid || matchedGroup.primaryUuid
  const [detailRes, answersRes] = await Promise.all([
    MenpanApiService.getRemoteEvaluationDetail(targetCheckUuid),
    MenpanApiService.getRemoteAnswers(targetCheckUuid)
  ])

  const remoteDetail = detailRes.data
  const remoteAnswers = answersRes.data || []
  const effectiveStatus = remoteDetail?.status || matchedGroup.remoteStatus || 'Belum Diisi'

  const matchedRemote = {
    uuid: matchedGroup.primaryUuid,
    name: matchedGroup.remoteName,
    year: matchedGroup.remoteYear,
    status: effectiveStatus,
    is_priority: matchedGroup.isPriority,
    progress_percentage: remoteDetail?.progress_percentage,
    remoteUpdatedAt: (remoteDetail as any)?.updated_at || null,
    form_sheet: {
      id: 2,
      name: matchedGroup.formSheetName
    },
    forms: matchedGroup.formsList
  }

  return {
    success: true,
    hasMatchedRemote: true,
    matchedRemote,
    availableRemotes,
    localEval: localEvalInfo,
    syncMeta,
    isConfigured,
    remoteAnswersCount: remoteAnswers.length,
    hasConflict: Boolean(
      remoteAnswers.length > 0 &&
        (effectiveStatus === 'Selesai' || effectiveStatus === 'Sedang Diisi')
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

    const localEval = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: { unit: true }
    })
    if (!localEval) {
      return { success: false, message: 'Evaluasi lokal tidak ditemukan.' }
    }

    // Cari seluruh form PEKPPP (F01, F02, F03) milik lokus remote yang dipilih
    const remoteRes = await MenpanApiService.getRemoteEvaluations(localEval.year)
    const grouped = remoteRes.data ? groupRemoteEvaluationsByLokus(remoteRes.data) : []
    const matchedGroup = grouped.find(
      (g) =>
        g.primaryUuid === menpanUuid ||
        g.formsList.some((f) => f.uuid === menpanUuid)
    )

    const existingLogs = ((localEval.syncLogs as any) || {}) as Record<string, any>
    const formsMap: Partial<Record<PekpppFormCode, MenpanFormBindingInfo>> = {}
    let totalQuestionsMapped = 0

    if (matchedGroup) {
      for (const formEntry of matchedGroup.formsList) {
        const qRes = await MenpanApiService.getRemoteQuestions(formEntry.uuid)
        const qList = qRes.data || []
        totalQuestionsMapped += qList.length

        formsMap[formEntry.formCode] = {
          formCode: formEntry.formCode,
          uuid: formEntry.uuid,
          remoteName: matchedGroup.remoteName,
          formSheetId: formEntry.formSheetId,
          formSheetName: formEntry.formSheetName,
          questionsCount: qList.length,
          questionMap: qList.map((q) => ({
            id: q.id,
            index: q.index,
            name: q.name,
            bobot: q.bobot,
            is_required: q.is_required,
            option_type: q.option_type,
            options: q.options
          })),
          syncStatus: existingLogs?.forms?.[formEntry.formCode]?.syncStatus || 'IDLE',
          syncedAt: existingLogs?.forms?.[formEntry.formCode]?.syncedAt || null
        }
      }
    } else {
      const questionsRes = await MenpanApiService.getRemoteQuestions(menpanUuid)
      const qList = questionsRes.data || []
      totalQuestionsMapped = qList.length
      formsMap.F02 = {
        formCode: 'F02',
        uuid: menpanUuid,
        remoteName: localEval.unit.name,
        formSheetName: 'F02',
        questionsCount: qList.length,
        questionMap: qList,
        syncStatus: 'IDLE'
      }
    }

    const primaryBinding = formsMap.F02 || formsMap.F01 || formsMap.F03
    const primaryUuid = primaryBinding?.uuid || menpanUuid
    const remoteName = matchedGroup?.remoteName || localEval.menpanEvaluationName || localEval.unit.name
    const joinedFormNames = matchedGroup?.formSheetName || 'F01 · F02 · F03'

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        menpanEvaluationId: primaryUuid,
        menpanEvaluationName: remoteName,
        menpanFormSheetName: joinedFormNames,
        isPriority: matchedGroup ? matchedGroup.isPriority : localEval.isPriority,
        syncLogs: {
          ...existingLogs,
          action: 'MANUAL_LINK_UUID',
          linkedAt: new Date().toISOString(),
          uuid: primaryUuid,
          remoteName,
          formSheetName: joinedFormNames,
          questionsCount: primaryBinding?.questionsCount || 31,
          questionMap: primaryBinding?.questionMap || [],
          forms: formsMap
        }
      }
    })

    await ActivityLogService.log({
      category: 'SYNC_MENPAN',
      action: 'SYNC_LINK_UUID',
      description: `Admin menautkan lokus "${localEval.unit.name}" dengan evaluasi MenPAN-RB "${remoteName}" (${primaryUuid}).`,
      unitId: localEval.unitId,
      unitName: localEval.unit.name,
      evaluationId,
      metadata: {
        primaryUuid,
        remoteName,
        formSheetName: joinedFormNames
      }
    })

    revalidatePath('/admin/peserta')
    revalidatePath('/admin/lokus')
    revalidatePath(`/admin/periode/${localEval.year}`)

    const boundCodes = Object.keys(formsMap).join(', ')
    return {
      success: true,
      questionsCount: totalQuestionsMapped,
      message: `Lokus berhasil ditautkan untuk form [${boundCodes}] (${totalQuestionsMapped} total butir pertanyaan resmi MenPAN-RB berhasil dipetakan).`
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menautkan lokus.' }
  }
}

export async function syncAllLokusFromMenpanAction(year: number) {
  try {
    // 1. Ambil seluruh halaman remote evaluations PEKPPP (F01, F02, F03) dari MenPAN
    const remoteRes = await MenpanApiService.getRemoteEvaluations(year)
    if (!remoteRes.success || !remoteRes.data) {
      return {
        success: false,
        message: remoteRes.message || 'Gagal mengambil data lokus dari server MenPAN-RB.'
      }
    }

    const groupedRemotes = groupRemoteEvaluationsByLokus(remoteRes.data)

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
    const questionsCache = new Map<PekpppFormCode, any[]>()

    for (const localEval of localEvals) {
      const localName = localEval.unit.name.toLowerCase().trim()
      const matchedGroup = groupedRemotes.find((g) => {
        const remoteName = g.remoteName.toLowerCase().trim()
        return (
          localName === remoteName ||
          localName.includes(remoteName) ||
          remoteName.includes(localName)
        )
      })

      if (matchedGroup) {
        const existingLogs = ((localEval.syncLogs as any) || {}) as Record<string, any>
        const formsMap: Partial<Record<PekpppFormCode, MenpanFormBindingInfo>> = {}

        for (const formEntry of matchedGroup.formsList) {
          let qList: any[] = []
          if (questionsCache.has(formEntry.formCode)) {
            qList = questionsCache.get(formEntry.formCode)!
          } else {
            const qRes = await MenpanApiService.getRemoteQuestions(formEntry.uuid)
            if (qRes.success && qRes.data) {
              qList = qRes.data.map((q) => ({
                id: q.id,
                index: q.index,
                name: q.name,
                bobot: q.bobot,
                is_required: q.is_required,
                option_type: q.option_type,
                options: q.options
              }))
              questionsCache.set(formEntry.formCode, qList)
            }
          }

          formsMap[formEntry.formCode] = {
            formCode: formEntry.formCode,
            uuid: formEntry.uuid,
            remoteName: matchedGroup.remoteName,
            formSheetId: formEntry.formSheetId,
            formSheetName: formEntry.formSheetName,
            questionsCount: qList.length,
            questionMap: qList,
            syncStatus: existingLogs?.forms?.[formEntry.formCode]?.syncStatus || 'IDLE',
            syncedAt: existingLogs?.forms?.[formEntry.formCode]?.syncedAt || null
          }
        }

        const primaryBinding = formsMap.F02 || formsMap.F01 || formsMap.F03

        await db.evaluation.update({
          where: { id: localEval.id },
          data: {
            menpanEvaluationId: primaryBinding?.uuid || matchedGroup.primaryUuid,
            menpanEvaluationName: matchedGroup.remoteName,
            menpanFormSheetName: matchedGroup.formSheetName,
            isPriority: Boolean(matchedGroup.isPriority),
            syncLogs: {
              ...existingLogs,
              action: 'AUTO_BATCH_LINK',
              linkedAt: new Date().toISOString(),
              uuid: primaryBinding?.uuid || matchedGroup.primaryUuid,
              remoteName: matchedGroup.remoteName,
              formSheetName: matchedGroup.formSheetName,
              questionsCount: primaryBinding?.questionsCount || 31,
              questionMap: primaryBinding?.questionMap || [],
              forms: formsMap
            }
          }
        })
        matchedCount++
      }
    }

    revalidatePath('/admin/peserta')
    revalidatePath('/admin/lokus')
    revalidatePath(`/admin/periode/${year}`)

    return {
      success: true,
      matchedCount,
      totalRemote: groupedRemotes.length,
      message: `Berhasil menautkan otomatis ${matchedCount} dari ${localEvals.length} unit dengan paket lokus PEKPPP (F01, F02, F03) MenPAN-RB!`
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal melakukan sinkronisasi massal lokus MenPAN.'
    }
  }
}

export async function pushEvaluationSyncAction(
  evaluationId: string,
  targetForm: PekpppFormCode | 'ALL' = 'ALL'
) {
  // 1. Jalankan validasi kelengkapan sesuai target form yang akan dikirim
  const validation = await validateEvaluationForSync(evaluationId)

  if (targetForm === 'F01' && !validation.f01Complete) {
    return {
      success: false,
      message: `Validasi F-01 gagal: F-01 Mandiri OPD belum lengkap (${validation.f01FilledCount}/31 indikator terisi).`
    }
  }
  if (targetForm === 'F02' && !validation.f02Complete) {
    return {
      success: false,
      message: `Validasi F-02 gagal: F-02 Penilaian Evaluator belum lengkap (${validation.f02FilledCount}/31 indikator dinilai).`
    }
  }
  if (targetForm === 'F03' && !validation.f03Complete) {
    return {
      success: false,
      message: `Validasi F-03 gagal: Kuota responden survei belum terpenuhi (${validation.f03FilledCount}/${validation.targetQuota} responden).`
    }
  }
  if (targetForm === 'ALL' && !validation.isEligible) {
    return {
      success: false,
      message: `Validasi gagal: ${validation.errors.join(' ')}`
    }
  }

  // 2. Eksekusi push ke MenPAN-RB
  const result = await MenpanApiService.pushEvaluation(evaluationId, targetForm)

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    select: { unitId: true, year: true, unit: { select: { name: true } } }
  })

  await ActivityLogService.log({
    category: 'SYNC_MENPAN',
    action: 'SYNC_PUSH',
    description: `Admin mengirimkan hasil penilaian (${targetForm}) lokus "${evaluation?.unit.name || evaluationId}" ke server MenPAN-RB. Hasil: ${result.success ? 'Berhasil (202 Queued)' : 'Sebagian/Gagal'}.`,
    unitId: evaluation?.unitId,
    unitName: evaluation?.unit.name,
    evaluationId,
    metadata: {
      targetForm,
      success: result.success,
      message: result.message
    }
  })

  revalidatePath('/admin/peserta')
  revalidatePath(`/evaluasi/${evaluationId}`)
  return result
}

/**
 * PULL SERVER ACTION: Menarik data jawaban dari server MenPAN-RB ke database lokal Kutai Barat.
 * Hanya dapat dieksekusi oleh SUPER_ADMIN.
 */
export async function pullEvaluationAnswersFromMenpanAction(
  evaluationId: string,
  targetForm: PekpppFormCode | 'ALL' = 'ALL'
) {
  await requireSuperAdmin()
  const result = await MenpanApiService.pullEvaluation(evaluationId, targetForm)

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    select: { unitId: true, year: true, unit: { select: { name: true } } }
  })

  await ActivityLogService.log({
    category: 'SYNC_MENPAN',
    action: 'SYNC_PULL',
    description: `Admin menarik jawaban MenPAN-RB (${targetForm}) untuk lokus "${evaluation?.unit.name || evaluationId}". Hasil: ${result.success ? 'Berhasil ditarik & direkalkulasi' : 'Gagal'}.`,
    unitId: evaluation?.unitId,
    unitName: evaluation?.unit.name,
    evaluationId,
    metadata: {
      targetForm,
      success: result.success,
      newScore: result.newScore,
      newIpp: result.newIpp
    }
  })

  if (evaluation?.unitId) {
    revalidatePath(`/evaluasi/${evaluation.unitId}`)
    revalidatePath(`/evaluasi/${evaluation.unitId}/berita-acara`)
  }
  if (evaluation?.year) {
    revalidatePath(`/admin/periode/${evaluation.year}`)
  }
  revalidatePath('/admin/peserta')

  return result
}

export interface ReconciliationRowItem {
  remoteUuid: string
  remoteName: string
  remoteYear: number
  remoteStatus: string
  isPriority: boolean
  formSheetName?: string
  forms?: RemoteFormEntry[]
  boundFormsCount?: number
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
  forms?: RemoteFormEntry[]
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

    // 3. Ambil seluruh halaman daftar evaluasi PEKPPP (F01, F02, F03) dari MenPAN untuk tahun ini
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

    // 4. Kelompokkan 285 baris evaluasi menjadi 95 baris unik per Lokus (F01 + F02 + F03)
    const groupedLokusList = groupRemoteEvaluationsByLokus(remoteRes.data)
    const rows: ReconciliationRowItem[] = []

    // Peta evaluasi lokal berdasarkan seluruh UUID yang terikat (baik menpanEvaluationId maupun syncLogs.forms)
    const boundByUuid = new Map<string, (typeof localEvals)[0]>()
    localEvals.forEach((ev) => {
      if (ev.menpanEvaluationId) {
        boundByUuid.set(ev.menpanEvaluationId, ev)
      }
      const logs = (ev.syncLogs as any) || {}
      const forms = logs.forms || {}
      for (const code of PEKPPP_FORM_CODES) {
        if (forms[code]?.uuid) {
          boundByUuid.set(forms[code].uuid, ev)
        }
      }
    })

    for (const group of groupedLokusList) {
      const matchedEval = group.formsList
        .map((f) => boundByUuid.get(f.uuid))
        .find((ev) => Boolean(ev))

      if (matchedEval) {
        const logs = (matchedEval.syncLogs as any) || {}
        const storedForms = logs.forms || {}
        const boundCount = group.formsList.filter(
          (f) =>
            storedForms[f.formCode]?.uuid === f.uuid ||
            matchedEval.menpanEvaluationId === f.uuid
        ).length

        rows.push({
          remoteUuid: group.primaryUuid,
          remoteName: group.remoteName,
          remoteYear: group.remoteYear,
          remoteStatus: group.remoteStatus,
          isPriority: group.isPriority,
          formSheetName: group.formSheetName,
          forms: group.formsList,
          boundFormsCount: boundCount,
          status: 'ALREADY_BOUND',
          matchScore: 100,
          evaluationId: matchedEval.id,
          unitId: matchedEval.unitId,
          unitName: matchedEval.unit.name,
          unitCategoryName: matchedEval.unit.category?.name,
          isEnrolled: true,
          suggestedUnitId: matchedEval.unitId,
          suggestedUnitName: matchedEval.unit.name
        })
        continue
      }

      // Jika belum terikat lewat UUID, cari kemiripan terbaik dengan Master Lokus
      let bestUnit: (typeof allUnits)[0] | null = null
      let bestScore = 0

      for (const unit of allUnits) {
        const score = computeSimilarityScore(group.remoteName, unit.name)
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
        remoteUuid: group.primaryUuid,
        remoteName: group.remoteName,
        remoteYear: group.remoteYear,
        remoteStatus: group.remoteStatus,
        isPriority: group.isPriority,
        formSheetName: group.formSheetName,
        forms: group.formsList,
        boundFormsCount: 0,
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
    // Cache pertanyaan per kode form ('F01' | 'F02' | 'F03') agar hanya memanggil maksimal 3 request ke server MenPAN
    const questionsCache = new Map<string, any[]>()

    for (const entry of entries) {
      const entryUuids = [
        entry.remoteUuid,
        ...(entry.forms?.map((f) => f.uuid) || [])
      ].filter(Boolean)

      if (!entry.unitId || entry.unitId === 'SKIP') {
        const existing = await db.evaluation.findFirst({
          where: {
            year,
            menpanEvaluationId: { in: entryUuids }
          }
        })
        if (existing) {
          await db.evaluation.update({
            where: { id: existing.id },
            data: {
              menpanEvaluationId: null,
              menpanEvaluationName: null,
              menpanFormSheetName: null,
              syncStatus: 'IDLE',
              syncLogs: {}
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

      // Cari existing Evaluation jika sudah ada
      const existingEval = await db.evaluation.findUnique({
        where: {
          year_unitId: {
            year,
            unitId: targetUnitId
          }
        }
      })

      const existingLogs = ((existingEval?.syncLogs as any) || {}) as Record<string, any>
      const formsList: RemoteFormEntry[] =
        entry.forms && entry.forms.length > 0
          ? entry.forms
          : [
              {
                formCode: normalizePekpppFormCode(entry.formSheetName) || 'F02',
                uuid: entry.remoteUuid,
                formSheetName: entry.formSheetName || 'F02'
              }
            ]

      const formsMap: Partial<Record<PekpppFormCode, MenpanFormBindingInfo>> = {
        ...(existingLogs.forms || {})
      }

      for (const fItem of formsList) {
        let qList: any[] = []
        const cacheKey = fItem.formCode
        if (questionsCache.has(cacheKey)) {
          qList = questionsCache.get(cacheKey)!
        } else {
          const qRes = await MenpanApiService.getRemoteQuestions(fItem.uuid)
          if (qRes.success && qRes.data) {
            qList = qRes.data.map((q) => ({
              id: q.id,
              index: q.index,
              name: q.name,
              bobot: q.bobot,
              is_required: q.is_required,
              option_type: q.option_type,
              options: q.options
            }))
            questionsCache.set(cacheKey, qList)
          }
        }

        formsMap[fItem.formCode] = {
          formCode: fItem.formCode,
          uuid: fItem.uuid,
          remoteName: entry.remoteName,
          formSheetId: fItem.formSheetId,
          formSheetName: fItem.formSheetName,
          questionsCount: qList.length,
          questionMap: qList,
          syncStatus: existingLogs?.forms?.[fItem.formCode]?.syncStatus || 'IDLE',
          syncedAt: existingLogs?.forms?.[fItem.formCode]?.syncedAt || null
        }
      }

      const primaryBinding = formsMap.F02 || formsMap.F01 || formsMap.F03
      const primaryUuid = primaryBinding?.uuid || entry.remoteUuid
      const joinedFormNames = formsList.map((f) => f.formCode).join(' · ')

      const syncLogsData = {
        ...existingLogs,
        action: 'RECONCILIATION_BULK_LINK',
        linkedAt: new Date().toISOString(),
        remoteUuid: primaryUuid,
        remoteName: entry.remoteName,
        formSheetName: joinedFormNames,
        questionsCount: primaryBinding?.questionsCount || 31,
        questionMap: primaryBinding?.questionMap || [],
        forms: formsMap
      }

      if (existingEval) {
        await db.evaluation.update({
          where: { id: existingEval.id },
          data: {
            menpanEvaluationId: primaryUuid,
            menpanEvaluationName: entry.remoteName,
            menpanFormSheetName: joinedFormNames,
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
            menpanEvaluationId: primaryUuid,
            menpanEvaluationName: entry.remoteName,
            menpanFormSheetName: joinedFormNames,
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

    let msg = `Berhasil merekonsiliasi ${linkedCount} lokus (beserta paket UUID F01, F02, F03) dengan portal MenPAN-RB.`
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
        syncStatus: 'IDLE',
        syncLogs: {}
      }
    })
    revalidatePath(`/admin/periode/${updated.year}`)
    revalidatePath('/admin/periode')
    revalidatePath('/admin/lokus')
    revalidatePath('/admin/peserta')
    return {
      success: true,
      message: 'Tautan lokus (F01, F02, F03) dengan portal MenPAN-RB berhasil dilepaskan.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal melepaskan tautan lokus.'
    }
  }
}

// =============================================================================
// SERVER ACTIONS UNTUK BERITA ACARA PENILAIAN (BAP) & SINKRONISASI MENPAN-RB
// =============================================================================

export async function getMenpanBapWorkspaceAction(evaluationId: string) {
  try {
    const config = await getMenpanApiConfig()
    const isConfigured = Boolean(config.baseUrl && config.apiKey)

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: { include: { category: true } },
        scores: {
          include: {
            indicator: {
              include: { aspect: true }
            }
          },
          orderBy: { indicator: { indicatorNumber: 'asc' } }
        }
      }
    })

    if (!evaluation) {
      return { success: false, message: 'Data evaluasi tidak ditemukan.' }
    }

    const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const f02Binding = syncLogs.forms?.F02 as MenpanFormBindingInfo | undefined
    const f02Questions = Array.isArray(f02Binding?.questionMap) ? f02Binding!.questionMap! : []

    let groupUuid: string | null = syncLogs.evaluationGroupUuid || null
    let remoteBap: any = null
    let signingLinks: MenpanBapSigningLinks | null = null

    if (isConfigured && (evaluation.menpanEvaluationId || syncLogs.forms?.F02?.uuid || syncLogs.forms?.F01?.uuid)) {
      if (!groupUuid) {
        const resGroup = await MenpanApiService.resolveEvaluationGroupUuid(evaluationId)
        if (resGroup.success && resGroup.groupUuid) {
          groupUuid = resGroup.groupUuid
        }
      }

      if (groupUuid) {
        const [bapRes, linksRes] = await Promise.all([
          MenpanApiService.getRemoteBap(groupUuid),
          MenpanApiService.getRemoteBapSigningLinks(groupUuid)
        ])
        if (bapRes.success && bapRes.data) {
          remoteBap = bapRes.data
        }
        if (linksRes.success && linksRes.data) {
          signingLinks = linksRes.data
        }
      }
    }

    const mergedSections: MenpanBapSectionItem[] = MenpanApiService.buildBapSectionsFromLocal(
      evaluation,
      f02Questions,
      remoteBap?.sections || []
    )

    const localBapMeta = (syncLogs.bap || {}) as Record<string, any>
    const localSigners = (syncLogs.bapSigners || { evaluators: [], knowers: [] }) as {
      evaluators: MenpanBapSignerItem[]
      knowers: MenpanBapSignerItem[]
    }

    const evaluators: MenpanBapSignerItem[] =
      Array.isArray(remoteBap?.evaluators) && remoteBap.evaluators.length > 0
        ? remoteBap.evaluators
        : localSigners.evaluators || []

    const knowers: MenpanBapSignerItem[] =
      Array.isArray(remoteBap?.knowers) && remoteBap.knowers.length > 0
        ? remoteBap.knowers
        : localSigners.knowers || []

    const todayStr = new Date().toISOString().slice(0, 10)

    return {
      success: true,
      unitId: evaluation.unitId,
      year: evaluation.year,
      isConfigured,
      groupUuid,
      bapName: remoteBap?.name || localBapMeta.name || evaluation.menpanEvaluationName || evaluation.unit.name,
      printedAt: remoteBap?.printed_at || localBapMeta.printed_at || todayStr,
      bapNumber: localBapMeta.bapNumber || `800.1.11.1/BAP-PEKPPP/${evaluation.year}`,
      bapFileUrl: remoteBap?.bap_file_url || null,
      bapFileSource: remoteBap?.bap_file_source || null,
      lastSyncedAt: localBapMeta.syncedAt || null,
      sections: mergedSections,
      evaluators,
      knowers,
      signingLinks
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memuat workspace BAP.'
    }
  }
}

export async function saveAndSyncMenpanBapAction(
  evaluationId: string,
  payload: {
    name: string
    printed_at: string
    bapNumber?: string
    pushToMenpan?: boolean
    sections: Array<{
      section_id: number
      kondisi: string
      catatan: string
      rekomendasi: string
    }>
  }
) {
  try {
    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, year: true, unitId: true, aspectNotes: true, syncLogs: true }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan.' }
    }

    const currentAspectNotes = ((evaluation.aspectNotes as any) || {}) as Record<string, any>
    const updatedAspectNotes: Record<string, any> = { ...currentAspectNotes }

    for (const sec of payload.sections) {
      const cfg = MENPAN_BAP_SECTION_CONFIG.find((c) => c.section_id === Number(sec.section_id))
      if (!cfg) continue
      const aspectItem = {
        kondisi: sec.kondisi || '',
        catatan: sec.catatan || '',
        rekomendasi: sec.rekomendasi || ''
      }
      updatedAspectNotes[cfg.dbCode] = aspectItem
      updatedAspectNotes[cfg.romanCode] = aspectItem
    }

    const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const updatedLogs = {
      ...syncLogs,
      bap: {
        ...(syncLogs.bap || {}),
        name: payload.name.trim(),
        printed_at: payload.printed_at.slice(0, 10),
        bapNumber: payload.bapNumber || syncLogs.bap?.bapNumber || `800.1.11.1/BAP-PEKPPP/${evaluation.year}`,
        savedLocallyAt: new Date().toISOString(),
        sections: payload.sections
      }
    }

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        aspectNotes: updatedAspectNotes,
        syncLogs: updatedLogs
      }
    })

    revalidatePath(`/evaluasi/${evaluation.unitId}/berita-acara`)
    revalidatePath(`/evaluasi/${evaluation.unitId}`)
    revalidatePath(`/hasil/${evaluationId}`)

    if (payload.pushToMenpan !== false) {
      const syncRes = await MenpanApiService.syncEvaluationBapToMenpan(evaluationId, {
        name: payload.name,
        printed_at: payload.printed_at,
        sections: payload.sections
      })

      if (!syncRes.success) {
        return {
          success: true,
          syncedToMenpan: false,
          message: `Tersimpan di database lokal. Catatan sinkronisasi MenPAN-RB: ${syncRes.message}`
        }
      }

      return {
        success: true,
        syncedToMenpan: true,
        groupUuid: syncRes.groupUuid,
        message: 'Data BAP & Catatan Rekomendasi 6 Aspek berhasil disimpan lokal dan disinkronkan ke server MenPAN-RB!'
      }
    }

    return {
      success: true,
      syncedToMenpan: false,
      message: 'Data BAP & Catatan Rekomendasi berhasil disimpan ke database lokal.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menyimpan data BAP.'
    }
  }
}

export async function addMenpanBapSignerAction(
  evaluationId: string,
  signer: {
    role: 'evaluator' | 'mengetahui'
    name: string
    position?: string
    nip?: string
  }
) {
  try {
    if (!signer.name || !signer.name.trim()) {
      return { success: false, message: 'Nama penandatangan wajib diisi.' }
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, unitId: true, syncLogs: true }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan.' }
    }

    const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const currentSigners = (syncLogs.bapSigners || { evaluators: [], knowers: [] }) as {
      evaluators: MenpanBapSignerItem[]
      knowers: MenpanBapSignerItem[]
    }

    const newEntry: MenpanBapSignerItem = {
      id: `local_${Date.now()}`,
      role: signer.role,
      name: signer.name.trim(),
      position: (signer.position || '-').trim(),
      nip: (signer.nip || '-').trim()
    }

    if (signer.role === 'evaluator') {
      currentSigners.evaluators = [...(currentSigners.evaluators || []), newEntry]
    } else {
      currentSigners.knowers = [...(currentSigners.knowers || []), newEntry]
    }

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        syncLogs: {
          ...syncLogs,
          bapSigners: currentSigners
        }
      }
    })

    const groupRes = await MenpanApiService.resolveEvaluationGroupUuid(evaluationId)
    if (groupRes.success && groupRes.groupUuid) {
      const remoteRes = await MenpanApiService.addRemoteBapSigner(groupRes.groupUuid, signer)
      revalidatePath(`/evaluasi/${evaluation.unitId}/berita-acara`)
      if (remoteRes.success) {
        return {
          success: true,
          syncedToMenpan: true,
          message: remoteRes.message
        }
      } else {
        return {
          success: true,
          syncedToMenpan: false,
          message: `Tersimpan di BAP lokal (Info MenPAN-RB: ${remoteRes.message})`
        }
      }
    }

    revalidatePath(`/evaluasi/${evaluation.unitId}/berita-acara`)
    return {
      success: true,
      syncedToMenpan: false,
      message: 'Penandatangan berhasil disimpan pada BAP lokal.'
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menambahkan penandatangan BAP.'
    }
  }
}

export async function uploadSignedBapPdfToMenpanAction(
  evaluationId: string,
  formData: FormData
) {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, message: 'Pilih berkas PDF BAP terlebih dahulu.' }
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return { success: false, message: 'Berkas yang diunggah wajib berformat PDF (.pdf).' }
    }

    const groupRes = await MenpanApiService.resolveEvaluationGroupUuid(evaluationId)
    if (!groupRes.success || !groupRes.groupUuid) {
      return {
        success: false,
        message: groupRes.message || 'Lokus ini belum terikat dengan Evaluation Group di portal MenPAN-RB.'
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const uploadRes = await MenpanApiService.uploadRemoteBapPdf(groupRes.groupUuid, arrayBuffer)

    const ev = await db.evaluation.findUnique({ where: { id: evaluationId }, select: { unitId: true } })
    if (ev?.unitId) {
      revalidatePath(`/evaluasi/${ev.unitId}/berita-acara`)
    }
    return uploadRes
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal mengunggah berkas PDF BAP ke portal MenPAN-RB.'
    }
  }
}
