// src/app/api/admin/master-bukti/matrix/route.ts
// API Route untuk Paginasi Server-Side Matriks Profil Kesiapan Layanan (Real Network Refetch)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'
import { getCurrentUserAction } from '@/actions/auth-actions'
import { EvidenceComplianceService } from '@/services/evidence-compliance-service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserAction()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page') || '1'
    const limitParam = searchParams.get('limit') || '15'
    const matrixFilter = searchParams.get('matrixFilter') || 'ALL'
    const categoryId = searchParams.get('categoryId') || 'ALL'
    const q = (searchParams.get('q') || '').trim().toLowerCase()

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, parseInt(limitParam, 10) || 15)

    const [categories, activePeriod] = await Promise.all([
      db.category.findMany({ orderBy: { name: 'asc' } }),
      db.evaluationPeriod.findFirst({
        where: { isOpen: true },
        orderBy: { year: 'desc' }
      })
    ])

    const compliance = await EvidenceComplianceService.getRegionalComplianceOverview({
      targetYear: activePeriod?.year
    })

    const filteredProfiles = compliance.unitProfiles.filter((p: any) => {
      if (categoryId !== 'ALL') {
        const matchedCat = categories.find((c: any) => c.id === categoryId)
        if (matchedCat && p.categoryName !== matchedCat.name) return false
        if (!matchedCat && p.categoryName !== categoryId) return false
      }

      if (q !== '') {
        const matchName = p.unitName.toLowerCase().includes(q)
        const matchCode = (p.unitCode || '').toLowerCase().includes(q)
        const matchCat = p.categoryName.toLowerCase().includes(q)
        const matchDoc = (p.sp.documentNumber || '').toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchCat && !matchDoc) return false
      }

      if (matrixFilter === 'NO_SP') return !p.sp.hasFile
      if (matrixFilter === 'AGING_SP') return p.sp.isAging
      if (matrixFilter === 'NO_SAPRAS') return !p.saprasRentan.hasFile
      if (matrixFilter === 'NO_SKM') return !p.skm.hasFile || p.skm.isExpired
      if (matrixFilter === 'NO_PENGADUAN') return !p.pengaduan.hasFile

      return true
    })

    const total = filteredProfiles.length
    const skip = (page - 1) * limit
    const items = filteredProfiles.slice(skip, skip + limit)
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
