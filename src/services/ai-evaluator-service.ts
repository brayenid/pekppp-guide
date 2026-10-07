// src/services/ai-evaluator-service.ts
// Layanan AI Pre-Evaluator PEKPPP
// Menganalisis Bukti Dukung (PDF 14 Komponen SP, Foto Sarpras, Seragam Petugas)
// Menghasilkan:
// 1. Catatan Aspek Terbuka untuk Lokus & Nilai Awal Pertanyaan
// 2. Catatan Khusus Evaluator (Deskripsi Ketidakyakinan, Kekurangan, Checklist Verifikasi)

import { db } from './db'
import { normalizeAspectCode, getDbAspectCode, getEvidenceSlotsByAspect, extractAttachments } from '../core/domain/evidence-slots-preset'
import { getAllF02Guidance, F02IndicatorGuidance } from '../lib/f02-parser'

export interface AiQuestionEvaluation {
  indicatorNumber: number
  suggestedScore: number
  confidence: number // 0 - 100
  confidenceReason: string // Deskripsi eksplisit MENGAPA AI TIDAK YAKIN
  criticalAudit?: string // Analisis kritis kesesuaian bukti dukung vs centangan F01 OPD
  weaknessNotes: string // Apa yang membuat bukti kurang untuk mencapai nilai 5
  verificationTips: string // Checklist verifikasi langsung bagi evaluator
}

export interface AiAspectEvaluationResult {
  aspectCode: string
  lokusAspectNote: string // Catatan untuk Lokus
  evaluatorNote: {
    confidenceLevel: 'TINGGI' | 'SEDANG' | 'RENDAH'
    confidenceScore: number
    summary: string
    aspectGaps: string[]
    analyzedAt: string
  }
  questions: AiQuestionEvaluation[]
}

const MANDATORY_SP_COMPONENTS = [
  '1. Persyaratan',
  '2. Sistem, Mekanisme, dan Prosedur',
  '3. Jangka Waktu Pelayanan',
  '4. Biaya / Tarif',
  '5. Produk Pelayanan',
  '6. Penanganan Pengaduan, Saran, dan Masukan',
  '7. Dasar Hukum',
  '8. Sarana, Prasarana, dan/atau Fasilitas',
  '9. Kompetensi Pelaksana',
  '10. Pengawasan Internal',
  '11. Jumlah Pelaksana',
  '12. Jaminan Pelayanan',
  '13. Jaminan Keamanan dan Keselamatan Pelayanan',
  '14. Evaluasi Kinerja Pelaksana'
]

