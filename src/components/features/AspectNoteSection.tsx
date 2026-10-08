'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, Loader2, AlertCircle, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import { saveAspectNoteAction } from '../../actions/evaluation-actions'
import { NoticeBanner } from '../ui/NoticeBanner'

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
      <NoticeBanner
        variant="info"
        icon={NotebookPen}
        title={`Catatan Aspek: ${aspectCode}`}
        badge="Rekomendasi Evaluator"
        description={savedNote}
        className="mt-3"
      />
    )
  }

  // Evaluator edit mode
  return (
    <div
      data-aspect-dirty={isDirty}
      className="mt-3 space-y-2.5 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-950 dark:text-amber-200">
          <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Catatan Evaluator: Aspek {aspectCode}</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" /> Belum disimpan
            </span>
          )}
          {!isDirty && savedNote && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
        className="w-full p-3 text-xs sm:text-sm font-normal rounded-xl border border-stroke/70 bg-surface text-ink focus:outline-none focus:border-brand resize-none leading-relaxed placeholder:text-ink-muted shadow-2xs"
      />

      {isDirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-all disabled:opacity-55 cursor-pointer shadow-hz-button">
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
