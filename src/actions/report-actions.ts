'use server'

import { db } from '../services/db'
import { calculatePekpppScore } from '../core/domain/pekppp-calculator'

export interface LokusReportRow {
  evaluationId: string
  unitId: string
  unitName: string
  categoryName: string
  isFinished: boolean
  isPriority: boolean
  aspectScores: {
    kebijakanPelayanan: number
    sdm: number
    sarpras: number
    sipp: number
    konsultasi: number
    inovasi: number
  }
  f02Percentage: number
  f02Scale5: number
  f03Count: number
  f03Percentage: number
  f03Scale5: number
  finalIppPercentage: number
  finalIppScale5: number
  grade: string
  predicate: string
}

export interface ComprehensiveAnnualReport {
  year: number
  periodTitle: string
  isOpen: boolean
  isPublished: boolean
  targetF03Quota: number
  totalUnits: number
  finishedUnits: number
  averageIpp: number
  averageIppPercentage: number
  averageGrade: string
  averagePredicate: string
  gradeDistribution: Record<string, number>
  rows: LokusReportRow[]
}

export async function getComprehensiveAnnualReportAction(year: number): Promise<ComprehensiveAnnualReport | null> {
  const period = await db.evaluationPeriod.findUnique({
    where: { year }
  })

  if (!period) return null

  const evaluations = await db.evaluation.findMany({
    where: { year },
    include: {
      unit: {
        include: { category: true }
      },
      scores: {
        include: {
          indicator: {
            include: { aspect: true }
          }
        },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    },
    orderBy: { unit: { name: 'asc' } }
  })

  const rows: LokusReportRow[] = evaluations.map((ev) => {
    const calcInputs = ev.scores.map((s) => ({
      indicatorNumber: s.indicator.indicatorNumber,
      aspectCode: s.indicator.aspect.code,
      score: s.score,
      maxScore: s.indicator.maxScore,
      indicatorWeight: s.indicator.indicatorWeight,
      aspectWeight: s.indicator.aspect.aspectWeight,
      isSupplementary: s.indicator.isSupplementary
    }))

    const calcResult = calculatePekpppScore(calcInputs)

    const aspectScores = {
      kebijakanPelayanan: calcResult.aspectResults['a']?.percentage || 0,
      sdm: calcResult.aspectResults['b']?.percentage || 0,
      sarpras: calcResult.aspectResults['c']?.percentage || 0,
      sipp: calcResult.aspectResults['d']?.percentage || 0,
      konsultasi: calcResult.aspectResults['e']?.percentage || 0,
      inovasi: calcResult.aspectResults['f']?.percentage || 0
    }

    const f02Percentage = calcResult.totalPercentage
    const f02Scale5 = calcResult.scale5
    const f03Count = ev.f03Count || 0
    const f03Percentage = ev.f03Percentage || 0
    const f03Scale5 = ev.f03Scale5 || 0

    const finalIppPercentage = f03Count > 0
      ? (0.75 * f02Percentage) + (0.25 * f03Percentage)
      : f02Percentage

    const finalIppScale5 = (finalIppPercentage / 100) * 5

    let grade = 'F'
    let predicate = 'Sangat Kurang'
    if (finalIppPercentage >= 90) {
      grade = 'A'
      predicate = 'Pelayanan Prima'
    } else if (finalIppPercentage >= 81) {
      grade = 'A-'
      predicate = 'Sangat Baik'
    } else if (finalIppPercentage >= 71) {
      grade = 'B'
      predicate = 'Baik'
    } else if (finalIppPercentage >= 61) {
      grade = 'B-'
      predicate = 'Baik (Dengan Catatan)'
    } else if (finalIppPercentage >= 51) {
      grade = 'C'
      predicate = 'Cukup'
    } else if (finalIppPercentage >= 41) {
      grade = 'C-'
      predicate = 'Cukup (Dengan Catatan)'
    } else if (finalIppPercentage >= 31) {
      grade = 'D'
      predicate = 'Buruk'
    }

    return {
      evaluationId: ev.id,
      unitId: ev.unitId,
      unitName: ev.unit.name,
      categoryName: ev.unit.category?.name || 'Umum',
      isFinished: ev.isFinished,
      isPriority: ev.isPriority || false,
      aspectScores,
      f02Percentage,
      f02Scale5,
      f03Count,
      f03Percentage,
      f03Scale5,
      finalIppPercentage,
      finalIppScale5,
      grade,
      predicate
    }
  })

  rows.sort((a, b) => b.finalIppScale5 - a.finalIppScale5)

  const totalUnits = rows.length
  const finishedUnits = rows.filter((r) => r.isFinished).length

  const sumIppScale = rows.reduce((acc, r) => acc + r.finalIppScale5, 0)
  const sumIppPct = rows.reduce((acc, r) => acc + r.finalIppPercentage, 0)
  const averageIpp = totalUnits > 0 ? sumIppScale / totalUnits : 0
  const averageIppPercentage = totalUnits > 0 ? sumIppPct / totalUnits : 0

  const gradeDistribution: Record<string, number> = {
    'A': 0, 'A-': 0, 'B': 0, 'B-': 0, 'C': 0, 'C-': 0, 'D': 0, 'F': 0
  }
  rows.forEach((r) => {
    gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1
  })

  let averageGrade = 'F'
  let averagePredicate = 'Sangat Kurang'
  if (averageIppPercentage >= 90) {
    averageGrade = 'A'
    averagePredicate = 'Pelayanan Prima'
  } else if (averageIppPercentage >= 81) {
    averageGrade = 'A-'
    averagePredicate = 'Sangat Baik'
  } else if (averageIppPercentage >= 71) {
    averageGrade = 'B'
    averagePredicate = 'Baik'
  } else if (averageIppPercentage >= 61) {
    averageGrade = 'B-'
    averagePredicate = 'Baik (Dengan Catatan)'
  } else if (averageIppPercentage >= 51) {
    averageGrade = 'C'
    averagePredicate = 'Cukup'
  } else if (averageIppPercentage >= 41) {
    averageGrade = 'C-'
    averagePredicate = 'Cukup (Dengan Catatan)'
  } else if (averageIppPercentage >= 31) {
    averageGrade = 'D'
    averagePredicate = 'Buruk'
  }

  return {
    year,
    periodTitle: period.title || `Evaluasi PEKPPP Tahun ${year}`,
    isOpen: period.isOpen,
    isPublished: period.isPublished,
    targetF03Quota: period.targetF03Quota || 30,
    totalUnits,
    finishedUnits,
    averageIpp,
    averageIppPercentage,
    averageGrade,
    averagePredicate,
    gradeDistribution,
    rows
  }
}
