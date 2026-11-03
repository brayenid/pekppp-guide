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
  Scale,
  ImageIcon
} from 'lucide-react'

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

  // Resolve optional uploaded landing images from public/images/landing/
  const heroImageSrc = resolveLandingImage('hero-kubar')
  const fieldImageSrc = resolveLandingImage('verifikasi-lapangan')

  // Determine user dashboard target
  const dashboardLink = currentUser
    ? currentUser.role === 'SUPER_ADMIN'
      ? '/admin'
      : '/opd'
    : '/login'

  const aspects = [
    {
      code: 'A1',
      name: 'Kebijakan Pelayanan',
      weight: '24%',
      weightValue: 24,
      barColor: 'bg-[#154694]',
      desc: 'Standar Pelayanan (SP), maklumat pelayanan, kepatuhan SPM, dan penyelenggaraan Survei Kepuasan Masyarakat (SKM).'
    },
    {
      code: 'A2',
      name: 'Profesionalisme SDM',
      weight: '25%',
      weightValue: 25,
      barColor: 'bg-brand',
      desc: 'Kompetensi aparatur, responsivitas pelayanan, kode etik, budaya pelayanan, serta mekanisme apresiasi dan sanksi.'
    },
    {
      code: 'A3',
      name: 'Sarana & Prasarana',
      weight: '18%',
      weightValue: 18,
      barColor: 'bg-[#2B6CB0]',
      desc: 'Kenyamanan fasilitas layanan, ketersediaan loket, serta kelengkapan sarpras ramah kelompok rentan dan disabilitas.'
    },
    {
      code: 'A4',
      name: 'Sistem Informasi (SIPP)',
      weight: '11%',
      weightValue: 11,
      barColor: 'bg-[#3B82F6]',
      desc: 'Keterbukaan informasi tarif, syarat, dan prosedur melalui website resmi, portal nasional SIPP, dan media informasi.'
    },
    {
      code: 'A5',
      name: 'Konsultasi & Pengaduan',
      weight: '10%',
      weightValue: 10,
      barColor: 'bg-[#60A5FA]',
      desc: 'Penyediaan kanal pengaduan langsung, petugas responsif, integrasi SP4N-LAPOR!, dan tindak lanjut laporan warga.'
    },
    {
      code: 'A6',
      name: 'Inovasi Pelayanan Publik',
      weight: '12%',
      weightValue: 12,
      barColor: 'bg-[#93C5FD]',
      desc: 'Terobosan perbaikan mutu layanan, replikasi inovasi berstandar nasional, dan dampak nyata kemanfaatan bagi publik.'
    }
  ]

  const primaryAspects = aspects.slice(0, 2)
  const secondaryAspects = aspects.slice(2)

  const workflowSteps = [
    {
      step: '01',
      formCode: 'F-01',
      title: 'Evaluasi Mandiri (F-01)',
      actor: 'Unit Kerja / OPD Lokus',
      desc: 'Setiap lokus layanan mengisi instrumen evaluasi mandiri dan melampirkan berkas bukti dukung digital yang relevan sesuai 6 aspek pelayanan.'
    },
    {
      step: '02',
      formCode: 'F-02',
      title: 'Penilaian oleh Kabupaten (F-02)',
      actor: 'Bagian Organisasi Kabupaten',
      desc: 'Pemerintah Kabupaten menilai melalui Tim Evaluator Bagian Organisasi Setdakab dengan menelaah berkas eviden, verifikasi faktual, dan uji petik lapangan.'
    },
    {
      step: '03',
      formCode: 'F-03',
      title: 'Validasi Tingkat Provinsi & Survei',
      actor: 'Biro Organisasi Provinsi',
      desc: 'Biro Organisasi Pemerintah Provinsi memvalidasi hasil penilaian daerah yang dikombinasikan dengan survei persepsi masyarakat (F-03).'
    },
    {
      step: '04',
      formCode: 'IPP',
      title: 'Penetapan Hasil Nilai IPP',
      actor: 'Kementerian PANRB',
      desc: 'Kementerian PAN-RB menetapkan secara definitif kompilasi skor akhir (75% F-02 + 25% F-03), predikat mutu, dan menerbitkan rekomendasi perbaikan nasional.'
    }
  ]

  return (
    <div className="max-w-[1440px] mx-auto space-y-12 sm:space-y-16 pb-10">
      {/* 1. Architectural Split Hero & Visual Dossier */}
      <section className="rounded-3xl border border-line bg-surface overflow-hidden shadow-2xs">
        {/* Top Institutional Identity Strip */}
        <div className="px-5 sm:px-8 lg:px-10 py-3.5 bg-surface-subtle/45 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 relative shrink-0 flex items-center justify-center">
              <Image
                src="/kubar.png"
                alt="Logo Kutai Barat"
                width={24}
                height={24}
                className="w-full h-full object-contain grayscale contrast-125"
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span className="font-semibold text-ink">Pemerintah Kabupaten Kutai Barat</span>
              <span className="text-ink-faint">•</span>
              <span className="text-ink-secondary">Bagian Organisasi Setdakab</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs">
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            <span className="font-medium text-ink">Periode Evaluasi {activeYear}</span>
          </div>
        </div>

        {/* Asymmetric 12-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line">
          {/* Left Column (7 Cols): Primary Institutional Thesis, Actions & Live Telemetry */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-ink leading-snug sm:leading-[1.28] tracking-normal">
                Sistem Evaluasi Kinerja Penyelenggaraan Pelayanan Publik
              </h1>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-[62ch]">
                Portal resmi pemantauan mandiri, verifikasi bukti dukung standar pelayanan, dan pengukuran Indeks Pelayanan Publik (IPP) terpadu bagi seluruh unit lokus di lingkungan Pemerintah Kabupaten Kutai Barat.
              </p>

              {/* Primary & Secondary Action Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={dashboardLink}
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold transition-all shadow-hz-button">
                  <span>{currentUser ? 'Buka Dasbor Saya' : 'Masuk Portal Evaluasi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/hasil"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface hover:bg-surface-subtle border border-line text-ink text-xs sm:text-sm font-semibold transition-all">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  <span>Rekapitulasi Nilai IPP</span>
                </Link>

                <Link
                  href="/alur-proses"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-ink-secondary hover:text-brand text-xs sm:text-sm font-medium transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>Alur Pelaksanaan</span>
                </Link>
              </div>
            </div>

            {/* Integrated Live Telemetry Ledger */}
            <div className="pt-7 border-t border-line grid grid-cols-3 gap-4 sm:gap-6 divide-x divide-line">
              <div className="space-y-1">
                <div className="text-xl sm:text-3xl font-bold text-ink tracking-tight font-mono tabular-nums">
                  6 Aspek
                </div>
                <p className="text-xs font-medium text-ink-secondary">
                  Dimensi Standar Pelayanan
                </p>
              </div>

              <div className="pl-4 sm:pl-6 space-y-1">
                <div className="text-xl sm:text-3xl font-bold text-ink tracking-tight font-mono tabular-nums">
                  {activeIndicatorsDisplay} Butir
                </div>
                <p className="text-xs font-medium text-ink-secondary">
                  Indikator Terbobot Baku
                </p>
              </div>

              <div className="pl-4 sm:pl-6 space-y-1">
                <div className="text-xl sm:text-3xl font-bold text-ink tracking-tight font-mono tabular-nums">
                  {activeUnitsDisplay} Unit
                </div>
                <p className="text-xs font-medium text-ink-secondary">
                  Lokus Layanan Terdaftar
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (5 Cols): Institutional Visual Slot + Instrument Blueprint */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-line bg-surface-subtle/20">
            {/* SLOT GAMBAR 1: Visual Utama Institusional (Hero Photo / Placeholder) */}
            <div className="p-5 sm:p-6">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-line bg-surface-subtle/60 flex flex-col justify-between p-4 sm:p-5 group">
                {heroImageSrc ? (
                  <>
                    <Image
                      src={heroImageSrc}
                      alt="Penyelenggaraan Pelayanan Publik Kabupaten Kutai Barat"
                      fill
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="relative z-10 mt-auto flex items-end justify-between gap-3 text-white">
                      <div>
                        <p className="text-xs font-semibold">Pemkab Kutai Barat</p>
                        <p className="text-[11px] text-sky-100">Evaluasi Pelayanan Publik Terpadu</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-xs text-[10px] font-mono text-white border border-white/15">
                        PEKPPP {activeYear}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Architectural Blueprint Grid Pattern for Placeholder */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-45 pointer-events-none"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                      }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line text-[11px] font-semibold text-ink shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5 text-brand" />
                        <span>Slot Gambar Utama (Hero)</span>
                      </span>
                      <span className="font-mono text-[11px] font-medium text-ink-secondary bg-surface px-2 py-0.5 rounded-md border border-line tabular-nums">
                        16:10 · 1200×750 px
                      </span>
                    </div>

                    <div className="relative z-10 my-auto py-3 space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-ink">
                        Foto Kantor Bupati / Pelayanan Publik Kutai Barat
                      </p>
                      <p className="text-[11px] text-ink-secondary leading-relaxed max-w-[42ch]">
                        Unggah foto gedung pusat pemerintahan atau aktivitas loket pelayanan masyarakat untuk ditampilkan otomatis pada area ini.
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-line/80 text-[11px]">
                      <span className="text-ink-muted">Lokasi berkas:</span>
                      <code className="font-mono text-[11px] font-semibold text-brand bg-surface px-2 py-0.5 rounded border border-line">
                        public/images/landing/hero-kubar.jpg
                      </code>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Instrument Weight Distribution Sheet */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink">
                    Komposisi Bobot Instrumen PEKPPP
                  </span>
                  <span className="font-mono text-xs font-semibold text-brand tabular-nums">
                    Total 100%
                  </span>
                </div>

                {/* Proportional Stacked Bar */}
                <div className="h-2.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-surface border border-line p-0.5">
                  {aspects.map((a) => (
                    <div
                      key={a.code}
                      style={{ width: `${a.weightValue}%` }}
                      title={`${a.code} - ${a.name} (${a.weight})`}
                      className={`h-full first:rounded-l-full last:rounded-r-full ${a.barColor}`}
                    />
                  ))}
                </div>

                {/* Compact 2-Column Specification Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                  {aspects.map((a) => (
                    <div
                      key={a.code}
                      className="py-1 flex items-center justify-between gap-2 text-xs border-b border-line/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-xs shrink-0 ${a.barColor}`} />
                        <span className="font-mono font-semibold text-brand shrink-0">
                          {a.code}
                        </span>
                        <span className="text-ink truncate">{a.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-ink-secondary tabular-nums shrink-0">
                        {a.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesis Formula Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 text-xs text-ink-secondary">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-brand shrink-0" />
                  <span>Formulasi Nilai Akhir IPP</span>
                </div>
                <span className="font-mono font-semibold text-ink tabular-nums">
                  75% F-02 + 25% F-03
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 6 Aspek Standar Pelayanan Publik (Proportional Weighted Matrix) */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-ink leading-snug tracking-normal">
              6 Aspek Standar Pelayanan Publik
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Struktur dimensi penilaian baku yang mengukur kepatuhan regulasi, kapasitas penyelenggara, hingga persepsi kepuasan masyarakat.
            </p>
          </div>
          <Link
            href="/wiki"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start md:self-auto shrink-0">
            <span>Lihat rincian {activeIndicatorsDisplay} indikator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-line bg-line gap-px overflow-hidden shadow-2xs flex flex-col">
          {/* Top Tier: 2 Dominant Pillars (A1 24% & A2 25% = 49% of Total Index) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-line">
            {primaryAspects.map((aspect) => (
              <div
                key={aspect.code}
                className="bg-surface p-6 sm:p-8 flex flex-col justify-between gap-6 hover:bg-surface-subtle/20 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-brand bg-brand-light px-2.5 py-1 rounded-lg border border-brand/20">
                      {aspect.code}
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink px-2.5 py-1 rounded-lg bg-surface-subtle border border-line tabular-nums">
                      Bobot {aspect.weight}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug">
                    {aspect.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {aspect.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-ink-muted font-mono tabular-nums">
                    <span>Proporsi terhadap Indeks</span>
                    <span>{aspect.weight} dari 100%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      style={{ width: `${aspect.weightValue * 2.5}%` }}
                      className="h-full rounded-full bg-brand"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Tier: 4 Operational & Innovation Pillars (A3, A4, A5, A6 = 51% of Total Index) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
            {secondaryAspects.map((aspect) => (
              <div
                key={aspect.code}
                className="bg-surface p-5 sm:p-6 flex flex-col justify-between gap-5 hover:bg-surface-subtle/20 transition-colors">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-brand bg-brand-light px-2 py-0.5 rounded-md border border-brand/20">
                      {aspect.code}
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink px-2 py-0.5 rounded-md bg-surface-subtle border border-line tabular-nums">
                      Bobot {aspect.weight}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
                    {aspect.name}
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {aspect.desc}
                  </p>
                </div>

                <div className="h-1 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    style={{ width: `${aspect.weightValue * 2.5}%` }}
                    className="h-full rounded-full bg-brand/75"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Mekanisme Evaluasi Terpadu (Editorial Split, Field Photo Slot & Sequential Ledger) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column (5 Cols): Context, Field Documentation Slot & Synthesis Equation */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-ink leading-snug tracking-normal">
              Mekanisme Evaluasi Terpadu
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              Tahapan kerja berjenjang: penilaian oleh Bagian Organisasi Kabupaten, validasi Biro Organisasi Provinsi, hingga penetapan resmi oleh Kementerian PAN-RB.
            </p>
          </div>

          {/* Unified Documentary Visual + Synthesis Card */}
          <div className="rounded-3xl border border-line bg-surface overflow-hidden shadow-2xs flex-1 flex flex-col justify-between divide-y divide-line">
            {/* SLOT GAMBAR 2: Dokumentasi Verifikasi Lapangan / Evaluasi */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col">
              <div className="relative w-full aspect-[16/9] flex-1 min-h-[180px] rounded-2xl overflow-hidden border border-line bg-surface-subtle/60 flex flex-col justify-between p-4 group">
                {fieldImageSrc ? (
                  <>
                    <Image
                      src={fieldImageSrc}
                      alt="Dokumentasi Verifikasi Lapangan Tim Penilai PEKPPP"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="relative z-10 mt-auto flex items-end justify-between gap-2 text-white">
                      <span className="text-xs font-semibold">
                        Verifikasi &amp; Uji Petik Lapangan (F-02)
                      </span>
                      <span className="font-mono text-[10px] text-sky-100">
                        Bagian Organisasi
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-45 pointer-events-none"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                      }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line text-[11px] font-semibold text-ink shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5 text-brand" />
                        <span>Slot Dokumentasi Lapangan</span>
                      </span>
                      <span className="font-mono text-[11px] font-medium text-ink-secondary bg-surface px-2 py-0.5 rounded-md border border-line tabular-nums">
                        16:9 · 960×540 px
                      </span>
                    </div>

                    <div className="relative z-10 my-auto py-2 space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-ink">
                        Foto Verifikasi Lapangan / Pendampingan OPD
                      </p>
                      <p className="text-[11px] text-ink-secondary leading-relaxed">
                        Unggah dokumentasi kegiatan uji petik evaluator atau rapat koordinasi PEKPPP bersama perangkat daerah.
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-line/80 text-[11px]">
                      <span className="text-ink-muted">Lokasi berkas:</span>
                      <code className="font-mono text-[11px] font-semibold text-brand bg-surface px-2 py-0.5 rounded border border-line">
                        public/images/landing/verifikasi-lapangan.jpg
                      </code>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Synthesis Score Formulation */}
            <div className="p-5 space-y-3 bg-surface-subtle/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Kompilasi Skor Gabungan</span>
                <span className="font-mono text-xs font-bold text-brand tabular-nums">
                  75% F-02 + 25% F-03 = 100% IPP
                </span>
              </div>

              <div className="h-2 w-full rounded-full overflow-hidden flex gap-0.5 bg-surface border border-line p-0.5">
                <div className="h-full w-3/4 rounded-l-full bg-brand" title="75% Verifikasi F-02" />
                <div className="h-full w-1/4 rounded-r-full bg-[#60A5FA]" title="25% Survei F-03" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-secondary">
                  Berita Acara &amp; Rekomendasi Formal
                </span>
                <Link
                  href="/alur-proses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                  <span>Detail alur pelaksanaan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): 4-Stage Sequential Pipeline Ledger */}
        <div className="lg:col-span-7 rounded-3xl border border-line bg-surface divide-y divide-line overflow-hidden shadow-2xs flex flex-col justify-between">
          {workflowSteps.map((wf) => (
            <div
              key={wf.step}
              className="p-5 sm:p-6 lg:px-7 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-5 items-start hover:bg-surface-subtle/20 transition-colors">
              <div className="sm:col-span-4 flex sm:flex-col items-center sm:items-start justify-between gap-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand bg-brand-light px-2.5 py-1 rounded-lg border border-brand/20 tabular-nums">
                    {wf.step}
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink-secondary">
                    Instrumen {wf.formCode}
                  </span>
                </div>
                <span className="text-xs font-medium text-ink-muted">
                  {wf.actor}
                </span>
              </div>

              <div className="sm:col-span-8 space-y-1.5">
                <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
                  {wf.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  {wf.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Pusat Layanan & Navigasi Cepat (Unified Institutional Command Bar) */}
      <section className="rounded-3xl bg-brand text-white overflow-hidden shadow-sm">
        <div className="px-6 sm:px-8 lg:px-10 py-6 border-b border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-normal">
              Pusat Layanan &amp; Navigasi Cepat
            </h2>
            <p className="text-xs sm:text-sm text-sky-100">
              Pilih pintu akses sesuai peran dan kebutuhan informasi Anda
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-brand text-xs font-semibold hover:bg-sky-50 transition-colors self-start sm:self-auto shrink-0">
            <span>Masuk Akun OPD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/15">
          <Link
            href={dashboardLink}
            className="p-6 sm:p-8 hover:bg-white/[0.08] transition-colors flex flex-col justify-between gap-5 group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-white leading-snug">
                Dasbor Evaluasi OPD
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                Pengisian formulir F-01, kelola repositori berkas master bukti dukung, dan tindak lanjut perbaikan.
              </p>
            </div>
          </Link>

          <Link
            href="/hasil"
            className="p-6 sm:p-8 hover:bg-white/[0.08] transition-colors flex flex-col justify-between gap-5 group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-white leading-snug">
                Rekapitulasi Nilai IPP
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                Peringkat skor Indeks Pelayanan Publik seluruh perangkat daerah Kutai Barat secara transparan.
              </p>
            </div>
          </Link>

          <Link
            href="/wiki"
            className="p-6 sm:p-8 hover:bg-white/[0.08] transition-colors flex flex-col justify-between gap-5 group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-white leading-snug">
                Wiki 31 Indikator
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                Daftar lengkap pertanyaan, skala rubrik level 1–5, dan kriteria bukti dukung terstandarisasi.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
