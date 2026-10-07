'use client'

import { useState, useEffect } from 'react'
import { getF02GuidanceByNumber, F02ScaleOption } from '../../lib/f02-parser'
import { saveScoresAction } from '../../actions/evaluation-actions'
import { CheckCircle2, Check, HelpCircle, FileSearch, Sparkles, Save, AlertCircle, Loader2, FileEdit, Globe, Copy, Info, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

interface F02GuidanceSectionProps {
  indicatorNumber: number
  indicatorId: string
  evaluationId?: string
  serverScore?: number | null
  draftScore?: number | null
  serverNotes?: string | null
  draftNotes?: string | null
  aspectCode?: string
  aspectName?: string
  serverAspectNote?: string
  draftAspectNote?: string
  // Legacy backwards compatibility props
  initialScore?: number | null
  initialNotes?: string | null
  initialAspectNote?: string
  unitId?: string
  aiSuggestedScore?: number | null
  aiConfidence?: number | null
  aiConfidenceReason?: string | null
  aiCriticalAudit?: string | null
  aiWeaknessNotes?: string | null
  aiVerificationTips?: string | null
  onScoreChange?: (score: number | null) => void
  onNotesChange?: (notes: string) => void
  onAspectNoteChange?: (aspectCode: string, note: string) => void
  onSaveSuccess?: (savedData: { score: number | null; notes?: string }) => void
}

export function F02GuidanceSection({
  indicatorNumber,
  indicatorId,
  evaluationId,
  serverScore,
  draftScore,
  serverNotes,
  draftNotes,
  aspectCode = 'I',
  aspectName = 'Kebijakan Pelayanan',
  serverAspectNote = '',
  draftAspectNote,
  initialScore,
  initialNotes,
  initialAspectNote = '',
  unitId = '',
  aiSuggestedScore,
  aiConfidence,
  aiConfidenceReason,
  aiCriticalAudit,
  aiWeaknessNotes,
  aiVerificationTips,
  onScoreChange,
  onNotesChange,
  onAspectNoteChange,
  onSaveSuccess
}: F02GuidanceSectionProps) {
  const guidance = getF02GuidanceByNumber(indicatorNumber)

  // Resolve effective values: priority to draft, fallback to server or legacy initial
  const resolvedServerScore = serverScore !== undefined && serverScore !== null ? serverScore : (initialScore ?? null)
  // If draftScore is undefined (no edits made yet), fallback to server score
  const resolvedDraftScore = draftScore !== undefined ? draftScore : resolvedServerScore
  const resolvedScoreVal = resolvedDraftScore !== undefined && resolvedDraftScore !== null ? String(resolvedDraftScore) : ''
  const resolvedBaseScoreVal = resolvedServerScore !== undefined && resolvedServerScore !== null ? String(resolvedServerScore) : ''

  const resolvedServerNotes = (serverNotes !== undefined && serverNotes !== null ? serverNotes : (initialNotes || '')).trim()
  // If draftNotes is undefined, fallback to server notes
  const resolvedDraftNotes = (draftNotes !== undefined && draftNotes !== null ? draftNotes : resolvedServerNotes).trim()

  const resolvedServerAspect = (serverAspectNote !== undefined && serverAspectNote !== null ? serverAspectNote : (initialAspectNote || '')).trim()
  // If draftAspectNote is undefined, fallback to server aspect note
  const resolvedDraftAspect = (draftAspectNote !== undefined && draftAspectNote !== null ? draftAspectNote : resolvedServerAspect).trim()

  const [selectedScore, setSelectedScore] = useState<string>(resolvedScoreVal)
  const [baseScore, setBaseScore] = useState<string>(resolvedBaseScoreVal)
  const [notes, setNotes] = useState<string>(resolvedDraftNotes)
  const [baseNotes, setBaseNotes] = useState<string>(resolvedServerNotes)
  const [isSaving, setIsSaving] = useState(false)

  // Aspect Note State (Official MenPAN sync notes)
  const [activeNoteTab, setActiveNoteTab] = useState<'indicator' | 'aspect'>('indicator')
  const [aspectNote, setAspectNote] = useState<string>(resolvedDraftAspect)
  const [baseAspectNote, setBaseAspectNote] = useState<string>(resolvedServerAspect)
  const [isSavingAspect, setIsSavingAspect] = useState<boolean>(false)

  // Sync state when props change
  useEffect(() => {
    setSelectedScore(resolvedScoreVal)
    setBaseScore(resolvedBaseScoreVal)
    setNotes(resolvedDraftNotes)
    setBaseNotes(resolvedServerNotes)
  }, [indicatorId, resolvedScoreVal, resolvedBaseScoreVal, resolvedDraftNotes, resolvedServerNotes])

  useEffect(() => {
    setAspectNote(resolvedDraftAspect)
    setBaseAspectNote(resolvedServerAspect)
  }, [resolvedDraftAspect, resolvedServerAspect, aspectCode])

  const handleScoreSelect = (val: string) => {
    setSelectedScore(val)
    if (onScoreChange) {
      onScoreChange(val !== '' ? Number(val) : null)
    }
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (onNotesChange) {
      onNotesChange(val)
    }
  }

  const handleAspectNoteChange = (val: string) => {
    setAspectNote(val)
    if (onAspectNoteChange) {
      onAspectNoteChange(aspectCode, val)
    }
  }

  const isDirty = (selectedScore !== baseScore && (selectedScore !== '' || baseScore !== '')) || (notes.trim() !== baseNotes.trim())
  const isAspectDirty = aspectNote.trim() !== baseAspectNote.trim()

  // Listener for global F02 save event
  useEffect(() => {
    const handleSaveAll = async () => {
      if (!evaluationId) return

      if (isDirty) {
        setIsSaving(true)
        try {
          const scoreVal = selectedScore !== '' ? Number(selectedScore) : null
          await saveScoresAction(evaluationId, [
            {
              indicatorId,
              score: scoreVal,
              notes: notes || undefined
            }
          ])
          setBaseScore(selectedScore)
          setBaseNotes(notes)
          onSaveSuccess?.({ score: scoreVal, notes: notes || undefined })
        } catch {
          // silent fail, global button handles final feedback
        } finally {
          setIsSaving(false)
        }
      }

      if (isAspectDirty) {
        setIsSavingAspect(true)
        try {
          const { saveAspectNoteAction } = await import('../../actions/evaluation-actions')
          await saveAspectNoteAction({ evaluationId, aspectCode, note: aspectNote.trim(), unitId })
          setBaseAspectNote(aspectNote.trim())
        } catch {
          // silent fail
        } finally {
          setIsSavingAspect(false)
        }
      }
    }

    window.addEventListener('save-all-f02', handleSaveAll)
    return () => window.removeEventListener('save-all-f02', handleSaveAll)
  }, [isDirty, isAspectDirty, evaluationId, indicatorId, selectedScore, notes, aspectCode, aspectNote, unitId, onSaveSuccess])

  const handleSaveSingleF02 = async () => {
    if (!evaluationId) return
    setIsSaving(true)
    try {
      const scoreVal = selectedScore !== '' ? Number(selectedScore) : null
      await saveScoresAction(evaluationId, [
        {
          indicatorId,
          score: scoreVal,
          notes: notes || undefined
        }
      ])
      setBaseScore(selectedScore)
      setBaseNotes(notes)
      onSaveSuccess?.({ score: scoreVal, notes: notes || undefined })
      toast.success(`F02 Pertanyaan #${indicatorNumber} berhasil disimpan!`)
    } catch {
      toast.error('Gagal menyimpan nilai F02.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAspectNote = async () => {
    if (!evaluationId) return
    setIsSavingAspect(true)
    try {
      const { saveAspectNoteAction } = await import('../../actions/evaluation-actions')
      await saveAspectNoteAction({ evaluationId, aspectCode, note: aspectNote.trim(), unitId })
      setBaseAspectNote(aspectNote.trim())
      toast.success(`Catatan resmi Aspek ${aspectCode} berhasil disimpan.`)
    } catch {
      toast.error('Gagal menyimpan catatan aspek.')
    } finally {
      setIsSavingAspect(false)
    }
  }

  const handleApplyPreset = () => {
    if (selectedScore === '') {
      toast.info('Pilih nilai (0-5) terlebih dahulu.')
      return
    }
    const valNum = Number(selectedScore)
    const option = guidance?.scale_options.find((opt: F02ScaleOption) => opt.value === valNum)
    if (option) {
      setNotes(option.label)
      toast.success(`Preset catatan Nilai ${valNum} berhasil digunakan!`)
    }
  }

  const handleCopyNoteToAspect = () => {
    if (!notes.trim()) {
      toast.info('Catatan pertanyaan masih kosong.')
      return
    }
    const prefix = `[#${indicatorNumber}] `
    const newAspectText = aspectNote.trim() ? `${aspectNote.trim()}\n${prefix}${notes.trim()}` : `${prefix}${notes.trim()}`
    setAspectNote(newAspectText)
    setActiveNoteTab('aspect')
    toast.success(`Catatan pertanyaan #${indicatorNumber} disalin ke Catatan Aspek MenPAN-RB!`)
  }

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopyToClipboard = async (text: string, key: string, label: string) => {
    if (!text?.trim()) return
    try {
      await navigator.clipboard.writeText(text.trim())
      setCopiedKey(key)
      toast.success(`${label} berhasil disalin ke clipboard!`)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error('Gagal menyalin ke clipboard.')
    }
  }

  // State to toggle Petunjuk & Dokumen Acuan (Collapsible to save vertical space)
  const [showGuidanceDetails, setShowGuidanceDetails] = useState<boolean>(false)

  return (
    <div data-indicator-dirty={isDirty} data-indicator-number={indicatorNumber} className="space-y-5 pt-2">
      {/* Hidden inputs to bind with outer form submission */}
      <input type="hidden" name={`score_${indicatorId}`} value={selectedScore} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke/40 pb-3">
        <div className="flex items-center gap-2.5">
          <h4 className="font-medium text-xs text-ink">
            Formulir Penilaian Evaluator (F02)
          </h4>
          {isDirty && (
            <span className="px-3 py-1 rounded-full bg-pastel-rose text-pastel-rose-text text-xs font-medium border border-rose-200 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5" /> Belum Disimpan
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Guidance & Data Sources (Warm Minimalist Bento) */}
      {guidance && (guidance.explanation || (guidance.data_sources && guidance.data_sources.length > 0)) && (
        <div className="rounded-2xl border border-stroke/70 bg-surface-subtle/25 overflow-hidden shadow-soft-card">
          <button
            type="button"
            onClick={() => setShowGuidanceDetails(!showGuidanceDetails)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-subtle/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5 text-xs font-medium text-ink">
              <div className="w-6 h-6 rounded-lg bg-surface-elevated border border-stroke/80 flex items-center justify-center shrink-0 text-ink-secondary shadow-2xs">
                <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
              </div>
              <span>Petunjuk Penilaian &amp; Dokumen Acuan Pembuktian</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
              <span>{showGuidanceDetails ? 'Sembunyikan' : 'Buka Petunjuk'}</span>
              {showGuidanceDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
              )}
            </div>
          </button>

          {showGuidanceDetails && (
            <div className="p-4 sm:p-5 pt-3 space-y-4 border-t border-stroke/40 bg-surface/60 text-xs">
              {/* Explanation */}
              {guidance.explanation && (
                <div className="space-y-1.5">
                  <div className="font-medium text-xs text-ink flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-pastel-blue border border-pastel-blue-border text-pastel-blue-text flex items-center justify-center shrink-0">
                      <Info className="w-3 h-3 text-blue-600" />
                    </div>
                    <span>Petunjuk Penilaian:</span>
                  </div>
                  <p className="text-xs text-ink-secondary font-normal leading-relaxed pl-7">
                    {guidance.explanation}
                  </p>
                </div>
              )}

              {/* Data Sources */}
              {guidance.data_sources && guidance.data_sources.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-stroke/30">
                  <div className="font-medium text-xs text-ink flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-pastel-amber border border-pastel-amber-border text-pastel-amber-text flex items-center justify-center shrink-0">
                      <FileSearch className="w-3 h-3 text-amber-600" />
                    </div>
                    <span>Dokumen / Data Acuan Pembuktian:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-ink-secondary font-normal space-y-1 pl-7 leading-relaxed">
                    {guidance.data_sources.map((ds: string, i: number) => (
                      <li key={i}>{ds}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SOKET AI PRE-EVALUATOR: LAPORAN PRE-EVALUASI DOKUMEN & BUKTI              */}
      {/* ========================================================================= */}
      {(aiCriticalAudit || aiConfidenceReason || aiWeaknessNotes || (aiSuggestedScore !== undefined && aiSuggestedScore !== null)) && (
        <div className="rounded-2xl border border-stroke/70 bg-surface-subtle/25 p-4 sm:p-5 space-y-4 shadow-soft-card">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stroke/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-light border border-brand/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-medium text-xs text-ink uppercase tracking-wider">
                  Laporan AI Pre-Evaluator
                </h5>
                <p className="text-[11px] text-ink-muted">
                  Audit otomatis berkas pendukung berdasarkan rubrik resmi MenPAN-RB
                </p>
              </div>
            </div>

            {/* Badges & Quick Action */}
            <div className="flex flex-wrap items-center gap-2">
              {aiConfidence !== null && aiConfidence !== undefined && (
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                    aiConfidence >= 75
                      ? 'bg-pastel-green text-pastel-green-text border-pastel-green-border'
                      : aiConfidence >= 50
                        ? 'bg-pastel-amber text-pastel-amber-text border-pastel-amber-border'
                        : 'bg-pastel-rose text-pastel-rose-text border-pastel-rose-border'
                  }`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiConfidence >= 75
                        ? 'bg-emerald-500'
                        : aiConfidence >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    Keyakinan: {aiConfidence >= 75 ? 'Tinggi' : aiConfidence >= 50 ? 'Sedang' : 'Rendah'} ({aiConfidence}%)
                  </span>
                </span>
              )}

              {aiSuggestedScore !== null && aiSuggestedScore !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    handleScoreSelect(String(aiSuggestedScore))
                    toast.success(`Skor rekomendasi AI (${aiSuggestedScore}) berhasil diterapkan!`)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terapkan Skor AI ({aiSuggestedScore})</span>
                </button>
              )}
            </div>
          </div>

          {/* Clean Listed Points (No Cluttered Boxes, Warm Minimalist) */}
          <div className="space-y-3.5 divide-y divide-stroke/30">
            {/* Poin Kritis: Audit Silang Kesesuaian Bukti vs Centangan F-01 */}
            {aiCriticalAudit && (
              <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                <div className="w-6 h-6 rounded-lg bg-pastel-rose border border-pastel-rose-border text-pastel-rose-text flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h6 className="text-xs font-medium text-ink flex items-center gap-1.5">
                      <span>Kritisi Kesesuaian Bukti vs Centangan F-01</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pastel-rose text-pastel-rose-text border border-pastel-rose-border">
                        Audit Silang
                      </span>
                    </h6>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(aiCriticalAudit, 'critical', 'Kritisi F01')}
                      className="text-xs font-medium text-ink-muted hover:text-ink inline-flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-surface-elevated">
                      {copiedKey === 'critical' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium text-xs">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap font-normal">
                    {aiCriticalAudit}
                  </p>
                </div>
              </div>
            )}

            {/* Poin 1: Analisis Ketidakyakinan AI */}
            {aiConfidenceReason && (
              <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                <div className="w-6 h-6 rounded-lg bg-pastel-amber border border-pastel-amber-border text-pastel-amber-text flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h6 className="text-xs font-medium text-ink">
                      Analisis Ketidakyakinan AI
                    </h6>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(aiConfidenceReason, 'reason', 'Analisis AI')}
                      className="text-xs font-medium text-ink-muted hover:text-ink inline-flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-surface-elevated">
                      {copiedKey === 'reason' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium text-xs">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap font-normal">
                    {aiConfidenceReason}
                  </p>
                </div>
              </div>
            )}

            {/* Poin 2: Apa yang Membuat Bukti Ini Kurang (Untuk Skala 5) */}
            {aiWeaknessNotes && (
              <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                <div className="w-6 h-6 rounded-lg bg-pastel-blue border border-pastel-blue-border text-pastel-blue-text flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h6 className="text-xs font-medium text-ink">
                      Apa yang Membuat Bukti Ini Kurang (Untuk Skala 5)
                    </h6>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(aiWeaknessNotes, 'weakness', 'Catatan Bukti Kurang')}
                      className="text-xs font-medium text-ink-muted hover:text-ink inline-flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-surface-elevated">
                      {copiedKey === 'weakness' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium text-xs">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap font-normal">
                    {aiWeaknessNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Poin 3: Rekomendasi Cek Fisik / Lapangan */}
            {aiVerificationTips && (
              <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                <div className="w-6 h-6 rounded-lg bg-surface-elevated border border-stroke/80 text-ink flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <FileSearch className="w-3.5 h-3.5 text-ink-muted" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h6 className="text-xs font-medium text-ink">
                      Rekomendasi Cek Fisik / Lapangan untuk Evaluator
                    </h6>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(aiVerificationTips, 'tips', 'Rekomendasi Lapangan')}
                      className="text-xs font-medium text-ink-muted hover:text-ink inline-flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-surface-elevated">
                      {copiedKey === 'tips' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium text-xs">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap font-normal">
                    {aiVerificationTips}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scale Options — primary scoring tool */}
      {guidance && (
        <div className="space-y-3 pt-2">
          <span className="text-xs font-medium text-ink block">
            Pilih Nilai Skala (0–5):
          </span>
          <div className="space-y-2">
            {guidance.scale_options.map((opt: F02ScaleOption) => {
              const isSelected = selectedScore === String(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => handleScoreSelect(String(opt.value))}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-brand-light/30 border-brand text-ink shadow-soft-card font-medium'
                      : 'bg-surface-elevated border-stroke/60 hover:border-stroke hover:bg-surface-subtle text-ink-secondary'
                  }`}>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-normal shrink-0 transition-all ${
                      isSelected
                        ? 'bg-brand text-white shadow-hz-button'
                        : 'bg-surface-subtle text-ink-muted border border-stroke/50'
                    }`}>
                    Skala {opt.value}
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p className={`leading-relaxed ${isSelected ? 'text-ink font-medium' : 'text-ink-secondary'}`}>
                      {opt.label}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0 self-center" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CATATAN INDIKATOR / ASPEK RESMI MENPAN-RB (1 CATATAN PER ASPEK) */}
      <div className="space-y-2.5 pt-4 border-t border-stroke/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-ink">
            <span>Catatan Rekomendasi Aspek {aspectCode} ({aspectName})</span>
            <span className="text-[10px] text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/50">
              Portal MenPAN-RB
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAspectDirty ? (
              <button
                type="button"
                disabled={isSavingAspect}
                onClick={handleSaveAspectNote}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all cursor-pointer shadow-hz-button">
                {isSavingAspect ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Simpan Catatan Aspek</>
                )}
              </button>
            ) : baseAspectNote ? (
              <span className="text-[11px] font-medium text-pastel-green-text bg-pastel-green px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersimpan untuk MenPAN
              </span>
            ) : null}
          </div>
        </div>

        <textarea
          rows={3}
          value={aspectNote}
          onChange={(e) => handleAspectNoteChange(e.target.value)}
          placeholder={`Tuliskan narasi catatan hasil pengamatan / rekomendasi untuk Aspek ${aspectCode} (${aspectName}) yang disinkronkan ke web MenPAN-RB...`}
          className="w-full px-3.5 py-2.5 text-xs font-normal rounded-xl border border-stroke/60 bg-surface-elevated text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand resize-y min-h-[72px] shadow-2xs leading-relaxed"
        />

        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>Catatan ini adalah rekomendasi resmi per aspek yang akan dikirimkan ke MenPAN-RB.</span>
          {isAspectDirty && (
            <span className="text-pastel-rose-text font-normal">• Ada perubahan belum disimpan</span>
          )}
        </div>
      </div>

      {/* Bottom Action Bar: Simpan Pertanyaan Ini */}
      {evaluationId && isDirty && (
        <div className="pt-2 flex items-center justify-between border-t border-stroke/40">
          <div className="flex items-center gap-1.5 text-xs text-pastel-rose-text">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Pertanyaan #{indicatorNumber} memiliki perubahan yang belum disimpan.</span>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveSingleF02}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button disabled:opacity-50 cursor-pointer">
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pertanyaan #{indicatorNumber}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
