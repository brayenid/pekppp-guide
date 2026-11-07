'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  ArrowRight,
  Building2,
  Zap,
  Bot,
  FileCheck2,
  UserCheck,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Calendar,
  Layers,
  Network,
  HelpCircle
} from 'lucide-react'

export default function AlurProsesPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx))
  }

  const workflowSteps = [
    {
      num: '01',
      actorRole: 'Unit Lokus Layanan & Responden',
      actorType: 'Lokus Lapangan',
      title: 'Evaluasi Mandiri (F-01) & Survei Kepuasan (F-03)',
      desc: 'Unit pelayanan melakukan pengisian mandiri 31 indikator kinerja standar pelayanan dan mengunggah berkas bukti dukung digital (F-01). Bersamaan dengan proses tersebut, unit lokus mendistribusikan kuesioner survei F-03 kepada masyarakat penerima layanan hingga memenuhi kuota target responden.',
      deliverable: 'Formulir F-01, berkas PDF eviden terunggah, serta tabulasi kuesioner survei F-03 terhimpun.',
      tag: 'Input Mandiri'
    },
    {
      num: '02',
      actorRole: 'Sistem & Administrator Daerah',
      actorType: 'Asistensi Teknis',
      title: 'Pra-Uji Kelayakan & Uji Petik Awal',
      desc: 'Sistem melakukan validasi kelengkapan berkas F-01 dan pemenuhan survei F-03, mendeteksi indikator yang belum memiliki dokumen pendukung, dan memberikan asistensi penelaahan awal agar lokus dapat memperbaiki berkas sebelum evaluasi lapangan.',
      deliverable: 'Laporan kelengkapan dokumen dan rekomendasi pemenuhan awal.',
      tag: 'Quality Gate'
    },
    {
      num: '03',
      actorRole: 'Tim Evaluator Bagian Organisasi Setdakab',
      actorType: 'Evaluator Kabupaten',
      title: 'Verifikasi Dokumen & Penilaian Sementara Daerah (F-02)',
      desc: 'Tim evaluator kabupaten memeriksa keabsahan dokumen eviden, membuka dialog klarifikasi faktual dengan penanggung jawab lokus, melaksanakan uji petik lapangan, dan memberikan skor penilaian sementara tingkat kabupaten (belum menetapkan nilai akhir).',
      deliverable: 'Skor sementara F-02 (75% bobot IPP) dan Berita Acara Hasil Evaluasi Kabupaten.',
      tag: 'Verifikasi Lapangan'
    },
    {
      num: '04',
      actorRole: 'Biro Organisasi Setda Provinsi',
      actorType: 'Pemerintah Provinsi',
      title: 'Penyampaian & Validasi Tingkat Provinsi',
      desc: 'Hasil evaluasi dan penilaian sementara dari tingkat kabupaten disampaikan ke Biro Organisasi Pemerintah Provinsi untuk ditelaah, divalidasi keabsahannya, dan diselaraskan lintas wilayah kabupaten/kota.',
      deliverable: 'Berita Acara/Rekomendasi Validasi Provinsi dan berkas evaluasi terharmonisasi.',
      tag: 'Sinkronisasi Wilayah'
    },
    {
      num: '05',
      actorRole: 'Kementerian PAN-RB',
      actorType: 'Otoritas Nasional',
      title: 'Pengolahan Akhir & Penetapan Hasil Nasional',
      desc: 'Kementerian PAN-RB mengolah seluruh data evaluasi terpadu (skor kompilasi 100%), menetapkan nilai akhir definitif dan predikat mutu pelayanan publik (kategori A, B, atau C), serta menerbitkan sertifikat dan lembar rekomendasi perbaikan resmi.',
      deliverable: 'Nilai IPP Definitif 100%, Sertifikat Predikat Mutu, & Lembar Rekomendasi MenPAN-RB.',
      tag: 'Ketetapan Hukum'
    }
  ]

  const workflowFaqs = [
    {
      q: 'Bagaimana jika terdapat bukti dukung yang dinyatakan belum memenuhi syarat?',
      a: 'Evaluator akan memberikan catatan telaah resmi pada instrumen penilaian. Unit lokus diberikan rentang waktu klarifikasi untuk memperbarui dokumen atau mengunggah bukti tambahan sebelum batas waktu (cut-off) penutupan periode evaluasi daerah.'
    },
    {
      q: 'Apakah dokumen yang sudah diunggah tahun lalu harus diunggah ulang dari nol?',
      a: 'Mekanisme Living Document berfungsi sebagai fallback (penopang cadangan) agar lokus tidak memulai dari nol jika dokumen permanen regulasinya belum berubah. Namun, untuk dokumen eviden yang sifatnya dinamis dan terus berkembang (seperti sarana prasarana/fasilitas, Standar Pelayanan, laporan Forum Konsultasi Publik, dan laporan pengaduan), sangat disarankan untuk dimutakhirkan agar hasil evaluasi mencerminkan kondisi eksisting terkini dan memperoleh penilaian maksimal.'
    },
    {
      q: 'Apakah skor di portal ini langsung menjadi nilai akhir resmi MenPAN-RB?',
      a: 'Portal PEKPPP.ext berfungsi sebagai platform pra-evaluasi dan verifikasi tingkat kabupaten untuk memastikan kualitas eviden telah memenuhi standar sebelum disinkronkan ke web resmi evaluasi.menpan.go.id. Nilai definitif 100% dan predikat resmi tetap ditetapkan oleh Kementerian PAN-RB.'
    },
    {
      q: 'Kapan cut-off pengunggahan berkas eviden diberlakukan?',
      a: 'Jadwal cut-off ditetapkan melalui Surat Edaran Sekretaris Daerah yang mengacu pada kalender evaluasi Kementerian PAN-RB. Begitu batas waktu tercapai, portal akan mengunci mode penyuntingan lokus dan mengalihkan status ke masa verifikasi evaluator.'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Alur &amp; Mekanisme PEKPPP"
        description="Tata laksana penyelenggaraan Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP) Kabupaten Kutai Barat dari tahap pengisian mandiri oleh unit kerja hingga penetapan predikat mutu nasional."
      />

      {/* ── Ringkasan Regulasi & Dasar Hukum Operasional ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-surface">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 border border-line">
            <BookOpen className="w-4 h-4 text-brand" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Landasan Regulasi</div>
            <div className="text-xs font-semibold text-ink leading-snug">PermenPAN-RB No. 29/2022</div>
            <div className="text-[11px] text-ink-secondary">Pedoman evaluasi kinerja penyelenggara publik</div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-surface">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 border border-line">
            <ShieldCheck className="w-4 h-4 text-brand" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Cakupan Evaluasi</div>
            <div className="text-xs font-semibold text-ink leading-snug">6 Aspek &bull; 31 Indikator</div>
            <div className="text-[11px] text-ink-secondary">Instrumen baku F-01, F-02, dan F-03</div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-surface">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 border border-line">
            <Calendar className="w-4 h-4 text-brand" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Siklus Penilaian</div>
            <div className="text-xs font-semibold text-ink leading-snug">Tahunan (Annual Cycle)</div>
            <div className="text-[11px] text-ink-secondary">Penilaian daerah dilanjutkan penetapan pusat</div>
          </div>
        </div>
      </div>

      {/* ── 1. Kedudukan & Batasan Wewenang Sistem ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>Kedudukan &amp; Batasan Wewenang Penyelenggaraan</span>
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Pembagian peran yang jelas antara platform pendamping daerah dan sistem definitif kementerian.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand px-2.5 py-0.5 bg-brand-light dark:bg-brand/15 rounded-md">
                Tingkat Daerah (Kabupaten)
              </span>
              <span className="text-[11px] text-ink-muted font-mono">Fase Pra-Evaluasi</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
              Peran Portal PEKPPP.ext &amp; Bagian Organisasi
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Bertindak sebagai ruang kurasi eviden, pendampingan uji petik mandiri, dan simulasi skor awal 31 indikator. Bagian Organisasi Setdakab memastikan seluruh lokus siap dokumen sebelum batas waktu (cut-off) penguncian instrumen nasional.
            </p>
            <div className="pt-2 border-t border-line/60 flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span>Menghasilkan Skor Sementara F-02 (Bobot 75% Tahap Awal)</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300 px-2.5 py-0.5 bg-sky-50 dark:bg-sky-950/40 rounded-md border border-sky-200/60 dark:border-sky-800/40">
                Tingkat Nasional
              </span>
              <a
                href="https://evaluasi.menpan.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline">
                <span>evaluasi.menpan.go.id</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
              Otoritas Penetapan Kementerian PAN-RB
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Kementerian PAN-RB memegang kewenangan mutlak dalam penetapan nilai Indeks Pelayanan Publik (IPP) 100%, konversi predikat (A, B, C), serta penerbitan piagam dan rekomendasi resmi perbaikan tata kelola bagi kepala daerah.
            </p>
            <div className="pt-2 border-t border-line/60 flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span>SK MenPAN-RB &bull; Predikat Definitif Pelayanan Publik</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Bagan Visual Alur Terpadu (Grafik Alur Kerja) ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-brand" />
            <span>Bagan Visual Alur Penyelenggaraan Evaluasi</span>
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
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand" />
            <span>Tahapan Evaluasi (Alur Berjenjang)</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Rangkaian kerja terstruktur dari persiapan dokumen oleh unit lokus hingga penetapan indeks definitif.
          </p>
        </div>

        <div className="space-y-3">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="p-4 sm:p-5 rounded-xl bg-surface border border-line transition-colors hover:border-brand/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/50 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-brand bg-brand-light dark:bg-brand/20 px-2 py-0.5 rounded border border-brand/20">
                    {step.num}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">
                    {step.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-medium text-ink-muted bg-surface-subtle px-2 py-0.5 rounded border border-line">
                    {step.actorRole}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand px-2 py-0.5 bg-brand-light dark:bg-brand/15 rounded">
                    {step.tag}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {step.desc}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs bg-surface-subtle/50 px-3 py-2 rounded-lg border border-line/60">
                <span className="font-semibold text-ink-secondary shrink-0">Dokumen Keluaran:</span>
                <span className="text-ink-muted">{step.deliverable}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Pertanyaan Kerap Diajukan (FAQ Accordion) ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand" />
            <span>Pertanyaan Kerap Diajukan Seputar Alur Kerja</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Pedoman praktis mengenai ketentuan eviden, batas waktu pengunggahan, dan validitas hasil evaluasi.
          </p>
        </div>

        <div className="space-y-2.5">
          {workflowFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className="rounded-xl bg-surface border border-line overflow-hidden transition-colors hover:border-brand/30">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 sm:p-4.5 flex items-center justify-between gap-3 font-medium transition-colors select-none">
                  <span className="text-xs sm:text-sm font-semibold text-ink">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-brand' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 sm:px-4.5 sm:pb-4.5 border-t border-line/60 bg-surface-subtle/30">
                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 5. Quick Links & Navigasi Terkait ── */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-brand uppercase tracking-wider">Akses Terkait</div>
          <h4 className="text-sm font-semibold text-ink">Pelajari Rincian Kriteria 31 Indikator</h4>
          <p className="text-xs text-ink-secondary">
            Lihat daftar lengkap indikator kinerja standar pelayanan, bobot aspek, dan syarat berkas dukung digital pada Wiki Evaluasi.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors">
            <span>Buka Wiki Indikator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
