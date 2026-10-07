// src/components/features/PeriodTimelineManager.tsx
'use client'

import React, { useState, useMemo } from 'react'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  SlidersHorizontal,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { VisualDateRangePicker } from '../ui/VisualDateRangePicker'
import { FormModal } from '../ui/FormModal'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import {
  upsertPeriodWindowAction,
  toggleWindowOverrideAction,
  resetPeriodWindowsToDefaultAction
} from '../../actions/period-window-actions'
import { EvaluatedWindowItem } from '../../services/period-window-service'

interface PeriodTimelineManagerProps {
  year: number
  periodId: string
  windows: EvaluatedWindowItem[]
  activeWindow: EvaluatedWindowItem | null
  isPeriodOpen: boolean
}

export function PeriodTimelineManager({
  year,
  periodId,
  windows,
  activeWindow,
  isPeriodOpen
}: PeriodTimelineManagerProps) {
  const [editingWindow, setEditingWindow] = useState<EvaluatedWindowItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [deletingWindow, setDeletingWindow] = useState<EvaluatedWindowItem | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [canFillF01, setCanFillF01] = useState(false)
  const [canUploadEvidence, setCanUploadEvidence] = useState(false)
  const [canFillF03, setCanFillF03] = useState(false)
  const [canEvaluateF02, setCanEvaluateF02] = useState(false)

  const handleOpenCreate = () => {
    setEditingWindow(null)
    setTitle('')
    setDescription('')
    setStartDate(null)
    setEndDate(null)
    setCanFillF01(false)
    setCanUploadEvidence(false)
    setCanFillF03(false)
    setCanEvaluateF02(false)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (w: EvaluatedWindowItem) => {
    setEditingWindow(w)
    setTitle(w.title)
    setDescription(w.description || '')
    setStartDate(w.startDate ? new Date(w.startDate).toISOString() : null)
    setEndDate(w.endDate ? new Date(w.endDate).toISOString() : null)
    setCanFillF01(w.canFillF01)
    setCanUploadEvidence(w.canUploadEvidence)
    setCanFillF03(w.canFillF03)
    setCanEvaluateF02(w.canEvaluateF02)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Judul tahapan wajib diisi!')
      return
    }

    setLoading(true)
    try {
      const generatedPhaseKey = editingWindow
        ? editingWindow.phaseKey
        : `PHASE_${Date.now()}_${title.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20)}`

      const res = await upsertPeriodWindowAction({
        id: editingWindow?.id,
        periodId,
        year,
        phaseKey: generatedPhaseKey,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        canFillF01,
        canUploadEvidence,
        canFillF03,
        canEvaluateF02
      })

      if (res.success) {
        toast.success(editingWindow ? `Jadwal tahapan "${title}" berhasil diperbarui!` : `Tahapan baru "${title}" berhasil ditambahkan!`)
        setIsModalOpen(false)
        setEditingWindow(null)
      } else {
        toast.error(res.error || 'Gagal menyimpan tahapan.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWindow = async () => {
    if (!deletingWindow) return
    setLoading(true)
    try {
      const { deletePeriodWindowAction } = await import('../../actions/period-window-actions')
      const res = await deletePeriodWindowAction(deletingWindow.id, year)
      if (res.success) {
        toast.success(`Tahapan "${deletingWindow.title}" berhasil dihapus.`)
        setIsDeleteConfirmOpen(false)
        setDeletingWindow(null)
      } else {
        toast.error(res.error || 'Gagal menghapus tahapan.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOverride = async (w: EvaluatedWindowItem) => {
    // Siklus override: null -> true -> false -> null
    let nextOverride: boolean | null = null
    if (w.isActiveOverride === null) nextOverride = true
    else if (w.isActiveOverride === true) nextOverride = false
    else nextOverride = null

    try {
      const res = await toggleWindowOverrideAction({
        windowId: w.id,
        year,
        override: nextOverride
      })

      if (res.success) {
        if (nextOverride === true) {
          toast.success(`Tahapan "${w.title}" dipaksa AKTIF (Override Super Admin).`)
        } else if (nextOverride === false) {
          toast.info(`Tahapan "${w.title}" dipaksa TUTUP.`)
        } else {
          toast.info(`Override dilepas: status tahapan "${w.title}" kembali otomatis mengikuti tanggal.`)
        }
      } else {
        toast.error(res.error || 'Gagal mengubah status override.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    }
  }

  const handleResetToDefault = async () => {
    setLoading(true)
    try {
      const res = await resetPeriodWindowsToDefaultAction(year)
      if (res.success) {
        toast.success('Jadwal tahapan berhasil direset ke standar 6 tahapan PEKPPP!')
        setIsResetConfirmOpen(false)
      } else {
        toast.error(res.error || 'Gagal mereset jadwal.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  // Kalkulasi rentang tanggal keseluruhan (keseluruhan tahapan tahun ini)
  const overallTimelineSummary = useMemo(() => {
    if (!windows || windows.length === 0) return null
    const validWindows = windows.filter((w) => w.startDate && w.endDate)
    if (validWindows.length === 0) return null

    let minTime = Infinity
    let maxTime = -Infinity

    validWindows.forEach((w) => {
      const s = new Date(w.startDate!).getTime()
      const e = new Date(w.endDate!).getTime()
      if (s < minTime) minTime = s
      if (e > maxTime) maxTime = e
    })

    if (minTime === Infinity || maxTime === -Infinity || minTime >= maxTime) return null

    const totalDuration = maxTime - minTime
    const now = Date.now()
    const overallProgressPercent = Math.min(
      100,
      Math.max(0, Math.round(((now - minTime) / totalDuration) * 100))
    )

    const formatDateSimple = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    }

    return {
      minDate: new Date(minTime),
      maxDate: new Date(maxTime),
      formattedOverall: `${formatDateSimple(new Date(minTime))} – ${formatDateSimple(new Date(maxTime))}`,
      totalDays: Math.max(1, Math.round(totalDuration / (1000 * 60 * 60 * 24))),
      progressPercent: overallProgressPercent,
      isStarted: now >= minTime,
      isCompleted: now > maxTime,
      items: validWindows.map((w, idx) => {
        const s = new Date(w.startDate!).getTime()
        const e = new Date(w.endDate!).getTime()
        const leftPercent = ((s - minTime) / totalDuration) * 100
        const widthPercent = Math.max(3, ((e - s) / totalDuration) * 100)
        return {
          id: w.id,
          title: w.title,
          status: w.status,
          isCurrentlyActive: w.isCurrentlyActive,
          leftPercent,
          widthPercent,
          formattedRange: w.formattedRange,
          stepNumber: idx + 1
        }
      })
    }
  }, [windows])

  return (
    <div className="space-y-6">
      {/* Visual Rentang Tanggal Lengkap (Simple & Read Only) */}
      {overallTimelineSummary && (
        <div className="rounded-2xl border border-stroke/70 bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Jadwal Keseluruhan Penilaian {year}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-surface-subtle text-ink-secondary text-[11px] font-semibold border border-stroke/50">
                    {overallTimelineSummary.totalDays} Hari Pelaksanaan
                  </span>
                </div>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Rentang Waktu: <span className="font-semibold text-ink">{overallTimelineSummary.formattedOverall}</span>
                </p>
              </div>
            </div>

            {/* Status Pelaksanaan Keseluruhan */}
            <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
              <span className="text-ink-muted text-[11px]">Progres Waktu:</span>
              <span className="font-bold text-ink">{overallTimelineSummary.progressPercent}%</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                overallTimelineSummary.isCompleted
                  ? 'bg-slate-100 text-slate-600'
                  : overallTimelineSummary.isStarted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {overallTimelineSummary.isCompleted
                  ? 'Selesai'
                  : overallTimelineSummary.isStarted
                    ? 'Sedang Berjalan'
                    : 'Belum Dimulai'}
              </span>
            </div>
          </div>

          {/* Progress / Timeline Bar Segments */}
          <div className="space-y-1.5 pt-1">
            {/* Visual Segments Bar */}
            <div className="relative h-3 w-full rounded-full bg-surface-subtle overflow-hidden border border-stroke/60 flex">
              {overallTimelineSummary.items.map((seg) => (
                <div
                  key={seg.id}
                  title={`${seg.stepNumber}. ${seg.title} (${seg.formattedRange})`}
                  style={{
                    width: `${seg.widthPercent}%`
                  }}
                  className={`h-full transition-all border-r last:border-r-0 border-surface/40 ${
                    seg.isCurrentlyActive
                      ? 'bg-brand animate-pulse'
                      : seg.status === 'PASSED'
                        ? 'bg-emerald-400/80'
                        : 'bg-slate-200/90'
                  }`}
                />
              ))}
            </div>

            {/* Quick Chips of Stages (Simple Read-Only Legend) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {overallTimelineSummary.items.map((seg) => (
                <div
                  key={seg.id}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] transition-all ${
                    seg.isCurrentlyActive
                      ? 'border-brand bg-brand-light/40 text-brand font-semibold shadow-2xs'
                      : seg.status === 'PASSED'
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                        : 'border-stroke/50 bg-surface-subtle/30 text-ink-muted'
                  }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      seg.isCurrentlyActive
                        ? 'bg-brand'
                        : seg.status === 'PASSED'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                    }`} />
                    <span className="truncate">{seg.title}</span>
                  </div>
                  <div className="text-[10px] text-ink-faint truncate mt-0.5 font-normal">
                    {seg.formattedRange}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Banner: Tahapan Aktif Saat Ini */}
      <div className="rounded-2xl border border-stroke/70 bg-surface p-5 shadow-soft-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeWindow
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-surface-subtle text-ink-muted border-stroke/60'
            }`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Tahapan Berjalan Saat Ini
                </span>
                {activeWindow?.isActiveOverride === true && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                    Super Admin Override
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-ink mt-0.5">
                {activeWindow ? activeWindow.title : 'Tidak Ada Tahapan Berjalan'}
              </h3>
              <p className="text-xs text-ink-secondary mt-1">
                {activeWindow
                  ? activeWindow.description || 'Tahapan evaluasi sedang aktif untuk seluruh lokus pelayanan.'
                  : `Tahun ${year} saat ini tidak memiliki tahapan jadwal yang terbuka.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-hz-button cursor-pointer">
              <span className="text-base leading-none font-bold">+</span>
              <span>Tambah Tahapan Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke/70 bg-surface-subtle hover:bg-surface text-ink-secondary text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="Isi dengan 6 template tahapan resmi jika diinginkan">
              <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
              <span>Gunakan Template Standar</span>
            </button>
          </div>
        </div>

        {/* Permissions Active Summary */}
        {activeWindow && (
          <div className="mt-4 pt-4 border-t border-stroke/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-stroke/40 space-y-1">
              <span className="text-[11px] text-ink-muted block">Pengisian F-01 Lokus</span>
              <span className={`inline-flex items-center gap-1 font-bold ${
                activeWindow.canFillF01 ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeWindow.canFillF01 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {activeWindow.canFillF01 ? 'Diizinkan (Buka)' : 'Terkunci'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-stroke/40 space-y-1">
              <span className="text-[11px] text-ink-muted block">Unggah Bukti Dukung</span>
              <span className={`inline-flex items-center gap-1 font-bold ${
                activeWindow.canUploadEvidence ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeWindow.canUploadEvidence ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {activeWindow.canUploadEvidence ? 'Diizinkan (Buka)' : 'Terkunci'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-stroke/40 space-y-1">
              <span className="text-[11px] text-ink-muted block">Survei F-03 Publik/Lokus</span>
              <span className={`inline-flex items-center gap-1 font-bold ${
                activeWindow.canFillF03 ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeWindow.canFillF03 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {activeWindow.canFillF03 ? 'Diizinkan (Buka)' : 'Terkunci'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-stroke/40 space-y-1">
              <span className="text-[11px] text-ink-muted block">Penilaian F-02 Evaluator</span>
              <span className={`inline-flex items-center gap-1 font-bold ${
                activeWindow.canEvaluateF02 ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${activeWindow.canEvaluateF02 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {activeWindow.canEvaluateF02 ? 'Diizinkan (Buka)' : 'Terkunci'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* List / Roadmap Tahapan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Rangkaian Tahapan Penilaian Tahun {year}
          </h4>
          <span className="text-xs text-ink-muted">{windows.length} tahapan terdaftar</span>
        </div>

        {windows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stroke/80 bg-surface p-8 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-ink">Belum Ada Tahapan Jadwal Dibuat</h5>
              <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto leading-relaxed">
                Tahun ini belum memiliki rangkaian tahapan jendela waktu. Anda dapat membuat tahapan satu per satu sesuai kebutuhan evaluasi atau memuat template standar.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-hz-button cursor-pointer">
                <span>+ Buat Tahapan Pertama</span>
              </button>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stroke/70 bg-surface-subtle hover:bg-surface text-ink-secondary text-xs font-medium transition-colors cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
                <span>Gunakan Template Standar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {windows.map((w, idx) => {
              const isWindowActive = w.id === activeWindow?.id

              return (
                <div
                  key={w.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                    isWindowActive
                      ? 'border-brand ring-1 ring-brand/20 shadow-soft-card'
                      : 'border-stroke/60 hover:border-stroke hover:shadow-soft-card'
                  }`}>
                  {/* Left info */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-surface-subtle text-ink-secondary text-[11px] font-bold flex items-center justify-center border border-stroke/50">
                        {idx + 1}
                      </span>

                      {/* Status Badge */}
                      {w.isActiveOverride === true ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                          Override Aktif
                        </span>
                      ) : w.isActiveOverride === false ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                          Dipaksa Tutup
                        </span>
                      ) : w.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Sedang Berlangsung
                        </span>
                      ) : w.status === 'UPCOMING' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-stroke/60 text-[11px] font-medium">
                          Akan Datang
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium">
                          Selesai
                        </span>
                      )}

                      {/* Permissions tags */}
                      <div className="flex items-center gap-1.5">
                        {w.canFillF01 && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                            F01 Lokus
                          </span>
                        )}
                        {w.canUploadEvidence && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-[10px] font-medium border border-cyan-100">
                            Bukti Dukung
                          </span>
                        )}
                        {w.canFillF03 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100">
                            Survei F03
                          </span>
                        )}
                        {w.canEvaluateF02 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100">
                            Nilai F02
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-ink">{w.title}</h5>
                      <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">
                        {w.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>

                    {/* Dates range */}
                    <div className="flex items-center gap-3 text-xs text-ink-secondary pt-0.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-ink-muted" />
                        <span>{w.formattedRange}</span>
                      </span>
                      {w.status === 'ACTIVE' && w.daysRemaining !== null && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          Tersisa {w.daysRemaining} hari lagi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleOverride(w)}
                      title="Klik untuk mengubah override manual (Paksa Buka / Paksa Tutup / Otomatis)"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        w.isActiveOverride === true
                          ? 'bg-purple-100/70 border-purple-300 text-purple-800'
                          : w.isActiveOverride === false
                            ? 'bg-rose-100/70 border-rose-300 text-rose-800'
                            : 'bg-surface-subtle border-stroke/60 text-ink-muted hover:text-ink'
                      }`}>
                      {w.isActiveOverride === true
                        ? 'Override: BUKA'
                        : w.isActiveOverride === false
                          ? 'Override: TUTUP'
                          : 'Mode: OTOMATIS'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(w)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletingWindow(w)
                        setIsDeleteConfirmOpen(true)
                      }}
                      title="Hapus tahapan ini"
                      className="p-2 rounded-xl border border-stroke/60 hover:border-rose-300 hover:bg-rose-50 text-ink-muted hover:text-rose-600 transition-colors cursor-pointer">
                      <span className="text-xs font-bold leading-none">✕</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Tahapan & Interactive Date Range Picker */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWindow ? `Konfigurasi Tahapan: ${editingWindow.title}` : 'Tambah Tahapan Baru'}
        maxWidth="5xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* 3-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Kolom 1: Informasi Tahapan */}
            <div className="space-y-3.5">
              <div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Informasi Tahapan
                </span>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  Nama tahapan dan panduan untuk lokus:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Nama / Judul Tahapan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pengisian F-01 & Unggah Bukti"
                  className="w-full px-3 py-2 rounded-xl border border-stroke/70 bg-surface-subtle/50 focus:outline-none focus:border-brand text-ink text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Petunjuk / Keterangan bagi Lokus
                </label>
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruksi kegiatan apa saja yang perlu dilakukan oleh lokus pada tahapan ini..."
                  className="w-full px-3 py-2 rounded-xl border border-stroke/70 bg-surface-subtle/50 focus:outline-none focus:border-brand text-ink text-xs font-normal resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Kolom 2: Kalender Visual (Rentang Tanggal Langsung Tampil / Inline) */}
            <div className="space-y-3.5 lg:border-l lg:border-stroke/50 lg:pl-6">
              <div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Jadwal Pelaksanaan
                </span>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  Tentukan tanggal dan batas jam aktif:
                </p>
              </div>

              <VisualDateRangePicker
                inline={true}
                startDate={startDate}
                endDate={endDate}
                onChange={({ startDate: s, endDate: e }) => {
                  setStartDate(s)
                  setEndDate(e)
                }}
              />
            </div>

            {/* Kolom 3: Hak Akses & Checklist Tindakan */}
            <div className="space-y-3.5 lg:border-l lg:border-stroke/50 lg:pl-6">
              <div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Hak Akses &amp; Aksi
                </span>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  Tindakan yang diizinkan untuk Lokus &amp; Evaluator:
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 cursor-pointer hover:bg-surface-subtle/70 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink">Buka Pengisian F-01 Lokus</div>
                    <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
                      Lokus dapat mencentang jawaban dan menyimpan kuesioner evaluasi mandiri F01.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canFillF01}
                    onChange={(e) => setCanFillF01(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand focus:ring-brand accent-brand shrink-0"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 cursor-pointer hover:bg-surface-subtle/70 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink">Buka Unggah Bukti Dukung (6 Aspek)</div>
                    <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
                      Lokus dapat mengunggah berkas PDF/Foto atau memperbarui tautan Google Drive dokumen.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canUploadEvidence}
                    onChange={(e) => setCanUploadEvidence(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand focus:ring-brand accent-brand shrink-0"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 cursor-pointer hover:bg-surface-subtle/70 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink">Buka Survei Kepuasan (F-03)</div>
                    <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
                      Masyarakat dan Lokus dapat mengisi instrumen kuesioner F03 (link publik &amp; QR aktif).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canFillF03}
                    onChange={(e) => setCanFillF03(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand focus:ring-brand accent-brand shrink-0"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 cursor-pointer hover:bg-surface-subtle/70 transition-colors">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink">Buka Penilaian F-02 oleh Evaluator</div>
                    <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
                      Tim Evaluator Bagian Organisasi dapat menginput skor F02 dan catatan rekomendasi.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canEvaluateF02}
                    onChange={(e) => setCanEvaluateF02(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand focus:ring-brand accent-brand shrink-0"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stroke/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stroke/60 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-hz-button disabled:opacity-50 cursor-pointer">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal Reset Template */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetToDefault}
        title="Gunakan Template Tahapan Standar?"
        description={`Tindakan ini akan mengonfigurasi 6 tahapan resmi PEKPPP (Sosialisasi, Pengisian F01, Survei F03, Penilaian F02, Sanggah, dan Penetapan). Jadwal lama akan ditimpa.`}
        confirmText="Terapkan Template"
        variant="warning"
        loading={loading}
      />

      {/* Confirmation Modal Delete Window */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onCancel={() => {
          setIsDeleteConfirmOpen(false)
          setDeletingWindow(null)
        }}
        onConfirm={handleDeleteWindow}
        title="Hapus Tahapan Jadwal?"
        description={`Apakah Anda yakin ingin menghapus tahapan "${deletingWindow?.title || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Tahapan"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}
