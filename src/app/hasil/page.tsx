import { db } from '../../services/db'
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

export const revalidate = 0

const GRADE_CONFIG: Record<string, { label: string; badgeVariant: 'success' | 'info' | 'neutral' | 'warning' | 'danger' }> = {
  A: { label: 'Sangat Baik', badgeVariant: 'success' },
  B: { label: 'Baik', badgeVariant: 'info' },
  C: { label: 'Cukup', badgeVariant: 'neutral' },
  D: { label: 'Kurang', badgeVariant: 'warning' },
  E: { label: 'Sangat Kurang', badgeVariant: 'danger' },
  F: { label: 'Tidak Ada Data', badgeVariant: 'neutral' }
}

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

  function getGrade(pct: number) {
    if (pct >= 90) return 'A'
    if (pct >= 75) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 45) return 'D'
    if (pct > 0) return 'E'
    return 'F'
  }

  // Compute final IPP score (75% F02 + 25% F03) for sorting
  const sortedEvaluations = evaluations
    .map((ev) => {
      const f02Pct = ev.percentage || 0
      const f03Pct = ev.f03Percentage || 0
      const hasF03 = (ev.f03Count || 0) > 0
      const finalPct = hasF03 ? 0.75 * f02Pct + 0.25 * f03Pct : f02Pct
      const finalScale5 = (finalPct / 100) * 5
      return {
        ...ev,
        f02Pct,
        f03Pct,
        hasF03,
        finalPct,
        finalScale5
      }
    })
    .sort((a, b) => b.finalPct - a.finalPct)

  const avgIpp = sortedEvaluations.length > 0
    ? (sortedEvaluations.reduce((s, e) => s + e.finalPct, 0) / sortedEvaluations.length).toFixed(1)
    : '-'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
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
        <div className="rounded-bento border border-stroke/50 bg-surface p-12 sm:p-16 text-center space-y-5 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-surface-subtle border border-stroke/60 mx-auto flex items-center justify-center text-ink-muted shadow-inner">
            <Lock className="w-8 h-8 text-brand" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Hasil Evaluasi Tahun {activeYear} Belum Dipublikasikan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
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
              label="Total Evaluasi"
              value={sortedEvaluations.length}
            />
            <StatCard
              label="Predikat Prima / Baik (A/B)"
              value={sortedEvaluations.filter((e) => e.finalPct >= 75).length}
            />
            <StatCard
              label="Rata-Rata IPP Final"
              value={`${avgIpp}%`}
            />
          </div>

          {/* Leaderboard Table */}
          {sortedEvaluations.length === 0 ? (
            <div className="rounded-bento border border-stroke/50 bg-surface p-12 text-center space-y-3 shadow-2xs">
              <BarChart3 className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-semibold text-ink">Belum ada data evaluasi.</p>
              <p className="text-xs text-ink-muted">
                Silakan lengkapi form evaluasi mandiri atau pengisian evaluator terlebih dahulu.
              </p>
            </div>
          ) : (
        <div className="rounded-bento border border-stroke/50 bg-surface overflow-hidden shadow-2xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-surface-subtle border-b border-stroke/50 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Unit / Lokus</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2 text-right">Skor IPP Final</div>
            <div className="col-span-3 text-right">Grade &amp; Rincian</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-stroke/40">
            {sortedEvaluations.map((ev, idx) => {
              const grade = getGrade(ev.finalPct)
              const cfg = GRADE_CONFIG[grade]
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

              return (
                <div
                  key={ev.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-surface-subtle transition-colors">
                  <div className="col-span-1 text-sm font-bold text-ink-muted font-mono">
                    {medal ?? <span>{idx + 1}</span>}
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-ink">{ev.unit.name}</span>
                      {ev.isFinished ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Selesai
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Progres
                        </Badge>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-ink-muted mt-0.5">Tahun {ev.year}</div>
                  </div>

                  <div className="col-span-2">
                    <Badge variant="neutral" size="sm">
                      {ev.unit.category?.name || '-'}
                    </Badge>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="font-bold text-sm text-ink font-mono tracking-tight tabular-nums">
                      {ev.finalPct.toFixed(1)}%
                    </span>
                    <div className="text-[10px] font-mono text-ink-muted tabular-nums">Skala 5: {ev.finalScale5.toFixed(2)}</div>
                    {ev.hasF03 && (
                      <div className="text-[10px] font-mono text-pastel-blue-text font-semibold">
                        F02: {ev.f02Pct.toFixed(0)}% · F03: {ev.f03Pct.toFixed(0)}%
                      </div>
                    )}
                  </div>

                  <div className="col-span-3 text-right flex items-center justify-end gap-2">
                    <Badge variant={cfg.badgeVariant} size="sm">
                      {grade} - {cfg.label}
                    </Badge>
                    <Link href={`/hasil/${ev.id}`}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
                        Detail
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
