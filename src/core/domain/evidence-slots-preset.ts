// src/core/domain/evidence-slots-preset.ts
// Definisi Master Slot Bukti Dukung Terarah (Mandatory & Additional) per Indikator/Aspek

export type AllowedDocumentType = 'HYBRID' | 'PDF_ONLY' | 'IMAGE_ONLY'

export interface AspectUploadRule {
  allowedDocumentType: AllowedDocumentType
  allowedExtensions: string[]
  maxTotalFiles: number
  maxPdfCount: number
  maxImageCount: number
  maxPdfSizeMb: number
  maxImageSizeMb: number
  allowExternalLinks: boolean
}

export interface AspectRulesConfig {
  defaultRule: AspectUploadRule
  aspects: Record<string, AspectUploadRule>
}

export const DEFAULT_GLOBAL_UPLOAD_RULE: AspectUploadRule = {
  allowedDocumentType: 'HYBRID',
  allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
  maxTotalFiles: 6,
  maxPdfCount: 4,
  maxImageCount: 6,
  maxPdfSizeMb: 20,
  maxImageSizeMb: 2,
  allowExternalLinks: true
}

export const DEFAULT_ASPECT_UPLOAD_RULES: Record<string, AspectUploadRule> = {
  I: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 6,
    maxPdfCount: 4,
    maxImageCount: 6,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 2,
    allowExternalLinks: true
  },
  II: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 6,
    maxPdfCount: 4,
    maxImageCount: 6,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 2,
    allowExternalLinks: true
  },
  III: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx'],
    maxTotalFiles: 10,
    maxPdfCount: 2,
    maxImageCount: 10,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 3,
    allowExternalLinks: true
  },
  IV: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 6,
    maxPdfCount: 4,
    maxImageCount: 6,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 2,
    allowExternalLinks: true
  },
  V: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 6,
    maxPdfCount: 4,
    maxImageCount: 6,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 2,
    allowExternalLinks: true
  },
  VI: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 8,
    maxPdfCount: 4,
    maxImageCount: 8,
    maxPdfSizeMb: 25,
    maxImageSizeMb: 3,
    allowExternalLinks: true
  },
  TAMBAHAN: {
    allowedDocumentType: 'HYBRID',
    allowedExtensions: ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp'],
    maxTotalFiles: 6,
    maxPdfCount: 4,
    maxImageCount: 6,
    maxPdfSizeMb: 20,
    maxImageSizeMb: 2,
    allowExternalLinks: true
  }
}

// =========================================================================
// ATURAN UNGGAH BUKTI DUKUNG SPESIFIK PER SLOT / INDIKATOR
// =========================================================================

export interface SlotUploadRule {
  allowedDocumentType: 'HYBRID' | 'PDF_ONLY' | 'IMAGE_ONLY'
  maxTotalFiles: number
  maxFileSizeMb?: number // legacy fallback
  maxPdfSizeMb: number   // Maksimal ukuran berkas PDF/Dokumen resmi (MB)
  maxImageSizeMb: number // Maksimal ukuran berkas Foto/Gambar (MB)
}

export const DEFAULT_SLOT_UPLOAD_RULES: Record<string, SlotUploadRule> = {
  // ASPEK I: KEBIJAKAN PELAYANAN (Q1 - Q9)
  sk_sp: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  ba_fkp: { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 3, maxFileSizeMb: 20 },
  publikasi_sp: { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 15, maxImageSizeMb: 3, maxFileSizeMb: 15 },
  maklumat_pelayanan: { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 10, maxImageSizeMb: 3, maxFileSizeMb: 10 },
  laporan_skm: { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 3, maxFileSizeMb: 20 },
  tindak_lanjut_skm: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },

  // ASPEK II: PROFESIONALISME SDM (Q10 - Q14)
  sk_jam_layanan: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  kode_etik_budaya: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  motivasi_kerja: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  reward_punishment: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  budaya_5s: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },

  // ASPEK III: SARANA & PRASARANA (Q15 - Q20)
  tempat_parkir: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  ruang_tunggu: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  toilet_pengguna: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  sarpras_kelompok_rentan: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 10, maxPdfSizeMb: 20, maxImageSizeMb: 3, maxFileSizeMb: 3 },
  sarpras_penunjang_k3: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  front_office_antrian: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },

  // ASPEK IV: SISTEM INFORMASI PELAYANAN PUBLIK (Q21 - Q24)
  akun_sippn: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  sistem_operasional: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  portal_website: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  log_pemutakhiran: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },

  // ASPEK V: KONSULTASI & PENGADUAN (Q25 - Q28)
  sk_sop_pengaduan: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },
  sarana_fisik_pengaduan: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  kanal_span_lapor: { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 },
  laporan_rekap_pengaduan: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },

  // ASPEK VI: INOVASI PELAYANAN PUBLIK (Q29 - Q30)
  proposal_sk_inovasi: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 25, maxImageSizeMb: 3, maxFileSizeMb: 25 },
  implementasi_inovasi: { allowedDocumentType: 'HYBRID', maxTotalFiles: 8, maxPdfSizeMb: 25, maxImageSizeMb: 3, maxFileSizeMb: 25 },
  dukungan_keberlanjutan: { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 },

  // ASPEK TAMBAHAN: (Q31)
  sistem_antrian_tambahan: { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 15, maxImageSizeMb: 3, maxFileSizeMb: 15 }
}

export function getDefaultRuleForSlot(slotKey: string, documentType?: string): SlotUploadRule {
  if (DEFAULT_SLOT_UPLOAD_RULES[slotKey]) {
    const preset = DEFAULT_SLOT_UPLOAD_RULES[slotKey]
    return {
      ...preset,
      maxPdfSizeMb: preset.maxPdfSizeMb ?? preset.maxFileSizeMb ?? 20,
      maxImageSizeMb: preset.maxImageSizeMb ?? 3,
      maxFileSizeMb: preset.maxPdfSizeMb ?? preset.maxFileSizeMb ?? 20
    }
  }
  if (documentType === 'IMAGE') {
    return { allowedDocumentType: 'IMAGE_ONLY', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 2 }
  }
  if (documentType === 'PDF') {
    return { allowedDocumentType: 'PDF_ONLY', maxTotalFiles: 4, maxPdfSizeMb: 20, maxImageSizeMb: 2, maxFileSizeMb: 20 }
  }
  return { allowedDocumentType: 'HYBRID', maxTotalFiles: 6, maxPdfSizeMb: 20, maxImageSizeMb: 3, maxFileSizeMb: 20 }
}

export interface EvidenceSlotPreset {
  aspectCode: string
  slotKey: string
  title: string
  description: string
  isMandatory: boolean
  orderIndex: number
  documentType: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT' | 'HYBRID'
  exampleImages?: string[]
  indicatorNumbers?: number[]
  guideChecklist?: string[]
}

