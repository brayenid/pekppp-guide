import { db } from '../../services/db'
import { calculateEffectiveF03AndIpp } from '../../core/domain/pekppp-calculator'
import { BarChart3, Trophy, Building2, ClipboardList, CheckCircle2, Lock, ShieldAlert, Eye, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <PageHeader
        icon={<Trophy className="w-5 h-5 text-brand" />}
        title="Peringkat Capaian &amp; Hasil PEKPPP"
        description={`Peringkat indeks pelayanan publik lokus evaluasi tahun ${activeYear} (gabungan evaluator 75% & survei responden 25%).`}
        actions={
          <div className="flex items-center gap-2.5">
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
              {isPublished ? 'Telah Dipublikasikan' : 'Internal / Draft'}
            </Badge>
          </div>
        }
      />

      {/* Admin Notice if viewing unpublished in preview mode */}
      {!isPublished && isSuperAdmin && (
        <div className="rounded-bento border border-brand/40 bg-brand-light/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Mode Pratinjau Administrator</div>
              <div className="text-[11px] text-ink-muted">
                Hasil evaluasi Tahun {activeYear} ini belum dipublikasikan ke publik. Hanya Tim Administrator / Evaluator yang dapat melihat data ini sebelum dirilis resmi.
              </div>
            </div>
          </div>
          <Link href={`/admin/periode/${activeYear}`}>
            <Button variant="brand" size="sm">
              Publikasikan di Portal Admin
            </Button>
          </Link>
        </div>
      )}

      {/* If NOT published and NOT super admin: Show Informative Waiting State */}
      {!canViewResults ? (
        <div className="rounded-bento border border-stroke/50 bg-surface p-12 sm:p-16 text-center space-y-5 shadow-soft-card">
          <div className="w-16 h-16 rounded-3xl bg-surface-subtle border border-stroke/60 mx-auto flex items-center justify-center text-ink-muted shadow-inner">
            <Lock className="w-8 h-8 text-brand" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">
              Hasil Evaluasi Tahun {activeYear} Belum Dipublikasikan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-normal">
              Hasil akhir penilaian dan peringkat indeks pelayanan publik (IPP) untuk periode Tahun {activeYear} saat ini masih dalam tahap verifikasi, audit tim evaluator, dan rekapitulasi data.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-subtle border border-stroke/60 text-xs font-medium text-ink-muted">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span>Periode Evaluasi: Tahun {activeYear}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-subtle border border-stroke/60 text-xs font-medium text-ink-muted">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Akan dirilis setelah penetapan resmi</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <StatCard
              icon={<Building2 className="w-4 h-4 text-brand" />}
              label="Total Evaluasi"
              value={sortedEvaluations.length}
              sublabel="Unit lokus pelayanan terdata"
              valueClassName="font-mono font-semibold"
            />
            <StatCard
              icon={<Trophy className="w-4 h-4 text-emerald-600" />}
              label="Predikat Prima / Baik (A/B)"
              value={sortedEvaluations.filter((e) => e.finalPct >= 75).length}
              sublabel={`${sortedEvaluations.length > 0 ? ((sortedEvaluations.filter((e) => e.finalPct >= 75).length / sortedEvaluations.length) * 100).toFixed(0) : 0}% dari seluruh lokus`}
              valueClassName="font-mono font-semibold"
            />
            <StatCard
              icon={<BarChart3 className="w-4 h-4 text-brand" />}
              label="Rata-Rata IPP Final"
              value={`${avgIpp}%`}
              sublabel={`Skala 5: ${(Number(avgIpp) * 5 / 100).toFixed(2)} / 5.00`}
              valueClassName="font-mono font-semibold"
            />
          </div>

          {/* Leaderboard Table with Auto Loadmore (Server-Side Refetch) */}
          {sortedEvaluations.length === 0 ? (
            <div className="rounded-bento border border-stroke/50 bg-surface p-12 text-center space-y-3 shadow-soft-card">
              <BarChart3 className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-semibold text-ink">Belum ada data evaluasi.</p>
              <p className="text-xs text-ink-muted font-normal">
                Silakan lengkapi form evaluasi mandiri atau pengisian evaluator terlebih dahulu.
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
