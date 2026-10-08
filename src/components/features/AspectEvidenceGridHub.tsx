// src/components/features/AspectEvidenceGridHub.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  FolderCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  UploadCloud,
  ExternalLink
} from 'lucide-react'
import {
  getAspectEvidenceOverviewAction,
  AspectOverviewItem
} from '../../actions/evidence-slot-actions'

interface AspectEvidenceGridHubProps {
  evaluationId: string
  unitName: string
  isEvaluator: boolean
  onSelectAspect: (aspectCode: string) => void
}

export function AspectEvidenceGridHub({
  evaluationId,
  unitName,
  isEvaluator,
  onSelectAspect
}: AspectEvidenceGridHubProps) {
  const [overview, setOverview] = useState<AspectOverviewItem[]>([])
  const [totalUploaded, setTotalUploaded] = useState<number>(0)
  const [totalRequired, setTotalRequired] = useState<number>(0)
  const [totalPercentage, setTotalPercentage] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getAspectEvidenceOverviewAction(evaluationId)
      if (res.success && res.overview) {
        setOverview(res.overview)
        setTotalUploaded(res.totalUploadedAll || 0)
        setTotalRequired(res.totalRequiredAll || 0)
        setTotalPercentage(res.totalPercentageAll || 0)
      }
    } catch (err) {
      console.error('Failed to load evidence overview:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [evaluationId])

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-600" />
        <p className="text-xs font-semibold text-slate-600">Memuat pusat bukti dukung 6 aspek...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Overview Metric Banner */}
      <div className="relative overflow-hidden p-6 bg-brand dark:bg-card dark:border dark:border-stroke rounded-bento shadow-soft-card space-y-4">
        {/* Aksen bubble transparan di sudut */}
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-white/10 dark:opacity-10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 dark:border-stroke pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-white/20 dark:bg-brand-light text-white dark:text-brand flex items-center justify-center shrink-0">
                <UploadCloud className="w-4.5 h-4.5" />
              </span>
              <h2 className="font-semibold text-lg text-white dark:text-ink tracking-tight">
                Pusat Unggah &amp; Pemenuhan Bukti Dukung (6 Aspek)
              </h2>
            </div>
            <p className="text-sm text-white/85 dark:text-ink-secondary pl-11.5 leading-relaxed">
              Unggah berkas fisik resmi dan pantau pemenuhan dokumen bukti untuk 6 Aspek evaluasi pada unit {unitName}.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-medium text-white/75 dark:text-ink-muted block">
                TOTAL DOKUMEN
              </span>
              <span className="text-xl font-semibold text-white dark:text-ink">
                {totalUploaded} <span className="text-sm text-white/75 dark:text-ink-muted font-normal">/ {totalRequired}</span>
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 dark:bg-surface-elevated flex items-center justify-center font-semibold text-sm text-white dark:text-ink border border-white/20 dark:border-stroke shadow-xs">
              {totalPercentage}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="relative space-y-2">
          <div className="w-full bg-white/20 dark:bg-surface-elevated h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-white dark:!bg-brand"
              style={{ width: `${totalPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/80 dark:text-ink-muted font-normal pt-0.5">
            <span>0 Dokumen</span>
            <span>{totalPercentage === 100 ? 'Semua Dokumen Lengkap' : `${totalRequired - totalUploaded} dokumen belum diunggah`}</span>
            <span>{totalRequired} Dokumen Wajib</span>
          </div>
        </div>
      </div>

      {/* Bento Grid 6 Aspek */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overview.map((asp) => {
          return (
            <div
              key={asp.aspectCode}
              onClick={() => onSelectAspect(asp.aspectCode)}
              className="p-6 bg-surface rounded-bento border border-stroke/50 hover:border-brand/50 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative">
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-surface-subtle text-ink border border-stroke/50">
                    ASPEK {asp.aspectCode}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 ${
                      asp.isComplete
                        ? 'bg-pastel-green text-pastel-green-text border border-emerald-200'
                        : asp.uploadedCount > 0
                        ? 'bg-pastel-amber text-pastel-amber-text border border-amber-200'
                        : 'bg-surface-subtle text-ink-muted border border-stroke/50'
                    }`}>
                    {asp.isComplete ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Lengkap</span>
                      </>
                    ) : asp.uploadedCount > 0 ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Proses</span>
                      </>
                    ) : (
                      <span>Belum Ada</span>
                    )}
                  </span>
                </div>

                <h3 className="font-medium text-sm text-ink leading-snug group-hover:text-brand transition-colors">
                  {asp.aspectName}
                </h3>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-3 pt-3 border-t border-stroke/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted font-normal">Dokumen Terunggah:</span>
                  <span className="text-xs font-medium text-ink">
                    {asp.uploadedCount} / {asp.totalRequired}
                  </span>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      asp.isComplete ? 'bg-emerald-500' : 'bg-brand'
                    }`}
                    style={{ width: `${asp.percentage}%` }}
                  />
                </div>

                {/* Evaluator AI status indicator */}
                {isEvaluator && asp.hasAiAnalysis && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-brand bg-brand-light px-2.5 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3 text-brand shrink-0" />
                    <span>Tersedia Telaah AI</span>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between text-xs font-medium border-t border-stroke/30">
                  <div className="flex items-center gap-1 text-brand group-hover:text-brand-hover transition-colors">
                    <span>Unggah Bukti</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <a
                    href={`/shared/evidence/${evaluationId}/${asp.aspectCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Buka Tautan Publik Berkas Bukti untuk MenPAN-RB"
                    className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink px-2 py-0.5 rounded-md hover:bg-surface-subtle transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    <span>Tautan Publik</span>
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
