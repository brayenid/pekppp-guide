// src/core/domain/evidence-slots-preset.ts
// Definisi Master Slot Bukti Dukung Terarah (Mandatory & Additional) per Indikator/Aspek

export interface EvidenceSlotPreset {
  aspectCode: string
  slotKey: string
  title: string
  description: string
  isMandatory: boolean
  orderIndex: number
  documentType: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT' | 'HYBRID'
  exampleImages?: string[]
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
    exampleImages: ['/images/kebijakan-pelayanan/1/contoh-sk-sp.png', '/images/kebijakan-pelayanan/1/sp-2.jpeg']
  },
  {
    aspectCode: 'I',
    slotKey: 'ba_fkp',
    title: 'Berita Acara, Notulensi, dan Daftar Hadir FKP',
    description: 'Bukti pelibatan masyarakat dalam penyusunan / peninjauan SP: Berita Acara FKP bertanda tangan para pihak, daftar hadir, notulensi, dan foto dokumentasi kegiatan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'HYBRID',
    exampleImages: ['/images/kebijakan-pelayanan/2/ba-fkp.png', '/images/kebijakan-pelayanan/2/ba-fkp-ttd.png', '/images/kebijakan-pelayanan/4/fkp-tanggal.png']
  },
  {
    aspectCode: 'I',
    slotKey: 'publikasi_sp',
    title: 'Bukti Publikasi Komponen Service Delivery',
    description: 'Dokumentasi / tangkapan layar publikasi Standar Pelayanan di berbagai kanal (Website resmi, media sosial, banner/baliho fisik, dan SIPPN).',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'HYBRID',
    exampleImages: ['/images/kebijakan-pelayanan/3/ss-sippn.png', '/images/kebijakan-pelayanan/3/ss-ig.png']
  },
  {
    aspectCode: 'I',
    slotKey: 'maklumat_pelayanan',
    title: 'Foto & Publikasi Maklumat Pelayanan',
    description: 'Foto bukti penempatan Maklumat Pelayanan secara fisik di ruang layanan serta publikasi di kanal digital atau dokumen penetapan.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'HYBRID',
    exampleImages: ['/images/kebijakan-pelayanan/5/maklumat.png', '/images/kebijakan-pelayanan/5/maklumat-fisik.png', '/images/kebijakan-pelayanan/5/maklumat-ig.png']
  },
  {
    aspectCode: 'I',
    slotKey: 'laporan_skm',
    title: 'Laporan Pelaksanaan & Publikasi SKM',
    description: 'Dokumen laporan hasil Survei Kepuasan Masyarakat (SKM) sesuai PermenPANRB, kuesioner/alat bantu yang dipakai, dan foto/screenshot bukti publikasi hasil nilai SKM.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'HYBRID',
    exampleImages: ['/images/kebijakan-pelayanan/6/skm-laporan.png', '/images/kebijakan-pelayanan/6/publikasi-skm.png', '/images/kebijakan-pelayanan/7/skm-web.png']
  },
  {
    aspectCode: 'I',
    slotKey: 'tindak_lanjut_skm',
    title: 'Laporan Rencana Tindak Lanjut (RTL) Hasil SKM',
    description: 'Laporan rencana aksi tindak lanjut rekomendasi SKM dan bukti laporan realisasi perbaikan pelayanan yang telah dilaksanakan.',
    isMandatory: true,
    orderIndex: 6,
    documentType: 'HYBRID',
    exampleImages: ['/images/kebijakan-pelayanan/6/rtl-skm.png', '/images/kebijakan-pelayanan/8/persentase-rtl-skm.png', '/images/kebijakan-pelayanan/9/kecepatan-tindak-lanjut.png']
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
    exampleImages: ['/images/profesionalisme-sdm/10/sk-jam-kerja.png']
  },
  {
    aspectCode: 'II',
    slotKey: 'kode_etik_budaya',
    title: 'SK Kode Etik dan Kode Perilaku Pelaksana',
    description: 'Dokumen resmi penetapan kode etik, kode perilaku, maklumat budaya pelayanan, dan sosialisasi kepada seluruh aparatur pelayanan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'PDF',
    exampleImages: ['/images/profesionalisme-sdm/11/sk-kode-etik.png']
  },
  {
    aspectCode: 'II',
    slotKey: 'motivasi_kerja',
    title: 'Dokumen Program Peningkatan Motivasi Kerja',
    description: 'Dokumen program pembinaan mental/spiritual, morning briefing, capacity building, sharing session, atau video motivasi internal.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'PDF',
    exampleImages: ['/images/profesionalisme-sdm/12/peningkatan-motivasi.png']
  },
  {
    aspectCode: 'II',
    slotKey: 'reward_punishment',
    title: 'SK Kriteria & Bukti Pemberian Reward / Punishment',
    description: 'SK kriteria pemberian penghargaan/sanksi bagi petugas layanan serta bukti piagam penghargaan (Employee of the Month/Year) atau surat teguran.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'PDF',
    exampleImages: ['/images/profesionalisme-sdm/13/kriteria-pemberian-penghargaan.png']
  },
  {
    aspectCode: 'II',
    slotKey: 'budaya_5s',
    title: 'Dokumentasi Penerapan Budaya Pelayanan 5S',
    description: 'Foto/video penerapan Senyum, Sapa, Salam, Sopan, Santun, pemakaian seragam dinas rapi, ID Card, dan PIN budaya kerja.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'IMAGE',
    exampleImages: ['/images/profesionalisme-sdm/14/penerapan-budaya-pelayanan.png']
  },

  // ==========================================
  // ASPEK III: SARANA & PRASARANA (Q15 - Q20, Q31)
  // ==========================================
  {
    aspectCode: 'III',
    slotKey: 'tempat_parkir',
    title: 'Foto Fasilitas Tempat Parkir & Keamanan',
    description: 'Foto area parkir mobil & motor, rambu parkir, penitipan helm, pembatas parkir, dan kamera pengawas CCTV.',
    isMandatory: true,
    orderIndex: 1,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/15/lap-parkir.png', '/images/sarana-prasarana/15/penitipan-helm.png', '/images/sarana-prasarana/15/cctv.png']
  },
  {
    aspectCode: 'III',
    slotKey: 'ruang_tunggu',
    title: 'Foto Fasilitas Ruang Tunggu Pelayanan',
    description: 'Foto kursi ruang tunggu yang layak, pendingin ruangan/AC/kipas, display nomor antrean, charging station, dan air minum gratis.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/16/kursi.png', '/images/sarana-prasarana/16/no-antrian.png', '/images/sarana-prasarana/16/charging-area.png', '/images/sarana-prasarana/16/air-minum.png']
  },
  {
    aspectCode: 'III',
    slotKey: 'toilet_pengguna',
    title: 'Foto Toilet Pengguna Layanan & Form Monev Kebersihan',
    description: 'Foto toilet pria & wanita terpisah, wastafel, sabun, tempat sampah tertutup, kloset bersih, dan lembar checklist kontrol kebersihan berkala.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/17/toilet.png', '/images/sarana-prasarana/17/wastafel.png', '/images/sarana-prasarana/17/pemisahan.png', '/images/sarana-prasarana/17/monev.png']
  },
  {
    aspectCode: 'III',
    slotKey: 'sarpras_kelompok_rentan',
    title: 'Foto Sarpras Ramah Kelompok Rentan',
    description: 'Foto ramp / jalan landai dengan pegangan rambat, kursi roda, ruang laktasi/menyusui, toilet khusus disabilitas, guiding block tuna netra, dan huruf braille.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/18/jalan-landai.png', '/images/sarana-prasarana/18/kursi-roda.png', '/images/sarana-prasarana/18/ruang-laktasi.png', '/images/sarana-prasarana/18/toilet-khusus.png', '/images/sarana-prasarana/18/guiding-block.png']
  },
  {
    aspectCode: 'III',
    slotKey: 'sarpras_penunjang_k3',
    title: 'Foto Sarpras Penunjang K3 & Mushola',
    description: 'Foto Alat Pemadam Api Ringan (APAR) siap pakai, kotak P3K lengkap obat-obatan, petunjuk jalur evakuasi & titik kumpul, serta mushola/tempat ibadah.',
    isMandatory: true,
    orderIndex: 5,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/19/apar.png', '/images/sarana-prasarana/19/p3k.png', '/images/sarana-prasarana/19/titik-kumpul.png', '/images/sarana-prasarana/19/mushola.png']
  },
  {
    aspectCode: 'III',
    slotKey: 'front_office_antrian',
    title: 'Foto Front Office / Informasi & Sistem Antrean',
    description: 'Foto meja layanan Front Office bagian informasi, SK penugasan petugas FO, dan mesin/display sistem antrean terstruktur.',
    isMandatory: true,
    orderIndex: 6,
    documentType: 'IMAGE',
    exampleImages: ['/images/sarana-prasarana/20/petugas-khusus.png']
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
    exampleImages: ['/images/sipp/21/ss-sippn.png']
  },
  {
    aspectCode: 'IV',
    slotKey: 'sistem_operasional',
    title: 'Screenshot / Dokumentasi Sistem Informasi Layanan',
    description: 'Screenshot modul aplikasi/sistem informasi elektronik yang digunakan untuk operasional pengelolaan data pelayanan publik.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: ['/images/sipp/22/pendukung-layanan.png']
  },
  {
    aspectCode: 'IV',
    slotKey: 'portal_website',
    title: 'Dokumentasi Kualitas Fitur Portal / Website Pelayanan',
    description: 'Dokumentasi rancangan website/portal resmi unit layanan yang user-friendly, responsif, dan mudah diakses masyarakat.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: ['/images/sipp/23/sipp-dimiliki.png']
  },
  {
    aspectCode: 'IV',
    slotKey: 'log_pemutakhiran',
    title: 'Bukti Log Pemutakhiran Data & Informasi Digital',
    description: 'Bukti update berkala data informasi, berita, pengumuman, atau konten pada kanal digital dan website dalam tahun berjalan.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'IMAGE',
    exampleImages: ['/images/sipp/24/pemutakhiran-data.png']
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
    exampleImages: ['/images/konsultasi-pengaduan/25/sk-petugas-pengaduan.png', '/images/konsultasi-pengaduan/25/mekanisme-pengaduan.png']
  },
  {
    aspectCode: 'V',
    slotKey: 'sarana_fisik_pengaduan',
    title: 'Foto Sarana Fisik Pengaduan & Kotak Saran',
    description: 'Foto kotak saran/pengaduan tertutup, meja/ruang khusus konsultasi pengaduan yang menjaga kerahasiaan pelapor.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'IMAGE',
    exampleImages: ['/images/konsultasi-pengaduan/25/kotak-saran.png', '/images/konsultasi-pengaduan/26/pengaduan.png']
  },
  {
    aspectCode: 'V',
    slotKey: 'kanal_span_lapor',
    title: 'Screenshot Aktivitas Kanal SP4N-LAPOR! / Media Digital',
    description: 'Screenshot dashboard pengelolaan akun SP4N-LAPOR!, media sosial, hotline WhatsApp, atau email resmi pengaduan.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'IMAGE',
    exampleImages: ['/images/konsultasi-pengaduan/27/pengelolaan-pengaduan.png']
  },
  {
    aspectCode: 'V',
    slotKey: 'laporan_rekap_pengaduan',
    title: 'Laporan Rekapitulasi & Persentase Tindak Lanjut Pengaduan',
    description: 'Laporan akuntabilitas tahunan rekapitulasi jumlah pengaduan yang masuk, diproses, dan persentase (%) yang berhasil diselesaikan 100%.',
    isMandatory: true,
    orderIndex: 4,
    documentType: 'PDF',
    exampleImages: ['/images/konsultasi-pengaduan/28/persentase-pengaduan.png']
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
    exampleImages: ['/images/inovasi/29/bentuk-inovasi.png']
  },
  {
    aspectCode: 'VI',
    slotKey: 'implementasi_inovasi',
    title: 'Dokumentasi Implementasi & Kemanfaatan Inovasi',
    description: 'Foto, video, infografis, atau laporan evaluasi hasil pelaksanaan inovasi dan dampaknya bagi kemudahan masyarakat penerima layanan.',
    isMandatory: true,
    orderIndex: 2,
    documentType: 'DOCUMENT',
    exampleImages: ['/images/inovasi/30/dukungan-inovasi.png']
  },
  {
    aspectCode: 'VI',
    slotKey: 'dukungan_keberlanjutan',
    title: 'Bukti Dukungan Anggaran, Sarpras, & SDM Inovasi',
    description: 'Dokumen DPA/anggaran yang dialokasikan, sarana prasarana penunjang, dan tim pengelola khusus demi menjamin keberlanjutan inovasi.',
    isMandatory: true,
    orderIndex: 3,
    documentType: 'PDF',
    exampleImages: ['/images/inovasi/30/dukungan-inovasi.png']
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
    exampleImages: []
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

export interface EvidenceAttachmentItem {
  id: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: 'PDF' | 'IMAGE' | 'DOCUMENT' | 'LINK'
  storageProvider?: string
  uploadedAt: string
}

export function extractAttachments(sub: any): EvidenceAttachmentItem[] {
  if (!sub) return []
  if (Array.isArray(sub.attachments) && sub.attachments.length > 0) {
    return sub.attachments as EvidenceAttachmentItem[]
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
        uploadedAt: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : new Date().toISOString()
      }
    ]
  }
  return []
}

