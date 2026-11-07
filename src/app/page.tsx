import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '../services/db'
import { getCurrentUserAction } from '../actions/auth-actions'
import {
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  Building2,
  FileText,
  CheckCircle2,
  Award,
  Layers,
  Sparkles,
  ImageIcon,
  Calendar,
  Clock,
  Star,
  Newspaper,
  ShieldCheck,
  FolderArchive,
  HelpCircle,
  Network
} from 'lucide-react'
import { ModernVectorBackground } from '../components/ui/ModernVectorBackground'
import { getPublishedArticlesAction } from '../actions/article-actions'

export const revalidate = 0

function resolveLandingImage(baseName: string): string | null {
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  for (const ext of extensions) {
    const fileName = `${baseName}.${ext}`
    const fullPath = path.join(process.cwd(), 'public', 'images', 'landing', fileName)
    if (fs.existsSync(fullPath)) {
      return `/images/landing/${fileName}`
    }
  }
  return null
}

export default async function HomePage() {
  const currentUser = await getCurrentUserAction()
  const activePeriod = await db.evaluationPeriod.findFirst({
    where: { isOpen: true },
    orderBy: { year: 'desc' }
  })
  const activeYear = activePeriod?.year || new Date().getFullYear()

  // Real database counts
  const unitsCount = await db.unit.count({ where: { isActive: true } })
  const evaluationsCount = await db.evaluation.count({ where: { year: activeYear } })
  const indicatorsCount = await db.indicator.count()

  const activeUnitsDisplay = evaluationsCount > 0 ? evaluationsCount : unitsCount
  const activeIndicatorsDisplay = indicatorsCount > 0 ? indicatorsCount : 31

  // Ambil 3 artikel publikasi terbaru untuk etalase landing page
  const latestArticlesRes = await getPublishedArticlesAction({ page: 1, limit: 3 })
  const latestArticles = latestArticlesRes.success && latestArticlesRes.items ? latestArticlesRes.items : []

  // Resolve optional uploaded custom landing images
  const heroImageSrc = fs.existsSync(path.join(process.cwd(), 'public', 'kantor.png'))
    ? '/kantor.png'
    : resolveLandingImage('hero-kubar')

  // Determine user dashboard target
  const dashboardLink = currentUser
    ? currentUser.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/opd'
    : '/login'

  // 6 Aspek: Distilled with light muted pastel accents (Anti-slop & tasteful)
  const aspects = [
    {
      code: 'A1',
      name: 'Kebijakan Pelayanan',
      weight: '24%',
      weightValue: 24,
      bgPastel: 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30',
      badgeColor: 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/40',
      barColor: 'bg-blue-600',
      chips: ['Standar Pelayanan', 'Maklumat', 'SPM', 'SKM']
    },
    {
      code: 'A2',
      name: 'Profesionalisme SDM',
      weight: '25%',
      weightValue: 25,
      bgPastel: 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
      badgeColor: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40',
      barColor: 'bg-emerald-600',
      chips: ['Kompetensi', 'Kode Etik', 'Budaya Layanan', 'Reward & Sanksi']
    },
    {
      code: 'A3',
      name: 'Sarana & Prasarana',
      weight: '18%',
      weightValue: 18,
      bgPastel: 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30',
      badgeColor: 'bg-amber-100/70 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40',
      barColor: 'bg-amber-600',
      chips: ['Fasilitas Loket', 'Ramah Rentan & Disabilitas']
    },
    {
      code: 'A4',
      name: 'Sistem Informasi (SIPP)',
      weight: '11%',
      weightValue: 11,
      bgPastel: 'bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/30',
      badgeColor: 'bg-violet-100/70 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border border-violet-200/60 dark:border-violet-800/40',
      barColor: 'bg-violet-600',
      chips: ['Portal SIPP & Web', 'Keterbukaan Tarif & Alur']
    },
    {
      code: 'A5',
      name: 'Konsultasi & Pengaduan',
      weight: '10%',
      weightValue: 10,
      bgPastel: 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30',
      badgeColor: 'bg-rose-100/70 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-200/60 dark:border-rose-800/40',
      barColor: 'bg-rose-600',
      chips: ['Kanal Aduan Langsung', 'Integrasi SP4N-LAPOR!']
    },
    {
      code: 'A6',
      name: 'Inovasi Pelayanan Publik',
      weight: '12%',
      weightValue: 12,
      bgPastel: 'bg-cyan-50/60 dark:bg-cyan-950/20 hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
      badgeColor: 'bg-cyan-100/70 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border border-cyan-200/60 dark:border-cyan-800/40',
      barColor: 'bg-cyan-600',
      chips: ['Terobosan Layanan', 'Replikasi Nasional']
    }
  ]

  // Workflow Stages: Clean 4-step sequence
  const workflowSteps = [
    {
      stepNum: '1',
      formCode: 'Formulir F-01 & F-03',
      title: 'Evaluasi Mandiri & Survei Responden',
      actor: 'Unit Lokus Layanan & Responden',
      desc: 'Pada tahap ini, perangkat daerah melakukan pengisian mandiri 31 indikator kinerja (F-01) dan mengunggah seluruh berkas bukti dukung digital. Secara berbarengan, kuesioner survei F-03 disebarkan oleh unit lokus untuk diisi oleh responden penerima layanan.'
    },
    {
      stepNum: '2',
      formCode: 'Formulir F-02 (Penilaian Sementara)',
      title: 'Verifikasi & Penilaian Sementara Daerah',
      actor: 'Bagian Organisasi Setdakab',
      desc: 'Pada tahap ini, Tim Penilai Bagian Organisasi Setdakab meneliti berkas eviden, melakukan klarifikasi faktual serta uji petik lapangan, lalu memberikan nilai sementara (belum menetapkan nilai akhir).'
    },
    {
      stepNum: '3',
      formCode: 'Validasi Provinsi',
      title: 'Validasi Hasil Evaluasi Kabupaten',
      actor: 'Biro Organisasi Setda Provinsi',
      desc: 'Pada tahap ini, hasil evaluasi dan penilaian sementara dari tingkat kabupaten disampaikan ke Biro Organisasi Provinsi untuk diverifikasi dan divalidasi kelayakannya.'
    },
    {
      stepNum: '4',
      formCode: 'Indeks Pelayanan Publik (IPP)',
      title: 'Pengolahan & Penetapan Nilai Akhir',
      actor: 'Kementerian PAN-RB',
      desc: 'Pada tahap terakhir, seluruh hasil evaluasi yang telah divalidasi diolah secara nasional oleh Kementerian PAN-RB dan ditetapkan nilai akhirnya (skor kompilasi 100%), predikat mutu pelayanan, serta lembar rekomendasi resmi.'
    }
  ]

  return (
    <div className="w-full">
      {/* ── 1. Full-Bleed Hero with Primary Brand Theme in Light Mode, Elegant Deep Dark in Dark Mode ── */}
      <section className="relative w-full bg-gradient-to-br from-[#154E9E] via-[#1D5BB9] to-[#0A2652] dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#080B11] text-white min-h-screen flex flex-col justify-between pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 border-b border-white/15 dark:border-white/10 overflow-hidden">
        <ModernVectorBackground className="inset-0" />

        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between flex-1 gap-8 sm:gap-10">
          {/* Institutional Top Bar */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <div className="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs shadow-xs shrink-0 whitespace-nowrap">
              <span className="font-medium text-white">
                <span className="hidden sm:inline">Agenda </span>PEKPPP {activeYear}
              </span>
            </div>
          </div>

          {/* Hero Main Content (2-Column Desktop Grid) */}
          <div className="my-auto py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left Column: Typography & Primary Actions */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4 sm:space-y-5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-semibold text-white leading-[1.2] tracking-tight">
                Sistem Evaluasi Mandiri PEKPPP Kabupaten Kutai Barat
              </h1>
              <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-[62ch]">
                Pusat kendali evaluasi mandiri perangkat daerah, verifikasi berkas bukti dukung standar pelayanan, dan penetapan Indeks Pelayanan Publik (IPP) terpadu.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={dashboardLink}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-[#134994] dark:bg-brand dark:hover:bg-brand-hover dark:text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-98">
                  <span>{currentUser ? 'Buka Dasbor Saya' : 'Masuk Portal Evaluasi'}</span>
                  <ArrowRight className="w-4 h-4 text-[#134994] dark:text-white" />
                </Link>

                <Link
                  href="/hasil"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white text-xs sm:text-sm font-semibold transition-all backdrop-blur-xs active:scale-98 shadow-xs">
                  <TrendingUp className="w-4 h-4 text-sky-200" />
                  <span>Rekapitulasi Nilai IPP</span>
                </Link>

                <Link
                  href="/alur-proses"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sky-100 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>Alur Kerja</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Image or Clean Visual Placeholder Frame */}
            <div className="lg:col-span-5 xl:col-span-5 w-full">
              {heroImageSrc ? (
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-xl group">
                  <Image
                    src={heroImageSrc}
                    alt="Penyelenggaraan Pelayanan Publik Kutai Barat"
                    fill
                    priority
                    className="object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold drop-shadow-sm">Sempekat Bersama Kita Pasti Bisa</span>
                    <span className="font-mono text-[11px] bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded border border-white/20">
                      PEKPPP {activeYear}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between p-5 sm:p-6 group">
                  {/* Top Bar of the Mockup / Placeholder Frame */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/40" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/40" />
                      <span className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/40" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-sky-100 bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                      Preview Ilustrasi Layanan
                    </span>
                  </div>

                  {/* Center Graphic & Label */}
                  <div className="my-auto text-center flex flex-col items-center justify-center gap-3 py-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-xs">
                      <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        Placeholder Foto / Ilustrasi
                      </p>
                      <p className="text-xs text-sky-200 max-w-[28ch] mx-auto leading-relaxed">
                        Sentra Pelayanan Publik Terpadu &amp; Maklumat Standar Pelayanan
                      </p>
                    </div>
                  </div>

                  {/* Bottom Status Ribbon */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/15 text-[11px] text-sky-200">
                    <span>Rasio Visual 4:3 / 16:9</span>
                    <span className="font-mono text-white font-medium">PEKPPP {activeYear}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrated Telemetry Row (Pinned to bottom of full height fold) */}
          <div className="pt-6 sm:pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-6 sm:divide-x divide-white/15 shrink-0">
            <div className="p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.06] sm:bg-transparent border border-white/10 sm:border-0 backdrop-blur-xs sm:backdrop-blur-none flex flex-col justify-between space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                6 Aspek
              </div>
              <p className="text-xs text-sky-200 leading-snug">
                Dimensi Standar Pelayanan
              </p>
            </div>

            <div className="p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.06] sm:bg-transparent border border-white/10 sm:border-0 backdrop-blur-xs sm:backdrop-blur-none sm:pl-6 flex flex-col justify-between space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                {activeIndicatorsDisplay} Butir
              </div>
              <p className="text-xs text-sky-200 leading-snug">
                Indikator Terbobot Baku
              </p>
            </div>

            <div className="p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.06] sm:bg-transparent border border-white/10 sm:border-0 backdrop-blur-xs sm:backdrop-blur-none sm:pl-6 flex flex-col justify-between space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                {activeUnitsDisplay} Unit
              </div>
              <p className="text-xs text-sky-200 leading-snug">
                Lokus Layanan Terdaftar
              </p>
            </div>

            <div className="p-3 sm:p-0 rounded-xl sm:rounded-none bg-white/[0.06] sm:bg-transparent border border-white/10 sm:border-0 backdrop-blur-xs sm:backdrop-blur-none sm:pl-6 flex flex-col justify-between space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                75% : 25%
              </div>
              <p className="text-xs text-sky-200 leading-snug">
                Bobot F-02 &amp; F-03 (IPP)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Landing Page Content Body (Alternating Rhythm) ── */}
      <div className="w-full">
        {/* ── 2A. Mengenal PEKPPP ── */}
        <section className="py-14 sm:py-20 max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
              01 &bull; Kerangka Evaluasi
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Apa itu PEKPPP?
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-[80ch]">
              Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik berdasarkan PermenPAN-RB No. 29 Tahun 2022.
            </p>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-2xl border border-line shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                PEKPPP adalah instrumen resmi Kementerian PAN-RB untuk mengukur kepatuhan, kualitas tata kelola, dan efektivitas unit penyelenggara pelayanan publik secara berkala. Penilaian memotret standar pelayanan, kompetensi SDM, ketersediaan sarana prasarana yang ramah kelompok rentan, keterbukaan sistem informasi, responsivitas pengaduan, hingga keberadaan inovasi layanan.
              </p>
              <div className="pt-3 border-t border-line/60 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                <span className="font-semibold text-ink">Komponen Pengukuran:</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Formulir F-01 (Mandiri)</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Formulir F-02 (Evaluator Daerah)</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Formulir F-03 (Survei Pengguna)</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Muara Indeks Pelayanan Publik (IPP)</span>
              </div>
            </div>

            <div className="lg:col-span-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-line/80 bg-surface-subtle/40">
              <Image
                src="/images/landing/tentang-pekppp.png"
                alt="Ilustrasi Standar Evaluasi PEKPPP"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── 2B. Peran & Kedudukan Portal PEKPPP.ext ── */}
        <section className="py-14 sm:py-20 max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
              02 &bull; Kedudukan Sistem
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Apa Peran Website Ini?
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed max-w-[80ch]">
              Platform pra-evaluasi daerah untuk mendampingi perangkat daerah Kabupaten Kutai Barat sebelum sinkronisasi nasional.
            </p>
          </div>

          <div className="bg-surface p-5 sm:p-7 rounded-2xl border border-line shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                Website ini hadir sebagai upaya mengatasi <strong>terfragmentasinya portal</strong> pada tahun-tahun penilaian sebelumnya (di mana ruang pengisian evaluasi, ruang informasi pemenuhan bukti dukung, dan repositori penyimpanan berkas terpisah di berbagai aplikasi dan tautan cloud). PEKPPP.ext <strong>menyatukan ketiganya ke dalam satu sistem kerja terpadu</strong>.
              </p>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Platform ini berfungsi sebagai ruang pra-evaluasi internal daerah, bukan pengganti portal resmi <em>evaluasi.menpan.go.id</em>. Melalui sistem ini, unit lokus dapat melakukan telaah mandiri, menyiapkan dokumen berkelanjutan (<em>Living Document</em>), serta menerima asistensi dan uji kelayakan awal dari Tim Bagian Organisasi Setdakab agar bukti dukung siap sebelum batas waktu penguncian instrumen kementerian.
              </p>
              <div className="pt-3 border-t border-line/60 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                <span className="font-semibold text-ink">Fokus Platform:</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Pra-Evaluasi Internal</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Penyatuan Arsip &amp; Bukti Dukung</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Asistensi Dini Setdakab</span>
                <span className="bg-surface-subtle px-2 py-0.5 rounded border border-line/60">Penetapan Akhir Tetap di KemenPAN-RB</span>
              </div>
            </div>

            <div className="lg:col-span-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-line/80 bg-surface">
              <Image
                src="/images/landing/peran-website.svg"
                alt="Diagram Unifikasi: Tiga Sistem Masuk Corong Menjadi Satu Layar Terpadu"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        </section>

        {/* ── 3. Apa yang Dinilai? (Full-Bleed White Contrast Section dengan Subtle Grid) ── */}
        <section className="relative w-full bg-surface border-y border-line py-16 sm:py-24">
          {/* Subtle Architectural Pattern */}
          <div
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
                  03 &bull; Dimensi Penilaian
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
                  Apa yang Dinilai?
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  6 Aspek standar Kementerian PAN-RB yang menjadi tolok ukur kualitas penyelenggaraan pelayanan publik.
                </p>
              </div>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto shrink-0">
                <span>Rincian 6 Aspek &amp; 31 Pertanyaan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 6 Aspect Grid: 1 Unified Container, Borderless Seamless Pastels */}
            <div className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 shadow-2xs">
              {aspects.map((aspect) => (
                <div
                  key={aspect.code}
                  className={`${aspect.bgPastel} p-6 sm:p-7 transition-colors flex flex-col justify-between gap-5 group`}>
                  <div className="space-y-3.5">
                    {/* Code & Weight Hero Number */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${aspect.badgeColor}`}>
                        {aspect.code}
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-bold text-ink tabular-nums">
                        {aspect.weight}
                      </span>
                    </div>

                    {/* Aspect Title */}
                    <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug group-hover:text-brand transition-colors">
                      {aspect.name}
                    </h3>

                    {/* Distilled Keywords Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {aspect.chips.map((chip) => (
                        <span
                          key={chip}
                          className="text-[11px] font-medium text-ink bg-white/80 dark:bg-surface/80 px-2 py-0.5 rounded-md shadow-2xs">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Indicator Bar */}
                  <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${aspect.weightValue * 2.5}%` }}
                      className={`h-full rounded-full ${aspect.barColor}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Tahapan Penyelenggaraan Evaluasi ── */}
        <section className="py-16 sm:py-24 max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
                04 &bull; Alur Siklus
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
                Tahapan Penyelenggaraan Evaluasi
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Alur kerja berjenjang dari unit pelayanan hingga penetapan formal kementerian.
              </p>
            </div>
            <Link
              href="/alur-proses"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto shrink-0">
              <span>Buka Diagram Alur Resmi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── Alternating Timeline: 1 Card Per Row (Left - Right) ────────── */}
          <div className="relative py-2">
            {/* Vertical Center Spine Line (Desktop) */}
            <div
              className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px -translate-x-1/2 bg-line"
              aria-hidden="true"
            />

            <div className="space-y-6 md:space-y-10">
              {workflowSteps.map((wf, idx) => {
                const isRight = idx % 2 === 1

                const cardNode = (
                  <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-line hover:border-brand/40 hover:shadow-subtle hover:-translate-y-0.5 transition-all space-y-2.5 group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-brand bg-brand-light dark:bg-brand/20 px-2.5 py-1 rounded-md">
                        {wf.formCode}
                      </span>
                      <span className="text-[11px] font-medium text-ink-muted">
                        {wf.actor}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-ink group-hover:text-brand transition-colors">
                      Tahap {wf.stepNum}: {wf.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                      {wf.desc}
                    </p>
                  </div>
                )

                return (
                  <div
                    key={wf.stepNum}
                    className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-center">
                    {/* Central Node Badge (Desktop) */}
                    <div
                      className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border-2 border-brand text-brand items-center justify-center font-mono font-bold text-xs shadow-xs"
                      aria-hidden="true">
                      {wf.stepNum}
                    </div>

                    {/* Left Column */}
                    {!isRight ? (
                      <div className="md:pr-2">{cardNode}</div>
                    ) : (
                      <div aria-hidden="true" className="hidden md:block" />
                    )}

                    {/* Right Column */}
                    {isRight ? (
                      <div className="md:pl-2">{cardNode}</div>
                    ) : (
                      <div aria-hidden="true" className="hidden md:block" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 5. Pintu Akses & Navigasi Cepat (Full-Bleed Soft Section) ── */}
        <section className="w-full bg-surface-subtle/30 border-t border-line py-16 sm:py-20">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
                05 &bull; Navigasi Cepat
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
                Pusat Akses &amp; Portal Kerja
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                Pilih tautan langsung sesuai peran dan kebutuhan informasi Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Featured Portal (6 Cols): Dasbor Kerja Evaluasi */}
              <Link
                href={dashboardLink}
                className="md:col-span-6 lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-ink group-hover:text-brand transition-colors">
                      Dasbor Kerja Evaluasi
                    </h3>
                    <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                      Pintu Utama
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Pengisian instrumen mandiri F-01 untuk lokus perangkat daerah serta telaah verifikasi F-02 bagi Tim Penilai Bagian Organisasi.
                  </p>
                </div>
              </Link>

              {/* Secondary Portal 1 (3 Cols): Rekapitulasi Nilai IPP */}
              <Link
                href="/hasil"
                className="md:col-span-3 lg:col-span-3 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base text-ink group-hover:text-brand transition-colors">
                    Rekapitulasi IPP
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Publikasi transparan peringkat skor indeks dan predikat mutu seluruh lokus.
                  </p>
                </div>
              </Link>

              {/* Secondary Portal 2 (3 Cols): Wiki Indikator */}
              <Link
                href="/wiki"
                className="md:col-span-3 lg:col-span-3 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base text-ink group-hover:text-brand transition-colors">
                    Wiki Indikator
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Panduan 6 aspek evaluasi, bobot instrumen, dan kriteria berkas bukti dukung.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. Kabar & Publikasi Terbaru ── */}
        {latestArticles.length > 0 && (
          <section className="py-16 sm:py-24 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-brand uppercase">
                  06 &bull; Warta &amp; Sosialisasi
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
                  Kabar Terkini PEKPPP Kutai Barat
                </h2>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Ikuti perkembangan evaluasi, sosialisasi bimtek, serta inovasi pelayanan perangkat daerah.
                </p>
              </div>

              <Link
                href="/kabar"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-ink hover:text-brand text-xs font-semibold transition-all shrink-0 self-start sm:self-auto shadow-2xs group">
                <span>Lihat Semua Artikel</span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => {
              const coverUrl = article.coverImageAsset?.fileUrl
                ? article.coverImageAsset.fileUrl.startsWith('http') ||
                  article.coverImageAsset.fileUrl.startsWith('/')
                  ? article.coverImageAsset.fileUrl
                  : `/api/media/${article.coverImageAsset.id}/preview`
                : null

              return (
                <article
                  key={article.id}
                  className="flex flex-col rounded-2xl bg-surface border border-line shadow-2xs hover:shadow-subtle hover:border-brand/40 transition-all overflow-hidden group">
                  {/* Container Thumbnail dengan Padding Halus */}
                  <div className="p-2 sm:p-2.5 pb-0">
                    <Link
                      href={`/kabar/${article.slug}`}
                      className="relative aspect-video w-full rounded-xl bg-surface-subtle overflow-hidden block">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand/15 to-surface-subtle flex items-center justify-center text-ink-muted">
                          <Newspaper className="w-10 h-10 stroke-[1.2] opacity-30 text-brand" />
                        </div>
                      )}

                      {/* Pinned Star Icon Badge di Kanan Atas */}
                      {article.isFeatured && (
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-amber-500 text-white border border-amber-400"
                            style={{
                              backgroundColor: '#F59E0B',
                              color: '#FFFFFF',
                              borderColor: '#FBBF24'
                            }}
                            title="Artikel Sorotan">
                            <Star
                              className="w-3 h-3 shrink-0"
                              style={{ fill: '#FFFFFF', stroke: '#FFFFFF', color: '#FFFFFF' }}
                            />
                            <span style={{ color: '#FFFFFF' }}>Sorotan</span>
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Intl.DateTimeFormat('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }).format(new Date(article.publishedAt || article.createdAt))}
                        </span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{article.readingTime || 2} min baca</span>
                      </div>

                      <h3 className="text-base font-semibold text-ink line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                        <Link href={`/kabar/${article.slug}`}>{article.title}</Link>
                      </h3>

                      {article.excerpt && (
                        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="pt-1">
                        <Link
                          href={`/kabar`}
                          className="inline-block text-[11px] font-medium text-brand hover:underline">
                          #{article.category.replace(/\s+/g, '')}
                        </Link>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                          {article.authorName.charAt(0)}
                        </div>
                        <span className="text-ink-secondary text-[11px] truncate">
                          {article.authorName}
                        </span>
                      </div>

                      <Link
                        href={`/kabar/${article.slug}`}
                        className="inline-flex items-center gap-1 text-brand font-semibold hover:underline text-xs shrink-0">
                        <span>Baca</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
      </div>
    </div>
  )
}
