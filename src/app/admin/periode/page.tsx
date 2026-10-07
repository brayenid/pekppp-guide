import { db } from '../../../services/db'
import { requireSuperAdmin } from '../../../services/auth-guard'
import PeriodeClient from './PeriodeClient'

export const revalidate = 0

export default async function PeriodePage() {
  await requireSuperAdmin()

  const periods = await db.evaluationPeriod.findMany({
    orderBy: { year: 'desc' }
  })

  // Ambil data statistik per tahun
  const yearStats: Record<
    number,
    { lokusCount: number; finishedCount: number; avgIpp: number }
  > = {}

  for (const p of periods) {
    const evals = await db.evaluation.findMany({
      where: { year: p.year },
      select: { isFinished: true, finalIppScore: true }
    })

    const lokusCount = evals.length
    const finishedCount = evals.filter((e) => e.isFinished).length
    const rated = evals.filter((e) => e.finalIppScore > 0)
    const avgIpp =
      rated.length > 0
        ? rated.reduce((acc, e) => acc + e.finalIppScore, 0) / rated.length
        : 0

    yearStats[p.year] = {
      lokusCount,
      finishedCount,
      avgIpp
    }
  }

  const allUnits = await db.unit.findMany({
    include: { category: true },
    orderBy: { name: 'asc' }
  })

  return (
    <PeriodeClient
      initialPeriods={periods}
      yearStats={yearStats}
      allUnits={allUnits}
    />
  )
}
