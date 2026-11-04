import { db } from '../../../services/db'
import { calculatePekpppScore, calculateEffectiveF03AndIpp } from '../../../core/domain/pekppp-calculator'
import { getF03DataAction } from '../../../actions/f03-actions'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { Trophy, FileText, ArrowLeft, Folder, ExternalLink, MessageSquare, CheckCircle2, Star, Lock, Eye, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatScore } from '../../../lib/utils'
import { PrintBeritaAcaraButton } from '../../../components/ui/PrintBeritaAcaraButton'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { NoticeBanner } from '../../../components/ui/NoticeBanner'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'

export const revalidate = 0

const GRADE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  A: { label: 'Sangat Baik', bg: '#6ee7b7', text: '#064e3b' },
  B: { label: 'Baik', bg: '#0091ff', text: '#ffffff' },
  C: { label: 'Cukup', bg: '#e8e8e8', text: '#202020' },
  D: { label: 'Kurang', bg: '#fbbf24', text: '#78350f' },
  E: { label: 'Sangat Kurang', bg: '#f87171', text: '#7f1d1d' },
  F: { label: 'Tidak Ada Data', bg: '#d4d4d4', text: '#646464' },
}

export default async function PublicHasilDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: evaluationId } = await params
  const currentUser = await getCurrentUserAction()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: { include: { category: true } },
      scores: {
        include: {
          indicator: {
            include: { aspect: true }
          }
        },
        orderBy: { indicator: { indicatorNumber: 'asc' } }
      }
    }
  })

  if (!evaluation) {
    notFound()
  }

  // Cek kepemilikan lokus untuk akses fitur privat (seperti Cetak Berita Acara)
  let isOwner = false
  if (currentUser) {
    if (isSuperAdmin) {
      isOwner = true
    } else if (currentUser.role === 'OPD') {
      const userUnit = await db.userUnit.findUnique({
        where: {
          userId_unitId: {
            userId: currentUser.id,
            unitId: evaluation.unitId
          }
        }
      })
      isOwner = Boolean(userUnit)
    }
  }

  // Cek status publikasi pada periode tahun terkait
  const period = await db.evaluationPeriod.findUnique({
    where: { year: evaluation.year }
  })

  const isPublished = evaluation.isPublished || (period?.isPublished ?? false)
  const canAccess = isPublished || isSuperAdmin

  if (!canAccess) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
        <Breadcrumb
          showBackOnFirst
          items={[
            { label: 'Peringkat Evaluasi', href: '/hasil' },
            { label: evaluation.unit.name }
          ]}
        />

        <div className="rounded-bento border border-stroke bg-surface p-10 sm:p-14 text-center space-y-5 shadow-soft-card">
          <div className="w-16 h-16 rounded-3xl bg-surface-subtle border border-stroke mx-auto flex items-center justify-center text-ink-muted shadow-inner">
            <Lock className="w-8 h-8 text-brand" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <Badge variant="neutral" size="sm">
              Tahun Evaluasi {evaluation.year}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
              Hasil Lokus Belum Dipublikasikan
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-normal">
              Detail hasil evaluasi dan penilaian untuk <strong>{evaluation.unit.name}</strong> belum dipublikasikan secara resmi ke publik oleh Tim Evaluator.
            </p>
          </div>

          <div className="pt-3">
            <Link href="/hasil">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Kembali ke Halaman Hasil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const f03Data = await getF03DataAction(evaluation.id)

  const calculationInputs = evaluation.scores.map((s) => ({
    indicatorNumber: s.indicator.indicatorNumber,
    aspectCode: s.indicator.aspect.code,
    score: s.score,
    maxScore: s.indicator.maxScore,
    indicatorWeight: s.indicator.indicatorWeight,
    aspectWeight: s.indicator.aspect.aspectWeight,
    isSupplementary: s.indicator.isSupplementary
  }))
  const calculation = calculatePekpppScore(calculationInputs)

  const f02Pct = calculation.totalPercentage
  const targetQuota = f03Data?.targetQuota || 30
  const f03Method = f03Data?.f03CalculationMethod || 'PROPORTIONAL'
  const hasF03 = (evaluation.f03Count || 0) > 0
  const f03AvgPct = hasF03 ? (evaluation.f03Percentage || 0) : 0

  const { effectiveF03Percentage: f03Pct, finalIppPercentage: finalIppPct, finalIppScore: finalIppScale5, isF03Qualified } =
    calculateEffectiveF03AndIpp({
      f02Percentage: f02Pct,
      f03RawPercentage: f03AvgPct,
      f03Count: evaluation.f03Count || 0,
      targetQuota,
      method: f03Method
    })

  const grade =
    finalIppPct >= 90 ? 'A' : finalIppPct >= 75 ? 'B' : finalIppPct >= 60 ? 'C' : finalIppPct >= 45 ? 'D' : 'E'
  const gradeCfg = GRADE_CONFIG[grade]

  // Group scores by aspect code
  const groupedScores = evaluation.scores.reduce<Record<string, typeof evaluation.scores>>((acc, item) => {
    const code = item.indicator.aspect.code
    ;(acc[code] ??= []).push(item)
    return acc
  }, {})

  const aspectNotesMap = (evaluation.aspectNotes as Record<string, string> | null) || {}

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Breadcrumb */}
      <Breadcrumb
        showBackOnFirst
        items={[
          { label: 'Peringkat Evaluasi', href: '/hasil' },
          { label: evaluation.unit.name }
        ]}
      />

      {/* Header Banner */}
      {!isPublished && isSuperAdmin && (
        <div className="rounded-bento border border-brand/40 bg-brand-light/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">Mode Pratinjau Administrator</div>
              <div className="text-[11px] text-ink-muted">
                Hasil evaluasi lokus ini belum dirilis ke publik karena status Tahun {evaluation.year} masih dalam peninjauan internal.
              </div>
            </div>
          </div>
          <Link href={`/admin/periode/${evaluation.year}`}>
            <Button variant="brand" size="sm">
              Kelola di Admin
            </Button>
          </Link>
        </div>
      )}

      {/* Overview Metric Banner matching reference design */}
      <div className="relative overflow-hidden p-4.5 sm:p-6 bg-brand dark:bg-card dark:border dark:border-stroke rounded-bento shadow-soft-card space-y-4">
        {/* Aksen bubble transparan di sudut */}
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-white/10 dark:opacity-10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-white/20 dark:border-stroke pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 dark:bg-brand-light text-white dark:text-brand flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
              <h1 className="font-semibold text-base sm:text-lg text-white dark:text-ink tracking-tight">
                {evaluation.unit.name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-white/85 dark:text-ink-secondary pl-0 sm:pl-11.5 leading-relaxed">
              Tahun Penilaian {evaluation.year} · Kategori: {evaluation.unit.category?.name || 'OPD'}.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 pl-0 sm:pl-11.5">
              {isOwner && (
                <PrintBeritaAcaraButton
                  evaluationId={evaluation.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-white/95 text-brand text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                />
              )}
              {evaluation.isFinished ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/25 text-xs font-semibold backdrop-blur-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Penilaian Selesai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/90 border border-white/25 text-xs font-medium backdrop-blur-xs">
                  Penilaian Dalam Proses
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
            <div className="text-left sm:text-right">
              <span className="text-[11px] sm:text-xs font-semibold text-white/75 dark:text-ink-muted block uppercase tracking-wider">
                {hasF03 ? 'SKOR IPP FINAL' : 'SKOR IPP (F-02)'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-white dark:text-ink tabular-nums">
                {formatScore(finalIppPct)}%
                <span className="text-xs sm:text-sm text-white/75 dark:text-ink-muted font-normal ml-1.5 tabular-nums">
                  ({formatScore(finalIppScale5, 2)} / 5.00)
                </span>
              </span>
              {hasF03 && (
                <span className="text-[10px] text-white/80 dark:text-emerald-400 block tabular-nums">
                  F02: {formatScore(f02Pct, 1)}% | F03: {formatScore(f03Pct, 1)}%
                </span>
              )}
            </div>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 dark:bg-brand/10 border border-white/25 dark:border-brand/20 flex flex-col items-center justify-center text-white dark:text-brand font-semibold text-xs sm:text-sm shrink-0">
              <span className="text-[10px] opacity-75 leading-none">Grade</span>
              <span className="text-base sm:text-lg font-bold leading-tight mt-0.5">{grade}</span>
            </div>
          </div>
        </div>

        {/* Micro progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-white/20 dark:bg-surface-subtle h-2 rounded-full overflow-hidden">
            <div
              className="bg-white dark:bg-brand h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, finalIppPct))}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-white/80 dark:text-ink-muted font-medium tabular-nums">
            <span>Capaian Indeks: {formatScore(finalIppPct)}%</span>
            <span>Grade {grade} · {gradeCfg.label}</span>
            <span>Target: 100%</span>
          </div>
        </div>
      </div>

      {/* Rincian Evaluasi per Aspek */}
      <div className="space-y-6">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-muted">
          Rincian Nilai 31 Pertanyaan &amp; Catatan Evaluator (F-02)
        </h2>

        {Object.entries(groupedScores).map(([aspectCode, items]) => {
          const firstAspect = items[0]?.indicator.aspect
          const aspectResult = calculation.aspectResults[aspectCode]
          const aspectNote = aspectNotesMap[aspectCode]

          return (
            <div key={aspectCode} className="rounded-bento border border-stroke bg-surface overflow-hidden shadow-soft-card">
              {/* Aspect Header */}
              <div className="px-5 py-4 bg-surface-subtle/40 border-b border-stroke space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                      Aspek {aspectCode} · Bobot {firstAspect?.aspectWeight}%
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-ink">{firstAspect?.name}</h3>
                  </div>
                  {aspectResult && (
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                        Subtotal IPP
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-ink tabular-nums font-mono">
                        {formatScore(aspectResult.percentage)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Aspect Evaluator Note if present */}
                {aspectNote && (
                  <NoticeBanner
                    variant="warning"
                    icon={MessageSquare}
                    title={`Catatan Evaluator Aspek ${aspectCode}`}
                    description={aspectNote}
                    compact
                    className="mt-3"
                  />
                )}
              </div>

              {/* Indicator List */}
              <div className="divide-y divide-stroke/50">
                {items.map((item) => {
                  const ind = item.indicator
                  const hasScore = item.score !== null && item.score !== undefined

                  return (
                    <div key={item.id} className="p-4 space-y-2 hover:bg-surface-subtle/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-mono font-medium text-ink-secondary">
                            Pertanyaan #{ind.indicatorNumber} ({ind.code}) · Bobot {ind.indicatorWeight}%
                          </div>
                          <h4 className="text-xs font-medium text-ink leading-relaxed">{ind.question}</h4>
                        </div>

                        {/* Score badge with star harmonized to primary brand color */}
                        <div className="shrink-0">
                          {hasScore ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-light text-brand border border-brand/20 text-xs font-semibold font-mono">
                              <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                              Nilai {item.score} / 5
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-stroke text-[10px] font-medium">
                              Belum Dinilai
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evaluator Notes if present */}
                      {item.notes && (
                        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-stroke text-xs text-ink space-y-0.5">
                          <div className="text-[10px] font-semibold uppercase text-ink-muted tracking-wider font-mono">
                            Catatan Verifikasi Evaluator:
                          </div>
                          <p className="text-xs text-ink-secondary leading-relaxed font-normal">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rincian F-03 Survei Responden jika ada */}
      {hasF03 && (
        <div className="rounded-bento border border-stroke bg-surface p-5 sm:p-6 space-y-4 shadow-soft-card">
          <div className="flex items-center justify-between border-b border-stroke pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                INSTRUMEN SURVEI · BOBOT 25% IPP
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-ink">Hasil Survei Responden F-03</h3>
            </div>
            <div className="text-right font-semibold text-base sm:text-lg text-ink tabular-nums">
              {formatScore(f03AvgPct)}%
            </div>
          </div>

          {!isF03Qualified && (
            <div className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between font-normal">
              <span>
                {f03Method === 'STRICT'
                  ? `Sampel survei belum memenuhi target kuota (${evaluation.f03Count}/${targetQuota} responden). Bobot 25% F-03 belum diaktifkan ke Skor IPP.`
                  : `Sampel survei (${evaluation.f03Count}/${targetQuota} responden) dihitung proporsional (${formatScore(targetQuota > 0 ? (evaluation.f03Count / targetQuota) * 100 : 0)}% kuota) ke Skor IPP.`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-surface-subtle/50 rounded-xl border border-stroke">
              <div className="text-xl font-semibold text-ink tabular-nums">{evaluation.f03Count}</div>
              <div className="text-[10px] text-ink-muted uppercase font-medium">Jumlah Responden</div>
            </div>
            <div className="p-3 bg-surface-subtle/50 rounded-xl border border-stroke">
              <div className="text-xl font-semibold text-ink tabular-nums">{formatScore(f03AvgPct)}%</div>
              <div className="text-[10px] text-ink-muted uppercase font-medium">Agregat F-03</div>
            </div>
            <div className="p-3 bg-surface-subtle/50 rounded-xl border border-stroke">
              <div className="text-xl font-semibold text-ink tabular-nums">{formatScore(evaluation.f03Scale5, 2)} / 5.00</div>
              <div className="text-[10px] text-ink-muted uppercase font-medium">Skala 0-5</div>
            </div>
          </div>

          {evaluation.f03ProofUrl && (
            <div className="pt-2">
              <a
                href={evaluation.f03ProofUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                <Folder className="w-4 h-4" /> Lihat Dokumen Rekap Physical Kuesioner Survei F-03
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
