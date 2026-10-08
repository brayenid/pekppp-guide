// src/app/admin/periode/PeriodeClient.tsx
'use client'

import { useState } from 'react'
import {
  createPeriodAction,
  updatePeriodAction,
  setPeriodStatusAction,
  deletePeriodAction,
  togglePeriodPublishAction
} from '../../../actions/evaluation-actions'
import {
  CalendarDays,
  Plus,
  Pencil,
  Lock,
  Unlock,
  Trash2,
  ArrowRight,
  Building2,
  CheckCircle2,
  Award,
  Search,
  Globe,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { FormModal } from '../../../components/ui/FormModal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'

export interface UnitItem {
  id: string
  name: string
  categoryId?: string | null
  category?: { id: string; name: string } | null
}

export interface PeriodItem {
  id: string
  year: number
  title?: string | null
  targetF03Quota?: number | null
  isOpen: boolean
  isPublished?: boolean
  publishedAt?: Date | string | null
}

export default function PeriodeClient({
  initialPeriods,
  yearStats = {},
  allUnits = []
}: {
  initialPeriods: PeriodItem[]
  yearStats?: Record<
    number,
    { lokusCount: number; finishedCount: number; avgIpp: number }
  >
  allUnits?: UnitItem[]
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [year, setYear] = useState<number | ''>('')
  const [targetQuota, setTargetQuota] = useState<number>(30)
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(
    new Set(allUnits.map((u) => u.id))
  )
  const [loading, setLoading] = useState(false)

  // Unit filter in modal
  const [modalSearch, setModalSearch] = useState('')
  const [modalCategoryFilter, setModalCategoryFilter] = useState('ALL')

  const categories = Array.from(
    new Map(
      allUnits
        .filter((u) => u.category)
        .map((u) => [u.category!.id, { id: u.category!.id, name: u.category!.name }])
    ).values()
  )

  const filteredModalUnits = allUnits.filter((u) => {
    const matchCat =
      modalCategoryFilter === 'ALL' ||
      u.categoryId === modalCategoryFilter ||
      u.category?.id === modalCategoryFilter ||
      u.category?.name === modalCategoryFilter
    const matchSearch = u.name.toLowerCase().includes(modalSearch.toLowerCase())
    return matchCat && matchSearch
  })

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null)
  const [editYear, setEditYear] = useState<number | ''>('')
  const [editTargetQuota, setEditTargetQuota] = useState<number>(30)
  const [editTitle, setEditTitle] = useState<string>('')

  const handleEditClick = (period: PeriodItem) => {
    setEditingPeriod(period)
    setEditYear(period.year)
    setEditTargetQuota(period.targetF03Quota || 30)
    setEditTitle(period.title || `Evaluasi PEKPPP Tahun ${period.year}`)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPeriod) return
    if (!editYear || Number(editYear) < 2020 || Number(editYear) > 2099) {
      toast.error('Harap masukkan 4 digit angka tahun yang valid (contoh: 2027)!')
      return
    }

    setLoading(true)
    try {
      const res = await updatePeriodAction({
        id: editingPeriod.id,
        newYear: Number(editYear),
        targetF03Quota: editTargetQuota,
        title: editTitle
      })

      if (res.success) {
        toast.success(`Tahun Penilaian berhasil diperbarui menjadi ${editYear}!`)
        setIsEditOpen(false)
        setEditingPeriod(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal memperbarui tahun penilaian.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // Confirmation Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'create' | 'toggle' | 'delete' | 'publish'
    targetPeriod?: PeriodItem
    nextState?: boolean
  }>({ isOpen: false, type: 'create' })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!year || Number(year) < 2020 || Number(year) > 2099) {
      toast.error('Harap masukkan 4 digit angka tahun yang valid (contoh: 2027)!')
      return
    }
    setModalState({ isOpen: true, type: 'create' })
  }

  const handleToggleClick = (period: PeriodItem) => {
    setModalState({
      isOpen: true,
      type: 'toggle',
      targetPeriod: period,
      nextState: !period.isOpen
    })
  }

  const handlePublishClick = (period: PeriodItem) => {
    setModalState({
      isOpen: true,
      type: 'publish',
      targetPeriod: period,
      nextState: !period.isPublished
    })
  }

  const handleDeleteClick = (period: PeriodItem) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      targetPeriod: period
    })
  }

  const handleExecuteModalAction = async () => {
    setLoading(true)
    try {
      if (modalState.type === 'create') {
        const res = await createPeriodAction({
          year: Number(year),
          targetF03Quota: targetQuota,
          unitIds: Array.from(selectedUnitIds)
        })
        if (res.success) {
          toast.success(`Evaluasi PEKPPP Tahun ${year} berhasil dibuat dengan ${selectedUnitIds.size} lokus!`)
          setYear('')
          setIsFormOpen(false)
          window.location.reload()
        } else {
          toast.error(res.error || 'Gagal membuat tahun penilaian.')
        }
      } else if (modalState.type === 'toggle' && modalState.targetPeriod) {
        const target = modalState.targetPeriod
        const nextState = modalState.nextState ?? false
        const res = await setPeriodStatusAction(target.id, nextState)
        if (res.success) {
          toast.success(
            nextState
              ? `Tahun Penilaian ${target.year} dibuka & diaktifkan!`
              : `Tahun Penilaian ${target.year} ditutup.`
          )
          window.location.reload()
        } else {
          toast.error('Gagal mengubah status periode.')
        }
      } else if (modalState.type === 'publish' && modalState.targetPeriod) {
        const target = modalState.targetPeriod
        const nextState = modalState.nextState ?? false
        const res = await togglePeriodPublishAction(target.id, nextState)
        if (res.success) {
          toast.success(
            nextState
              ? `Hasil Evaluasi Tahun ${target.year} berhasil dipublikasikan ke publik!`
              : `Hasil Evaluasi Tahun ${target.year} ditarik dari publik.`
          )
          window.location.reload()
        } else {
          toast.error(res.error || 'Gagal mengubah status publikasi.')
        }
      } else if (modalState.type === 'delete' && modalState.targetPeriod) {
        const target = modalState.targetPeriod
        const res = await deletePeriodAction(target.id)
        if (res.success) {
          toast.success(`Tahun Penilaian ${target.year} berhasil dihapus!`)
          window.location.reload()
        } else {
          toast.error('Gagal menghapus tahun penilaian.')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
      setModalState({ isOpen: false, type: 'create' })
    }
  }

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Header */}
      <PageHeader
        icon={<CalendarDays className="w-5 h-5 text-brand" />}
        title="Tahun Penilaian PEKPPP"
        description="Kelola tahun penilaian evaluasi kinerja pelayanan publik. Setiap tahun merupakan agenda PEKPPP terpadu yang memuat seluruh lokus peserta."
        actions={
          <Button
            variant="brand"
            onClick={() => {
              setSelectedUnitIds(new Set(allUnits.map((u) => u.id)))
              setIsFormOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}>
            Tambah Tahun Penilaian
          </Button>
        }
      />

      {/* Grid of Year Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialPeriods.map((period) => {
          const stats = yearStats[period.year] || {
            lokusCount: 0,
            finishedCount: 0,
            avgIpp: 0
          }

          const completionPercent =
            stats.lokusCount > 0
              ? Math.round((stats.finishedCount / stats.lokusCount) * 100)
              : 0

          return (
            <div
              key={period.id}
              className={`rounded-bento p-5 sm:p-7 border bg-surface transition-all duration-200 flex flex-col justify-between hover:shadow-soft-float ${
                period.isOpen
                  ? 'border-brand/40 shadow-soft-card ring-1 ring-brand/20'
                  : 'border-stroke/50 shadow-soft-card opacity-95'
              }`}>
              {/* Card Header & Content */}
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-4xl font-normal tracking-tight text-ink">
                      {period.year}
                    </span>
                    <p className="text-xs text-ink-muted">
                      Evaluasi Terpadu Tahun {period.year}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <Badge
                      variant={period.isOpen ? 'success' : 'neutral'}
                      dot
                      pulseDot={period.isOpen}
                      size="sm">
                      {period.isOpen ? 'Tahun Aktif' : 'Ditutup'}
                    </Badge>
                    <Badge
                      variant={period.isPublished ? 'info' : 'neutral'}
                      size="sm">
                      {period.isPublished ? 'Publik' : 'Internal'}
                    </Badge>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-surface-subtle/50 p-3 rounded-2xl border border-stroke/40">
                    <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span>Lokus</span>
                    </div>
                    <div className="text-xl font-normal text-ink mt-1.5">
                      {stats.lokusCount}
                    </div>
                  </div>

                  <div className="bg-surface-subtle/50 p-3 rounded-2xl border border-stroke/40">
                    <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pastel-green-text shrink-0" />
                      <span>Selesai</span>
                    </div>
                    <div className="text-xl font-normal text-ink mt-1.5">
                      {stats.finishedCount}
                    </div>
                  </div>

                  <div className="bg-surface-subtle/50 p-3 rounded-2xl border border-stroke/40">
                    <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span>Rata IPP</span>
                    </div>
                    <div className="text-xl font-normal text-ink mt-1.5">
                      {stats.avgIpp > 0 ? stats.avgIpp.toFixed(2) : '-'}
                    </div>
                  </div>
                </div>

                {/* Progress bar info */}
                {stats.lokusCount > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Progres Evaluasi</span>
                      <span className="font-medium text-ink">{completionPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-stroke/30">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-stroke/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Status Toggle (Buka / Tutup Pengisian) */}
                  <button
                    type="button"
                    onClick={() => handleToggleClick(period)}
                    title={period.isOpen ? 'Tutup Pengisian Tahun Ini' : 'Buka & Aktifkan Tahun Ini'}
                    className="w-8.5 h-8.5 rounded-full border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer">
                    {period.isOpen ? (
                      <Unlock className="w-3.5 h-3.5 text-brand" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-ink-muted" />
                    )}
                  </button>

                  {/* Publish Toggle (Publikasikan / Tarik Publikasi) */}
                  <button
                    type="button"
                    onClick={() => handlePublishClick(period)}
                    title={period.isPublished ? 'Tarik Publikasi (Sembunyikan dari Publik)' : 'Publikasikan Hasil Penilaian ke Publik'}
                    className={`w-8.5 h-8.5 rounded-full border border-stroke/60 bg-surface flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                      period.isPublished
                        ? 'text-brand hover:text-brand-hover hover:bg-brand-light'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
                    }`}>
                    {period.isPublished ? (
                      <Globe className="w-3.5 h-3.5 text-brand" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-ink-muted" />
                    )}
                  </button>

                  {/* Edit Tahun */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(period)}
                    title="Edit Tahun Penilaian"
                    className="w-8.5 h-8.5 rounded-full border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-brand hover:bg-brand-light transition-colors shadow-2xs cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(period)}
                    title="Hapus Tahun Penilaian"
                    className="w-8.5 h-8.5 rounded-full border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-pastel-rose-text hover:bg-pastel-rose/30 transition-colors shadow-2xs cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Open Year Dashboard Link */}
                <Link
                  href={`/admin/periode/${period.year}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-hz-button cursor-pointer w-full sm:w-auto min-h-[38px]">
                  <span>Buka Evaluasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Tambah Tahun Penilaian Baru */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Tambah Tahun Penilaian PEKPPP Baru"
        description="Buat tahun evaluasi baru dan tentukan unit kerja lokus yang diikutsertakan.">
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Tahun Penilaian <span className="text-pastel-rose-text">*</span>
              </label>
              <input
                type="number"
                min="2020"
                max="2099"
                value={year}
                onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 2027"
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-mono font-bold focus:outline-none focus:border-ink shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Target Kuota F-03 (Survei)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={targetQuota}
                onChange={(e) => setTargetQuota(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-mono font-bold focus:outline-none focus:border-ink shadow-2xs"
              />
            </div>
          </div>

          {/* Lokus Selection */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink">
                Pilih Lokus Peserta Awal ({selectedUnitIds.size} Unit Dipilih)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedUnitIds.size === allUnits.length) {
                    setSelectedUnitIds(new Set())
                  } else {
                    setSelectedUnitIds(new Set(allUnits.map((u) => u.id)))
                  }
                }}
                className="text-xs font-semibold text-ink hover:underline cursor-pointer">
                {selectedUnitIds.size === allUnits.length
                  ? 'Kosongkan Semua'
                  : 'Pilih Semua Unit'}
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Cari unit..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-ink shadow-2xs"
                />
              </div>

              <select
                value={modalCategoryFilter}
                onChange={(e) => setModalCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-line bg-card text-ink font-medium cursor-pointer">
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Checklist Box */}
            <div className="max-h-48 overflow-y-auto border border-line rounded-xl p-1.5 divide-y divide-line bg-surface-subtle">
              {filteredModalUnits.map((unit) => {
                const isChecked = selectedUnitIds.has(unit.id)

                return (
                  <label
                    key={unit.id}
                    className="flex items-center justify-between p-2 hover:bg-card rounded-lg cursor-pointer transition-colors text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedUnitIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(unit.id)) next.delete(unit.id)
                            else next.add(unit.id)
                            return next
                          })
                        }}
                        className="rounded accent-ink shrink-0"
                      />
                      <span className="font-semibold text-ink truncate text-[11px]">
                        {unit.name}
                      </span>
                    </div>

                    <Badge variant="neutral" size="sm" className="shrink-0 text-[10px]">
                      {unit.category?.name || 'OPD'}
                    </Badge>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm">
              Buat &amp; Aktifkan Tahun Penilaian
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Modal Edit Tahun Penilaian */}
      <FormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Evaluasi Tahun ${editingPeriod?.year}`}
        description="Perbarui angka tahun penilaian, judul agenda, atau target kuota responden survei F-03.">
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Tahun Penilaian <span className="text-pastel-rose-text">*</span>
              </label>
              <input
                type="number"
                min="2020"
                max="2099"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 2027"
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-mono font-bold focus:outline-none focus:border-ink shadow-2xs"
                required
              />
              <p className="text-[10px] text-ink-muted mt-1">
                Mengubah tahun akan memperbarui relasi seluruh lokus terdaftar secara otomatis.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Target Kuota F-03 (Survei)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={editTargetQuota}
                onChange={(e) => setEditTargetQuota(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-mono font-bold focus:outline-none focus:border-ink shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Judul / Keterangan Evaluasi
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Contoh: Evaluasi Terpadu Tahun 2027"
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-xs focus:outline-none focus:border-ink shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onCancel={() => setModalState({ isOpen: false, type: 'create' })}
        onConfirm={handleExecuteModalAction}
        loading={loading}
        variant={modalState.type === 'delete' ? 'danger' : 'primary'}
        title={
          modalState.type === 'create'
            ? `Konfirmasi Tambah Tahun ${year}`
            : modalState.type === 'toggle'
            ? `Ubah Status Tahun ${modalState.targetPeriod?.year}`
            : modalState.type === 'publish'
            ? modalState.nextState
              ? `Publikasikan Hasil Evaluasi Tahun ${modalState.targetPeriod?.year}?`
              : `Tarik Publikasi Hasil Evaluasi Tahun ${modalState.targetPeriod?.year}?`
            : `Hapus Tahun ${modalState.targetPeriod?.year}`
        }
        description={
          modalState.type === 'create'
            ? `Evaluasi PEKPPP Tahun ${year} akan dibuat dan langsung diaktifkan dengan ${selectedUnitIds.size} lokus peserta.`
            : modalState.type === 'toggle'
            ? modalState.nextState
              ? `Tahun ${modalState.targetPeriod?.year} akan diaktifkan kembali.`
              : `Menutup Tahun ${modalState.targetPeriod?.year} akan mengunci pengisian evaluasi.`
            : modalState.type === 'publish'
            ? modalState.nextState
              ? `Hasil akhir penilaian dan peringkat lokus Tahun ${modalState.targetPeriod?.year} akan dapat dilihat oleh seluruh publik di portal PEKPPP.`
              : `Hasil penilaian Tahun ${modalState.targetPeriod?.year} akan disembunyikan dari publik dan hanya dapat dilihat oleh Tim Evaluator / Admin.`
            : `Tindakan ini permanen. Semua data evaluasi dan berkas pada Tahun ${modalState.targetPeriod?.year} akan ikut terhapus.`
        }
        confirmText={
          modalState.type === 'create'
            ? 'Buat & Aktifkan'
            : modalState.type === 'toggle'
            ? modalState.nextState
              ? 'Buka Periode'
              : 'Tutup Periode'
            : modalState.type === 'publish'
            ? modalState.nextState
              ? 'Publikasikan Sekarang'
              : 'Tarik dari Publik'
            : 'Hapus Permanen'
        }
      />
    </div>
  )
}
