// src/app/api/admin/master-bukti/repository/route.ts
// API Route untuk Paginasi Server-Side Repositori Berkas Master (Real Network Refetch)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/services/db'
import { getCurrentUserAction } from '@/actions/auth-actions'
import {
  PEKPPP_EVIDENCE_SLOTS,
  extractAttachments,
  normalizeAspectCode
} from '@/core/domain/evidence-slots-preset'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '@/actions/evidence-slot-actions'

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
    const filterMode = searchParams.get('filterMode') || 'ALL'
    const categoryId = searchParams.get('categoryId') || 'ALL'
    const q = (searchParams.get('q') || '').trim().toLowerCase()

    const page = Math.max(1, parseInt(pageParam, 10) || 1)
    const limit = Math.max(1, parseInt(limitParam, 10) || 15)

    const [units, masterRecords, slotsWithGuidesRes] = await Promise.all([
      db.unit.findMany({
        include: {
          category: true,
          evaluations: {
            orderBy: { year: 'desc' },
            select: { id: true, year: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      db.unitEvidenceMaster.findMany({
        where: {
          NOT: { fileUrl: '' }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      getAllAspectEvidenceSlotsWithGuidesAction()
    ])

    const presetSlots =
      slotsWithGuidesRes.success && slotsWithGuidesRes.slots.length > 0
        ? slotsWithGuidesRes.slots
        : PEKPPP_EVIDENCE_SLOTS

    const totalMandatorySlotsCount = presetSlots.filter((s: any) => s.isMandatory).length
    const mandatoryKeys = new Set(
      presetSlots.filter((p: any) => p.isMandatory).map((p: any) => `${p.aspectCode}::${p.slotKey}`)
    )

    const mastersByUnit = new Map<string, any[]>()
    for (const rec of masterRecords) {
      const list = mastersByUnit.get(rec.unitId) || []
      list.push(rec)
      mastersByUnit.set(rec.unitId, list)
    }

    const unitRows = units.map((unit: any) => {
      const records = mastersByUnit.get(unit.id) || []
      let filledMandatory = 0
      let totalAttachments = 0
      let maxVersion = 1
      let latestSourceYear: number | null = null
      let latestUpdatedAt: string | null = null

      for (const r of records) {
        const aspect = normalizeAspectCode(r.aspectCode)
        if (mandatoryKeys.has(`${aspect}::${r.slotKey}`)) {
          filledMandatory++
        }
        const attachments = extractAttachments(r)
        totalAttachments += attachments.length
        for (const att of attachments) {
          const v = att.version || 1
          if (v > maxVersion) maxVersion = v
        }
        if (r.lastSourceYear && (!latestSourceYear || r.lastSourceYear > latestSourceYear)) {
          latestSourceYear = r.lastSourceYear
        }
        const upd = r.updatedAt ? r.updatedAt.toISOString() : null
        if (!latestUpdatedAt || (upd && upd > latestUpdatedAt)) {
          latestUpdatedAt = upd
        }
      }

      const completionPct = Math.min(
        100,
        Math.round((filledMandatory / Math.max(totalMandatorySlotsCount, 1)) * 100)
      )

      return {
        unit: {
          id: unit.id,
          code: unit.code,
          name: unit.name,
          isActive: unit.isActive,
          category: unit.category ? { id: unit.category.id, name: unit.category.name } : null,
          years: unit.evaluations.map((e: any) => e.year),
          evaluationId: unit.evaluations[0]?.id || null
        },
        totalSlotsFilled: records.length,
        filledMandatory,
        completionPct,
        totalAttachments,
        maxVersion,
        latestSourceYear,
        latestUpdatedAt
      }
    })

    // Filter data di server
    const filteredRows = unitRows.filter((row: any) => {
      if (filterMode === 'WITH_MASTER' && row.totalSlotsFilled === 0) return false
      if (categoryId !== 'ALL' && row.unit.category?.id !== categoryId) return false
      if (q !== '') {
        const matchName = row.unit.name.toLowerCase().includes(q)
        const matchCode = (row.unit.code || '').toLowerCase().includes(q)
        const matchCat = (row.unit.category?.name || '').toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchCat) return false
      }
      return true
    })

    const total = filteredRows.length
    const skip = (page - 1) * limit
    const items = filteredRows.slice(skip, skip + limit)
    const hasMore = skip + limit < total

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      limit,
      hasMore,
      totalMandatorySlotsCount
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