export const PEKPPP_EVIDENCE_SLOTS: EvidenceSlotPreset[] = [
  // ==========================================
  // ASPEK I: KEBIJAKAN PELAYANAN (Q1 - Q9)
  // ==========================================
  {
    aspectCode: 'I',
    slotKey: 'sk_sp',
    title: 'SK Penetapan Standar Pelayanan (SP) & Lampiran',
    description: 'Dokumen SK Penetapan Standar Pelayanan yang sah beserta lampiran seluruh jenis produk pelayanan yang diselenggarakan.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [1, 4],
    guideChecklist: [
      'Daftar seluruh jenis pelayanan yang diselenggarakan',
      'SK Penetapan SP yang ditandatangani pimpinan unit/instansi',
      'Lampiran SP memuat 14 komponen (6 Service Delivery & 8 Manufacturing)',
      'Dokumen peninjauan ulang / pembaruan berkala SP'
    ]
  },
  {
    aspectCode: 'I',
    slotKey: 'ba_fkp',
    title: 'Berita Acara, Notulensi, dan Daftar Hadir FKP',
    description: 'Bukti pelibatan masyarakat dalam penyusunan / peninjauan SP: Berita Acara FKP bertanda tangan para pihak, daftar hadir, notulensi, dan foto dokumentasi kegiatan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'HYBRID',
    exampleImages: [],
    indicatorNumbers: [1, 2, 4],
    guideChecklist: [
      'Berita Acara FKP yang ditandatangani perwakilan unsur masyarakat',
      'Daftar hadir peserta FKP (minimal 3 unsur masyarakat luar)',
      'Notulensi / laporan pelaksanaan FKP & rencana aksi',
      'Foto dokumentasi pelaksanaan kegiatan FKP'
    ]
  },
  {
    aspectCode: 'I',
    slotKey: 'publikasi_sp',
    title: 'Bukti Publikasi Komponen Service Delivery',
    description: 'Dokumentasi / tangkapan layar publikasi Standar Pelayanan di berbagai kanal (Website resmi, media sosial, banner/baliho fisik, dan SIPPN).',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'HYBRID',
    exampleImages: [],
    indicatorNumbers: [3],
    guideChecklist: [
      'Foto media publikasi cetak/non-elektronik di ruang layanan (banner/poster/booklet)',
      'Screenshot publikasi SP pada website resmi & media sosial',
      'Screenshot tampilan publikasi SP pada portal SIPPN KemenPAN-RB'
    ]
  },
  {
    aspectCode: 'I',
    slotKey: 'maklumat_pelayanan',
    title: 'Foto & Publikasi Maklumat Pelayanan',
    description: 'Foto bukti penempatan Maklumat Pelayanan secara fisik di ruang layanan serta publikasi di kanal digital atau dokumen penetapan.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'HYBRID',
    exampleImages: [],
    indicatorNumbers: [5],
    guideChecklist: [
      'Dokumen pengesahan / penetapan Maklumat Pelayanan',
      'Foto penempatan fisik Maklumat Pelayanan di area ruang tunggu/loket',
      'Screenshot publikasi Maklumat Pelayanan pada website/media elektronik'
    ]
  },
  {
    aspectCode: 'I',
    slotKey: 'laporan_skm',
    title: 'Laporan Pelaksanaan & Publikasi SKM',
    description: 'Dokumen laporan hasil Survei Kepuasan Masyarakat (SKM) sesuai PermenPANRB, kuesioner/alat bantu yang dipakai, dan foto/screenshot bukti publikasi hasil nilai SKM.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'HYBRID',
    exampleImages: [],
    indicatorNumbers: [6, 7],
    guideChecklist: [
      'Laporan hasil pelaksanaan SKM sesuai PermenPAN-RB No. 14/2017 (9 unsur)',
      'Dokumentasi instrumen/media kuesioner SKM yang digunakan',
      'Foto/screenshot publikasi nilai indeks SKM di ruang layanan & kanal digital'
    ]
  },
  {
    aspectCode: 'I',
    slotKey: 'tindak_lanjut_skm',
    title: 'Laporan Rencana Tindak Lanjut (RTL) Hasil SKM',
    description: 'Laporan rencana aksi tindak lanjut rekomendasi SKM dan bukti laporan realisasi perbaikan pelayanan yang telah dilaksanakan.',
    isMandatory: true,
    orderIndex: 6,
    documentType: 'HYBRID',
    exampleImages: [],
    indicatorNumbers: [8, 9],
    guideChecklist: [
      'Matriks Rencana Tindak Lanjut (RTL) atas unsur SKM terendah',
      'Laporan realisasi pelaksanaan tindak lanjut perbaikan layanan',
      'Bukti kecepatan penyelesaian tindak lanjut hasil SKM'
    ]
  },

  // ==========================================
  // ASPEK II: PROFESIONALISME SDM (Q10 - Q14)
  // ==========================================
  {
    aspectCode: 'II',
    slotKey: 'sk_jam_layanan',
    title: 'SK Jam Pelayanan Khusus / Tugas Hari Libur & Lembur',
    description: 'SK Jam Kerja/Pelayanan yang memberikan kemudahan waktu bagi pengguna layanan, surat penugasan hari libur/lembur, dan dokumentasi.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [10],
    guideChecklist: [
      'SK penetapan jam pelayanan dan mekanisme piket jam istirahat (tanpa tutup loket)',
      'Surat tugas / nota dinas lembur atau pelayanan ekstra di luar jam reguler',
      'Foto bukti pelaksanaan layanan pada jam istirahat/ekstra'
    ]
  },
  {
    aspectCode: 'II',
    slotKey: 'kode_etik_budaya',
    title: 'SK Kode Etik dan Kode Perilaku Pelaksana',
    description: 'Dokumen resmi penetapan kode etik, kode perilaku, maklumat budaya pelayanan, dan sosialisasi kepada seluruh aparatur pelayanan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [11],
    guideChecklist: [
      'Dokumen SK Kode Etik dan Kode Perilaku Pelaksana Layanan',
      'Aturan kewajiban, larangan, serta mekanisme sanksi pelanggaran etika',
      'Bukti sosialisasi/internalisasi kode etik kepada petugas'
    ]
  },
  {
    aspectCode: 'II',
    slotKey: 'motivasi_kerja',
    title: 'Dokumen Program Peningkatan Motivasi Kerja',
    description: 'Dokumen program pembinaan mental/spiritual, morning briefing, capacity building, sharing session, atau video motivasi internal.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [12],
    guideChecklist: [
      'Dokumen/laporan pelaksanaan kegiatan peningkatan motivasi kerja (1 tahun terakhir)',
      'Bukti kegiatan pembinaan, pelatihan/diklat, gathering, atau konseling SDM',
      'Foto/dokumentasi pelaksanaan kegiatan motivasi'
    ]
  },
  {
    aspectCode: 'II',
    slotKey: 'reward_punishment',
    title: 'SK Kriteria & Bukti Pemberian Reward / Punishment',
    description: 'SK kriteria pemberian penghargaan/sanksi bagi petugas layanan serta bukti piagam penghargaan (Employee of the Month/Year) atau surat teguran.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [13],
    guideChecklist: [
      'SK penetapan indikator & kriteria pemberian penghargaan (reward) pelaksana layanan',
      'Berita acara penilaian kinerja petugas teladan',
      'Sertifikat/piagam penghargaan pegawai berprestasi & dokumentasi penyerahan'
    ]
  },
  {
    aspectCode: 'II',
    slotKey: 'budaya_5s',
    title: 'Dokumentasi Penerapan Budaya Pelayanan 5S',
    description: 'Foto/video penerapan Senyum, Sapa, Salam, Sopan, Santun, pemakaian seragam dinas rapi, ID Card, dan PIN budaya kerja.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [14],
    guideChecklist: [
      'Foto petugas mengenakan seragam dinas resmi sesuai ketentuan hari kerja',
      'Foto pemakaian atribut lengkap: ID Card / tanda pengenal dan pin nama/atribut',
      'Foto penerapan sikap 5S (Senyum, Sapa, Salam, Sopan, Santun) saat melayani'
    ]
  },

  // ==========================================
  // ASPEK III: SARANA & PRASARANA (Q15 - Q20)
  // ==========================================
  {
    aspectCode: 'III',
    slotKey: 'tempat_parkir',
    title: 'Foto Fasilitas Tempat Parkir & Keamanan',
    description: 'Foto area parkir mobil & motor, rambu parkir, penitipan helm, pembatas parkir, dan kamera pengawas CCTV.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [15],
    guideChecklist: [
      'Foto pemisahan parkir roda 2 & roda 4 serta parkir khusus disabilitas/wanita',
      'Foto petugas parkir, kanopi/pelindung, CCTV, dan tempat penitipan helm/jaket',
      'Foto ketersediaan kebijakan parkir gratis di area layanan'
    ]
  },
  {
    aspectCode: 'III',
    slotKey: 'ruang_tunggu',
    title: 'Foto Fasilitas Ruang Tunggu Pelayanan',
    description: 'Foto kursi ruang tunggu yang layak, pendingin ruangan/AC/kipas, display nomor antrean, charging station, dan air minum gratis.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [16],
    guideChecklist: [
      'Foto kursi tunggu memadai, AC/sirkulasi udara, dan kebersihan ruangan',
      'Foto fasilitas monitor antrean, bahan bacaan, charging booth, Wi-Fi, dan air minum',
      'Foto kursi prioritas bagi kelompok rentan'
    ]
  },
  {
    aspectCode: 'III',
    slotKey: 'toilet_pengguna',
    title: 'Foto Toilet Pengguna Layanan & Form Monev Kebersihan',
    description: 'Foto toilet pria & wanita terpisah, wastafel, sabun, tempat sampah tertutup, kloset bersih, dan lembar checklist kontrol kebersihan berkala.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [17],
    guideChecklist: [
      'Foto pemisahan toilet pria dan wanita khusus pengguna layanan',
      'Foto kelengkapan wastafel, sabun cair, tisu/pengering, air bersih, dan tempat sampah',
      'Foto jadwal/lembar monev pemeriksaan kebersihan toilet berkala'
    ]
  },
  {
    aspectCode: 'III',
    slotKey: 'sarpras_kelompok_rentan',
    title: 'Foto Sarpras Ramah Kelompok Rentan',
    description: 'Foto ramp / jalan landai dengan pegangan rambat, kursi roda, ruang laktasi/menyusui, toilet khusus disabilitas, guiding block tuna netra, dan huruf braille.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [18],
    guideChecklist: [
      'Foto jalur landai (ramp) dengan handrail, kursi roda/kruk, dan guiding block',
      'Foto loket khusus disabilitas, kursi prioritas, dan toilet disabilitas (grab bar)',
      'Foto ruang laktasi/menyusui tertutup dan area bermain anak'
    ]
  },
  {
    aspectCode: 'III',
    slotKey: 'sarpras_penunjang_k3',
    title: 'Foto Sarpras Penunjang K3 & Mushola',
    description: 'Foto Alat Pemadam Api Ringan (APAR) siap pakai, kotak P3K lengkap obat-obatan, petunjuk jalur evakuasi & titik kumpul, serta mushola/tempat ibadah.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [19],
    guideChecklist: [
      'Foto kotak P3K, APAR aktif, jalur evakuasi, dan titik kumpul bencana',
      'Foto ruang ibadah/mushola pengguna layanan, area merokok terpisah, dan kantin/fotokopi'
    ]
  },
  {
    aspectCode: 'III',
    slotKey: 'front_office_antrian',
    title: 'Foto Front Office / Informasi & Sistem Antrean',
    description: 'Foto meja layanan Front Office bagian informasi, SK penugasan petugas FO, dan mesin/display sistem antrean terstruktur.',
    isMandatory: true,
    orderIndex: 6,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [20],
    guideChecklist: [
      'Foto meja layanan informasi (Front Office) khusus dengan petugas yang berjaga',
      'Foto layar informasi digital/cetak dan fasilitas pendukung di meja FO'
    ]
  },

  // ==========================================
  // ASPEK IV: SISTEM INFORMASI PELAYANAN PUBLIK (Q21 - Q24)
  // ==========================================
  {
    aspectCode: 'IV',
    slotKey: 'akun_sippn',
    title: 'Screenshot Akun & Profil Unit Layanan pada SIPPN',
    description: 'Screenshot tampilan dashboard akun SIPPN MenPAN-RB yang aktif, terverifikasi, dan memuat data standar pelayanan unit.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [21],
    guideChecklist: [
      'Screenshot akun aktif unit layanan pada portal nasional SIPPN KemenPAN-RB',
      'Screenshot daftar produk pelayanan yang telah dipublikasikan di SIPPN'
    ]
  },
  {
    aspectCode: 'IV',
    slotKey: 'sistem_operasional',
    title: 'Screenshot / Dokumentasi Sistem Informasi Layanan',
    description: 'Screenshot modul aplikasi/sistem informasi elektronik yang digunakan untuk operasional pengelolaan data pelayanan publik.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [22],
    guideChecklist: [
      'Screenshot aplikasi pelayanan daring / sistem pendukung operasional belakang layar',
      'Screenshot fitur basis data atau integrasi layanan elektronik'
    ]
  },
  {
    aspectCode: 'IV',
    slotKey: 'portal_website',
    title: 'Dokumentasi Kualitas Fitur Portal / Website Pelayanan',
    description: 'Dokumentasi rancangan website/portal resmi unit layanan yang user-friendly, responsif, dan mudah diakses masyarakat.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [23],
    guideChecklist: [
      'Screenshot halaman utama website resmi unit layanan (domain .go.id)',
      'Screenshot navigasi menu informasi layanan dan kemudahan aksesibilitas'
    ]
  },
  {
    aspectCode: 'IV',
    slotKey: 'log_pemutakhiran',
    title: 'Bukti Log Pemutakhiran Data & Informasi Digital',
    description: 'Bukti update berkala data informasi, berita, pengumuman, atau konten pada kanal digital dan website dalam tahun berjalan.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [24],
    guideChecklist: [
      'Screenshot riwayat pembaruan berita/informasi layanan terbaru (tanggal terlihat jelas)',
      'Screenshot unggahan berkala pada media sosial resmi instansi'
    ]
  },

  // ==========================================
  // ASPEK V: KONSULTASI DAN PENGADUAN (Q25 - Q28)
  // ==========================================
  {
    aspectCode: 'V',
    slotKey: 'sk_sop_pengaduan',
    title: 'SK Petugas Pengaduan & SOP Mekanisme Pengaduan',
    description: 'Dokumen SK Penugasan Petugas Pengelola Pengaduan dan bagan alur / SOP tata cara penanganan pengaduan masyarakat.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [25, 26],
    guideChecklist: [
      'SK Penetapan Tim / Petugas Khusus Pengelola Konsultasi dan Pengaduan',
      'Dokumen SOP mekanisme dan standar waktu penyelesaian pengaduan'
    ]
  },
  {
    aspectCode: 'V',
    slotKey: 'sarana_fisik_pengaduan',
    title: 'Foto Sarana Fisik Pengaduan & Kotak Saran',
    description: 'Foto kotak saran/pengaduan tertutup, meja/ruang khusus konsultasi pengaduan yang menjaga kerahasiaan pelapor.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [25, 26],
    guideChecklist: [
      'Foto ruang/meja khusus konsultasi dan pengaduan beserta petugas',
      'Foto kotak saran/pengaduan, buku register aduan fisik, dan publikasi kanal aduan'
    ]
  },
  {
    aspectCode: 'V',
    slotKey: 'kanal_span_lapor',
    title: 'Screenshot Aktivitas Kanal SP4N-LAPOR! / Media Digital',
    description: 'Screenshot dashboard pengelolaan akun SP4N-LAPOR!, media sosial, hotline WhatsApp, atau email resmi pengaduan.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [26, 27, 28],
    guideChecklist: [
      'Screenshot akun aktif SP4N-LAPOR! yang terhubung dengan unit layanan',
      'Screenshot kanal pengaduan digital (WhatsApp/Website/Media Sosial/Email) beserta respons'
    ]
  },
  {
    aspectCode: 'V',
    slotKey: 'laporan_rekap_pengaduan',
    title: 'Laporan Rekapitulasi & Persentase Tindak Lanjut Pengaduan',
    description: 'Laporan akuntabilitas tahunan rekapitulasi jumlah pengaduan yang masuk, diproses, dan persentase (%) yang berhasil diselesaikan 100%.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [27, 28],
    guideChecklist: [
      'Laporan berkala rekapitulasi konsultasi & pengaduan yang masuk (Januari–Desember)',
      'Rincian jumlah pengaduan yang telah selesai ditindaklanjuti beserta bukti penyelesaiannya'
    ]
  },

  // ==========================================
  // ASPEK VI: INOVASI PELAYANAN PUBLIK (Q29 - Q30)
  // ==========================================
  {
    aspectCode: 'VI',
    slotKey: 'proposal_sk_inovasi',
    title: 'Dokumen Proposal Inovasi & SK Penetapan Inovasi',
    description: 'Dokumen proposal inovasi pelayanan publik, SK penetapan inovasi dari pimpinan instansi, dan deskripsi kebaruan inovasi.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [29],
    guideChecklist: [
      'SK Penetapan Inovasi Pelayanan Publik yang sah',
      'Proposal inovasi memuat latar belakang, kebaruan (novelty), dan dampak manfaat',
      'Bukti keikutsertaan kompetisi inovasi (KIPP/daerah) atau piagam penghargaan jika ada'
    ]
  },
  {
    aspectCode: 'VI',
    slotKey: 'implementasi_inovasi',
    title: 'Dokumentasi Implementasi & Kemanfaatan Inovasi',
    description: 'Foto, video, infografis, atau laporan evaluasi hasil pelaksanaan inovasi dan dampaknya bagi kemudahan masyarakat penerima layanan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'DOCUMENT',
    exampleImages: [],
    indicatorNumbers: [29],
    guideChecklist: [
      'Dokumentasi foto/infografis pelaksanaan inovasi di lapangan (minimal telah berjalan >1 tahun)',
      'Laporan evaluasi dampak sebelum dan sesudah penerapan inovasi'
    ]
  },
  {
    aspectCode: 'VI',
    slotKey: 'dukungan_keberlanjutan',
    title: 'Bukti Dukungan Anggaran, Sarpras, & SDM Inovasi',
    description: 'Dokumen DPA/anggaran yang dialokasikan, sarana prasarana penunjang, dan tim pengelola khusus demi menjamin keberlanjutan inovasi.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'PDF',
    exampleImages: [],
    indicatorNumbers: [30],
    guideChecklist: [
      'Dokumen payung hukum / pelembagaan inovasi dan SK Tim Pengelola Inovasi',
      'Bukti dukungan anggaran (DPA/RKA) serta sarana prasarana khusus inovasi'
    ]
  },
  // ASPEK TAMBAHAN (+1): SISTEM ANTRIAN & INFORMASI TAMBAHAN (Q31)
  {
    aspectCode: 'TAMBAHAN',
    slotKey: 'sistem_antrian_tambahan',
    title: 'Bukti Pelaksanaan Sistem Antrean Layanan (Q31)',
    description: 'Foto/video display antrean, mesin tiket antrean, SOP alur antrean, atau mekanisme urutan pelayanan bagi penerima layanan di loket.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'IMAGE',
    exampleImages: [],
    indicatorNumbers: [31],
    guideChecklist: [
      'Foto mesin tiket antrean / nomor urut antrean dan layar pemanggil di loket',
      'Screenshot fasilitas pendaftaran antrean daring (jika tersedia)'
    ]
  }
]

