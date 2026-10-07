'use client'

import { getF01QuestionByNumber } from '../../lib/f01-parser'
import { FileText } from 'lucide-react'

export function F01SummaryCard({
  indicatorNumber,
  f01Data,
  proofUrl,
  targetItem
}: {
  indicatorNumber: number
  f01Data?: any
  proofUrl?: string | null
  targetItem?: string | null
}) {
  const f01Question = getF01QuestionByNumber(indicatorNumber)
  if (!f01Question) return null

  const hasData = f01Data && Object.keys(f01Data).length > 0

  return (
    <div className="rounded-2xl border border-stroke/50 bg-surface-subtle/30 p-5 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stroke/40 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand" />
          <h4 className="font-medium text-xs text-ink">
            Hasil Isian Mandiri OPD (F01)
          </h4>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            hasData
              ? 'bg-pastel-green text-pastel-green-text border border-emerald-200'
              : 'bg-pastel-amber text-pastel-amber-text border border-amber-200'
          }`}>
          {hasData ? 'Terisi OPD' : 'Belum Diisi OPD'}
        </span>
      </div>

      {/* Summary Content */}
      {!hasData ? (
        <p className="text-xs text-ink-muted italic py-2 font-normal">
          OPD belum memasukkan rincian jawaban F01 untuk pertanyaan ini.
        </p>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 text-xs"
          style={{ rowGap: '20px', columnGap: '16px' }}
        >
          {f01Question.items.map((item) => {
            const val = f01Data[item.id]
            if (val === undefined || val === null || val === '') return null

            let displayVal = ''
            if (Array.isArray(val)) {
              displayVal = val.join(', ')
            } else {
              displayVal = String(val)
            }

            const isTarget = Boolean(targetItem && item.id === targetItem)

            return (
              <div
                key={item.id}
                id={`f01-item-${item.id}`}
                className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                  isTarget
                    ? 'ring-2 ring-brand/60 border-brand/70 bg-brand-light/15 shadow-soft-card'
                    : 'bg-surface-elevated border-stroke/60 shadow-2xs'
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-ink-muted block truncate">{item.text}</span>
                  {isTarget && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-brand text-white shrink-0 tracking-tight">
                      Baru Diperbarui
                    </span>
                  )}
                </div>
                <p className="font-bold text-[#1B2559] text-sm leading-snug">{displayVal}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
