import { NextRequest, NextResponse } from 'next/server'
import { MenpanApiService } from '../../../../../services/menpan-api-service'
import { db } from '../../../../../services/db'
import { getCurrentUserAction } from '../../../../../actions/auth-actions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params
    const user = await getCurrentUserAction()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: { unit: true }
    })

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      const userUnit = await db.userUnit.findUnique({
        where: {
          userId_unitId: {
            userId: user.id,
            unitId: evaluation.unitId
          }
        }
      })
      if (!userUnit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const groupRes = await MenpanApiService.resolveEvaluationGroupUuid(evaluationId)
    if (!groupRes.success || !groupRes.groupUuid) {
      return NextResponse.json(
        { error: groupRes.message || 'Evaluation group UUID belum tertaut.' },
        { status: 400 }
      )
    }

    const pdfRes = await MenpanApiService.downloadRemoteBapPdf(groupRes.groupUuid)
    if (!pdfRes.success || !pdfRes.buffer) {
      return NextResponse.json(
        { error: pdfRes.message || 'Gagal mengunduh PDF BAP dari server MenPAN-RB.' },
        { status: 502 }
      )
    }

    const safeUnitName = evaluation.unit.name.replace(/[^a-zA-Z0-9_-]/g, '_')
    return new NextResponse(pdfRes.buffer, {
      status: 200,
      headers: {
        'Content-Type': pdfRes.contentType || 'application/pdf',
        'Content-Disposition': `inline; filename="BAP_MenPAN_${safeUnitName}_${evaluation.year}.pdf"`
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
