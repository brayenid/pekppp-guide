'use client'

import { useState, useEffect } from 'react'
import {
  validateEvaluationSyncAction,
  pushEvaluationSyncAction,
  checkEvaluationConflictAction,
  linkEvaluationToMenpanAction
} from '../../actions/menpan-actions'
import { SyncValidationResult } from '../../services/sync-validator-service'
import { FormModal } from '../ui/FormModal'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Send,
  Download,
  Link2,
  HelpCircle
} from 'lucide-react'
import { toast } from 'sonner'

export function MenpanSyncModal({
  isOpen,
  onClose,
  evaluationId,
  unitName,
  year
}: {
  isOpen: boolean
  onClose: () => void
  evaluationId: string
  unitName: string
  year: number
}) {
  const [activeTab, setActiveTab] = useState<'PULL' | 'PUSH'>('PULL')
  const [loading, setLoading] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [linking, setLinking] = useState(false)

  // Validation state for PUSH
  const [validation, setValidation] = useState<SyncValidationResult | null>(null)
  const [syncResponse, setSyncResponse] = useState<{ success: boolean; message: string; menpanRefId?: string } | null>(null)

  // Conflict / Linking state for PULL
  const [conflictData, setConflictData] = useState<any | null>(null)
  const [selectedRemoteUuid, setSelectedRemoteUuid] = useState<string>('')

  const loadData = async () => {
    if (!evaluationId) return
    setLoading(true)
    setSyncResponse(null)
    try {
      const [valRes, confRes] = await Promise.all([
        validateEvaluationSyncAction(evaluationId),
        checkEvaluationConflictAction(evaluationId)
      ])
      setValidation(valRes)
      setConflictData(confRes)
      if (confRes.matchedRemote) {
        setSelectedRemoteUuid(confRes.matchedRemote.uuid)
      }
    } catch {
      toast.error('Gagal memuat status sinkronisasi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && evaluationId) {
      loadData()
    }
  }, [isOpen, evaluationId])

  const handleLinkUuid = async () => {
    if (!selectedRemoteUuid) {
      toast.warning('Pilih salah satu evaluasi dari portal MenPAN-RB terlebih dahulu.')
      return
    }

    setLinking(true)
    try {
      const res = await linkEvaluationToMenpanAction(evaluationId, selectedRemoteUuid)
      if (res.success) {
        toast.success(res.message)
        await loadData()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Gagal menautkan UUID MenPAN.')
    } finally {
      setLinking(false)
    }
  }

  const handlePush = async () => {
    if (!validation?.isEligible) {
      toast.error('Data evaluasi belum memenuhi syarat kelengkapan untuk dikirim.')
      return
    }

    setPushing(true)
    setSyncResponse(null)
    try {
      const res = await pushEvaluationSyncAction(evaluationId)
      setSyncResponse(res)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      toast.error(`Gagal mengirim data ke API MenPAN: ${err.message || 'Kesalahan sistem'}`)
    } finally {
      setPushing(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={`Integrasi MenPAN-RB · ${unitName}`}
      description={`Tinjau status keterhubungan lokus (PULL) dan konfirmasi pengiriman hasil evaluasi (PUSH) untuk Tahun ${year}.`}>
      <div className="space-y-4 pt-1 max-h-[78vh] overflow-y-auto pr-1 text-ink">
        {/* Navigation Tabs By Control */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-stroke/50">
          <button
            type="button"
            onClick={() => setActiveTab('PULL')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'PULL'
                ? 'bg-surface text-brand shadow-2xs border border-stroke/40'
                : 'text-ink-secondary hover:text-ink'
            }`}>
            <Download className="w-3.5 h-3.5" />
            <span>1. Tarik &amp; Pemetaan Lokus (PULL)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PUSH')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'PUSH'
                ? 'bg-surface text-brand shadow-2xs border border-stroke/40'
                : 'text-ink-secondary hover:text-ink'
            }`}>
            <Send className="w-3.5 h-3.5" />
            <span>2. Konfirmasi &amp; Kirim Jawaban (PUSH)</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            <p className="text-xs text-ink-secondary font-medium">
              Memeriksa data lokal dan mengontak server MenPAN-RB...
            </p>
          </div>
        ) : activeTab === 'PULL' ? (
          /* ==========================================================
             TAB PULL: Pemetaan UUID & Resolusi Konflik Berdampingan
             ========================================================== */
          <div className="space-y-4 text-xs">
            {conflictData ? (
              <>
                {/* Status Tautan UUID */}
                <div className="p-4 rounded-xl border border-stroke/60 bg-surface space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-brand" />
                      <span className="font-semibold text-xs text-ink">Pemetaan Evaluasi MenPAN-RB</span>
                    </div>
                    {conflictData.localEval?.menpanEvaluationId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                        Tertaut
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                        Belum Ditautkan
                      </span>
                    )}
                  </div>

                  {/* Dropdown Pemilihan Remote UUID */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                      value={selectedRemoteUuid}
                      onChange={(e) => setSelectedRemoteUuid(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium">
                      <option value="">-- Pilih Evaluasi dari Portal MenPAN-RB --</option>
                      {conflictData.availableRemotes?.map((rem: any) => (
                        <option key={rem.uuid} value={rem.uuid}>
                          {rem.name} ({rem.form_sheet?.name || 'F01'} · Status: {rem.status})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleLinkUuid}
                      disabled={linking || !selectedRemoteUuid}
                      className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0">
                      {linking ? 'Menautkan...' : 'Tautkan UUID'}
                    </button>
                  </div>
                </div>

                {/* SIDE-BY-SIDE COMPARISON (Komparasi Berdampingan) */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    Komparasi Berdampingan:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Kolom 1: Data Lokal Kutai Barat */}
                    <div className="p-4 rounded-xl bg-surface border border-stroke/60 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <span className="font-semibold text-xs text-ink">Sistem Lokal (Kutai Barat)</span>
                        <span className="text-[10px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">
                          Lokal
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-ink-muted text-[11px]">Nama Lokus:</span>
                          <span className="font-semibold text-ink text-right truncate">
                            {conflictData.localEval?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Indikator Terisi:</span>
                          <span className="font-semibold text-ink">
                            {conflictData.localEval?.filledCount} / {conflictData.localEval?.totalIndicators}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Skor Nilai F02:</span>
                          <span className="font-bold text-[#1B2559]">
                            {conflictData.localEval?.score > 0 ? conflictData.localEval?.score.toFixed(2) : 'Belum Dinilai'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Persentase F02:</span>
                          <span className="font-semibold text-emerald-700">
                            {conflictData.localEval?.percentage > 0 ? `${conflictData.localEval?.percentage.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kolom 2: Data Server MenPAN-RB */}
                    <div className="p-4 rounded-xl bg-surface border border-stroke/60 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <span className="font-semibold text-xs text-ink">Server MenPAN-RB</span>
                        <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full">
                          Remote
                        </span>
                      </div>

                      {conflictData.matchedRemote ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-ink-muted text-[11px]">Nama Evaluasi:</span>
                            <span className="font-semibold text-ink text-right max-w-[190px] truncate" title={conflictData.matchedRemote.name}>
                              {conflictData.matchedRemote.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-muted text-[11px]">Status Pengisian:</span>
                            <span className="font-medium text-ink">
                              {conflictData.matchedRemote.status || 'Belum Diisi'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-muted text-[11px]">Jawaban Tersimpan:</span>
                            <span className="font-semibold text-ink">
                              {conflictData.remoteAnswersCount || 0} butir
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-muted text-[11px]">Progress Pusat:</span>
                            <span className="font-semibold text-brand">
                              {conflictData.matchedRemote.progress_percentage != null
                                ? `${conflictData.matchedRemote.progress_percentage}%`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-ink-muted text-xs">
                          Belum ada data evaluasi MenPAN yang terpilih.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Deteksi Konflik */}
                {conflictData.hasConflict && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Terdeteksi Data Jawaban yang Sudah Tersimpan di Server MenPAN-RB</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Server pusat sudah memiliki {conflictData.remoteAnswersCount} jawaban yang terisi. Pengiriman ulang melalui tab PUSH akan memperbarui dan menimpa jawaban di server pusat MenPAN-RB sesuai data lokal Anda saat ini.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-ink-muted italic">Kredensial API belum terkonfigurasi.</p>
            )}
          </div>
        ) : (
          /* ==========================================================
             TAB PUSH: Validasi Kelengkapan & Konfirmasi Pengiriman Sadar
             ========================================================== */
          validation && (
            <div className="space-y-4 text-xs">
              {/* Status Kelayakan */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  validation.isEligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                {validation.isEligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold text-xs">
                    {validation.isEligible
                      ? 'Data Lengkap - Memenuhi Syarat Pengiriman MenPAN-RB'
                      : 'Berkas Belum Memenuhi Syarat Gate MenPAN-RB'}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {validation.isEligible
                      ? 'Seluruh 31 indikator F-01, F-02, dan kuota F-03 telah lengkap. Server MenPAN tidak akan menolak (reject 422).'
                      : 'Sesuai spesifikasi MenPAN-RB, seluruh pertanyaan wajib (is_required) harus lengkap terisi sebelum dikirim.'}
                  </p>
                </div>
              </div>

              {/* Checklist Kelengkapan */}
              <div className="rounded-xl border border-stroke/50 bg-surface-subtle/50 p-3.5 space-y-2">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Checklist Verifikasi Pra-Kirim:
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-stroke/40">
                    <span className="text-ink">F-01 Mandiri OPD ({validation.f01FilledCount}/31)</span>
                    {validation.f01Complete ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Belum Lengkap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-stroke/40">
                    <span className="text-ink">F-02 Penilaian Evaluator ({validation.f02FilledCount}/31)</span>
                    {validation.f02Complete ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Belum Lengkap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-stroke/40">
                    <span className="text-ink">F-03 Kuota Responden ({validation.f03FilledCount}/{validation.targetQuota})</span>
                    {validation.f03Complete ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terpenuhi
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Belum Terpenuhi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rincian Kendala jika ada */}
              {validation.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="font-semibold text-xs flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rincian Butir yang Perlu Dilengkapi:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Respons Pengiriman Terakhir */}
              {syncResponse && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    syncResponse.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {syncResponse.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{syncResponse.success ? 'Berhasil Dikirim ke Antrean MenPAN-RB!' : 'Pengiriman Ditolak'}</span>
                  </div>
                  <p className="text-[11px]">{syncResponse.message}</p>
                </div>
              )}
            </div>
          )
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-stroke/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stroke/60 text-xs font-semibold text-ink-secondary hover:bg-surface-subtle transition-colors cursor-pointer">
            Tutup
          </button>

          {activeTab === 'PUSH' && (
            <button
              type="button"
              onClick={handlePush}
              disabled={!validation?.isEligible || pushing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shadow-hz-button cursor-pointer disabled:opacity-50">
              {pushing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirimkan Jawaban...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Konfirmasi &amp; Kirim ke MenPAN-RB</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </FormModal>
  )
}
