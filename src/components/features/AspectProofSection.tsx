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
    <div className="pt-3 border-t border-[#e8e8e8]">
      <div
        className={`p-4 rounded-[12px] border transition-all shadow-xs ${
          isUploaded
            ? 'bg-gradient-to-r from-[#f0fdf4] to-white border-[#6ee7b7]'
            : 'bg-gradient-to-r from-[#fffbebe6] via-[#fffbeb] to-white border-[#fcd34d] ring-2 ring-[#f59e0b]/20'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Label & Status Info */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isUploaded ? 'bg-[#10b981]/15 text-[#047857]' : 'bg-[#f59e0b]/20 text-[#b45309]'
                }`}>
                {isUploaded ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>

              <span className="font-bold text-sm uppercase tracking-wider text-slate-900">
                Bukti Dukung Utama: {aspectName}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isUploaded
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                {isUploaded ? '✓ Bukti Dukung Tersedia' : 'Belum Ada Bukti Dukung'}
              </span>
            </div>

            <p className="text-xs text-slate-600 pl-8 leading-relaxed font-medium">
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
                  <Folder className="w-4 h-4 text-[#0091ff] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Paste link folder Google Drive di sini..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-[9px] border border-[#d1d5db] bg-white font-mono text-[#202020] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#0091ff] focus:ring-2 focus:ring-[#0091ff]/20 shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveProof}
                  disabled={loading || !isDirty}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    isDirty
                      ? 'bg-slate-900 hover:bg-slate-800 text-white ring-2 ring-slate-900/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                className="px-3 py-2 rounded-full bg-[#0091ff]/10 hover:bg-[#0091ff]/20 text-[#0091ff] border border-[#0091ff]/30 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs">
                {notifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#0091ff]" />
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0091ff] hover:bg-[#0077d6] text-white text-xs font-bold transition-all shadow-xs">
                  <Folder className="w-4 h-4" />
                  <span>Buka Folder Drive Bukti Dukung</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
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
