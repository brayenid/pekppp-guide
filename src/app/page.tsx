import Link from 'next/link'
import { db } from '../services/db'
import { getCurrentUserAction } from '../actions/auth-actions'
import { 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  TrendingUp,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import fs from 'fs'
import path from 'path'
import { F01GuideSection } from '../components/features/F01GuideSection'

export const revalidate = 0

const ASPECTS = [
  {
    id: 'I',
    code: 'Aspek I',
    title: 'Kebijakan Pelayanan',
    weight: '24%',
    desc: 'Standar Pelayanan (SP), Maklumat Pelayanan, dan Survei Kepuasan Masyarakat (SKM).',
    indicators: 10
  },
  {
    id: 'II',
    code: 'Aspek II',
    title: 'Profesionalisme SDM',
    weight: '25%',
    desc: 'Kompetensi aparatur, kode etik pelayanan, kedisiplinan, motivasi, dan penghargaan.',
    indicators: 6
  },
  {
    id: 'III',
    code: 'Aspek III',
    title: 'Sarana & Prasarana',
    weight: '18%',
    desc: 'Fasilitas ruang tunggu, toilet layak, sarana ramah kelompok rentan dan disabilitas.',
    indicators: 5
  },
  {
    id: 'IV',
    code: 'Aspek IV',
    title: 'Sistem Informasi Pelayanan',
    weight: '11%',
    desc: 'Ketersediaan SIPP elektronik, keterbukaan informasi publik, dan pemutakhiran kanal.',
    indicators: 4
  },
  {
    id: 'V',
    code: 'Aspek V',
    title: 'Konsultasi & Pengaduan',
    weight: '10%',
    desc: 'Mekanisme penanganan aduan, integrasi SP4N-LAPOR!, dan tindak lanjut keluhan warga.',
    indicators: 3
  },
  {
    id: 'VI',
    code: 'Aspek VI',
    title: 'Inovasi Pelayanan Publik',
    weight: '12%',
    desc: 'Penciptaan terobosan layanan baru, replikasi, dan keberlanjutan sumber daya.',
    indicators: 3
  }
]

export default async function HomePage() {
  const currentUser = await getCurrentUserAction()
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const activeYear = activePeriod?.year || new Date().getFullYear()

  const unitsCount = await db.unit.count()
  const evaluationsCount = await db.evaluation.count({ where: { year: activeYear } })
  const indicatorsCount = await db.indicator.count()

  // Load F-01 guide data
  const guideFilePath = path.join(process.cwd(), 'data', 'f01-guide.json')
  let guideData = []
  try {
    if (fs.existsSync(guideFilePath)) {
      guideData = JSON.parse(fs.readFileSync(guideFilePath, 'utf8'))
    }
  } catch (err) {
    console.error('Error loading f01-guide.json:', err)
  }

  // Determine user dashboard target
  const dashboardLink = currentUser
    ? (currentUser.role === 'SUPER_ADMIN' ? '/admin' : '/opd')
    : '/login'

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* 1. Clean Minimalist Hero Section */}
      <section className="pt-8 sm:pt-14 pb-4 text-center max-w-3xl mx-auto space-y-6">
        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-subtle border border-stroke text-xs font-medium text-ink-secondary">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span>Periode Evaluasi Aktif: <strong>Tahun {activeYear}</strong></span>
        </div>

        {/* Main Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.15]">
            Evaluasi Penyelenggaraan Pelayanan Publik Kutai Barat
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl mx-auto">
            Platform pemantauan terpadu instrumen PermenPANRB No. 4/2023. Memfasilitasi evaluasi mandiri, verifikasi bukti dukung berkonteks, dan ruang klarifikasi interaktif bagi seluruh unit layanan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={dashboardLink}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-medium transition-all shadow-sm">
            <span>{currentUser ? 'Masuk ke Dasbor' : 'Masuk / Login Akun'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/hasil"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-subtle border border-stroke text-ink text-xs sm:text-sm font-medium transition-all">
            <TrendingUp className="w-4 h-4 text-ink-muted" />
            <span>Rekapitulasi Nilai IPP</span>
          </Link>

          <Link
            href="/alur-proses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-ink-muted hover:text-ink text-xs sm:text-sm font-medium transition-all">
            <BookOpen className="w-4 h-4" />
            <span>Alur Evaluasi</span>
          </Link>
        </div>
      </section>

      {/* 2. Key Metrics Strip (Clean & Flat) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-surface border border-stroke/60">
        <div className="space-y-1">
          <span className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">6 Aspek</span>
          <p className="text-xs text-ink-muted">Dimensi Standar Pelayanan</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">{indicatorsCount > 0 ? indicatorsCount : 31} Butir</span>
          <p className="text-xs text-ink-muted">Indikator Terbobot Baku</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">{evaluationsCount > 0 ? evaluationsCount : unitsCount} Unit</span>
          <p className="text-xs text-ink-muted">Lokus Layanan Terdaftar</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-3xl font-semibold text-brand tracking-tight">75% : 25%</span>
          <p className="text-xs text-ink-muted">Proporsi F-02 & Survei F-03</p>
        </div>
      </section>

      {/* 3. 6 Aspek Baku PermenPANRB (Clean Flat Grid) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-stroke/50">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">6 Aspek Evaluasi Pelayanan Publik</h2>
            <p className="text-xs text-ink-muted">Pedoman bobot dan cakupan penilaian instrumen nasional</p>
          </div>
          <span className="text-xs font-mono text-ink-muted">Total Bobot: 100%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASPECTS.map((aspect) => (
            <div
              key={aspect.id}
              className="p-5 rounded-xl bg-surface border border-stroke/60 hover:border-stroke transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-stroke/40 text-ink-secondary">
                    {aspect.code}
                  </span>
                  <span className="text-sm font-semibold text-brand font-mono">
                    Bobot {aspect.weight}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-ink pt-1">{aspect.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{aspect.desc}</p>
              </div>

              <div className="pt-3 border-t border-stroke/30 flex items-center justify-between text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {aspect.indicators} Indikator
                </span>
                <span className="text-[11px] text-brand">Standar Baku</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Alur Kerja Evaluasi Sederhana (3 Langkah) */}
      <section className="p-6 sm:p-8 rounded-2xl bg-surface border border-stroke/60 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink tracking-tight">Tahapan Pelaksanaan Evaluasi</h2>
          <p className="text-xs text-ink-muted">Mekanisme kerja terstruktur dari pengisian mandiri hingga penetapan hasil akhir</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 1 */}
          <div className="space-y-2.5 p-4 rounded-xl bg-surface-subtle border border-stroke/30">
            <div className="w-7 h-7 rounded-lg bg-brand text-white text-xs font-semibold flex items-center justify-center">
              1
            </div>
            <h3 className="text-sm font-medium text-ink">Evaluasi Mandiri (F-01)</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Unit lokus mengisi instrumen mandiri 31 indikator dan mengunggah berkas bukti dukung pada slot terstruktur yang telah disediakan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2.5 p-4 rounded-xl bg-surface-subtle border border-stroke/30">
            <div className="w-7 h-7 rounded-lg bg-brand text-white text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <h3 className="text-sm font-medium text-ink">Verifikasi Evaluator (F-02)</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tim Evaluator Bagian Organisasi menelaah keabsahan bukti dukung, berdiskusi melalui ruang klarifikasi interaktif, dan menetapkan skor F-02.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2.5 p-4 rounded-xl bg-surface-subtle border border-stroke/30">
            <div className="w-7 h-7 rounded-lg bg-brand text-white text-xs font-semibold flex items-center justify-center">
              3
            </div>
            <h3 className="text-sm font-medium text-ink">Survei (F-03) & Penetapan IPP</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pengumpulan kepuasan responden penerima layanan (F-03), agregasi proporsi nilai gabungan, dan penerbitan Berita Acara Evaluasi.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Panduan Bukti Dukung (F-01) */}
      {guideData.length > 0 && (
        <section className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stroke/50">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
                Katalog Panduan Bukti Dukung (F-01)
              </h2>
              <p className="text-xs text-ink-muted">
                Daftar contoh berkas dan kriteria pemenuhan bukti dukung per indikator
              </p>
            </div>
            <span className="px-3 py-1 rounded-md bg-surface-subtle border border-stroke text-xs text-ink-secondary">
              {guideData.length} Indikator Panduan
            </span>
          </div>

          <F01GuideSection items={guideData} />
        </section>
      )}

    </div>
  )
}
