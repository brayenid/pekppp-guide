'use client'

import { useState } from 'react'
import { saveF01DataAction } from '../../actions/evaluation-actions'
import { triggerProofNotificationAction } from '../../actions/notification-actions'
import { Folder, ExternalLink, Save, Loader2, AlertTriangle, CheckCircle2, Send, Bell } from 'lucide-react'
import { toast } from 'sonner'

export function AspectProofSection({
  firstEvaluationScoreId,
  existingProofUrl,
  aspectName,
  unitId,
  isEditable
}: {
  firstEvaluationScoreId: string
  existingProofUrl?: string | null
  aspectName: string
  unitId: string
  isEditable: boolean
}) {
  const [proofUrl, setProofUrl] = useState<string>(existingProofUrl || '')
  const [initialProofUrl, setInitialProofUrl] = useState<string>(existingProofUrl || '')
  const [loading, setLoading] = useState(false)
  const [notifying, setNotifying] = useState(false)

  const isDirty = isEditable && proofUrl.trim() !== initialProofUrl.trim()
  const isUploaded = Boolean(initialProofUrl.trim())

  const handleSaveProof = async () => {
    if (!isEditable) return
    setLoading(true)
    try {
      await saveF01DataAction({
        evaluationScoreId: firstEvaluationScoreId,
        f01Data: {},
        proofUrl: proofUrl.trim() || undefined,
        path: `/evaluasi/${unitId}`
      })
      setInitialProofUrl(proofUrl.trim())
      toast.success(`Link Bukti Dukung ${aspectName} berhasil disimpan!`)
    } catch {
      toast.error('Gagal menyimpan link bukti dukung.')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerNotify = async () => {
    setNotifying(true)
    try {
      await triggerProofNotificationAction(unitId, aspectName)
      toast.success(`Notifikasi pembaruan berkas Drive ${aspectName} berhasil dikirim ke Admin/Evaluator!`)
    } catch {
      toast.error('Gagal mengirim notifikasi.')
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="pt-3 border-t border-stroke">
      <div
        className={`p-4 rounded-xl border transition-all shadow-xs ${
          isUploaded
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-500/20'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Label & Status Info */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isUploaded
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}>
                {isUploaded ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>

              <span className="font-bold text-sm uppercase tracking-wider text-ink">
                Bukti Dukung Utama: {aspectName}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isUploaded
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                }`}>
                {isUploaded ? '✓ Bukti Dukung Tersedia' : 'Belum Ada Bukti Dukung'}
              </span>
            </div>

            <p className="text-xs text-ink-secondary pl-8 leading-relaxed font-medium">
              {isEditable
                ? 'Lampirkan link folder Google Drive berisi seluruh dokumen bukti dukung pendukung untuk pertanyaan dalam aspek ini.'
                : 'Folder Google Drive acuan verifikasi evaluator untuk seluruh pertanyaan pada aspek ini.'}
            </p>
          </div>

          {/* Action Input / Button */}
          {isEditable ? (
            /* Mode Edit OPD */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto pt-1 md:pt-0">
              <div className="flex items-center gap-2 flex-1 md:w-[320px]">
                <div className="relative flex-1">
                  <Folder className="w-4 h-4 text-brand absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Paste link folder Google Drive di sini..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stroke bg-surface dark:bg-surface-elevated font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveProof}
                  disabled={loading || !isDirty}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    isDirty
                      ? 'bg-brand hover:bg-brand-hover text-white shadow-hz-button'
                      : 'bg-surface-elevated text-ink-muted border border-stroke/50 cursor-not-allowed'
                  }`}>
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Simpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUploaded ? 'Simpan' : 'Simpan'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Special Manual Trigger Button for OPD */}
              <button
                type="button"
                onClick={handleTriggerNotify}
                disabled={notifying}
                title="Klik untuk mengirimkan pesan notifikasi kepada Admin/Evaluator bahwa ada penambahan/perubahan isi berkas pada Google Drive ini"
                className="px-3 py-2 rounded-full bg-brand-light hover:bg-brand/20 text-brand border border-brand/30 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs">
                {notifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-brand" />
                    <span>Kirim Notif</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Mode Tampil Evaluator */
            <div className="pt-1 md:pt-0 shrink-0">
              {proofUrl ? (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-xs">
                  <Folder className="w-4 h-4" />
                  <span>Buka Folder Drive Bukti Dukung</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800/60">
                  Belum Ada Link Bukti Dukung
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
