'use client'

import React, { useState } from 'react'
import { ChevronDown, Layers, FileText, CheckCircle2 } from 'lucide-react'

export interface WikiAspectGroup {
  aspectCode: string
  aspectName: string
  aspectWeight: number
  indicators: Array<{
    id: string
    code: string
    indicatorNumber: number
    question: string
    indicatorWeight: number
    isSupplementary: boolean
    proofRequirements: string | null
  }>
}

export function WikiAccordionClient({ groups }: { groups: WikiAspectGroup[] }) {
  // Buka aspek pertama secara default
  const [openAspects, setOpenAspects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    if (groups.length > 0) {
      initial[groups[0].aspectCode] = true
    }
    return initial
  })

  const toggleAspect = (code: string) => {
    setOpenAspects((prev) => ({
      ...prev,
      [code]: !prev[code]
    }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    groups.forEach((g) => {
      all[g.aspectCode] = true
    })
    setOpenAspects(all)
  }

  const collapseAll = () => {
    setOpenAspects({})
  }

  return (
    <div className="space-y-4">
      {/* ── Action Controls (Buka Semua / Tutup Semua) ── */}
      <div className="flex items-center justify-between text-xs px-1 text-ink-muted">
        <span>Menampilkan <strong>{groups.length} Aspek</strong> Penilaian</span>
        <div className="flex items-center gap-2 font-medium">
          <button
            type="button"
            onClick={expandAll}
            className="text-brand hover:underline">
            Buka Semua
          </button>
          <span className="text-line">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-ink-muted hover:underline">
            Tutup Semua
          </button>
        </div>
      </div>

      {/* ── Aspect Accordions (Menyatu tanpa jarak) ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line shadow-2xs">
        {groups.map((group) => {
          const isOpen = !!openAspects[group.aspectCode]

          return (
            <div
              key={group.aspectCode}
              id={`aspek-${group.aspectCode.toLowerCase()}`}
              className="transition-colors">
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => toggleAspect(group.aspectCode)}
                className={`w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors select-none ${
                  isOpen ? 'bg-surface-subtle/40' : 'hover:bg-surface-subtle/30'
                }`}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand bg-brand-light dark:bg-brand/20 px-2 py-0.5 rounded border border-brand/20">
                      Aspek {group.aspectCode}
                    </span>
                    <h2 className="text-sm sm:text-base font-semibold text-ink truncate">
                      {group.aspectName}
                    </h2>
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Kontribusi bobot: <strong>{group.aspectWeight}%</strong> dari Indeks Pelayanan Publik (IPP)
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-ink-muted bg-surface-subtle px-2.5 py-1 rounded-full border border-line hidden sm:inline-block">
                    {group.indicators.length} Pertanyaan
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-ink-muted shadow-2xs">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180 text-brand' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Accordion Content: Indicators List */}
              {isOpen && (
                <div className="border-t border-line/60 bg-surface-subtle/20 p-4 sm:p-5 space-y-3">
                  {group.indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="p-4 sm:p-4.5 rounded-xl bg-surface border border-line space-y-2.5 transition-colors hover:border-brand/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/50 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-ink bg-surface-subtle border border-line px-2 py-0.5 rounded">
                            Pertanyaan #{ind.indicatorNumber} • {ind.code}
                          </span>
                          {ind.isSupplementary && (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded">
                              Data Tambahan
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-medium text-ink-secondary">
                          Bobot: <strong className="text-brand font-semibold">{ind.indicatorWeight}%</strong>
                        </span>
                      </div>

                      <h3 className="font-medium text-xs sm:text-sm text-ink leading-relaxed">
                        {ind.question}
                      </h3>

                      {ind.proofRequirements && (
                        <div className="p-3 rounded-lg bg-surface-subtle/60 border border-line/60 text-xs space-y-1">
                          <span className="font-semibold text-ink flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand" />
                            <span>Syarat Dokumen Bukti Dukung Wajib:</span>
                          </span>
                          <p className="text-ink-secondary leading-relaxed whitespace-pre-line pl-5">
                            {ind.proofRequirements}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