export function normalizeAspectCode(code: string): string {
  if (!code) return 'I'
  const upper = code.trim().toUpperCase()
  if (['KEBIJAKAN', 'KEBIJAKAN_PELAYANAN', 'ASPEK_1', 'ASPEK_I', '1', 'I'].includes(upper)) return 'I'
  if (['SDM', 'PROFESIONALISME_SDM', 'ASPEK_2', 'ASPEK_II', '2', 'II'].includes(upper)) return 'II'
  if (['SARPRAS', 'SARANA_PRASARANA', 'SARANA_DAN_PRASARANA', 'ASPEK_3', 'ASPEK_III', '3', 'III'].includes(upper)) return 'III'
  if (['SIPP', 'SISTEM_INFORMASI', 'SISTEM_INFORMASI_PELAYANAN_PUBLIK', 'ASPEK_4', 'ASPEK_IV', '4', 'IV'].includes(upper)) return 'IV'
  if (['PENGADUAN', 'KONSULTASI_PENGADUAN', 'KONSULTASI_DAN_PENGADUAN', 'ASPEK_5', 'ASPEK_V', '5', 'V'].includes(upper)) return 'V'
  if (['INOVASI', 'INOVASI_PELAYANAN_PUBLIK', 'ASPEK_6', 'ASPEK_VI', '6', 'VI'].includes(upper)) return 'VI'
  if (['TAMBAHAN', 'ASPEK_7', 'ASPEK_VII', 'ASPEK_TAMBAHAN', 'INFORMASI_TAMBAHAN', '7', 'VII'].includes(upper)) return 'TAMBAHAN'
  return upper
}

