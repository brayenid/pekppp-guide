import Link from 'next/link'
import Image from 'next/image'
import { db } from '../services/db'
import { getCurrentUserAction } from '../actions/auth-actions'
import {
  ArrowRight,
  TrendingUp,
  BookOpen,
  Building2,
  ShieldCheck,
  FileCheck2,
  Users,
  Award,
  Layers,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  FileText,
  MessageSquareHeart,
  ExternalLink
} from 'lucide-react'

export const revalidate = 0

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

  // Determine user dashboard target
  const dashboardLink = currentUser
    ? (currentUser.role === 'SUPER_ADMIN' ? '/admin' : '/opd')
    : '/login'

  const aspects = [
    {
      code: 'A1',
      name: 'Kebijakan Pelayanan',
      weight: '24%',
      desc: 'Standar Pelayanan (SP), maklumat pelayanan, kepatuhan SPM, dan penyelenggaraan Survei Kepuasan Masyarakat (SKM).'
    },
    {
      code: 'A2',
      name: 'Profesionalisme SDM',
      weight: '25%',
      desc: 'Kompetensi aparatur, responsivitas pelayanan, kode etik, budaya pelayanan, serta mekanisme apresiasi dan sanksi.'
    },
    {
      code: 'A3',
      name: 'Sarana & Prasarana',
      weight: '18%',
      desc: 'Kenyamanan fasilitas layanan, ketersediaan loket, serta kelengkapan sarpras ramah kelompok rentan dan disabilitas.'
    },
    {
      code: 'A4',
      name: 'Sistem Informasi (SIPP)',
      weight: '11%',
      desc: 'Keterbukaan informasi tarif, syarat, dan prosedur melalui website resmi, portal nasional SIPP, dan media informasi.'
    },
    {
      code: 'A5',
      name: 'Konsultasi & Pengaduan',
      weight: '10%',
      desc: 'Penyediaan kanal pengaduan langsung, petugas responsif, integrasi SP4N-LAPOR!, dan tindak lanjut laporan warga.'
    },
    {
      code: 'A6',
      name: 'Inovasi Pelayanan Publik',
      weight: '12%',
      desc: 'Terobosan perbaikan mutu layanan, replikasi inovasi berstandar nasional, dan dampak nyata kemanfaatan bagi publik.'
    }
  ]

  const workflowSteps = [
    {
      step: '01',
      title: 'Evaluasi Mandiri (F-01)',
      actor: 'Unit Kerja / OPD',
      desc: 'Setiap lokus layanan mengisi instrumen penilaian mandiri dan melampirkan berkas bukti dukung digital yang relevan.'
    },
    {
      step: '02',
      title: 'Verifikasi & Validasi (F-02)',
      actor: 'Tim Penilai Internal',
      desc: 'Tim Evaluator Bagian Organisasi melakukan telaah berkas, uji petik lapangan, dan pembuktian dokumen pendukung.'
    },
    {
      step: '03',
      title: 'Survei Responden (F-03)',
      actor: 'Masyarakat / Pengguna',
      desc: 'Pengukuran persepsi kualitas dan integritas pelayanan secara langsung melalui kuesioner digital kepada penerima layanan.'
    },
    {
      step: '04',
      title: 'Penetapan Nilai IPP',
      actor: 'Pemerintah Daerah',
      desc: 'Kompilasi skor gabungan (75% F-02 + 25% F-03), penetapan predikat mutu, dan penerbitan rekomendasi perbaikan formal.'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-14 sm:space-y-16 py-6 sm:py-10">
      
      {/* 1. Hero Institusional Resmi */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        
        {/* Badge Identitas Pemerintah Daerah */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface border border-line shadow-2xs">
          <div className="w-5 h-5 relative shrink-0">
            <Image
              src="/kubar.png"
              alt="Logo Kutai Barat"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-ink">Pemerintah Kabupaten Kutai Barat</span>
          <span className="text-line">•</span>
          <span className="text-xs text-ink-muted">Bagian Organisasi Setdakab</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-3.5">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.16]">
            Sistem Evaluasi Kinerja Penyelenggaraan Pelayanan Publik
          </h1>
          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Portal resmi pemantauan mandiri, verifikasi bukti dukung standar pelayanan, dan pengukuran Indeks Pelayanan Publik (IPP) terpadu bagi seluruh unit lokus di lingkungan Pemerintah Kabupaten Kutai Barat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={dashboardLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold transition-all shadow-hz-button">
            <span>{currentUser ? 'Buka Dasbor Saya' : 'Masuk Portal Evaluasi'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/hasil"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-line text-ink text-xs sm:text-sm font-semibold transition-all shadow-2xs">
            <TrendingUp className="w-4 h-4 text-brand" />
            <span>Rekapitulasi Nilai IPP</span>
          </Link>

          <Link
            href="/alur-proses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-ink-muted hover:text-ink text-xs sm:text-sm font-medium transition-colors">
            <BookOpen className="w-4 h-4" />
            <span>Alur Pelaksanaan</span>
          </Link>
        </div>
      </section>

      {/* 2. Key Metrics Strip (Data Riil Database) */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs">
        <div className="space-y-1 p-3 rounded-xl bg-surface-subtle/50 border border-line/60">
          <span className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">6 Aspek</span>
          <p className="text-xs font-medium text-ink-muted">Dimensi Standar Pelayanan</p>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-surface-subtle/50 border border-line/60">
          <span className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {indicatorsCount > 0 ? `${indicatorsCount} Butir` : '31 Butir'}
          </span>
          <p className="text-xs font-medium text-ink-muted">Indikator Terbobot Baku</p>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-surface-subtle/50 border border-line/60">
          <span className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {evaluationsCount > 0 ? `${evaluationsCount} Unit` : `${unitsCount} Unit`}
          </span>
          <p className="text-xs font-medium text-ink-muted">Lokus Layanan Terdaftar</p>
        </div>
      </section>

      {/* 3. 6 Aspek Baku Standar Pelayanan Publik */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
            6 Aspek Standar Pelayanan Publik
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Struktur dimensi penilaian baku yang mengukur kepatuhan regulasi, kapasitas penyelenggara, hingga persepsi kepuasan masyarakat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aspects.map((aspect) => (
            <div
              key={aspect.code}
              className="p-5 rounded-2xl border border-line bg-surface shadow-2xs hover:border-brand/40 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20">
                    {aspect.code}
                  </span>
                  <span className="text-xs font-semibold text-ink px-2 py-0.5 rounded-md bg-surface-subtle border border-line">
                    Bobot {aspect.weight}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-ink">{aspect.name}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{aspect.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Mekanisme Alur Kerja 4 Tahapan */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
            Mekanisme Evaluasi Terpadu
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Tahapan kerja sistematis dari pengisian instrumen oleh unit layanan hingga penetapan Berita Acara resmi Indeks Pelayanan Publik.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((wf) => (
            <div
              key={wf.step}
              className="p-5 rounded-2xl border border-line bg-surface shadow-2xs space-y-2.5 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand bg-brand/10 w-7 h-7 rounded-lg flex items-center justify-center border border-brand/20">
                  {wf.step}
                </span>
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                  {wf.actor}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-ink">{wf.title}</h4>
              <p className="text-xs text-ink-secondary leading-relaxed">{wf.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Pusat Akses Cepat Terpadu */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-ink">Pusat Layanan &amp; Navigasi Cepat</h3>
            <p className="text-xs text-ink-muted">Pilih pintu akses sesuai peran dan kebutuhan informasi Anda</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline self-start sm:self-auto">
            <span>Masuk Akun OPD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href={dashboardLink}
            className="p-4 rounded-xl border border-line hover:border-brand/50 hover:bg-surface-subtle/40 transition-all group shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-ink group-hover:text-brand transition-colors">
                  Dasbor Evaluasi OPD
                </h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Pengisian formulir F-01, kelola repositori berkas master bukti dukung, dan tindak lanjut perbaikan.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/hasil"
            className="p-4 rounded-xl border border-line hover:border-brand/50 hover:bg-surface-subtle/40 transition-all group shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-ink group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Rekapitulasi Nilai IPP
                </h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Peringkat skor Indeks Pelayanan Publik seluruh perangkat daerah Kutai Barat secara transparan.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/wiki"
            className="p-4 rounded-xl border border-line hover:border-brand/50 hover:bg-surface-subtle/40 transition-all group shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-ink group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                  Wiki 31 Indikator
                </h4>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Daftar lengkap pertanyaan, skala rubrik level 1–5, dan kriteria bukti dukung terstandarisasi.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

    </div>
  )
}
