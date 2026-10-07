import { db } from '../../../services/db'
import { calculatePekpppScore } from '../../../core/domain/pekppp-calculator'
import { getF03DataAction } from '../../../actions/f03-actions'
import { getCurrentUserAction } from '../../../actions/auth-actions'
import { Trophy, FileText, ArrowLeft, Folder, ExternalLink, MessageSquare, CheckCircle2, Star, Lock, Eye, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatScore } from '../../../lib/utils'
import { PrintBeritaAcaraButton } from '../../../components/ui/PrintBeritaAcaraButton'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

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

  // Cek status publikasi pada periode tahun terkait
  const period = await db.evaluationPeriod.findUnique({
    where: { year: evaluation.year }
  })

  const isPublished = evaluation.isPublished || (period?.isPublished ?? false)
  const canAccess = isPublished || isSuperAdmin

  if (!canAccess) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 px-4">
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link href="/hasil" className="hover:text-ink transition-colors font-medium flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Peringkat Evaluasi
          </Link>
          <span className="text-stroke">/</span>
          <span className="text-ink font-semibold">{evaluation.unit.name}</span>
        </nav>

        <div className="rounded-bento border border-stroke/50 bg-surface p-10 sm:p-14 text-center space-y-5 shadow-soft-card">
          <div className="w-16 h-16 rounded-3xl bg-surface-subtle border border-stroke/60 mx-auto flex items-center justify-center text-ink-muted shadow-inner">
            <Lock className="w-8 h-8 text-brand" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <Badge variant="neutral" size="sm">
              Tahun Evaluasi {evaluation.year}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Hasil Lokus Belum Dipublikasikan
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
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
  const hasF03 = (evaluation.f03Count || 0) > 0
  const f03Pct = evaluation.f03Percentage || 0
  const finalIppPct = hasF03 ? 0.75 * f02Pct + 0.25 * f03Pct : f02Pct
  const finalIppScale5 = (finalIppPct / 100) * 5

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/hasil" className="hover:text-ink transition-colors font-medium flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Peringkat Evaluasi
        </Link>
        <span className="text-stroke">/</span>
        <span className="text-ink font-semibold">{evaluation.unit.name}</span>
      </nav>

      {/* Header Banner */}
      {!isPublished && isSuperAdmin && (
        <div className="rounded-bento border border-brand/40 bg-brand-light/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Mode Pratinjau Administrator</div>
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold">
              RINCEN PUBLIK · REKAP PENILAIAN PEKPPP
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-6.5 h-6.5 text-amber-500" />
              {evaluation.unit.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tahun Penilaian {evaluation.year} · Kategori: {evaluation.unit.category?.name || 'OPD'}.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {evaluation.unit.driveFolderUrl && (
                <a
                  href={evaluation.unit.driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs">
                  <Folder className="w-3.5 h-3.5" /> Folder Drive Utama
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <PrintBeritaAcaraButton evaluationId={evaluation.id} />
              {evaluation.isFinished ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Penilaian Selesai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold">
                  Penilaian Dalam Proses
                </span>
              )}
            </div>
          </div>

          {/* Final IPP Score Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center shrink-0 min-w-56 space-y-1 shadow-2xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              {hasF03 ? 'Skor IPP Final' : 'Skor IPP (F-02)'}
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {formatScore(finalIppPct)}%
            </div>
            <div className="text-xs text-slate-600 font-semibold">
              Skala 5: <span className="text-slate-900 font-bold">{formatScore(finalIppScale5, 2)}</span> / 5.00
            </div>
            {hasF03 && (
              <div className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                F02: {formatScore(f02Pct, 1)}% | F03: {formatScore(f03Pct, 1)}%
              </div>
            )}
            <div>
              <span
                className="inline-flex px-3 py-0.5 rounded-full text-xs font-bold mt-1"
                style={{ backgroundColor: gradeCfg.bg, color: gradeCfg.text }}>
                Grade {grade} - {gradeCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Evaluasi per Aspek */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase text-xs font-mono tracking-wider text-slate-500">
          Rincian Nilai 31 Pertanyaan &amp; Catatan Evaluator (F-02)
        </h2>

        {Object.entries(groupedScores).map(([aspectCode, items]) => {
          const firstAspect = items[0]?.indicator.aspect
          const aspectResult = calculation.aspectResults[aspectCode]
          const aspectNote = aspectNotesMap[aspectCode]

          return (
            <div key={aspectCode} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              {/* Aspect Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Aspek {aspectCode} · Bobot {firstAspect?.aspectWeight}%
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{firstAspect?.name}</h3>
                  </div>
                  {aspectResult && (
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Subtotal IPP
                      </div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">
                        {formatScore(aspectResult.percentage)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Aspect Evaluator Note if present */}
                {aspectNote && (
                  <div className="mt-2 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[10px] uppercase text-amber-800 tracking-wider font-mono">
                        Catatan Evaluator Aspek {aspectCode}
                      </div>
                      <p className="mt-0.5 leading-relaxed whitespace-pre-wrap">{aspectNote}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Indicator List */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const ind = item.indicator
                  const hasScore = item.score !== null && item.score !== undefined

                  return (
                    <div key={item.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-mono font-bold text-slate-700">
                            Pertanyaan #{ind.indicatorNumber} ({ind.code}) · Bobot {ind.indicatorWeight}%
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">{ind.question}</h4>
                        </div>

                        {/* Score badge */}
                        <div className="shrink-0">
                          {hasScore ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold font-mono">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              Nilai {item.score} / 5
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                              Belum Dinilai
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evaluator Notes if present */}
                      {item.notes && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
                            Catatan Verifikasi Evaluator:
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{item.notes}</p>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                INSTRUMEN SURVEI · BOBOT 25% IPP
              </div>
              <h3 className="font-bold text-base text-slate-900">Hasil Survei Responden F-03</h3>
            </div>
            <div className="text-right font-mono font-bold text-lg text-slate-900">
              {formatScore(f03Pct)}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-slate-900">{evaluation.f03Count}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Jumlah Responden</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-slate-900">{formatScore(f03Pct)}%</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Agregat F-03</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xl font-bold text-slate-900">{formatScore(evaluation.f03Scale5, 2)} / 5.00</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Skala 0-5</div>
            </div>
          </div>

          {evaluation.f03ProofUrl && (
            <div className="pt-2">
              <a
                href={evaluation.f03ProofUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0091ff] hover:underline">
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
