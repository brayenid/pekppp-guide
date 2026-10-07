'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, Loader2, AlertCircle, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { saveAspectNoteAction } from '../../actions/evaluation-actions'

export function AspectNoteSection({
  evaluationId,
  unitId,
  aspectCode,
  aspectName,
  initialNote,
  isEvaluator,
}: {
  evaluationId: string
  unitId: string
  aspectCode: string
  aspectName: string
  initialNote?: string
  isEvaluator: boolean
}) {
  const [note, setNote] = useState(initialNote || '')
  const [savedNote, setSavedNote] = useState(initialNote || '')
  const [isSaving, setIsSaving] = useState(false)

  // Sync when server revalidates with new props
  useEffect(() => {
    setSavedNote(initialNote || '')
    setNote(initialNote || '')
  }, [initialNote, aspectCode])

  const isDirty = note.trim() !== savedNote.trim()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveAspectNoteAction({ evaluationId, aspectCode, note: note.trim(), unitId })
      setSavedNote(note.trim())
      toast.success(`Catatan aspek ${aspectCode} berhasil disimpan.`)
    } catch {
      toast.error('Gagal menyimpan catatan.')
    } finally {
      setIsSaving(false)
    }
  }

  // Read-only mode for OPD: only show if there is a note
  if (!isEvaluator) {
    if (!savedNote) return null
    return (
      <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-2xs">
        <NotebookPen className="w-4 h-4 text-[#2B6CB0] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B2559]">
              Catatan Aspek: {aspectCode}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2B6CB0] border border-blue-200">
              Rekomendasi AI / Evaluator
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{savedNote}</p>
        </div>
      </div>
    )
  }

  // Evaluator edit mode
  return (
    <div
      data-aspect-dirty={isDirty}
      className="mt-3 space-y-2.5 p-4 rounded-xl border border-slate-200 bg-amber-50/40 hover:border-amber-300 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
          <MessageSquare className="w-4 h-4 text-amber-700" />
          Catatan Evaluator: Aspek {aspectCode}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" /> Belum disimpan
            </span>
          )}
          {!isDirty && savedNote && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
            </span>
          )}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Tuliskan catatan evaluasi untuk Aspek ${aspectCode} - ${aspectName}...`}
        rows={3}
        className="w-full p-3 text-sm font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-400 text-slate-900 resize-none leading-relaxed placeholder:text-slate-400 shadow-2xs"
      />

      {isDirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hz-brand hover:bg-hz-brand-hover text-white font-semibold text-xs transition-all disabled:opacity-55 cursor-pointer shadow-hz-button">
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Simpan Catatan Aspek</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
