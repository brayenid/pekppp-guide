// src/app/api/admin/master-bukti/radar/route.ts
// API Route untuk Paginasi Server-Side Radar Temuan Regulasi (Real Network Refetch)

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
    const issueId = searchParams.get('issueId') || 'ALL'
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

    const skmExpiredUnits = compliance.unitProfiles.filter((p: any) => !p.skm.hasFile || p.skm.isExpired)
    const spAgingUnits = compliance.unitProfiles.filter((p: any) => !p.sp.hasFile || p.sp.isAging)
    const saprasMissingUnits = compliance.unitProfiles.filter((p: any) => !p.saprasRentan.hasFile)
    const skmPubMissingUnits = compliance.unitProfiles.filter(
      (p: any) => p.skm.hasFile && !p.skm.hasPublication
    )
    const pengaduanMissingUnits = compliance.unitProfiles.filter((p: any) => !p.pengaduan.hasFile)

    const radarIssues = [
      {
        id: 'SKM_EXPIRED',
        title: 'Laporan SKM Kedaluwarsa atau Belum Dilaporkan',
        aspectCode: 'I',
        severity: 'DANGER',
        units: skmExpiredUnits.map((u: any) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: !u.skm.hasFile
            ? 'Belum ada dokumen laporan SKM'
            : `Terakhir lapor ${u.skm.year || '-'} (Usang)`
        }))
      },
      {
        id: 'SP_AGING',
        title: 'SK Standar Pelayanan (SP) Berusia ≥ 3 Tahun atau Belum Ada',
        aspectCode: 'I',
        severity: 'WARNING',
        units: spAgingUnits.map((u: any) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: !u.sp.hasFile
            ? 'Belum menetapkan SK Standar Pelayanan'
            : `SK Terbit ${u.sp.year || '-'} (Perlu FKP)`
        }))
      },
      {
        id: 'SAPRAS_RENTAN',
        title: 'Fasilitas Sarpras Ramah Kelompok Rentan Belum Memiliki Foto',
        aspectCode: 'III',
        severity: 'DANGER',
        units: saprasMissingUnits.map((u: any) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Belum ada foto fasilitas ramah kelompok rentan yang diunggah'
        }))
      },
      {
        id: 'SKM_PUB',
        title: 'Bukti Publikasi Hasil Nilai SKM ke Masyarakat Belum Dilampirkan',
        aspectCode: 'I',
        severity: 'WARNING',
        units: skmPubMissingUnits.map((u: any) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Sudah ada laporan SKM, namun belum mengunggah foto / tautan bukti rilis hasil'
        }))
      },
      {
        id: 'PENGADUAN',
        title: 'Kanal Pengelolaan Pengaduan Publik (SP4N-LAPOR!) Belum Terkonfigurasi',
        aspectCode: 'IV',
        severity: 'DANGER',
        units: pengaduanMissingUnits.map((u: any) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Belum ada SK Pengelola Pengaduan atau bukti terintegrasi SP4N-LAPOR!'
        }))
      }
    ]

    const items: Array<{
      unitId: string
      unitName: string
      unitCode: string | null
      categoryName: string
      issueId: string
      issueTitle: string
      aspectCode: string
      severity: string
      statusNote: string
    }> = []

    for (const issue of radarIssues) {
      if (issueId !== 'ALL' && issue.id !== issueId) continue

      for (const u of issue.units) {
        if (categoryId !== 'ALL') {
          const matchedCat = categories.find((c: any) => c.id === categoryId)
          if (matchedCat && u.categoryName !== matchedCat.name) continue
          if (!matchedCat && u.categoryName !== categoryId) continue
        }

        if (q !== '') {
          const matchName = u.unitName.toLowerCase().includes(q)
          const matchCode = (u.unitCode || '').toLowerCase().includes(q)
          const matchCat = u.categoryName.toLowerCase().includes(q)
          if (!matchName && !matchCode && !matchCat) continue
        }

        items.push({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          issueId: issue.id,
          issueTitle: issue.title,
          aspectCode: issue.aspectCode,
          severity: issue.severity,
          statusNote: u.statusNote
        })
      }
    }

    const total = items.length
    const skip = (page - 1) * limit
    const pageItems = items.slice(skip, skip + limit)
    const hasMore = skip + limit < total

    return NextResponse.json({
      success: true,
      items: pageItems,
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
