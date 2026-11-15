import { getMenpanApiConfig } from './system-setting-service'
import { db } from './db'
import { normalizeAspectCode, getDbAspectCode } from '../core/domain/evidence-slots-preset'
import { formatLegacyPipeNotesToHtml } from '../lib/menpan-note-formatter'
import {
  calculatePekpppScore,
  calculateEffectiveF03AndIpp,
  IndicatorScoreInput
} from '../core/domain/pekppp-calculator'

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

export interface MenpanEvaluationGroupItem {
  id: number
  uuid: string
  name: string
  year: number
  tampilkan_nilai?: boolean
  is_priority?: boolean
  government_instance?: {
    id: number
    name: string
  }
  evaluations?: MenpanEvaluationItem[]
}

export interface MenpanBapSectionItem {
  [key: string]: any
  section_id: number
  name: string
  kondisi: string
  catatan: string
  rekomendasi: string
}

export interface MenpanBapSignerItem {
  [key: string]: any
  id?: number | string
  role?: 'evaluator' | 'mengetahui'
  name: string
  position?: string | null
  nip?: string | null
  signed_at?: string | null
  signature_url?: string | null
}

export interface MenpanBapData {
  [key: string]: any
  evaluation_group_uuid: string
  name: string | null
  printed_at: string | null
  bap_file_url: string | null
  bap_file_source: 'generated' | 'uploaded' | string | null
  sections: MenpanBapSectionItem[]
  evaluators: MenpanBapSignerItem[]
  knowers: MenpanBapSignerItem[]
}

export interface MenpanBapSigningLinks {
  evaluator_url?: string
  knower_url?: string
  evaluator_signing_url?: string
  knower_signing_url?: string
  expires_at?: string | null
}

export const MENPAN_BAP_SECTION_CONFIG: Array<{
  section_id: number
  name: string
  romanCode: string
  dbCode: string
  indicatorStart: number
  indicatorEnd: number
}> = [
  { section_id: 8, name: 'Kebijakan Pelayanan', romanCode: 'I', dbCode: 'KEBIJAKAN', indicatorStart: 1, indicatorEnd: 9 },
  { section_id: 9, name: 'Profesionalisme SDM', romanCode: 'II', dbCode: 'SDM', indicatorStart: 10, indicatorEnd: 14 },
  { section_id: 10, name: 'Sarana dan Prasarana', romanCode: 'III', dbCode: 'SARPRAS', indicatorStart: 15, indicatorEnd: 20 },
  { section_id: 11, name: 'Sistem Informasi Pelayanan Publik', romanCode: 'IV', dbCode: 'SIPP', indicatorStart: 21, indicatorEnd: 24 },
  { section_id: 12, name: 'Konsultasi dan Pengaduan', romanCode: 'V', dbCode: 'PENGADUAN', indicatorStart: 25, indicatorEnd: 28 },
  { section_id: 13, name: 'Inovasi', romanCode: 'VI', dbCode: 'INOVASI', indicatorStart: 29, indicatorEnd: 30 },
  { section_id: 14, name: 'Pertanyaan Tambahan', romanCode: 'TAMBAHAN', dbCode: 'TAMBAHAN', indicatorStart: 31, indicatorEnd: 31 }
]

export interface MenpanSyncResponse {
  success: boolean
  message: string
  menpanRefId?: string
  rawResponse?: any
  formResults?: Partial<Record<PekpppFormCode, { success: boolean; message: string; uuid: string }>>
  bapSyncResult?: { success: boolean; message: string; groupUuid?: string }
}