export function getDbAspectCode(code: string): string {
  if (!code) return 'KEBIJAKAN'
  const upper = code.trim().toUpperCase()
  if (['KEBIJAKAN', 'KEBIJAKAN_PELAYANAN', 'ASPEK_1', 'ASPEK_I', '1', 'I'].includes(upper)) return 'KEBIJAKAN'
  if (['SDM', 'PROFESIONALISME_SDM', 'ASPEK_2', 'ASPEK_II', '2', 'II'].includes(upper)) return 'SDM'
  if (['SARPRAS', 'SARANA_PRASARANA', 'SARANA_DAN_PRASARANA', 'ASPEK_3', 'ASPEK_III', '3', 'III'].includes(upper)) return 'SARPRAS'
  if (['SIPP', 'SISTEM_INFORMASI', 'SISTEM_INFORMASI_PELAYANAN_PUBLIK', 'ASPEK_4', 'ASPEK_IV', '4', 'IV'].includes(upper)) return 'SIPP'
  if (['PENGADUAN', 'KONSULTASI_PENGADUAN', 'KONSULTASI_DAN_PENGADUAN', 'ASPEK_5', 'ASPEK_V', '5', 'V'].includes(upper)) return 'PENGADUAN'
  if (['INOVASI', 'INOVASI_PELAYANAN_PUBLIK', 'ASPEK_6', 'ASPEK_VI', '6', 'VI'].includes(upper)) return 'INOVASI'
  if (['TAMBAHAN', 'ASPEK_7', 'ASPEK_VII', 'ASPEK_TAMBAHAN', 'INFORMASI_TAMBAHAN', '7', 'VII'].includes(upper)) return 'TAMBAHAN'
  return upper
}

