import { getMenpanApiConfig } from './system-setting-service'
import { db } from './db'

export interface MenpanSyncResponse {
  success: boolean
  message: string
  menpanRefId?: string
  rawResponse?: any
}

export interface MenpanUserData {
  id: number
  name: string
  email: string
  roles: string[]
  government_instance_id: number | null
}

export interface MenpanEvaluationItem {
  id: number
  uuid: string
  name: string
  year: number
  status: string
  is_priority: boolean
  progress_percentage?: number
  form_sheet?: {
    id: number
    name: string
  }
  government_instance?: {
    id: number
    name: string
  }
}

export class MenpanApiService {
  /**
   * Helper internal untuk menyiapkan header autentikasi sesuai spesifikasi OpenAPI 3.0.3 MenPAN-RB.
   * Hanya menggunakan Bearer Token (Sanctum Personal Access Token).
   */
  private static getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token.trim()}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  /**
   * Menguji koneksi dan validitas Bearer Token ke endpoint resmi GET /user.
   * Mengembalikan profil user dan scope government_instance_id yang terikat ke token.
   */
  static async testConnection(): Promise<{
    success: boolean
    message: string
    isConfigured: boolean
    user?: MenpanUserData
  }> {
    const config = await getMenpanApiConfig()

    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        isConfigured: false,
        message: 'Kredensial API MenPAN belum dikonfigurasi. Masukkan Base URL & Bearer Token.'
      }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/user`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(8000)
      })

      if (response.ok) {
        const json = await response.json()
        const user: MenpanUserData = json.data || json
        const instanceInfo = user.government_instance_id
          ? ` (Instansi ID: ${user.government_instance_id})`
          : ''
        return {
          success: true,
          isConfigured: true,
          message: `Koneksi Berhasil! Terhubung sebagai: ${user.name || user.email}${instanceInfo}.`,
          user
        }
      } else if (response.status === 401) {
        return {
          success: false,
          isConfigured: true,
          message: 'Autentikasi Gagal (HTTP 401): Bearer Token tidak valid atau sudah kedaluwarsa/dicabut oleh admin PEKPPP.'
        }
      } else if (response.status === 429) {
        return {
          success: false,
          isConfigured: true,
          message: 'Rate limit terlampaui (HTTP 429): Terlalu banyak permintaan dalam 1 menit. Harap tunggu beberapa saat.'
        }
      } else {
        const errorJson = await response.json().catch(() => ({}))
        return {
          success: false,
          isConfigured: true,
          message: `Gagal terhubung (HTTP ${response.status}): ${errorJson.message || response.statusText}`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        isConfigured: true,
        message: `Koneksi gagal atau domain server tidak dapat dijangkau (${err.message || 'Network Error'}).`
      }
    }
  }

  /**
   * PULL: Mengambil daftar evaluasi instansi dari endpoint resmi GET /evaluations
   * Digunakan untuk pemetaan (mapping) UUID evaluasi lokus MenPAN dengan lokus lokal.
   */
  static async getRemoteEvaluations(year?: number): Promise<{
    success: boolean
    data?: MenpanEvaluationItem[]
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message:
          'Kredensial API MenPAN-RB (Base URL & Bearer Token) belum dikonfigurasi di menu Pengaturan API. Silakan tetapkan kredensial terlebih dahulu (baik server Sandbox resmi MenPAN maupun Production).'
      }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const queryParams = new URLSearchParams()
      if (year) queryParams.set('year', String(year))
      queryParams.set('per_page', '100')

      const url = `${cleanBase}/evaluations?${queryParams.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const json = await response.json()
        const items: MenpanEvaluationItem[] = json.data || []
        return { success: true, data: items }
      } else {
        const err = await response.json().catch(() => ({}))
        return {
          success: false,
          message: err.message || `HTTP ${response.status}: Gagal mengambil daftar evaluasi MenPAN.`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi server MenPAN: ${err.message || 'Network Timeout'}`
      }
    }
  }

  /**
   * PULL: Mengambil detail satu evaluasi berdasarkan UUID dari MenPAN (GET /evaluations/{uuid})
   */
  static async getRemoteEvaluationDetail(uuid: string): Promise<{
    success: boolean
    data?: MenpanEvaluationItem
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message: 'Kredensial API MenPAN-RB belum dikonfigurasi di menu Pengaturan API.'
      }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluations/${uuid}`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const json = await response.json()
        return { success: true, data: json.data }
      } else {
        const err = await response.json().catch(() => ({}))
        return { success: false, message: err.message || `HTTP ${response.status}: Detail evaluasi tidak ditemukan.` }
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server MenPAN.' }
    }
  }

  /**
   * PULL: Mengambil daftar pertanyaan resmi form MenPAN secara flat (GET /evaluations/{uuid}/form/questions)
   */
  static async getRemoteQuestions(uuid: string): Promise<{
    success: boolean
    data?: Array<{
      id: number
      name: string
      index: number
      bobot: number
      is_required: boolean
      option_type: string
      options: Array<{
        id: number
        text: string
        bobot: number
        index: number
      }>
    }>
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message: 'Kredensial API MenPAN-RB belum dikonfigurasi di menu Pengaturan API.'
      }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluations/${uuid}/form/questions`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const json = await response.json()
        return { success: true, data: json.data || [] }
      } else {
        const err = await response.json().catch(() => ({}))
        return { success: false, message: err.message || `HTTP ${response.status}: Gagal mengambil daftar pertanyaan form.` }
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server MenPAN.' }
    }
  }

  /**
   * PULL: Mengambil jawaban yang saat ini tersimpan di MenPAN (GET /evaluations/{uuid}/answers)
   */
  static async getRemoteAnswers(uuid: string): Promise<{
    success: boolean
    data?: Array<{
      id: number
      question_id: number
      value: string | string[]
      index?: number | null
      source?: string | null
    }>
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message: 'Kredensial API MenPAN-RB belum dikonfigurasi di menu Pengaturan API.'
      }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluations/${uuid}/answers?per_page=500`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const json = await response.json()
        return { success: true, data: json.data || [] }
      } else {
        const err = await response.json().catch(() => ({}))
        return { success: false, message: err.message || `HTTP ${response.status}: Gagal mengambil jawaban dari MenPAN.` }
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menghubungi server MenPAN.' }
    }
  }

  /**
   * PUSH: Mengirimkan jawaban lengkap ke MenPAN-RB sesuai format resmi (POST /evaluations/{uuid}/answers)
   */
  static async pushRemoteAnswers(
    uuid: string,
    answersPayload: Record<string, string | number | string[]>
  ): Promise<{
    success: boolean
    message: string
    status?: string
    validationErrors?: string[]
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluations/${uuid}/answers`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({ answers: answersPayload }),
        signal: AbortSignal.timeout(20000)
      })

      const json = await response.json().catch(() => ({}))

      if (response.status === 202) {
        return {
          success: true,
          message: json.message || 'Jawaban berhasil diterima MenPAN-RB dan sedang diproses (queued).',
          status: json.data?.status || 'queued'
        }
      } else if (response.status === 422) {
        const errList: string[] = []
        if (json.errors) {
          Object.values(json.errors).forEach((val: any) => {
            if (Array.isArray(val)) errList.push(...val)
            else if (typeof val === 'string') errList.push(val)
          })
        }
        return {
          success: false,
          message: json.message || 'Validasi MenPAN Gagal: Terdapat butir pertanyaan wajib yang belum terisi.',
          validationErrors: errList.length > 0 ? errList : [json.message || 'Validasi 422']
        }
      } else {
        return {
          success: false,
          message: json.message || `HTTP ${response.status}: Pengiriman jawaban ditolak.`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat mengirim jawaban.'
      }
    }
  }

  /**
   * Mengirimkan data evaluasi lengkap (Formulir F-01/F-02) ke API Resmi MenPAN-RB sesuai OpenAPI 3.0.3 (spec.json).
   * - Memastikan lokus memiliki `menpanEvaluationId` (UUID evaluasi MenPAN).
   * - Menarik / membaca cache struktur pertanyaan MenPAN (GET /evaluations/{uuid}/form/questions).
   * - Melakukan Auto-Mapping: mencocokkan nomor indikator (index 1..31) ke question_id MenPAN.
   * - Mengonversi skor/jawaban lokal ke format resmi bobot opsi MenPAN.
   * - Mengirim HTTP POST ke endpoint resmi /evaluations/{uuid}/answers.
   * - Memperbarui status sinkronisasi (`SYNCED` atau `FAILED`) dan audit log ke database.
   * @param evaluationId ID evaluasi lokus yang akan disinkronkan.
   * @returns Respons sinkronisasi `{ success: boolean, message: string, menpanRefId?: string, rawResponse?: any }`.
   */
  static async pushEvaluation(evaluationId: string): Promise<MenpanSyncResponse> {
    const config = await getMenpanApiConfig()

    // 1. Ambil data evaluasi lokal beserta nilai per indikator
    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: true,
        scores: {
          include: {
            indicator: {
              include: {
                aspect: true
              }
            }
          },
          orderBy: {
            indicator: {
              indicatorNumber: 'asc'
            }
          }
        },
        f03Respondents: true
      }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan di database lokal.' }
    }

    // 2. Validasi Kredensial API
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message:
          'Kredensial API MenPAN-RB (Base URL & Bearer Token) belum dikonfigurasi di menu Pengaturan API. Silakan lengkapi pengaturan API terlebih dahulu sebelum mengirim nilai.'
      }
    }

    // 3. Validasi UUID Lokus MenPAN
    const menpanUuid = evaluation.menpanEvaluationId
    if (!menpanUuid) {
      return {
        success: false,
        message: 'Lokus ini belum ditautkan dengan UUID evaluasi di portal MenPAN-RB. Silakan tautkan lokus di tab PULL terlebih dahulu.'
      }
    }

    // 4. Tarik atau baca cache pertanyaan MenPAN
    let questionsList: Array<{
      id: number
      name: string
      index: number
      bobot: number
      is_required: boolean
      option_type: string
      options: Array<{ id: number; text: string; bobot: number; index: number }>
    }> = []

    const cachedLog = evaluation.syncLogs as any
    if (cachedLog && Array.isArray(cachedLog.questionMap) && cachedLog.questionMap.length > 0) {
      questionsList = cachedLog.questionMap
    } else {
      const qRes = await this.getRemoteQuestions(menpanUuid)
      if (!qRes.success || !qRes.data || qRes.data.length === 0) {
        return {
          success: false,
          message: `Gagal mengambil struktur pertanyaan form dari server MenPAN-RB: ${qRes.message || 'Data pertanyaan kosong'}`
        }
      }
      questionsList = qRes.data
    }

    // 5. FUNGSI MAPPER: Memetakan 31 Indikator Lokal & Link Bukti Gabungan per Aspek ke Format Payload MenPAN { answers: { [question_id]: value } }
    const answersPayload: Record<string, string | string[]> = {}
    const appBaseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://pekppp.kutaibaratkab.go.id'
    ).replace(/\/+$/, '')

    const aspectOrder = ['I', 'II', 'III', 'IV', 'V', 'VI']
    let textQuestionCount = 0

    const resolveAspectFromQuestion = (qName: string, textSeqIndex: number): string => {
      const upper = (qName || '').toUpperCase()
      if (upper.includes('INOVASI') || upper.includes('ASPEK VI') || upper.includes('ASPEK 6')) return 'VI'
      if (upper.includes('PENGADUAN') || upper.includes('KONSULTASI') || upper.includes('ASPEK V') || upper.includes('ASPEK 5')) return 'V'
      if (upper.includes('SISTEM INFORMASI') || upper.includes('SIPP') || upper.includes('ASPEK IV') || upper.includes('ASPEK 4')) return 'IV'
      if (upper.includes('SARANA') || upper.includes('PRASARANA') || upper.includes('ASPEK III') || upper.includes('ASPEK 3')) return 'III'
      if (upper.includes('PROFESIONALISME') || upper.includes('SDM') || upper.includes('ASPEK II') || upper.includes('ASPEK 2')) return 'II'
      if (upper.includes('KEBIJAKAN') || upper.includes('STANDAR PELAYANAN') || upper.includes('ASPEK I') || upper.includes('ASPEK 1')) return 'I'
      // Fallback berdasarkan urutan kemunculan pertanyaan teks ke-1 s.d. ke-6 (Aspek I..VI)
      return aspectOrder[textSeqIndex] || 'I'
    }

    for (const remoteQ of questionsList) {
      const optType = (remoteQ.option_type || '').toLowerCase()
      const isTextOrUrlQuestion =
        ['text', 'url', 'textarea', 'link'].includes(optType) ||
        !remoteQ.options ||
        remoteQ.options.length === 0

      // Cocokkan nomor urut soal MenPAN (index: 1..31) dengan indicatorNumber lokal
      const localScore = evaluation.scores.find(
        (s) => s.indicator.indicatorNumber === remoteQ.index
      )

      if (isTextOrUrlQuestion) {
        // Jika pertanyaan MenPAN bertipe teks/tautan (misal meminta Link Bukti Dukung per Aspek/Indikator),
        // arahkan otomatis ke Link Khusus Gabungan Bukti Dukung per Aspek (/shared/evidence/{evaluationId}/{aspectCode})
        const aspectCode = resolveAspectFromQuestion(remoteQ.name, textQuestionCount)
        textQuestionCount++
        answersPayload[String(remoteQ.id)] = `${appBaseUrl}/shared/evidence/${evaluation.id}/${aspectCode}`
      } else if (localScore) {
        // Ambil nilai skala (prioritaskan nilai F-02 evaluator, fallback ke skor mandiri)
        const scoreVal =
          localScore.score !== null && localScore.score !== undefined
            ? localScore.score
            : 0

        const roundedScore = Math.round(scoreVal)

        // Cocokkan dengan opsi jawaban MenPAN yang bobotnya sesuai
        const matchedOption = remoteQ.options?.find(
          (opt) => Math.round(opt.bobot) === roundedScore
        )

        const optionValue = matchedOption
          ? String(matchedOption.bobot)
          : String(roundedScore)

        // Tangani tipe checkbox jika multi-select
        if (optType.includes('checkbox')) {
          answersPayload[String(remoteQ.id)] = [optionValue]
        } else {
          answersPayload[String(remoteQ.id)] = optionValue
        }
      } else {
        // Default jawaban aman jika tidak ditemukan (skor 0)
        answersPayload[String(remoteQ.id)] = '0'
      }
    }

    // 6. Eksekusi pengiriman ke endpoint resmi POST /evaluations/{uuid}/answers
    const pushResult = await this.pushRemoteAnswers(menpanUuid, answersPayload)

    if (pushResult.success) {
      await db.evaluation.update({
        where: { id: evaluationId },
        data: {
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
          syncLogs: {
            mode: 'PRODUCTION_API',
            status: 202,
            message: pushResult.message,
            menpanStatus: pushResult.status || 'queued',
            answersCount: Object.keys(answersPayload).length,
            syncedAt: new Date().toISOString(),
            lastPayloadSummary: {
              keysCount: Object.keys(answersPayload).length,
              sample: Object.entries(answersPayload).slice(0, 3)
            }
          }
        }
      })

      return {
        success: true,
        message: 'Jawaban berhasil dikirim dan diterima oleh server MenPAN-RB (HTTP 202 Accepted - Antrean Queued)!',
        menpanRefId: menpanUuid,
        rawResponse: pushResult
      }
    } else {
      const errorMsg =
        pushResult.validationErrors && pushResult.validationErrors.length > 0
          ? `${pushResult.message}: ${pushResult.validationErrors.join(', ')}`
          : pushResult.message

      await db.evaluation.update({
        where: { id: evaluationId },
        data: {
          syncStatus: 'FAILED',
          syncLogs: {
            mode: 'PRODUCTION_API',
            error: errorMsg,
            validationErrors: pushResult.validationErrors || [],
            failedAt: new Date().toISOString()
          }
        }
      })

      return {
        success: false,
        message: errorMsg,
        rawResponse: pushResult
      }
    }
  }
}