export interface MenpanPullResponse {
  success: boolean
  message: string
  pulledForms?: Partial<Record<PekpppFormCode, { count: number; uuid: string }>>
  newScore?: number
  newScale5?: number
  newIpp?: number
  errors?: string[]
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
          lastPushedAt: successCount > 0 ? new Date().toISOString() : existingLogs.lastPushedAt,
          lastSyncDirection: successCount > 0 ? 'PUSH' : existingLogs.lastSyncDirection,
          lastSyncActionAt: successCount > 0 ? new Date().toISOString() : existingLogs.lastSyncActionAt,
          lastPushedForms: formsToPush,
          lastPushSummary: {
            pushedAt: new Date().toISOString(),
            forms: formsToPush,
            successCount,
            failCount
          },
          syncedAt: new Date().toISOString(),
          forms: updatedForms
        }
      }
    })

    // Jika F02 ikut di-push dan berhasil, otomatis sinkronkan juga Catatan Rekomendasi Aspek & BAP ke /evaluation-groups/{uuid}/bap
    let bapSyncResult: { success: boolean; message: string; groupUuid?: string } | undefined
    if (formsToPush.includes('F02') && formResults.F02?.success) {
      try {
        const bapRes = await this.syncEvaluationBapToMenpan(evaluationId)
        bapSyncResult = {
          success: bapRes.success,
          message: bapRes.message,
          groupUuid: bapRes.groupUuid
        }
      } catch (e: any) {
        bapSyncResult = {
          success: false,
          message: e?.message || 'Gagal menyinkronkan catatan BAP'
        }
      }
    }

    if (allSuccess) {
      const bapNote = bapSyncResult?.success
        ? ' + Catatan Rekomendasi & BAP tersinkron!'
        : ''
      return {
        success: true,
        message: `Berhasil mengirim jawaban form ${pushedLabels} ke server MenPAN-RB (HTTP 202 Accepted - Queued)${bapNote}`,
        menpanRefId: formsToPush.map((c) => updatedForms[c]?.uuid).join(','),
        formResults,
        bapSyncResult
      }
    } else {
      return {
        success: false,
        message:
          successCount > 0
            ? `Terkirim sebagian (${successCount} berhasil, ${failCount} gagal): ${errorMessages.join(' | ')}`
            : `Gagal mengirim form ${pushedLabels}: ${errorMessages.join(' | ')}`,
        formResults,
        bapSyncResult
      }
    }
  }

  /**
   * PULL DATA: Menarik jawaban yang tersimpan di portal MenPAN-RB (Form F-02 skor evaluator dan/atau Form F-01 mandiri OPD)
   * ke database lokal Kutai Barat, lalu merecalculasi IPP lokal secara otomatis.
   */
  static async pullEvaluation(
    evaluationId: string,
    targetForm: PekpppFormCode | 'ALL' = 'ALL'
  ): Promise<MenpanPullResponse> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        message: 'Kredensial API MenPAN-RB belum dikonfigurasi di menu Pengaturan API.'
      }
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: true,
        scores: {
          include: {
            indicator: {
              include: { aspect: true }
            }
          },
          orderBy: {
            indicator: { indicatorNumber: 'asc' }
          }
        }
      }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan di database lokal.' }
    }

    const existingLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const storedForms = (existingLogs.forms || {}) as Partial<
      Record<PekpppFormCode, MenpanFormBindingInfo>
    >

    // Fallback jika belum tersimpan di syncLogs.forms tapi ada menpanEvaluationId
    if (evaluation.menpanEvaluationId && !storedForms.F01 && !storedForms.F02 && !storedForms.F03) {
      const detectedCode = normalizePekpppFormCode(evaluation.menpanFormSheetName) || 'F02'
      storedForms[detectedCode] = {
        formCode: detectedCode,
        uuid: evaluation.menpanEvaluationId,
        remoteName: evaluation.menpanEvaluationName || evaluation.unit.name,
        formSheetName: evaluation.menpanFormSheetName || detectedCode
      }
    }

    const f02Uuid = storedForms.F02?.uuid || (evaluation.menpanEvaluationId ? evaluation.menpanEvaluationId : null)
    const f01Uuid = storedForms.F01?.uuid || null

    if (!f02Uuid && !f01Uuid) {
      return {
        success: false,
        message:
          'Lokus ini belum ditautkan dengan UUID evaluasi MenPAN-RB. Silakan tautkan UUID di tab PULL atau lakukan Rekonsiliasi Lokus terlebih dahulu.'
      }
    }

    const shouldPullF02 = (targetForm === 'ALL' || targetForm === 'F02') && Boolean(f02Uuid)
    const shouldPullF01 = (targetForm === 'ALL' || targetForm === 'F01') && Boolean(f01Uuid)

    if (!shouldPullF02 && !shouldPullF01) {
      return {
        success: false,
        message: `Tidak ditemukan tautan UUID untuk form ${targetForm}.`
      }
    }

    let pulledF02Count = 0
    let pulledF01Count = 0
    const errors: string[] = []

    // Helper untuk mem-parsing skor 0..5 dari jawaban MenPAN-RB
    const parseScoreValue = (
      rawValue: any,
      options?: Array<{ id: number | null; text: string; bobot: number; index: number }>
    ): number => {
      if (rawValue === null || rawValue === undefined || rawValue === '') return 0
      const val = Array.isArray(rawValue) ? rawValue[0] : rawValue
      const strVal = String(val).trim()

      const numDirect = Number(strVal)
      if (!isNaN(numDirect) && numDirect >= 0 && numDirect <= 5 && Number.isInteger(numDirect)) {
        return numDirect
      }

      if (options && Array.isArray(options)) {
        const matchedById = options.find((opt) => String(opt.id) === strVal)
        if (matchedById && !isNaN(Number(matchedById.bobot))) {
          return Math.max(0, Math.min(5, Math.round(Number(matchedById.bobot))))
        }
        const matchedByBobot = options.find((opt) => String(opt.bobot) === strVal)
        if (matchedByBobot && !isNaN(Number(matchedByBobot.bobot))) {
          return Math.max(0, Math.min(5, Math.round(Number(matchedByBobot.bobot))))
        }
      }

      if (!isNaN(numDirect)) {
        return Math.max(0, Math.min(5, Math.round(numDirect)))
      }
      return 0
    }

    // 1. PROSES PULL F-02 (Skor Evaluator 31 Indikator)
    if (shouldPullF02 && f02Uuid) {
      const [qRes, aRes] = await Promise.all([
        this.getRemoteQuestions(f02Uuid),
        this.getRemoteAnswers(f02Uuid)
      ])

      if (!qRes.success || !qRes.data || qRes.data.length === 0) {
        errors.push(`Gagal mengambil kamus soal F-02: ${qRes.message || 'Data kosong'}`)
      } else if (!aRes.success) {
        errors.push(`Gagal mengambil jawaban F-02 dari MenPAN: ${aRes.message}`)
      } else {
        const remoteAnswers = aRes.data || []
        const remoteQuestions = qRes.data

        if (remoteAnswers.length === 0) {
          errors.push('Belum ada data jawaban F-02 yang tersimpan di server MenPAN-RB.')
        } else {
          const ansMap = new Map<number, any>()
          for (const ans of remoteAnswers) {
            ansMap.set(ans.question_id, ans)
          }

          const scoreUpdates: Array<{ id: string; score: number }> = []

          remoteQuestions.forEach((remoteQ, seqIdx) => {
            const nameStr = String(remoteQ.name || '').trim()
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

            const matchedAns = ansMap.get(remoteQ.id)
            if (matchedAns && matchedAns.value !== undefined && matchedAns.value !== null) {
              const parsedScore = parseScoreValue(matchedAns.value, remoteQ.options)
              const localScore = evaluation.scores.find(
                (s) => s.indicator.indicatorNumber === indicatorNo
              )
              if (localScore) {
                scoreUpdates.push({ id: localScore.id, score: parsedScore })
              }
            }
          })

          if (scoreUpdates.length > 0) {
            await db.$transaction(
              scoreUpdates.map((u) =>
                db.evaluationScore.update({
                  where: { id: u.id },
                  data: { score: u.score }
                })
              )
            )
            pulledF02Count = scoreUpdates.length
          }
        }
      }
    }

    // 2. PROSES PULL F-01 (Mandiri OPD)
    if (shouldPullF01 && f01Uuid) {
      const [qRes, aRes] = await Promise.all([
        this.getRemoteQuestions(f01Uuid),
        this.getRemoteAnswers(f01Uuid)
      ])

      if (qRes.success && aRes.success && aRes.data && aRes.data.length > 0) {
        const remoteAnswers = aRes.data
        const remoteQuestions = qRes.data || []
        const ansMap = new Map<number, any>()
        for (const ans of remoteAnswers) {
          ansMap.set(ans.question_id, ans)
        }

        // Kumpulkan data F-01 yang berhasil ditarik
        const pulledF01DataAll: Record<string, any> = {}

        for (const remoteQ of remoteQuestions) {
          const ans = ansMap.get(remoteQ.id)
          if (!ans || ans.value === undefined || ans.value === null) continue

          const mapEntry = F01_CONTENT_KEY_MAP.find((m) => m.remoteId === remoteQ.id)
          if (mapEntry && mapEntry.localKeys.length > 0) {
            const primaryKey = mapEntry.localKeys[0]
            pulledF01DataAll[primaryKey] = ans.value
            pulledF01Count++
          }
        }

        // Distribusikan ke row EvaluationScore berdasarkan prefix indikator (q1, q2, dst.)
        if (Object.keys(pulledF01DataAll).length > 0) {
          const f01Updates = evaluation.scores.map((s) => {
            const indNo = s.indicator.indicatorNumber
            const existingF01 = ((s.f01Data as any) || {}) as Record<string, any>
            const mergedF01: Record<string, any> = { ...existingF01 }

            for (const [k, v] of Object.entries(pulledF01DataAll)) {
              const m = k.match(/^q(\d{1,2})/i)
              if (m && Number(m[1]) === indNo) {
                mergedF01[k] = v
              } else if (k.startsWith('qtambahan') && indNo === 31) {
                mergedF01[k] = v
              }
            }

            return db.evaluationScore.update({
              where: { id: s.id },
              data: {
                f01Data: mergedF01,
                f01Submitted: true
              }
            })
          })

          await db.$transaction(f01Updates)
        }
      }
    }

    if (pulledF02Count === 0 && pulledF01Count === 0 && errors.length > 0) {
      return {
        success: false,
        message: `Gagal menarik data dari MenPAN-RB: ${errors.join(' | ')}`,
        errors
      }
    }

    // 3. REKALKULASI SKOR PEKPPP LOKAL OTOMATIS
    const freshScores = await db.evaluationScore.findMany({
      where: { evaluationId },
      include: {
        indicator: {
          include: { aspect: true }
        }
      }
    })

    const calculationInputs: IndicatorScoreInput[] = freshScores.map((s) => ({
      indicatorNumber: s.indicator.indicatorNumber,
      aspectCode: s.indicator.aspect.code,
      score: s.score,
      maxScore: s.indicator.maxScore,
      indicatorWeight: s.indicator.indicatorWeight,
      aspectWeight: s.indicator.aspect.aspectWeight,
      isSupplementary: s.indicator.isSupplementary
    }))

    const calcResult = calculatePekpppScore(calculationInputs)

    const period = evaluation.year
      ? await db.evaluationPeriod.findUnique({
          where: { year: evaluation.year },
          select: { targetF03Quota: true, f03CalculationMethod: true }
        })
      : null
    const targetQuota = period?.targetF03Quota || 30
    const method = period?.f03CalculationMethod || 'PROPORTIONAL'

    const { finalIppScore } = calculateEffectiveF03AndIpp({
      f02Percentage: calcResult.totalPercentage,
      f03RawPercentage: evaluation.f03Percentage || 0,
      f03Count: evaluation.f03Count || 0,
      targetQuota,
      method
    })

    const updatedForms: Partial<Record<PekpppFormCode, MenpanFormBindingInfo>> = {
      ...storedForms
    }

    if (pulledF02Count > 0 && updatedForms.F02) {
      updatedForms.F02 = {
        ...updatedForms.F02,
        syncStatus: 'SYNCED',
        lastAnswersCount: pulledF02Count,
        lastMessage: `Berhasil ditarik ke lokal: ${pulledF02Count} indikator`
      }
    }

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        percentage: calcResult.totalPercentage,
        scale5: calcResult.scale5,
        totalScore: calcResult.totalPercentage,
        finalIppScore,
        syncLogs: {
          ...existingLogs,
          lastPulledAt: new Date().toISOString(),
          lastSyncDirection: 'PULL',
          lastSyncActionAt: new Date().toISOString(),
          lastPullSummary: {
            pulledAt: new Date().toISOString(),
            pulledF02Count,
            pulledF01Count,
            scale5: calcResult.scale5,
            percentage: calcResult.totalPercentage,
            finalIppScore
          },
          forms: updatedForms
        }
      }
    })

    const summaryParts: string[] = []
    if (pulledF02Count > 0) summaryParts.push(`${pulledF02Count} butir skor F-02`)
    if (pulledF01Count > 0) summaryParts.push(`${pulledF01Count} isian F-01`)

    return {
      success: true,
      message: `Berhasil menarik data MenPAN-RB (${summaryParts.join(' & ')}). Skor lokal berhasil diperbarui dan direkalkulasi: Indeks ${calcResult.scale5.toFixed(2)} (${calcResult.totalPercentage.toFixed(2)}%), IPP ${finalIppScore.toFixed(2)}.`,
      pulledForms: {
        ...(pulledF02Count > 0 && f02Uuid ? { F02: { count: pulledF02Count, uuid: f02Uuid } } : {}),
        ...(pulledF01Count > 0 && f01Uuid ? { F01: { count: pulledF01Count, uuid: f01Uuid } } : {})
      },
      newScore: calcResult.totalPercentage,
      newScale5: calcResult.scale5,
      newIpp: finalIppScore
    }
  }

  // ===========================================================================
  // ENDPOINT BERITA ACARA PENILAIAN (BAP) — LEVEL EVALUATION GROUP
  // ===========================================================================

  /**
   * PULL: Mengambil seluruh daftar Evaluation Group per tahun dari endpoint resmi GET /evaluation-groups.
   */
  static async getRemoteEvaluationGroups(
    year?: number
  ): Promise<{
    success: boolean
    data?: MenpanEvaluationGroupItem[]
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
      const allGroups: MenpanEvaluationGroupItem[] = []
      let currentPage = 1
      let lastPage = 1
      const maxPages = 20

      do {
        const queryParams = new URLSearchParams()
        if (year) queryParams.set('year', String(year))
        queryParams.set('per_page', '100')
        queryParams.set('page', String(currentPage))

        const response = await fetch(`${cleanBase}/evaluation-groups?${queryParams.toString()}`, {
          method: 'GET',
          headers: this.getHeaders(config.apiKey),
          signal: AbortSignal.timeout(15000)
        })

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}))
          return {
            success: false,
            message: `Gagal memuat Evaluation Groups (HTTP ${response.status}): ${errJson.message || response.statusText}`
          }
        }

        const json = await response.json()
        const pageItems: MenpanEvaluationGroupItem[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : []
        allGroups.push(...pageItems)

        lastPage = Number(json.meta?.last_page || 1)
        currentPage++
      } while (currentPage <= lastPage && currentPage <= maxPages)

      return {
        success: true,
        data: allGroups
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat mengambil Evaluation Groups.'
      }
    }
  }

  /**
   * Resolusi otomatis `evaluation_group_uuid` untuk lokus evaluasi lokal.
   * Menyimpan hasilnya ke dalam `Evaluation.syncLogs.evaluationGroupUuid` agar panggilan berikutnya instan.
   */
  static async resolveEvaluationGroupUuid(evaluationId: string): Promise<{
    success: boolean
    groupUuid?: string
    groupName?: string
    message?: string
  }> {
    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: { unit: true }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan di database lokal.' }
    }

    const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    if (syncLogs.evaluationGroupUuid && typeof syncLogs.evaluationGroupUuid === 'string') {
      return {
        success: true,
        groupUuid: syncLogs.evaluationGroupUuid,
        groupName: evaluation.menpanEvaluationName || evaluation.unit.name
      }
    }

    const groupsRes = await this.getRemoteEvaluationGroups(evaluation.year)
    if (!groupsRes.success || !groupsRes.data || groupsRes.data.length === 0) {
      return {
        success: false,
        message: groupsRes.message || `Daftar Evaluation Group Tahun ${evaluation.year} tidak ditemukan di portal MenPAN-RB.`
      }
    }

    const normalizeName = (s?: string | null) =>
      (s || '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const targetMenpanName = normalizeName(evaluation.menpanEvaluationName)
    const targetUnitName = normalizeName(evaluation.unit.name)

    let matchedGroup = groupsRes.data.find((g) => {
      const gName = normalizeName(g.name)
      return (targetMenpanName && gName === targetMenpanName) || (targetUnitName && gName === targetUnitName)
    })

    if (!matchedGroup) {
      matchedGroup = groupsRes.data.find((g) => {
        const gName = normalizeName(g.name)
        return (
          (targetMenpanName && (gName.includes(targetMenpanName) || targetMenpanName.includes(gName))) ||
          (targetUnitName && (gName.includes(targetUnitName) || targetUnitName.includes(gName)))
        )
      })
    }

    if (!matchedGroup) {
      return {
        success: false,
        message: `Tidak ditemukan Evaluation Group yang cocok untuk "${evaluation.menpanEvaluationName || evaluation.unit.name}" di portal MenPAN-RB.`
      }
    }

    await db.evaluation.update({
      where: { id: evaluationId },
      data: {
        syncLogs: {
          ...syncLogs,
          evaluationGroupUuid: matchedGroup.uuid,
          evaluationGroupId: matchedGroup.id
        }
      }
    })

    return {
      success: true,
      groupUuid: matchedGroup.uuid,
      groupName: matchedGroup.name
    }
  }

  /**
   * GET /evaluation-groups/{uuid}/bap — Mengambil data Berita Acara Penilaian (BAP) dari MenPAN-RB.
   */
  static async getRemoteBap(groupUuid: string): Promise<{
    success: boolean
    data?: MenpanBapData
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(12000)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `Gagal memuat data BAP MenPAN-RB (HTTP ${response.status}): ${errJson.message || response.statusText}`
        }
      }

      const json = await response.json()
      return {
        success: true,
        data: json.data || json
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat memuat BAP.'
      }
    }
  }

  /**
   * PUT /evaluation-groups/{uuid}/bap — Menyimpan BAP (header name, printed_at + pengamatan 7 sections: kondisi, catatan, rekomendasi).
   */
  static async saveRemoteBap(
    groupUuid: string,
    payload: {
      name: string
      printed_at: string
      sections: Array<{
        section_id: number
        kondisi: string
        catatan: string
        rekomendasi: string
      }>
    }
  ): Promise<{
    success: boolean
    data?: any
    message: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap`, {
        method: 'PUT',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      })

      const json = await response.json().catch(() => ({}))

      if (response.ok) {
        return {
          success: true,
          data: json.data || json,
          message: json.message || 'Data BAP dan Catatan Rekomendasi Aspek berhasil disimpan ke portal MenPAN-RB!'
        }
      } else {
        const errorsObj = json.errors || {}
        const errList: string[] = []
        for (const [k, msgs] of Object.entries(errorsObj)) {
          if (Array.isArray(msgs)) errList.push(`${k}: ${msgs.join(', ')}`)
        }
        return {
          success: false,
          message:
            errList.length > 0
              ? `Validasi BAP Ditolak: ${errList.join(' | ')}`
              : json.message || `Gagal menyimpan BAP (HTTP ${response.status}).`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat menyimpan BAP.'
      }
    }
  }

  /**
   * GET /evaluation-groups/{uuid}/bap/signing-links — Mengambil tautan tanda tangan digital BAP (evaluator_url & knower_url).
   */
  static async getRemoteBapSigningLinks(groupUuid: string): Promise<{
    success: boolean
    data?: MenpanBapSigningLinks
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap/signing-links`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `Gagal memuat tautan tanda tangan BAP (HTTP ${response.status}): ${errJson.message || response.statusText}`
        }
      }

      const json = await response.json()
      return {
        success: true,
        data: json.data || json
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat memuat tautan tanda tangan.'
      }
    }
  }

  /**
   * POST /evaluation-groups/{uuid}/bap/signers — Menambahkan Penandatangan BAP (role: 'evaluator' | 'mengetahui').
   */
  static async addRemoteBapSigner(
    groupUuid: string,
    signer: {
      role: 'evaluator' | 'mengetahui'
      name: string
      position?: string
      nip?: string
    }
  ): Promise<{
    success: boolean
    data?: any
    message: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap/signers`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({
          role: signer.role,
          name: signer.name.trim(),
          position: (signer.position || '-').trim(),
          nip: (signer.nip || '-').trim()
        }),
        signal: AbortSignal.timeout(12000)
      })

      const json = await response.json().catch(() => ({}))
      if (response.ok) {
        return {
          success: true,
          data: json.data || json,
          message: `Penandatangan (${signer.role === 'evaluator' ? 'Tim Evaluator' : 'Pihak Lokus / Mengetahui'}) berhasil ditambahkan ke BAP MenPAN-RB!`
        }
      } else {
        const errorsObj = json.errors || {}
        const errList: string[] = []
        for (const [k, msgs] of Object.entries(errorsObj)) {
          if (Array.isArray(msgs)) errList.push(`${k}: ${msgs.join(', ')}`)
        }
        return {
          success: false,
          message:
            errList.length > 0
              ? `Validasi Penandatangan Ditolak: ${errList.join(' | ')}`
              : json.message || `Gagal menambahkan penandatangan (HTTP ${response.status}).`
        }
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat menambahkan penandatangan.'
      }
    }
  }

  /**
   * GET /evaluation-groups/{uuid}/bap/pdf — Mengunduh biner PDF BAP resmi yang di-generate oleh server MenPAN-RB.
   */
  static async downloadRemoteBapPdf(groupUuid: string): Promise<{
    success: boolean
    buffer?: ArrayBuffer
    contentType?: string
    message?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')
      const response = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
          Accept: 'application/pdf, application/json'
        },
        signal: AbortSignal.timeout(25000)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errJson.message || `Gagal mengunduh PDF BAP dari MenPAN-RB (HTTP ${response.status}).`
        }
      }

      const buffer = await response.arrayBuffer()
      return {
        success: true,
        buffer,
        contentType: response.headers.get('content-type') || 'application/pdf'
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menghubungi server MenPAN saat mengunduh PDF BAP.'
      }
    }
  }

  /**
   * POST /evaluation-groups/{uuid}/bap/file/presign & PUT ke S3 & POST /evaluation-groups/{uuid}/bap/file/confirm
   * Mengunggah berkas PDF BAP yang sudah ditandatangani ke portal MenPAN-RB.
   */
  static async uploadRemoteBapPdf(
    groupUuid: string,
    pdfBuffer: ArrayBuffer | Uint8Array
  ): Promise<{
    success: boolean
    message: string
    objectKey?: string
  }> {
    const config = await getMenpanApiConfig()
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, message: 'Kredensial API MenPAN-RB belum dikonfigurasi.' }
    }

    try {
      const cleanBase = config.baseUrl.replace(/\/+$/, '')

      // 1. Minta Presigned PUT URL
      const presignRes = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap/file/presign`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(12000)
      })

      const presignJson = await presignRes.json().catch(() => ({}))
      if (!presignRes.ok || !presignJson.data?.put_url) {
        return {
          success: false,
          message: presignJson.message || `Gagal mendapatkan presigned URL BAP (HTTP ${presignRes.status}).`
        }
      }

      const putUrl: string = presignJson.data.put_url
      const objectKey: string = presignJson.data.object_key

      // 2. Unggah binary PDF menggunakan HTTP PUT ke put_url
      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: pdfBuffer as any,
        signal: AbortSignal.timeout(30000)
      })

      if (!putRes.ok) {
        return {
          success: false,
          message: `Gagal mengunggah berkas PDF ke penyimpanan MenPAN-RB (HTTP ${putRes.status}).`
        }
      }

      // 3. Konfirmasi Berkas BAP Terunggah
      const confirmRes = await fetch(`${cleanBase}/evaluation-groups/${groupUuid}/bap/file/confirm`, {
        method: 'POST',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify({ object_key: objectKey }),
        signal: AbortSignal.timeout(12000)
      })

      const confirmJson = await confirmRes.json().catch(() => ({}))
      if (!confirmRes.ok) {
        return {
          success: false,
          message: confirmJson.message || `Gagal mengonfirmasi berkas BAP (HTTP ${confirmRes.status}).`
        }
      }

      return {
        success: true,
        objectKey,
        message: confirmJson.message || 'Berkas PDF BAP berhasil diunggah dan dikonfirmasi di portal MenPAN-RB!'
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal mengunggah berkas PDF BAP ke server MenPAN-RB.'
      }
    }
  }

  /**
   * Membangun 7 section BAP MenPAN-RB (`section_id: 8..14`) secara otomatis dari:
   * - Skor F-02 lokal & teks opsi pada kamus pertanyaan F-02 (`kondisi`)
   * - Catatan Rekomendasi per Aspek (`Evaluation.aspectNotes`) & catatan indikator (`catatan` & `rekomendasi`)
   */
  static buildBapSectionsFromLocal(
    evaluation: any,
    f02Questions: any[] = [],
    existingRemoteSections: MenpanBapSectionItem[] = []
  ): MenpanBapSectionItem[] {
    const aspectNotes = ((evaluation.aspectNotes as any) || {}) as Record<string, any>
    const scores: any[] = evaluation.scores || []

    const stripHtml = (html?: string | null) =>
      (html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    return MENPAN_BAP_SECTION_CONFIG.map((cfg) => {
      const existingSec = existingRemoteSections.find((s) => Number(s.section_id) === cfg.section_id)

      // 1. Cari semua skor indikator dalam rentang aspek ini
      const secScores = scores.filter((s) => {
        const num = Number(s.indicator?.indicatorNumber || 0)
        return num >= cfg.indicatorStart && num <= cfg.indicatorEnd
      })

      // 2. Bangun teks Kondisi dari opsi F02 yang sesuai dengan skor evaluator
      const kondisiParts: string[] = []
      for (const s of secScores) {
        const indNum = Number(s.indicator?.indicatorNumber || 0)
        const roundedScore = Math.max(0, Math.min(5, Math.round(Number(s.score ?? 0))))
        const remoteQ = f02Questions[indNum - 1]
        if (remoteQ && Array.isArray(remoteQ.options)) {
          const matchedOpt = remoteQ.options.find(
            (opt: any) => Math.round(Number(opt.bobot)) === roundedScore
          )
          if (matchedOpt?.text) {
            kondisiParts.push(String(matchedOpt.text).trim())
            continue
          }
        }
        if (s.score !== null && s.score !== undefined) {
          kondisiParts.push(`Indikator #${indNum}: Skala ${roundedScore}`)
        }
      }

      const generatedKondisi =
        kondisiParts.length > 0
          ? kondisiParts.join(', ')
          : existingSec?.kondisi || ''

      // 3. Ambil Catatan Rekomendasi Aspek dari Evaluation.aspectNotes (Mendukung Format Baru 3 Kolom & Format String Lama)
      const localAspectData =
        aspectNotes[cfg.dbCode] ||
        aspectNotes[cfg.romanCode] ||
        aspectNotes[normalizeAspectCode(cfg.dbCode)] ||
        aspectNotes[getDbAspectCode(cfg.romanCode)] ||
        null

      let localKondisi = ''
      let localCatatan = ''
      let localRekomendasi = ''

      if (typeof localAspectData === 'string') {
        localCatatan = localAspectData.trim()
        localRekomendasi = localAspectData.trim()
      } else if (localAspectData && typeof localAspectData === 'object') {
        localKondisi = String(localAspectData.kondisi || '').trim()
        localCatatan = String(localAspectData.catatan || '').trim()
        localRekomendasi = String(localAspectData.rekomendasi || '').trim()
      }

      // Fallback ke gabungan catatan per indikator jika catatan kosong
      const indicatorNotesFallback = secScores
        .filter((s) => s.notes && String(s.notes).trim() !== '')
        .map((s) => `[#${s.indicator?.indicatorNumber}] ${String(s.notes).trim()}`)
        .join(' | ')

      const finalKondisi =
        localKondisi ||
        existingSec?.kondisi ||
        generatedKondisi ||
        ''

      const finalCatatan =
        localCatatan ||
        existingSec?.catatan ||
        indicatorNotesFallback ||
        ''

      const finalRekomendasi =
        localRekomendasi ||
        existingSec?.rekomendasi ||
        localCatatan ||
        ''

      return {
        section_id: cfg.section_id,
        name: cfg.name,
        kondisi: finalKondisi,
        catatan: finalCatatan,
        rekomendasi: finalRekomendasi
      }
    })
  }

  /**
   * Menyinkronkan BAP dan Catatan Rekomendasi Aspek (`Evaluation.aspectNotes`) ke endpoint `PUT /evaluation-groups/{uuid}/bap`.
   * Dipanggil otomatis saat Push F02 / ALL maupun saat tombol "Sync BAP ke MenPAN-RB" diklik di halaman Berita Acara.
   */
  static async syncEvaluationBapToMenpan(
    evaluationId: string,
    customPayload?: {
      name?: string
      printed_at?: string
      sections?: Array<{
        section_id: number
        kondisi: string
        catatan: string
        rekomendasi: string
      }>
    }
  ): Promise<{
    success: boolean
    message: string
    groupUuid?: string
    bapData?: any
  }> {
    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        unit: true,
        scores: {
          include: {
            indicator: {
              include: { aspect: true }
            }
          },
          orderBy: { indicator: { indicatorNumber: 'asc' } }
        }
      }
    })

    if (!evaluation) {
      return { success: false, message: 'Evaluasi tidak ditemukan di database lokal.' }
    }

    const groupRes = await this.resolveEvaluationGroupUuid(evaluationId)
    if (!groupRes.success || !groupRes.groupUuid) {
      return {
        success: false,
        message: groupRes.message || 'Gagal menemukan UUID Evaluation Group untuk lokus ini.'
      }
    }

    const groupUuid = groupRes.groupUuid
    const syncLogs = ((evaluation.syncLogs as any) || {}) as Record<string, any>
    const f02Binding = syncLogs.forms?.F02 as MenpanFormBindingInfo | undefined

    let f02Questions: any[] = Array.isArray(f02Binding?.questionMap) ? f02Binding!.questionMap! : []
    if (f02Questions.length === 0 && f02Binding?.uuid) {
      const qRes = await this.getRemoteQuestions(f02Binding.uuid)
      if (qRes.success && qRes.data) {
        f02Questions = qRes.data
      }
    }

    // Ambil BAP eksisting dari MenPAN-RB sebagai referensi dasar
    const currentBapRes = await this.getRemoteBap(groupUuid)
    const currentBap = currentBapRes.data

    const defaultSections = this.buildBapSectionsFromLocal(
      evaluation,
      f02Questions,
      currentBap?.sections || []
    )

    const sectionsToSave = (customPayload?.sections || defaultSections).map((s) => ({
      section_id: Number(s.section_id),
      kondisi: String(s.kondisi ?? ''),
      catatan: String(s.catatan ?? ''),
      rekomendasi: String(s.rekomendasi ?? '')
    }))

    const todayStr = new Date().toISOString().slice(0, 10)
    const nameToSave = (
      customPayload?.name ||
      currentBap?.name ||
      evaluation.menpanEvaluationName ||
      evaluation.unit.name
    ).trim()
    const printedAtToSave = (
      customPayload?.printed_at ||
      currentBap?.printed_at ||
      todayStr
    ).slice(0, 10)

    const saveRes = await this.saveRemoteBap(groupUuid, {
      name: nameToSave,
      printed_at: printedAtToSave,
      sections: sectionsToSave
    })

    if (saveRes.success) {
      // Sinkronkan juga catatan/rekomendasi kembali ke Evaluation.aspectNotes lokal agar Evaluator & Lokus tetap 100% sinkron
      const currentAspectNotes = ((evaluation.aspectNotes as any) || {}) as Record<string, string>
      const updatedAspectNotes: Record<string, string> = { ...currentAspectNotes }

      for (const sec of sectionsToSave) {
        const cfg = MENPAN_BAP_SECTION_CONFIG.find((c) => c.section_id === sec.section_id)
        if (!cfg) continue
        const cleanText = (sec.rekomendasi || sec.catatan || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (cleanText) {
          updatedAspectNotes[cfg.dbCode] = cleanText
          updatedAspectNotes[cfg.romanCode] = cleanText
        }
      }

      const freshLogs = ((await db.evaluation.findUnique({
        where: { id: evaluationId },
        select: { syncLogs: true }
      }))?.syncLogs as any) || syncLogs

      await db.evaluation.update({
        where: { id: evaluationId },
        data: {
          aspectNotes: updatedAspectNotes,
          syncLogs: {
            ...freshLogs,
            evaluationGroupUuid: groupUuid,
            bap: {
              syncedAt: new Date().toISOString(),
              name: nameToSave,
              printed_at: printedAtToSave
            }
          }
        }
      })
    }

    return {
      success: saveRes.success,
      message: saveRes.message,
      groupUuid,
      bapData: saveRes.data
    }
  }
}
