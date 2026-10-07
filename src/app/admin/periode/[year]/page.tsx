// src/app/admin/periode/[year]/page.tsx
import { db } from '../../../../services/db'
import { requireSuperAdmin } from '../../../../services/auth-guard'
import { notFound } from 'next/navigation'
import PeriodDetailClient from './PeriodDetailClient'

export const revalidate = 0

export default async function PeriodDetailPage({
  params
}: {
  params: Promise<{ year: string }>
}) {
  await requireSuperAdmin()
  const resolvedParams = await params
  const yearNum = Number(resolvedParams.year)
  if (isNaN(yearNum)) notFound()

  const period = await db.evaluationPeriod.findUnique({
    where: { year: yearNum }
  })

  if (!period) notFound()

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

  // Cek apakah ada notifikasi pembaruan F01, revisi pasca penilaian, atau berkas bukti dukung untuk masing-masing unit
  const unitIds = evaluations.map((e) => e.unitId)
  const recentNotifications = await db.notification.findMany({
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

  // Buat map unitId -> status update terbaru
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

  const evaluationsWithUpdates = evaluations.map((ev) => {
    const updateInfo = unitUpdateMap.get(ev.unitId)
    return {
      ...ev,
      recentUpdate: updateInfo || null
    }
  })

  const allUnits = await db.unit.findMany({
    include: { category: true },
    orderBy: { name: 'asc' }
  })

  const { getPeriodTimeline } = await import('../../../../services/period-window-service')
  const timelineResult = await getPeriodTimeline(yearNum)

  return (
    <PeriodDetailClient
      period={period}
      evaluations={evaluationsWithUpdates as any}
      allUnits={allUnits}
      timelineResult={timelineResult as any}
    />
  )
}
