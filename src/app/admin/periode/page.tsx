import { db } from '../../../services/db'
import { requireSuperAdmin } from '../../../services/auth-guard'
import PeriodeClient from './PeriodeClient'

export const revalidate = 0

export default async function PeriodePage() {
  await requireSuperAdmin()

  const [periods, allEvals, allUnits] = await Promise.all([
    db.evaluationPeriod.findMany({
      orderBy: { year: 'desc' }
    }),
    db.evaluation.findMany({
      select: { year: true, isFinished: true, finalIppScore: true }
    }),
    db.unit.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    })
  ])

  // Kelompokkan evaluasi per tahun di memori (O(N) tanpa N+1 query)
  const evalsByYear = new Map<number, typeof allEvals>()
  for (const e of allEvals) {
    const list = evalsByYear.get(e.year) || []
    list.push(e)
    evalsByYear.set(e.year, list)
  }

  // Ambil data statistik per tahun
  const yearStats: Record<
    number,
    { lokusCount: number; finishedCount: number; avgIpp: number }
  > = {}

  for (const p of periods) {
    const evals = evalsByYear.get(p.year) || []
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

  return (
    <PeriodeClient
      initialPeriods={periods}
      yearStats={yearStats}
      allUnits={allUnits}
    />
  )
}
