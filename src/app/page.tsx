import Link from 'next/link'
import { db } from '../services/db'
import { getCurrentUserAction } from '../actions/auth-actions'
import { 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  MoreHorizontal, 
  Layers, 
  Award, 
  Clock, 
  FileText,
  ChevronDown,
  Plus
} from 'lucide-react'
import fs from 'fs'
import path from 'path'
import { F01GuideSection } from '../components/features/F01GuideSection'

export const revalidate = 0

const ASPECTS = [
  {
    id: 'I',
    title: 'Kebijakan Pelayanan',
    weight: '24%',
    desc: 'Standar Pelayanan, Maklumat, dan Survei Kepuasan Masyarakat (SKM).',
    indicators: '10 Indikator',
    tag: 'Wajib F-01'
  },
  {
    id: 'II',
    title: 'Profesionalisme SDM',
    weight: '25%',
    desc: 'Kode Etik, budaya pelayanan, motivasi kerja, dan sistem penghargaan pegawai.',
    indicators: '6 Indikator',
    tag: 'Kompetensi'
  },
  {
    id: 'III',
    title: 'Sarana Prasarana',
    weight: '18%',
    desc: 'Fasilitas parkir, ruang tunggu, toilet layak, dan kelompok rentan.',
    indicators: '5 Indikator',
    tag: 'Inklusif'
  },
  {
    id: 'IV',
    title: 'SIPP Terintegrasi',
    weight: '11%',
    desc: 'Sistem Informasi Pelayanan Publik elektronik & pemutakhiran data.',
    indicators: '4 Indikator',
    tag: 'Digital'
  },
  {
    id: 'V',
    title: 'Konsultasi & Pengaduan',
    weight: '10%',
    desc: 'Media tatap muka, integrasi SP4N-LAPOR!, dan tindak lanjut aduan.',
    indicators: '3 Indikator',
    tag: 'Respon Cepat'
  },
  {
    id: 'VI',
    title: 'Inovasi Pelayanan',
    weight: '12%',
    desc: 'Penciptaan inovasi baru dan keberlanjutan sumber daya pendukung.',
    indicators: '3 Indikator',
    tag: 'Terobosan'
  }
]

