// src/core/domain/dynamic-calculator.ts
// Universal Dynamic Evaluation Calculation Engine (Tahap 2)

export interface DynamicQuestionInput {
  questionNumber: number
  questionCode?: string
  aspectCode?: string | null // null jika Flat List
  score: number | null // Nilai riil 0 - 5 atau skala lain
  maxScore: number // default 5.0
  questionWeight: number // Bobot relatif dalam aspek / form
  aspectWeight?: number // Bobot aspek jika bertingkat (e.g. 24.0)
  isSupplementary?: boolean
}

export interface DynamicAspectResult {
  aspectCode: string
  rawEarned: number
  rawMax: number
  aspectPercentage: number
  weightedContribution: number
}

export interface DynamicCalculationResult {
  totalPercentage: number // 0 - 100%
  scale5: number // 0 - 5.00
  grade: 'A' | 'B' | 'C' | 'D' | 'E'
  predicate: string
  hasAspectGrouping: boolean
  aspectResults: Record<string, DynamicAspectResult>
}

/**
 * Kalkulasi Nilai Universal
 * Mendukung 2 Mode:
 * 1. Mode Berjenjang (Hierarchical / PEKPPP Default): Pertanyaan -> Indikator/Aspek -> Nilai Total
 * 2. Mode Flat (Tanpa Indikator): Pertanyaan langsung diagregasikan ke Nilai Total
 */
export function calculateDynamicEvaluationScore(
  inputs: DynamicQuestionInput[],
  customThresholds?: Array<{ minScore: number; grade: 'A' | 'B' | 'C' | 'D' | 'E'; predicate: string }>
): DynamicCalculationResult {
  const hasGrouping = inputs.some((item) => Boolean(item.aspectCode && item.aspectCode.trim() !== ''))

  let totalPercentage = 0
  const aspectResults: Record<string, DynamicAspectResult> = {}

  if (!hasGrouping) {
    // Mode Flat List
    let earnedWeightSum = 0
    let totalWeightSum = 0

    inputs.forEach((item) => {
      if (!item.isSupplementary) {
        const itemWeight = item.questionWeight || 1.0
        totalWeightSum += itemWeight
        if (item.score !== null && item.score !== undefined && item.maxScore > 0) {
          const ratio = Math.max(0, Math.min(item.score / item.maxScore, 1))
          earnedWeightSum += ratio * itemWeight
        }
      }
    })

    totalPercentage = totalWeightSum > 0 ? (earnedWeightSum / totalWeightSum) * 100 : 0
  } else {
    // Mode Berjenjang (PEKPPP Default)
    // Kelompokkan per aspek
    const grouped = new Map<string, DynamicQuestionInput[]>()
    inputs.forEach((item) => {
      const asp = item.aspectCode || 'OTHER'
      if (!grouped.has(asp)) grouped.set(asp, [])
      grouped.get(asp)!.push(item)
    })

    grouped.forEach((items, aspCode) => {
      let aspectEarned = 0
      let aspectMax = 0
      const aspWeight = items[0]?.aspectWeight ?? 1.0

      items.forEach((q) => {
        if (!q.isSupplementary) {
          const qWeight = q.questionWeight || 1.0
          aspectMax += q.maxScore * qWeight
          if (q.score !== null && q.score !== undefined) {
            aspectEarned += q.score * qWeight
          }
        }
      })

      const aspectPercentage = aspectMax > 0 ? (aspectEarned / aspectMax) * 100 : 0
      const weightedContribution = (aspectPercentage * aspWeight) / 100

      aspectResults[aspCode] = {
        aspectCode: aspCode,
        rawEarned: aspectEarned,
        rawMax: aspectMax,
        aspectPercentage,
        weightedContribution
      }

      totalPercentage += weightedContribution
    })
  }

  // Bound to 0 - 100%
  totalPercentage = Math.max(0, Math.min(100, totalPercentage))
  const scale5 = (totalPercentage / 100) * 5

  // Default Grade Matrix
  const defaultThresholds = [
    { minScore: 90.0, grade: 'A' as const, predicate: 'Pelayanan Prima (Sangat Baik)' },
    { minScore: 75.0, grade: 'B' as const, predicate: 'Baik' },
    { minScore: 60.0, grade: 'C' as const, predicate: 'Cukup' },
    { minScore: 45.0, grade: 'D' as const, predicate: 'Kurang' },
    { minScore: 0.0, grade: 'E' as const, predicate: 'Sangat Kurang' }
  ]

  const thresholds = customThresholds || defaultThresholds
  const matched = thresholds.find((t) => totalPercentage >= t.minScore) || thresholds[thresholds.length - 1]

  return {
    totalPercentage,
    scale5,
    grade: matched.grade,
    predicate: matched.predicate,
    hasAspectGrouping: hasGrouping,
    aspectResults
  }
}
