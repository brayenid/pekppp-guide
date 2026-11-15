'use client'

import { useState, useEffect } from 'react'
import {
  validateEvaluationSyncAction,
  pushEvaluationSyncAction,
  pullEvaluationAnswersFromMenpanAction,
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
  HelpCircle,
  FileText,
  ExternalLink,
  Clock,
  ArrowRightLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '-'
    return (
      d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar'
      }) + ' WITA'
    )
  } catch {
    return isoString
  }
}

export function MenpanSyncModal({
  isOpen,
  onClose,
  evaluationId,
  unitId,
  unitName,
  year
}: {
  isOpen: boolean
  onClose: () => void
  evaluationId: string
  unitId?: string
  unitName: string
  year: number
}) {
  const [activeTab, setActiveTab] = useState<'PULL' | 'PUSH'>('PULL')
  const [loading, setLoading] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [linking, setLinking] = useState(false)

  // Validation state for PUSH
  const [validation, setValidation] = useState<SyncValidationResult | null>(null)
  const [targetForm, setTargetForm] = useState<'ALL' | 'F01' | 'F02' | 'F03'>('ALL')
  const [syncResponse, setSyncResponse] = useState<{ success: boolean; message: string; menpanRefId?: string } | null>(null)

  // Conflict / Linking state for PULL
  const [conflictData, setConflictData] = useState<any | null>(null)
  const [selectedRemoteUuid, setSelectedRemoteUuid] = useState<string>('')

  const isTargetFormEligible = Boolean(
    validation &&
      (targetForm === 'ALL'
        ? validation.isEligible
        : targetForm === 'F01'
        ? validation.f01Complete
        : targetForm === 'F02'
        ? validation.f02Complete
        : validation.f03Complete)
  )

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
    if (!isTargetFormEligible) {
      toast.error('Data evaluasi untuk form yang dipilih belum memenuhi syarat kelengkapan untuk dikirim.')
      return
    }

    setPushing(true)
    setSyncResponse(null)
    try {
      const res = await pushEvaluationSyncAction(evaluationId, targetForm)
      setSyncResponse(res)
      if (res.success) {
        toast.success(res.message)
        await loadData()
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      toast.error(`Gagal mengirim data ke API MenPAN: ${err.message || 'Kesalahan sistem'}`)
    } finally {
      setPushing(false)
    }
  }

  const handlePull = async () => {
    const isBound = Boolean(
      conflictData?.localEval?.menpanEvaluationId ||
        conflictData?.matchedRemote?.uuid ||
        (conflictData?.localEval?.boundForms &&
          conflictData.localEval.boundForms.some((bf: any) => bf.isBound))
    )

    if (!isBound) {
      toast.warning('Tautkan lokus dengan evaluasi MenPAN-RB terlebih dahulu sebelum menarik data jawaban.')
      return
    }

    const confirmPull = window.confirm(
      'Apakah Anda yakin ingin menarik data jawaban dari server MenPAN-RB ke database lokal?\n\n' +
        '• Nilai indikator F-02 (skor evaluator 31 butir) dan isian F-01 lokal akan diperbarui sesuai data server pusat MenPAN-RB.\n' +
        '• Indeks Pelayanan Publik (IPP) lokal akan direkalkulasi secara otomatis.'
    )
    if (!confirmPull) return

    setPulling(true)
    try {
      const res = await pullEvaluationAnswersFromMenpanAction(evaluationId, 'ALL')
      if (res.success) {
        toast.success(res.message)
        await loadData()
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      toast.error(`Gagal menarik data dari MenPAN-RB: ${err.message || 'Kesalahan sistem'}`)
    } finally {
      setPulling(false)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      zIndex="z-[100000]"
      title={`Integrasi MenPAN-RB · ${unitName}`}
      description={`Tinjau status keterhubungan lokus (PULL) dan konfirmasi pengiriman hasil evaluasi (PUSH) untuk Tahun ${year}.`}
      subHeader={
        <div className="px-5 sm:px-6 py-2.5 bg-surface-subtle/50 border-b border-stroke/50">
          <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-stroke/50">
            <button
              type="button"
              onClick={() => setActiveTab('PULL')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PULL'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
              }`}>
              <Download className="w-3.5 h-3.5" />
              <span>1. Tarik &amp; Pemetaan Lokus (PULL)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PUSH')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PUSH'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
              }`}>
              <Send className="w-3.5 h-3.5" />
              <span>2. Konfirmasi &amp; Kirim Jawaban (PUSH)</span>
            </button>
          </div>
        </div>
      }
      footer={
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-stroke/60 text-xs font-semibold text-ink-secondary hover:bg-surface-subtle transition-colors cursor-pointer">
              Tutup
            </button>

            {evaluationId && (
              <Link
                href={unitId ? `/evaluasi/${unitId}/berita-acara?tahun=${year}` : `/evaluasi`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand/30 bg-brand-light/40 hover:bg-brand-light text-brand text-xs font-semibold transition-colors">
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Berita Acara (BAP)</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>
            )}
          </div>

          {activeTab === 'PULL' && (
            <button
              type="button"
              onClick={handlePull}
              disabled={
                pulling ||
                !conflictData?.isConfigured ||
                !(
                  conflictData?.localEval?.menpanEvaluationId ||
                  conflictData?.matchedRemote?.uuid ||
                  (conflictData?.localEval?.boundForms &&
                    conflictData.localEval.boundForms.some((bf: any) => bf.isBound))
                )
              }
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50">
              {pulling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menarik Jawaban...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Tarik Jawaban MenPAN ke Lokal</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'PUSH' && (
            <button
              type="button"
              onClick={handlePush}
              disabled={!isTargetFormEligible || pushing || !conflictData?.isConfigured}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shadow-hz-button cursor-pointer disabled:opacity-50">
              {pushing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirimkan Jawaban...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Kirim {targetForm === 'ALL' ? 'Semua Form' : targetForm} ke MenPAN-RB
                  </span>
                </>
              )}
            </button>
          )}
        </>
      }>
      <div className="space-y-4 text-ink">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            <p className="text-xs text-ink-secondary font-medium">
              Memeriksa data lokal dan mengontak server MenPAN-RB...
            </p>
          </div>
        ) : (
          <>
            {/* ==========================================================
                PENANDA SINKRONISASI & KESEGARAN DATA TERBARU
                ========================================================== */}
            {conflictData?.syncMeta && (
              <div className="p-3.5 rounded-2xl border border-stroke/70 bg-surface shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stroke/50">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-brand" />
                    <span className="font-bold text-xs text-ink">
                      Penanda Sinkronisasi &amp; Kesegaran Data
                    </span>
                  </div>

                  {/* Badge Indikator Status Mana Data Terbaru */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-ink-muted">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        conflictData.syncMeta.freshnessStatus === 'LOCAL_MODIFIED'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                          : conflictData.syncMeta.freshnessStatus === 'PULL_FRESH'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                          : conflictData.syncMeta.freshnessStatus === 'PUSH_FRESH'
                          ? 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700'
                          : 'bg-surface-subtle text-ink-muted border-stroke/60'
                      }`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          conflictData.syncMeta.freshnessStatus === 'LOCAL_MODIFIED'
                            ? 'bg-amber-500 animate-pulse'
                            : conflictData.syncMeta.freshnessStatus === 'PULL_FRESH'
                            ? 'bg-emerald-500'
                            : conflictData.syncMeta.freshnessStatus === 'PUSH_FRESH'
                            ? 'bg-blue-500'
                            : 'bg-ink-muted'
                        }`}
                      />
                      {conflictData.syncMeta.freshnessLabel}
                    </span>
                  </div>
                </div>

                {/* Penjelasan Ringkas Status */}
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  {conflictData.syncMeta.freshnessDescription}
                </p>

                {/* 3 Kartu Komparasi Waktu Sinkronisasi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Terakhir PULL */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <Download className="w-3 h-3 text-emerald-600" />
                        PULL Terakhir
                      </span>
                      <span className="text-[10px] text-ink-muted font-mono">MenPAN → Lokal</span>
                    </div>
                    <div className="text-xs font-bold text-ink truncate">
                      {conflictData.syncMeta.lastPulledAt
                        ? formatDateTime(conflictData.syncMeta.lastPulledAt)
                        : 'Belum pernah'}
                    </div>
                    <div className="text-[10px] text-ink-muted truncate">
                      {conflictData.syncMeta.lastPullSummary
                        ? `${conflictData.syncMeta.lastPullSummary.pulledF02Count || 0} skor F-02 ditarik`
                        : 'Sinkronisasi tarikan'}
                    </div>
                  </div>

                  {/* 2. Terakhir PUSH */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                        <Send className="w-3 h-3 text-blue-600" />
                        PUSH Terakhir
                      </span>
                      <span className="text-[10px] text-ink-muted font-mono">Lokal → MenPAN</span>
                    </div>
                    <div className="text-xs font-bold text-ink truncate">
                      {conflictData.syncMeta.lastPushedAt
                        ? formatDateTime(conflictData.syncMeta.lastPushedAt)
                        : 'Belum pernah'}
                    </div>
                    <div className="text-[10px] text-ink-muted truncate">
                      {conflictData.syncMeta.lastPushSummary?.forms?.length
                        ? `Form: ${conflictData.syncMeta.lastPushSummary.forms.join(', ')}`
                        : 'Sinkronisasi kiriman'}
                    </div>
                  </div>

                  {/* 3. Waktu Modifikasi Data Lokal */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <Clock className="w-3 h-3 text-ink-muted" />
                        Perubahan Lokal
                      </span>
                      <span className="text-[10px] text-ink-muted font-mono">DB Kutai Barat</span>
                    </div>
                    <div className="text-xs font-bold text-ink truncate">
                      {conflictData.syncMeta.localUpdatedAt
                        ? formatDateTime(conflictData.syncMeta.localUpdatedAt)
                        : '-'}
                    </div>
                    <div className="text-[10px] text-ink-muted truncate">
                      {conflictData.localEval?.filledCount || 0}/31 indikator dinilai
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PULL' ? (
              /* ==========================================================
                 TAB PULL: Pemetaan UUID & Resolusi Konflik Berdampingan
                 ========================================================== */
              <div className="space-y-4 text-xs min-w-0">
            {conflictData ? (
              <>
                {/* Banner Peringatan Kredensial API Belum Ditetapkan */}
                {!conflictData.isConfigured && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-xs text-rose-800">
                        Kredensial API MenPAN-RB Belum Ditetapkan
                      </div>
                      <p className="text-[11px] text-rose-900/80 leading-relaxed">
                        Base URL dan Bearer Token belum dikonfigurasi di menu{' '}
                        <a href="/admin/pengaturan-api" className="font-bold underline text-rose-800">
                          Pengaturan API
                        </a>
                        . Harap tetapkan kredensial terlebih dahulu (baik untuk server Sandbox resmi MenPAN-RB maupun Production).
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Tautan UUID */}
                <div className="p-4 rounded-xl border border-stroke/60 bg-surface space-y-3 shadow-2xs min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-brand" />
                      <span className="font-bold text-xs text-ink">Pemetaan Evaluasi MenPAN-RB</span>
                    </div>
                    {conflictData.localEval?.menpanEvaluationId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        Tertaut
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        Belum Ditautkan
                      </span>
                    )}
                  </div>

                  {/* Dropdown Pemilihan Remote UUID */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center min-w-0">
                    <select
                      value={selectedRemoteUuid}
                      onChange={(e) => setSelectedRemoteUuid(e.target.value)}
                      className="flex-1 min-w-0 w-full px-3.5 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium truncate">
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
                      disabled={linking || !selectedRemoteUuid || !conflictData.isConfigured}
                      className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{linking ? 'Menautkan...' : 'Tautkan UUID'}</span>
                    </button>
                  </div>

                  {/* Info Status Pemetaan Pertanyaan MenPAN per Form (F01, F02, F03) */}
                  {conflictData.localEval?.boundForms && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 min-w-0">
                      {conflictData.localEval.boundForms.map((bf: any) => (
                        <div
                          key={bf.formCode}
                          className={`p-2.5 rounded-xl border text-xs min-w-0 space-y-1 ${
                            bf.isBound
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-surface-subtle border-stroke/50 text-ink-muted'
                          }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>Form {bf.formCode}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/30 border border-current/20">
                              {bf.questionsCount} Soal
                            </span>
                          </div>
                          <div className="font-mono text-[10px] truncate text-ink-muted" title={bf.uuid || ''}>
                            {bf.uuid ? `UUID: ${bf.uuid}` : 'Belum terikat'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SIDE-BY-SIDE COMPARISON (Komparasi Berdampingan) */}
                <div className="space-y-2 min-w-0">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                    Komparasi Berdampingan:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    {/* Kolom 1: Data Lokal Kutai Barat */}
                    <div className="p-3.5 rounded-xl bg-surface border border-stroke/60 space-y-2.5 shadow-2xs min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <span className="font-bold text-xs text-ink">Sistem Lokal (Kutai Barat)</span>
                        <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                          Lokal
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-ink-muted text-[11px] shrink-0">Nama Lokus:</span>
                          <span className="font-semibold text-ink text-right truncate">
                            {conflictData.localEval?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-ink-muted text-[11px] shrink-0">Indikator Terisi:</span>
                          <span className="font-semibold text-ink">
                            {conflictData.localEval?.filledCount} / {conflictData.localEval?.totalIndicators}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-ink-muted text-[11px] shrink-0">Skor F02:</span>
                          <span className="font-bold text-ink">
                            {conflictData.localEval?.score > 0 ? conflictData.localEval?.score.toFixed(2) : 'Belum Dinilai'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-ink-muted text-[11px] shrink-0">Persentase F02:</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {conflictData.localEval?.percentage > 0 ? `${conflictData.localEval?.percentage.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kolom 2: Data Server MenPAN-RB */}
                    <div className="p-3.5 rounded-xl bg-surface border border-stroke/60 space-y-2.5 shadow-2xs min-w-0">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <span className="font-bold text-xs text-ink">Server MenPAN-RB</span>
                        <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/40">
                          Remote
                        </span>
                      </div>

                      {conflictData.matchedRemote ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-ink-muted text-[11px] shrink-0">Nama Evaluasi:</span>
                            <span className="font-semibold text-ink text-right truncate" title={conflictData.matchedRemote.name}>
                              {conflictData.matchedRemote.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-ink-muted text-[11px] shrink-0">Status Pengisian:</span>
                            <span className="font-medium text-ink">
                              {conflictData.matchedRemote.status || 'Belum Diisi'}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-ink-muted text-[11px] shrink-0">Jawaban Tersimpan:</span>
                            <span className="font-semibold text-ink">
                              {conflictData.remoteAnswersCount || 0} butir
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-ink-muted text-[11px] shrink-0">Progress Pusat:</span>
                            <span className="font-semibold text-brand">
                              {conflictData.matchedRemote.progress_percentage != null
                                ? `${conflictData.matchedRemote.progress_percentage}%`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-ink-muted text-xs italic">
                          Belum ada data evaluasi MenPAN yang terpilih.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner Deteksi Konflik & Aksi Tarik Jawaban ke Lokal */}
                {(conflictData.hasConflict || (conflictData.remoteAnswersCount || 0) > 0) && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 min-w-0">
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Terdeteksi Data Jawaban yang Sudah Tersimpan di Server MenPAN-RB</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Server pusat sudah memiliki {conflictData.remoteAnswersCount} jawaban yang terisi. Anda dapat menarik jawaban dari server pusat MenPAN-RB ke database lokal (PULL) untuk menyinkronkan skor F-02 dan isian F-01, atau menimpanya dengan data lokal Anda melalui tab PUSH.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePull}
                        disabled={pulling || !conflictData.isConfigured}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50">
                        {pulling ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menarik data jawaban...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Tarik Jawaban MenPAN ke Lokal</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-amber-800/80 italic">
                        *Akan merecalculasi IPP lokal secara otomatis.
                      </span>
                    </div>
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
            <div className="space-y-4 text-xs min-w-0">
              {/* Pilihan Form PEKPPP yang Akan Dikirim */}
              <div className="p-3 rounded-xl border border-stroke/60 bg-surface space-y-2">
                <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Pilih Instrumen Form PEKPPP yang Akan Dikirim:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { code: 'ALL', label: 'Semua (F01–F03)' },
                      { code: 'F01', label: 'Form F01 (90 Soal)' },
                      { code: 'F02', label: 'Form F02 (31 Soal)' },
                      { code: 'F03', label: 'Form F03 (14 Soal)' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setTargetForm(opt.code)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        targetForm === opt.code
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-subtle text-ink-secondary border-stroke/50 hover:text-ink'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Kelayakan */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 min-w-0 ${
                  isTargetFormEligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                {isTargetFormEligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-xs">
                    {isTargetFormEligible
                      ? `Data Form ${targetForm === 'ALL' ? 'F01, F02 & F03' : targetForm} Lengkap - Siap Dikirim ke MenPAN-RB`
                      : `Data Form ${targetForm === 'ALL' ? 'PEKPPP' : targetForm} Belum Memenuhi Syarat Gate MenPAN-RB`}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isTargetFormEligible
                      ? 'Seluruh butir wajib untuk instrumen yang dipilih telah terisi lengkap.'
                      : 'Harap lengkapi pengisian instrumen yang dipilih terlebih dahulu sebelum melakukan pengiriman.'}
                  </p>
                </div>
              </div>

              {/* Checklist Kelengkapan */}
              <div className="rounded-xl border border-stroke/50 bg-surface-subtle/50 p-3.5 space-y-2 min-w-0">
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

                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-stroke/40">
                    <span className="text-ink">Pemetaan ID Soal MenPAN ({conflictData?.localEval?.questionsCount || 31}/31)</span>
                    {conflictData?.localEval?.isQuestionsMapped ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terpetakan
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Fetch saat Kirim
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rincian Kendala jika ada */}
              {validation.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 min-w-0">
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
                  className={`p-3.5 rounded-xl border text-xs space-y-1 min-w-0 ${
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
      </>
    )}
  </div>
    </FormModal>
  )
}
