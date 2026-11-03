'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
  MoreVertical,
  RefreshCw,
  Loader2,
  FileSpreadsheet
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { FormModal } from '../../../../components/ui/FormModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { Breadcrumb } from '../../../../components/ui/Breadcrumb'
import { Button } from '../../../../components/ui/Button'
import { Badge } from '../../../../components/ui/Badge'
import { Card } from '../../../../components/ui/Card'
import { StatCard } from '../../../../components/ui/StatCard'
import { AdminTabs } from '../../../../components/ui/AdminTabs'
import { MenpanSyncModal } from '../../../../components/features/MenpanSyncModal'
import { MenpanReconciliationSheet } from '../../../../components/features/MenpanReconciliationSheet'
import { ComprehensiveReportModal } from '../../../../components/features/ComprehensiveReportModal'
import {
  getComprehensiveAnnualReportAction,
  ComprehensiveAnnualReport
} from '../../../../actions/report-actions'
import { syncAllLokusFromMenpanAction } from '../../../../actions/menpan-actions'
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
  menpanEvaluationName?: string | null
  menpanFormSheetName?: string | null
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
  initialEvaluations = [],
  totalCount: initialTotalCount = 0,
  enrolledUnitIds = [],
  initialStats,
  allUnits = [],
  timelineResult
}: {
  period: { id: string; year: number; isOpen: boolean; isPublished?: boolean; targetF03Quota?: number | null; f03CalculationMethod?: string | null; title?: string | null }
  initialEvaluations?: EvaluationRow[]
  totalCount?: number
  enrolledUnitIds?: string[]
  initialStats?: {
    totalUnits: number
    priorityCount: number
    finishedCount: number
    avgIpp: number
  }
  allUnits: UnitItem[]
  timelineResult?: PeriodTimelineResult
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'lokus' | 'jadwal'>('lokus')

  const [loading, setLoading] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // Edit Period Modal State
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false)
  const [editYear, setEditYear] = useState<number | ''>(period.year)
  const [editTargetQuota, setEditTargetQuota] = useState<number>(period.targetF03Quota || 30)
  const [editF03Method, setEditF03Method] = useState<string>(period.f03CalculationMethod || 'PROPORTIONAL')
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

  // MenPAN Reconciliation Sheet State
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false)

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

  // Batch Sync MenPAN State
  const [isBatchSyncing, setIsBatchSyncing] = useState(false)

  const handleBatchSyncMenpan = async () => {
    setIsBatchSyncing(true)
    try {
      const res = await syncAllLokusFromMenpanAction(period.year)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Gagal menghubungkan daftar lokus ke server MenPAN-RB.')
    } finally {
      setIsBatchSyncing(false)
    }
  }

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
  const initialEnrolled = useMemo(
    () => new Set(enrolledUnitIds.length > 0 ? enrolledUnitIds : initialEvaluations.map((e) => e.unitId)),
    [enrolledUnitIds, initialEvaluations]
  )
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(initialEnrolled)

  // Table filter & search
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'PRIORITY' | 'REGULAR'>('ALL')
  const [updateFilter, setUpdateFilter] = useState<'ALL' | 'UPDATED' | 'REVISION'>('ALL')

  // Server-side paginated state (real network refetch)
  const [items, setItems] = useState<EvaluationRow[]>(initialEvaluations)
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(initialTotalCount || initialEvaluations.length)
  const [hasMore, setHasMore] = useState<boolean>(initialEvaluations.length < (initialTotalCount || initialEvaluations.length))
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isInitialMount = useRef<boolean>(true)

  // Categories list
  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          allUnits
            .filter((u) => u.category)
            .map((u) => [u.category!.id, { id: u.category!.id, name: u.category!.name }])
        ).values()
      ),
    [allUnits]
  )

  // Real refetch saat filter atau pencarian berubah
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    let isCancelled = false
    const fetchFiltered = async () => {
      setIsLoadingMore(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '15')
        if (searchTerm.trim()) {
          params.set('searchTerm', searchTerm.trim())
        }
        params.set('categoryFilter', categoryFilter)
        params.set('priorityFilter', priorityFilter)
        params.set('updateFilter', updateFilter)

        const res = await fetch(`/api/admin/periode/${period.year}/evaluations?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat lokus periode')
        const data = await res.json()
        if (!isCancelled && data.success && Array.isArray(data.items)) {
          setItems(data.items)
          setPage(1)
          setTotal(data.total)
          setHasMore(data.hasMore)
        }
      } catch (err) {
        console.error('Error fetching filtered evaluations:', err)
      } finally {
        if (!isCancelled) setIsLoadingMore(false)
      }
    }

    fetchFiltered()
    return () => {
      isCancelled = true
    }
  }, [searchTerm, categoryFilter, priorityFilter, updateFilter, period.year])

  // Real refetch saat scrolling (auto loadmore)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '15')
      if (searchTerm.trim()) {
        params.set('searchTerm', searchTerm.trim())
      }
      params.set('categoryFilter', categoryFilter)
      params.set('priorityFilter', priorityFilter)
      params.set('updateFilter', updateFilter)

      const res = await fetch(`/api/admin/periode/${period.year}/evaluations?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat halaman berikutnya')
      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setItems((prev) => [...prev, ...data.items])
        setPage(nextPage)
        setTotal(data.total)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more evaluations:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, page, period.year, searchTerm, categoryFilter, priorityFilter, updateFilter])

  // IntersectionObserver untuk auto refetch
  useEffect(() => {
    if (!hasMore || isLoadingMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMore()
        }
      },
      { root: null, rootMargin: '250px', threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

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

  // Global Stats
  const totalUnits = initialStats?.totalUnits ?? total
  const priorityCount = initialStats?.priorityCount ?? items.filter((e) => e.isPriority).length
  const finishedCount = initialStats?.finishedCount ?? items.filter((e) => e.isFinished).length
  const avgIpp = initialStats?.avgIpp ?? 0

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
        f03CalculationMethod: editF03Method,
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
    setItems((prev) =>
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
        setItems((prev) =>
          prev.map((item) => (item.id === ev.id ? { ...item, isFinished: ev.isFinished } : item))
        )
        toast.error('Gagal mengubah status selesai.')
      }
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, isFinished: ev.isFinished } : item))
      )
      toast.error('Terjadi kesalahan koneksi.')
    }
  }

  const handleTogglePriority = async (ev: EvaluationRow) => {
    const nextState = !ev.isPriority
    // Optimistic UI update (Instant feedback tanpa reload / refetch)
    setItems((prev) =>
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
        setItems((prev) =>
          prev.map((item) => (item.id === ev.id ? { ...item, isPriority: ev.isPriority } : item))
        )
        toast.error('Gagal memperbarui status prioritas.')
      }
    } catch {
      // Rollback if network error
      setItems((prev) =>
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
      <Breadcrumb
        showBackOnFirst
        items={[
          { label: 'Tahun Penilaian', href: '/admin/periode' },
          { label: `PEKPPP ${period.year}` }
        ]}
      />

      {/* Header */}
      <PageHeader
        icon={<CalendarDays className="w-5 h-5 text-brand" />}
        title={`Evaluasi PEKPPP Tahun ${period.year}`}
        description={`Pusat kendali evaluasi pelayanan publik Tahun ${period.year}. Pantau audit F-01 & F-02 (31 indikator), survei kepuasan F-03, dan skor IPP akhir seluruh lokus.`}
        speedDialItems={[
          {
            label: `Kelola Lokus (${totalUnits})`,
            icon: <Plus className="w-4 h-4" />,
            onClick: () => {
              setSelectedUnitIds(new Set(enrolledUnitIds.length > 0 ? enrolledUnitIds : items.map((e) => e.unitId)))
              setIsEnrollModalOpen(true)
            }
          },
          {
            label: 'Rekonsiliasi MenPAN-RB',
            icon: <FileSpreadsheet className="w-4 h-4" />,
            onClick: () => setIsReconciliationOpen(true)
          },
          {
            label: 'Laporan Komprehensif',
            icon: <FileText className="w-4 h-4" />,
            onClick: handleOpenReport
          },
          {
            label: 'Pengaturan Periode',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            onClick: () => {
              setEditYear(period.year)
              setEditTargetQuota(period.targetF03Quota || 30)
              setEditF03Method(period.f03CalculationMethod || 'PROPORTIONAL')
              setEditTitle(period.title || `Evaluasi PEKPPP Tahun ${period.year}`)
              setIsEditPeriodOpen(true)
            }
          }
        ]}
        actions={
          <div className="flex items-center gap-2.5">
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
                        setSelectedUnitIds(new Set(enrolledUnitIds.length > 0 ? enrolledUnitIds : items.map((e) => e.unitId)))
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

                    {/* Rekonsiliasi Lokus MenPAN-RB */}
                    <button
                      onClick={() => {
                        setIsActionDropdownOpen(false)
                        setIsReconciliationOpen(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle hover:text-brand transition-colors text-left cursor-pointer group">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink">Rekonsiliasi MenPAN-RB</div>
                        <div className="text-[10px] text-ink-muted truncate">Spreadsheet binding lokus tahun ini</div>
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
                        setEditF03Method(period.f03CalculationMethod || 'PROPORTIONAL')
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

      {/* Top Bar: Tab Switcher (Kiri) Between Filter & Aksi (Kanan) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <AdminTabs
          items={[
            {
              id: 'lokus',
              badge: <Building2 className="w-3.5 h-3.5" />,
              label: 'Daftar Lokus Peserta',
              count: totalUnits
            },
            {
              id: 'jadwal',
              badge: <CalendarDays className="w-3.5 h-3.5" />,
              label: 'Jadwal & Tahapan',
              count: timelineResult?.activeWindow ? 'Aktif' : undefined
            }
          ]}
          activeId={activeTab}
          onChange={(val) => setActiveTab(val as 'lokus' | 'jadwal')}
          bordered={false}
          size="sm"
        />

        {activeTab === 'lokus' && (
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar py-0.5 shrink-0">
            {/* Search Input - Ringkas & Fleksibel */}
            <div className="relative shrink-0 flex items-center">
              <Search className="w-3 h-3 text-ink-muted absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari lokus..."
                className="h-8 w-28 sm:w-36 focus:w-44 transition-all pl-7 pr-2.5 text-xs rounded-full bg-surface-elevated border border-stroke/60 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs leading-none"
              />
            </div>

            {/* Kapsul Filter Terpadu (3-in-1 Segmented Pill) */}
            <div className="inline-flex items-center h-8 rounded-full border border-stroke/60 bg-surface-elevated shadow-2xs shrink-0 overflow-hidden">
              {/* Filter Prioritas (Ujung Kiri Melengkung) */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="h-full bg-transparent hover:bg-surface-subtle transition-colors pl-3 pr-2 text-xs text-ink font-normal cursor-pointer focus:outline-none focus:bg-surface-subtle border-y-0 border-l-0 border-r border-stroke/50 rounded-l-full">
                <option value="ALL" className="bg-surface-elevated text-ink">Semua Lokus</option>
                <option value="PRIORITY" className="bg-surface-elevated text-ink">⭐ Prioritas ({priorityCount})</option>
                <option value="REGULAR" className="bg-surface-elevated text-ink">Non-Prioritas</option>
              </select>

              {/* Filter Aktivitas (Segmen Tengah) */}
              <select
                value={updateFilter}
                onChange={(e) => setUpdateFilter(e.target.value as any)}
                className="h-full bg-transparent hover:bg-surface-subtle transition-colors px-2.5 text-xs text-ink font-normal cursor-pointer focus:outline-none focus:bg-surface-subtle border-y-0 border-l-0 border-r border-stroke/50 rounded-none">
                <option value="ALL" className="bg-surface-elevated text-ink">Semua Aktivitas</option>
                <option value="UPDATED" className="bg-surface-elevated text-ink">⚡ Ada Update</option>
                <option value="REVISION" className="bg-surface-elevated text-ink">⚠️ Revisi</option>
              </select>

              {/* Filter Kategori (Ujung Kanan Melengkung) */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-full bg-transparent hover:bg-surface-subtle transition-colors pl-2.5 pr-3 text-xs text-ink font-normal cursor-pointer focus:outline-none focus:bg-surface-subtle border-0 max-w-[130px] truncate rounded-r-full">
                <option value="ALL" className="bg-surface-elevated text-ink">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface-elevated text-ink">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Rekonsiliasi MenPAN */}
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => setIsReconciliationOpen(true)}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              className="h-8 text-xs shrink-0 rounded-full shadow-2xs whitespace-nowrap px-3.5 font-medium"
              title="Buka Spreadsheet Rekonsiliasi & Binding Lokus dengan Portal MenPAN-RB">
              Rekonsiliasi MenPAN
            </Button>
          </div>
        )}
      </div>

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
      /* Unified Table Card */
      <Card padding="none">
        {/* Table Content */}
        {items.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Building2 className="w-9 h-9 text-ink-muted mx-auto" />
            <h3 className="font-medium text-ink text-sm">
              {isLoadingMore
                ? 'Memuat data dari server...'
                : total === 0
                  ? 'Belum Ada Lokus Terdaftar'
                  : 'Tidak Ada Lokus yang Cocok'}
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              {total === 0
                ? `Belum ada lokus unit kerja yang didaftarkan pada Evaluasi PEKPPP Tahun ${period.year}.`
                : 'Tidak ada lokus peserta yang sesuai dengan kata kunci pencarian atau filter yang dipilih.'}
            </p>
            {total === 0 ? (
              <div className="pt-1">
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Daftarkan Lokus Sekarang
                </Button>
              </div>
            ) : (
              <div className="pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setPriorityFilter('ALL')
                    setUpdateFilter('ALL')
                    setCategoryFilter('ALL')
                  }}>
                  Reset Filter
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[260px] pb-20">
            {/* Mobile Scroll Hint */}
            <div className="sm:hidden px-4 py-2 text-[10px] text-ink-muted flex items-center justify-between border-b border-stroke/30 bg-surface-subtle/25">
              <span>Geser tabel ke samping untuk melihat detail &rarr;</span>
              <span className="font-semibold text-brand">7 Kolom</span>
            </div>
            <table className="w-full min-w-[680px] text-left text-xs">
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
                {items.map((ev) => {
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

                              <span className="text-ink-muted/40">•</span>
                              {ev.menpanEvaluationId ? (
                                <span
                                  className="inline-flex items-center gap-1 font-medium text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200"
                                  title={`Terikat MenPAN: ${ev.menpanEvaluationName || ev.menpanEvaluationId}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="truncate max-w-[110px]">{ev.menpanEvaluationName || 'Terikat MenPAN'}</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] text-ink-muted bg-surface-subtle px-1.5 py-0.2 rounded border border-stroke/40"
                                  title="Lokus ini belum ditautkan dengan portal MenPAN-RB">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  <span>Belum Bind</span>
                                </span>
                              )}

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
                          <div className="flex items-center justify-between text-[10px] tabular-nums leading-none">
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
                          className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${
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
                        <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-ink-secondary">
                          <FolderOpen className="w-3 h-3 text-ink-muted" />
                          <span>{evidenceCount} Dok</span>
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className="leading-tight">
                          <span className="font-semibold text-xs text-ink tabular-nums">
                            {ev.finalIppScore > 0 ? ev.finalIppScore.toFixed(2) : '-'}
                          </span>
                          {ev.finalIppScore > 0 && (
                            <span className="block text-[9px] text-ink-muted">
                              {ev.isFinished ? predicate.label : `${predicate.label} (Sementara)`}
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

        {/* Sentinel & Auto Load More Indicator (Server-Side Refetch) */}
        {hasMore && (
          <div ref={sentinelRef} className="p-4 text-center border-t border-stroke/40 bg-surface-subtle/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>
                  {isLoadingMore
                    ? 'Memuat lokus berikutnya dari server...'
                    : `Menampilkan ${items.length} dari ${total} lokus peserta`}
                </span>
              </div>

              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => loadMore()}
                className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer disabled:opacity-50">
                {isLoadingMore
                  ? 'Memuat...'
                  : `Muat lebih banyak (${Math.min(15, total - items.length)} tersisa)`}
              </button>
            </div>
          </div>
        )}

        {/* Footer saat semua data sudah dimuat */}
        {!hasMore && total > 15 && (
          <div className="py-2.5 px-4 border-t border-stroke/40 bg-surface-subtle/20 text-center text-xs text-ink-muted font-normal">
            Menampilkan seluruh {total} lokus peserta
          </div>
        )}
      </Card>
      )}

      {/* Modal Kelola Lokus Peserta */}
      <FormModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        icon={<Building2 className="w-4.5 h-4.5" />}
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
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-brand shadow-2xs"
              />
            </div>

            <select
              value={modalCategoryFilter}
              onChange={(e) => setModalCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink font-medium cursor-pointer focus:outline-none focus:border-brand">
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
                      className="rounded accent-brand shrink-0"
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
            <span className="text-xs font-semibold tabular-nums text-ink-muted">
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

      {/* MenPAN-RB Excel-Style Bulk Reconciliation Sheet */}
      <MenpanReconciliationSheet
        year={period.year}
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
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
        description="Perbarui angka tahun, target kuota F-03, atau judul evaluasi."
        icon={<Pencil className="w-4 h-4" />}>
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
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-semibold tabular-nums focus:outline-none focus:border-brand shadow-2xs"
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
                className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-sm font-semibold tabular-nums focus:outline-none focus:border-brand shadow-2xs"
              />
              <p className="text-[10px] text-ink-muted mt-1">
                Target minimal responden per lokus unit kerja.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Aturan Perhitungan Kuota F-03
            </label>
            <div className="relative">
              <select
                value={editF03Method}
                onChange={(e) => setEditF03Method(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-brand shadow-2xs cursor-pointer appearance-none pr-9">
                <option value="PROPORTIONAL">Hitung Bertahap (Sesuai Responden yang Masuk)</option>
                <option value="STRICT">Target Penuh (Wajib Memenuhi Kuota)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-ink-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-ink-muted mt-1">
              {editF03Method === 'STRICT'
                ? 'Nilai F-03 baru diaktifkan ke Skor IPP jika kuota responden sudah terpenuhi lengkap.'
                : 'Nilai F-03 langsung dihitung bertahap mengikuti persentase responden yang terkumpul.'}
            </p>
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
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-card text-ink text-xs focus:outline-none focus:border-brand shadow-2xs"
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
              variant="primary"
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
