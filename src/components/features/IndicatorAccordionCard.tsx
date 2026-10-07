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
      className={`rounded-2xl bg-white overflow-hidden border shadow-2xs scroll-mt-24 transition-colors ${
        !isOpen && isDirty ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
      }`}>
      {/* Accordion Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          isOpen ? 'bg-slate-50 border-b border-slate-200' : 'bg-white hover:bg-slate-50/80'
        }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold shrink-0 shadow-xs">
            #{indicatorNumber}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-600 shrink-0">
            {code}
          </span>
          <p className="font-bold text-xs text-slate-900 truncate">{questionTitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-200 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-2.5 h-2.5" /> Belum Disimpan
            </span>
          )}
          {score !== null && score !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-mono font-bold border border-slate-200">
              Skor: {score}
            </span>
          )}
          {hasF01Data !== undefined && (
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold hidden sm:inline-block ${
                hasF01Data ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
              {hasF01Data ? 'F01 Terisi' : 'F01 Belum'}
            </span>
          )}
          <div className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-800" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {/* Accordion Content Body */}
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}
