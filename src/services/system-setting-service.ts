import { db } from './db'

export interface MenpanApiConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  apiKey: string
}

/**
 * Mengambil konfigurasi kredensial integrasi API MenPAN-RB.
 * Membaca nilai dari tabel database `SystemSetting` dengan fallback ke environment variables.
 * @returns Objek konfigurasi API MenPAN-RB (`baseUrl`, `clientId`, `clientSecret`, `apiKey`).
 */
export async function getMenpanApiConfig(): Promise<MenpanApiConfig> {
  try {
    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      const settings = await (db as any).systemSetting.findMany({
        where: {
          key: {
            in: ['MENPAN_API_BASE_URL', 'MENPAN_CLIENT_ID', 'MENPAN_CLIENT_SECRET', 'MENPAN_API_KEY']
          }
        }
      })

      const map = new Map<string, string>(settings.map((s: any) => [s.key, s.value]))

      return {
        baseUrl: map.get('MENPAN_API_BASE_URL') || process.env.MENPAN_API_BASE_URL || 'https://evaluasi.menpan.go.id/api/v1',
        clientId: map.get('MENPAN_CLIENT_ID') || process.env.MENPAN_CLIENT_ID || '',
        clientSecret: map.get('MENPAN_CLIENT_SECRET') || process.env.MENPAN_CLIENT_SECRET || '',
        apiKey: map.get('MENPAN_API_KEY') || process.env.MENPAN_API_KEY || ''
      }
    }
  } catch (err) {
    console.error('Error fetching MenPAN API settings:', err)
  }

  return {
    baseUrl: process.env.MENPAN_API_BASE_URL || 'https://evaluasi.menpan.go.id/api/v1',
    clientId: process.env.MENPAN_CLIENT_ID || '',
    clientSecret: process.env.MENPAN_CLIENT_SECRET || '',
    apiKey: process.env.MENPAN_API_KEY || ''
  }
}

/**
 * Menyimpan atau memperbarui pengaturan kredensial API MenPAN-RB ke tabel database `SystemSetting`.
 * @param config Kredensial baru yang ingin disimpan.
 * @returns Status keberhasilan `{ success: true }`.
 */
export async function saveMenpanApiConfig(config: Partial<MenpanApiConfig>) {
  const entries: { key: string; value: string }[] = []

  if (config.baseUrl !== undefined) entries.push({ key: 'MENPAN_API_BASE_URL', value: config.baseUrl.trim() })
  if (config.clientId !== undefined) entries.push({ key: 'MENPAN_CLIENT_ID', value: config.clientId.trim() })
  if (config.clientSecret !== undefined) entries.push({ key: 'MENPAN_CLIENT_SECRET', value: config.clientSecret.trim() })
  if (config.apiKey !== undefined) entries.push({ key: 'MENPAN_API_KEY', value: config.apiKey.trim() })

  if (db && 'systemSetting' in db && (db as any).systemSetting) {
    for (const entry of entries) {
      await (db as any).systemSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value }
      })
    }
  }

  return { success: true }
}

// =========================================================================
// KONFIGURASI WHATSAPP GATEWAY (FONNTE)
// =========================================================================
export interface FonnteWaConfig {
  enabled: boolean
  apiToken: string
  adminPhone: string
  countryCode: string
}

/**
 * Mengambil konfigurasi WhatsApp Gateway Fonnte dari database SystemSetting
 * dengan fallback ke Environment Variables.
 */