export function getEvidenceSlotsByAspect(aspectCode: string): EvidenceSlotPreset[] {
  const norm = normalizeAspectCode(aspectCode)
  return PEKPPP_EVIDENCE_SLOTS.filter(
    (slot) => slot.aspectCode === norm || slot.aspectCode === aspectCode || normalizeAspectCode(slot.aspectCode) === norm
  )
}

export interface FileVersionItem {
  id: string
  version: number
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: 'PDF' | 'IMAGE' | 'DOCUMENT' | 'LINK'
  uploadedAt: string
  uploaderName?: string
  note?: string
}

export type SlotMetadataCategory = 'LEGAL_DOCUMENT' | 'PHYSICAL_FACILITY' | 'DIGITAL_SYSTEM'

export type FacilityConditionStatus = 'LAYAK_BERFUNGSI' | 'BARU_DIRENOVASI' | 'PERLU_PERBAIKAN'

export type DigitalOperationalStatus = 'AKTIF_TERVERIFIKASI' | 'AKTIF_BERJALAN' | 'DALAM_PEMELIHARAAN'

export interface EvidenceAttachmentMetadata {
  category?: SlotMetadataCategory
  // Kategori A: Dokumen Legal / SK / Laporan Resmi
  detectedYear?: number | null
  documentNumber?: string | null
  documentDate?: string | null
  documentTitle?: string | null
  // Kategori B: Dokumentasi Fisik / Sarana Prasarana (Sarpras)
  facilityType?: string | null
  conditionStatus?: FacilityConditionStatus | string | null
  locationDescription?: string | null
  photoDate?: string | null
  // Kategori C: Sistem Informasi / Kanal Digital (Screenshot)
  systemName?: string | null
  url?: string | null
  operationalStatus?: DigitalOperationalStatus | string | null
  screenshotDate?: string | null
  // Umum
  notes?: string | null
  confidence?: number
  extractedAt?: string
  extractedBy?: 'AI_VISION' | 'MANUAL'
}

export interface SlotMetadataSchema {
  category: SlotMetadataCategory
  categoryLabel: string
  modalSubtitle: string
  primaryFieldLabel: string
  primaryFieldPlaceholder: string
  quickOptions: string[]
  locationOrUrlLabel?: string
  locationOrUrlPlaceholder?: string
  dateFieldLabel: string
}