export default async function HomePage() {
  const currentUser = await getCurrentUserAction()
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const activeYear = activePeriod?.year || new Date().getFullYear()

  const unitsCount = await db.unit.count()
  const categoriesCount = await db.category.count()
  const evaluationsCount = await db.evaluation.count({ where: { year: activeYear } })
  const indicatorsCount = await db.indicator.count()

  const sampleUnits = await db.unit.findMany({
    take: 3,
    include: { category: true },
    orderBy: { name: 'asc' }
  })

  // Load F-01 guide data
  const guideFilePath = path.join(process.cwd(), 'data', 'f01-guide.json')
  const guideData = JSON.parse(fs.readFileSync(guideFilePath, 'utf8'))

  return (
    <div className="space-y-8 pb-16 max-w-[1600px] mx-auto px-1 sm:px-2">
      {/* 1. Header Greeting & Quick CTA Bar */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 pb-2">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted tracking-wide">
            Pantau progres & evaluasi kinerja pelayanan publik
          </p>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-ink">
            Selamat Datang, <span className="font-semibold text-ink">{currentUser?.fullName || 'Birokrasi Melayani'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 self-start md:self-auto">
          {/* Active Unit Metric */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-ink-muted">Lokus Terdaftar</span>
            <span className="text-xl font-normal tracking-tight text-ink">
              {evaluationsCount > 0 ? evaluationsCount : unitsCount} Unit Kerja
            </span>
          </div>

          <div className="h-9 w-px bg-stroke/60 hidden sm:block" />

          {/* Primary Amber CTA Button */}
          <Link
            href="/hasil"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button group">
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
            <span>Lihat Hasil & IPP</span>
          </Link>
        </div>
      </section>

      {/* 2. Main Asymmetric Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (lg:col-span-4): Aspek Catalog Stack */}
        <div className="lg:col-span-4 bg-surface rounded-bento p-6 sm:p-7 border border-stroke/50 shadow-soft-card flex flex-col justify-between space-y-6">
          {/* Header & Micro Controls */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stroke/40">
              <div>
                <h2 className="text-lg font-medium text-ink tracking-tight">Katalog Aspek</h2>
                <p className="text-xs text-ink-muted">6 Dimensi PermenPANRB No. 29/2022</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Cari aspek"
                  className="w-8 h-8 rounded-full bg-white border border-stroke/60 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs">
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Filter aspek"
                  className="w-8 h-8 rounded-full bg-white border border-stroke/60 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Micro Card Stack */}
            <div className="mt-4 space-y-3">
              {ASPECTS.map((aspect) => (
                <div
                  key={aspect.id}
                  className="group p-4 rounded-2xl bg-surface-elevated border border-stroke/40 hover:border-brand/40 hover:shadow-soft-card transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-ink-muted">
                          {aspect.id}.
                        </span>
                        <h3 className="text-sm font-medium text-ink group-hover:text-brand transition-colors">
                          {aspect.title}
                        </h3>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                        {aspect.desc}
                      </p>
                    </div>
                    {/* Weight Price/Metric Tag */}
                    <div className="text-right shrink-0">
                      <span className="text-base font-medium text-ink tracking-tight">
                        {aspect.weight}
                      </span>
                      <span className="block text-[10px] text-ink-muted">Bobot</span>
                    </div>
                  </div>

                  {/* Card Footer Metadata */}
                  <div className="mt-3 pt-2.5 border-t border-stroke/30 flex items-center justify-between text-[11px] text-ink-muted">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 text-ink-muted" />
                        {aspect.indicators}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-subtle text-ink-secondary text-[10px]">
                        {aspect.tag}
                      </span>
                    </div>
                    <span className="text-brand text-xs group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center border-t border-stroke/30">
            <span className="text-[11px] text-ink-muted">
              Total 31 Indikator Penilaian Terverifikasi
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-8): Big Analytics & Split Sub-Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Big Bento Card: Capaian & Waveform Trendline */}
          <div className="bg-surface rounded-bento p-6 sm:p-7 border border-stroke/50 shadow-soft-card space-y-6">
            {/* Header & Period Filter Pill */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-ink tracking-tight">Performa Evaluasi Pelayanan</h2>
                <p className="text-xs text-ink-muted">Agregasi progres & akurasi pemenuhan bukti dukung</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-stroke/60 text-xs font-medium text-ink-secondary hover:text-ink shadow-2xs">
                  <span>Tahun {activeYear}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                </button>
                <button
                  type="button"
                  aria-label="Menu opsi"
                  className="w-8 h-8 rounded-full bg-white border border-stroke/60 flex items-center justify-center text-ink-muted hover:text-ink shadow-2xs">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3 KPI Metrics Row with Superscript Presentation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 pb-4 border-b border-stroke/40">
              {/* Metric 1 */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-ink-muted -translate-y-2 select-none">%</span>
                  <span className="text-4xl font-normal text-ink tracking-tight">88.4</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                    +14%
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">Indeks Kepatuhan Standar</p>
              </div>

              {/* Metric 2 */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-ink-muted -translate-y-2 select-none">%</span>
                  <span className="text-4xl font-normal text-ink tracking-tight">76.2</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                    +16%
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">Verifikasi Bukti F-01</p>
              </div>

              {/* Metric 3 */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-ink-muted -translate-y-2 select-none">%</span>
                  <span className="text-4xl font-normal text-ink tracking-tight">94.0</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                    +8%
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">Survei Kepuasan (F-03)</p>
              </div>
            </div>

            {/* Waveform Barcode & Bezier Spline Chart */}
            <div className="relative pt-2">
              {/* Tooltip Float in Active Range */}
              <div className="absolute top-0 left-[53%] sm:left-[55%] -translate-x-1/2 z-10">
                <div className="bg-surface-elevated border border-stroke/70 px-3.5 py-1.5 rounded-xl shadow-soft-float text-center">
                  <span className="block text-sm font-semibold text-ink tracking-tight">1,368</span>
                  <span className="block text-[10px] text-ink-muted">Bukti diverifikasi</span>
                </div>
                {/* Micro vertical connector line */}
                <div className="w-px h-6 bg-brand mx-auto" />
              </div>

              {/* SVG Density Barcode + Bezier Curve */}
              <div className="h-44 sm:h-48 w-full overflow-hidden">
                <svg
                  viewBox="0 0 700 160"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  {/* Vertical Density Bars (Histogram Soundwave) */}
                  {Array.from({ length: 70 }).map((_, i) => {
                    const x = i * 10 + 5
                    // Simulated natural bar height
                    const h = 25 + Math.sin(i * 0.35) * 18 + Math.cos(i * 0.8) * 12 + ((i * 7) % 25)
                    const y = 140 - h
                    const isHighlighted = i >= 35 && i <= 42 // Highlighted active days (Wed)
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1={y}
                        x2={x}
                        y2={140}
                        stroke={isHighlighted ? '#1D5BB9' : '#E5E2DC'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="transition-colors duration-200 hover:stroke-brand"
                      />
                    )
                  })}

                  {/* Bezier Spline Dark Curve Line */}
                  <path
                    d="M 5,88 C 60,82 110,95 170,78 C 230,62 290,92 350,68 C 400,48 450,96 520,80 C 580,68 640,92 695,74"
                    stroke="#1C1C1A"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Highlight point on active Wednesday */}
                  <circle cx="380" cy="56" r="4" fill="#1D5BB9" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>

              {/* X-Axis Day Labels */}
              <div className="flex justify-between items-center text-[11px] text-ink-muted pt-2 border-t border-stroke/30 px-1">
                <span>Minggu</span>
                <span>Senin</span>
                <span>Selasa</span>
                <span className="font-medium text-brand">Rabu (Aktif)</span>
                <span>Kamis</span>
                <span>Jumat</span>
                <span>Sabtu</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: 2 Balanced Bento Sub-Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Distribusi Aktivitas Evaluasi */}
            <div className="bg-surface rounded-bento p-6 border border-stroke/50 shadow-soft-card flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stroke/40">
                  <div>
                    <h3 className="text-base font-medium text-ink tracking-tight">Aktivitas Evaluasi</h3>
                    <p className="text-xs text-ink-muted">Tahapan pengisian periode aktif</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-stroke/60 flex items-center justify-center text-ink-muted shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Progress Indicators Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-ink">42 Jam</span>
                    <span className="block text-[10px] text-ink-muted">F-01 Mandiri</span>
                    <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full w-[85%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-ink">28 Jam</span>
                    <span className="block text-[10px] text-ink-muted">Verifikasi Lapangan</span>
                    <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-brand/60 rounded-full w-[60%]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-ink">18 Jam</span>
                    <span className="block text-[10px] text-ink-muted">Uji Sampel SKM</span>
                    <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-brand/30 rounded-full w-[35%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="pt-3 border-t border-stroke/30 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-normal text-ink tracking-tight">88 Jam</span>
                  <span className="block text-[10px] text-brand font-medium">+16 jam minggu ini</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-subtle border border-stroke/50 text-[11px] text-ink-secondary">
                  6 Aspek Terpenuhi
                </span>
              </div>
            </div>

            {/* Card 2: Lokus / Unit Pelayanan Unggulan */}
            <div className="bg-surface rounded-bento p-6 border border-stroke/50 shadow-soft-card flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-stroke/40">
                  <div>
                    <h3 className="text-base font-medium text-ink tracking-tight">Lokus Unggulan</h3>
                    <p className="text-xs text-ink-muted">Penyelenggara pelayanan berkinerja tinggi</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-stroke/60 flex items-center justify-center text-ink-muted shadow-2xs">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2.5">
                  {sampleUnits.length > 0 ? (
                    sampleUnits.map((unit, index) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-subtle transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center border border-brand/20">
                            {unit.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <span className="block text-xs font-medium text-ink line-clamp-1">{unit.name}</span>
                            <span className="text-[10px] text-ink-muted">{unit.category?.name || 'Unit Pelayanan'}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-medium text-ink tracking-tight shrink-0 pl-2">
                          {4.8 - index * 0.2} <span className="text-[10px] text-ink-muted font-sans">IPP</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-ink-muted text-center py-4">Belum ada data evaluasi final</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stroke/30 text-right">
                <Link
                  href="/hasil"
                  className="text-xs font-medium text-brand hover:text-brand-hover inline-flex items-center gap-1">
                  Lihat Seluruh Lokus <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 3. Section Panduan Bukti Dukung (F-01) */}
      <section className="pt-6">
        <div className="bg-surface rounded-bento p-6 sm:p-8 border border-stroke/50 shadow-soft-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stroke/40">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">
                PANDUAN EVIDEN LENGKAP
              </span>
              <h2 className="text-2xl font-normal text-ink tracking-tight mt-0.5">
                Katalog Bukti Dukung Formulir F-01
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Kamus resmi indikator dan contoh eviden yang dapat diterima pada tahap evaluasi mandiri
              </p>
            </div>
            <span className="self-start sm:self-auto px-3.5 py-1 rounded-full bg-surface-subtle border border-stroke/60 text-xs text-ink-secondary">
              {guideData.length} Indikator Panduan
            </span>
          </div>

          <F01GuideSection items={guideData} />
        </div>
      </section>
    </div>
  )
}