export async function getFonnteWaConfig(): Promise<FonnteWaConfig> {
  try {
    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      const settings = await (db as any).systemSetting.findMany({
        where: {
          key: {
            in: ['FONNTE_ENABLED', 'FONNTE_API_TOKEN', 'FONNTE_ADMIN_PHONE', 'FONNTE_COUNTRY_CODE']
          }
        }
      })

      const map = new Map<string, string>(settings.map((s: any) => [s.key, s.value]))

      return {
        enabled: (map.get('FONNTE_ENABLED') ?? process.env.FONNTE_ENABLED ?? 'false') === 'true',
        apiToken: map.get('FONNTE_API_TOKEN') || process.env.FONNTE_API_TOKEN || '',
        adminPhone: map.get('FONNTE_ADMIN_PHONE') || process.env.FONNTE_ADMIN_PHONE || '',
        countryCode: map.get('FONNTE_COUNTRY_CODE') || process.env.FONNTE_COUNTRY_CODE || '62'
      }
    }
  } catch (err) {
    console.error('Error fetching Fonnte settings:', err)
  }

  return {
    enabled: (process.env.FONNTE_ENABLED || 'false') === 'true',
    apiToken: process.env.FONNTE_API_TOKEN || '',
    adminPhone: process.env.FONNTE_ADMIN_PHONE || '',
    countryCode: process.env.FONNTE_COUNTRY_CODE || '62'
  }
}

/**
 * Menyimpan konfigurasi WhatsApp Gateway Fonnte ke database SystemSetting.
 */
export async function saveFonnteWaConfig(config: Partial<FonnteWaConfig>) {
  const entries: { key: string; value: string }[] = []

  if (config.enabled !== undefined) entries.push({ key: 'FONNTE_ENABLED', value: config.enabled ? 'true' : 'false' })
  if (config.apiToken !== undefined) entries.push({ key: 'FONNTE_API_TOKEN', value: config.apiToken.trim() })
  if (config.adminPhone !== undefined) entries.push({ key: 'FONNTE_ADMIN_PHONE', value: config.adminPhone.trim() })
  if (config.countryCode !== undefined) entries.push({ key: 'FONNTE_COUNTRY_CODE', value: config.countryCode.trim() })

  if (db && 'systemSetting' in db && (db as any).systemSetting) {
    for (const entry of entries) {
      await (db as any).systemSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value }
      })
    }
  }

  return { success: true }
}

// =========================================================================
// KONFIGURASI AI PRE-EVALUATOR & KONTEKS STANDAR EMAS (6 ASPEK + 1)
// =========================================================================

export interface AiAspectContextItem {
  title: string
  defaultDirective: string
  benchmarkKeywords: string[]
}