const SLOT_METADATA_CONFIG: Record<string, SlotMetadataSchema> = {
  // =========================================================================
  // KATEGORI B: DOKUMENTASI FISIK & SARANA PRASARANA (SARPRAS)
  // =========================================================================
  sarpras_kelompok_rentan: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Sarpras Kelompok Rentan',
    modalSubtitle: 'Identitas fasilitas ramah kelompok rentan / disabilitas pada foto ini',
    primaryFieldLabel: 'Jenis Fasilitas Kelompok Rentan',
    primaryFieldPlaceholder: 'Contoh: Parkir Khusus Disabilitas / Jalur Ramp',
    quickOptions: [
      'Parkir Khusus Disabilitas',
      'Jalur Landai (Ramp) & Handrail',
      'Kursi Roda / Tongkat / Kruk',
      'Toilet Khusus Disabilitas (Grab Bar)',
      'Ruang Laktasi / Menyusui',
      'Guiding Block Tuna Netra',
      'Loket / Kursi Prioritas Rentan',
      'Area Bermain Anak',
      'Huruf Braille / Informasi Audio'
    ],
    locationOrUrlLabel: 'Lokasi / Area Penempatan Fasilitas',
    locationOrUrlPlaceholder: 'Contoh: Area Parkir Depan / Lobby Utama Lt. 1',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  tempat_parkir: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Fasilitas Tempat Parkir',
    modalSubtitle: 'Identitas sarana parkir dan keamanan pada foto dokumentasi',
    primaryFieldLabel: 'Jenis Fasilitas Parkir',
    primaryFieldPlaceholder: 'Contoh: Area Parkir Roda 2 & Roda 4 / Parkir Disabilitas',
    quickOptions: [
      'Parkir Roda 2 & Roda 4 Terpisah',
      'Parkir Khusus Disabilitas / Wanita',
      'Petugas Parkir & Pos Keamanan',
      'Kamera Pengawas (CCTV) Parkir',
      'Tempat Penitipan Helm / Jaket',
      'Rambu & Plang Parkir Gratis'
    ],
    locationOrUrlLabel: 'Lokasi Area Parkir',
    locationOrUrlPlaceholder: 'Contoh: Halaman Depan Gedung Pelayanan',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  ruang_tunggu: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Fasilitas Ruang Tunggu',
    modalSubtitle: 'Identitas kenyamanan dan fasilitas ruang tunggu pelayanan',
    primaryFieldLabel: 'Jenis Fasilitas Ruang Tunggu',
    primaryFieldPlaceholder: 'Contoh: Kursi Tunggu & AC / Charging Station',
    quickOptions: [
      'Kursi Ruang Tunggu & Pendingin (AC)',
      'Kursi Prioritas Kelompok Rentan',
      'Monitor / Layar Panggil Antrean',
      'Charging Station / Booth Pengisian Daya',
      'Dispenser Air Minum Gratis',
      'Bahan Bacaan / Pojok Baca & Wi-Fi'
    ],
    locationOrUrlLabel: 'Lokasi Ruang Tunggu',
    locationOrUrlPlaceholder: 'Contoh: Ruang Tunggu Utama Loket Pelayanan',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  toilet_pengguna: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Fasilitas Toilet Pengguna',
    modalSubtitle: 'Identitas fasilitas sanitasi dan monev kebersihan toilet',
    primaryFieldLabel: 'Jenis Fasilitas Toilet / Sanitasi',
    primaryFieldPlaceholder: 'Contoh: Toilet Pria & Wanita Terpisah / Checklist Kebersihan',
    quickOptions: [
      'Toilet Pria & Wanita Terpisah',
      'Wastafel, Sabun Cair & Pengering/Tisu',
      'Kloset Bersih & Air Mengalir',
      'Tempat Sampah Tertutup',
      'Lembar / Checklist Monev Kebersihan Toilet'
    ],
    locationOrUrlLabel: 'Lokasi Toilet',
    locationOrUrlPlaceholder: 'Contoh: Samping Ruang Tunggu Pelayanan Lt. 1',
    dateFieldLabel: 'Tanggal Pemeriksaan / Foto (Opsional)'
  },
  sarpras_penunjang_k3: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Sarpras K3 & Penunjang',
    modalSubtitle: 'Identitas sarana keselamatan kerja (K3), ibadah, dan fasilitas penunjang',
    primaryFieldLabel: 'Jenis Sarpras K3 / Penunjang',
    primaryFieldPlaceholder: 'Contoh: Tabung APAR Aktif / Kotak P3K / Mushola',
    quickOptions: [
      'Alat Pemadam Api Ringan (APAR) Aktif',
      'Kotak P3K Lengkap Obat-obatan',
      'Rambu Jalur Evakuasi & Titik Kumpul',
      'Mushola / Tempat Ibadah Pengguna',
      'Area Merokok Terpisah (Smoking Area)',
      'Kantin / Area Fotokopi Penunjang'
    ],
    locationOrUrlLabel: 'Lokasi Penempatan',
    locationOrUrlPlaceholder: 'Contoh: Koridor Ruang Pelayanan / Titik Kumpul Halaman',
    dateFieldLabel: 'Tanggal Pengambilan Foto / Inspeksi (Opsional)'
  },
  front_office_antrian: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Front Office & Antrean',
    modalSubtitle: 'Identitas meja informasi Front Office dan fasilitas antrean layanan',
    primaryFieldLabel: 'Jenis Sarana Front Office / Antrean',
    primaryFieldPlaceholder: 'Contoh: Meja Informasi Front Office / Mesin Tiket Antrean',
    quickOptions: [
      'Meja Layanan Informasi (Front Office)',
      'Petugas Front Office Berjaga',
      'Mesin Tiket / Kiosk Nomor Antrean',
      'Layar Display Pemanggil Antrean',
      'Media Informasi Layanan di Meja FO'
    ],
    locationOrUrlLabel: 'Lokasi Area Layanan',
    locationOrUrlPlaceholder: 'Contoh: Lobby Utama Pintu Masuk Layanan',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  budaya_5s: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Dokumentasi Budaya 5S & Atribut',
    modalSubtitle: 'Identitas dokumentasi penerapan budaya pelayanan 5S dan kelengkapan atribut petugas',
    primaryFieldLabel: 'Jenis Dokumentasi Budaya Pelayanan',
    primaryFieldPlaceholder: 'Contoh: Penerapan Sikap 5S di Loket / Atribut ID Card & Seragam',
    quickOptions: [
      'Penerapan 5S (Senyum, Sapa, Salam, Sopan, Santun)',
      'Pemakaian Seragam Dinas Resmi Sesuai Hari Kerja',
      'Pemakaian ID Card / Tanda Pengenal Petugas',
      'Pemakaian Pin Budaya Kerja / Atribut Lengkap',
      'Briefing Pagi / Doa Bersama Petugas Layanan'
    ],
    locationOrUrlLabel: 'Area / Loket Pelayanan',
    locationOrUrlPlaceholder: 'Contoh: Loket Pelayanan Terpadu',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  sarana_fisik_pengaduan: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Sarana Fisik Pengaduan',
    modalSubtitle: 'Identitas sarana fisik konsultasi dan pengaduan masyarakat di ruang layanan',
    primaryFieldLabel: 'Jenis Sarana Pengaduan Fisik',
    primaryFieldPlaceholder: 'Contoh: Ruang Khusus Konsultasi & Pengaduan / Kotak Saran',
    quickOptions: [
      'Ruang / Meja Khusus Konsultasi & Pengaduan',
      'Kotak Saran / Pengaduan Tertutup',
      'Buku Register Pengaduan Fisik & Formulir',
      'Banner / Poster Publikasi Nomor & Kanal Pengaduan',
      'Petugas Khusus Pelayanan Pengaduan'
    ],
    locationOrUrlLabel: 'Lokasi Penempatan',
    locationOrUrlPlaceholder: 'Contoh: Ruang Konsultasi Samping Loket Utama',
    dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
  },
  sistem_antrian_tambahan: {
    category: 'PHYSICAL_FACILITY',
    categoryLabel: 'Sistem Antrean Layanan (Q31)',
    modalSubtitle: 'Identitas sarana antrean fisik maupun antrean daring di unit layanan',
    primaryFieldLabel: 'Komponen Sistem Antrean',
    primaryFieldPlaceholder: 'Contoh: Mesin Tiket & Display Antrean / Antrean Online',
    quickOptions: [
      'Mesin Cetak Tiket Nomor Antrean',
      'Layar Monitor & Audio Pemanggil Antrean',
      'Loket Pemanggilan Sesuai Urutan Antrean',
      'Sistem Pendaftaran Antrean Daring (Online)',
      'SOP Alur & Mekanisme Antrean Pelayanan'
    ],
    locationOrUrlLabel: 'Lokasi / Kanal Antrean',
    locationOrUrlPlaceholder: 'Contoh: Ruang Tunggu Loket / Aplikasi Antrean',
    dateFieldLabel: 'Tanggal Dokumentasi (Opsional)'
  },

  // =========================================================================
  // KATEGORI C: SISTEM INFORMASI & KANAL DIGITAL (SCREENSHOT)
  // =========================================================================
  akun_sippn: {
    category: 'DIGITAL_SYSTEM',
    categoryLabel: 'Portal Nasional SIPPN',
    modalSubtitle: 'Identitas tangkapan layar akun dan publikasi Standar Pelayanan pada SIPPN KemenPAN-RB',
    primaryFieldLabel: 'Nama Kanal / Modul SIPPN',
    primaryFieldPlaceholder: 'Contoh: Dashboard Akun SIPPN Unit / Daftar Layanan SIPPN',
    quickOptions: [
      'Dashboard Profil Akun Aktif SIPPN KemenPAN-RB',
      'Halaman Publikasi Produk Layanan di SIPPN',
      'Detail 14 Komponen Standar Pelayanan di SIPPN',
      'Rekapitulasi Jumlah Jenis Layanan Terpublikasi'
    ],
    locationOrUrlLabel: 'Tautan / URL Halaman SIPPN (Opsional)',
    locationOrUrlPlaceholder: 'Contoh: https://sippn.menpan.go.id/instansi/...',
    dateFieldLabel: 'Tanggal Tangkapan Layar (Screenshot)'
  },
  sistem_operasional: {
    category: 'DIGITAL_SYSTEM',
    categoryLabel: 'Sistem Informasi Operasional',
    modalSubtitle: 'Identitas aplikasi pelayanan elektronik atau sistem pendukung operasional unit',
    primaryFieldLabel: 'Nama Aplikasi / Sistem Informasi',
    primaryFieldPlaceholder: 'Contoh: SIAK Terpusat / SIMRS / Aplikasi Perizinan Online',
    quickOptions: [
      'Aplikasi Pelayanan Daring (Front-End Masyarakat)',
      'Sistem Operasional Back-Office & Basis Data',
      'Dashboard Monitoring & Pelaporan Layanan',
      'Sistem Integrasi Layanan Lintas Instansi'
    ],
    locationOrUrlLabel: 'Alamat URL / Domain Aplikasi (Opsional)',
    locationOrUrlPlaceholder: 'Contoh: https://layanan.pemda.go.id',
    dateFieldLabel: 'Tanggal Tangkapan Layar (Screenshot)'
  },
  portal_website: {
    category: 'DIGITAL_SYSTEM',
    categoryLabel: 'Portal Website Resmi',
    modalSubtitle: 'Identitas tangkapan layar fitur, navigasi, dan aksesibilitas website resmi unit layanan',
    primaryFieldLabel: 'Halaman / Fitur Website yang Didokumentasikan',
    primaryFieldPlaceholder: 'Contoh: Beranda Website Resmi (.go.id) / Menu Standar Pelayanan',
    quickOptions: [
      'Beranda Utama Website Resmi Unit (.go.id)',
      'Menu Navigasi Informasi Standar Pelayanan',
      'Fitur Kemudahan Aksesibilitas / Tampilan Responsif',
      'Halaman Formulir / Unduhan Persyaratan Layanan'
    ],
    locationOrUrlLabel: 'Alamat URL Website Resmi',
    locationOrUrlPlaceholder: 'Contoh: https://disdukcapil.kabupaten.go.id',
    dateFieldLabel: 'Tanggal Tangkapan Layar (Screenshot)'
  },
  log_pemutakhiran: {
    category: 'DIGITAL_SYSTEM',
    categoryLabel: 'Log Pemutakhiran Informasi Digital',
    modalSubtitle: 'Identitas bukti pembaruan rutin berita, pengumuman, atau konten media sosial/website',
    primaryFieldLabel: 'Kanal Digital & Jenis Konten Pemutakhiran',
    primaryFieldPlaceholder: 'Contoh: Riwayat Berita Website Resmi / Feed Instagram Resmi',
    quickOptions: [
      'Halaman Berita / Artikel Terbaru di Website Resmi',
      'Unggahan Informasi Layanan di Instagram / Media Sosial',
      'Log Riwayat Update Konten CMS Website',
      'Pengumuman Jadwal / Informasi Layanan Terkini'
    ],
    locationOrUrlLabel: 'Tautan Website / Akun Media Sosial',
    locationOrUrlPlaceholder: 'Contoh: https://website.go.id/berita atau @akun_opd',
    dateFieldLabel: 'Tanggal Pemutakhiran Terakhir / Screenshot'
  },
  kanal_span_lapor: {
    category: 'DIGITAL_SYSTEM',
    categoryLabel: 'Kanal SP4N-LAPOR! & Aduan Digital',
    modalSubtitle: 'Identitas tangkapan layar pengelolaan pengaduan elektronik dan SP4N-LAPOR!',
    primaryFieldLabel: 'Nama Kanal Pengaduan Digital',
    primaryFieldPlaceholder: 'Contoh: Dashboard Admin SP4N-LAPOR! / Hotline WhatsApp Resmi',
    quickOptions: [
      'Dashboard Akun Aktif SP4N-LAPOR! Unit Layanan',
      'Bukti Tindak Lanjut & Respons Aduan di SP4N-LAPOR!',
      'Layanan Pengaduan WhatsApp / Hotline Resmi',
      'Kanal Pengaduan pada Website / Media Sosial / Email'
    ],
    locationOrUrlLabel: 'URL Kanal / Nomor Hotline / Akun',
    locationOrUrlPlaceholder: 'Contoh: https://lapor.go.id atau WA 0811-xxxx-xxxx',
    dateFieldLabel: 'Tanggal Tangkapan Layar (Screenshot)'
  }
}

