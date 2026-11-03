// src/app/api/hasil/route.ts
// API Route untuk Paginasi Server-Side Hasil Evaluasi PEKPPP (Real Network Refetch)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../services/db'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { calculateEffectiveF03AndIpp } from '../../../core/domain/pekppp-calculator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '15'

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, parseInt(limitParam, 10) || 15)

    const currentUser = await getCurrentUserAction()
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

    const allPeriods = await db.evaluationPeriod.findMany({
      orderBy: { year: 'desc' }
    })

    const reqYear = yearParam ? Number(yearParam) : undefined
    let targetPeriod = reqYear ? allPeriods.find((p) => p.year === reqYear) : allPeriods.find((p) => p.isOpen)

    if (!targetPeriod && allPeriods.length > 0) {
      targetPeriod = allPeriods[0]
    }

    const activeYear = targetPeriod?.year || new Date().getFullYear()
    const isPublished = targetPeriod?.isPublished ?? false

    if (!isPublished && !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hasil evaluasi belum dipublikasikan.',
          items: [],
          total: 0,
          page,
          limit,
          hasMore: false
        },
        { status: 403 }
      )
    }

    const evaluations = await db.evaluation.findMany({
      where: { year: activeYear },
      include: { unit: { include: { category: true } } },
      orderBy: { percentage: 'desc' }
    })

    const targetQuota = targetPeriod?.targetF03Quota || 30
    const f03Method = targetPeriod?.f03CalculationMethod || 'PROPORTIONAL'

    const sortedEvaluations = evaluations
      .map((ev) => {
        const f02Pct = ev.percentage || 0
        const hasF03 = (ev.f03Count || 0) > 0
        const f03AvgPct = hasF03 ? (ev.f03Percentage || 0) : 0

        const {
          effectiveF03Percentage: f03Pct,
          finalIppPercentage: finalPct,
          finalIppScore: finalScale5,
          isF03Qualified
        } = calculateEffectiveF03AndIpp({
          f02Percentage: f02Pct,
          f03RawPercentage: f03AvgPct,
          f03Count: ev.f03Count || 0,
          targetQuota,
          method: f03Method
        })

        return {
          id: ev.id,
          year: ev.year,
          percentage: ev.percentage,
          isFinished: ev.isFinished,
          f02Pct,
          f03Pct,
          hasF03,
          isF03Qualified,
          finalPct,
          finalScale5,
          unit: {
            name: ev.unit.name,
            category: ev.unit.category ? { name: ev.unit.category.name } : null
          }
        }
      })
      .sort((a, b) => b.finalPct - a.finalPct)

    const total = sortedEvaluations.length
    const skip = (page - 1) * limit
    const items = sortedEvaluations.slice(skip, skip + limit)
    const hasMore = skip + limit < total

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      limit,
      hasMore
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