export const DEFAULT_ASPECT_CONTEXTS: Record<string, AiAspectContextItem> = {
  I: {
    title: 'Aspek I: Kebijakan Pelayanan',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK I (KEBIJAKAN PELAYANAN):
1. INDIKATOR #1 (Ketersediaan Standar Pelayanan sesuai Ketentuan Peraturan Perundang-undangan):
   - LINGKUP PENILAIAN HANYA MENCAKUP 4 HAL EKSKLUSIF:
     (1) Keberadaan SP yang memenuhi 14 Komponen Lengkap sesuai UU No. 25/2009 (6 Service Delivery + 8 Manufacturing).
     (2) Legalitas penetapan: telah ditetapkan secara sah melalui SK Kepala Perangkat Daerah / Kepala Daerah.
     (3) Pelibatan masyarakat: proses penyusunan/perubahan melibatkan masyarakat melalui Berita Acara FKP.
     (4) Monitoring & Evaluasi (Monev): telah dilakukan monev berkala / peninjauan ulang / pembaharuan standar pelayanan.
   - KRITERIA TANGGA SKALA INDIKATOR #1 (PERMENPAN-RB NO. 29/2022):
     * Skala 0: Tidak tersedia Standar Pelayanan.
     * Skala 1: Tersedia SP namun TIDAK memenuhi 14 komponen.
     * Skala 2: Tersedia SP yang memenuhi 14 komponen.
     * Skala 3: Tersedia SP 14 komponen DAN dilakukan penetapan (SK resmi).
     * Skala 4: Tersedia SP 14 komponen, melibatkan masyarakat (FKP), DAN dilakukan penetapan.
     * Skala 5: Tersedia SP 14 komponen, melibatkan masyarakat (FKP), dilakukan penetapan, DAN dilakukan MONEV / peninjauan ulang berkala (pembaharuan SP).
    - ATURAN LARANGAN KERAS PADA INDIKATOR #1:
      DILARANG menilai aksesibilitas fisik (seperti ketersediaan buku/banner cetak di ruang pelayanan) atau publikasi digital pada Indikator #1! Aksesibilitas dan publikasi dokumen dinilai secara terpisah pada Indikator #3 (Publikasi Service Delivery) dan Indikator #5 (Maklumat).
      Jika bukti pada Indikator #1 telah mencapai Skala 4, maka satu-satunya faktor yang membuat bukti kurang untuk Skala 5 adalah BELUM DILAMPIRKANNYA DOKUMEN LAPORAN MONEV / PENINJAUAN ULANG BERKALA / PEMBAHARUAN STANDAR PELAYANAN.
2. INDIKATOR #2 (Pelibatan Masyarakat dalam Penyusunan SP):
   - Wajib melampirkan Berita Acara FKP tahun berjalan, daftar hadir perwakilan minimal 3 unsur masyarakat (akademisi/ahli, LSM/ormas/media massa, dunia usaha/tokoh masyarakat), notulensi masukan, dan foto kegiatan.
3. INDIKATOR #3 (Publikasi Komponen Service Delivery):
   - Di sinilah aksesibilitas dinilai: publikasi 6 komponen service delivery melalui media luring (banner/buku/display ruang layanan) dan daring (Website resmi & SIPPN KemenPAN-RB).
4. INDIKATOR #4 (Peninjauan Ulang secara Berkala atas Standar Pelayanan):
   - Menilai pembaharuan/kaji ulang berkala SP (1-2 tahun sekali) dibuktikan dengan Berita Acara FKP kaji ulang atau SK SP perubahan terbaru untuk seluruh produk layanan.
5. INDIKATOR #5 (Pemenuhan Siklus Maklumat Pelayanan):
   - SK Penetapan Maklumat, foto fisik penempatan maklumat di ruang layanan utama, publikasi digital, dan ketentuan kompensasi jika layanan tidak sesuai maklumat.
6. INDIKATOR #6 (Pelaksanaan SKM Sesuai PermenPAN-RB No. 14/2017):
   - Laporan pelaksanaan SKM yang mencakup 9 unsur pelayanan.
7. INDIKATOR #7 (Jumlah Media Publikasi Hasil SKM):
   - Menilai jumlah kanal media publikasi hasil nilai SKM kepada masyarakat (banner lobi, leaflet, website, media sosial). Jika HANYA mengunggah PDF laporan tanpa foto publikasi, berikan nilai 0.
8. INDIKATOR #8 & #9 (Rencana Tindak Lanjut & Kecepatan Tindak Lanjut Hasil SKM):
   - Laporan Rencana Tindak Lanjut (RTL) rekomendasi SKM, persentase realisasi perbaikan, dan kecepatan penyelesaian (< 3 atau < 6 bulan).
9. PRINSIP ANTI-HALUSINASI & KETIDAKRELEVANAN BERKAS:
   - Memaksimalkan pengisian BUKAN berarti mengarang atau berasumsi.
   - Jika dokumen yang diunggah TIDAK RELEVAN (salah berkas), WAJIB berikan catatan tegas pada ulasan bahwa berkas TIDAK RELEVAN dan berikan skor 0, jangan membuka ruang halusinasi!`,
    benchmarkKeywords: ['14 komponen', 'service delivery', 'manufacturing', 'sk penetapan', 'berita acara fkp', 'monev pembaharuan sp', 'maklumat pelayanan', 'laporan skm', 'matriks rtl', 'publikasi skm']
  },
  II: {
    title: 'Aspek II: Profesionalisme SDM',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK II (PROFESIONALISME SDM):
1. Standar Penampilan & Atribut Aparatur Pelayanan:
   - Petugas loket/frontliner wajib mengenakan seragam dinas resmi pemerintah daerah (Senin-Rabu PDH Khaki/Putih, Kamis Batik/Etnik Daerah, Jumat Batik/Olahraga). Pakaian kaos/celana jeans/sandal dilarang.
   - Wajib mengenakan tanda pengenal resmi (ID Card / Lanyard berlogo instansi) yang tergantung di dada dan terlihat jelas.
   - Wajib mengenakan pin nama dada (nametag) atau tanda jabatan.
2. Jam Pelayanan Khusus:
   - Wajib memiliki SK Jam Pelayanan yang memberikan kemudahan masyarakat (misal: pelayanan istirahat bergantian tanpa tutup loket, layanan sore/hari libur lembur).
3. Kode Etik & Budaya Pelayanan:
   - Wajib ada dokumen penetapan kode etik & kode perilaku pelaksana, maklumat budaya pelayanan 5S (Senyum, Sapa, Salam, Sopan, Santun).
4. Penilaian Kinerja & Penghargaan:
   - Terdapat sistem pemberian reward (pegawai teladan/penghargaan bulanan) dan punishment (teguran tertulis/sanksi pelanggaran SOP).`,
    benchmarkKeywords: ['seragam dinas', 'id card lanyard', 'pin nama nametag', 'sk jam pelayanan', 'kode etik perilaku', 'budaya 5s', 'reward punishment']
  },
  III: {
    title: 'Aspek III: Sarana & Prasarana',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK III (SARANA PRASARANA RAMAH RENTAN):
1. Aksesibilitas Fisik Ramah Kelompok Rentan (PermenPAN-RB No. 10 Tahun 2025):
   - Jalur landai (ramp) kursi roda: Memiliki kemiringan aman (< 8 derajat), lantai tidak licin, dan dilengkapi pegangan rambat (handrail) di kedua sisi.
   - Pintu masuk: Lebar minimal 90 cm tanpa anak tangga penghalang kursi roda.
   - Toilet Khusus Disabilitas: Memiliki pintu bukaan ke luar/geser, kloset duduk, pegangan rambat tangan (grab bar bentuk L/U di samping kloset), dan bel darurat (emergency button).
2. Fasilitas Prioritas di Area Tunggu:
   - Kursi prioritas disabilitas, lansia, dan ibu hamil yang diberi stiker/tanda penanda khusus berwarna kontras.
   - Loket layanan prioritas (meja lebih rendah untuk pengguna kursi roda).
   - Alat bantu gerak: Kursi roda dan tongkat bantu ketiak/kruk yang siap pakai di dekat pintu masuk.
3. Fasilitas Penunjang Khusus:
   - Ruang laktasi/menyusui yang tertutup, bersih, ber-AC/ventilasi, dengan wastafel dan sofa.
   - Ruang/area bermain anak ramah anak.
   - Jalur pemandu tuna netra (guiding block) di area luar hingga loket.`,
    benchmarkKeywords: ['ramp kursi roda handrail', 'toilet disabilitas grab bar', 'kursi prioritas stiker', 'loket khusus disabilitas', 'ruang laktasi menyusui', 'area bermain anak', 'guiding block']
  },
  IV: {
    title: 'Aspek IV: Sistem Informasi Pelayanan Publik (SIPP)',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK IV (SISTEM INFORMASI PELAYANAN PUBLIK):
1. Integrasi Portal Nasional SIPPN KemenPAN-RB:
   - Memiliki akun resmi SIPPN KemenPAN-RB yang aktif terdaftar.
   - Seluruh jenis produk pelayanan telah diinput profil dan standar pelayanannya ke portal SIPPN.
2. Portal Resmi Digital Instansi:
   - Website resmi perangkat daerah aktif (domain .go.id), memuat menu informasi publik, profil layanan, dan update berkala.
   - Media sosial resmi (Instagram / YouTube / Facebook) aktif mempublikasikan jam layanan, syarat, dan inovasi.
3. Sistem Antrean & Informasi Elektronik:
   - Mesin antrean elektronik atau display layar informasi alur layanan di ruang tunggu.
   - Tersedia kanal informasi non-elektronik (leaflet, booklet, standing banner) untuk masyarakat yang belum melek digital.`,
    benchmarkKeywords: ['portal sippn menpan', 'website resmi go.id', 'media sosial resmi', 'antrean elektronik', 'banner informasi leaflet']
  },
  V: {
    title: 'Aspek V: Konsultasi & Pengaduan',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK V (KONSULTASI DAN PENGADUAN):
1. Legalitas Pengelola Pengaduan:
   - Memiliki SK Tim / Pejabat Pengelola Pengaduan yang sah dari pimpinan instansi.
2. Kanal Pengaduan Multi-Platform:
   - Terhubung secara aktif dengan SP4N-LAPOR! nasional.
   - Memiliki kanal langsung daerah (WhatsApp Pengaduan, Kotak Saran/Aduan fisik, Meja Helpdesk khusus).
3. Administrasi & Prosedur Tindak Lanjut:
   - Tersedia Buku Register / Logbook Pengaduan (mencatat tanggal masuk, identitas pelapor, isi aduan, pejabat disposisi, dan tanggal penyelesaian).
   - Memiliki alur dan standar jangka waktu penyelesaian pengaduan (SLA).
   - Menyediakan sarana konsultasi khusus bagi masyarakat yang membutuhkan informasi perizinan/layanan.`,
    benchmarkKeywords: ['sk tim pengelola pengaduan', 'sp4n lapor aktif', 'whatsapp helpdesk pengaduan', 'buku register aduan', 'sop jangka waktu tindak lanjut']
  },
  VI: {
    title: 'Aspek VI: Inovasi Pelayanan Publik',
    defaultDirective: `KRITERIA STANDAR EMAS ASPEK VI (INOVASI PELAYANAN PUBLIK):
1. Dokumen Legalitas & Proposal:
   - Memiliki SK Penetapan Inovasi dari Kepala Daerah (Bupati/Walikota) atau Kepala Perangkat Daerah.
   - Dokumen Proposal Inovasi memuat: ringkasan, latar belakang masalah, gagasan kebaruan/keunikan, dan strategi pelaksanaan.
2. Kemanfaatan & Dampak Nyata:
   - Inovasi telah diimplementasikan minimal 1 tahun dan terbukti mempercepat waktu layanan, memangkas biaya, atau memperluas jangkauan layanan.
   - Dilengkapi bukti foto, video testimoni masyarakat penerima manfaat, atau infografis capaian.
3. Keberlanjutan Inovasi:
   - Terdapat dukungan Dokumen Pelaksanaan Anggaran (DPA) / anggaran rutin khusus dan tim pengelola demi menjamin inovasi tetap berjalan.`,
    benchmarkKeywords: ['sk penetapan inovasi', 'proposal inovasi kemanfaatan', 'dokumentasi video testimoni', 'dukungan dpa anggaran']
  }
}

export interface AiEvaluatorConfig {
  executionMode: 'BATCH' | 'INSTANT' | 'HEURISTIC_ONLY'
  model: 'gemini-3.6-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite'
  maxPdfPages: number
  maxUploadSizeMb: number
  aspectContexts: Record<string, string>
  usageStats: {
    totalCalls: number
    totalTokens: number
    promptTokens?: number
    candidatesTokens?: number
    estimatedCostIdr: number
  }
}

/**
 * Mengambil konfigurasi mesin evaluasi AI (Gemini).
 * Memuat mode eksekusi (BATCH/INSTANT/HEURISTIC_ONLY), model yang dipilih, batas halaman PDF,
 * direktif kriteria standar emas per aspek (I s/d VI), serta statistik penggunaan token/biaya.
 * @returns Konfigurasi lengkap `AiEvaluatorConfig`.
 */
export async function getAiEvaluatorConfig(): Promise<AiEvaluatorConfig> {
  const defaultStats = { totalCalls: 0, totalTokens: 0, estimatedCostIdr: 0 }

  const defaultContextsRecord: Record<string, string> = {
    I: DEFAULT_ASPECT_CONTEXTS.I.defaultDirective,
    II: DEFAULT_ASPECT_CONTEXTS.II.defaultDirective,
    III: DEFAULT_ASPECT_CONTEXTS.III.defaultDirective,
    IV: DEFAULT_ASPECT_CONTEXTS.IV.defaultDirective,
    V: DEFAULT_ASPECT_CONTEXTS.V.defaultDirective,
    VI: DEFAULT_ASPECT_CONTEXTS.VI.defaultDirective
  }

  try {
    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      const keys = [
        'AI_EXECUTION_MODE',
        'AI_MODEL',
        'AI_MAX_PDF_PAGES',
        'AI_MAX_UPLOAD_SIZE_MB',
        'AI_USAGE_STATS',
        'AI_CONTEXT_I',
        'AI_CONTEXT_II',
        'AI_CONTEXT_III',
        'AI_CONTEXT_IV',
        'AI_CONTEXT_V',
        'AI_CONTEXT_VI'
      ]

      const settings = await (db as any).systemSetting.findMany({
        where: { key: { in: keys } }
      })

      const map = new Map<string, string>(settings.map((s: any) => [s.key, s.value]))

      let usageStats = defaultStats
      try {
        if (map.get('AI_USAGE_STATS')) {
          usageStats = JSON.parse(map.get('AI_USAGE_STATS')!)
        }
      } catch {}

      let rawModel = map.get('AI_MODEL') || 'gemini-3.6-flash'
      if (rawModel.includes('2.0') || rawModel.includes('2.5') || rawModel.includes('1.5')) {
        rawModel = 'gemini-3.6-flash'
      }

      return {
        executionMode: (map.get('AI_EXECUTION_MODE') as any) || 'BATCH',
        model: (rawModel as any) || 'gemini-3.6-flash',
        maxPdfPages: Number(map.get('AI_MAX_PDF_PAGES')) || 15,
        maxUploadSizeMb: Number(map.get('AI_MAX_UPLOAD_SIZE_MB')) || 25,
        aspectContexts: {
          I: map.get('AI_CONTEXT_I') || defaultContextsRecord.I,
          II: map.get('AI_CONTEXT_II') || defaultContextsRecord.II,
          III: map.get('AI_CONTEXT_III') || defaultContextsRecord.III,
          IV: map.get('AI_CONTEXT_IV') || defaultContextsRecord.IV,
          V: map.get('AI_CONTEXT_V') || defaultContextsRecord.V,
          VI: map.get('AI_CONTEXT_VI') || defaultContextsRecord.VI
        },
        usageStats
      }
    }
  } catch (err) {
    console.error('Error fetching AI Evaluator config:', err)
  }

  return {
    executionMode: 'BATCH',
    model: 'gemini-3.6-flash',
    maxPdfPages: 15,
    maxUploadSizeMb: 25,
    aspectContexts: defaultContextsRecord,
    usageStats: defaultStats
  }
}

/**
 * Menyimpan pembaruan konfigurasi parameter AI Evaluator dan prompt standar emas ke database.
 * @param config Parameter pengaturan AI yang diperbarui.
 * @returns Status keberhasilan `{ success: true }`.
 */
export async function saveAiEvaluatorConfig(config: {
  executionMode?: 'BATCH' | 'INSTANT' | 'HEURISTIC_ONLY'
  model?: 'gemini-3.6-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite'
  maxPdfPages?: number
  maxUploadSizeMb?: number
  aspectContexts?: Record<string, string>
}) {
  const entries: { key: string; value: string }[] = []

  if (config.executionMode) entries.push({ key: 'AI_EXECUTION_MODE', value: config.executionMode })
  if (config.model) entries.push({ key: 'AI_MODEL', value: config.model })
  if (config.maxPdfPages !== undefined) entries.push({ key: 'AI_MAX_PDF_PAGES', value: String(config.maxPdfPages) })
  if (config.maxUploadSizeMb !== undefined) entries.push({ key: 'AI_MAX_UPLOAD_SIZE_MB', value: String(config.maxUploadSizeMb) })

  if (config.aspectContexts) {
    if (config.aspectContexts.I !== undefined) entries.push({ key: 'AI_CONTEXT_I', value: config.aspectContexts.I.trim() })
    if (config.aspectContexts.II !== undefined) entries.push({ key: 'AI_CONTEXT_II', value: config.aspectContexts.II.trim() })
    if (config.aspectContexts.III !== undefined) entries.push({ key: 'AI_CONTEXT_III', value: config.aspectContexts.III.trim() })
    if (config.aspectContexts.IV !== undefined) entries.push({ key: 'AI_CONTEXT_IV', value: config.aspectContexts.IV.trim() })
    if (config.aspectContexts.V !== undefined) entries.push({ key: 'AI_CONTEXT_V', value: config.aspectContexts.V.trim() })
    if (config.aspectContexts.VI !== undefined) entries.push({ key: 'AI_CONTEXT_VI', value: config.aspectContexts.VI.trim() })
  }

  if (db && 'systemSetting' in db && (db as any).systemSetting) {
    for (const entry of entries) {
      await (db as any).systemSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value }
      })
    }
  }

  return { success: true }
}

/**
 * Mencatat statistik penggunaan token riil dari `data.usageMetadata` respons Google AI Studio (Gemini API)
 * serta menghitung estimasi biaya riil dalam Rupiah berdasarkan model yang digunakan.
 * 
 * @param tokensCount Total token (dari usageMetadata.totalTokenCount atau fallback).
 * @param details Objek opsional berisi promptTokenCount, candidatesTokenCount, dan nama model.
 */
export async function trackAiUsage(
  tokensCount: number,
  details?: {
    promptTokens?: number
    candidatesTokens?: number
    model?: string
  }
) {
  try {
    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      const setting = await (db as any).systemSetting.findUnique({
        where: { key: 'AI_USAGE_STATS' }
      })

      let stats = {
        totalCalls: 0,
        totalTokens: 0,
        promptTokens: 0,
        candidatesTokens: 0,
        estimatedCostIdr: 0
      }

      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value)
          stats = { ...stats, ...parsed }
        } catch {}
      }

      const promptTokens = details?.promptTokens || Math.round(tokensCount * 0.75)
      const candidatesTokens = details?.candidatesTokens || Math.max(0, tokensCount - promptTokens)
      const model = details?.model || 'gemini-3.6-flash'

      stats.totalCalls += 1
      stats.totalTokens += tokensCount
      stats.promptTokens = (stats.promptTokens || 0) + promptTokens
      stats.candidatesTokens = (stats.candidatesTokens || 0) + candidatesTokens

      // Perhitungan Tarif Riil Google AI Studio (Kurs USD ~Rp 16.300):
      // - Flash Lite (e.g. gemini-3.1-flash-lite / gemini-2.0-flash-lite):
      //   Input: $0.075 / 1M token (~Rp 1.222 / 1M token)
      //   Output: $0.30 / 1M token (~Rp 4.890 / 1M token)
      // - Flash Standard (gemini-3.6-flash / gemini-flash-latest / 2.0-flash):
      //   Input: $0.10 / 1M token (~Rp 1.630 / 1M token)
      //   Output: $0.40 / 1M token (~Rp 6.520 / 1M token)
      const isLite = model.toLowerCase().includes('lite')
      const rateInputPerM = isLite ? 1222 : 1630
      const rateOutputPerM = isLite ? 4890 : 6520

      const incrementalCostIdr =
        (promptTokens / 1_000_000) * rateInputPerM +
        (candidatesTokens / 1_000_000) * rateOutputPerM

      stats.estimatedCostIdr = Math.round((stats.estimatedCostIdr || 0) + incrementalCostIdr)

      await (db as any).systemSetting.upsert({
        where: { key: 'AI_USAGE_STATS' },
        update: { value: JSON.stringify(stats) },
        create: { key: 'AI_USAGE_STATS', value: JSON.stringify(stats) }
      })
    }
  } catch (err) {
    console.warn('Failed to track AI usage with usageMetadata:', err)
  }
}

// -------------------------------------------------------------
// PANDUAN CONTOH BUKTI DUKUNG DINAMIS PER ASPEK (UPLOAD ADMIN)
// -------------------------------------------------------------
export interface DynamicSlotGuide {
  exampleImages?: string[]
  guidanceNote?: string
}

/**
 * Mengambil direktori gambar contoh bukti dukung visual dinamis yang diunggah oleh Administrator.
 * @returns Record pemetaan slot bukti ke daftar URL gambar contoh.
 */
export async function getDynamicAspectEvidenceGuides(): Promise<Record<string, DynamicSlotGuide>> {
  try {
    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      const setting = await (db as any).systemSetting.findUnique({
        where: { key: 'ASPECT_EVIDENCE_DYNAMIC_GUIDES' }
      })
      if (setting?.value) {
        return JSON.parse(setting.value)
      }
    }
  } catch (err) {
    console.error('Error fetching dynamic aspect evidence guides:', err)
  }
  return {}
}

/**
 * Menyimpan URL gambar contoh bukti dukung baru pada slot aspek tertentu.
 * @param aspectCode Kode aspek (e.g. 'I', 'II', 'III').
 * @param slotKey Kunci slot bukti dukung (e.g. 'rambu_disabilitas').
 * @param exampleImageUrl URL gambar contoh yang baru diunggah.
 * @returns `true` jika berhasil disimpan, `false` jika gagal.
 */
export async function saveDynamicAspectSlotExample(
  aspectCode: string,
  slotKey: string,
  exampleImageUrl: string
): Promise<boolean> {
  try {
    const current = await getDynamicAspectEvidenceGuides()
    const key = `${aspectCode}_${slotKey}`
    const existing = current[key]?.exampleImages ? [...current[key].exampleImages!] : []

    if (!existing.includes(exampleImageUrl)) {
      existing.unshift(exampleImageUrl)
    }

    current[key] = {
      ...current[key],
      exampleImages: existing
    }

    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      await (db as any).systemSetting.upsert({
        where: { key: 'ASPECT_EVIDENCE_DYNAMIC_GUIDES' },
        update: { value: JSON.stringify(current) },
        create: { key: 'ASPECT_EVIDENCE_DYNAMIC_GUIDES', value: JSON.stringify(current) }
      })
    }
    return true
  } catch (err) {
    console.error('Error saving dynamic aspect slot example:', err)
    return false
  }
}

/**
 * Menghapus URL gambar contoh bukti dukung dari slot aspek tertentu.
 * @param aspectCode Kode aspek (e.g. 'I', 'II', 'III').
 * @param slotKey Kunci slot bukti dukung.
 * @param exampleImageUrl URL gambar contoh yang ingin dihapus.
 * @returns `true` jika berhasil dihapus, `false` jika gagal.
 */
export async function deleteDynamicAspectSlotExample(
  aspectCode: string,
  slotKey: string,
  exampleImageUrl: string
): Promise<boolean> {
  try {
    const current = await getDynamicAspectEvidenceGuides()
    const key = `${aspectCode}_${slotKey}`
    const currentList = current[key]?.exampleImages ? [...current[key].exampleImages!] : []
    const updatedList = currentList.filter((url) => url !== exampleImageUrl)

    current[key] = {
      ...current[key],
      exampleImages: updatedList
    }

    if (db && 'systemSetting' in db && (db as any).systemSetting) {
      await (db as any).systemSetting.upsert({
        where: { key: 'ASPECT_EVIDENCE_DYNAMIC_GUIDES' },
        update: { value: JSON.stringify(current) },
        create: { key: 'ASPECT_EVIDENCE_DYNAMIC_GUIDES', value: JSON.stringify(current) }
      })
    }
    return true
  } catch (err) {
    console.error('Error deleting dynamic aspect slot example:', err)
    return false
  }
}

