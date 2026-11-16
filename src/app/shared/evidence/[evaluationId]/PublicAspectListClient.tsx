'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, ChevronRight, FileText } from 'lucide-react'
import { toast } from 'sonner'

export interface PublicAspectSummaryItem {
  code: string
  romanCode: string
  name: string
  totalSlots: number
  filledSlotsCount: number
  totalFilesCount: number
}

export interface PublicAspectListClientProps {
  evaluationId: string
  lokusName: string
  lokusCode: string
  year: number
  aspects: PublicAspectSummaryItem[]
  totalFilesAll: number
}

export function PublicAspectListClient({
  evaluationId,
  lokusName,
  lokusCode,
  year,
  aspects,
  totalFilesAll
}: PublicAspectListClientProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Tautan berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink py-8 px-4 sm:px-8 lg:px-12 flex flex-col items-center">
      <div className="w-full max-w-5xl xl:max-w-6xl space-y-5">
        {/* Header Ringkas & Bersih */}
        <div className="bg-surface rounded-2xl border border-stroke/60 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-ink-muted block">
                Bukti Dukung Evaluasi PEKPPP {year}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-ink truncate mt-0.5" title={lokusName}>
                {lokusName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
                <span className="font-mono">{lokusCode}</span>
                <span>•</span>
                <span className="font-medium text-ink-secondary">
                  {totalFilesAll} Berkas Terunggah
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-subtle hover:bg-surface-hover text-ink border border-stroke/60 shadow-2xs transition-all shrink-0 cursor-pointer">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Daftar Aspek - Fokus File */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-ink-muted font-medium">
            <span>Daftar Aspek</span>
            <span>Jumlah Berkas</span>
          </div>

          <div className="bg-surface rounded-2xl border border-stroke/60 divide-y divide-stroke/40 overflow-hidden shadow-2xs">
            {aspects.map((asp) => (
              <Link
                key={asp.code}
                href={`/shared/evidence/${evaluationId}/${asp.code}`}
                className="flex items-center justify-between p-3.5 sm:px-4 hover:bg-surface-subtle transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-surface-subtle border border-stroke/50 flex items-center justify-center font-mono text-xs font-bold text-ink shrink-0 group-hover:border-brand group-hover:text-brand transition-colors">
                    {asp.romanCode}
                  </span>
                  <span className="font-medium text-xs sm:text-sm text-ink group-hover:text-brand transition-colors truncate">
                    {asp.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {asp.totalFilesCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      {asp.totalFilesCount} Berkas
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/40">
                      0 Berkas
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