/**
 * Mengembalikan skema metadata yang paling relevan berdasarkan `slotKey`, `documentType` slot,
 * maupun tipe berkas lampiran (`fileType` = 'PDF' | 'IMAGE').
 */
export function getSlotMetadataSchema(
  slotKey: string,
  slotDocumentType?: string,
  attachmentFileType?: string | null
): SlotMetadataSchema {
  if (SLOT_METADATA_CONFIG[slotKey]) {
    return SLOT_METADATA_CONFIG[slotKey]
  }

  // Untuk slot HYBRID yang fokus utamanya adalah dokumentasi publikasi fisik/digital
  if (slotKey === 'publikasi_sp') {
    return {
      category: 'PHYSICAL_FACILITY',
      categoryLabel: 'Media Publikasi Standar Pelayanan',
      modalSubtitle: 'Identitas media publikasi Standar Pelayanan (cetak/fisik maupun elektronik)',
      primaryFieldLabel: 'Bentuk / Kanal Publikasi SP',
      primaryFieldPlaceholder: 'Contoh: Banner Standar Pelayanan di Ruang Tunggu / Website',
      quickOptions: [
        'Banner / X-Banner / Poster SP di Ruang Pelayanan',
        'Brosur / Booklet / Leaflet Informasi Layanan',
        'Layar TV / Kiosk Informasi Digital Ruang Tunggu',
        'Publikasi Standar Pelayanan di Website Resmi',
        'Publikasi Standar Pelayanan di Media Sosial',
        'Publikasi Standar Pelayanan di Portal SIPPN'
      ],
      locationOrUrlLabel: 'Lokasi Penempatan / Tautan Kanal',
      locationOrUrlPlaceholder: 'Contoh: Lobby Ruang Tunggu / https://...',
      dateFieldLabel: 'Tanggal Dokumentasi / Publikasi'
    }
  }

  if (slotKey === 'maklumat_pelayanan' && attachmentFileType === 'IMAGE') {
    return {
      category: 'PHYSICAL_FACILITY',
      categoryLabel: 'Publikasi Maklumat Pelayanan',
      modalSubtitle: 'Identitas foto penempatan fisik atau publikasi elektronik Maklumat Pelayanan',
      primaryFieldLabel: 'Bentuk Penempatan Maklumat Pelayanan',
      primaryFieldPlaceholder: 'Contoh: Pigura Maklumat di Dinding Lobby / Publikasi Website',
      quickOptions: [
        'Pigura / Plang Maklumat Pelayanan di Ruang Tunggu',
        'Banner Maklumat Pelayanan di Area Loket',
        'Publikasi Maklumat Pelayanan pada Website Resmi',
        'Publikasi Maklumat Pelayanan pada Media Sosial'
      ],
      locationOrUrlLabel: 'Lokasi Penempatan / Tautan',
      locationOrUrlPlaceholder: 'Contoh: Dinding Utama Ruang Pelayanan Lt. 1',
      dateFieldLabel: 'Tanggal Dokumentasi (Opsional)'
    }
  }

  if (slotKey === 'implementasi_inovasi' && attachmentFileType === 'IMAGE') {
    return {
      category: 'PHYSICAL_FACILITY',
      categoryLabel: 'Dokumentasi Implementasi Inovasi',
      modalSubtitle: 'Identitas foto pelaksanaan inovasi pelayanan publik di lapangan',
      primaryFieldLabel: 'Bentuk Kegiatan / Implementasi Inovasi',
      primaryFieldPlaceholder: 'Contoh: Pelayanan Jemput Bola / Aplikasi Inovasi',
      quickOptions: [
        'Pelaksanaan Inovasi Pelayanan di Lapangan',
        'Penggunaan Aplikasi / Perangkat Inovasi oleh Masyarakat',
        'Sosialisasi & Pendampingan Inovasi Pelayanan',
        'Infografis Dampak Sebelum & Sesudah Inovasi'
      ],
      locationOrUrlLabel: 'Lokasi Pelaksanaan / Kanal Inovasi',
      locationOrUrlPlaceholder: 'Contoh: Desa/Kelurahan Lokus / Ruang Layanan',
      dateFieldLabel: 'Tanggal Dokumentasi Kegiatan'
    }
  }

  // Fallback jika slot tambahan (additional_*) berjenis IMAGE
  if (slotDocumentType === 'IMAGE' || (slotKey.startsWith('additional_') && attachmentFileType === 'IMAGE')) {
    return {
      category: 'PHYSICAL_FACILITY',
      categoryLabel: 'Dokumentasi Foto / Sarana Fisik',
      modalSubtitle: 'Identitas objek fasilitas atau kegiatan pada foto dokumentasi ini',
      primaryFieldLabel: 'Objek Foto / Nama Fasilitas',
      primaryFieldPlaceholder: 'Contoh: Dokumentasi Fasilitas / Kegiatan Pelayanan',
      quickOptions: [
        'Fasilitas Sarana & Prasarana Pelayanan',
        'Dokumentasi Kegiatan Pelayanan Publik',
        'Media Informasi & Publikasi Layanan'
      ],
      locationOrUrlLabel: 'Lokasi Pengambilan Foto',
      locationOrUrlPlaceholder: 'Contoh: Ruang Pelayanan Utama',
      dateFieldLabel: 'Tanggal Pengambilan Foto (Opsional)'
    }
  }

  // Default: KATEGORI A (LEGAL_DOCUMENT) - SK, SOP, Berita Acara, Laporan SKM, Proposal Inovasi, dll.
  return {
    category: 'LEGAL_DOCUMENT',
    categoryLabel: 'Dokumen Resmi / SK / Laporan',
    modalSubtitle: 'Identitas tahun penetapan, nomor surat/SK, dan tanggal pengesahan dokumen resmi',
    primaryFieldLabel: 'Nomor Surat / SK / Laporan Resmi',
    primaryFieldPlaceholder: 'Contoh: 188.4/45/Kep/Disdukcapil/2024',
    quickOptions: [],
    dateFieldLabel: 'Tanggal Lengkap Penetapan (Opsional)'
  }
}