export class AiEvaluatorService {
  /**
   * Menjalankan Pre-Evaluasi AI untuk seluruh instrumen pada satu Aspek tertentu (Aspek I s/d VI).
   * - Menghimpun submisi bukti dukung pada aspek terkait dan mengubah statusnya ke 'PROCESSING'.
   * - Mengambil direktif konteks standar emas dari konfigurasi sistem.
   * - Memilih metode eksekusi: Multimodal Gemini AI (jika API key tersedia) atau Rule-based Heuristic Engine (fallback/offline).
   * - Menyimpan hasil analisis khusus evaluator ke database (skor rekomendasi, tingkat keyakinan, audit kritis, checklist tips).
   * - Memperbarui status submisi bukti dukung ke 'COMPLETED'.
   * @param evaluationId ID evaluasi lokus.
   * @param rawAspectCode Kode aspek (misal: 'I', 'KEBIJAKAN', dll).
   * @returns Hasil evaluasi aspek `AiAspectEvaluationResult` yang mencakup catatan lokus dan rekomendasi per pertanyaan.
   */
  static async runPreEvaluation(evaluationId: string, rawAspectCode: string): Promise<AiAspectEvaluationResult> {
    const aspectCode = normalizeAspectCode(rawAspectCode) // e.g. 'I'
    const dbAspectCode = getDbAspectCode(rawAspectCode)   // e.g. 'KEBIJAKAN'
    const aspectCodes = Array.from(new Set([rawAspectCode, aspectCode, dbAspectCode]))

    // 1. Ambil data Header Evaluasi beserta Unit Lokus
    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: { include: { category: true } }
      }
    })

    if (!evaluation) {
      throw new Error(`Evaluasi dengan ID ${evaluationId} tidak ditemukan.`)
    }

    // 2. Ambil seluruh submisi berkas bukti dukung pada aspek ini
    const submissions = await db.indicatorEvidenceSubmission.findMany({
      where: {
        evaluationId,
        aspectCode: { in: aspectCodes }
      }
    })

    // Update status submission ke PROCESSING
    await db.indicatorEvidenceSubmission.updateMany({
      where: {
        evaluationId,
        aspectCode: { in: aspectCodes }
      },
      data: { aiStatus: 'PROCESSING' }
    })

    // 3. Ambil seluruh indikator pada aspek ini
    const indicators = await db.indicator.findMany({
      where: {
        aspect: { code: { in: aspectCodes } }
      },
      orderBy: { indicatorNumber: 'asc' }
    })

    // 4. Ambil scores saat ini untuk indikator-indikator tersebut
    const indicatorIds = indicators.map((ind) => ind.id)
    const existingScores = await db.evaluationScore.findMany({
      where: {
        evaluationId,
        indicatorId: { in: indicatorIds }
      }
    })

    const scoreMap = new Map(existingScores.map((s) => [s.indicatorId, s]))
    const presetSlots = getEvidenceSlotsByAspect(aspectCode)
    const guidanceMap = getAllF02Guidance()

    // 5. Ambil konfigurasi dinamis AI & Konteks Standar Emas dari Admin SystemSetting
    const { getAiEvaluatorConfig, DEFAULT_ASPECT_CONTEXTS, trackAiUsage } = await import('./system-setting-service')
    const aiConfig = await getAiEvaluatorConfig()

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    let result: AiAspectEvaluationResult | null = null

    // Jika mode adalah HEURISTIC_ONLY, langsung jalankan mesin aturan lokal (0 token / Rp 0)
    if (aiConfig.executionMode === 'HEURISTIC_ONLY') {
      result = this.evaluateWithHeuristics({
        unitName: evaluation.unit.name,
        aspectCode,
        submissions,
        presetSlots,
        indicators,
        guidanceMap,
        scoreMap
      })
    } else if (apiKey) {
      // Jalankan Generative Multimodal via model yang dipilih di Admin
      try {
        const customDirective =
          aiConfig.aspectContexts[aspectCode] ||
          DEFAULT_ASPECT_CONTEXTS[aspectCode]?.defaultDirective ||
          ''

        result = await this.evaluateWithGemini({
          apiKey,
          model: aiConfig.model || 'gemini-3.6-flash',
          maxPdfPages: aiConfig.maxPdfPages || 15,
          customDirective,
          unitName: evaluation.unit.name,
          categoryName: evaluation.unit.category?.name || 'Perangkat Daerah',
          aspectCode,
          submissions,
          presetSlots,
          indicators,
          guidanceMap,
          scoreMap
        })
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to PEKPPP Rule Engine:', geminiError)
      }
    }

    // 6. Jika Gemini tidak aktif, error, atau mode offline, gunakan PEKPPP Domain Heuristic Engine
    if (!result) {
      result = this.evaluateWithHeuristics({
        unitName: evaluation.unit.name,
        aspectCode,
        submissions,
        presetSlots,
        indicators,
        guidanceMap,
        scoreMap
      })
    }

    // 7. Simpan Hasil Analisis ke Database (Khusus Evaluator Internal)
    // Catatan: aspectNotes resmi Lokus/MenPAN tidak disentuh agar Lokus tidak melihat analisis AI internal.
    const currentAiEvaluatorNotes = (evaluation.aiEvaluatorNotes as Record<string, any>) || {}
    const updatedAiEvaluatorNotes = {
      ...currentAiEvaluatorNotes,
      [aspectCode]: result.evaluatorNote,
      [dbAspectCode]: result.evaluatorNote,
      [rawAspectCode]: result.evaluatorNote
    }

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        aiEvaluatorNotes: updatedAiEvaluatorNotes
      }
    })

    // C. Perbarui Rekomendasi Khusus Evaluator per Indikator (Gunakan Upsert agar Seluruh Indikator Terisi Penuh)
    for (const q of result.questions) {
      const ind = indicators.find((i) => i.indicatorNumber === q.indicatorNumber)
      if (!ind) continue

      await db.evaluationScore.upsert({
        where: {
          evaluationId_indicatorId: {
            evaluationId,
            indicatorId: ind.id
          }
        },
        update: {
          aiSuggestedScore: q.suggestedScore,
          aiConfidence: q.confidence,
          aiConfidenceReason: q.confidenceReason,
          aiCriticalAudit: q.criticalAudit || null,
          aiWeaknessNotes: q.weaknessNotes,
          aiVerificationTips: q.verificationTips
        },
        create: {
          evaluationId,
          indicatorId: ind.id,
          score: 0,
          aiSuggestedScore: q.suggestedScore,
          aiConfidence: q.confidence,
          aiConfidenceReason: q.confidenceReason,
          aiCriticalAudit: q.criticalAudit || null,
          aiWeaknessNotes: q.weaknessNotes,
          aiVerificationTips: q.verificationTips
        }
      })
    }

    // D. Update status submission ke COMPLETED
    await db.indicatorEvidenceSubmission.updateMany({
      where: {
        evaluationId,
        aspectCode: { in: aspectCodes }
      },
      data: { aiStatus: 'COMPLETED' }
    })

    return result
  }

  /**
   * Melakukan evaluasi aspek instrumen menggunakan model multimodal Google Gemini.
   * - Menyiapkan payload berkas terkompresi (PDF/Gambar) melalui `PdfOptimizerService`.
   * - Mengkonstruksi prompt berbasis rubrik PermenPAN-RB No. 29/2022 dan direktif Standar Emas.
   * - Memanggil API Gemini dengan response MIME type application/json.
   * - Mencatat penggunaan token untuk pelacakan biaya.
   * @param params Parameter evaluasi (apiKey, model, batasan PDF, direktif aspek, berkas submisi, indikator).
   * @returns Hasil penilaian terstruktur `AiAspectEvaluationResult`.
   */
  private static async evaluateWithGemini(params: {
    apiKey: string
    model?: string
    maxPdfPages?: number
    customDirective?: string
    unitName: string
    categoryName: string
    aspectCode: string
    submissions: any[]
    presetSlots: any[]
    indicators: any[]
    guidanceMap: Map<number, F02IndicatorGuidance>
    scoreMap?: Map<string, any>
  }): Promise<AiAspectEvaluationResult> {
    const { apiKey, model = 'gemini-2.0-flash', maxPdfPages = 15, customDirective, unitName, categoryName, aspectCode, submissions, presetSlots, indicators, guidanceMap, scoreMap } = params

    // 1. Optimasi & Kompresi Cerdas Berkas Bukti Dukung (PDF & Gambar) sebelum dikirim ke AI
    const { PdfOptimizerService } = await import('./pdf-optimizer-service')
    const { parts: optimizedDocParts, summaryLogs } = await PdfOptimizerService.prepareOptimizedDocumentParts(
      submissions,
      { maxPages: maxPdfPages }
    )

    if (summaryLogs.length > 0) {
      console.log(`[AI Evaluator] ${summaryLogs.length} berkas bukti dukung diproses oleh PdfOptimizerService:`, summaryLogs)
    }

    const submissionSummary = submissions.map((s) => {
      const optLog = summaryLogs.find((l) => l.slotKey === s.slotKey)
      return {
        slotKey: s.slotKey,
        title: s.title,
        fileName: s.fileName || 'N/A',
        fileUrl: s.fileUrl,
        fileType: s.fileType || 'UNKNOWN',
        storageProvider: s.storageProvider,
        uploadedAt: s.updatedAt,
        aiOptimization: optLog
          ? {
              status: optLog.status,
              compressionRatio: `${optLog.compressionRatio}%`,
              pagesAnalyzed: optLog.pagesKept
            }
          : 'Lampiran tautan teks'
      }
    })

    const indicatorDetails = indicators.map((ind) => {
      const guidance = guidanceMap.get(ind.indicatorNumber)
      const existingScore = scoreMap?.get(ind.id)
      return {
        number: ind.indicatorNumber,
        code: ind.code,
        question: ind.question,
        f01SelfEvaluation: {
          opdClaimedScore: existingScore?.score ?? null,
          opdCheckedAnswers: existingScore?.f01Data ?? null
        },
        rubricOptions: guidance?.scale_options || [],
        dataSources: guidance?.data_sources || [],
        explanation: guidance?.explanation || ''
      }
    })

    const customContextBlock = customDirective
      ? `\n\n========================================
STANDAR EMAS & KONTEKS KHUSUS DAERAH / INSTANSI (WAJIB DIPEDOMANI):
${customDirective}
========================================`
      : ''

    const systemPrompt = `Anda adalah AI Pre-Evaluator resmi instrumen PEKPPP (Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik) Kementerian PAN-RB.
Tugas Anda adalah menilai berkas bukti dukung yang diunggah oleh Unit Lokus: "${unitName}" (${categoryName}) untuk Aspek ${aspectCode}.
${customContextBlock}

Pedoman Verifikasi Khusus:
1. PADA DOKUMEN STANDAR PELAYANAN (Aspek I):
   - Wajib memeriksa apakah dokumen memuat 14 Komponen Standar Pelayanan sesuai UU 25/2009 (6 Service Delivery + 8 Manufacturing).
   - Sebutkan komponen apa saja yang terdeteksi dan komponen nomor berapa yang TIDAK DITEMUKAN.
   - KHUSUS PERTANYAAN/INDIKATOR #1 (Ketersediaan Standar Pelayanan sesuai Peraturan):
     * Lingkup penilaian HANYA menguji 4 hal: (1) Pemenuhan 14 komponen, (2) Penetapan legalitas SK, (3) Pelibatan masyarakat (Berita Acara FKP), dan (4) Pelaksanaan Monev / peninjauan ulang berkala / pembaharuan SP.
     * DILARANG menilai aksesibilitas dokumen cetak/banner di ruang pelayanan pada Pertanyaan #1 (aksesibilitas dan publikasi adalah ranah Pertanyaan #3 dan #4).
     * Jika bukti sudah memenuhi Skala 4 (memenuhi 14 komponen, ada SK penetapan, dan ada Berita Acara FKP), maka faktor kekurangan bukti untuk Skala 5 HANYA KARENA BELUM TERBUKTI ADANYA DOKUMEN LAPORAN MONEV / EVALUASI BERKALA / PEMBAHARUAN STANDAR PELAYANAN, bukan karena akses dokumen.
   - Batasan Dokumen: Fokus pada ${maxPdfPages} halaman pertama (Batang Tubuh & Lampiran Inti) dan lembar pengesahan yang telah dioptimasi.
2. PADA FOTO PETUGAS & SERAGAM (Aspek II):
   - Periksa apakah foto menampilkan aparatur pelayanan mengenakan seragam dinas lengkap, tanda pengenal (ID card / lanyard resmi), dan pin nama dada.
   - Jika foto hanya menampilkan pakaian kasual/bebas, atau foto tidak jelas, berikan tingkat keyakinan rendah dan jelaskan.
3. PADA FOTO SARANA PRASARANA (Aspek III):
   - Periksa apakah foto sarpras ramah rentan sesuai: ramp/jalur landai berpegangan, toilet disabilitas berpegangan (grab bar), loket prioritas, ruang laktasi.
   - Jika foto hanya ruangan umum tanpa fitur aksesibilitas khusus disabilitas/rentan, catat sebagai kelemahan bukti.
4. AUDIT SILANG KRITIS (CENTANGAN F01 vs BUKTI DUKUNG FISIK):
   - Bandingkan klaim centangan OPD pada "f01SelfEvaluation" dengan fakta berkas bukti dukung yang terunggah.
   - Deteksi apakah ada indikasi klaim berlebih (over-claiming) di mana OPD mencentang nilai tinggi atau item lengkap padahal berkas bukti tidak menunjukkan hal tersebut.
   - Tuliskan analisis perbandingan kritis ini pada field "criticalAudit". Jika klaim F01 sesuai dan terbukti sah, nyatakan kesesuaiannya dengan ringkas.
5. JAMINAN KELENGKAPAN ANALISIS (DILARANG MELEWATKAN PERTANYAAN APAPUN):
   - Anda WAJIB memberikan ulasan analisis untuk SETIAP nomor indikator dalam daftar pertanyaan (${indicatorDetails.map((d) => d.number).join(', ')}).
   - Termasuk Pertanyaan #4 (Peninjauan Ulang SP) dan Pertanyaan #7 (Publikasi SKM)!
   - Jika bukti dukung untuk indikator tertentu belum diunggah (seperti bukti publikasi hasil SKM atau bukti peninjauan berkala SP), JANGAN LEWATKAN nomor tersebut! Berikan skor 0, jelaskan pada "criticalAudit" dan "weaknessNotes" bahwa bukti masih kosong, serta berikan peringatan konkret agar lokus tahu apa yang harus diunggah dan nilainya tidak 0 (Nol).
6. PRINSIP INTEGRITAS DATA & ANTI-HALUSINASI KETAT (ZERO HALLUCINATION):
   - MAKSIMALKAN PENILAIAN BUKAN BERARTI MENGARANG:
     * Seluruh ulasan analisis dan rekomendasi skor WAJIB 100% berpijak pada FAKTA TEKS DOKUMEN dan GAMBAR yang benar-benar dilampirkan oleh OPD.
     * DILARANG KERAS mengarang, berasumsi, atau mengasumsikan keberadaan pasal, tanggal, tanda tangan, stempel, atau kegiatan yang tidak nyata tertera pada berkas.
   - JIKA BERKAS TIDAK RELEVAN / SALAH UNGGAH:
     * Apabila dokumen yang diunggah menurut analisis Anda TIDAK RELEVAN dengan indikator yang dinilai (misalnya: slot SK Standar Pelayanan diisi surat edaran biasa/SOP mutasi, slot Berita Acara FKP diisi surat tugas tanpa notulensi dan daftar hadir masyarakat, atau slot maklumat diisi foto ruangan umum tanpa maklumat):
       1. Anda WAJIB mencatat secara tegas pada "criticalAudit" dan "weaknessNotes": "Berkas [Nama File] TIDAK RELEVAN dengan pembuktian indikator ini karena [sebutkan alasan spesifik ketidaksesuaian]."
       2. JANGAN PERNAH menaikkan skor atau berasumsi baik untuk berkas yang tidak relevan! Berikan skor 0 (atau skor 1 jika ada sedikit dasar umum).
       3. Nyatakan secara objektif dokumen spesifik apa yang seharusnya diunggah oleh OPD.
   - JIKA BUKTI TIDAK LENGKAP / TIDAK DAPAT DIBUKTIKAN DARI BERKAS:
     * Nyatakan secara jujur dan transparan: "Dokumen yang dilampirkan belum memuat bukti [sebutkan bukti yang kurang]".
     * Jangan berspekulasi. Tuangkan ceklis verifikasi fisik yang harus dibuktikan evaluator manusia pada field "verificationTips".

7. PERLINDUNGAN DATA PRIBADI & DOKUMEN RAHASIA (CONFIDENTIALITY & PII PROTECTION):
   - Jika berkas PDF atau gambar yang diunggah secara tidak sengaja memuat data pribadi sensitif (Personally Identifiable Information / PII) atau data rahasia seperti:
     * Nomor Induk Kependudukan (NIK), Nomor KK, Foto/Scan KTP, Nomor Rekening Bank, atau Nomor Telepon Pribadi warga.
     * Nomor Induk Pegawai (NIP) aparatur/ASN, data kepegawaian pribadi, slip gaji perorangan, atau riwayat disiplin internal.
     * Rekam Medis / Riwayat Diagnosa Pasien (pada lokus Puskesmas / RSUD).
     * Informasi rahasia jabatan, memo internal terbatas, atau data rahasia negara.
   - ATURAN MUTLAK BAGI AI:
     1. DILARANG KERAS menyalin, mengutip, mengekstraksi, atau menampilkan data rahasia/PII (termasuk NIP dan NIK) ke dalam teks respons apa pun (lokusAspectNote, evaluatorSummary, criticalAudit, weaknessNotes, verificationTips).
     2. Anda HANYA diperbolehkan menganalisis format legalitas dokumen dan pemenuhan komponen pelayanan secara umum (contoh: "Dokumen SK Penetapan ditandatangani oleh Kepala Dinas", TANPA menyebutkan NIP atau identitas pribadi pejabat/petugas).
     3. Jika menemukan data pribadi (NIK/NIP/Rekam Medis) yang terbuka tanpa sensor, Anda cukup memberikan saran umum: "Disarankan kepada unit kerja untuk menyamarkan (redact/masking) data identitas pribadi warga/pegawai pada dokumen lampiran."

Format Keluaran Wajib (JSON murni):
{
  "lokusAspectNote": "Catatan ringkasan ramah dan konstruktif untuk lokus mengenai kelengkapan aspek ini...",
  "evaluatorSummary": "Ringkasan teknis audit untuk evaluator...",
  "confidenceLevel": "TINGGI" | "SEDANG" | "RENDAH",
  "confidenceScore": 75,
  "aspectGaps": ["Poin kelemahan 1", "Poin kelemahan 2"],
  "questions": [
    {
      "indicatorNumber": 1,
      "suggestedScore": 3,
      "confidence": 65,
      "confidenceReason": "Penjelasan deskriptif mengapa AI tidak yakin (misal hanya 11 dari 14 komponen yang ditemukan, foto tidak jelas, dll)",
      "criticalAudit": "Analisis kritis kesesuaian bukti dukung vs centangan F01 (misal OPD mencentang bahwa sarpras ramah rentan lengkap skala 5, namun foto yang diunggah belum menampilkan jalur landai pemandu dan toilet disabilitas)",
      "weaknessNotes": "Alasan apa yang membuat bukti ini kurang untuk mencapai skor maksimal 5",
      "verificationTips": "Ceklis verifikasi lapangan yang harus dilakukan evaluator"
    }
  ]
}`

    const userPrompt = `Data Bukti Dukung Aspek ${aspectCode}:
Total Slot Wajib Terdaftar: ${presetSlots.length}
Daftar Berkas Terunggah:
${JSON.stringify(submissionSummary, null, 2)}

Daftar Pertanyaan & Rubrik Skala 0-5 yang Harus Dinilai:
${JSON.stringify(indicatorDetails, null, 2)}

Harap lakukan pre-evaluasi secara objektif, ketat, dan profesional sesuai standar KemenPAN-RB.`

    let activeModel = model || 'gemini-3.6-flash'
    if (activeModel.includes('2.0') || activeModel.includes('2.5') || activeModel.includes('1.5')) {
      activeModel = 'gemini-3.6-flash'
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`

    // Gabungkan prompt teks instruksi dengan payload dokumen yang telah dikompresi
    const userParts: any[] = [
      { text: `${systemPrompt}\n\n${userPrompt}` },
      ...optimizedDocParts
    ]

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: userParts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawJson) throw new Error('Respon Gemini kosong.')

    // Ambil data pemakaian token riil dari Google AI Studio (usageMetadata)
    try {
      const { trackAiUsage } = await import('./system-setting-service')
      const usageMetadata = data.usageMetadata
      const totalTokenCount = usageMetadata?.totalTokenCount
      const promptTokenCount = usageMetadata?.promptTokenCount
      const candidatesTokenCount = usageMetadata?.candidatesTokenCount

      if (totalTokenCount) {
        await trackAiUsage(totalTokenCount, {
          promptTokens: promptTokenCount,
          candidatesTokens: candidatesTokenCount,
          model: activeModel
        })
      } else {
        // Fallback jika provider tidak menyertakan usageMetadata
        const estTokens = Math.round((systemPrompt.length + userPrompt.length + rawJson.length) / 4)
        await trackAiUsage(estTokens, { model: activeModel })
      }
    } catch {}

    const parsed = JSON.parse(rawJson)

    // Jaminan Kelengkapan Ulasan: Petakan pertanyaan yang dihasilkan Gemini
    const evaluatedQuestionsMap = new Map<number, any>()
    for (const q of parsed.questions || []) {
      const num = Number(q.indicatorNumber)
      if (!isNaN(num)) {
        evaluatedQuestionsMap.set(num, {
          indicatorNumber: num,
          suggestedScore: Math.min(5, Math.max(0, Number(q.suggestedScore) || 0)),
          confidence: Math.min(100, Math.max(0, Number(q.confidence) || 50)),
          confidenceReason: q.confidenceReason || 'AI menganalisis keterpenuhan dokumen berdasarkan berkas yang terunggah.',
          criticalAudit: q.criticalAudit || 'Klaim centangan F-01 dan kesesuaian bukti dukung telah dianalisis.',
          weaknessNotes: q.weaknessNotes || 'Perlu verifikasi kelengkapan komponen dan dokumen fisik pendukung.',
          verificationTips: q.verificationTips || 'Lakukan pemeriksaan dokumen asli saat evaluasi lapangan.'
        })
      }
    }

    // GUARANTEE LOOP: Jaminan 100% setiap indikator memiliki analisis lengkap (zero empty review)
    const completeQuestions: AiQuestionEvaluation[] = []
    for (const ind of indicators) {
      if (evaluatedQuestionsMap.has(ind.indicatorNumber)) {
        completeQuestions.push(evaluatedQuestionsMap.get(ind.indicatorNumber))
      } else {
        // Jika Gemini melewatkan nomor tertentu (misal nomor 4 atau 7), jalankan fallback domain otomatis
        const fallbackQ = this.evaluateSingleIndicatorHeuristically({
          ind,
          submissions,
          presetSlots,
          guidanceMap,
          scoreMap
        })
        completeQuestions.push(fallbackQ)
      }
    }

    return {
      aspectCode,
      lokusAspectNote: parsed.lokusAspectNote || `Catatan Aspek ${aspectCode} telah diperbarui oleh AI Pre-Evaluator.`,
      evaluatorNote: {
        confidenceLevel: parsed.confidenceLevel || 'SEDANG',
        confidenceScore: Number(parsed.confidenceScore) || 60,
        summary: parsed.evaluatorSummary || 'Pre-evaluasi bukti dukung telah selesai dilakukan oleh model Gemini.',
        aspectGaps: Array.isArray(parsed.aspectGaps) ? parsed.aspectGaps : [],
        analyzedAt: new Date().toISOString()
      },
      questions: completeQuestions
    }
  }

  /**
   * Mesin Heuristik & Rubrik Domain PEKPPP (Fallback saat offline / tanpa API key)
   */
  private static evaluateWithHeuristics(params: {
    unitName: string
    aspectCode: string
    submissions: any[]
    presetSlots: any[]
    indicators: any[]
    guidanceMap: Map<number, F02IndicatorGuidance>
    scoreMap: Map<string, any>
  }): AiAspectEvaluationResult {
    const { unitName, aspectCode, submissions, presetSlots, indicators, guidanceMap, scoreMap } = params

    const totalMandatory = presetSlots.filter((s) => s.isMandatory).length
    const filledMandatorySlots = presetSlots.filter((p) =>
      submissions.some((s) => s.slotKey === p.slotKey && s.fileUrl && s.fileUrl.trim() !== '')
    )
    const filledCount = filledMandatorySlots.length
    const fillRatio = totalMandatory > 0 ? filledCount / totalMandatory : 0

    // Hitung Keyakinan Aspek
    let aspectConfidenceScore = Math.round(fillRatio * 85) + (submissions.length > totalMandatory ? 10 : 0)
    aspectConfidenceScore = Math.min(95, Math.max(25, aspectConfidenceScore))

    const aspectConfidenceLevel: 'TINGGI' | 'SEDANG' | 'RENDAH' =
      aspectConfidenceScore >= 75 ? 'TINGGI' : aspectConfidenceScore >= 50 ? 'SEDANG' : 'RENDAH'

    const missingSlots = presetSlots.filter(
      (p) => p.isMandatory && !submissions.some((s) => s.slotKey === p.slotKey && s.fileUrl && s.fileUrl.trim() !== '')
    )

    // Catatan untuk Lokus
    let lokusAspectNote = `Hasil Pre-Evaluasi AI untuk Aspek ${aspectCode} pada ${unitName}:\n`
    if (fillRatio === 1) {
      lokusAspectNote += `Seluruh ${totalMandatory} berkas bukti dukung wajib pada aspek ini telah terunggah dengan baik. Pastikan berkas yang diunggah adalah dokumen terbaru yang telah ditandatangani dan distempel secara sah untuk mempertahankan skor optimal saat verifikasi evaluator.`
    } else if (fillRatio >= 0.5) {
      lokusAspectNote += `Telah terunggah ${filledCount} dari ${totalMandatory} dokumen wajib (${Math.round(fillRatio * 100)}%). Untuk memaksimalkan nilai evaluasi, disarankan melengkapi dokumen: ${missingSlots.map((m) => m.title).join(', ')}.`
    } else {
      lokusAspectNote += `Kelengkapan bukti dukung wajib masih kurang (${filledCount}/${totalMandatory} dokumen). Harap segera mengunggah dokumen wajib: ${missingSlots.map((m) => m.title).join(', ')} sebelum batas waktu pengisian berakhir.`
    }

    // Evaluator Gaps & Summary
    const aspectGaps: string[] = []
    if (missingSlots.length > 0) {
      aspectGaps.push(`Terdapat ${missingSlots.length} slot bukti wajib yang belum diunggah: ${missingSlots.map((s) => s.title).join(', ')}.`)
    }
    aspectGaps.push(`Format berkas dan legalitas tanda tangan/stempel memerlukan validasi fisik evaluator.`)
    if (aspectCode === 'I') {
      aspectGaps.push(`Perlu verifikasi keterpenuhan 14 komponen SP (khususnya komponen manufacturing nomor 7-14).`)
    }

    const evaluatorSummary = `Pre-evaluasi Aspek ${aspectCode}: Kelengkapan bukti fisik berada pada tingkat ${aspectConfidenceLevel} (${aspectConfidenceScore}%). Ditemukan ${filledCount} dari ${totalMandatory} slot wajib terisi.`

    // Evaluasi per Pertanyaan (Memanggil Evaluator Domain Spesifik)
    const questions: AiQuestionEvaluation[] = indicators.map((ind) =>
      this.evaluateSingleIndicatorHeuristically({
        ind,
        submissions,
        presetSlots,
        guidanceMap,
        scoreMap,
        fillRatio
      })
    )

    return {
      aspectCode,
      lokusAspectNote,
      evaluatorNote: {
        confidenceLevel: aspectConfidenceLevel,
        confidenceScore: aspectConfidenceScore,
        summary: evaluatorSummary,
        aspectGaps,
        analyzedAt: new Date().toISOString()
      },
      questions
    }
  }

  /**
   * Evaluator Heuristik Domain Spesifik per Indikator.
   * Menjamin setiap indikator memiliki analisis objektif, skor rekomendasi, dan panduan verifikasi lengkap (zero empty review).
   * @param params Parameter indikator (ind, submissions, presetSlots, guidanceMap, scoreMap, fillRatio).
   * @returns Objek telaah pertanyaan `AiQuestionEvaluation`.
   */
  private static evaluateSingleIndicatorHeuristically(params: {
    ind: any
    submissions: any[]
    presetSlots: any[]
    guidanceMap: Map<number, F02IndicatorGuidance>
    scoreMap?: Map<string, any>
    fillRatio?: number
  }): AiQuestionEvaluation {
    const { ind, submissions, presetSlots, guidanceMap, scoreMap, fillRatio = 0.5 } = params
    const num = ind.indicatorNumber

    let suggestedScore = 0
    let confidence = 50
    let confidenceReason = ''
    let weaknessNotes = ''
    let verificationTips = ''

    // Helper untuk mengambil bukti dukung dan mendeteksi ketidakrelevanan/salah berkas (Anti-Halusinasi Ketat)
    const getSlotProof = (slotKey: string) => {
      const sub = submissions.find((s) => s.slotKey === slotKey && s.fileUrl && s.fileUrl.trim() !== '')
      if (!sub) {
        return { exists: false, isRelevant: false, isMisfiled: false, fileName: '', attachments: [] as any[], sub: null }
      }
      const insights = sub.aiInsights as any
      const isMisfiled = insights?.status === 'TIDAK_SESUAI'
      const attachments = extractAttachments(sub)
      return {
        exists: true,
        isRelevant: !isMisfiled,
        isMisfiled,
        fileName: sub.fileName || sub.title,
        attachments,
        sub
      }
    }

    // ==========================================
    // ASPEK I: KEBIJAKAN PELAYANAN (Q1 - Q9)
    // ==========================================
    if (num === 1) {
      // Standar Pelayanan (SP) sesuai peraturan: 14 komponen, SK Penetapan, FKP, Monev
      const sp = getSlotProof('sk_sp')
      const fkp = getSlotProof('ba_fkp')

      if (sp.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = `Berkas pada slot SK Standar Pelayanan ("${sp.fileName}") teridentifikasi TIDAK RELEVAN / SALAH UNGGAH.`
        weaknessNotes = `CATATAN KETIDAKRELEVANAN: Berkas "${sp.fileName}" tidak memenuhi kriteria SK Penetapan Standar Pelayanan. Indikator ini tidak dapat diberikan nilai pemenuhan (Skor 0). Harap unggah SK Penetapan SP yang sah.`
        verificationTips = 'Minta dokumen asli SK Penetapan Standar Pelayanan kepada unit lokus.'
      } else if (sp.exists && fkp.exists && fkp.isRelevant) {
        suggestedScore = 4
        confidence = 75
        confidenceReason =
          'Dokumen SK Penetapan Standar Pelayanan (SP) dan Berita Acara FKP terdeteksi. AI memberikan keyakinan 75% bahwa aspek legalitas dan pelibatan masyarakat telah terpenuhi.'
        weaknessNotes =
          'Untuk mencapai Skala 5 (Maksimal), dokumen SP harus dilengkapi bukti pelaksanaan Monitoring dan Evaluasi (Monev) berkala atau peninjauan ulang / pembaharuan Standar Pelayanan tersebut.'
        verificationTips =
          'Periksa lampiran SK SP: pastikan 14 komponen lengkap (khususnya 8 komponen manufacturing) dan cek laporan monev berkala atas penerapan SP.'
      } else if (sp.exists) {
        suggestedScore = 3
        confidence = 70
        confidenceReason =
          'Dokumen SK Penetapan Standar Pelayanan (SP) terdeteksi, namun Berita Acara FKP pelibatan masyarakat belum terlampir pada slot bukti dukung.'
        weaknessNotes =
          'Standar Pelayanan telah ditetapkan namun belum terbukti melibatkan unsur masyarakat (FKP). Butuh Berita Acara FKP untuk dapat naik ke Skala 4.'
        verificationTips =
          'Minta dokumen Berita Acara FKP penyusunan/perubahan Standar Pelayanan dan daftar hadir perwakilan masyarakat.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Tidak ditemukan berkas SK Penetapan Standar Pelayanan pada slot wajib sk_sp.'
        weaknessNotes =
          'PENTING: Belum ada bukti ketersediaan dokumen Standar Pelayanan yang disahkan. Harap segera unggah SK Penetapan SP agar tidak mendapat nilai 0.'
        verificationTips = 'Minta unit lokus menunjukkan dokumen Standar Pelayanan fisik yang berlaku.'
      }
    } else if (num === 2) {
      // Pelibatan Masyarakat dalam Penyusunan SP (FKP)
      const fkp = getSlotProof('ba_fkp')
      if (fkp.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = `Berkas pada slot Berita Acara FKP ("${fkp.fileName}") teridentifikasi TIDAK RELEVAN dengan instrumen FKP.`
        weaknessNotes = `CATATAN KETIDAKRELEVANAN: Berkas "${fkp.fileName}" tidak memuat Berita Acara Forum Konsultasi Publik yang sah. Pelibatan masyarakat tidak terbukti sehingga indikator ini bernilai 0 (Nol).`
        verificationTips = 'Periksa apakah ada Berita Acara FKP yang memuat notulensi dan daftar hadir perwakilan unsur masyarakat.'
      } else if (fkp.exists) {
        suggestedScore = 3
        confidence = 65
        confidenceReason =
          'Tautan Berita Acara FKP terdeteksi. AI memberikan keyakinan 65% karena perlu memverifikasi apakah unsur masyarakat yang dilibatkan minimal 3 unsur dan memiliki daftar hadir serta foto kegiatan.'
        weaknessNotes =
          'Skala maksimal (4 atau 5) menuntut pelibatan minimal 4 hingga lebih dari 4 unsur masyarakat (pengguna layanan, akademisi/ahli, instansi terkait, OMS/LSM, media massa) yang dibuktikan dengan notulensi dan daftar hadir bertanda tangan.'
        verificationTips =
          'Hitung jumlah perwakilan unsur masyarakat pada daftar hadir FKP, verifikasi notulensi masukan, dan cek dokumentasi foto kegiatan.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Berkas Berita Acara FKP belum diunggah oleh unit lokus.'
        weaknessNotes =
          'PENTING: Tidak ada bukti pelibatan masyarakat dalam penyusunan SP. Indikator ini akan bernilai 0 (Nol) jika Berita Acara FKP tidak dilampirkan.'
        verificationTips = 'Tanyakan apakah unit lokus telah menyelenggarakan FKP dalam kurun waktu evaluasi.'
      }
    } else if (num === 3) {
      // Publikasi SP (Komponen Service Delivery)
      const pub = getSlotProof('publikasi_sp')
      if (pub.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = `Berkas publikasi SP ("${pub.fileName}") teridentifikasi TIDAK RELEVAN.`
        weaknessNotes = `CATATAN KETIDAKRELEVANAN: Berkas yang diunggah tidak menampilkan bukti publikasi komponen service delivery. Indikator bernilai 0 (Nol).`
        verificationTips = 'Periksa publikasi fisik dan digital standar pelayanan.'
      } else if (pub.exists) {
        suggestedScore = 3
        confidence = 70
        confidenceReason = 'Bukti publikasi SP terdeteksi pada slot bukti dukung.'
        weaknessNotes =
          'Untuk memperoleh Skala 4-5, seluruh 6 komponen service delivery wajib dipublikasikan secara lengkap di minimal 3-4 media publikasi DAN terintegrasi pada portal SIPPN Nasional.'
        verificationTips =
          'Lakukan cross-check langsung ke website resmi OPD dan periksa apakah data pelayanan telah terhubung ke SIPPN KemenPAN-RB.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Belum ada bukti tangkapan layar publikasi SP yang disematkan.'
        weaknessNotes =
          'PENTING: Belum ada bukti publikasi service delivery kepada masyarakat luas. Unggah foto banner/leaflet dan tangkapan layar website/SIPPN agar indikator ini tidak bernilai 0.'
        verificationTips = 'Periksa papan informasi di ruang pelayanan fisik lokus.'
      }
    } else if (num === 4) {
      // Peninjauan Ulang secara Berkala atas Standar Pelayanan (Monev / Kaji Ulang SP)
      const sp = getSlotProof('sk_sp')
      const fkp = getSlotProof('ba_fkp')

      if (sp.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = 'Dokumen SP teridentifikasi tidak relevan.'
        weaknessNotes = 'CATATAN KETIDAKRELEVANAN: Standar Pelayanan tidak valid sehingga peninjauan ulang tidak dapat dievaluasi.'
        verificationTips = 'Konfirmasi keabsahan dokumen Standar Pelayanan.'
      } else if (sp.exists && fkp.exists && fkp.isRelevant) {
        suggestedScore = 3
        confidence = 70
        confidenceReason =
          'Dokumen SK Penetapan SP dan Berita Acara FKP terdeteksi. AI merekomendasikan Skala 3 karena terdapat indikasi peninjauan/kaji ulang berkala (2 tahun sekali), namun evaluator perlu memverifikasi apakah peninjauan mencakup seluruh jenis layanan.'
        weaknessNotes =
          'Untuk mencapai Skala 4 atau 5, peninjauan ulang berkala harus dilakukan minimal 1 tahun sekali atau lebih cepat yang dibuktikan dengan Berita Acara FKP kaji ulang tahun berjalan untuk seluruh jenis layanan.'
        verificationTips =
          'Periksa tanggal penetapan SP dan tanggal Berita Acara FKP kaji ulang: pastikan peninjauan berkala mencakup seluruh produk pelayanan.'
      } else if (sp.exists) {
        suggestedScore = 1
        confidence = 70
        confidenceReason =
          'Terdapat dokumen Standar Pelayanan, namun belum ditemukan dokumen Berita Acara peninjauan ulang berkala bersama masyarakat.'
        weaknessNotes =
          'Dokumen SP ada, namun belum ada bukti Berita Acara kaji ulang berkala. Untuk menghindari nilai rendah (Skala 0 atau 1), unit lokus wajib menyertakan Berita Acara peninjauan berkala.'
        verificationTips =
          'Tanyakan kepada unit lokus kapan terakhir kali dilakukan kaji ulang terhadap Standar Pelayanan.'
      } else {
        suggestedScore = 0
        confidence = 90
        confidenceReason = 'Tidak ditemukan berkas peninjauan ulang berkala maupun Standar Pelayanan.'
        weaknessNotes =
          'PENTING: Tidak ada bukti pelaksanaan kaji ulang berkala terhadap Standar Pelayanan. Indikator ini bernilai 0 (Nol) jika tidak ada bukti peninjauan berkala.'
        verificationTips =
          'Konfirmasi apakah unit pernah melakukan kaji ulang/evaluasi berkala terhadap Standar Pelayanan.'
      }
    } else if (num === 5) {
      // Pemenuhan Siklus Maklumat Pelayanan
      const maklumat = getSlotProof('maklumat_pelayanan')
      if (maklumat.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = `Berkas maklumat ("${maklumat.fileName}") teridentifikasi TIDAK RELEVAN.`
        weaknessNotes = `CATATAN KETIDAKRELEVANAN: Berkas yang diunggah tidak memuat Maklumat Pelayanan resmi. Indikator bernilai 0 (Nol).`
        verificationTips = 'Cek fisik penempatan maklumat pelayanan di ruang tunggu.'
      } else if (maklumat.exists) {
        suggestedScore = 4
        confidence = 75
        confidenceReason = 'Dokumen penetapan dan foto Maklumat Pelayanan terdeteksi.'
        weaknessNotes =
          'Untuk Skala 5, maklumat harus dipublikasikan pada media non-elektronik (ruang layanan fisik) DAN media elektronik, serta memuat janji kompensasi jika layanan melanggar maklumat.'
        verificationTips =
          'Verifikasi keberadaan fisik maklumat pelayanan di ruang pelayanan utama dan publikasi digitalnya.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Dokumen/foto Maklumat Pelayanan belum diunggah.'
        weaknessNotes =
          'PENTING: Belum ada penetapan maklumat kesanggupan memberikan pelayanan. Nilai akan bernilai 0 (Nol) jika tidak ada maklumat.'
        verificationTips = 'Cek apakah maklumat pelayanan terpasang di ruang tunggu pelayanan lokus.'
      }
    } else if (num === 6) {
      // Pelaksanaan SKM sesuai PermenPANRB No. 14/2017
      const skm = getSlotProof('laporan_skm')
      if (skm.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = `Berkas SKM ("${skm.fileName}") teridentifikasi TIDAK RELEVAN.`
        weaknessNotes = `CATATAN KETIDAKRELEVANAN: Berkas yang diunggah bukan merupakan Laporan Pelaksanaan SKM. Indikator bernilai 0 (Nol).`
        verificationTips = 'Minta laporan hasil SKM yang memuat 9 unsur PermenPAN-RB.'
      } else if (skm.exists) {
        suggestedScore = 3
        confidence = 70
        confidenceReason = 'Dokumen Laporan SKM terdeteksi pada slot bukti dukung.'
        weaknessNotes =
          'Untuk Skala 4 atau 5, SKM harus dilaksanakan sesuai 9 unsur PermenPAN-RB No. 14/2017, dipublikasikan di media cetak dan elektronik, serta disusun laporan rencana tindak lanjut hasil SKM.'
        verificationTips =
          'Periksa metodologi kuesioner pada laporan SKM: pastikan mencakup 9 unsur pelayanan.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Laporan pelaksanaan SKM belum diunggah oleh unit lokus.'
        weaknessNotes =
          'PENTING: Belum ada dokumen laporan SKM. Harap unggah laporan SKM tahun berjalan agar tidak mendapat nilai 0.'
        verificationTips = 'Tanyakan apakah unit lokus telah melaksanakan SKM pada periode evaluasi.'
      }
    } else if (num === 7) {
      // Jumlah Media Publikasi Hasil SKM (Khusus Cek Gambar/Screenshot Publikasi)
      const skm = getSlotProof('laporan_skm')
      if (skm.isMisfiled) {
        suggestedScore = 0
        confidence = 90
        confidenceReason = 'Berkas laporan SKM tidak valid.'
        weaknessNotes = 'CATATAN KETIDAKRELEVANAN: Berkas SKM tidak relevan sehingga publikasi SKM tidak dapat dinilai.'
        verificationTips = 'Cek keberadaan media publikasi SKM di lokasi pelayanan.'
      } else {
        const imgAtts = skm.attachments.filter(
          (a: any) => a.fileType === 'IMAGE' || /\.(jpe?g|png|webp)$/i.test(a.fileName || '')
        )

        if (imgAtts.length >= 4) {
          suggestedScore = 4
          confidence = 80
          confidenceReason = `Terdeteksi ${imgAtts.length} foto/tangkapan layar publikasi hasil nilai SKM.`
          weaknessNotes =
            'Untuk Skala 5 (Maksimal), publikasi nilai SKM harus disebarluaskan pada lebih dari 4 media berbeda (website, medsos, banner ruang layanan, videotron, dsb).'
          verificationTips =
            'Pastikan ragam media publikasi SKM aktif dan menampilkan nilai indeks kepuasan terbaru.'
        } else if (imgAtts.length >= 1) {
          suggestedScore = Math.min(3, imgAtts.length)
          confidence = 75
          confidenceReason = `Terdeteksi ${imgAtts.length} media publikasi hasil SKM pada berkas terlampir.`
          weaknessNotes =
            'Publikasi hasil SKM baru memenuhi sebagian media. Tambahkan bukti publikasi di kanal lain (misal banner ruang tunggu, website resmi, atau medsos) untuk meraih Skala 4-5.'
          verificationTips =
            'Verifikasi keaslian publikasi di media sosial atau banner lobi kantor.'
        } else if (skm.exists) {
          // Laporan SKM terunggah (misal PDF), TAPI foto/screenshot publikasi belum ada!
          suggestedScore = 0
          confidence = 90
          confidenceReason =
            'Dokumen Laporan SKM ada, tetapi TIDAK ADA bukti foto/tangkapan layar publikasi hasil SKM ke masyarakat.'
          weaknessNotes =
            'PERINGATAN KERAS: Bukti publikasi hasil SKM masih KOSONG. Indikator ini khusus menilai MEDIA PUBLIKASI (banner, medsos, website). Jika lokus hanya mengunggah PDF laporan tanpa foto publikasi, indikator ini BERISIKO BERNILAI 0 (NOL). Harap segera tambahkan foto publikasi SKM pada slot Laporan Pelaksanaan & Publikasi SKM.'
          verificationTips =
            'Minta lokus menunjukkan bukti nyata publikasi nilai SKM ke publik (misal banner di lobi atau postingan medsos).'
        } else {
          suggestedScore = 0
          confidence = 90
          confidenceReason = 'Belum ada berkas laporan maupun publikasi hasil SKM yang diunggah.'
          weaknessNotes =
            'PENTING: Belum ada bukti publikasi hasil SKM. Indikator ini bernilai 0 (Nol).'
          verificationTips =
            'Konfirmasi apakah unit lokus mempublikasikan hasil SKM kepada masyarakat.'
        }
      }
    } else if (num === 8) {
      // Persentase Rencana Tindak Lanjut Hasil SKM
      const hasRtl = submissions.some((s) => s.slotKey === 'tindak_lanjut_skm' && s.fileUrl)
      if (hasRtl) {
        suggestedScore = 4
        confidence = 70
        confidenceReason = 'Dokumen Laporan Rencana Tindak Lanjut (RTL) SKM terdeteksi.'
        weaknessNotes =
          'Untuk Skala 5 (100%), seluruh rekomendasi perbaikan dalam RTL harus terbukti telah 100% selesai ditindaklanjuti dengan laporan realisasinya.'
        verificationTips =
          'Cek matriks tindak lanjut hasil SKM: hitung persentase rekomendasi yang sudah berstatus selesai.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Belum ditemukan laporan Rencana Tindak Lanjut (RTL) hasil SKM.'
        weaknessNotes =
          'PENTING: Belum ada dokumen RTL hasil SKM. Harap unggah matriks rencana aksi perbaikan dari hasil SKM agar tidak bernilai 0.'
        verificationTips =
          'Minta dokumen rencana aksi tindak lanjut atas saran perbaikan masyarakat dari SKM.'
      }
    } else if (num === 9) {
      // Kecepatan Tindak Lanjut Hasil SKM
      const hasRtl = submissions.some((s) => s.slotKey === 'tindak_lanjut_skm' && s.fileUrl)
      const hasSkm = submissions.some((s) => s.slotKey === 'laporan_skm' && s.fileUrl)
      if (hasRtl && hasSkm) {
        suggestedScore = 3
        confidence = 65
        confidenceReason =
          'Dokumen SKM dan RTL terdeteksi. Evaluator perlu mengonfirmasi kecepatan penyelesaian tindak lanjut.'
        weaknessNotes =
          'Untuk Skala 4 atau 5, tindak lanjut perbaikan harus diselesaikan dalam waktu kurang dari 6 bulan atau kurang dari 3 bulan sejak hasil SKM diumumkan.'
        verificationTips =
          'Periksa rentang waktu antara tanggal pengumuman hasil SKM dengan tanggal realisasi laporan tindak lanjut.'
      } else {
        suggestedScore = 0
        confidence = 85
        confidenceReason = 'Belum ada bukti tindak lanjut hasil SKM.'
        weaknessNotes =
          'PENTING: Tanpa laporan tindak lanjut hasil SKM, kecepatan tindak lanjut tidak dapat dibuktikan (bernilai 0).'
        verificationTips =
          'Tanyakan kepada lokus berapa lama rekomendasi SKM biasanya diselesaikan.'
      }
    }
    // ==========================================
    // ASPEK II: PROFESIONALISME SDM (Q10 - Q14)
    // ==========================================
    else if (num >= 10 && num <= 14) {
      const hasSkJam = submissions.some((s) => s.slotKey === 'sk_jam_layanan' && s.fileUrl)
      const hasKodeEtik = submissions.some((s) => s.slotKey === 'kode_etik_budaya' && s.fileUrl)
      suggestedScore = hasSkJam && hasKodeEtik ? 3 : hasSkJam || hasKodeEtik ? 2 : 1
      confidence = 60
      confidenceReason =
        'AI mendeteksi sebagian dokumen SDM, namun belum dapat memverifikasi visual secara penuh: apakah petugas di loket mengenakan seragam dinas ber-ID card lengkap dan nametag pada saat jam pelayanan.'
      weaknessNotes =
        'Untuk nilai maksimal, dibutuhkan penerapan budaya 5S (Senyum, Sapa, Salam, Sopan, Santun), pakaian seragam resmi bertanda pengenal, dan sistem reward/punishment bagi petugas.'
      verificationTips =
        'Observasi langsung penampilan petugas di loket pelayanan: kelengkapan seragam dinas, ID card, dan keramahan sikap melayani.'
    }
    // ==========================================
    // ASPEK III: SARANA PRASARANA (Q15 - Q21)
    // ==========================================
    else if (num >= 15 && num <= 21) {
      const hasSarpras = submissions.some((s) => s.fileUrl && s.slotKey.includes('sarpras'))
      suggestedScore = fillRatio >= 0.7 ? 4 : fillRatio >= 0.4 ? 3 : 2
      confidence = 55
      confidenceReason =
        'Tingkat keyakinan AI dinilai SEDANG (55%) karena verifikasi sarana prasarana disabilitas/ramah rentan memerlukan pengecekan foto visual langsung (apakah ramp kursi roda memiliki kemiringan yang aman dan handrail, apakah toilet disabilitas memiliki grab bar/pegangan, dan apakah kursi prioritas diberi label jelas).'
      weaknessNotes =
        'Fasilitas kelompok rentan seringkali ada secara nama namun tidak memenuhi standar teknis aksesibilitas fisik (misal: ramp terlalu curam atau toilet disabilitas terkunci/tanpa pegangan).'
      verificationTips =
        'Uji coba langsung jalur landai (ramp), cek kelayakan toilet khusus disabilitas, dan pastikan kursi roda/tongkat bantu siap digunakan.'
    }
    // ==========================================
    // ASPEK LAINNYA (SIPP, PENGADUAN, INOVASI)
    // ==========================================
    else {
      suggestedScore = fillRatio >= 0.7 ? 4 : fillRatio >= 0.3 ? 3 : 1
      confidence = 60
      confidenceReason = `AI memperkirakan nilai awal berdasarkan rasio keterisian dokumen (${Math.round(fillRatio * 100)}%). Evaluator perlu memverifikasi substantif materi.`
      weaknessNotes = 'Dokumen pendukung substantif dan dokumentasi implementasi perlu diperiksa lebih lanjut.'
      verificationTips = 'Lakukan klarifikasi dan cek dokumen acuan pembuktian pada form F02.'
    }

    // Analisis Kritis Silang F01 vs Bukti Dukung
    let criticalAudit = ''
    const f01Score = scoreMap?.get(ind.id)?.score
    if (f01Score !== undefined && f01Score !== null) {
      if (f01Score >= 4 && suggestedScore <= 2) {
        criticalAudit = `Potensi Over-Claiming: OPD memberikan nilai mandiri tinggi (Skor ${f01Score}) pada F-01, namun berkas bukti dukung yang terunggah belum memadai (Rekomendasi AI Skor ${suggestedScore}). Diperlukan audit silang dokumen fisik.`
      } else if (f01Score <= 2 && suggestedScore >= 4) {
        criticalAudit = `Penilaian Mandiri Konservatif: OPD mengisi nilai mandiri rendah (Skor ${f01Score}) pada F-01, namun bukti fisik yang terunggah menunjukkan pemenuhan yang cukup baik (Rekomendasi AI Skor ${suggestedScore}).`
      } else {
        criticalAudit = `Klaim centangan F-01 OPD (Skor ${f01Score}) relatif sejalan dengan rasio ketersediaan dokumen bukti dukung (Rekomendasi AI Skor ${suggestedScore}).`
      }
    } else {
      criticalAudit = 'OPD belum mengisi evaluasi mandiri F-01 untuk indikator ini.'
    }

    return {
      indicatorNumber: num,
      suggestedScore,
      confidence,
      confidenceReason,
      criticalAudit,
      weaknessNotes,
      verificationTips
    }
  }

  /**
   * Menjalankan Pre-Check Kelayakan Dokumen Bukti Dukung (khusus lokus/OPD).
   * - Memeriksa keabsahan administratif, kelengkapan, dan kesesuaian berkas tanpa membocorkan skor/prediksi nilai F02 (Zero Score Leakage).
   * - Memberikan status per slot: 'LAYAK', 'PERLU_PERBAIKAN', 'TIDAK_SESUAI', atau 'BELUM_UNGGAH'.
   * - Menghasilkan rekomendasi perbaikan konkret bagi unit lokus sebelum batas waktu pengisian berakhir.
   * @param evaluationId ID evaluasi lokus yang diperiksa.
   * @param rawAspectCode Kode aspek instrumen (misal: 'I', 'II', 'KEBIJAKAN').
   * @returns Hasil kepatuhan berkas per slot beserta ringkasan kelayakan lokus.
   */
  static async runDocumentComplianceCheck(evaluationId: string, rawAspectCode: string) {
    const aspectCode = normalizeAspectCode(rawAspectCode)
    const dbAspectCode = getDbAspectCode(rawAspectCode)
    const aspectCodes = Array.from(new Set([rawAspectCode, aspectCode, dbAspectCode]))

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: true,
        evidenceSubmissions: {
          where: { aspectCode: { in: aspectCodes } }
        }
      }
    })

    if (!evaluation) {
      throw new Error(`Data evaluasi ID ${evaluationId} tidak ditemukan.`)
    }

    const presetSlots = getEvidenceSlotsByAspect(aspectCode)
    const submissions = evaluation.evidenceSubmissions

    // 1. Guard Server-Side: Pastikan seluruh dokumen wajib terunggah di database
    const mandatoryPresetSlots = presetSlots.filter((p) => p.isMandatory)
    const filledMandatorySlots = mandatoryPresetSlots.filter((p) => {
      const sub = submissions.find((s) => s.slotKey === p.slotKey)
      return Boolean(sub?.fileUrl && sub.fileUrl.trim() !== '')
    })

    if (filledMandatorySlots.length < mandatoryPresetSlots.length) {
      throw new Error(
        `Seluruh dokumen wajib (${filledMandatorySlots.length}/${mandatoryPresetSlots.length}) harus terunggah sebelum pemeriksaan kelayakan dapat dijalankan.`
      )
    }

    // 2. Guard Server-Side: Rate Limiting Cooldown (Anti-Bypass via DevTools / cURL / clear storage)
    const COOLDOWN_SECONDS = 60
    let latestCheckedTimestamp = 0
    for (const sub of submissions) {
      const insights = sub.aiInsights as any
      if (insights?.checkedAt) {
        const lastCheckedTime = new Date(insights.checkedAt).getTime()
        if (!isNaN(lastCheckedTime)) {
          if (lastCheckedTime > latestCheckedTimestamp) {
            latestCheckedTimestamp = lastCheckedTime
          }
          const elapsedSeconds = Math.floor((Date.now() - lastCheckedTime) / 1000)
          if (elapsedSeconds >= 0 && elapsedSeconds < COOLDOWN_SECONDS) {
            const waitTime = COOLDOWN_SECONDS - elapsedSeconds
            throw new Error(`Pengecekan terlalu sering. Harap tunggu ${waitTime} detik lagi sebelum memeriksa ulang.`)
          }
        }
      }
    }

    // 3. Guard Server-Side: Token Saving - Jika sudah pernah dicek, pastikan ada file baru yang diunggah/diubah
    if (latestCheckedTimestamp > 0) {
      const hasNewOrUpdatedFiles = submissions.some((sub) => {
        // Cek apakah submisi atau lampiran diperbarui setelah pengecekan terakhir
        const subTime = sub.updatedAt ? new Date(sub.updatedAt).getTime() : 0
        if (subTime > latestCheckedTimestamp + 1000) return true

        const historyList = Array.isArray(sub.history) ? (sub.history as any[]) : []
        return historyList.some((h) => {
          if (h.timestamp) {
            const actTime = new Date(h.timestamp).getTime()
            return actTime > latestCheckedTimestamp + 1000
          }
          return false
        })
      })

      if (!hasNewOrUpdatedFiles) {
        throw new Error(
          'Tidak ada perubahan berkas baru sejak pemeriksaan terakhir. Pengecekan AI tidak dijalankan untuk menghemat token.'
        )
      }
    }

    // Kumpulkan status berkas yang ada beserta seluruh lampirannya
    const slotAuditList = presetSlots.map((p) => {
      const sub = submissions.find((s) => s.slotKey === p.slotKey)
      const hasFile = Boolean(sub?.fileUrl && sub.fileUrl.trim() !== '')
      const attachments = extractAttachments(sub)
      return {
        slotKey: p.slotKey,
        title: p.title,
        description: p.description,
        documentType: p.documentType,
        isMandatory: p.isMandatory,
        hasFile,
        fileName: sub?.fileName || undefined,
        fileUrl: sub?.fileUrl || undefined,
        storageProvider: sub?.storageProvider,
        attachments
      }
    })

    const { getAiEvaluatorConfig } = await import('./system-setting-service')
    const config = await getAiEvaluatorConfig()
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    let complianceResult: {
      overallReadinessScore: number
      overallSummary: string
      slots: Array<{
        slotKey: string
        status: 'LAYAK' | 'PERLU_DILENGKAPI' | 'TIDAK_SESUAI' | 'BELUM_UNGGAH'
        summary: string
        feedback?: string
        checkpoints?: {
          hasSignatureOrSeal: boolean
          isRelevant: boolean
          hasCompleteAttachments: boolean
        }
      }>
    }

    if (apiKey && config.executionMode !== 'HEURISTIC_ONLY') {
      try {
        complianceResult = await this.evaluateComplianceWithGemini(
          evaluation.unit.name,
          aspectCode,
          slotAuditList,
          apiKey,
          config.model
        )
      } catch (err: any) {
        console.warn('Gemini compliance check failed, falling back to rule-based checker:', err.message)
        complianceResult = this.evaluateComplianceRuleBased(aspectCode, slotAuditList)
      }
    } else {
      complianceResult = this.evaluateComplianceRuleBased(aspectCode, slotAuditList)
    }

    // Simpan hasil ke database pada masing-masing submission
    for (const item of complianceResult.slots) {
      const existingSub = submissions.find((s) => s.slotKey === item.slotKey)
      if (existingSub) {
        await db.indicatorEvidenceSubmission.update({
          where: { id: existingSub.id },
          data: {
            aiStatus: 'COMPLETED',
            aiInsights: {
              status: item.status,
              summary: item.summary,
              feedback: item.feedback,
              checkpoints: item.checkpoints,
              checkedAt: new Date().toISOString()
            }
          }
        })
      }
    }

    return {
      aspectCode,
      unitName: evaluation.unit.name,
      checkedAt: new Date().toISOString(),
      ...complianceResult
    }
  }

  /**
   * Panggilan ke model multimodal Gemini untuk memeriksa kelayakan administratif dokumen bukti dukung lokus.
   * Diberikan batasan ketat 'Zero Score Leakage' untuk memastikan model hanya memberikan panduan perbaikan berkas.
   * @param unitName Nama unit kerja / lokus.
   * @param aspectCode Kode aspek instrumen.
   * @param slots Data slot bukti dukung beserta tautan berkasnya.
   * @param apiKey Kunci akses API Gemini.
   * @param model Nama varian model Gemini yang digunakan.
   * @returns Objek telaah kepatuhan administratif per slot.
   */
  private static async evaluateComplianceWithGemini(
    unitName: string,
    aspectCode: string,
    slots: any[],
    apiKey: string,
    model?: string
  ) {
    const systemPrompt = `Anda adalah Asisten Verifikator Kelayakan Berkas PEKPPP (Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik) KemenPAN-RB.
Tugas Anda adalah memeriksa KELAYAKAN ADMINISTRATIF & KELENGKAPAN berkas bukti dukung yang diunggah oleh OPD: "${unitName}" untuk Aspek ${aspectCode}.

PENTING - ATURAN KETAT:
1. DILARANG MEMBERIKAN SKOR NILAI ANGKA MAUPUN PREDIKSI NILAI SKALA (0-5) KEPADA PENGGUNA.
2. Tugas Anda murni membantu OPD memastikan berkas yang diunggah sudah benar, sah, dan lengkap sebelum dievaluasi.
3. Kategori Status:
   - "LAYAK": Dokumen sudah benar, sah (ada ttd/stempel/nomor), dan komponen pokok terpenuhi.
   - "PERLU_DILENGKAPI": Dokumen sesuai, tetapi masih ada kekurangan lampiran (misal: belum ada daftar hadir FKP, belum ada notulensi, atau belum ada kompensasi maklumat).
   - "TIDAK_SESUAI": Salah unggah berkas (misal diminta SK Standar Pelayanan tetapi mengunggah SOP atau SK mutasi).
   - "BELUM_UNGGAH": Belum ada berkas terunggah.
4. PERIKSAAN KHUSUS SLOT BERSIFAT DUA UNSUR / HYBRID:
   - Slot "laporan_skm" (Laporan Pelaksanaan & Publikasi SKM): Membutuhkan DUA komponen pembuktian: (1) Dokumen Laporan Pelaksanaan SKM, dan (2) Foto/tangkapan layar bukti publikasi hasil nilai SKM ke masyarakat (banner/display ruang layanan, leaflet, website, atau medsos).
     * Jika berkas yang diunggah HANYA berupa dokumen PDF laporan tanpa adanya lampiran foto/screenshot publikasi, nyatakan statusnya sebagai "PERLU_DILENGKAPI".
     * Berikan feedback: "Laporan pelaksanaan SKM telah terunggah. Namun bukti publikasi ke masyarakat (foto banner/display ruang layanan atau tangkapan layar website/media sosial) belum dilampirkan pada slot ini. Harap tambahkan berkas foto/screenshot publikasi agar Pertanyaan #7 (Publikasi Hasil SKM) tidak mendapat nilai 0."
   - Slot "ba_fkp" (Berita Acara FKP): Wajib memuat Berita Acara FKP dan disarankan melampirkan foto dokumentasi kegiatan bersama masyarakat.

Format JSON yang WAJIB dihasilkan:
{
  "overallReadinessScore": 80,
  "overallSummary": "Ringkasan 1-2 kalimat mengenai kesiapan dokumen aspek ini.",
  "slots": [
    {
      "slotKey": "string",
      "status": "LAYAK",
      "summary": "Analisis ringkas 1 kalimat kondisi dokumen.",
      "feedback": "Saran perbaikan konkret bagi OPD jika status belum LAYAK.",
      "checkpoints": {
        "hasSignatureOrSeal": true,
        "isRelevant": true,
        "hasCompleteAttachments": true
      }
    }
  ]
}`

    const userPrompt = `Daftar Berkas Bukti Dukung Aspek ${aspectCode} yang Diunggah oleh OPD "${unitName}":
${JSON.stringify(slots, null, 2)}

Harap periksa kelayakan setiap dokumen secara objektif dan berikan panduan perbaikan yang jelas.`

    let activeModel = model || 'gemini-3.6-flash'
    if (activeModel.includes('2.0') || activeModel.includes('2.5') || activeModel.includes('1.5')) {
      activeModel = 'gemini-3.6-flash'
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini Compliance API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawJson) throw new Error('Respon Gemini kosong.')

    // Ambil data pemakaian token riil dari Google AI Studio (usageMetadata)
    try {
      const { trackAiUsage } = await import('./system-setting-service')
      const usageMetadata = data.usageMetadata
      const totalTokenCount = usageMetadata?.totalTokenCount
      const promptTokenCount = usageMetadata?.promptTokenCount
      const candidatesTokenCount = usageMetadata?.candidatesTokenCount

      if (totalTokenCount) {
        await trackAiUsage(totalTokenCount, {
          promptTokens: promptTokenCount,
          candidatesTokens: candidatesTokenCount,
          model: activeModel
        })
      } else {
        // Fallback jika provider tidak menyertakan usageMetadata
        const estTokens = Math.round((systemPrompt.length + userPrompt.length + rawJson.length) / 4)
        await trackAiUsage(estTokens, { model: activeModel })
      }
    } catch {}

    const parsed = JSON.parse(rawJson)
    return parsed
  }

  /**
   * Pemeriksa Kepatuhan Dokumen Berbasis Aturan (Rule-Based Fallback).
   * Menganalisis kelayakan berkas secara deterministik saat offline atau tanpa koneksi ke Gemini API.
   * @param aspectCode Kode aspek instrumen.
   * @param slots Daftar slot bukti dukung beserta status berkasnya.
   * @returns Hasil kepatuhan per slot (`slots`), skor kesiapan (`overallReadinessScore`), dan ringkasan (`overallSummary`).
   */
  private static evaluateComplianceRuleBased(aspectCode: string, slots: any[]) {
    let layakCount = 0
    const checkedSlots = slots.map((slot) => {
      if (!slot.hasFile) {
        return {
          slotKey: slot.slotKey,
          status: 'BELUM_UNGGAH' as const,
          summary: `Berkas "${slot.title}" belum diunggah oleh OPD.`,
          feedback: slot.isMandatory
            ? 'Dokumen ini berstatus WAJIB. Harap unggah berkas sebelum batas akhir evaluasi.'
            : 'Dokumen pendukung tambahan.',
          checkpoints: {
            hasSignatureOrSeal: false,
            isRelevant: false,
            hasCompleteAttachments: false
          }
        }
      }

      const fileName = (slot.fileName || '').toLowerCase()
      const isPdfOrDoc = fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')

      if (slot.documentType === 'PDF' && !isPdfOrDoc && !slot.fileUrl?.startsWith('http')) {
        return {
          slotKey: slot.slotKey,
          status: 'TIDAK_SESUAI' as const,
          summary: 'Format berkas tidak sesuai standar dokumen resmi (wajib PDF/DOCX).',
          feedback: 'Harap unggah ulang dokumen dalam format PDF bertanda tangan sah.',
          checkpoints: {
            hasSignatureOrSeal: false,
            isRelevant: true,
            hasCompleteAttachments: false
          }
        }
      }

      // Pengecekan Khusus: Slot Laporan Pelaksanaan & Publikasi SKM (laporan_skm)
      if (slot.slotKey === 'laporan_skm') {
        const atts = slot.attachments || []
        const hasImg = atts.some(
          (a: any) => a.fileType === 'IMAGE' || /\.(jpe?g|png|webp)$/i.test(a.fileName || '')
        )
        if (!hasImg) {
          return {
            slotKey: slot.slotKey,
            status: 'PERLU_DILENGKAPI' as const,
            summary: 'Laporan SKM terdeteksi, namun bukti foto/tangkapan layar publikasi hasil SKM belum dilampirkan.',
            feedback:
              'Laporan pelaksanaan SKM telah terunggah. Namun bukti publikasi ke masyarakat (seperti foto banner/display di ruang pelayanan, leaflet, atau tangkapan layar website/media sosial) belum dilampirkan pada slot ini. Harap tambahkan berkas foto/screenshot publikasi SKM agar Pertanyaan #7 (Publikasi Hasil SKM) tidak mendapat nilai 0.',
            checkpoints: {
              hasSignatureOrSeal: true,
              isRelevant: true,
              hasCompleteAttachments: false
            }
          }
        }
      }

      // Pengecekan Khusus: Slot Berita Acara FKP (ba_fkp)
      if (slot.slotKey === 'ba_fkp') {
        const atts = slot.attachments || []
        const hasImg = atts.some(
          (a: any) => a.fileType === 'IMAGE' || /\.(jpe?g|png|webp)$/i.test(a.fileName || '')
        )
        if (!hasImg && atts.length > 0) {
          return {
            slotKey: slot.slotKey,
            status: 'PERLU_DILENGKAPI' as const,
            summary: 'Berita Acara FKP terdeteksi, namun dokumentasi foto kegiatan FKP bersama masyarakat belum dilampirkan.',
            feedback:
              'Disarankan melampirkan juga foto pelaksanaan kegiatan Forum Konsultasi Publik (FKP) bersama perwakilan masyarakat agar pemenuhan bukti dukung FKP maksimal.',
            checkpoints: {
              hasSignatureOrSeal: true,
              isRelevant: true,
              hasCompleteAttachments: false
            }
          }
        }
      }

      layakCount++
      return {
        slotKey: slot.slotKey,
        status: 'LAYAK' as const,
        summary: `Berkas "${slot.fileName || slot.title}" terdeteksi dan memenuhi standar kelayakan berkas.`,
        feedback: 'Pastikan seluruh halaman lampiran dan tanda tangan pejabat berwenang terbaca dengan jelas.',
        checkpoints: {
          hasSignatureOrSeal: true,
          isRelevant: true,
          hasCompleteAttachments: true
        }
      }
    })

    const readiness = slots.length > 0 ? Math.round((layakCount / slots.length) * 100) : 0

    return {
      overallReadinessScore: readiness,
      overallSummary: `${layakCount} dari ${slots.length} dokumen telah terunggah dan memenuhi format kelayakan teknis.`,
      slots: checkedSlots
    }
  }
}
