// src/app/api/admin/periode/[year]/evaluations/route.ts
// API Route untuk Paginasi Server-Side Daftar Lokus Peserta Periode (Real Network Refetch)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'
import { getCurrentUserAction } from '@/actions/auth-actions'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const yearNum = Number(resolvedParams.year)
    if (isNaN(yearNum)) {
      return NextResponse.json({ success: false, error: 'Tahun tidak valid' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '15'
    const searchTerm = (searchParams.get('searchTerm') || '').trim().toLowerCase()
    const categoryFilter = searchParams.get('categoryFilter') || 'ALL'
    const priorityFilter = searchParams.get('priorityFilter') || 'ALL'
    const updateFilter = searchParams.get('updateFilter') || 'ALL'

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, parseInt(limitParam, 10) || 15)

    const evaluations = await db.evaluation.findMany({
      where: { year: yearNum },
      include: {
        unit: {
          include: { category: true }
        },
        scores: {
          select: { id: true, score: true, f01Submitted: true, proofUrl: true }
        },
        _count: {
          select: { f03Respondents: true, evidenceSubmissions: true }
        }
      },
      orderBy: { unit: { name: 'asc' } }
    })

    const unitIds = evaluations.map((e) => e.unitId)
    const recentNotifications =
      unitIds.length > 0
        ? await db.notification.findMany({
            where: {
              unitId: { in: unitIds },
              type: { in: ['F01_UPDATE', 'F01_REVISION', 'PROOF_TRIGGER'] }
            },
            select: {
              unitId: true,
              type: true,
              createdAt: true,
              isRead: true
            },
            orderBy: { createdAt: 'desc' }
          })
        : []

    const unitUpdateMap = new Map<string, { type: string; isRead: boolean; createdAt: Date }>()
    recentNotifications.forEach((n) => {
      if (n.unitId && !unitUpdateMap.has(n.unitId)) {
        unitUpdateMap.set(n.unitId, {
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt
        })
      }
    })

    const evaluationsWithUpdates = evaluations.map((ev) => ({
      ...ev,
      recentUpdate: unitUpdateMap.get(ev.unitId) || null
    }))

    // Filter di level server
    const filteredEvaluations = evaluationsWithUpdates.filter((ev) => {
      const matchCat =
        categoryFilter === 'ALL' ||
        ev.unit.categoryId === categoryFilter ||
        ev.unit.category?.id === categoryFilter ||
        ev.unit.category?.name === categoryFilter
      const matchSearch =
        !searchTerm || ev.unit.name.toLowerCase().includes(searchTerm)
      const matchPriority =
        priorityFilter === 'ALL' ||
        (priorityFilter === 'PRIORITY' && !!ev.isPriority) ||
        (priorityFilter === 'REGULAR' && !ev.isPriority)
      const matchUpdate =
        updateFilter === 'ALL' ||
        (updateFilter === 'UPDATED' && !!ev.recentUpdate) ||
        (updateFilter === 'REVISION' && ev.recentUpdate?.type === 'F01_REVISION')
      return matchCat && matchSearch && matchPriority && matchUpdate
    })

    const total = filteredEvaluations.length
    const skip = (page - 1) * limit
    const items = filteredEvaluations.slice(skip, skip + limit)
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
