// src/app/evaluasi/[unitId]/berita-acara/page.tsx
import { db } from '../../../../services/db'
import { notFound, redirect } from 'next/navigation'
import {
  calculatePekpppScore,
  calculateEffectiveF03AndIpp
} from '../../../../core/domain/pekppp-calculator'
import { normalizeAspectCode } from '../../../../core/domain/evidence-slots-preset'
import { canAccessUnitEvaluation } from '../../../../services/auth-guard'
import { getMenpanBapWorkspaceAction } from '../../../../actions/menpan-actions'
import { MENPAN_BAP_SECTION_CONFIG } from '../../../../services/menpan-api-service'
import { Breadcrumb } from '../../../../components/ui/Breadcrumb'
import { BeritaAcaraWorkspaceClient } from '../../../../components/features/BeritaAcaraWorkspaceClient'
import { Metadata } from 'next'

export const revalidate = 0

export async function generateMetadata({
  params
}: {
  params: Promise<{ unitId: string }>
}): Promise<Metadata> {
  const { unitId } = await params
  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { name: true }
  })
  if (!unit) return { title: 'Berita Acara (BAP) - PEKPPP.ext' }
  return {
    title: `Berita Acara (BAP) ${unit.name} - PEKPPP.ext`
  }
}

export default async function EvaluasiBeritaAcaraPage({
  params,
  searchParams
}: {
  params: Promise<{ unitId: string }>
  searchParams?: Promise<{ tahun?: string }>
}) {
  const { unitId } = await params
  const resolvedSearchParams = await searchParams
  const queryYear = resolvedSearchParams?.tahun
    ? parseInt(resolvedSearchParams.tahun, 10)
    : undefined

  const access = await canAccessUnitEvaluation(unitId)
  if (!access.allowed) {
    if (access.reason === 'NOT_LOGGED_IN') {
      redirect(`/login?redirect=/evaluasi/${unitId}/berita-acara${queryYear ? `?tahun=${queryYear}` : ''}`)
    }
    notFound()
  }

  // Cari evaluasi berdasarkan unitId dan tahun
  let evaluation: any = null
  if (queryYear) {
    evaluation = await db.evaluation.findFirst({
      where: { unitId, year: queryYear },
      include: {
        unit: { include: { category: true } },
        scores: {
          include: {
            indicator: { include: { aspect: true } }
          },
          orderBy: { indicator: { indicatorNumber: 'asc' } }
        }
      }
    })
  } else {
    const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
    const targetYear = activePeriod?.year
    evaluation = await db.evaluation.findFirst({
      where: {
        unitId,
        ...(targetYear ? { year: targetYear } : {})
      },
      orderBy: { year: 'desc' },
      include: {
        unit: { include: { category: true } },
        scores: {
          include: {
            indicator: { include: { aspect: true } }
          },
          orderBy: { indicator: { indicatorNumber: 'asc' } }
        }
      }
    })
  }

  if (!evaluation) {
    notFound()
  }

  const userRole = access.user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'OPD'

  // Hitung skor F-02, F-03, dan IPP Akhir
  const calculationInputs = evaluation.scores.map((s: any) => ({
    indicatorNumber: s.indicator.indicatorNumber,
    aspectCode: s.indicator.aspect.code,
    score: s.score,
    maxScore: s.indicator.maxScore,
    aspectWeight: s.indicator.aspect.aspectWeight,
    indicatorWeight: s.indicator.indicatorWeight,
    isSupplementary: s.indicator.isSupplementary
  }))

  const calculation = calculatePekpppScore(calculationInputs)
  const f02Pct = calculation.totalPercentage
  const f02Scale5 = (f02Pct / 100) * 5

  const period = await db.evaluationPeriod.findUnique({
    where: { year: evaluation.year },
    select: { targetF03Quota: true, f03CalculationMethod: true }
  })
  const targetQuota = period?.targetF03Quota || 30
  const f03Method = period?.f03CalculationMethod || 'PROPORTIONAL'
  const hasF03 = (evaluation.f03Count || 0) > 0
  const f03AvgPct = hasF03 ? evaluation.f03Percentage || 0 : 0

  const {
    effectiveF03Percentage: f03Pct,
    finalIppPercentage: finalPct,
    finalIppScore: finalScale5,
    isF03Qualified
  } = calculateEffectiveF03AndIpp({
    f02Percentage: f02Pct,
    f03RawPercentage: f03AvgPct,
    f03Count: evaluation.f03Count || 0,
    targetQuota,
    method: f03Method
  })

  const grade =
    finalPct >= 90
      ? 'A'
      : finalPct >= 75
      ? 'B'
      : finalPct >= 60
      ? 'C'
      : finalPct >= 45
      ? 'D'
      : 'E'
  const predicate =
    grade === 'A'
      ? 'Sangat Baik'
      : grade === 'B'
      ? 'Baik'
      : grade === 'C'
      ? 'Cukup'
      : grade === 'D'
      ? 'Kurang'
      : 'Sangat Kurang'

  const lastAssessmentDate = evaluation.scores
    .filter((s: any) => s.score !== null)
    .reduce((latest: Date, current: any) => {
      return current.updatedAt > latest ? current.updatedAt : latest
    }, evaluation.updatedAt)

  function formatIndoDate(date: Date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ]
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Bangun ringkasan per aspek yang selaras dengan 7 section BAP MenPAN-RB
  const aspectResultsEntries = Object.entries(calculation.aspectResults)
  const aspectSummaryRows = MENPAN_BAP_SECTION_CONFIG.map((cfg) => {
    const found = aspectResultsEntries.find(
      ([code]) =>
        code === cfg.dbCode ||
        code === cfg.romanCode ||
        normalizeAspectCode(code) === cfg.romanCode
    )
    const res = found?.[1]
    const pct = res?.percentage || 0
    const scale5 = (pct / 100) * 5
    const weight = cfg.romanCode === 'TAMBAHAN' ? 0 : res?.aspectWeight || 0
    const weightedScore = scale5 * (weight / 100)

    return {
      code: cfg.dbCode,
      romanCode: cfg.romanCode,
      sectionId: cfg.section_id,
      name: cfg.name,
      weight,
      scoreScale5: scale5,
      weightedScore,
      percentage: pct
    }
  })

  // Bangun rincian 31 indikator (F-01 vs F-02)
  const indicatorRows = evaluation.scores.map((s: any) => {
    const f01Obj = (s.f01Data as Record<string, any> | null) || null
    let f01Summary = ''
    if (f01Obj) {
      if (typeof f01Obj.selfScore === 'number') {
        f01Summary = `Skor Mandiri: ${f01Obj.selfScore}`
      }
      if (f01Obj.notes) {
        f01Summary = f01Summary ? `${f01Summary} - ${f01Obj.notes}` : String(f01Obj.notes)
      } else if (f01Obj.answer) {
        f01Summary = f01Summary ? `${f01Summary} - ${f01Obj.answer}` : String(f01Obj.answer)
      }
    }

    return {
      indicatorNumber: s.indicator.indicatorNumber,
      code: s.indicator.code,
      aspectCode: normalizeAspectCode(s.indicator.aspect.code),
      aspectName: s.indicator.aspect.name,
      question: s.indicator.question,
      f01AnswerSummary: f01Summary,
      f02Score: s.score,
      notes: s.notes,
      proofUrl: null
    }
  })

  // Muat data BAP (Lokal + Remote MenPAN-RB)
  const bapWorkspace = await getMenpanBapWorkspaceAction(evaluation.id)
  const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
  const boundFormsSummary = {
    F01: syncLogs.forms?.F01?.uuid || null,
    F02: syncLogs.forms?.F02?.uuid || evaluation.menpanEvaluationId || null,
    F03: syncLogs.forms?.F03?.uuid || null,
    groupUuid: bapWorkspace.groupUuid || syncLogs.evaluationGroupUuid || null
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      {/* Breadcrumb Tunggal Standar Ruang Evaluasi */}
      <Breadcrumb
        showBackOnFirst
        items={[
          {
            label: userRole === 'OPD' ? 'Dashboard OPD' : `Tahun Penilaian ${evaluation.year}`,
            href: userRole === 'OPD' ? '/opd' : `/admin/periode/${evaluation.year}`
          },
          {
            label: evaluation.unit.name,
            href: `/evaluasi/${unitId}?tahun=${evaluation.year}`
          },
          { label: 'Berita Acara (BAP)' }
        ]}
      />

      {/* Main BAP Workspace & Printable Document (Full Container Width) */}
      <BeritaAcaraWorkspaceClient
        evaluationId={evaluation.id}
        unitName={evaluation.unit.name}
        categoryName={evaluation.unit.category?.name || 'Unit Pelayanan Publik'}
        year={evaluation.year}
        isFinished={evaluation.isFinished}
        userRole={userRole}
        f02Pct={f02Pct}
        f02Scale5={f02Scale5}
        f03Pct={f03Pct}
        f03Count={evaluation.f03Count || 0}
        targetQuota={targetQuota}
        isF03Qualified={isF03Qualified}
        finalPct={finalPct}
        finalScale5={finalScale5}
        grade={grade}
        predicate={predicate}
        formattedAssessmentDate={formatIndoDate(lastAssessmentDate)}
        aspectSummaryRows={aspectSummaryRows}
        indicatorRows={indicatorRows}
        boundFormsSummary={boundFormsSummary}
        initialBap={{
          groupUuid: bapWorkspace.groupUuid || null,
          bapName: bapWorkspace.bapName || evaluation.unit.name,
          printedAt: bapWorkspace.printedAt || new Date().toISOString().slice(0, 10),
          bapNumber: bapWorkspace.bapNumber || `800.1.11.1/BAP-PEKPPP/${evaluation.year}`,
          bapFileUrl: bapWorkspace.bapFileUrl || null,
          bapFileSource: bapWorkspace.bapFileSource || null,
          lastSyncedAt: bapWorkspace.lastSyncedAt || null,
          sections: bapWorkspace.sections || [],
          evaluators: bapWorkspace.evaluators || [],
          knowers: bapWorkspace.knowers || [],
          signingLinks: bapWorkspace.signingLinks || null
        }}
      />
    </div>
  )
}
