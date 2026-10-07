import { getEvaluationDetailsAction } from '../../../../actions/evaluation-actions'
import { getF03DataAction } from '../../../../actions/f03-actions'
import { canAccessUnitEvaluation } from '../../../../services/auth-guard'
import { db } from '../../../../services/db'
import { F03OpdClient } from '../../../../components/features/F03OpdClient'
import { F03EvaluatorClient } from '../../../../components/features/F03EvaluatorClient'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function F03Page({
  params
}: {
  params: Promise<{ unitId: string }>
}) {
  const { unitId } = await params
  const access = await canAccessUnitEvaluation(unitId)

  if (!access.allowed) {
    if (access.reason === 'NOT_LOGGED_IN') redirect(`/login?redirect=/evaluasi/${unitId}/f03`)
    redirect('/')
  }

  const evaluation = await getEvaluationDetailsAction(unitId)
  if (!evaluation) {
    return <div className="p-8 text-center text-sm text-[#838383]">Evaluasi tidak ditemukan.</div>
  }

  const f03Data = await getF03DataAction(evaluation.id)

  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const isPeriodOpen = activePeriod?.year === evaluation.year

  if (access.user?.role === 'SUPER_ADMIN') {
    return (
      <F03EvaluatorClient
        unitId={unitId}
        unitName={evaluation.unit.name}
        targetQuota={f03Data.targetQuota}
        schema={f03Data.schema as any}
        respondents={f03Data.respondents as any}
        proofUrl={f03Data.evaluation.f03ProofUrl}
      />
    )
  }

  return (
    <F03OpdClient
      evaluationId={evaluation.id}
      unitId={unitId}
      unitName={evaluation.unit.name}
      targetQuota={f03Data.targetQuota}
      isPeriodOpen={isPeriodOpen}
      schema={f03Data.schema as any}
      respondents={f03Data.respondents as any}
      initialProofUrl={f03Data.evaluation.f03ProofUrl}
      publicSurveyToken={f03Data.evaluation.publicSurveyToken}
      initialIsPublicSurveyOpen={f03Data.evaluation.isPublicSurveyOpen}
    />
  )
}
