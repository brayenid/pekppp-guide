// src/core/domain/pekppp-calculator.ts
// Pure Business Logic Domain Layer for PEKPPP Weighted Scoring

export interface IndicatorScoreInput {
  indicatorNumber: number
  aspectCode: string
  score: number | null // 0..5
  maxScore?: number // Default 5
  indicatorWeight: number // e.g. 17.0 (%)
  aspectWeight: number // e.g. 24.0 (%)
  isSupplementary?: boolean
}

export interface AspectScoreResult {
  aspectCode: string
  aspectName: string
  aspectWeight: number
  totalEarnedScore: number
  totalPossibleScore: number
  percentage: number // 0..100%
  weightedContribution: number // (percentage * aspectWeight) / 100
}

export interface PekpppCalculationResult {
  aspectResults: Record<string, AspectScoreResult>
  totalPercentage: number // 0..100%
  scale5: number // 0..5
  grade: 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'F'
  predicate: string
}

export function calculatePekpppScore(inputs: IndicatorScoreInput[]): PekpppCalculationResult {
  const aspectMap = new Map<string, { totalWeightedIndicatorScore: number; aspectWeight: number }>()

  // Filter out supplementary indicators (e.g. Indicator 31) from main score math
  const mainIndicators = inputs.filter((i) => !i.isSupplementary)

  for (const item of mainIndicators) {
    const score = item.score ?? 0
    const maxScore = item.maxScore || 5
    const indicatorRatio = maxScore > 0 ? score / maxScore : 0
    const indicatorContribution = indicatorRatio * item.indicatorWeight // e.g., (4/5) * 17% = 13.6%

    if (!aspectMap.has(item.aspectCode)) {
      aspectMap.set(item.aspectCode, {
        totalWeightedIndicatorScore: 0,
        aspectWeight: item.aspectWeight
      })
    }

    const current = aspectMap.get(item.aspectCode)!
    current.totalWeightedIndicatorScore += indicatorContribution
  }

  const aspectResults: Record<string, AspectScoreResult> = {}
  let totalPercentage = 0

  aspectMap.forEach((val, aspectCode) => {
    // totalWeightedIndicatorScore is the sum of weighted indicator scores (0..100% of this aspect)
    const aspectPercentage = Math.min(val.totalWeightedIndicatorScore, 100)
    const weightedContribution = (aspectPercentage * val.aspectWeight) / 100

    totalPercentage += weightedContribution

    aspectResults[aspectCode] = {
      aspectCode,
      aspectName: aspectCode,
      aspectWeight: val.aspectWeight,
      totalEarnedScore: val.totalWeightedIndicatorScore,
      totalPossibleScore: 100,
      percentage: aspectPercentage,
      weightedContribution
    }
  })

  // Scale 5 = (Total Percentage / 100) * 5
  const scale5 = (totalPercentage / 100) * 5

  // Grade classification based on PermenPANRB standard
  let grade: PekpppCalculationResult['grade'] = 'F'
  let predicate = 'Sangat Buruk'

  if (totalPercentage >= 90) {
    grade = 'A'
    predicate = 'Pelayanan Prima'
  } else if (totalPercentage >= 81) {
    grade = 'A-'
    predicate = 'Sangat Baik'
  } else if (totalPercentage >= 71) {
    grade = 'B'
    predicate = 'Baik'
  } else if (totalPercentage >= 61) {
    grade = 'B-'
    predicate = 'Baik (Dengan Catatan)'
  } else if (totalPercentage >= 51) {
    grade = 'C'
    predicate = 'Cukup'
  } else if (totalPercentage >= 41) {
    grade = 'C-'
    predicate = 'Cukup (Dengan Catatan)'
  } else if (totalPercentage >= 31) {
    grade = 'D'
    predicate = 'Buruk'
  }

  return {
    aspectResults,
    totalPercentage,
    scale5,
    grade,
    predicate
  }
}
