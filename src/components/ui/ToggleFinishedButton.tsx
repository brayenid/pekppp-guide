'use client'

import { useState } from 'react'
import { CheckCircle2, RotateCcw, Loader2, Check } from 'lucide-react'
import { toggleEvaluationFinishedAction } from '../../actions/evaluation-actions'
import { toast } from 'sonner'
import { ConfirmationModal } from './ConfirmationModal'

interface ToggleFinishedButtonProps {
  evaluationId: string
  initialIsFinished: boolean
  unitName?: string
}

export function ToggleFinishedButton({
  evaluationId,
  initialIsFinished,
  unitName
}: ToggleFinishedButtonProps) {
  const [isFinished, setIsFinished] = useState(initialIsFinished)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await toggleEvaluationFinishedAction(evaluationId, !isFinished)
      if (res.success) {
        setIsFinished(res.isFinished!)
        if (res.isFinished) {
          toast.success(`Penilaian ${unitName ? `"${unitName}"` : ''} berhasil ditandai SELESAI!`)
        } else {
          toast.info(`Status selesai penilaian ${unitName ? `"${unitName}"` : ''} dibatalkan.`)
        }
      } else {
        toast.error(res.error || 'Gagal mengubah status penilaian.')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem saat memperbarui status penilaian.')
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      {isFinished ? (
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Penilaian Selesai
          </span>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 hover:text-amber-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Batalkan status selesai penilaian untuk unit ini">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Batalkan Selesai</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          title="Tandai bahwa seluruh proses penilaian untuk unit ini telah selesai">
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Penilaian Selesai</span>
            </>
          )}
        </button>
      )}

      <ConfirmationModal
        isOpen={confirmOpen}
        title={isFinished ? 'Batalkan Status Selesai Penilaian?' : 'Tandai Penilaian Selesai?'}
        description={
          isFinished
            ? `Status penilaian untuk ${unitName ? `"${unitName}"` : 'unit ini'} akan dikembalikan ke status belum selesai / dalam proses.`
            : `Menandai penilaian ${unitName ? `"${unitName}"` : 'unit ini'} sebagai SELESAI untuk tahun penilaian terkait. Status ini dapat dibatalkan kapan saja jika ada perbaikan data.`
        }
        confirmText={isFinished ? 'Ya, Batalkan Selesai' : 'Ya, Tandai Selesai'}
        cancelText="Batal"
        variant={isFinished ? 'warning' : 'primary'}
        loading={loading}
        onConfirm={handleToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
