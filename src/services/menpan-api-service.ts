import { getMenpanApiConfig } from './system-setting-service'
import { db } from './db'

export type PekpppFormCode = 'F01' | 'F02' | 'F03'

export const PEKPPP_FORM_CODES: PekpppFormCode[] = ['F01', 'F02', 'F03']

export interface MenpanFormBindingInfo {
  [key: string]: any
  formCode: PekpppFormCode
  uuid: string
  remoteName: string
  formSheetId?: number
  formSheetName?: string
  questionsCount?: number
  questionMap?: any[]
  syncStatus?: 'IDLE' | 'SYNCED' | 'FAILED'
  syncedAt?: string | null
  lastMessage?: string | null
  lastAnswersCount?: number
}

export interface MenpanSyncResponse {
  success: boolean
  message: string
  menpanRefId?: string
  rawResponse?: any
  formResults?: Partial<Record<PekpppFormCode, { success: boolean; message: string; uuid: string }>>
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
  status?: string
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

/**
 * Menormalkan nama/ID form_sheet dari portal MenPAN-RB ke kode baku PEKPPP ('F01' | 'F02' | 'F03').
 * Mengembalikan `null` jika form tersebut bukan bagian dari instrumen PEKPPP
 * (misal: "Pendataan Penyelenggaraan Pelayanan Publik Ramah Kelompok Rentan" / id=22).
 */
export function normalizePekpppFormCode(
  formSheetName?: string | null,
  formSheetId?: number | null
): PekpppFormCode | null {
  if (formSheetId === 1) return 'F01'
  if (formSheetId === 2) return 'F02'
  if (formSheetId === 3) return 'F03'

  const clean = (formSheetName || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!clean) return null
  if (clean === 'F01' || clean.startsWith('F01') || clean.includes('FORMULIRF01') || clean.includes('MANDIRIF01')) {
    return 'F01'
  }
  if (clean === 'F02' || clean.startsWith('F02') || clean.includes('FORMULIRF02') || clean.includes('EVALUATORF02')) {
    return 'F02'
  }
  if (clean === 'F03' || clean.startsWith('F03') || clean.includes('FORMULIRF03') || clean.includes('MASYARAKATF03')) {
    return 'F03'
  }
  return null
}

export function isPekpppFormSheet(
  formSheetName?: string | null,
  formSheetId?: number | null
): boolean {
  return normalizePekpppFormCode(formSheetName, formSheetId) !== null
}

const F03_INDICATOR_CODES = [
  '1.a.K1',
  '2.a.K1',
  '3.a.K1',
  '4.a.K1',
  '5.b.Ak',
  '6.b.Ak',
  '7.b.Ak',
  '8.c.As',
  '9.c.K',
  '10.c.As',
  '11.c.As',
  '12.d.T',
  '13.d.T',
  '14.e.P'
]

/**
 * Daftar berurutan 84 pertanyaan substansi F01 di portal MenPAN-RB (id: 1..87, 465)
 * yang memetakan setiap posisi/id soal ke key di dalam `EvaluationScore.f01Data`.
 */
const F01_CONTENT_KEY_MAP: Array<{
  remoteId: number
  localKeys: string[]
  mode?: 'SINGLE' | 'MULTI' | 'TEXT' | 'COMBINED_TEXT' | 'COMBINED_MULTI'
}> = [
  { remoteId: 1, localKeys: ['q1a'] },
  { remoteId: 2, localKeys: ['q1a_jumlah_jenis_pelayanan'], mode: 'TEXT' },
  { remoteId: 3, localKeys: ['q1a_jumlah_sp'], mode: 'TEXT' },
  { remoteId: 4, localKeys: ['q1b'] },
  { remoteId: 5, localKeys: ['q1c'] },
  { remoteId: 6, localKeys: ['q1d'] },
  { remoteId: 7, localKeys: ['q1e'] },
  { remoteId: 8, localKeys: ['q2a'] },
  { remoteId: 9, localKeys: ['q2b'], mode: 'MULTI' },
  { remoteId: 10, localKeys: ['q3a'] },
  { remoteId: 11, localKeys: ['q3b'] },
  { remoteId: 12, localKeys: ['q3c'], mode: 'MULTI' },
  { remoteId: 13, localKeys: ['q4'] },
  { remoteId: 14, localKeys: ['q5a'] },
  { remoteId: 15, localKeys: ['q5b'] },
  { remoteId: 16, localKeys: ['q5c'] },
  { remoteId: 17, localKeys: ['q5c_media'], mode: 'MULTI' },
  { remoteId: 18, localKeys: ['q6a'] },
  { remoteId: 19, localKeys: ['q6b'], mode: 'TEXT' },
  { remoteId: 20, localKeys: ['q6c_nilai_ikm', 'q6c_periode'], mode: 'COMBINED_TEXT' },
  { remoteId: 21, localKeys: ['q6d'] },
  { remoteId: 22, localKeys: ['q6e'] },
  { remoteId: 23, localKeys: ['q6e_media'], mode: 'MULTI' },
  { remoteId: 24, localKeys: ['q6f'] },
  { remoteId: 25, localKeys: ['q7a'], mode: 'MULTI' },
  { remoteId: 26, localKeys: ['q8a'] },
  { remoteId: 27, localKeys: ['q8b'], mode: 'TEXT' },
  { remoteId: 28, localKeys: ['q8c'] },
  { remoteId: 29, localKeys: ['q9a'] },
  { remoteId: 30, localKeys: ['q9b'] },
  { remoteId: 31, localKeys: ['q10a'] },
  { remoteId: 32, localKeys: ['q10b'], mode: 'MULTI' },
  { remoteId: 33, localKeys: ['q11a'] },
  { remoteId: 34, localKeys: ['q11b'], mode: 'MULTI' },
  { remoteId: 35, localKeys: ['q12a'] },
  { remoteId: 36, localKeys: ['q12b'], mode: 'MULTI' },
  { remoteId: 37, localKeys: ['q13'], mode: 'MULTI' },
  { remoteId: 38, localKeys: ['q14'], mode: 'MULTI' },
  { remoteId: 39, localKeys: ['q15a'] },
  { remoteId: 40, localKeys: ['q15b'], mode: 'MULTI' },
  { remoteId: 41, localKeys: ['q16_wajib', 'q16_tambahan'], mode: 'COMBINED_MULTI' },
  { remoteId: 42, localKeys: ['q17a'] },
  { remoteId: 43, localKeys: ['q17b'], mode: 'MULTI' },
  { remoteId: 44, localKeys: ['q18'], mode: 'MULTI' },
  { remoteId: 45, localKeys: ['q19'], mode: 'MULTI' },
  { remoteId: 46, localKeys: ['q20'], mode: 'MULTI' },
  { remoteId: 47, localKeys: ['q21a'] },
  { remoteId: 48, localKeys: ['q21b'], mode: 'MULTI' },
  { remoteId: 49, localKeys: ['q21c'], mode: 'MULTI' },
  { remoteId: 50, localKeys: ['q21d'], mode: 'MULTI' },
  { remoteId: 51, localKeys: ['q21e'] },
  { remoteId: 52, localKeys: ['q21e_akun'], mode: 'TEXT' },
  { remoteId: 53, localKeys: ['q21f'], mode: 'TEXT' },
  { remoteId: 54, localKeys: ['q22'], mode: 'MULTI' },
  { remoteId: 55, localKeys: ['q23_awal'] },
  { remoteId: 56, localKeys: ['q23a'] },
  { remoteId: 57, localKeys: ['q23b'] },
  { remoteId: 58, localKeys: ['q23e'] },
  { remoteId: 59, localKeys: ['q23d'] },
  { remoteId: 60, localKeys: ['q23c'] },
  { remoteId: 61, localKeys: ['q24a'] },
  { remoteId: 62, localKeys: ['q24b'] },
  { remoteId: 63, localKeys: ['q25'], mode: 'MULTI' },
  { remoteId: 64, localKeys: ['q26a'] },
  { remoteId: 65, localKeys: ['q26b_tatap_muka', 'q26b_daring'], mode: 'COMBINED_MULTI' },
  { remoteId: 66, localKeys: ['q27a'] },
  { remoteId: 67, localKeys: ['q27b'] },
  { remoteId: 68, localKeys: ['q27c'] },
  { remoteId: 69, localKeys: ['q27d'] },
  { remoteId: 70, localKeys: ['q27e'] },
  { remoteId: 71, localKeys: ['q27f'] },
  { remoteId: 72, localKeys: ['q28_masuk_total'], mode: 'TEXT' },
  { remoteId: 73, localKeys: ['q28_tindaklanjut_total'], mode: 'TEXT' },
  { remoteId: 74, localKeys: ['q28_masuk_lapor'], mode: 'TEXT' },
  { remoteId: 75, localKeys: ['q28_tindaklanjut_lapor'], mode: 'TEXT' },
  { remoteId: 76, localKeys: ['q29_1'] },
  { remoteId: 77, localKeys: ['q29_1a_judul'], mode: 'TEXT' },
  { remoteId: 79, localKeys: ['q29_2'] },
  { remoteId: 81, localKeys: ['q29_3'] },
  { remoteId: 83, localKeys: ['q30a'] },
  { remoteId: 84, localKeys: ['q30b', 'q30c'], mode: 'COMBINED_MULTI' },
  { remoteId: 86, localKeys: ['qtambahan_a'] },
  { remoteId: 87, localKeys: ['qtambahan_b'], mode: 'MULTI' },
  { remoteId: 465, localKeys: ['q29_2'] }
]

export class MenpanApiService {
  /**
   * Helper internal untuk menyiapkan header autentikasi sesuai spesifikasi OpenAPI 3.0.3 MenPAN-RB.
   * Hanya menggunakan Bearer Token (Sanctum Personal Access Token).
   */
  private static getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/json',
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
          message:
            'Autentikasi Gagal (HTTP 401): Bearer Token tidak valid atau sudah kedaluwarsa/dicabut oleh admin PEKPPP.'
        }
      } else if (response.status === 429) {
        return {
          success: false,
          isConfigured: true,
          message:
            'Rate limit terlampaui (HTTP 429): Terlalu banyak permintaan dalam 1 menit. Harap tunggu beberapa saat.'
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
   * PULL: Mengambil seluruh halaman daftar evaluasi instansi dari endpoint resmi GET /evaluations.
   * Secara default hanya menyaring form evaluasi yang termasuk PEKPPP (F01, F02, F03)
   * dan mengabaikan form non-PEKPPP (seperti Pendataan Kelompok Rentan).
   */
  static async getRemoteEvaluations(
    year?: number,
    options?: { includeNonPekppp?: boolean }
  ): Promise<{
    success: boolean
    data?: MenpanEvaluationItem[]
    totalRaw?: number
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
      const headers = this.getHeaders(config.apiKey)

      const fetchPage = async (page: number) => {
        const queryParams = new URLSearchParams()
        if (year) queryParams.set('year', String(year))
        queryParams.set('per_page', '100')
        queryParams.set('page', String(page))

        const url = `${cleanBase}/evaluations?${queryParams.toString()}`
        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(12000)
        })
        return res
      }

      const firstRes = await fetchPage(1)
      if (!firstRes.ok) {
        const err = await firstRes.json().catch(() => ({}))
        return {
          success: false,
          message:
            err.message || `HTTP ${firstRes.status}: Gagal mengambil daftar evaluasi MenPAN.`
        }
      }

      const firstJson = await firstRes.json()
      const allItems: MenpanEvaluationItem[] = [...(firstJson.data || [])]
      const lastPage = Math.min(Number(firstJson.meta?.last_page || 1), 15)

      if (lastPage > 1) {
        const remainingPages: number[] = []
        for (let p = 2; p <= lastPage; p++) {
          remainingPages.push(p)
        }

        const pageResponses = await Promise.all(
          remainingPages.map(async (p) => {
            try {
              const r = await fetchPage(p)
              if (r.ok) {
                const j = await r.json()
                return (j.data || []) as MenpanEvaluationItem[]
              }
            } catch {
              // Abaikan kegagalan halaman parsial agar tidak menggagalkan seluruh proses
            }
            return [] as MenpanEvaluationItem[]
          })
        )

        for (const pageItems of pageResponses) {
          allItems.push(...pageItems)
        }
      }

      const filteredItems = options?.includeNonPekppp
        ? allItems
        : allItems.filter((item) =>
            isPekpppFormSheet(item.form_sheet?.name, item.form_sheet?.id)
          )

      return {
        success: true,
        data: filteredItems,
        totalRaw: allItems.length
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
        return {
          success: false,
          message: err.message || `HTTP ${response.status}: Detail evaluasi tidak ditemukan.`
        }
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
        id: number | null
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
        return {
          success: false,
          message:
            err.message || `HTTP ${response.status}: Gagal mengambil daftar pertanyaan form.`
        }
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
        return {
          success: false,
          message: err.message || `HTTP ${response.status}: Gagal mengambil jawaban dari MenPAN.`
        }
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

      if (response.status === 202 || response.status === 200 || response.status === 201) {
        return {
          success: true,
          message:
            json.message ||
            'Jawaban berhasil diterima MenPAN-RB dan sedang diproses (queued).',
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
          message:
            json.message ||
            'Validasi MenPAN Gagal: Terdapat butir pertanyaan wajib yang belum terisi.',
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
   * MAPPER F-02: Memetakan 31 skor evaluator lokal (0..5) ke 31 pertanyaan F02 MenPAN-RB (id: 88..118).
   * Menangani kondisi di mana `remoteQ.index` di server MenPAN bernilai 1000 dengan mencocokkan
   * kode nomor indikator di awal `remoteQ.name` ("1.a.Ak ...", ..., "30.f.B ...") atau posisi urut 1..31.
   */
  private static buildF02AnswersPayload(
    evaluation: any,
    questionsList: any[]
  ): Record<string, string | string[]> {
    const answersPayload: Record<string, string | string[]> = {}

    questionsList.forEach((remoteQ, seqIdx) => {
      const optType = (remoteQ.option_type || '').toLowerCase()
      const nameStr = String(remoteQ.name || '').trim()

      // Ekstrak nomor indikator dari awalan nama soal ("1.a.Ak ..." -> 1)
      let indicatorNo: number | null = null
      const codeMatch = nameStr.match(/^(\d{1,2})\.[a-zA-Z]/)
      if (codeMatch) {
        indicatorNo = Number(codeMatch[1])
      } else if (remoteQ.index >= 1 && remoteQ.index <= 31) {
        indicatorNo = Number(remoteQ.index)
      } else if (nameStr.toLowerCase().includes('antrian')) {
        indicatorNo = 31
      } else {
        indicatorNo = seqIdx + 1
      }

      const localScore = evaluation.scores.find(
        (s: any) => s.indicator.indicatorNumber === indicatorNo
      )

      const scoreVal =
        localScore && localScore.score !== null && localScore.score !== undefined
          ? Number(localScore.score)
          : 0
      const roundedScore = Math.max(0, Math.min(5, Math.round(scoreVal)))

      const matchedOption = remoteQ.options?.find(
        (opt: any) => Math.round(Number(opt.bobot)) === roundedScore
      )
      const optionValue = matchedOption
        ? String(matchedOption.bobot)
        : String(roundedScore)

      if (optType.includes('checkbox')) {
        answersPayload[String(remoteQ.id)] = [optionValue]
      } else {
        answersPayload[String(remoteQ.id)] = optionValue
      }
    })

    return answersPayload
  }

  /**
   * MAPPER F-03: Memetakan rekap nilai per unsur dari responden F-03 lokal (14 unsur)
   * ke 14 pertanyaan F03 MenPAN-RB (id: 119..132).
   */
  private static buildF03AnswersPayload(
    evaluation: any,
    questionsList: any[]
  ): Record<string, string | string[]> {
    const answersPayload: Record<string, string | string[]> = {}
    const respondents: any[] = evaluation.f03Respondents || []

    questionsList.forEach((remoteQ, seqIdx) => {
      const optType = (remoteQ.option_type || '').toLowerCase()
      const codeKey = F03_INDICATOR_CODES[seqIdx]
      const numKey = String(seqIdx + 1)

      let sum = 0
      let count = 0
      for (const resp of respondents) {
        const ans = (resp.answers || {}) as Record<string, any>
        const rawVal = ans[codeKey] !== undefined ? ans[codeKey] : ans[numKey]
        if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
          sum += Number(rawVal)
          count++
        }
      }

      const avgScore =
        count > 0
          ? sum / count
          : evaluation.f03Scale5 !== null && evaluation.f03Scale5 !== undefined
          ? Number(evaluation.f03Scale5)
          : 0
      const roundedScore = Math.max(0, Math.min(5, Math.round(avgScore)))

      const matchedOption = remoteQ.options?.find(
        (opt: any) => Math.round(Number(opt.bobot)) === roundedScore
      )
      const optionValue = matchedOption
        ? String(matchedOption.bobot)
        : String(roundedScore)

      if (optType.includes('checkbox')) {
        answersPayload[String(remoteQ.id)] = [optionValue]
      } else {
        answersPayload[String(remoteQ.id)] = optionValue
      }
    })

    return answersPayload
  }

  /**
   * MAPPER F-01: Memetakan 84 pertanyaan substansi dari `EvaluationScore.f01Data` +
   * 6 Link Bukti Dukung Aspek I..VI (id: 338..343) ke format payload F01 MenPAN-RB.
   */
  private static buildF01AnswersPayload(
    evaluation: any,
    questionsList: any[],
    appBaseUrl: string
  ): Record<string, string | string[]> {
    const answersPayload: Record<string, string | string[]> = {}

    // Gabungkan seluruh f01Data dari 31 indikator ke dalam satu dictionary datar
    const allF01Data: Record<string, any> = {}
    for (const scoreRow of evaluation.scores || []) {
      const dataObj = scoreRow.f01Data as Record<string, any> | null
      if (dataObj && typeof dataObj === 'object') {
        Object.assign(allF01Data, dataObj)
      }
    }

    const aspectOrder = ['I', 'II', 'III', 'IV', 'V', 'VI']
    let linkSeqIdx = 0
    let contentSeqIdx = 0

    const matchOptionBobot = (options: any[], rawTarget: string): string | null => {
      if (!options || options.length === 0) return null
      const cleanTarget = String(rawTarget || '').toLowerCase().trim()
      if (!cleanTarget) return null

      // 1. Exact text match
      const exact = options.find(
        (o) => String(o.text || '').toLowerCase().trim() === cleanTarget
      )
      if (exact) return String(exact.bobot)

      // 2. Normalized alphanumeric match
      const normTarget = cleanTarget.replace(/[^a-z0-9]/g, '')
      if (normTarget) {
        const sub = options.find((o) => {
          const normOpt = String(o.text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
          return (
            normOpt === normTarget ||
            normOpt.includes(normTarget) ||
            normTarget.includes(normOpt)
          )
        })
        if (sub) return String(sub.bobot)
      }

      return null
    }

    for (const remoteQ of questionsList) {
      const qId = Number(remoteQ.id)
      const qName = String(remoteQ.name || '')
      const optType = String(remoteQ.option_type || '').toLowerCase()

      // 1. Deteksi 6 Pertanyaan Link Bukti Dukung Aspek (id: 338..343 atau nama "Link Bukti Dukung Aspek ...")
      const isAspectLink =
        (qId >= 338 && qId <= 343) ||
        qName.toLowerCase().includes('link bukti dukung aspek')

      if (isAspectLink) {
        let aspectCode = aspectOrder[linkSeqIdx] || 'I'
        if (qId >= 338 && qId <= 343) {
          aspectCode = aspectOrder[qId - 338] || aspectCode
        } else {
          const numMatch = qName.match(/aspek\s*(\d)/i)
          if (numMatch) {
            const idx = Number(numMatch[1]) - 1
            if (aspectOrder[idx]) aspectCode = aspectOrder[idx]
          }
        }
        linkSeqIdx++
        answersPayload[String(qId)] = `${appBaseUrl}/shared/evidence/${evaluation.id}/${aspectCode}`
        continue
      }

      // 2. Cari mapping untuk pertanyaan substansi F01 (berdasarkan remoteId atau urutan)
      const mapEntry =
        F01_CONTENT_KEY_MAP.find((m) => m.remoteId === qId) ||
        F01_CONTENT_KEY_MAP[contentSeqIdx]
      contentSeqIdx++

      const options = Array.isArray(remoteQ.options) ? remoteQ.options : []
      const isCheckbox = optType.includes('checkbox')
      const isShortText =
        optType.includes('text') ||
        optType.includes('url') ||
        options.length === 0

      if (!mapEntry) {
        if (isCheckbox) {
          answersPayload[String(qId)] = options.length > 0 ? [String(options[0].bobot)] : ['0']
        } else if (isShortText) {
          answersPayload[String(qId)] = '-'
        } else {
          answersPayload[String(qId)] = options.length > 0 ? String(options[0].bobot) : '0'
        }
        continue
      }

      // 3. Ambil nilai dari allF01Data sesuai mode
      if (isShortText || mapEntry.mode === 'TEXT' || mapEntry.mode === 'COMBINED_TEXT') {
        if (mapEntry.mode === 'COMBINED_TEXT') {
          const parts = mapEntry.localKeys
            .map((k) => allF01Data[k])
            .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
          answersPayload[String(qId)] = parts.length > 0 ? parts.join(' - ') : '-'
        } else {
          const rawVal = allF01Data[mapEntry.localKeys[0]]
          answersPayload[String(qId)] =
            rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== ''
              ? String(rawVal)
              : '0'
        }
      } else if (isCheckbox || mapEntry.mode === 'MULTI' || mapEntry.mode === 'COMBINED_MULTI') {
        const selectedTexts: string[] = []
        for (const k of mapEntry.localKeys) {
          const val = allF01Data[k]
          if (Array.isArray(val)) {
            selectedTexts.push(...val.map(String))
          } else if (typeof val === 'string' && val.trim() !== '') {
            selectedTexts.push(val.trim())
          }
        }

        const matchedBobots: string[] = []
        for (const txt of selectedTexts) {
          const b = matchOptionBobot(options, txt)
          if (b !== null && !matchedBobots.includes(b)) {
            matchedBobots.push(b)
          }
        }

        if (matchedBobots.length > 0) {
          answersPayload[String(qId)] = matchedBobots
        } else if (options.length > 0) {
          answersPayload[String(qId)] = [String(options[0].bobot)]
        } else {
          answersPayload[String(qId)] = ['0']
        }
      } else {
        // Radio vertical / Single choice
        const rawVal = allF01Data[mapEntry.localKeys[0]]
        const matched = rawVal !== undefined && rawVal !== null
          ? matchOptionBobot(options, String(rawVal))
          : null

        if (matched !== null) {
          answersPayload[String(qId)] = matched
        } else {
          // Default fallback: pilih opsi "Ya" atau opsi pertama
          const defaultOpt =
            options.find((o: any) => String(o.text || '').toLowerCase().trim() === 'ya') ||
            options[0]
          answersPayload[String(qId)] = defaultOpt ? String(defaultOpt.bobot) : '0'
        }
      }
    }

    return answersPayload
  }

  /**
   * Mengirimkan data evaluasi lengkap (F01, F02, dan/atau F03) ke API Resmi MenPAN-RB.
   * Mendukung pengiriman per form spesifik ('F01' | 'F02' | 'F03') maupun seluruh form PEKPPP sekaligus ('ALL').
   */
  static async pushEvaluation(
    evaluationId: string,
    targetForm: PekpppFormCode | 'ALL' = 'ALL'
  ): Promise<MenpanSyncResponse> {
    const config = await getMenpanApiConfig()

    // 1. Ambil data evaluasi lokal beserta nilai per indikator & responden F-03
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

    // 3. Resolusi daftar form UUID yang tertaut pada evaluasi ini
    const existingLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const storedForms = (existingLogs.forms || {}) as Partial<
      Record<PekpppFormCode, MenpanFormBindingInfo>
    >

    // Fallback kompatibilitas jika hanya ada menpanEvaluationId tunggal
    if (
      evaluation.menpanEvaluationId &&
      !storedForms.F01 &&
      !storedForms.F02 &&
      !storedForms.F03
    ) {
      const detectedCode =
        normalizePekpppFormCode(evaluation.menpanFormSheetName) || 'F02'
      storedForms[detectedCode] = {
        formCode: detectedCode,
        uuid: evaluation.menpanEvaluationId,
        remoteName: evaluation.menpanEvaluationName || evaluation.unit.name,
        formSheetName: evaluation.menpanFormSheetName || detectedCode,
        questionsCount: existingLogs.questionsCount,
        questionMap: existingLogs.questionMap
      }
    }

    const formsToPush: PekpppFormCode[] =
      targetForm === 'ALL'
        ? PEKPPP_FORM_CODES.filter((code) => Boolean(storedForms[code]?.uuid))
        : storedForms[targetForm]?.uuid
        ? [targetForm]
        : []

    if (formsToPush.length === 0) {
      const label = targetForm === 'ALL' ? 'F01/F02/F03' : targetForm
      return {
        success: false,
        message: `Lokus ini belum memiliki tautan UUID MenPAN-RB untuk form ${label}. Silakan lakukan Rekonsiliasi Lokus atau tautkan di tab PULL terlebih dahulu.`
      }
    }

    const appBaseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://pekppp.kutaibaratkab.go.id'
    ).replace(/\/+$/, '')

    const formResults: Partial<
      Record<PekpppFormCode, { success: boolean; message: string; uuid: string }>
    > = {}
    const updatedForms: Partial<Record<PekpppFormCode, MenpanFormBindingInfo>> = {
      ...storedForms
    }

    let successCount = 0
    let failCount = 0
    const errorMessages: string[] = []

    for (const formCode of formsToPush) {
      const formBinding = updatedForms[formCode]!
      const targetUuid = formBinding.uuid

      // Ambil atau tarik questionMap untuk form ini
      let questionsList: any[] = []
      if (Array.isArray(formBinding.questionMap) && formBinding.questionMap.length > 0) {
        questionsList = formBinding.questionMap
      } else {
        const qRes = await this.getRemoteQuestions(targetUuid)
        if (!qRes.success || !qRes.data || qRes.data.length === 0) {
          const msg = `Gagal mengambil kamus soal ${formCode}: ${qRes.message || 'Data kosong'}`
          formResults[formCode] = { success: false, message: msg, uuid: targetUuid }
          errorMessages.push(`[${formCode}] ${msg}`)
          failCount++
          continue
        }
        questionsList = qRes.data
      }

      // Bangun payload sesuai jenis form PEKPPP
      let answersPayload: Record<string, string | string[]> = {}
      if (formCode === 'F01') {
        answersPayload = this.buildF01AnswersPayload(evaluation, questionsList, appBaseUrl)
      } else if (formCode === 'F02') {
        answersPayload = this.buildF02AnswersPayload(evaluation, questionsList)
      } else if (formCode === 'F03') {
        answersPayload = this.buildF03AnswersPayload(evaluation, questionsList)
      }

      const pushRes = await this.pushRemoteAnswers(targetUuid, answersPayload)

      if (pushRes.success) {
        successCount++
        formResults[formCode] = {
          success: true,
          message: pushRes.message,
          uuid: targetUuid
        }
        updatedForms[formCode] = {
          ...formBinding,
          questionsCount: questionsList.length,
          questionMap: questionsList,
          syncStatus: 'SYNCED',
          syncedAt: new Date().toISOString(),
          lastMessage: pushRes.message,
          lastAnswersCount: Object.keys(answersPayload).length
        }
      } else {
        failCount++
        const errMsg =
          pushRes.validationErrors && pushRes.validationErrors.length > 0
            ? `${pushRes.message}: ${pushRes.validationErrors.join(', ')}`
            : pushRes.message
        formResults[formCode] = {
          success: false,
          message: errMsg,
          uuid: targetUuid
        }
        errorMessages.push(`[${formCode}] ${errMsg}`)
        updatedForms[formCode] = {
          ...formBinding,
          questionsCount: questionsList.length,
          questionMap: questionsList,
          syncStatus: 'FAILED',
          lastMessage: errMsg
        }
      }
    }

    const allSuccess = successCount > 0 && failCount === 0
    const pushedLabels = formsToPush.join(', ')

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        syncStatus: allSuccess ? 'SYNCED' : failCount > 0 && successCount === 0 ? 'FAILED' : 'SYNCED',
        syncedAt: successCount > 0 ? new Date() : evaluation.syncedAt,
        syncLogs: {
          ...existingLogs,
          mode: 'PRODUCTION_API',
          status: allSuccess ? 202 : 422,
          lastPushedForms: formsToPush,
          syncedAt: new Date().toISOString(),
          forms: updatedForms
        }
      }
    })

    if (allSuccess) {
      return {
        success: true,
        message: `Berhasil mengirim jawaban form ${pushedLabels} ke server MenPAN-RB (HTTP 202 Accepted - Queued)!`,
        menpanRefId: formsToPush.map((c) => updatedForms[c]?.uuid).join(','),
        formResults
      }
    } else {
      return {
        success: false,
        message:
          successCount > 0
            ? `Terkirim sebagian (${successCount} berhasil, ${failCount} gagal): ${errorMessages.join(' | ')}`
            : `Gagal mengirim form ${pushedLabels}: ${errorMessages.join(' | ')}`,
        formResults
      }
    }
  }
}
