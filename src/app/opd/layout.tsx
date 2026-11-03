// src/app/opd/layout.tsx
import { requireAuth } from '../../services/auth-guard'
import { db } from '../../services/db'
import { redirect } from 'next/navigation'
import { PEKPPP_EVIDENCE_SLOTS } from '../../core/domain/evidence-slots-preset'
import { OpdSidebar } from '../../components/opd/OpdSidebar'
import { DashboardHeader } from '../../components/layout/DashboardHeader'

export const revalidate = 0

export default async function OpdLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  // Cari periode aktif dan unit akun OPD secara paralel
  const [activePeriod, allBoundUserUnits] = await Promise.all([
    db.evaluationPeriod.findFirst({ where: { isOpen: true } }),
    db.userUnit.findMany({
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
  ])

  const defaultYear = activePeriod?.year || null
  const boundUnitIds = allBoundUserUnits.map((uu) => uu.unitId)

  // Cari seluruh daftar tahun evaluasi untuk unit milik akun ini
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

  // Ambil data evaluasi & master bukti untuk statistik badge di sidebar
  const [evaluations, masterRecords] = await Promise.all([
    db.evaluation.findMany({
      where: {
        unitId: { in: boundUnitIds },
        year: defaultYear || availableYears[0] || 2026
      },
      include: {
        scores: true
      }
    }),
    db.unitEvidenceMaster.findMany({
      where: {
        unitId: { in: boundUnitIds },
        NOT: { fileUrl: '' }
      },
      select: {
        unitId: true,
        aspectCode: true,
        slotKey: true
      }
    })
  ])

  const totalMandatorySlots = PEKPPP_EVIDENCE_SLOTS.filter((s) => s.isMandatory).length
  const mandatoryKeys = new Set(
    PEKPPP_EVIDENCE_SLOTS.filter((p) => p.isMandatory).map((p) => `${p.aspectCode}::${p.slotKey}`)
  )

  const unitStatsMap: Record<
    string,
    {
      evaluasiPercentage?: number
      filledMandatory?: number
      totalMandatory?: number
    }
  > = {}

  for (const uid of boundUnitIds) {
    const ev = evaluations.find((e) => e.unitId === uid)
    const scores = ev?.scores || []
    const filledF01Count = scores.filter(
      (s) => s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)
    ).length
    const evaluasiPercentage = Math.round((filledF01Count / 31) * 100)

    const uMasters = masterRecords.filter((m) => m.unitId === uid)
    let filledMandatory = 0
    for (const m of uMasters) {
      if (mandatoryKeys.has(`${m.aspectCode}::${m.slotKey}`)) {
        filledMandatory++
      }
    }

    unitStatsMap[uid] = {
      evaluasiPercentage,
      filledMandatory,
      totalMandatory: totalMandatorySlots
    }
  }

  const allBoundUnits = allBoundUserUnits.map(({ unit }) => ({
    id: unit.id,
    code: unit.code,
    name: unit.name,
    categoryName: unit.category?.name || 'OPD'
  }))

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand dark:bg-[#0B0C10]">
      {/* Kolom 1: Sidebar OPD Desktop (100vh) & Drawer Mobile */}
      <OpdSidebar
        user={{
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }}
        allBoundUnits={allBoundUnits}
        availableYears={availableYears}
        defaultYear={defaultYear}
        unitStatsMap={unitStatsMap}
      />

      {/* Kolom 2: Lane Kerja Terpadu (Header + Konten dalam 1 Kolom Vertikal) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-brand dark:bg-[#0B0C10]">
        <DashboardHeader role="opd" />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-7 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-7 bg-canvas dark:bg-[#141418] min-w-0 rounded-t-2xl lg:rounded-tr-none lg:rounded-tl-[24px] shadow-[-2px_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[-4px_-4px_24px_rgba(0,0,0,0.6)] dark:border-t lg:dark:border-t dark:border-l lg:dark:border-l dark:border-white/[0.07]">
          {children}
        </main>
      </div>
    </div>
  )
}
