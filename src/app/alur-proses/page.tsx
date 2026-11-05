import React from 'react'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  ArrowRight,
  Building2,
  Zap,
  Bot,
  FileCheck2,
  UserCheck
} from 'lucide-react'

export const metadata = {
  title: 'Alur & Mekanisme Evaluasi - PEKPPP.ext',
  description: 'Tata laksana alur penyelenggaraan evaluasi kinerja pelayanan publik Kabupaten Kutai Barat dari input mandiri hingga penetapan nasional.'
}

export default function AlurProsesPage() {
  const workflowSteps = [
    {
      num: '01',
      actor: 'Unit Lokus Layanan & Responden',
      title: 'Evaluasi Mandiri (F-01) & Survei Kepuasan (F-03)',
      desc: 'Unit pelayanan melakukan pengisian mandiri 31 indikator kinerja standar pelayanan dan mengunggah berkas bukti dukung digital (F-01). Secara berbarengan, unit lokus menyebarkan kuesioner survei F-03 kepada masyarakat penerima layanan hingga memenuhi kuota target responden.',
      deliverable: 'Formulir F-01 dan eviden terunggah, serta tabulasi kuesioner survei F-03 terhimpun.'
    },
    {
      num: '02',
      actor: 'Sistem & Administrator Daerah',
      title: 'Pra-Uji Kelayakan & Uji Petik Awal',
      desc: 'Sistem melakukan validasi kelengkapan berkas F-01 dan pemenuhan survei F-03, mendeteksi indikator yang belum memiliki dokumen pendukung, dan memberikan asistensi penelaahan awal agar lokus dapat memperbaiki berkas sebelum evaluasi lapangan.',
      deliverable: 'Laporan kelengkapan dokumen dan rekomendasi pemenuhan awal.'
    },
    {
      num: '03',
      actor: 'Tim Evaluator Bagian Organisasi Setdakab',
      title: 'Verifikasi Dokumen & Penilaian Sementara Daerah (F-02)',
      desc: 'Tim evaluator kabupaten memeriksa keabsahan dokumen eviden, membuka dialog klarifikasi faktual dengan penanggung jawab lokus, melaksanakan uji petik lapangan, dan memberikan skor penilaian sementara tingkat kabupaten (belum menetapkan nilai akhir).',
      deliverable: 'Skor sementara F-02 (75% bobot IPP) dan Berita Acara Hasil Evaluasi Kabupaten.'
    },
    {
      num: '04',
      actor: 'Biro Organisasi Setda Provinsi',
      title: 'Penyampaian & Validasi Tingkat Provinsi',
      desc: 'Hasil evaluasi dan penilaian sementara dari tingkat kabupaten disampaikan ke Biro Organisasi Pemerintah Provinsi untuk ditelaah, divalidasi keabsahannya, dan diselaraskan.',
      deliverable: 'Berita Acara/Rekomendasi Validasi Provinsi dan berkas evaluasi terharmonisasi.'
    },
    {
      num: '05',
      actor: 'Kementerian PAN-RB',
      title: 'Pengolahan Akhir & Penetapan Hasil Nasional',
      desc: 'Kementerian PAN-RB mengolah seluruh data evaluasi terpadu (skor kompilasi 100%), menetapkan nilai akhir definitif dan predikat mutu pelayanan publik (kategori A, B, atau C), serta menerbitkan sertifikat dan lembar rekomendasi perbaikan resmi.',
      deliverable: 'Nilai IPP Definitif 100%, Sertifikat Predikat Mutu, & Lembar Rekomendasi MenPAN-RB.'
    }
  ]

  const workflowFaqs = [
    {
      q: 'Bagaimana jika terdapat bukti dukung yang dinyatakan belum memenuhi syarat?',
      a: 'Evaluator akan memberikan catatan telaah resmi pada instrumen penilaian. Unit lokus diberikan rentang waktu klarifikasi untuk memperbarui dokumen atau mengunggah bukti tambahan sebelum batas waktu (cut-off) penutupan periode evaluasi.'
    },
    {
      q: 'Apakah dokumen yang sudah diunggah tahun lalu harus diunggah ulang dari nol?',
      a: 'Tidak perlu. Melalui mekanisme Living Document, dokumen berkategori permanen (seperti SK Standar Pelayanan yang belum mengalami perubahan regulasi) otomatis tersambung ke tahun penilaian aktif. Unit hanya perlu memutakhirkan berkas berkala seperti laporan survei tahunan dan data penanganan pengaduan.'
    },
    {
      q: 'Apakah skor di portal ini langsung menjadi nilai akhir resmi MenPAN-RB?',
      a: 'Portal PEKPPP.ext berfungsi sebagai platform pra-evaluasi dan verifikasi tingkat kabupaten untuk memastikan kualitas eviden telah memenuhi standar sebelum disinkronkan ke web resmi evaluasi.menpan.go.id. Nilai definitif 100% dan predikat resmi tetap ditetapkan oleh Kementerian PAN-RB.'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Alur &amp; Mekanisme Evaluasi Pelayanan Publik"
        description="Tata laksana penyelenggaraan evaluasi kinerja pelayanan publik Kabupaten Kutai Barat dari tahap pengisian mandiri oleh unit kerja hingga penetapan predikat mutu nasional."
      />

      {/* ── 1. Kedudukan & Prinsip Kerja Sistem ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">
            Kedudukan &amp; Prinsip Penyelenggaraan
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Peran PEKPPP.ext sebagai layer pendamping terpadu di lingkungan Pemerintah Kabupaten Kutai Barat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand">
              Inisiatif Mandiri Daerah
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
              Antisipasi Beban &amp; Akselerasi Telaah Eviden
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Dikembangkan oleh Tim Pelayanan Publik &amp; Tata Laksana Bagian Organisasi Setdakab Kutai Barat guna mempermudah asistensi puluhan lokus layanan publik secara transparan, tertib dokumen, dan terstandarisasi.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Sinkronisasi Nasional
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
              Pendamping Resmi evaluasi.menpan.go.id
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Sistem ini berfungsi sebagai ruang pra-evaluasi dan verifikasi internal daerah untuk memastikan seluruh eviden memenuhi rubrik penilaian sebelum dikunci secara resmi pada sistem evaluasi kementerian.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Bagan Visual Alur Terpadu (Grafik Alur Kerja) ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">
            Bagan Visual Alur Penyelenggaraan Evaluasi
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Alur kerja terintegrasi lintas entitas: persiapan dokumen oleh unit lokus, telaah pra-evaluasi sistem, verifikasi daerah, hingga penetapan resmi.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7 lg:p-8 shadow-2xs space-y-8 relative overflow-hidden">
          {/* Top Label */}
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-ink">
              Mekanisme Kolaborasi 3 Fase Penilaian
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary">
              Interaksi berjenjang unit lokus layanan, asistensi sistem, dan tim evaluator daerah.
            </p>
          </div>

          {/* DESKTOP CONNECTED SYSTEM (MULTI-STEP SVG CANVAS) */}
          <div className="hidden lg:block w-full bg-surface-subtle/40 rounded-xl border border-line/80 p-5 overflow-x-auto">
            <svg className="w-full h-auto min-w-[1020px]" viewBox="0 0 1060 590" fill="none">
              <defs>
                <marker id="arrBrand" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#1D5BB9" />
                </marker>
                <marker id="arrMuted" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" fill="#94A3B8" />
                </marker>
              </defs>

              {/* SWIMLANES */}
              {/* Zone 1: Lokus */}
              <rect x="25" y="28" width="310" height="172" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <text x="42" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
                FASE 1: PERSIAPAN &amp; INPUT LOKUS
              </text>

              {/* Zone 2: AI Pre-Evaluator */}
              <rect x="370" y="28" width="265" height="172" rx="14" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="387" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
                FASE 2: ENGINE ASISTENSI &amp; PRA-EVALUASI
              </text>

              {/* Zone 3: Tim Evaluator */}
              <rect x="760" y="28" width="270" height="547" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <text x="777" y="49" fill="#1D5BB9" fontSize="10.5" fontWeight="600" letterSpacing="0.04em" fontFamily="var(--font-google-sans), sans-serif">
                FASE 3: TIM EVALUATOR &amp; PENETAPAN
              </text>

              {/* MAIN FLOW ARROWS */}
              {/* Step 1 -> Step 2 */}
              <line x1="165" y1="125" x2="190" y2="125" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Step 2 -> Step 3 */}
              <line x1="320" y1="125" x2="380" y2="125" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Step 3 -> Gateway 1 */}
              <line x1="620" y1="122" x2="678" y2="122" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* BPMN GATEWAY 1 */}
              <g transform="translate(705, 122)">
                <polygon points="0,-22 22,0 0,22 -22,0" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#1D5BB9" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">?</text>
              </g>

              {/* Gateway 1 -> Step 4 */}
              <line x1="728" y1="122" x2="770" y2="122" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Badge Lengkap */}
              <g transform="translate(750, 104)">
                <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
                <text x="0" y="3.5" fill="#047857" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Lengkap</text>
              </g>

              {/* FEEDBACK LOOP 1 */}
              <path d="M 705 145 L 705 278 L 102 278 L 102 190" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrMuted)" />

              {/* Feedback label 1 */}
              <g transform="translate(360, 278)">
                <rect x="-105" y="-11" width="210" height="22" rx="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <text x="0" y="4" fill="#64748B" fontSize="9.5" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">
                  Bukti Kurang Sesuai &rarr; Perbaiki Bukti
                </text>
              </g>

              {/* EVALUATOR CONNECTORS */}
              {/* Step 4 -> Step 5 */}
              <line x1="895" y1="140" x2="895" y2="165" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Step 5 -> Step 6 */}
              <line x1="895" y1="255" x2="895" y2="280" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Step 6 -> Gateway 2 */}
              <line x1="895" y1="370" x2="895" y2="393" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* BPMN GATEWAY 2 */}
              <g transform="translate(895, 416)">
                <polygon points="0,-22 22,0 0,22 -22,0" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
                <text x="0" y="4.5" fill="#1D5BB9" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">?</text>
              </g>

              {/* Gateway 2 -> Step 7 */}
              <line x1="895" y1="438" x2="895" y2="470" stroke="#1D5BB9" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrBrand)" />

              {/* Badge Sesuai */}
              <g transform="translate(936, 456)">
                <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
                <text x="0" y="3.5" fill="#047857" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Sesuai</text>
              </g>

              {/* FEEDBACK LOOP 2 */}
              <path d="M 873 416 L 102 416 L 102 284" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrMuted)" />

              {/* Feedback label 2 */}
              <g transform="translate(480, 416)">
                <rect x="-92" y="-11" width="184" height="22" rx="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <text x="0" y="4" fill="#64748B" fontSize="9.5" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">
                  Rekomendasi &rarr; Perbaiki Bukti
                </text>
              </g>

              {/* STEP CARDS */}
              {/* STEP 1: Upload Bukti */}
              <g transform="translate(40, 65)">
                <rect width="125" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="44" y="14" width="36" height="36" rx="8" fill="#EEF4FD" />
                <g transform="translate(54, 24) scale(0.68)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 21 15 v 4 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 v -4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </g>
                <text x="62" y="68" fill="#0F172A" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">1. Upload Bukti</text>
                <line x1="16" y1="76" x2="109" y2="76" stroke="#F1F5F9" strokeWidth="1" />
                <text x="62" y="93" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Unggah Dokumen</text>
                <text x="62" y="106" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Lengkap</text>
              </g>

              {/* STEP 2: Cek Kelayakan */}
              <g transform="translate(195, 65)">
                <rect width="125" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="44" y="14" width="36" height="36" rx="8" fill="#EEF4FD" />
                <g transform="translate(54, 24) scale(0.68)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="#1D5BB9" />
                </g>
                <text x="62" y="68" fill="#0F172A" fontSize="10.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">2. Cek Kelayakan</text>
                <line x1="16" y1="76" x2="109" y2="76" stroke="#F1F5F9" strokeWidth="1" />
                <text x="62" y="93" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Validasi Awal</text>
                <text x="62" y="106" fill="#1D5BB9" fontSize="9" fontWeight="500" textAnchor="middle" fontFamily="var(--font-google-sans), sans-serif">Berkas Lokus</text>
              </g>

              {/* STEP 3: Pra-Evaluasi Sistem */}
              <g transform="translate(385, 60)">
                <rect width="235" height="125" rx="14" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
                <rect x="16" y="16" width="38" height="38" rx="10" fill="#EEF4FD" />
                <g transform="translate(26, 26) scale(0.72)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 12 8 V 4 H 8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
                </g>
                <text x="66" y="35" fill="#0F172A" fontSize="11.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">3. Pra-Evaluasi Sistem</text>
                <text x="66" y="49" fill="#1D5BB9" fontSize="9.5" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Penelaahan 31 Indikator</text>
                <line x1="16" y1="67" x2="219" y2="67" stroke="#F1F5F9" strokeWidth="1" />
                <text x="16" y="86" fill="#475569" fontSize="9.5" fontWeight="400" fontFamily="var(--font-google-sans), sans-serif">&bull; Cek kelengkapan eviden</text>
                <text x="16" y="103" fill="#64748B" fontSize="9.5" fontWeight="400" fontFamily="var(--font-google-sans), sans-serif">&bull; Uji kesesuaian instrumen</text>
              </g>

              {/* STEP 4: Penerimaan Eviden */}
              <g transform="translate(775, 55)">
                <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
                <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </g>
                <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">4. Penerimaan Eviden</text>
                <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Tim Evaluator Membuka Berkas</text>
                <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Menerima data siap uji per aspek dari lokus</text>
              </g>

              {/* STEP 5: Analisis Penilaian Awal */}
              <g transform="translate(775, 170)">
                <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#1D5BB9" strokeWidth="1.5" />
                <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
                <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 12 8 V 4 H 8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M 2 14 h 2 M 20 14 h 2 M 15 13 v 2 M 9 13 v 2" />
                </g>
                <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">5. Penelaahan Awal</text>
                <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Asistensi &amp; Prediksi Skor</text>
                <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Memperoleh gambaran awal kualitas dokumen</text>
              </g>

              {/* STEP 6: Verifikasi & Uji Petik Faktual */}
              <g transform="translate(775, 285)">
                <rect width="240" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="14" y="14" width="34" height="34" rx="8" fill="#EEF4FD" />
                <g transform="translate(23, 23) scale(0.65)" stroke="#1D5BB9" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="m 9 12 2 2 4-4" />
                </g>
                <text x="58" y="31" fill="#0F172A" fontSize="10.5" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">6. Verifikasi &amp; Uji Petik</text>
                <text x="58" y="45" fill="#1D5BB9" fontSize="9" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Penilaian Sementara Tim Daerah (75%)</text>
                <line x1="14" y1="56" x2="226" y2="56" stroke="#F1F5F9" strokeWidth="1" />
                <text x="14" y="71" fill="#64748B" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Klarifikasi eviden &amp; penilaian sementara daerah</text>
              </g>

              {/* STEP 7: Rekomendasi & Penetapan Akhir */}
              <g transform="translate(775, 475)">
                <rect width="240" height="85" rx="14" fill="#1D5BB9" stroke="#154694" strokeWidth="1" />
                <rect x="14" y="14" width="36" height="36" rx="8" fill="rgba(255,255,255,0.18)" />
                <g transform="translate(24, 24) scale(0.65)" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 16 21 v-2 a 4 4 0 0 0-4-4 H 6 a 4 4 0 0 0-4 4 v 2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" stroke="#FFFFFF" />
                </g>
                <text x="60" y="31" fill="#FFFFFF" fontSize="11" fontWeight="600" fontFamily="var(--font-google-sans), sans-serif">7. Validasi &amp; Nilai Akhir</text>
                <text x="60" y="45" fill="#BAE6FD" fontSize="9.5" fontWeight="500" fontFamily="var(--font-google-sans), sans-serif">Validasi Provinsi &rarr; MenPAN-RB</text>
                <line x1="14" y1="56" x2="226" y2="56" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                <text x="14" y="71" fill="#E0F2FE" fontSize="9" fontFamily="var(--font-google-sans), sans-serif">Divalidasi provinsi &amp; nilai akhir oleh MenPAN-RB</text>
              </g>
            </svg>
          </div>

          {/* MOBILE & TABLET STEP-BY-STEP VERTICAL FLOW */}
          <div className="block lg:hidden space-y-3.5 relative pl-6 border-l-2 border-dashed border-brand/40">
            {/* Step 1 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
              <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">Fase 1: Lokus Layanan</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand" /> 1. Upload Bukti Lengkap
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Unit pelayanan mengunggah berkas eviden digital secara tertib untuk 31 indikator kinerja.
              </p>
            </div>

            {/* Step 2 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
              <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">Fase 1: Lokus Layanan</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand" /> 2. Uji Kelayakan Mandiri
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Unit memeriksa kelengkapan sebelum diverifikasi oleh tim penilai daerah.
              </p>
            </div>

            {/* Step 3 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-brand/40 shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/20 animate-pulse" />
              <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">Fase 2: Asistensi Sistem</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand" /> 3. Pra-Evaluasi &amp; Asistensi
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Sistem meneliti kepatuhan dokumen. Jika terdapat kekurangan, eviden dapat segera diperbaiki oleh lokus.
              </p>
            </div>

            {/* Step 4 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-ink-muted ring-4 ring-ink-muted/15" />
              <div className="font-semibold text-[11px] text-ink-muted tracking-wider uppercase">Fase 3: Tim Evaluator</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-brand" /> 4. Penerimaan &amp; Telaah Dokumen
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Tim Evaluator Bagian Organisasi Setdakab memeriksa berkas bukti yang telah terunggah.
              </p>
            </div>

            {/* Step 5 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-brand/40 shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
              <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">Fase 3: Tim Evaluator</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand" /> 5. Analisis Penilaian Awal
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Evaluator meninjau rekomendasi instrumen dan perkiraan capaian nilai per aspek secara komprehensif.
              </p>
            </div>

            {/* Step 6 Mobile */}
            <div className="space-y-1.5 relative bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/15" />
              <div className="font-semibold text-[11px] text-brand tracking-wider uppercase">Fase 3: Tim Evaluator</div>
              <div className="font-semibold text-sm text-ink flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-brand" /> 6. Verifikasi &amp; Uji Petik Faktual
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Verifikasi faktual di lapangan dan pemberian skor penilaian sementara daerah (F-02).
              </p>
            </div>

            {/* Step 7 Mobile */}
            <div className="space-y-1.5 relative bg-brand text-white p-4 rounded-xl shadow-sm">
              <span className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand ring-4 ring-brand/30" />
              <div className="font-semibold text-[11px] text-sky-200 tracking-wider uppercase">Validasi &amp; Penetapan</div>
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-200" /> 7. Validasi Provinsi &amp; SK MenPAN-RB
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                Hasil evaluasi divalidasi oleh Biro Organisasi Provinsi, kemudian diolah dan ditetapkan nilai akhirnya oleh Kementerian PAN-RB.
              </p>
            </div>
          </div>

          {/* Detailed Summary 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-line text-xs">
            <div className="p-4 rounded-xl bg-surface-subtle/40 border border-line space-y-2">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Building2 className="w-4 h-4 text-brand" />
                <span>1. Peran Unit Lokus</span>
              </div>
              <p className="text-ink-secondary leading-relaxed">
                Pengisian mandiri dan tertib eviden 31 indikator (F-01) serta penyebaran survei kepuasan (F-03) kepada pengguna layanan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle/40 border border-line space-y-2">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Bot className="w-4 h-4 text-brand" />
                <span>2. Peran Asistensi Sistem</span>
              </div>
              <p className="text-ink-secondary leading-relaxed">
                Memvalidasi kelengkapan dokumen lokus, mendeteksi eviden yang hilang, dan memberikan rekomendasi penguatan sebelum uji petik.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle/40 border border-line space-y-2">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <UserCheck className="w-4 h-4 text-brand" />
                <span>3. Evaluator &amp; Penetapan</span>
              </div>
              <p className="text-ink-secondary leading-relaxed">
                Bagian Organisasi memberikan skor sementara (F-02), divalidasi oleh Biro Organisasi Provinsi, dan diolah oleh Kementerian PAN-RB untuk penetapan nilai akhir definitif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Detail Tahapan Kerja Berjenjang ── */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">
            Tahapan Evaluasi (Alur Berjenjang)
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Rangkaian kerja terstruktur dari persiapan dokumen oleh unit lokus hingga penetapan indeks definitif.
          </p>
        </div>

        <div className="space-y-4">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-3 transition-colors hover:border-brand/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm sm:text-base font-bold text-brand bg-brand-light dark:bg-brand/20 px-2.5 py-1 rounded-lg">
                    {step.num}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-ink">
                    {step.title}
                  </h3>
                </div>
                <span className="text-xs font-medium text-ink-muted self-start sm:self-auto">
                  {step.actor}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed pl-0 sm:pl-11">
                {step.desc}
              </p>

              <div className="pt-2 pl-0 sm:pl-11 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                <span><strong>Keluaran:</strong> {step.deliverable}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Pertanyaan Kerap Diajukan (FAQ) ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">
            Pertanyaan Kerap Diajukan Seputar Alur Kerja
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Informasi penting terkait perbaikan bukti dukung, batas waktu, dan validitas hasil evaluasi.
          </p>
        </div>

        <div className="space-y-3">
          {workflowFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-2">
              <h3 className="text-sm font-semibold text-ink">
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Footer Link ── */}
      <div className="p-6 rounded-2xl bg-surface-subtle border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-ink">Pelajari Rincian Kriteria Penilaian</h4>
          <p className="text-xs text-ink-secondary">Lihat daftar 31 indikator kinerja dan syarat dokumen bukti dukung pada Wiki Indikator.</p>
        </div>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shrink-0 self-start sm:self-auto shadow-2xs">
          <span>Buka Wiki Indikator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
