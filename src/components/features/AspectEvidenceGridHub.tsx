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
    <div className="space-y-4 sm:space-y-5 animate-fade-in pb-16 sm:pb-6">
      {/* Overview Metric Banner (Compact & Viewport-Safe on Mobile) */}
      <div className="relative overflow-hidden p-3.5 sm:p-5 bg-brand dark:bg-card dark:border dark:border-stroke rounded-2xl shadow-soft-card space-y-3">
        {/* Subtle decorative glow */}
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10 dark:opacity-10" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-white/20 dark:bg-brand-light text-white dark:text-brand flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base text-white dark:text-ink truncate">
                Pusat Bukti Dukung (6 Aspek)
              </h2>
              <p className="text-[11px] sm:text-xs text-white/80 dark:text-ink-secondary truncate">
                Unit {unitName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden xs:block">
              <span className="text-[10px] text-white/70 dark:text-ink-muted block uppercase tracking-wider font-medium">
                Terunggah
              </span>
              <span className="text-xs sm:text-sm font-semibold text-white dark:text-ink font-mono">
                {totalUploaded} / {totalRequired}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-white/20 dark:bg-surface-elevated font-mono font-bold text-xs sm:text-sm text-white dark:text-ink border border-white/20 dark:border-stroke shadow-xs shrink-0">
              {totalPercentage}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="relative space-y-1.5 pt-1">
          <div className="w-full bg-white/20 dark:bg-surface-elevated h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-white dark:!bg-brand"
              style={{ width: `${totalPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/85 dark:text-ink-muted font-normal">
            <span>
              {totalUploaded} dari {totalRequired} dokumen terunggah
            </span>
            <span>
              {totalPercentage === 100
                ? 'Semua Lengkap (100%)'
                : `${totalRequired - totalUploaded} belum diunggah`}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid 6 Aspek */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {overview.map((asp) => {
          const aspectNum =
            asp.aspectCode === 'I' ? '1' :
            asp.aspectCode === 'II' ? '2' :
            asp.aspectCode === 'III' ? '3' :
            asp.aspectCode === 'IV' ? '4' :
            asp.aspectCode === 'V' ? '5' :
            asp.aspectCode === 'VI' ? '6' : asp.aspectCode

          return (
            <div
              key={asp.aspectCode}
              onClick={() => onSelectAspect(asp.aspectCode)}
              className="p-3.5 sm:p-5 bg-surface rounded-2xl border border-stroke/70 hover:border-brand/50 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative shadow-2xs">
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-surface-subtle text-ink border border-stroke/50">
                    ASPEK {aspectNum}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                      asp.isComplete
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : asp.uploadedCount > 0
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-surface-subtle text-ink-muted border border-stroke/50'
                    }`}>
                    {asp.isComplete ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Lengkap</span>
                      </>
                    ) : asp.uploadedCount > 0 ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{asp.percentage}%</span>
                      </>
                    ) : (
                      <span>Belum Ada</span>
                    )}
                  </span>
                </div>

                <h3 className="font-semibold text-xs sm:text-sm text-ink leading-snug group-hover:text-brand transition-colors">
                  {asp.aspectName}
                </h3>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-2.5 pt-2.5 border-t border-stroke/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted text-[11px]">Dokumen Terunggah:</span>
                  <span className="text-xs font-semibold text-ink">
                    {asp.uploadedCount} / {asp.totalRequired}
                  </span>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      asp.isComplete ? 'bg-emerald-500' : 'bg-brand'
                    }`}
                    style={{ width: `${asp.percentage}%` }}
                  />
                </div>

                {/* Evaluator AI status indicator */}
                {isEvaluator && asp.hasAiAnalysis && (
                  <div className="inline-flex items-center gap-1 text-[10px] text-brand bg-brand-light dark:bg-brand/15 px-2 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3 text-brand shrink-0" />
                    <span>Tersedia Telaah AI</span>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between text-xs font-medium border-t border-stroke/40">
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
