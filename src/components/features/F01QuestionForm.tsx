'use client'

import { useState, useEffect } from 'react'
import { getF01QuestionByNumber, F01Item } from '../../lib/f01-parser'
import { saveF01DataAction } from '../../actions/evaluation-actions'
import { Save, AlertCircle, Loader2, Info, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface F01QuestionFormProps {
  evaluationScoreId: string
  indicatorNumber: number
  serverF01Data?: any
  draftF01Data?: any
  serverProofUrl?: string | null
  draftProofUrl?: string | null
  unitId: string
  isEditable?: boolean
  driveFolderUrl?: string | null
  targetItem?: string | null
  onF01Change?: (f01Data: Record<string, any>, proofUrl: string) => void
  onSaveSuccess?: (savedData: { f01Data: Record<string, any>; proofUrl: string }) => void
}

export function F01QuestionForm({
  evaluationScoreId,
  indicatorNumber,
  serverF01Data,
  draftF01Data,
  serverProofUrl,
  draftProofUrl,
  unitId,
  isEditable = true,
  targetItem,
  onF01Change,
  onSaveSuccess
}: F01QuestionFormProps) {
  const f01Question = getF01QuestionByNumber(indicatorNumber)

  // Resolve effective values: priority to draft, fallback to server
  const resolvedServerF01 = serverF01Data || {}
  const resolvedDraftF01 = draftF01Data !== undefined ? draftF01Data : resolvedServerF01
  const resolvedServerProof = serverProofUrl || ''
  const resolvedDraftProof = draftProofUrl !== undefined && draftProofUrl !== null ? draftProofUrl : resolvedServerProof

  const [f01State, setF01State] = useState<Record<string, any>>(resolvedDraftF01)
  const [baseF01State, setBaseF01State] = useState<Record<string, any>>(resolvedServerF01)

  const [proofUrl, setProofUrl] = useState<string>(resolvedDraftProof)
  const [baseProofUrl, setBaseProofUrl] = useState<string>(resolvedServerProof)
  const [loading, setLoading] = useState(false)

  // Sync state ONLY when switching questions (evaluationScoreId changes)
  useEffect(() => {
    setF01State(resolvedDraftF01)
    setBaseF01State(resolvedServerF01)
    setProofUrl(resolvedDraftProof)
    setBaseProofUrl(resolvedServerProof)
  }, [evaluationScoreId])

  const isDirty =
    isEditable &&
    (JSON.stringify(f01State) !== JSON.stringify(baseF01State) ||
      proofUrl.trim() !== baseProofUrl.trim())

  // Dirty check is reported to parent via data-indicator-dirty and onF01Change

  // Listener for global F01 save event
  useEffect(() => {
    const handleSaveAll = async () => {
      if (isDirty && isEditable) {
        setLoading(true)
        try {
          await saveF01DataAction({
            evaluationScoreId,
            f01Data: f01State,
            proofUrl: proofUrl.trim() || undefined,
            path: `/evaluasi/${unitId}`
          })
          setBaseF01State(f01State)
          setBaseProofUrl(proofUrl.trim())
          onSaveSuccess?.({ f01Data: f01State, proofUrl: proofUrl.trim() })
        } catch {
          // silent fail, global button handles final feedback
        } finally {
          setLoading(false)
        }
      }
    }
    window.addEventListener('save-all-f01', handleSaveAll)
    return () => window.removeEventListener('save-all-f01', handleSaveAll)
  }, [isDirty, f01State, proofUrl, evaluationScoreId, unitId, isEditable, onSaveSuccess])

  if (!f01Question) return null

  const isItemVisible = (item: F01Item): boolean => {
    if (!item.depends_on) return true
    const [depKey, depVal] = item.depends_on.split('=')
    if (!depKey || !depVal) return true
    return f01State[depKey] === depVal
  }

  const handleInputChange = (itemId: string, value: any, itemType?: string) => {
    let sanitizedValue = value

    // Untuk tipe number: cegah nilai minus
    if (itemType === 'number' && typeof value === 'string') {
      if (value !== '') {
        const num = Number(value)
        if (num < 0) {
          sanitizedValue = '0'
        }
      }
    }

    const next = {
      ...f01State,
      [itemId]: sanitizedValue
    }
    setF01State(next)
    if (onF01Change) {
      onF01Change(next, proofUrl)
    }
  }

  // Khusus Pertanyaan #1: Validasi Jumlah SP vs Jumlah Jenis Layanan
  const jumlahLayananVal = Number(f01State['q1a_jumlah_jenis_pelayanan'])
  const jumlahSpVal = Number(f01State['q1a_jumlah_sp'])
  const isQ1Warning =
    indicatorNumber === 1 &&
    !isNaN(jumlahLayananVal) &&
    !isNaN(jumlahSpVal) &&
    f01State['q1a_jumlah_sp'] !== undefined &&
    f01State['q1a_jumlah_sp'] !== '' &&
    f01State['q1a_jumlah_jenis_pelayanan'] !== undefined &&
    f01State['q1a_jumlah_jenis_pelayanan'] !== '' &&
    jumlahSpVal > jumlahLayananVal

  const handleMultiSelectToggle = (itemId: string, option: string) => {
    const currentList: string[] = Array.isArray(f01State[itemId]) ? f01State[itemId] : []
    const newList = currentList.includes(option)
      ? currentList.filter((o) => o !== option)
      : [...currentList, option]
    handleInputChange(itemId, newList)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditable) return

    setLoading(true)
    try {
      await saveF01DataAction({
        evaluationScoreId,
        f01Data: f01State,
        proofUrl: proofUrl.trim() || undefined,
        path: `/evaluasi/${unitId}`
      })
      setBaseF01State(f01State)
      setBaseProofUrl(proofUrl.trim())
      onSaveSuccess?.({ f01Data: f01State, proofUrl: proofUrl.trim() })
      toast.success(`F01 Pertanyaan #${indicatorNumber} berhasil disimpan!`)
    } catch {
      toast.error('Gagal menyimpan isian F01.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-indicator-dirty={isDirty} data-indicator-number={indicatorNumber} className="space-y-6">
      {/* Unsaved status pill if dirty */}
      {isDirty && (
        <div className="flex items-center justify-end">
          <span className="px-3 py-1 rounded-full bg-pastel-rose text-pastel-rose-text text-xs font-medium border border-pastel-rose-border flex items-center gap-1.5 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5" /> Belum Disimpan
          </span>
        </div>
      )}

      {/* Direct Clean Questions List */}
      <div className="space-y-6">
        {f01Question.items.map((item) => {
          if (!isItemVisible(item)) return null

          const isTarget = Boolean(targetItem && item.id === targetItem)

          return (
            <div
              key={item.id}
              id={`f01-input-${item.id}`}
              className={`space-y-2.5 p-3 rounded-xl transition-all ${
                isTarget
                  ? 'ring-2 ring-brand ring-offset-2 border border-brand/70 bg-brand-light/30 shadow-soft-card'
                  : ''
              }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="block text-xs sm:text-sm font-medium text-ink leading-relaxed">
                  {item.text}
                </label>
                {isTarget && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand text-white shrink-0">
                    Fokus Target
                  </span>
                )}
              </div>

              {/* Input Type: Yes / No */}
              {item.type === 'yes_no' && (
                <div className="flex items-center gap-2 pt-0.5">
                  {['Ya', 'Tidak'].map((opt) => {
                    const isSelected = f01State[item.id] === opt
                    return (
                      <label
                        key={opt}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'bg-brand text-white border-transparent shadow-hz-button'
                            : 'bg-surface text-ink-secondary border-stroke/60 hover:bg-surface-subtle hover:text-ink'
                        }`}>
                        <input
                          type="radio"
                          disabled={!isEditable}
                          name={item.id}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleInputChange(item.id, opt)}
                          className="hidden"
                        />
                        <span>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Input Type: Single Select */}
              {item.type === 'single_select' && item.options && (
                <div className="space-y-1.5 pt-0.5">
                  {item.options.map((opt) => {
                    const isSelected = f01State[item.id] === opt
                    return (
                      <label
                        key={opt}
                        className={`p-3 rounded-xl text-xs border flex items-center gap-2.5 cursor-pointer transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-brand/5 border-brand/40 text-brand font-medium ring-1 ring-brand/30'
                            : 'bg-surface border-stroke/50 text-ink-secondary hover:bg-surface-subtle hover:text-ink font-normal'
                        }`}>
                        <input
                          type="radio"
                          disabled={!isEditable}
                          name={item.id}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleInputChange(item.id, opt)}
                          className="accent-brand w-3.5 h-3.5"
                        />
                        <span className="leading-relaxed">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Input Type: Multi Select */}
              {item.type === 'multi_select' && item.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {item.options.map((opt) => {
                    const selectedList: string[] = Array.isArray(f01State[item.id]) ? f01State[item.id] : []
                    const isChecked = selectedList.includes(opt)
                    return (
                      <label
                        key={opt}
                        className={`p-3 rounded-xl text-xs border flex items-center gap-2.5 cursor-pointer transition-all shadow-2xs ${
                          isChecked
                            ? 'bg-brand/5 border-brand/40 text-brand font-medium ring-1 ring-brand/30'
                            : 'bg-surface border-stroke/50 text-ink-secondary hover:bg-surface-subtle hover:text-ink font-normal'
                        }`}>
                        <input
                          type="checkbox"
                          disabled={!isEditable}
                          checked={isChecked}
                          onChange={() => handleMultiSelectToggle(item.id, opt)}
                          className="accent-brand rounded w-3.5 h-3.5"
                        />
                        <span className="leading-snug">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Input Type: Text / Number */}
              {(item.type === 'text' || item.type === 'number') && (
                <div className="pt-0.5 space-y-1.5">
                  <input
                    type={item.type === 'number' ? 'number' : 'text'}
                    min={item.type === 'number' ? '0' : undefined}
                    onKeyDown={
                      item.type === 'number'
                        ? (e) => {
                            // Cegah tombol minus (-) dan 'e'
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault()
                            }
                          }
                        : undefined
                    }
                    disabled={!isEditable}
                    value={f01State[item.id] ?? ''}
                    onChange={(e) => handleInputChange(item.id, e.target.value, item.type)}
                    placeholder="Tulis isian jawaban..."
                    className={`w-full px-3.5 py-2.5 text-xs font-normal rounded-xl border bg-surface focus:outline-none transition-all shadow-2xs ${
                      item.id === 'q1a_jumlah_sp' && isQ1Warning
                        ? 'border-amber-400 focus:border-amber-500 text-ink'
                        : 'border-stroke/60 focus:border-brand text-ink placeholder:text-ink-muted'
                    }`}
                  />

                  {/* Peringatan khusus jika Jumlah SP > Jumlah Jenis Layanan pada Pertanyaan 1 */}
                  {item.id === 'q1a_jumlah_sp' && isQ1Warning && (
                    <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs animate-in fade-in duration-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold">Peringatan:</span> Jumlah Standar Pelayanan yang dibuat ({jumlahSpVal}) melebihi jumlah jenis pelayanan yang dimiliki ({jumlahLayananVal}). Harap pastikan kembali jumlah layanan dan SP yang valid.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input Type: Textarea */}
              {item.type === 'textarea' && (
                <div className="pt-0.5">
                  <textarea
                    rows={3}
                    disabled={!isEditable}
                    value={f01State[item.id] ?? ''}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                    placeholder="Uraikan penjelasan lengkap..."
                    className="w-full px-3.5 py-2.5 text-xs font-normal rounded-xl border border-stroke/60 bg-surface focus:outline-none focus:border-brand text-ink placeholder:text-ink-muted transition-all shadow-2xs resize-y"
                  />
                </div>
              )}

              {item.note && (
                <p className="text-xs text-ink-muted italic flex items-center gap-1.5 pt-0.5 font-normal">
                  <Info className="w-3.5 h-3.5 text-ink-muted/80" /> {item.note}
                </p>
              )}
            </div>
          )
        })}

        {/* Single Save Button */}
        {isEditable && isDirty && (
          <div className="pt-4 flex items-center justify-between border-t border-stroke/40">
            <div className="flex items-center gap-1.5 text-xs text-pastel-rose-text">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Isian Pertanyaan #{indicatorNumber} memiliki perubahan yang belum disimpan.</span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan F01...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Isian Pertanyaan #{indicatorNumber}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
