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
  Sparkles
} from 'lucide-react'
import { ModernVectorBackground } from '../components/ui/ModernVectorBackground'

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

  // Resolve optional uploaded custom landing images
  const heroImageSrc = resolveLandingImage('hero-kubar')

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

  // Workflow Stages with alternating layout configuration
  const workflowSteps = [
    {
      step: '01',
      formCode: 'F-01',
      title: 'Evaluasi Mandiri',
      actor: 'OPD / Unit Lokus',
      badgeText: 'Input Mandiri',
      desc: 'Pengisian mandiri 31 indikator kinerja dan pengunggahan berkas bukti dukung digital.',
      sideTag: 'Tahap Awal: Formulir F-01 & Dokumen Eviden',
      sideNote: 'Unit lokus memvalidasi ketersediaan data dukung sebelum audit lapangan.'
    },
    {
      step: '02',
      formCode: 'F-02',
      title: 'Penilaian & Verifikasi Daerah',
      actor: 'Bagian Organisasi Setdakab',
      badgeText: 'Porsi 75% IPP',
      desc: 'Pemeriksaan telaah berkas eviden, klarifikasi dokumen faktual, serta uji petik lapangan oleh Tim Penilai Kabupaten.',
      sideTag: 'Tahap Verifikasi: Uji Petik & Berita Acara',
      sideNote: 'Evaluator kabupaten memberikan skor objektif berbobot 75% terhadap hasil akhir.'
    },
    {
      step: '03',
      formCode: 'F-03',
      title: 'Validasi Provinsi & Survei SKM',
      actor: 'Biro Organisasi Prov. Kaltim',
      badgeText: 'Porsi 25% IPP',
      desc: 'Harmonisasi dan validasi hasil penilaian kabupaten yang dikombinasikan dengan survei persepsi masyarakat (F-03).',
      sideTag: 'Tahap Validasi: Survei Persepsi Publik',
      sideNote: 'Memastikan integritas hasil melalui persepsi langsung dari pengguna layanan.'
    },
    {
      step: '04',
      formCode: 'IPP',
      title: 'Penetapan Hasil Nasional',
      actor: 'Kementerian PAN-RB',
      badgeText: 'Skor Definitif 100%',
      desc: 'Penetapan definitif skor kompilasi (75% F-02 + 25% F-03), predikat mutu (A/B/C), dan penerbitan rekomendasi perbaikan resmi.',
      sideTag: 'Tahap Akhir: Keputusan MenPAN-RB',
      sideNote: 'Menjadi dasar indeks reformasi birokrasi dan akuntabilitas pelayanan publik nasional.'
    }
  ]

  return (
    <div className="max-w-[1360px] mx-auto space-y-12 sm:space-y-14 pb-14">
      {/* ── 1. Compact Hero with Modern Cartographic Vector Canvas ────────── */}
      <section className="relative rounded-3xl border border-line bg-surface overflow-hidden shadow-xs">
        <ModernVectorBackground />

        <div className="relative z-10 p-6 sm:p-9 lg:p-11 flex flex-col gap-6 sm:gap-8">
          {/* Institutional Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-subtle/80 backdrop-blur-xs border border-line text-xs">
              <div className="w-5 h-5 relative shrink-0 flex items-center justify-center">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-semibold text-ink">Pemkab Kutai Barat</span>
              <span className="text-ink-faint">•</span>
              <span className="text-ink-secondary">Bagian Organisasi Setdakab</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-subtle/80 backdrop-blur-xs border border-line text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-medium text-ink">Agenda PEKPPP {activeYear}</span>
            </div>
          </div>

          {/* Hero Typography & Primary Actions */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink leading-tight tracking-tight">
              Sistem Evaluasi Kinerja Penyelenggaraan Pelayanan Publik
            </h1>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-[65ch]">
              Pusat kendali evaluasi mandiri perangkat daerah, verifikasi berkas bukti dukung standar pelayanan, dan penetapan Indeks Pelayanan Publik (IPP) terpadu di Kabupaten Kutai Barat.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={dashboardLink}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold transition-all shadow-hz-button active:scale-98">
                <span>{currentUser ? 'Buka Dasbor Saya' : 'Masuk Portal Evaluasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/hasil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-line text-ink text-xs sm:text-sm font-semibold transition-all active:scale-98">
                <TrendingUp className="w-4 h-4 text-brand" />
                <span>Rekapitulasi Nilai IPP</span>
              </Link>

              <Link
                href="/alur-proses"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-ink-secondary hover:text-brand text-xs sm:text-sm font-medium transition-colors">
                <BookOpen className="w-4 h-4" />
                <span>Alur Kerja</span>
              </Link>
            </div>
          </div>

          {/* Optional Uploaded Hero Photo Slot (Shown only when image exists) */}
          {heroImageSrc && (
            <div className="relative w-full aspect-[21/9] max-h-[280px] rounded-2xl overflow-hidden border border-line shadow-xs">
              <Image
                src={heroImageSrc}
                alt="Penyelenggaraan Pelayanan Publik Kutai Barat"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="font-semibold drop-shadow-sm">Sentra Layanan Terpadu Kutai Barat</span>
                <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/20">PEKPPP {activeYear}</span>
              </div>
            </div>
          )}

          {/* Integrated Telemetry Row */}
          <div className="pt-6 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-mono tabular-nums">
                6 Aspek
              </div>
              <p className="text-xs text-ink-muted">
                Dimensi Standar Pelayanan
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-mono tabular-nums">
                {activeIndicatorsDisplay} Butir
              </div>
              <p className="text-xs text-ink-muted">
                Indikator Terbobot Baku
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-ink tracking-tight font-mono tabular-nums">
                {activeUnitsDisplay} Unit
              </div>
              <p className="text-xs text-ink-muted">
                Lokus Layanan Terdaftar
              </p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-6 space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-brand tracking-tight font-mono tabular-nums">
                75% : 25%
              </div>
              <p className="text-xs text-ink-muted">
                Bobot F-02 &amp; F-03 (IPP)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 6 Aspek Standar Pelayanan (Compact, Punchy Chips - No Paragraph Bloat) ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
              6 Aspek Standar Pelayanan Publik
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Komposisi bobot baku kementerian dengan fokus indikator kunci di setiap dimensi.
            </p>
          </div>
          <Link
            href="/wiki"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto shrink-0">
            <span>Rincian 31 Indikator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Proportional Stacked Strip (100% Total Breakdown) */}
        <div className="bg-surface p-3 sm:p-3.5 rounded-2xl border border-line flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-secondary">Distribusi Bobot Nilai</span>
            <span className="font-mono font-semibold text-brand">Total 100%</span>
          </div>

          <div className="h-2 w-full rounded-full overflow-hidden flex gap-0.5 bg-surface-subtle p-0.5 border border-line/60">
            {aspects.map((a) => (
              <div
                key={a.code}
                style={{ width: `${a.weightValue}%` }}
                title={`${a.code} - ${a.name} (${a.weight})`}
                className={`h-full first:rounded-l-full last:rounded-r-full ${a.barColor}`}
              />
            ))}
          </div>
        </div>

        {/* 6 Aspect Tiles (Distilled, High-Density Chips, Zero Paragraph Walls) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {aspects.map((aspect) => (
            <div
              key={aspect.code}
              className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-line hover:border-brand/50 hover:shadow-subtle transition-all flex flex-col justify-between gap-3 group">
              <div className="space-y-2">
                {/* Code & Weight Hero Number */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${aspect.badgeColor}`}>
                    {aspect.code}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-ink tabular-nums">
                    {aspect.weight}
                  </span>
                </div>

                {/* Aspect Title */}
                <h3 className="text-xs sm:text-sm font-semibold text-ink leading-snug group-hover:text-brand transition-colors">
                  {aspect.name}
                </h3>

                {/* Distilled Keywords Chips (No verbose sentences) */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {aspect.chips.map((chip) => (
                    <span
                      key={chip}
                      className="text-[10px] font-medium text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-line/50">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accent Color Indicator Bar */}
              <div className="h-1 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div
                  style={{ width: `${aspect.weightValue * 2.5}%` }}
                  className={`h-full rounded-full ${aspect.barColor}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Tahapan Evaluasi: Pola Selang-Seling (Alternating Zigzag Flow) ── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
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

        {/* ── Alternating Zigzag Timeline Spine ──────────────────────────── */}
        <div className="relative">
          {/* Vertical Center Spine Line (Visible on md and larger) */}
          <div
            className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-line"
            aria-hidden="true"
          />

          <div className="space-y-6 md:space-y-8">
            {workflowSteps.map((wf, idx) => {
              const isEven = idx % 2 === 1 // 0=Odd(Left), 1=Even(Right), 2=Odd(Left), 3=Even(Right)

              return (
                <div
                  key={wf.step}
                  className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center">
                  {/* Central Node Badge (Desktop) */}
                  <div
                    className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border-2 border-brand text-brand items-center justify-center font-mono font-bold text-xs shadow-xs"
                    aria-hidden="true">
                    {wf.step}
                  </div>

                  {/* ── SISI KIRI (Col 1) ─────────────────────────────────── */}
                  <div className={`space-y-2 ${isEven ? 'md:order-2 md:pl-6' : 'md:order-1 md:pr-6 md:text-right'}`}>
                    {!isEven ? (
                      /* Card berada di KIRI */
                      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-line hover:border-brand/50 hover:shadow-subtle transition-all text-left space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-light dark:bg-brand/20 text-brand text-xs font-bold font-mono flex items-center justify-center">
                              {wf.step}
                            </span>
                            <span className="font-mono text-xs font-semibold text-ink-secondary">
                              {wf.formCode}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-brand bg-brand-light dark:bg-brand/20 px-2 py-0.5 rounded-full">
                            {wf.badgeText}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h3 className="text-sm sm:text-base font-semibold text-ink">
                            {wf.title}
                          </h3>
                          <p className="text-xs font-medium text-brand">
                            {wf.actor}
                          </p>
                        </div>

                        <p className="text-xs text-ink-secondary leading-relaxed">
                          {wf.desc}
                        </p>
                      </div>
                    ) : (
                      /* Sisi Kiri untuk item genap: Side Info Tag & Context */
                      <div className="hidden md:flex flex-col items-end text-right pr-4 space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <span>{wf.sideTag}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                        <p className="text-[11px] text-ink-muted max-w-[34ch] leading-relaxed">
                          {wf.sideNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── SISI KANAN (Col 2) ────────────────────────────────── */}
                  <div className={`space-y-2 ${isEven ? 'md:order-1 md:pr-6 md:text-left' : 'md:order-2 md:pl-6'}`}>
                    {isEven ? (
                      /* Card berada di KANAN */
                      <div
                        className={`p-4 sm:p-5 rounded-2xl border transition-all text-left space-y-2.5 ${
                          idx === workflowSteps.length - 1
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'bg-surface border-line hover:border-brand/50 hover:shadow-subtle'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-bold font-mono flex items-center justify-center ${
                                idx === workflowSteps.length - 1
                                  ? 'bg-white text-brand'
                                  : 'bg-brand-light dark:bg-brand/20 text-brand'
                              }`}>
                              {wf.step}
                            </span>
                            <span
                              className={`font-mono text-xs font-semibold ${
                                idx === workflowSteps.length - 1 ? 'text-sky-100' : 'text-ink-secondary'
                              }`}>
                              {wf.formCode}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              idx === workflowSteps.length - 1
                                ? 'bg-white/20 text-white border border-white/25'
                                : 'text-brand bg-brand-light dark:bg-brand/20'
                            }`}>
                            {wf.badgeText}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h3
                            className={`text-sm sm:text-base font-semibold ${
                              idx === workflowSteps.length - 1 ? 'text-white' : 'text-ink'
                            }`}>
                            {wf.title}
                          </h3>
                          <p
                            className={`text-xs font-medium ${
                              idx === workflowSteps.length - 1 ? 'text-sky-200' : 'text-brand'
                            }`}>
                            {wf.actor}
                          </p>
                        </div>

                        <p
                          className={`text-xs leading-relaxed ${
                            idx === workflowSteps.length - 1 ? 'text-sky-100' : 'text-ink-secondary'
                          }`}>
                          {wf.desc}
                        </p>
                      </div>
                    ) : (
                      /* Sisi Kanan untuk item ganjil: Side Info Tag & Context */
                      <div className="hidden md:flex flex-col items-start pl-4 space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{wf.sideTag}</span>
                        </span>
                        <p className="text-[11px] text-ink-muted max-w-[34ch] leading-relaxed">
                          {wf.sideNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Pintu Akses & Navigasi Cepat (Asymmetric Editorial Portals) ── */}
      <section className="space-y-4">
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
    </div>
  )
}
