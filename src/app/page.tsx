import Link from 'next/link'
import { db } from '../services/db'
import { getCurrentUserAction } from '../actions/auth-actions'
import { ArrowRight, TrendingUp, BookOpen } from 'lucide-react'

export const revalidate = 0

export default async function HomePage() {
  const currentUser = await getCurrentUserAction()
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const activeYear = activePeriod?.year || new Date().getFullYear()

  const unitsCount = await db.unit.count()
  const evaluationsCount = await db.evaluation.count({ where: { year: activeYear } })
  const indicatorsCount = await db.indicator.count()

  // Determine user dashboard target
  const dashboardLink = currentUser
    ? (currentUser.role === 'SUPER_ADMIN' ? '/admin' : '/opd')
    : '/login'

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-140px)] max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      
      {/* 1. Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        {/* Main Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.15]">
            Evaluasi Penyelenggaraan Pelayanan Publik Kutai Barat
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl mx-auto">
            Prototipe sistem pemantauan terpadu instrumen PermenPANRB No. 4/2023. Memfasilitasi evaluasi mandiri, verifikasi bukti dukung berkonteks, dan ruang klarifikasi interaktif bagi seluruh unit layanan di Kabupaten Kutai Barat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={dashboardLink}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-medium transition-all shadow-sm">
            <span>{currentUser ? 'Masuk ke Dasbor' : 'Masuk ke Dasbor'}</span>
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

      {/* 2. Key Metrics Strip */}
      <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-2xl bg-surface border border-stroke/60 shadow-2xs">
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

    </div>
  )
}