export function getConditionStatusLabel(status?: string | null): string {
  if (!status) return ''
  switch (status) {
    case 'LAYAK_BERFUNGSI':
      return 'Layak & Berfungsi Baik'
    case 'BARU_DIRENOVASI':
      return 'Baru / Direnovasi'
    case 'PERLU_PERBAIKAN':
      return 'Perlu Perbaikan'
    default:
      return status
  }
}

export function getOperationalStatusLabel(status?: string | null): string {
  if (!status) return ''
  switch (status) {
    case 'AKTIF_TERVERIFIKASI':
      return 'Aktif & Terverifikasi'
    case 'AKTIF_BERJALAN':
      return 'Aktif Berjalan'
    case 'DALAM_PEMELIHARAAN':
      return 'Dalam Pemeliharaan'
    default:
      return status
  }
}

export interface EvidenceAttachmentItem {
  id: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: 'PDF' | 'IMAGE' | 'DOCUMENT' | 'LINK'
  storageProvider?: string
  uploadedAt: string
  uploaderName?: string
  version?: number
  versions?: FileVersionItem[]
  metadata?: EvidenceAttachmentMetadata
}

export function extractAttachments(sub: any): EvidenceAttachmentItem[] {
  if (!sub) return []
  if (Array.isArray(sub.attachments) && sub.attachments.length > 0) {
    return (sub.attachments as EvidenceAttachmentItem[]).map((att) => ({
      ...att,
      version: att.version || 1,
      versions: Array.isArray(att.versions) ? att.versions : [],
      metadata: att.metadata || undefined
    }))
  }
  if (sub.fileUrl && sub.fileUrl.trim() !== '') {
    return [
      {
        id: `legacy_${sub.id || Date.now()}`,
        fileUrl: sub.fileUrl,
        fileName: sub.fileName || sub.title || 'Berkas',
        fileSize: sub.fileSize || 0,
        fileType: (sub.fileType as any) || 'DOCUMENT',
        storageProvider: sub.storageProvider || 'EXTERNAL_LINK',
        uploadedAt: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : new Date().toISOString(),
        version: 1,
        versions: []
      }
    ]
  }
  return []
}

