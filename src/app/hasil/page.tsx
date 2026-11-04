import { db } from '../../services/db'
import { calculateEffectiveF03AndIpp } from '../../core/domain/pekppp-calculator'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { getCurrentUserAction } from '../../actions/auth-actions'
import { PublicReportButton } from '../../components/features/PublicReportButton'

import { YearSelector } from './YearSelector'
import { HasilLeaderboardClient } from './HasilLeaderboardClient'

export const revalidate = 0

export default async function HasilPage({
  searchParams
}: {
  searchParams?: Promise<{ year?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const currentUser = await getCurrentUserAction()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  // Cari periode yang diminta atau periode aktif default
  const allPeriods = await db.evaluationPeriod.findMany({
    orderBy: { year: 'desc' }
  })

  const reqYear = resolvedParams?.year ? Number(resolvedParams.year) : undefined
  let targetPeriod = reqYear ? allPeriods.find((p) => p.year === reqYear) : allPeriods.find((p) => p.isOpen)

  // Fallback jika tidak ada yang isOpen
  if (!targetPeriod && allPeriods.length > 0) {
    targetPeriod = allPeriods[0]
  }

  const activeYear = targetPeriod?.year || new Date().getFullYear()
  const isPublished = targetPeriod?.isPublished ?? false

  // Hanya ambil data evaluasi jika sudah dipublish ATAU user adalah super admin
  const canViewResults = isPublished || isSuperAdmin

  const evaluations = canViewResults
    ? await db.evaluation.findMany({
        where: { year: activeYear },
        include: { unit: { include: { category: true } } },
        orderBy: { percentage: 'desc' }
      })
    : []

  const targetQuota = targetPeriod?.targetF03Quota || 30
  const f03Method = targetPeriod?.f03CalculationMethod || 'PROPORTIONAL'

  // Compute final IPP score (75% F02 + 25% F03) for sorting
  const sortedEvaluations = evaluations
    .map((ev) => {
      const f02Pct = ev.percentage || 0
      const hasF03 = (ev.f03Count || 0) > 0
      const f03AvgPct = hasF03 ? (ev.f03Percentage || 0) : 0

      const { effectiveF03Percentage: f03Pct, finalIppPercentage: finalPct, finalIppScore: finalScale5, isF03Qualified } =
        calculateEffectiveF03AndIpp({
          f02Percentage: f02Pct,
          f03RawPercentage: f03AvgPct,
          f03Count: ev.f03Count || 0,
          targetQuota,
          method: f03Method
        })

      return {
        ...ev,
        f02Pct,
        f03Pct,
        hasF03,
        isF03Qualified,
        finalPct,
        finalScale5
      }
    })
    .sort((a, b) => b.finalPct - a.finalPct)

  const avgIpp = sortedEvaluations.length > 0
    ? (sortedEvaluations.reduce((s, e) => s + e.finalPct, 0) / sortedEvaluations.length).toFixed(1)
    : '-'

  return (
    <div className="space-y-8 sm:space-y-10 max-w-6xl mx-auto pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Rekapitulasi Indeks Pelayanan Publik (IPP)"
        description={`Peringkat dan capaian indeks pelayanan publik Kabupaten Kutai Barat Tahun ${activeYear} berdasarkan komposisi terpadu evaluasi daerah (75%) dan survei kepuasan masyarakat (25%).`}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {allPeriods.length > 0 && (
              <YearSelector
                currentYear={activeYear}
                allYears={allPeriods.map((p) => p.year)}
              />
            )}
            {canViewResults && (
              <PublicReportButton year={activeYear} />
            )}
            <Badge variant={isPublished ? 'info' : 'neutral'} size="sm">
              {isPublished ? 'Publikasi Resmi' : 'Draft Internal'}
            </Badge>
          </div>
        }
      />

      {/* ── Admin Notice (Preview Mode) ── */}
      {!isPublished && isSuperAdmin && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-brand tracking-wide uppercase">Mode Pratinjau Administrator</div>
            <div className="text-xs text-ink-muted leading-relaxed">
              Hasil evaluasi Tahun {activeYear} saat ini belum dipublikasikan ke publik. Hanya Tim Administrator / Evaluator yang memiliki akses sebelum penetapan resmi.
            </div>
          </div>
          <Link href={`/admin/periode/${activeYear}`}>
            <Button variant="brand" size="sm">
              Manajemen Periode
            </Button>
          </Link>
        </div>
      )}

      {/* ── State: Belum Dipublikasikan ── */}
      {!canViewResults ? (
        <div className="rounded-2xl border border-line bg-surface p-10 sm:p-14 text-center space-y-6 shadow-2xs">
          <div className="max-w-md mx-auto space-y-2">
            <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">Status Periode</span>
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Hasil Evaluasi Tahun {activeYear} Belum Dipublikasikan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Hasil akhir penilaian dan peringkat indeks pelayanan publik (IPP) untuk periode Tahun {activeYear} sedang dalam tahapan verifikasi bukti dukung, validasi silang tim evaluator, dan rekapitulasi data.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 text-xs text-ink-muted">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-subtle border border-line">
              Periode: Tahun {activeYear}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-subtle border border-line">
              Penetapan Resmi: Kementerian PAN-RB
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-1.5">
              <div className="text-xs font-medium text-ink-muted">Total Lokus Pelayanan</div>
              <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight font-mono">
                {sortedEvaluations.length}
              </div>
              <div className="text-[11px] text-ink-muted">Unit kerja terdaftar dalam periode {activeYear}</div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-1.5">
              <div className="text-xs font-medium text-ink-muted">Rata-Rata IPP Kabupaten</div>
              <div className="text-2xl sm:text-3xl font-bold text-brand tracking-tight font-mono">
                {avgIpp}%
              </div>
              <div className="text-[11px] text-ink-muted">
                Konversi Skala 5: {avgIpp !== '-' ? ((Number(avgIpp) * 5) / 100).toFixed(2) : '-'} / 5.00
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-1.5">
              <div className="text-xs font-medium text-ink-muted">Predikat Prima / Baik (A &amp; B)</div>
              <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight font-mono">
                {sortedEvaluations.filter((e) => e.finalPct >= 75).length}
              </div>
              <div className="text-[11px] text-ink-muted">
                {sortedEvaluations.length > 0
                  ? `${((sortedEvaluations.filter((e) => e.finalPct >= 75).length / sortedEvaluations.length) * 100).toFixed(0)}% dari seluruh lokus terevaluasi`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* ── Leaderboard Table ── */}
          {sortedEvaluations.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center space-y-2 shadow-2xs">
              <p className="text-sm font-semibold text-ink">Belum ada data evaluasi</p>
              <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
                Silakan lengkapi instrumen evaluasi mandiri atau pengisian evaluator terlebih dahulu untuk memunculkan rekapitulasi.
              </p>
            </div>
          ) : (
            <HasilLeaderboardClient
              initialEvaluations={sortedEvaluations.slice(0, 15)}
              totalCount={sortedEvaluations.length}
              year={activeYear}
            />
          )}
        </>
      )}
    </div>
  )
}
