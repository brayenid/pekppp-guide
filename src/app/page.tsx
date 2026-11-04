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
  Newspaper
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

  // 6 Aspek: Distilled without verbose paragraph sentences
  const aspects = [
    {
      code: 'A1',
      name: 'Kebijakan Pelayanan',
      weight: '24%',
      weightValue: 24,
      barColor: 'bg-[#154694]',
      badgeColor: 'bg-[#154694]/10 text-[#154694] dark:bg-[#154694]/20 dark:text-sky-300',
      chips: ['Standar Pelayanan', 'Maklumat', 'SPM', 'SKM']
    },
    {
      code: 'A2',
      name: 'Profesionalisme SDM',
      weight: '25%',
      weightValue: 25,
      barColor: 'bg-brand',
      badgeColor: 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-blue-300',
      chips: ['Kompetensi', 'Kode Etik', 'Budaya Layanan', 'Reward & Sanksi']
    },
    {
      code: 'A3',
      name: 'Sarana & Prasarana',
      weight: '18%',
      weightValue: 18,
      barColor: 'bg-[#2B6CB0]',
      badgeColor: 'bg-[#2B6CB0]/10 text-[#2B6CB0] dark:bg-[#2B6CB0]/20 dark:text-sky-300',
      chips: ['Fasilitas Loket', 'Ramah Rentan & Disabilitas']
    },
    {
      code: 'A4',
      name: 'Sistem Informasi (SIPP)',
      weight: '11%',
      weightValue: 11,
      barColor: 'bg-[#3B82F6]',
      badgeColor: 'bg-[#3B82F6]/10 text-[#3B82F6] dark:bg-[#3B82F6]/20 dark:text-blue-300',
      chips: ['Portal SIPP & Web', 'Keterbukaan Tarif & Alur']
    },
    {
      code: 'A5',
      name: 'Konsultasi & Pengaduan',
      weight: '10%',
      weightValue: 10,
      barColor: 'bg-[#60A5FA]',
      badgeColor: 'bg-[#60A5FA]/10 text-[#2563EB] dark:bg-[#60A5FA]/20 dark:text-blue-200',
      chips: ['Kanal Aduan Langsung', 'Integrasi SP4N-LAPOR!']
    },
    {
      code: 'A6',
      name: 'Inovasi Pelayanan Publik',
      weight: '12%',
      weightValue: 12,
      barColor: 'bg-[#93C5FD]',
      badgeColor: 'bg-[#93C5FD]/20 text-[#1D4ED8] dark:bg-[#93C5FD]/25 dark:text-blue-200',
      chips: ['Terobosan Layanan', 'Replikasi Nasional']
    }
  ]

  // Workflow Stages: Clean 4-step sequence
  const workflowSteps = [
    {
      stepNum: '1',
      formCode: 'Formulir F-01',
      title: 'Evaluasi Mandiri',
      actor: 'Unit Layanan / OPD',
      desc: 'Pada tahap ini, perangkat daerah melakukan pengisian mandiri 31 indikator kinerja standar pelayanan dan mengunggah seluruh berkas bukti dukung digital ke dalam sistem.'
    },
    {
      stepNum: '2',
      formCode: 'Formulir F-02 (Bobot 75%)',
      title: 'Verifikasi & Penilaian Daerah',
      actor: 'Bagian Organisasi Setdakab',
      desc: 'Pada tahap ini, Tim Penilai Kabupaten meneliti berkas eviden, melakukan klarifikasi faktual dan uji petik lapangan, lalu menetapkan skor penilaian daerah.'
    },
    {
      stepNum: '3',
      formCode: 'Formulir F-03 (Bobot 25%)',
      title: 'Survei Kepuasan Masyarakat & Validasi',
      actor: 'Unit Lokus Pelayanan & Pengguna Layanan',
      desc: 'Pada tahap ini, unit lokus secara mandiri menyebarkan kuesioner survei F-03 kepada masyarakat penerima layanan hingga kuota responden terpenuhi, yang kemudian divalidasi dan diharmonisasikan bersama pihak provinsi.'
    },
    {
      stepNum: '4',
      formCode: 'Indeks Pelayanan Publik (IPP)',
      title: 'Penetapan Hasil Nasional',
      actor: 'Kementerian PAN-RB',
      desc: 'Pada tahap ini, Kementerian PAN-RB menetapkan skor kompilasi akhir 100%, predikat mutu pelayanan (A/B/C), serta menerbitkan rekomendasi perbaikan resmi.'
    }
  ]

  return (
    <div className="w-full">
      {/* ── 1. Full-Bleed Hero with Primary Brand Theme in Light Mode, Elegant Deep Dark in Dark Mode ── */}
      <section className="relative w-full bg-gradient-to-br from-[#154E9E] via-[#1D5BB9] to-[#0A2652] dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#080B11] text-white min-h-screen flex flex-col justify-between pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-10 border-b border-white/15 dark:border-white/10 overflow-hidden">
        <ModernVectorBackground className="inset-0" />

        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between flex-1 gap-8 sm:gap-10">
          {/* Institutional Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs shadow-xs">
              <div className="w-5 h-5 relative shrink-0 flex items-center justify-center">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-semibold text-white">Pemkab Kutai Barat</span>
              <span className="text-white/40">•</span>
              <span className="text-sky-100">Bagian Organisasi Setdakab</span>
            </div>

            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs shadow-xs">
              <span className="font-medium text-white">Agenda PEKPPP {activeYear}</span>
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
          <div className="pt-6 sm:pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/15 shrink-0">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                6 Aspek
              </div>
              <p className="text-xs text-sky-200">
                Dimensi Standar Pelayanan
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                {activeIndicatorsDisplay} Butir
              </div>
              <p className="text-xs text-sky-200">
                Indikator Terbobot Baku
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                {activeUnitsDisplay} Unit
              </div>
              <p className="text-xs text-sky-200">
                Lokus Layanan Terdaftar
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
                75% : 25%
              </div>
              <p className="text-xs text-sky-200">
                Bobot F-02 &amp; F-03 (IPP)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Landing Page Content Body ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 lg:space-y-28 py-16 sm:py-24">
        {/* ── 2. Apa yang Dinilai? (3-Column Grid, Clean & Spacious) ── */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              Apa yang Dinilai?
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              6 Aspek standar Kementerian PAN-RB yang menjadi tolok ukur kualitas penyelenggaraan pelayanan publik.
            </p>
          </div>
          <Link
            href="/wiki"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto shrink-0">
            <span>Rincian 31 Indikator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Aspect Tiles (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {aspects.map((aspect) => (
            <div
              key={aspect.code}
              className="bg-surface p-5 sm:p-6 rounded-2xl border border-line hover:border-brand/40 hover:shadow-subtle transition-all flex flex-col justify-between gap-4 group">
              <div className="space-y-3">
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
                      className="text-[11px] font-medium text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded-md border border-line/60">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accent Color Indicator Bar */}
              <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div
                  style={{ width: `${aspect.weightValue * 2.5}%` }}
                  className={`h-full rounded-full ${aspect.barColor}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Tahapan Penyelenggaraan Evaluasi (Pola Selang-Seling) ── */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              Tahapan Penyelenggaraan Evaluasi
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Alur kerja berjenjang dari unit pelayanan hingga penetapan formal kementerian.
            </p>
          </div>
          <Link
            href="/alur-proses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto shrink-0">
            <span>Panduan Alur Lengkap</span>
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
                <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-line hover:border-brand/40 hover:shadow-subtle transition-all space-y-2.5 group">
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

      {/* ── 4. Pintu Akses & Navigasi Cepat (Asymmetric Editorial Portals) ── */}
      <section className="space-y-6 sm:space-y-8">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
            Pusat Akses &amp; Navigasi Cepat
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Pilih tautan langsung sesuai peran dan kebutuhan informasi Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Featured Portal (7 Cols): Dasbor Kerja Evaluasi */}
          <Link
            href={dashboardLink}
            className="md:col-span-6 lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle transition-all flex flex-col justify-between gap-4 group">
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
            className="md:col-span-3 lg:col-span-3 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle transition-all flex flex-col justify-between gap-4 group">
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

          {/* Secondary Portal 2 (3 Cols): Wiki 31 Indikator */}
          <Link
            href="/wiki"
            className="md:col-span-3 lg:col-span-3 p-5 sm:p-6 rounded-2xl bg-surface border border-line hover:border-brand/50 hover:shadow-subtle transition-all flex flex-col justify-between gap-4 group">
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
                Panduan rubrik level 1–5 dan kriteria berkas bukti dukung per aspek.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 5. Potongan Kabar & Publikasi Terbaru ── */}
      {latestArticles.length > 0 && (
        <section className="space-y-6 sm:space-y-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-md bg-amber-500 text-white border border-amber-400"
                            style={{
                              backgroundColor: '#F59E0B',
                              color: '#FFFFFF',
                              borderColor: '#FBBF24',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.45)'
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
