// src/app/opd/page.tsx
import { requireAuth } from '../../services/auth-guard'
import { db } from '../../services/db'
import { redirect } from 'next/navigation'
import { PEKPPP_EVIDENCE_SLOTS } from '../../core/domain/evidence-slots-preset'
import { EvidenceComplianceService } from '../../services/evidence-compliance-service'
import { OpdDashboardClient } from './OpdDashboardClient'

export const revalidate = 0

export default async function OpdDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ tahun?: string; unitId?: string }>
}) {
  const user = await requireAuth()

  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const resolvedSearchParams = await searchParams
  const queryYear = resolvedSearchParams?.tahun
    ? parseInt(resolvedSearchParams.tahun, 10)
    : null
  const queryUnitId = resolvedSearchParams?.unitId || null

  // Cari periode aktif
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const defaultYear = activePeriod?.year || null

  // Ambil seluruh unit yang ditautkan ke akun OPD ini
  const allBoundUserUnits = await db.userUnit.findMany({
    where: { userId: user.id },
    include: {
      unit: {
        include: {
          category: true
        }
      }
    },
    orderBy: {
      unit: { name: 'asc' }
    }
  })

  const boundUnitIds = allBoundUserUnits.map((uu) => uu.unitId)

  // Cari seluruh daftar tahun di mana unit akun OPD ini pernah/sedang menjadi peserta evaluasi
  const enrolledEvaluations = await db.evaluation.findMany({
    where: {
      unitId: { in: boundUnitIds }
    },
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })

  const availableYears = enrolledEvaluations.map((e) => e.year)
  if (defaultYear && !availableYears.includes(defaultYear)) {
    availableYears.unshift(defaultYear)
  }

  const selectedYear =
    queryYear && availableYears.includes(queryYear)
      ? queryYear
      : defaultYear || availableYears[0] || null

  const isCurrentYearActive = activePeriod?.year === selectedYear

  // Fetch timeline status untuk tahun yang dipilih
  let timelineResult = null
  if (selectedYear) {
    const { getPeriodTimeline } = await import('../../services/period-window-service')
    timelineResult = await getPeriodTimeline(selectedYear)
  }

  const canFillF01 =
    isCurrentYearActive && timelineResult
      ? timelineResult.effectivePermissions.canFillF01
      : false

  // Fetch evaluasi unit untuk tahun yang dipilih
  const [userUnitsInYear, masterRecords, selectedPeriod] = await Promise.all([
    selectedYear
      ? db.userUnit.findMany({
          where: {
            userId: user.id,
            unit: {
              evaluations: {
                some: { year: selectedYear }
              }
            }
          },
          include: {
            unit: {
              include: {
                category: true,
                evaluations: {
                  where: { year: selectedYear },
                  include: {
                    scores: true,
                    agenda: true,
                    _count: {
                      select: { f03Respondents: true }
                    }
                  }
                }
              }
            }
          }
        })
      : Promise.resolve([]),
    boundUnitIds.length > 0
      ? db.unitEvidenceMaster.findMany({
          where: {
            unitId: { in: boundUnitIds },
            NOT: { fileUrl: '' }
          },
          select: {
            unitId: true,
            aspectCode: true,
            slotKey: true,
            attachments: true
          }
        })
      : Promise.resolve([]),
    selectedYear
      ? db.evaluationPeriod.findUnique({
          where: { year: selectedYear },
          select: { targetF03Quota: true }
        })
      : Promise.resolve(null)
  ])

  const targetF03Quota = selectedPeriod?.targetF03Quota || 30

  const enrolledUnits = userUnitsInYear.map(({ unit }) => {
    const evaluation = unit.evaluations[0]
    const scores = evaluation?.scores || []
    const filledF01Count = scores.filter(
      (s) => s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)
    ).length
    const percentage = Math.round((filledF01Count / 31) * 100)
    const f03Count = evaluation?._count?.f03Respondents || 0
    const f03Percentage = Math.min(100, Math.round((f03Count / targetF03Quota) * 100))

    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      categoryName: unit.category?.name || 'OPD',
      evaluation: evaluation
        ? {
            id: evaluation.id,
            year: evaluation.year,
            isFinished: evaluation.isFinished,
            agendaTitle: evaluation.agenda?.title || null,
            filledF01Count,
            percentage,
            f03Count,
            f03Target: targetF03Quota,
            f03Percentage
          }
        : null
    }
  })

  const selectedUnitId =
    queryUnitId && boundUnitIds.includes(queryUnitId)
      ? queryUnitId
      : boundUnitIds[0] || null

  const activeUnit = allBoundUserUnits.find((u) => u.unitId === selectedUnitId)?.unit || null
  const activeMasterUnit = activeUnit
    ? {
        id: activeUnit.id,
        code: activeUnit.code,
        name: activeUnit.name,
        categoryName: activeUnit.category?.name || 'OPD'
      }
    : null

  // Hitung master stats per unit
  const mandatoryKeys = new Set(
    PEKPPP_EVIDENCE_SLOTS.filter((p) => p.isMandatory).map((p) => `${p.aspectCode}::${p.slotKey}`)
  )

  const masterStatsMap: Record<string, { filledMandatory: number; totalFiles: number }> = {}
  for (const uid of boundUnitIds) {
    const uMasters = masterRecords.filter((m) => m.unitId === uid)
    let filledMandatory = 0
    let totalFiles = 0
    for (const m of uMasters) {
      if (mandatoryKeys.has(`${m.aspectCode}::${m.slotKey}`)) {
        filledMandatory++
      }
      if (Array.isArray(m.attachments)) {
        totalFiles += m.attachments.length
      } else {
        totalFiles += 1
      }
    }
    masterStatsMap[uid] = { filledMandatory, totalFiles }
  }

  const complianceProfile = selectedUnitId
    ? await EvidenceComplianceService.getUnitComplianceProfile(
        selectedUnitId,
        selectedYear || undefined
      )
    : null

  return (
    <OpdDashboardClient
      key={`${selectedUnitId || 'none'}-${selectedYear || 'all'}`}
      selectedYear={selectedYear}
      isCurrentYearActive={isCurrentYearActive}
      canFillF01={canFillF01}
      timelineResult={timelineResult}
      enrolledUnits={enrolledUnits}
      activeMasterUnit={activeMasterUnit}
      masterStatsMap={masterStatsMap}
      complianceProfile={complianceProfile}
    />
  )
}
