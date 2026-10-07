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
      return { success: false, message: 'Kredensial API MenPAN belum lengkap.' }
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
      return { success: false, message: 'Kredensial API MenPAN belum lengkap.' }
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
      return { success: false, message: 'Kredensial API MenPAN belum lengkap.' }
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
      return { success: false, message: 'Kredensial API MenPAN belum lengkap.' }
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
   * Mengirimkan data evaluasi lengkap (Formulir F-01, F-02, dan F-03) ke API MenPAN-RB.
   * - Menghimpun data lokus, isian mandiri OPD (F-01), nilai evaluator (F-02), dan data responden survei (F-03).
   * - Menjalankan mode simulasi (Mock Sandbox) jika kredensial belum dikonfigurasi.
   * - Mengirim HTTP POST ke endpoint MenPAN `/evaluasi/submit` dengan timeout 15 detik jika kredensial terisi.
   * - Memperbarui status sinkronisasi (`SYNCED` atau `FAILED`) dan log audit ke database.
   * @param evaluationId ID evaluasi lokus yang akan disinkronkan.
   * @returns Respons sinkronisasi `{ success: boolean, message: string, menpanRefId?: string, rawResponse?: any }`.
   */
  static async pushEvaluation(evaluationId: string): Promise<MenpanSyncResponse> {
    const config = await getMenpanApiConfig()

    // 1. Fetch full evaluation record
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
          }
        },
        f03Respondents: true
      }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan' }
    }

    // Ambil app URL origin atau fallback ke path relatif resmi
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || ''

    // Prepare JSON payload matching OpenAPI Spec
    const payload = {
      lokus_code: evaluation.unit.code,
      lokus_name: evaluation.unit.name,
      year: evaluation.year,
      f01_responses: evaluation.scores.map((s) => {
        const aspCode = s.indicator?.aspect?.code || 'I'
        // Gunakan URL dossier aspek terpadu resmi sebagai bukti dukung tunggal ke MenPAN-RB
        const aspectDossierUrl = `${appOrigin}/shared/evidence/${evaluation.id}/${aspCode}`
        return {
          indicator_code: s.indicator?.code || (s as any).question?.code || `IND_${s.id.slice(-4)}`,
          aspect_code: aspCode,
          f01_data: s.f01Data,
          proof_url: aspectDossierUrl,
          legacy_proof_url: s.proofUrl
        }
      }),
      f02_evaluations: evaluation.scores.map((s) => ({
        indicator_code: s.indicator?.code || (s as any).question?.code || `IND_${s.id.slice(-4)}`,
        score: s.score,
        notes: s.notes
      })),
      aspect_evidence_dossiers: {
        aspek_1: `${appOrigin}/shared/evidence/${evaluation.id}/I`,
        aspek_2: `${appOrigin}/shared/evidence/${evaluation.id}/II`,
        aspek_3: `${appOrigin}/shared/evidence/${evaluation.id}/III`,
        aspek_4: `${appOrigin}/shared/evidence/${evaluation.id}/IV`,
        aspek_5: `${appOrigin}/shared/evidence/${evaluation.id}/V`,
        aspek_6: `${appOrigin}/shared/evidence/${evaluation.id}/VI`,
        aspek_tambahan: `${appOrigin}/shared/evidence/${evaluation.id}/TAMBAHAN`
      },
      aspect_notes: evaluation.aspectNotes,
      f03_respondents: evaluation.f03Respondents.map((r) => ({
        respondent_name: r.name,
        answers: r.answers,
        total_score: r.totalScore
      })),
      f03_proof_url: evaluation.f03ProofUrl,
      final_scores: {
        f02_score: evaluation.totalScore,
        f02_percentage: evaluation.percentage,
        f03_percentage: evaluation.f03Percentage,
        final_ipp: evaluation.finalIppScore
      }
    }

    // 2. If API credentials are missing, run in Sandbox Mode (Simulation)
    if (!config.baseUrl || !config.apiKey) {
      const mockRefId = `MENPAN-MOCK-${Date.now()}`
      
      await db.evaluation.update({
        where: { id: evaluationId },
        data: {
          syncStatus: 'SYNCED',
          syncedAt: new Date(),
          menpanEvaluationId: mockRefId,
          syncLogs: {
            mode: 'SANDBOX_SIMULATION',
            timestamp: new Date().toISOString(),
            info: 'Kredensial belum diisi, berhasil diuji dalam mode simulasi sandbox.'
          }
        }
      })

      return {
        success: true,
        message: 'Pengiriman berhasil disimulasikan (Mode Sandbox / Mock Server)!',
        menpanRefId: mockRefId
      }
    }

    // 3. Real HTTP Request to MenPAN API endpoint
    try {
      const response = await fetch(`${config.baseUrl}/evaluasi/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Client-ID': config.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      })

      const resJson = await response.json().catch(() => ({}))

      if (response.ok) {
        const refId = resJson.reference_id || `MENPAN-${Date.now()}`
        await db.evaluation.update({
          where: { id: evaluationId },
          data: {
            syncStatus: 'SYNCED',
            syncedAt: new Date(),
            menpanEvaluationId: refId,
            syncLogs: {
              status: response.status,
              response: resJson,
              syncedAt: new Date().toISOString()
            }
          }
        })

        return {
          success: true,
          message: 'Data evaluasi berhasil terkirim dan tersinkronisasi dengan Portal MenPAN-RB!',
          menpanRefId: refId,
          rawResponse: resJson
        }
      } else {
        const errorMsg = resJson.message || `HTTP ${response.status}: ${response.statusText}`
        await db.evaluation.update({
          where: { id: evaluationId },
          data: {
            syncStatus: 'FAILED',
            syncLogs: {
              status: response.status,
              error: errorMsg,
              failedAt: new Date().toISOString()
            }
          }
        })

        return {
          success: false,
          message: `API MenPAN Menolak Data: ${errorMsg}`,
          rawResponse: resJson
        }
      }
    } catch (err: any) {
      const networkError = err.message || 'Gagal terhubung ke API MenPAN'
      await db.evaluation.update({
        where: { id: evaluationId },
        data: {
          syncStatus: 'FAILED',
          syncLogs: {
            error: networkError,
            failedAt: new Date().toISOString()
          }
        }
      })

      return {
        success: false,
        message: `Gangguan Jaringan: ${networkError}`
      }
    }
  }
}
