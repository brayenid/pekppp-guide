'use client'

import { getF01QuestionByNumber, parseF01AnswerList, isF01MultiValue } from '../../lib/f01-parser'
import { FileText, CheckCircle2, Check, X } from 'lucide-react'

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
          style={{ rowGap: '16px', columnGap: '16px' }}
        >
          {f01Question.items.map((item) => {
            const val = f01Data[item.id]
            if (val === undefined || val === null || val === '') return null

            const isTarget = Boolean(targetItem && item.id === targetItem)
            const isMulti = isF01MultiValue(val, item)
            const parsedList = isMulti ? parseF01AnswerList(val, item.options) : []

            return (
              <div
                key={item.id}
                id={`f01-item-${item.id}`}
                className={`p-3.5 rounded-xl border space-y-2 transition-all flex flex-col justify-between ${
                  isTarget
                    ? 'ring-2 ring-brand/60 border-brand/70 bg-brand-light/15 shadow-soft-card'
                    : 'bg-surface-elevated border-stroke/60 shadow-2xs'
                }`}>
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className="text-[11px] font-medium text-ink-muted leading-tight line-clamp-2" 
                      title={item.text}
                    >
                      {item.text}
                    </span>
                    {isTarget && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-brand text-white shrink-0 tracking-tight">
                        Baru Diperbarui
                      </span>
                    )}
                  </div>

                  {/* Rendering Content: Multi-select / Listed Format */}
                  {isMulti && parsedList.length > 0 ? (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-ink-muted font-medium pb-0.5">
                        <span>Pilihan Terpilih ({parsedList.length}):</span>
                      </div>
                      <ul className="space-y-1">
                        {parsedList.map((opt, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-surface-subtle/70 border border-stroke/40 text-xs font-semibold text-[#1B2559]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                            <span className="leading-snug break-words">{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : item.type === 'yes_no' ? (
                    <div className="pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          String(val).toLowerCase() === 'ya'
                            ? 'bg-pastel-green text-pastel-green-text border border-emerald-200'
                            : 'bg-pastel-rose text-pastel-rose-text border border-rose-200'
                        }`}
                      >
                        {String(val).toLowerCase() === 'ya' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {String(val)}
                      </span>
                    </div>
                  ) : (
                    /* Single Select / Text / Number / Freeform */
                    <div className="pt-0.5">
                      <p className="font-bold text-[#1B2559] text-sm leading-snug break-words">
                        {String(val)}
                        {item.unit && (
                          <span className="text-xs font-normal text-ink-muted ml-1">
                            ({item.unit})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
