import { getEvaluationDetailsAction } from '../../../actions/evaluation-actions'
import { getF03DataAction } from '../../../actions/f03-actions'
import { getAspectEvidenceOverviewAction } from '../../../actions/evidence-slot-actions'
import { canAccessUnitEvaluation } from '../../../services/auth-guard'
import { db } from '../../../services/db'
import { EvaluationTabWrapper } from '../../../components/features/EvaluationTabWrapper'
import { EvaluationWorkspaceLayout } from '../../../components/features/EvaluationWorkspaceLayout'
import { F03OpdClient } from '../../../components/features/F03OpdClient'
import { F03EvaluatorClient } from '../../../components/features/F03EvaluatorClient'
import { calculatePekpppScore } from '../../../core/domain/pekppp-calculator'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function EvaluasiUnitPage({
  params,
  searchParams
}: {
  params: Promise<{ unitId: string }>
  searchParams?: Promise<{ tahun?: string }>
}) {
  const { unitId } = await params
  const resolvedSearchParams = await searchParams
  const queryYear = resolvedSearchParams?.tahun ? parseInt(resolvedSearchParams.tahun, 10) : undefined

  const access = await canAccessUnitEvaluation(unitId)

  if (!access.allowed) {
    if (access.reason === 'NOT_LOGGED_IN') redirect(`/login?redirect=/evaluasi/${unitId}`)
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#090c1d] tracking-[-0.03em]">Akses Dibatasi</h1>
          <p className="text-xs text-[#646464] mt-2 leading-relaxed">
            Akun <strong>{access.user?.email}</strong> tidak memiliki hak akses untuk Lokus ini. Hubungi Super Admin
            untuk penautan akun.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    )
  }

  const evaluation = await getEvaluationDetailsAction(unitId, queryYear)
  if (!evaluation) return <div className="p-8 text-center text-[#838383] text-sm">Evaluasi unit tidak ditemukan.</div>

  const [f03Data, evidenceOverviewRes] = await Promise.all([
    getF03DataAction(evaluation.id),
    getAspectEvidenceOverviewAction(evaluation.id)
  ])
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const isPeriodOpen = activePeriod?.year === evaluation.year

  const { getPeriodTimeline } = await import('../../../services/period-window-service')
  const timelineResult = await getPeriodTimeline(evaluation.year)
  const isF01Editable = isPeriodOpen && timelineResult.effectivePermissions.canFillF01
  const isEvidenceEditable = isPeriodOpen && timelineResult.effectivePermissions.canUploadEvidence
  const isF03Open = isPeriodOpen && timelineResult.effectivePermissions.canFillF03

  const incompleteAspectsCount =
    evidenceOverviewRes.success && evidenceOverviewRes.overview
      ? evidenceOverviewRes.overview.filter((a) => !a.isComplete).length
      : 6

  const calculationInputs = evaluation.scores.map((s) => ({
    indicatorNumber: s.indicator.indicatorNumber,
    aspectCode: s.indicator.aspect.code,
    score: s.score,
    maxScore: s.indicator.maxScore,
    indicatorWeight: s.indicator.indicatorWeight,
    aspectWeight: s.indicator.aspect.aspectWeight,
    isSupplementary: s.indicator.isSupplementary
  }))
  const calculation = calculatePekpppScore(calculationInputs)

  const isSuperAdmin = access.user?.role === 'SUPER_ADMIN'

  // Pastikan field AI hanya dikirimkan ke Evaluator (SUPER_ADMIN)
  const sanitizedScores = evaluation.scores.map((s: any) => {
    if (isSuperAdmin) return s
    // OPD / Lokus: Hapus seluruh informasi & rekomendasi AI
    const { aiSuggestedScore, aiConfidence, aiConfidenceReason, aiCriticalAudit, aiWeaknessNotes, aiVerificationTips, ...rest } = s
    return rest
  })

  return (
    <div className="space-y-3">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
        <Link
          href={access.user?.role === 'OPD' ? '/opd' : '/admin/peserta'}
          className="hover:text-ink transition-colors">
          Dashboard
        </Link>
        <span className="text-stroke font-bold">/</span>
        <span className="text-ink font-bold">{evaluation.unit.name}</span>
      </nav>

      {/* Instant Client-Side Tab Switcher Wrapper */}
      <EvaluationTabWrapper
        f03Count={evaluation.f03Count}
        userRole={access.user?.role || 'OPD'}
        incompleteAspectsCount={incompleteAspectsCount}
        evaluationId={evaluation.id}
        f02Content={
          <EvaluationWorkspaceLayout
            scores={sanitizedScores as any}
            evaluationId={evaluation.id}
            unitId={unitId}
            unitName={evaluation.unit.name}
            driveFolderUrl={evaluation.unit.driveFolderUrl}
            calculation={calculation}
            userRole={access.user?.role || 'OPD'}
            userId={access.user!.id}
            aspectNotes={evaluation.aspectNotes as any}
            aiEvaluatorNotes={isSuperAdmin ? (evaluation.aiEvaluatorNotes as any) : null}
            isF01Editable={isF01Editable}
            isEvidenceEditable={isEvidenceEditable}
          />
        }
        f03Content={
          access.user?.role === 'SUPER_ADMIN' ? (
            <F03EvaluatorClient
              unitId={unitId}
              unitName={evaluation.unit.name}
              targetQuota={f03Data.targetQuota}
              schema={f03Data.schema as any}
              respondents={f03Data.respondents as any}
              proofUrl={f03Data.evaluation.f03ProofUrl}
            />
          ) : (
            <F03OpdClient
              evaluationId={evaluation.id}
              unitId={unitId}
              unitName={evaluation.unit.name}
              targetQuota={f03Data.targetQuota}
              isPeriodOpen={isF03Open}
              schema={f03Data.schema as any}
              respondents={f03Data.respondents as any}
              initialProofUrl={f03Data.evaluation.f03ProofUrl}
              publicSurveyToken={f03Data.evaluation.publicSurveyToken}
              initialIsPublicSurveyOpen={f03Data.evaluation.isPublicSurveyOpen}
            />
          )
        }
      />
    </div>
  )
}
