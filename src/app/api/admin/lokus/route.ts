// src/app/api/admin/lokus/route.ts
// API Route untuk Paginasi Server-Side Manajemen Master Lokus (Real Network Refetch)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'
import { getCurrentUserAction } from '@/actions/auth-actions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '20'
    const tab = searchParams.get('tab') || 'ALL'
    const categoryId = searchParams.get('categoryId') || 'ALL'
    const q = (searchParams.get('q') || '').trim().toLowerCase()

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, parseInt(limitParam, 10) || 20)

    const units = await db.unit.findMany({
      include: {
        category: true,
        evaluations: {
          select: {
            id: true,
            year: true,
            menpanEvaluationId: true,
            menpanEvaluationName: true,
            menpanFormSheetName: true,
            isPriority: true,
            syncStatus: true,
            syncedAt: true
          },
          orderBy: { year: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    let boundCount = 0
    let unboundCount = 0
    let priorityCount = 0

    for (const u of units) {
      const isBound = u.evaluations?.some((e) => Boolean(e.menpanEvaluationId))
      const isPriority = u.evaluations?.some((e) => Boolean(e.isPriority))
      if (isBound) boundCount++
      else unboundCount++
      if (isPriority) priorityCount++
    }

    const filteredUnits = units.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.category?.name || 'OPD').toLowerCase().includes(q)

      const matchesCat = categoryId === 'ALL' || u.category?.id === categoryId

      const isBound = u.evaluations?.some((e) => Boolean(e.menpanEvaluationId))
      const isPriority = u.evaluations?.some((e) => Boolean(e.isPriority))

      let matchesTab = true
      if (tab === 'BOUND') matchesTab = Boolean(isBound)
      else if (tab === 'UNBOUND') matchesTab = !isBound
      else if (tab === 'PRIORITY') matchesTab = Boolean(isPriority)

      return matchesSearch && matchesCat && matchesTab
    })

    const total = filteredUnits.length
    const skip = (page - 1) * limit
    const items = filteredUnits.slice(skip, skip + limit)
    const hasMore = skip + limit < total

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      limit,
      hasMore,
      stats: {
        total: units.length,
        bound: boundCount,
        unbound: unboundCount,
        priority: priorityCount
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
