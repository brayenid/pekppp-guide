import { db } from '../src/services/db'
import { calculateEffectiveF03AndIpp } from '../src/core/domain/pekppp-calculator'

async function sync() {
  const periods = await db.evaluationPeriod.findMany()
  const periodMap = new Map(periods.map((p) => [p.year, { quota: p.targetF03Quota || 30, method: p.f03CalculationMethod || 'PROPORTIONAL' }]))

  const evals = await db.evaluation.findMany()
  for (const ev of evals) {
    const config = periodMap.get(ev.year) || { quota: 30, method: 'PROPORTIONAL' }
    const f02Pct = ev.percentage || 0
    const f03RawPct = (ev.f03Count || 0) > 0 ? (ev.f03Percentage || 0) : 0

    const { finalIppScore, effectiveF03Percentage } = calculateEffectiveF03AndIpp({
      f02Percentage: f02Pct,
      f03RawPercentage: f03RawPct,
      f03Count: ev.f03Count || 0,
      targetQuota: config.quota,
      method: config.method
    })

    await db.evaluation.update({
      where: { id: ev.id },
      data: { finalIppScore }
    })
    console.log(`Updated evaluation ${ev.id}: F02=${f02Pct}%, F03=${f03RawPct}% (eff: ${effectiveF03Percentage}%), F03Count=${ev.f03Count}/${config.quota} [${config.method}], finalIppScore=${finalIppScore}`)
  }
}

sync()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
