'use client'

import { useState, useEffect } from 'react'
import { getF02GuidanceByNumber, F02ScaleOption } from '../../lib/f02-parser'
import { saveScoresAction } from '../../actions/evaluation-actions'
import {
  CheckCircle2,
  Check,
  HelpCircle,
  FileSearch,
  Sparkles,
  Save,
  AlertCircle,
  Loader2,
  FileEdit,
  Globe,
  Copy,
  Info,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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
  const resolvedScoreVal =
    resolvedDraftScore !== undefined && resolvedDraftScore !== null ? String(resolvedDraftScore) : ''
  const resolvedBaseScoreVal =
    resolvedServerScore !== undefined && resolvedServerScore !== null ? String(resolvedServerScore) : ''

  const resolvedServerNotes = (
    serverNotes !== undefined && serverNotes !== null ? serverNotes : initialNotes || ''
  ).trim()
  // If draftNotes is undefined, fallback to server notes
  const resolvedDraftNotes = (draftNotes !== undefined && draftNotes !== null ? draftNotes : resolvedServerNotes).trim()

  const resolvedServerAspect = (
    serverAspectNote !== undefined && serverAspectNote !== null ? serverAspectNote : initialAspectNote || ''
  ).trim()
  // If draftAspectNote is undefined, fallback to server aspect note
  const resolvedDraftAspect = (
    draftAspectNote !== undefined && draftAspectNote !== null ? draftAspectNote : resolvedServerAspect
  ).trim()

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

  const isDirty =
    (selectedScore !== baseScore && (selectedScore !== '' || baseScore !== '')) || notes.trim() !== baseNotes.trim()
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
  }, [
    isDirty,
    isAspectDirty,
    evaluationId,
    indicatorId,
    selectedScore,
    notes,
    aspectCode,
    aspectNote,
    unitId,
    onSaveSuccess
  ])

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
    const newAspectText = aspectNote.trim()
      ? `${aspectNote.trim()}\n${prefix}${notes.trim()}`
      : `${prefix}${notes.trim()}`
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

  const handleApplyAiToAspectNote = () => {
    // Collect contextual recommendations and notes from AI
    const parts: string[] = []
    if (aiVerificationTips?.trim()) {
      parts.push(`Rekomendasi Lapangan: ${aiVerificationTips.trim()}`)
    }
    if (aiWeaknessNotes?.trim() && !aiWeaknessNotes.toLowerCase().includes('tidak ada')) {
      parts.push(`Catatan Perbaikan: ${aiWeaknessNotes.trim()}`)
    }
    if (aiCriticalAudit?.trim()) {
      parts.push(`Catatan Bukti F-01: ${aiCriticalAudit.trim()}`)
    }

    // Fallback if none of the above are present but confidence reason exists
    if (parts.length === 0 && aiConfidenceReason?.trim()) {
      parts.push(aiConfidenceReason.trim())
    }

    if (parts.length === 0) {
      toast.info('Tidak ada rekomendasi AI yang relevan untuk disalin ke catatan aspek.')
      return
    }

    const compiledText = `[#${indicatorNumber}] ${parts.join(' | ')}`
    const newAspectText = aspectNote.trim() ? `${aspectNote.trim()}\n${compiledText}` : compiledText
    handleAspectNoteChange(newAspectText)
    toast.success(`Rekomendasi AI pertanyaan #${indicatorNumber} ditambahkan ke Catatan Rekomendasi Aspek!`)
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
          <h4 className="font-medium text-xs text-ink">Formulir Penilaian Evaluator (F02)</h4>
        </div>
      </div>

      {/* Collapsible Guidance & Data Sources (Compact & Modern) */}
      {guidance && (guidance.explanation || (guidance.data_sources && guidance.data_sources.length > 0)) && (
        <div className="rounded-xl border border-stroke/70 bg-surface-subtle/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuidanceDetails(!showGuidanceDetails)}
            className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2 text-left hover:bg-surface-subtle/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-xs font-medium text-ink min-w-0">
              <HelpCircle className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="truncate">Petunjuk &amp; Acuan Pembuktian</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-brand hover:underline font-medium shrink-0">
              <span>{showGuidanceDetails ? 'Tutup' : 'Petunjuk'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showGuidanceDetails ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showGuidanceDetails && (
            <div className="p-3 sm:p-4 pt-2.5 space-y-3 border-t border-stroke/40 bg-surface/50 text-xs">
              {/* Explanation */}
              {guidance.explanation && (
                <div className="space-y-1">
                  <div className="font-semibold text-[11px] text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-brand shrink-0" />
                    <span>Petunjuk Penilaian</span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed pl-4.5">{guidance.explanation}</p>
                </div>
              )}

              {/* Data Sources */}
              {guidance.data_sources && guidance.data_sources.length > 0 && (
                <div className="space-y-1 pt-2.5 border-t border-stroke/30">
                  <div className="font-semibold text-[11px] text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <FileSearch className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Dokumen / Data Acuan Pembuktian</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-ink-secondary space-y-1 pl-4.5 leading-relaxed">
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
      {(aiCriticalAudit ||
        aiConfidenceReason ||
        aiWeaknessNotes ||
        (aiSuggestedScore !== undefined && aiSuggestedScore !== null)) && (
        <div className="rounded-2xl border border-stroke/70 bg-surface-subtle/25 p-4 sm:p-5 space-y-4 shadow-soft-card">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stroke/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <h5 className="font-semibold text-xs text-ink uppercase tracking-wider">Laporan AI Pre-Evaluator</h5>
                {aiConfidence !== null && aiConfidence !== undefined ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        aiConfidence >= 75 ? 'bg-emerald-500' : aiConfidence >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                    <span
                      className={
                        aiConfidence >= 75
                          ? 'text-emerald-700'
                          : aiConfidence >= 50
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }>
                      Keyakinan: {aiConfidence >= 75 ? 'Tinggi' : aiConfidence >= 50 ? 'Sedang' : 'Rendah'} (
                      {aiConfidence}%)
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Audit otomatis berkas pendukung berdasarkan rubrik resmi MenPAN-RB
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions: Jadikan Catatan Aspek & Terapkan Skor AI */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApplyAiToAspectNote}
                title="Salin temuan & rekomendasi AI pertanyaan ini ke Catatan Rekomendasi Aspek"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated hover:bg-surface-subtle text-ink text-[11px] font-medium border border-stroke/60 transition-all cursor-pointer shadow-2xs hover:border-stroke">
                <FileEdit className="w-3 h-3 text-ink-muted" />
                <span>Catatan Aspek</span>
              </button>

              {aiSuggestedScore !== null && aiSuggestedScore !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    handleScoreSelect(String(aiSuggestedScore))
                    toast.success(`Skor rekomendasi AI (${aiSuggestedScore}) berhasil diterapkan!`)
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand hover:bg-brand-hover text-white text-[11px] font-medium transition-all shadow-hz-button cursor-pointer">
                  <Sparkles className="w-3 h-3" />
                  <span>Terapkan Skor AI ({aiSuggestedScore})</span>
                </button>
              )}
            </div>
          </div>

          {/* Clean Listed Points (No Cluttered Boxes, Warm Minimalist) */}
          <div className="space-y-3.5 divide-y divide-stroke/30">
            {/* Poin Kritis: Audit Silang Kesesuaian Bukti vs Centangan F-01 */}
            {aiCriticalAudit && (() => {
              const textLower = aiCriticalAudit.toLowerCase()
              const isSafe = (
                textLower.includes('klaim terpenuhi') ||
                textLower.includes('sesuai') ||
                textLower.includes('lengkap') ||
                textLower.includes('valid') ||
                textLower.includes('terbukti')
              ) && !(
                textLower.includes('tidak sesuai') ||
                textLower.includes('belum sesuai') ||
                textLower.includes('tidak ditemukan') ||
                textLower.includes('tidak ada bukti') ||
                textLower.includes('klaim berlebihan') ||
                textLower.includes('inkonsisten')
              )

              return (
                <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border ${
                    isSafe
                      ? 'bg-pastel-green border-pastel-green-border text-pastel-green-text'
                      : 'bg-pastel-amber border-pastel-amber-border text-pastel-amber-text'
                  }`}>
                    {isSafe ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h6 className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <span>Kritisi Kesesuaian Bukti vs Centangan F-01</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isSafe
                            ? 'bg-pastel-green text-pastel-green-text border-pastel-green-border'
                            : 'bg-pastel-amber text-pastel-amber-text border-pastel-amber-border'
                        }`}>
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
              )
            })()}

            {/* Poin 1: Analisis Ketidakyakinan AI */}
            {aiConfidenceReason && (
              <div className="flex items-start gap-3 pt-3.5 first:pt-0">
                <div className="w-6 h-6 rounded-lg bg-pastel-amber border border-pastel-amber-border text-pastel-amber-text flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h6 className="text-xs font-medium text-ink">Analisis Ketidakyakinan AI</h6>
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
                    <h6 className="text-xs font-medium text-ink">Apa yang Membuat Bukti Ini Kurang (Untuk Skala 5)</h6>
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
                    <h6 className="text-xs font-medium text-ink">Rekomendasi Cek Fisik / Lapangan untuk Evaluator</h6>
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
        <div className="space-y-2 pt-1 sm:pt-2">
          <span className="text-xs font-semibold text-ink block">Pilih Nilai Skala (0–5):</span>
          <div className="space-y-1.5 sm:space-y-2">
            {guidance.scale_options.map((opt: F02ScaleOption) => {
              const isSelected = selectedScore === String(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => handleScoreSelect(String(opt.value))}
                  className={`p-2.5 sm:p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-start gap-2.5 sm:gap-3.5 ${
                    isSelected
                      ? 'bg-brand-light/30 border-brand text-ink shadow-soft-card font-medium'
                      : 'bg-surface-elevated border-stroke/60 hover:border-stroke hover:bg-surface-subtle text-ink-secondary'
                  }`}>
                  <span
                    className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-brand text-white shadow-hz-button'
                        : 'bg-surface-subtle text-ink-muted border border-stroke/50'
                    }`}>
                    Skala {opt.value}
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p className={`leading-relaxed text-xs sm:text-sm ${isSelected ? 'text-ink font-semibold' : 'text-ink-secondary'}`}>
                      {opt.label}
                    </p>
                  </div>
                  <div className="w-4 h-4 shrink-0 self-center flex items-center justify-center">
                    <CheckCircle2
                      className={`w-4 h-4 text-brand transition-all duration-200 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CATATAN INDIKATOR / ASPEK RESMI MENPAN-RB (1 CATATAN PER ASPEK) */}
      <div className="space-y-2 pt-3 border-t border-stroke/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink min-w-0">
            <span className="truncate">
              Catatan Rekomendasi ({aspectName})
            </span>
            <span className="text-[10px] text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/50 shrink-0">
              MenPAN-RB
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAspectDirty ? (
              <button
                type="button"
                disabled={isSavingAspect}
                onClick={handleSaveAspectNote}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all cursor-pointer shadow-xs">
                {isSavingAspect ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" /> Simpan Catatan
                  </>
                )}
              </button>
            ) : baseAspectNote ? (
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Tersimpan
              </span>
            ) : null}
          </div>
        </div>

        <textarea
          rows={2}
          value={aspectNote}
          onChange={(e) => handleAspectNoteChange(e.target.value)}
          placeholder={`Tuliskan narasi catatan / rekomendasi resmi untuk Aspek ${aspectName}...`}
          className="w-full px-3 py-2 text-xs font-normal rounded-lg border border-stroke/70 bg-surface-elevated text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-y min-h-[56px] shadow-2xs leading-relaxed"
        />

        <div className="flex items-center justify-between text-[10px] text-ink-muted">
          <span className="truncate">Rekomendasi resmi per aspek untuk sinkronisasi MenPAN-RB</span>
          {isAspectDirty && <span className="text-amber-600 dark:text-amber-400 font-medium shrink-0 ml-1.5">• Belum disimpan</span>}
        </div>
      </div>
    </div>
  )
}
