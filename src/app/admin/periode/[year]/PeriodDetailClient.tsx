'use client'

import { useState, useRef, useEffect } from 'react'
import {
  CalendarDays,
  Building2,
  Plus,
  ArrowLeft,
  Search,
  CheckCircle2,
  Send,
  Trash2,
  FolderOpen,
  Users,
  Award,
  ArrowUpRight,
  Globe,
  EyeOff,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Star,
  Pencil,
  MoreVertical
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { FormModal } from '../../../../components/ui/FormModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { Button } from '../../../../components/ui/Button'
import { Badge } from '../../../../components/ui/Badge'
import { Card } from '../../../../components/ui/Card'
import { StatCard } from '../../../../components/ui/StatCard'
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/Tabs'
import { MenpanSyncModal } from '../../../../components/features/MenpanSyncModal'
import { ComprehensiveReportModal } from '../../../../components/features/ComprehensiveReportModal'
import {
  getComprehensiveAnnualReportAction,
  ComprehensiveAnnualReport
} from '../../../../actions/report-actions'
import {
  enrollUnitsBulkAction,
  deleteEvaluationAction,
  toggleEvaluationFinishedAction,
  toggleEvaluationPriorityAction,
  togglePeriodPublishAction,
  updatePeriodAction
} from '../../../../actions/evaluation-actions'

export interface UnitItem {
  id: string
  name: string
  categoryId?: string | null
  category?: { id: string; name: string } | null
}

export interface EvaluationRow {
  id: string
  year: number
  unitId: string
  unit: UnitItem
  totalScore: number
  percentage: number
  scale5: number
  finalIppScore: number
  isFinished: boolean
  isPriority?: boolean
  syncStatus?: string | null
  menpanEvaluationId?: string | null
  scores: Array<{
    id: string
    score: number | null
    f01Submitted: boolean
    proofUrl?: string | null
  }>
  _count: {
    f03Respondents: number
    evidenceSubmissions: number
  }
  recentUpdate?: {
    type: string
    isRead: boolean
    createdAt: Date
  } | null
}

import { PeriodTimelineManager } from '../../../../components/features/PeriodTimelineManager'
import { PeriodTimelineResult } from '../../../../services/period-window-service'

export default function PeriodDetailClient({
  period,
  evaluations: initialEvaluations = [],
  allUnits = [],
  timelineResult
}: {
  period: { id: string; year: number; isOpen: boolean; isPublished?: boolean; targetF03Quota?: number | null; title?: string | null }
  evaluations: EvaluationRow[]
  allUnits: UnitItem[]
  timelineResult?: PeriodTimelineResult
}) {
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>(initialEvaluations)
  const [activeTab, setActiveTab] = useState<'lokus' | 'jadwal'>('lokus')

  useEffect(() => {
    setEvaluations(initialEvaluations)
  }, [initialEvaluations])

  const [loading, setLoading] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // Edit Period Modal State
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false)
  const [editYear, setEditYear] = useState<number | ''>(period.year)
  const [editTargetQuota, setEditTargetQuota] = useState<number>(period.targetF03Quota || 30)
  const [editTitle, setEditTitle] = useState<string>(period.title || `Evaluasi PEKPPP Tahun ${period.year}`)

  // Target F-03 Quota
  const targetQuota = period.targetF03Quota || 30

  // Delete Evaluation Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<EvaluationRow | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // MenPAN Sync Modal
  const [syncModalState, setSyncModalState] = useState<{
    isOpen: boolean
    evaluationId: string
    unitName: string
  }>({
    isOpen: false,
    evaluationId: '',
    unitName: ''
  })

  // Comprehensive Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState<ComprehensiveAnnualReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  // Dropdown Menu Aksi
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false)
  const actionDropdownRef = useRef<HTMLDivElement>(null)

  // Row Action Menu (Drawer/Dropdown Menu per baris)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        setIsActionDropdownOpen(false)
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenReport = async () => {
    setIsReportModalOpen(true)
    if (!reportData) {
      setReportLoading(true)
      try {
        const data = await getComprehensiveAnnualReportAction(period.year)
        setReportData(data)
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat data laporan komprehensif.')
      } finally {
        setReportLoading(false)
      }
    }
  }

  // Enrolled unit IDs set for Modal
  const initialEnrolled = new Set(evaluations.map((e) => e.unitId))
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(initialEnrolled)

  // Table filter & search
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'PRIORITY' | 'REGULAR'>('ALL')
  const [updateFilter, setUpdateFilter] = useState<'ALL' | 'UPDATED' | 'REVISION'>('ALL')

  // Categories list
  const categories = Array.from(
    new Map(
      allUnits
        .filter((u) => u.category)
        .map((u) => [u.category!.id, { id: u.category!.id, name: u.category!.name }])
    ).values()
  )

  // Filtered Evaluations for Table
  const filteredEvaluations = evaluations.filter((ev) => {
    const matchCat =
      categoryFilter === 'ALL' ||
      ev.unit.categoryId === categoryFilter ||
      ev.unit.category?.id === categoryFilter ||
      ev.unit.category?.name === categoryFilter
    const matchSearch = ev.unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchPriority =
      priorityFilter === 'ALL' ||
      (priorityFilter === 'PRIORITY' && !!ev.isPriority) ||
      (priorityFilter === 'REGULAR' && !ev.isPriority)
    const matchUpdate =
      updateFilter === 'ALL' ||
      (updateFilter === 'UPDATED' && !!ev.recentUpdate) ||
      (updateFilter === 'REVISION' && ev.recentUpdate?.type === 'F01_REVISION')
    return matchCat && matchSearch && matchPriority && matchUpdate
  })

  // Filtered Units for Modal
  const [modalSearch, setModalSearch] = useState('')
  const [modalCategoryFilter, setModalCategoryFilter] = useState('ALL')

  const modalFilteredUnits = allUnits.filter((u) => {
    const matchCat =
      modalCategoryFilter === 'ALL' ||
      u.categoryId === modalCategoryFilter ||
      u.category?.id === modalCategoryFilter ||
      u.category?.name === modalCategoryFilter
    const matchSearch = u.name.toLowerCase().includes(modalSearch.toLowerCase())
    return matchCat && matchSearch
  })

  // Stats
  const totalUnits = evaluations.length
  const priorityCount = evaluations.filter((e) => e.isPriority).length
  const finishedCount = evaluations.filter((e) => e.isFinished).length
  const ratedUnits = evaluations.filter((e) => e.finalIppScore > 0)
  const avgIpp =
    ratedUnits.length > 0
      ? ratedUnits.reduce((acc, e) => acc + e.finalIppScore, 0) / ratedUnits.length
      : 0

  // Predicate Helper
  const getPredicateBadge = (score: number) => {
    if (score >= 4.51) return { label: 'A (Pelayanan Prima)', variant: 'success' as const }
    if (score >= 4.01) return { label: 'A- (Sangat Baik)', variant: 'success' as const }
    if (score >= 3.51) return { label: 'B (Baik)', variant: 'default' as const }
    if (score >= 3.01) return { label: 'B- (Baik Catatan)', variant: 'default' as const }
    if (score >= 2.51) return { label: 'C (Cukup)', variant: 'neutral' as const }
    if (score >= 2.01) return { label: 'C- (Cukup Catatan)', variant: 'neutral' as const }
    if (score >= 1.01) return { label: 'D (Buruk)', variant: 'danger' as const }
    if (score > 0) return { label: 'F (Sangat Buruk)', variant: 'danger' as const }
    return { label: 'Belum Dinilai', variant: 'neutral' as const }
  }

  // Handle Save Enrollment from Modal
  const handleSaveEnrollment = async () => {
    setLoading(true)
    try {
      const res = await enrollUnitsBulkAction(period.year, Array.from(selectedUnitIds))
      if (res.success) {
        toast.success(`Daftar lokus peserta tahun ${period.year} berhasil diperbarui!`)
        setIsEnrollModalOpen(false)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal memperbarui lokus peserta.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Edit Period Submit
  const handleEditPeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editYear || Number(editYear) < 2020 || Number(editYear) > 2099) {
      toast.error('Harap masukkan 4 digit angka tahun yang valid (contoh: 2027)!')
      return
    }

    setLoading(true)
    try {
      const res = await updatePeriodAction({
        id: period.id,
        newYear: Number(editYear),
        targetF03Quota: editTargetQuota,
        title: editTitle
      })

      if (res.success) {
        toast.success(`Tahun Penilaian berhasil diperbarui!`)
        setIsEditPeriodOpen(false)
        if (Number(editYear) !== period.year) {
          router.push(`/admin/periode/${editYear}`)
        } else {
          window.location.reload()
        }
      } else {
        toast.error(res.error || 'Gagal memperbarui tahun penilaian.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete / Remove Unit from Year
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setLoading(true)
    try {
      const res = await deleteEvaluationAction(deleteTarget.id)
      if (res.success) {
        toast.success(`Lokus ${deleteTarget.unit.name} berhasil dikeluarkan dari Tahun ${period.year}.`)
        setIsDeleteModalOpen(false)
        setDeleteTarget(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal melepaskan lokus.')
      }
    } catch {
      toast.error('Gagal melepaskan lokus.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFinished = async (ev: EvaluationRow) => {
    const nextFinished = !ev.isFinished
    // Optimistic UI update
    setEvaluations((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, isFinished: nextFinished } : item))
    )

    try {
      const res = await toggleEvaluationFinishedAction(ev.id, nextFinished)
      if (res.success) {
        toast.success(
          res.isFinished
            ? `Evaluasi ${ev.unit.name} ditandai SELESAI.`
            : `Status selesai evaluasi ${ev.unit.name} dibuka kembali.`
        )
      } else {
        // Rollback
        setEvaluations((prev) =>
          prev.map((item) => (item.id === ev.id ? { ...item, isFinished: ev.isFinished } : item))
        )
        toast.error('Gagal mengubah status selesai.')
      }
    } catch {
      // Rollback
      setEvaluations((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, isFinished: ev.isFinished } : item))
      )
      toast.error('Terjadi kesalahan koneksi.')
    }
  }

  const handleTogglePriority = async (ev: EvaluationRow) => {
    const nextState = !ev.isPriority
    // Optimistic UI update (Instant feedback tanpa reload / refetch)
    setEvaluations((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, isPriority: nextState } : item))
    )

    try {
      const res = await toggleEvaluationPriorityAction(ev.id, nextState)
      if (res.success) {
        toast.success(
          nextState
            ? `⭐ Lokus ${ev.unit.name} ditandai sebagai Lokus Prioritas.`
            : `Tag prioritas lokus ${ev.unit.name} dilepaskan.`
        )
      } else {
        // Rollback if failed
        setEvaluations((prev) =>
          prev.map((item) => (item.id === ev.id ? { ...item, isPriority: ev.isPriority } : item))
        )
        toast.error('Gagal memperbarui status prioritas.')
      }
    } catch {
      // Rollback if network error
      setEvaluations((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, isPriority: ev.isPriority } : item))
      )
      toast.error('Terjadi kesalahan koneksi.')
    }
  }

  const handleTogglePublish = async () => {
    setLoading(true)
    try {
      const nextState = !period.isPublished
      const res = await togglePeriodPublishAction(period.id, nextState)
      if (res.success) {
        toast.success(
          nextState
            ? `Hasil Evaluasi Tahun ${period.year} berhasil dipublikasikan ke publik!`
            : `Hasil Evaluasi Tahun ${period.year} ditarik dari publik.`
        )
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal mengubah status publikasi.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
      setIsPublishModalOpen(false)
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Link href="/admin/periode" className="hover:text-ink transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Tahun Penilaian
        </Link>
        <span className="text-line">/</span>
        <span className="text-ink font-bold">PEKPPP {period.year}</span>
      </div>

      {/* Header */}
      <PageHeader
        icon={<CalendarDays className="w-5 h-5 text-brand" />}
        title={`Evaluasi PEKPPP Tahun ${period.year}`}
        description={`Pusat kendali evaluasi pelayanan publik Tahun ${period.year}. Pantau audit F-01 & F-02 (31 indikator), survei kepuasan F-03, dan skor IPP akhir seluruh lokus.`}
        actions={
          <div className="flex items-center gap-2.5">
            <Badge
              variant={period.isOpen ? 'success' : 'neutral'}
              dot
              pulseDot={period.isOpen}
              size="sm">
              {period.isOpen ? 'Aktif' : 'Ditutup'}
            </Badge>

            <Badge
              variant={period.isPublished ? 'info' : 'neutral'}
              size="sm">
              {period.isPublished ? 'Publik' : 'Internal'}
            </Badge>

            {/* Dropdown Menu Aksi Sederhana */}
            <div className="relative" ref={actionDropdownRef}>
              <button
                type="button"
                onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:scale-[0.98] transition-all shadow-md cursor-pointer">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Aksi Periode</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isActionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-surface border border-stroke/70 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-stroke/40 mb-1">
                    <div className="text-[11px] font-bold text-ink uppercase tracking-wider">
                      Opsi &amp; Menu Periode
                    </div>
                    <div className="text-[10px] text-ink-muted">
                      PEKPPP Tahun {period.year}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Kelola Lokus Peserta */}
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false)
                        setSelectedUnitIds(new Set(evaluations.map((e) => e.unitId)))
                        setIsEnrollModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle hover:text-brand transition-colors text-left cursor-pointer group">
                      <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">Kelola Lokus ({totalUnits})</div>
                        <div className="text-[10px] text-ink-muted truncate">Tambah / kurangi unit kerja</div>
                      </div>
                    </button>

                    {/* Laporan Komprehensif Eksekutif */}
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false)
                        handleOpenReport()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle hover:text-brand transition-colors text-left cursor-pointer group">
                      <div className="w-7 h-7 rounded-lg bg-pastel-blue text-pastel-blue-text flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">Laporan Komprehensif</div>
                        <div className="text-[10px] text-ink-muted truncate">Matriks 6 aspek, CSV, cetak PDF</div>
                      </div>
                    </button>

                    {/* Edit Pengaturan Periode / Tahun */}
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false)
                        setEditYear(period.year)
                        setEditTargetQuota(period.targetF03Quota || 30)
                        setEditTitle(period.title || `Evaluasi PEKPPP Tahun ${period.year}`)
                        setIsEditPeriodOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle hover:text-brand transition-colors text-left cursor-pointer group">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">Edit Tahun &amp; Periode</div>
                        <div className="text-[10px] text-ink-muted truncate">Ubah angka tahun, kuota F-03, judul</div>
                      </div>
                    </button>

                    <div className="border-t border-stroke/30 my-1" />

                    {/* Publikasikan / Tarik Publikasi */}
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false)
                        setIsPublishModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle transition-colors text-left cursor-pointer group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        period.isPublished ? 'bg-pastel-amber text-pastel-amber-text' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {period.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">
                          {period.isPublished ? 'Tarik Publikasi' : 'Publikasikan Hasil'}
                        </div>
                        <div className="text-[10px] text-ink-muted truncate">
                          {period.isPublished ? 'Sembunyikan dari publik' : 'Rilis resmi ke masyarakat'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-4 h-4 text-ink-muted" />}
          label="Total Lokus Peserta"
          value={totalUnits}
          sublabel={priorityCount > 0 ? `${priorityCount} Lokus Prioritas (⭐)` : 'Unit kerja terdaftar'}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-pastel-green-text" />}
          label="Evaluasi Selesai"
          value={finishedCount}
          sublabel={`${totalUnits > 0 ? Math.round((finishedCount / totalUnits) * 100) : 0}% tuntas dinilai`}
        />
        <StatCard
          icon={<Award className="w-4 h-4 text-ink" />}
          label="Rata-Rata IPP Tahun"
          value={avgIpp > 0 ? avgIpp.toFixed(2) : '-'}
          sublabel={avgIpp > 0 ? getPredicateBadge(avgIpp).label : 'Belum ada penilaian'}
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-ink-muted" />}
          label="Target Responden F-03"
          value={targetQuota}
          sublabel="Minimal per lokus"
        />
      </div>

      {/* Tab Switcher: Lokus Evaluasi vs Jadwal & Tahapan Penilaian */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'lokus' | 'jadwal')}>
        <TabsList>
          <TabsTrigger value="lokus">
            <Building2 className="w-4 h-4" />
            <span>Daftar Lokus Peserta ({totalUnits})</span>
          </TabsTrigger>
          <TabsTrigger value="jadwal">
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal &amp; Jendela Waktu Penilaian</span>
            {timelineResult?.activeWindow && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'jadwal' && timelineResult && (
        <PeriodTimelineManager
          year={period.year}
          periodId={period.id}
          windows={timelineResult.windows}
          activeWindow={timelineResult.activeWindow}
          isPeriodOpen={period.isOpen}
        />
      )}

      {activeTab === 'lokus' && (
      /* Unified Bento Table Card with Integrated Header Toolbar */
      <div className="bg-surface rounded-bento border border-stroke/50 shadow-soft-card overflow-hidden">
        {/* Integrated Header Toolbar */}
        <div className="px-6 py-4 border-b border-stroke/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-surface">
          <div>
            <h2 className="text-base font-medium text-ink tracking-tight">Daftar Lokus Evaluasi</h2>
            <p className="text-xs text-ink-muted">
              {totalUnits} Unit kerja terdaftar ({priorityCount} prioritas)
            </p>
          </div>

          {/* Integrated Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama unit..."
                className="w-44 sm:w-56 pl-9 pr-3.5 py-1.5 text-xs rounded-full bg-surface-elevated border border-stroke/60 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-all shadow-2xs"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3.5 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface-elevated text-ink font-normal cursor-pointer focus:outline-none focus:border-brand shadow-2xs">
              <option value="ALL">Semua Lokus</option>
              <option value="PRIORITY">⭐ Hanya Prioritas ({priorityCount})</option>
              <option value="REGULAR">Non-Prioritas ({totalUnits - priorityCount})</option>
            </select>

            <select
              value={updateFilter}
              onChange={(e) => setUpdateFilter(e.target.value as any)}
              className="px-3.5 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface-elevated text-ink font-normal cursor-pointer focus:outline-none focus:border-brand shadow-2xs">
              <option value="ALL">Semua Aktivitas</option>
              <option value="UPDATED">⚡ Ada Pembaruan F01/Bukti</option>
              <option value="REVISION">⚠️ Revisi Pasca Penilaian</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface-elevated text-ink font-normal cursor-pointer focus:outline-none focus:border-brand shadow-2xs">
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredEvaluations.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Building2 className="w-9 h-9 text-ink-muted mx-auto" />
            <h3 className="font-medium text-ink text-sm">Belum Ada Lokus Terdaftar</h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              Belum ada lokus unit kerja yang didaftarkan pada Evaluasi PEKPPP Tahun {period.year}.
            </p>
            <div className="pt-1">
              <Button
                variant="brand"
                size="sm"
                onClick={() => setIsEnrollModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Daftarkan Lokus Sekarang
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[260px] pb-20">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stroke/40 text-ink-muted font-medium text-[11px] uppercase tracking-wider bg-surface-subtle/20">
                <tr>
                  <th className="pl-6 pr-4 py-2.5 font-normal">Lokus Unit Kerja</th>
                  <th className="px-4 py-2.5 font-normal">Audit F-01 &amp; F-02</th>
                  <th className="px-3 py-2.5 text-center font-normal">Survei F-03</th>
                  <th className="px-3 py-2.5 text-center font-normal">Bukti Fisik</th>
                  <th className="px-3 py-2.5 text-center font-normal">Skor IPP</th>
                  <th className="px-3 py-2.5 text-center font-normal">Status</th>
                  <th className="pl-3 pr-6 py-2.5 text-right font-normal">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke/25">
                {filteredEvaluations.map((ev) => {
                  const filledScores = ev.scores.filter((s) => s.score !== null).length
                  const f01Count = ev.scores.filter((s) => s.f01Submitted).length
                  const f03Count = ev._count.f03Respondents || 0
                  const evidenceCount = ev._count.evidenceSubmissions || 0
                  const predicate = getPredicateBadge(ev.finalIppScore)

                  return (
                    <tr key={ev.id} className="hover:bg-surface-subtle/30 transition-colors group">
                      <td className="pl-6 pr-4 py-2.5 max-w-xs sm:max-w-sm">
                        <div className="flex items-start gap-1.5">
                          {/* 1-Click Toggle Star Prioritas */}
                          <button
                            type="button"
                            onClick={() => handleTogglePriority(ev)}
                            title={ev.isPriority ? 'Lokus Prioritas (Klik untuk lepas status prioritas)' : 'Klik untuk jadikan Lokus Prioritas'}
                            className={`p-1 rounded-md transition-all cursor-pointer shrink-0 mt-0.5 ${
                              ev.isPriority
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100'
                                : 'text-ink-muted/40 hover:text-amber-400 hover:bg-surface-subtle'
                            }`}>
                            <Star className={`w-3.5 h-3.5 ${ev.isPriority ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/evaluasi/${ev.unit.id}`}
                                className="font-medium text-xs text-ink hover:text-brand transition-colors inline-flex items-center gap-1">
                                <span className="truncate">{ev.unit.name}</span>
                                <ArrowUpRight className="w-3 h-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </Link>

                              {ev.isPriority && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  Prioritas
                                </span>
                              )}
                            </div>

                            {/* Subtitle: Kategori & Status Update Ringkas */}
                            <div className="flex items-center gap-1.5 text-[10px] text-ink-muted font-normal mt-0.5 flex-wrap">
                              <span>{ev.unit.category?.name || 'Perangkat Daerah'}</span>

                              {ev.recentUpdate && (
                                <>
                                  <span className="text-ink-muted/40">•</span>
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      ev.recentUpdate.type === 'F01_REVISION'
                                        ? 'text-amber-600'
                                        : ev.recentUpdate.type === 'PROOF_TRIGGER'
                                        ? 'text-sky-600'
                                        : 'text-emerald-600'
                                    }`}
                                    title={`Diperbarui pada ${new Date(ev.recentUpdate.createdAt).toLocaleString('id-ID', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })}`}>
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        ev.recentUpdate.type === 'F01_REVISION'
                                          ? 'bg-amber-500 animate-pulse'
                                          : ev.recentUpdate.type === 'PROOF_TRIGGER'
                                          ? 'bg-sky-500'
                                          : 'bg-emerald-500'
                                      }`}
                                    />
                                    <span>
                                      {ev.recentUpdate.type === 'F01_REVISION'
                                        ? 'Revisi Pasca Nilai'
                                        : ev.recentUpdate.type === 'PROOF_TRIGGER'
                                        ? 'Bukti Baru'
                                        : 'F01 Baru'}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                            <span className="text-ink font-medium">F-02: {filledScores}/31</span>
                            <span className="text-ink-muted">F-01: {f01Count}</span>
                          </div>
                          <div className="w-full h-1 bg-surface-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full transition-all"
                              style={{ width: `${(filledScores / 31) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                            f03Count >= targetQuota
                              ? 'text-emerald-700 font-medium'
                              : 'text-ink-secondary'
                          }`}>
                          <Users className="w-3 h-3 text-ink-muted" />
                          <span>
                            {f03Count}/{targetQuota}
                          </span>
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-secondary">
                          <FolderOpen className="w-3 h-3 text-ink-muted" />
                          <span>{evidenceCount} Dok</span>
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className="leading-tight">
                          <span className="font-semibold text-xs text-ink font-mono">
                            {ev.finalIppScore > 0 ? ev.finalIppScore.toFixed(2) : '-'}
                          </span>
                          {ev.finalIppScore > 0 && (
                            <span className="block text-[9px] text-ink-muted">
                              {predicate.label}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFinished(ev)}
                          title="Klik untuk ubah status selesai"
                          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.isFinished ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className={ev.isFinished ? 'text-emerald-800' : 'text-ink-muted'}>
                            {ev.isFinished ? 'Selesai' : 'Proses'}
                          </span>
                        </button>
                      </td>

                      <td className="pl-3 pr-6 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <Link
                            href={`/evaluasi/${ev.unit.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand hover:bg-brand-hover text-white text-[11px] font-medium transition-all shadow-2xs">
                            <span>Nilai</span>
                          </Link>

                          {/* Drawer / Popup Menu kecil untuk Sync & Hapus */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)}
                              className="w-7 h-7 rounded-full border border-stroke/50 bg-white hover:bg-surface-subtle flex items-center justify-center text-ink-muted hover:text-ink transition-colors shadow-2xs cursor-pointer"
                              title="Opsi Lainnya">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === ev.id && (
                              <div
                                ref={rowMenuRef}
                                className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-xl border border-stroke/60 shadow-soft-float p-1 z-30 text-left animate-fade-in-content">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    setSyncModalState({
                                      isOpen: true,
                                      evaluationId: ev.id,
                                      unitName: ev.unit.name
                                    })
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
                                  <Send className="w-3.5 h-3.5 text-ink-muted" />
                                  <span>Sync MenPAN-RB</span>
                                </button>

                                <div className="my-1 border-t border-stroke/40" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null)
                                    setDeleteTarget(ev)
                                    setIsDeleteModalOpen(true)
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Lepaskan Lokus</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal Kelola Lokus Peserta */}
      <FormModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Kelola Lokus Peserta PEKPPP ${period.year}`}
        description="Pilih unit kerja yang diikutsertakan dalam evaluasi PEKPPP tahun ini.">
        <div className="space-y-4 pt-1">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari unit kerja..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-ink shadow-2xs"
              />
            </div>

            <select
              value={modalCategoryFilter}
              onChange={(e) => setModalCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink font-medium cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Selection Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                const allSelected = modalFilteredUnits.every((u) => selectedUnitIds.has(u.id))
                setSelectedUnitIds((prev) => {
                  const next = new Set(prev)
                  if (allSelected) modalFilteredUnits.forEach((u) => next.delete(u.id))
                  else modalFilteredUnits.forEach((u) => next.add(u.id))
                  return next
                })
              }}
              className="px-2.5 py-1 rounded-lg border border-line bg-surface-subtle hover:bg-surface-muted text-[11px] font-medium text-ink transition-colors cursor-pointer">
              {modalFilteredUnits.every((u) => selectedUnitIds.has(u.id))
                ? 'Batal Pilih Filter Ini'
                : 'Pilih Semua Sesuai Filter'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedUnitIds(new Set())}
              className="px-2.5 py-1 rounded-lg border border-pastel-rose-border text-pastel-rose-text hover:bg-pastel-rose text-[11px] font-medium transition-colors cursor-pointer ml-auto">
              Kosongkan Pilihan
            </button>
          </div>

          {/* Units Checklist Box */}
          <div className="max-h-72 overflow-y-auto border border-line rounded-xl p-1.5 divide-y divide-line bg-surface-subtle">
            {modalFilteredUnits.map((unit) => {
              const isChecked = selectedUnitIds.has(unit.id)

              return (
                <label
                  key={unit.id}
                  className="flex items-center justify-between p-2.5 hover:bg-card rounded-lg cursor-pointer transition-colors text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                    <span className="font-semibold text-ink truncate text-[11px]">{unit.name}</span>
                  </div>

                  <Badge variant="neutral" size="sm" className="shrink-0 text-[10px]">
                    {unit.category?.name || 'OPD'}
                  </Badge>
                </label>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-line">
            <span className="text-xs font-mono font-bold text-ink-muted">
              {selectedUnitIds.size} Lokus Terpilih
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEnrollModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={loading}
                isLoading={loading}
                onClick={handleSaveEnrollment}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Confirmation Modal: Delete / Remove Unit from Year */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        loading={loading}
        variant="danger"
        title={`Lepaskan ${deleteTarget?.unit.name}?`}
        description={`Unit kerja ini beserta isian skor evaluasi pada Tahun ${period.year} akan dilepaskan.`}
        confirmText="Lepaskan Lokus"
      />

      {/* Confirmation Modal: Publish / Unpublish Period */}
      <ConfirmationModal
        isOpen={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        onConfirm={handleTogglePublish}
        loading={loading}
        variant="primary"
        title={
          period.isPublished
            ? `Tarik Publikasi Hasil Evaluasi ${period.year}?`
            : `Publikasikan Hasil Evaluasi ${period.year}?`
        }
        description={
          period.isPublished
            ? `Hasil evaluasi Tahun ${period.year} akan disembunyikan dari portal publik. Halaman publik akan menampilkan status bahwa penilaian masih berlangsung/internal.`
            : `Hasil akhir penilaian dan peringkat lokus Tahun ${period.year} akan dapat diakses oleh publik secara terbuka.`
        }
        confirmText={period.isPublished ? 'Tarik dari Publik' : 'Publikasikan Sekarang'}
      />

      {/* MenPAN-RB API Sync Modal */}
      <MenpanSyncModal
        isOpen={syncModalState.isOpen}
        onClose={() => {
          setSyncModalState({ isOpen: false, evaluationId: '', unitName: '' })
        }}
        evaluationId={syncModalState.evaluationId}
        unitName={syncModalState.unitName}
        year={period.year}
      />

      {/* Comprehensive Annual Report Modal */}
      <ComprehensiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={reportData}
        loading={reportLoading}
      />

      {/* Modal Edit Tahun & Periode */}
      <FormModal
        isOpen={isEditPeriodOpen}
        onClose={() => setIsEditPeriodOpen(false)}
        title={`Edit Periode & Tahun Evaluasi`}
        description="Perbarui angka tahun, target kuota F-03, atau judul evaluasi.">
        <form onSubmit={handleEditPeriodSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Angka Tahun Evaluasi <span className="text-pastel-rose-text">*</span>
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
                Mengubah tahun akan memindahkan seluruh lokus dan berkas ke tahun yang baru.
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
              <p className="text-[10px] text-ink-muted mt-1">
                Target minimal responden per lokus unit kerja.
              </p>
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
              onClick={() => setIsEditPeriodOpen(false)}>
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
    </div>
  )
}
