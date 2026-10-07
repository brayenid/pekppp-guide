// src/services/evaluation-service.ts
// Service Layer for Evaluation Operations & Living Document Auto-Inheritance
import { db } from './db'
import { calculatePekpppScore, IndicatorScoreInput } from '../core/domain/pekppp-calculator'

export class EvaluationService {
  /**
   * Mendaftarkan unit lokus ke periode tahun evaluasi baru dengan prinsip 'Living Document'.
   * - Menyiapkan header Evaluasi berstatus DRAFT jika belum ada.
   * - Mencari evaluasi periode sebelumnya (tahun - 1) untuk mewariskan tautan bukti dukung (proofUrl)
   *   ke instrumen tahun baru secara otomatis jika bukti belum diubah.
   * - Menginisialisasi record EvaluationScore untuk seluruh 31 indikator.
   * @param year Tahun periode evaluasi yang dituju.
   * @param unitId ID unit lokus pelayanan publik.
   * @returns Header evaluasi yang berhasil didaftarkan/dibuat.
   */
  static async enrollUnitToPeriod(year: number, unitId: string) {
    // 1. Dapatkan atau buat header Evaluasi
    let evaluation = await db.evaluation.findUnique({
      where: {
        year_unitId: { year, unitId }
      }
    })

    if (!evaluation) {
      const defaultAgenda = await db.evaluationAgenda.findFirst({
        where: { year }
      })

      evaluation = await db.evaluation.create({
        data: {
          year,
          unitId,
          agendaId: defaultAgenda?.id,
          status: 'DRAFT'
        }
      })
    }

    // 2. Cari evaluasi tahun sebelumnya untuk unit ini (Year - 1)
    const previousEvaluation = await db.evaluation.findUnique({
      where: {
        year_unitId: { year: year - 1, unitId }
      },
      include: {
        scores: true
      }
    })

    const prevScoreMap = new Map<string, string | null>()
    if (previousEvaluation) {
      for (const s of previousEvaluation.scores) {
        if (s.proofUrl) {
          prevScoreMap.set(s.indicatorId, s.proofUrl)
        }
      }
    }

    // 3. Ambil seluruh 31 indikator
    const indicators = await db.indicator.findMany()

    // 4. Inisialisasi / Update EvaluationScores dengan auto-inherit Living Document proofUrl
    const operations = indicators.map((ind) => {
      const inheritedProofUrl = prevScoreMap.get(ind.id) ?? null

      return db.evaluationScore.upsert({
        where: {
          evaluationId_indicatorId: {
            evaluationId: evaluation!.id,
            indicatorId: ind.id
          }
        },
        update: {
          // Hanya isi proofUrl dari tahun lalu jika saat ini masih kosong
          proofUrl: inheritedProofUrl ? inheritedProofUrl : undefined
        },
        create: {
          evaluationId: evaluation!.id,
          indicatorId: ind.id,
          proofUrl: inheritedProofUrl
        }
      })
    })

    await db.$transaction(operations)

    return evaluation
  }

  /**
   * Menyimpan dan menghitung nilai evaluasi 31 indikator PEKPPP.
   * - Melakukan upsert skor, catatan evaluasi, dan URL bukti dukung per indikator.
   * - Memanggil kalkulator bobot domain (`calculatePekpppScore`) untuk menghitung persentase F-02.
   * - Menghitung Indeks Pelayanan Publik (IPP) gabungan resmi: bobot 75% F-02 (Evaluator) + 25% F-03 (Survei).
   * - Memperbarui data agregat nilai pada header Evaluation.
   * @param evaluationId ID evaluasi lokus yang dinilai.
   * @param scoresData Array berisi penilaian indikator (indicatorId, score, notes, proofUrl).
   * @returns Objek berisi header evaluasi yang diperbarui dan rincian kalkulasi skor.
   */
  static async saveEvaluationScores(
    evaluationId: string,
    scoresData: Array<{ indicatorId: string; score: number | null; notes?: string; proofUrl?: string }>
  ) {
    // 1. Upsert scores
    const upsertOps = scoresData.map((item) =>
      db.evaluationScore.upsert({
        where: {
          evaluationId_indicatorId: {
            evaluationId,
            indicatorId: item.indicatorId
          }
        },
        update: {
          score: item.score,
          notes: item.notes,
          proofUrl: item.proofUrl
        },
        create: {
          evaluationId,
          indicatorId: item.indicatorId,
          score: item.score,
          notes: item.notes,
          proofUrl: item.proofUrl
        }
      })
    )

    await db.$transaction(upsertOps)

    // 2. Ambil seluruh indikator beserta aspek untuk kalkulasi domain berbobot
    const allScores = await db.evaluationScore.findMany({
      where: { evaluationId },
      include: {
        indicator: {
          include: { aspect: true }
        }
      }
    })

    const calculationInputs: IndicatorScoreInput[] = allScores.map((s) => ({
      indicatorNumber: s.indicator.indicatorNumber,
      aspectCode: s.indicator.aspect.code,
      score: s.score,
      maxScore: s.indicator.maxScore,
      indicatorWeight: s.indicator.indicatorWeight,
      aspectWeight: s.indicator.aspect.aspectWeight,
      isSupplementary: s.indicator.isSupplementary
    }))

    // 3. Panggil domain calculator
    const result = calculatePekpppScore(calculationInputs)

    // 4. Update header Evaluation dengan skor akhir F-02 & IPP Final (75% F-02 + 25% F-03)
    const currentEval = await db.evaluation.findUnique({
      where: { id: evaluationId }
    })

    const f02Percentage = result.totalPercentage
    const f03Percentage = currentEval?.f03Percentage || 0
    const f03Count = currentEval?.f03Count || 0

    let finalIppPercentage = f02Percentage
    if (f03Count > 0) {
      finalIppPercentage = 0.75 * f02Percentage + 0.25 * f03Percentage
    }
    const finalIppScore = (finalIppPercentage / 100) * 5

    const updatedHeader = await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        percentage: result.totalPercentage,
        scale5: result.scale5,
        totalScore: result.totalPercentage,
        finalIppScore
      }
    })

    return { evaluation: updatedHeader, calculation: result }
  }
}
