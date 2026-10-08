'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface IndicatorAccordionCardProps {
  indicatorNumber: number
  code: string
  questionTitle: string
  score?: number | null
  isDirty?: boolean
  hasF01Data?: boolean
  children: React.ReactNode
}

export function IndicatorAccordionCard({
  indicatorNumber,
  code,
  questionTitle,
  score,
  isDirty,
  hasF01Data,
  children
}: IndicatorAccordionCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  // Listen to open events from QuickNav
  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ indicatorNumber: number }>) => {
      if (e.detail.indicatorNumber === indicatorNumber) {
        setIsOpen(true)
      }
    }

    const handleCollapseAll = () => setIsOpen(false)
    const handleExpandAll = () => setIsOpen(true)

    window.addEventListener('open-indicator' as any, handleOpen as any)
    window.addEventListener('collapse-all-indicators' as any, handleCollapseAll as any)
    window.addEventListener('expand-all-indicators' as any, handleExpandAll as any)

    return () => {
      window.removeEventListener('open-indicator' as any, handleOpen as any)
      window.removeEventListener('collapse-all-indicators' as any, handleCollapseAll as any)
      window.removeEventListener('expand-all-indicators' as any, handleExpandAll as any)
    }
  }, [indicatorNumber])

  return (
    <div
      ref={cardRef}
      id={`indicator-${indicatorNumber}`}
      data-indicator-number={indicatorNumber}
      className={`rounded-2xl bg-card overflow-hidden border shadow-2xs scroll-mt-24 transition-colors ${
        !isOpen && isDirty ? 'border-rose-300 dark:border-rose-500/50 ring-1 ring-rose-200 dark:ring-rose-500/20' : 'border-stroke'
      }`}>
      {/* Accordion Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          isOpen ? 'bg-surface-subtle/60 border-b border-stroke' : 'bg-card hover:bg-surface-subtle/40'
        }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="px-2.5 py-1 rounded-lg bg-ink text-canvas text-xs font-mono font-bold shrink-0 shadow-xs">
            #{indicatorNumber}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-subtle text-[10px] font-mono font-bold text-ink-muted shrink-0 border border-stroke/40">
            {code}
          </span>
          <p className="font-bold text-xs text-ink truncate">{questionTitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[9px] font-bold border border-rose-200 dark:border-rose-800/40 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-2.5 h-2.5" /> Belum Disimpan
            </span>
          )}
          {score !== null && score !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink text-[10px] font-mono font-bold border border-stroke">
              Skor: {score}
            </span>
          )}
          {hasF01Data !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold hidden sm:inline-block ${
                hasF01Data ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
              }`}>
              {hasF01Data ? 'F01 Terisi' : 'F01 Belum'}
            </span>
          )}
          <div className="p-1 rounded-lg text-ink-muted hover:bg-surface-subtle transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4 text-ink" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
          </div>
        </div>
      </div>

      {/* Accordion Content Body */}
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}
