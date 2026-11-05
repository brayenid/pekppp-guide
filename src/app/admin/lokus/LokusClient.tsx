'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import {
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
  createUnitsBulkAction,
  deleteUnitsBulkAction,
  updateUnitsBulkAction
} from '../../../actions/unit-actions'
import { unbindEvaluationFromMenpanAction } from '../../../actions/menpan-actions'
import {
  Building2,
  Plus,
  Folder,
  FolderArchive,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
  X,
  Search,
  Check,
  Loader2,
  Save,
  Link2,
  Star,
  CalendarDays,
  Unlink,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { FormModal } from '../../../components/ui/FormModal'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { AdminTabs, UnderlineTabs, type AdminTabItem } from '../../../components/ui/AdminTabs'

export interface Category {
  id: string
  name: string
}

export interface UnitEvaluationBinding {
  id: string
  year: number
  menpanEvaluationId?: string | null
  menpanEvaluationName?: string | null
  menpanFormSheetName?: string | null
  isPriority?: boolean
  syncStatus?: string | null
  syncedAt?: Date | string | null
}

export interface UnitItem {
  id: string
  name: string
  category?: Category | null
  evaluations?: UnitEvaluationBinding[]
}

export default function LokusClient({
  initialUnits,
  categories
}: {
  initialUnits: UnitItem[]
  categories: Category[]
}) {
  // Create State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Edit State
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // Delete State
  const [deletingUnit, setDeletingUnit] = useState<UnitItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // MenPAN Binding History Modal State
  const [bindingModalUnit, setBindingModalUnit] = useState<UnitItem | null>(null)
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false)
  const [unbindingId, setUnbindingId] = useState<string | null>(null)

  const handleUnbindEvaluation = async (evaluationId: string, year: number) => {
    if (!confirm(`Apakah Anda yakin ingin melepaskan binding lokus ini untuk Tahun Evaluasi ${year}?`)) return
    setUnbindingId(evaluationId)
    try {
      const res = await unbindEvaluationFromMenpanAction(evaluationId)
      if (res.success) {
        toast.success(res.message)
        setBindingModalUnit((prev) => {
          if (!prev || !prev.evaluations) return prev
          return {
            ...prev,
            evaluations: prev.evaluations.map((e) =>
              e.id === evaluationId
                ? { ...e, menpanEvaluationId: null, menpanEvaluationName: null, menpanFormSheetName: null, syncStatus: 'IDLE' }
                : e
            )
          }
        })
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Gagal melepaskan tautan lokus.')
    } finally {
      setUnbindingId(null)
    }
  }

  // Bulk Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkTab, setBulkTab] = useState<'insert' | 'edit' | 'delete'>('insert')

  // Bulk Edit state: track per-row edits as a Map { id -> { name, categoryId } }
  const [editDrafts, setEditDrafts] = useState<Record<string, { name: string; categoryId: string }>>({})
  const [editSearchTerm, setEditSearchTerm] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // Bulk Insert state
  const [bulkText, setBulkText] = useState('')
  const [bulkCategoryId, setBulkCategoryId] = useState('')

  // Bulk Delete state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)

  // Parse textarea lines for insert preview
  const bulkEntries = useMemo(
    () =>
      bulkText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [bulkText]
  )

  // Table Search & Filter State
  const [tableSearchTerm, setTableSearchTerm] = useState('')
  const [tableCategoryFilter, setTableCategoryFilter] = useState('ALL')
  type LokusTabFilter = 'ALL' | 'BOUND' | 'UNBOUND' | 'PRIORITY'
  const [activeLokusTab, setActiveLokusTab] = useState<LokusTabFilter>('ALL')

  // Counts for Radar-Style Tabs
  const boundCount = useMemo(
    () => initialUnits.filter((u) => u.evaluations?.some((e) => Boolean(e.menpanEvaluationId))).length,
    [initialUnits]
  )
  const unboundCount = useMemo(
    () => initialUnits.filter((u) => !u.evaluations?.some((e) => Boolean(e.menpanEvaluationId))).length,
    [initialUnits]
  )
  const priorityCount = useMemo(
    () => initialUnits.filter((u) => u.evaluations?.some((e) => Boolean(e.isPriority))).length,
    [initialUnits]
  )

  const lokusTabItems: AdminTabItem<LokusTabFilter>[] = useMemo(
    () => [
      {
        id: 'ALL',
        badge: <Building2 className="w-3.5 h-3.5" />,
        label: 'Semua Lokus',
        count: initialUnits.length
      },
      {
        id: 'BOUND',
        badge: <Link2 className="w-3.5 h-3.5" />,
        label: 'Sudah Binding',
        count: boundCount
      },
      {
        id: 'UNBOUND',
        badge: <Unlink className="w-3.5 h-3.5" />,
        label: 'Belum Binding',
        count: unboundCount
      },
      {
        id: 'PRIORITY',
        badge: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />,
        label: 'Lokus Prioritas',
        count: priorityCount
      }
    ],
    [initialUnits.length, boundCount, unboundCount, priorityCount]
  )

  // Server-Side Paginated State (Real Network Refetch)
  const BATCH_SIZE = 20
  const [tableUnits, setTableUnits] = useState<UnitItem[]>(() => initialUnits.slice(0, BATCH_SIZE))
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(initialUnits.length)
  const [hasMore, setHasMore] = useState<boolean>(initialUnits.length > BATCH_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isInitialMount = useRef<boolean>(true)

  // Real refetch saat filter kategori, tab, atau pencarian berubah
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
        params.set('limit', String(BATCH_SIZE))
        params.set('tab', activeLokusTab)
        params.set('categoryId', tableCategoryFilter)
        if (tableSearchTerm.trim()) {
          params.set('q', tableSearchTerm.trim())
        }
        const res = await fetch(`/api/admin/lokus?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat master lokus')
        const data = await res.json()
        if (!isCancelled && data.success && Array.isArray(data.items)) {
          setTableUnits(data.items)
          setPage(1)
          setTotal(data.total)
          setHasMore(data.hasMore)
        }
      } catch (err) {
        console.error('Error fetching filtered lokus:', err)
      } finally {
        if (!isCancelled) setIsLoadingMore(false)
      }
    }

    fetchFiltered()
    return () => {
      isCancelled = true
    }
  }, [tableSearchTerm, tableCategoryFilter, activeLokusTab])

  // Real refetch saat scrolling (auto loadmore)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', String(BATCH_SIZE))
      params.set('tab', activeLokusTab)
      params.set('categoryId', tableCategoryFilter)
      if (tableSearchTerm.trim()) {
        params.set('q', tableSearchTerm.trim())
      }
      const res = await fetch(`/api/admin/lokus?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat halaman lokus berikutnya')
      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setTableUnits((prev) => [...prev, ...data.items])
        setPage(nextPage)
        setTotal(data.total)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more lokus:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, page, activeLokusTab, tableCategoryFilter, tableSearchTerm])

  // IntersectionObserver untuk auto refetch lokus
  useEffect(() => {
    if (!hasMore || isLoadingMore) return
    const el = loadMoreRef.current
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

  // Filtered units for bulk delete checklist
  const filteredUnits = useMemo(
    () =>
      initialUnits.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.category?.name || 'OPD').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [initialUnits, searchTerm]
  )

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama unit wajib diisi!')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    setLoading(true)
    try {
      await createUnitAction({
        name: name.trim(),
        categoryId: categoryId || undefined
      })
      toast.success(`Unit "${name}" berhasil ditambahkan!`)
      setName('')
      setCategoryId('')
      setIsFormOpen(false)
      window.location.reload()
    } catch {
      toast.error('Gagal menambahkan unit lokus.')
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const openEditModal = (unit: UnitItem) => {
    setEditingUnit(unit)
    setEditName(unit.name)
    setEditCategoryId(unit.category?.id || '')
    setIsEditFormOpen(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit || !editName.trim()) {
      toast.error('Nama unit wajib diisi!')
      return
    }
    setLoading(true)
    try {
      const res = await updateUnitAction(editingUnit.id, {
        name: editName.trim(),
        categoryId: editCategoryId || undefined
      })
      if (res.success) {
        toast.success(`Master Lokus "${editName}" berhasil diperbarui!`)
        setIsEditFormOpen(false)
        setEditingUnit(null)
        window.location.reload()
      } else {
        toast.error('Gagal memperbarui unit lokus.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memperbarui unit lokus.')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (unit: UnitItem) => {
    setDeletingUnit(unit)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUnit) return
    setLoading(true)
    try {
      const res = await deleteUnitAction(deletingUnit.id)
      if (res.success) {
        toast.success(`Master Lokus "${deletingUnit.name}" berhasil dihapus!`)
        setIsDeleteModalOpen(false)
        setDeletingUnit(null)
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menghapus unit lokus.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus unit lokus.')
    } finally {
      setLoading(false)
    }
  }

  // Bulk Insert handler
  const handleBulkInsert = async () => {
    if (bulkEntries.length === 0) {
      toast.error('Masukkan minimal satu nama lokus!')
      return
    }
    setBulkLoading(true)
    toast.info(`Menambahkan ${bulkEntries.length} lokus secara massal...`)
    try {
      const res = await createUnitsBulkAction(
        bulkEntries.map((name) => ({ name, categoryId: bulkCategoryId || undefined }))
      )
      if (res.success) {
        toast.success(`Berhasil menambahkan ${res.count} master lokus baru!`)
        setIsBulkOpen(false)
        setBulkText('')
        setBulkCategoryId('')
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menambahkan lokus secara massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  // Bulk Delete handler
  const executeBulkDelete = async () => {
    setIsBulkDeleteConfirmOpen(false)
    setBulkLoading(true)
    toast.info(`Menghapus ${selectedIds.length} lokus secara massal...`)
    try {
      const res = await deleteUnitsBulkAction(selectedIds)
      if (res.success) {
        toast.success(`Berhasil menghapus ${res.count} master lokus!`)
        setIsBulkOpen(false)
        setSelectedIds([])
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menghapus lokus secara massal.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredUnits.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredUnits.map((u) => u.id))
    }
  }

  const handleToggleUnit = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Bulk Edit handlers
  const initEditDrafts = () => {
    const drafts: Record<string, { name: string; categoryId: string }> = {}
    initialUnits.forEach((u) => {
      drafts[u.id] = { name: u.name, categoryId: u.category?.id || '' }
    })
    setEditDrafts(drafts)
  }

  const dirtyEditIds = useMemo(() =>
    Object.entries(editDrafts).filter(([id, draft]) => {
      const orig = initialUnits.find(u => u.id === id)
      if (!orig) return false
      return draft.name !== orig.name || draft.categoryId !== (orig.category?.id || '')
    }).map(([id]) => id),
    [editDrafts, initialUnits]
  )

  const filteredEditUnits = useMemo(() =>
    initialUnits.filter(u =>
      u.name.toLowerCase().includes(editSearchTerm.toLowerCase()) ||
      (u.category?.name || 'OPD').toLowerCase().includes(editSearchTerm.toLowerCase())
    ),
    [initialUnits, editSearchTerm]
  )

  const handleSaveBulkEdit = async () => {
    if (dirtyEditIds.length === 0) {
      toast.info('Tidak ada perubahan untuk disimpan.')
      return
    }
    setBulkLoading(true)
    toast.info(`Menyimpan ${dirtyEditIds.length} perubahan...`)
    try {
      const entries = dirtyEditIds.map((id) => ({
        id,
        name: editDrafts[id].name,
        categoryId: editDrafts[id].categoryId || undefined
      }))
      const res = await updateUnitsBulkAction(entries)
      if (res.success) {
        toast.success(`Berhasil memperbarui ${res.count} master lokus!`)
        setIsBulkOpen(false)
        setEditDrafts({})
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menyimpan perubahan.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleTabChange = (tab: 'insert' | 'edit' | 'delete') => {
    setBulkTab(tab)
    setSearchTerm('')
    setEditSearchTerm('')
    setSelectedIds([])
    setBulkText('')
    if (tab === 'edit') initEditDrafts()
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <PageHeader
        icon={<Building2 className="w-5 h-5 text-brand" />}
        title="Master Lokus"
        description="Daftar unit pelayanan perangkat daerah (reusable across periods). Tambahkan lokus baru atau kelola secara massal."
        speedDialItems={[
          {
            label: 'Tambah Lokus Baru',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsFormOpen(true),
            variant: 'brand'
          },
          {
            label: 'Kelola Massal',
            icon: <Users className="w-4 h-4" />,
            onClick: () => {
              handleTabChange('insert')
              setIsBulkOpen(true)
            },
            variant: 'secondary'
          }
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="brand"
              onClick={() => setIsFormOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Lokus Baru
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                handleTabChange('insert')
                setIsBulkOpen(true)
              }}
              leftIcon={<Users className="w-4 h-4 text-ink-muted" />}>
              Kelola Massal
            </Button>
          </div>
        }
      />

      {/* Reusable Underline Tabs (Terpisah dari container tabel) */}
      <UnderlineTabs<LokusTabFilter>
        items={lokusTabItems}
        activeId={activeLokusTab}
        onChange={(val) => setActiveLokusTab(val)}
      />

      {/* Full Width Unit List via Card + Toolbar Filter & Pencarian */}
      <Card padding="sm" className="space-y-3">
        {/* Toolbar Filter & Pencarian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <select
            value={tableCategoryFilter}
            onChange={(e) => setTableCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              placeholder="Cari master lokus..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        {/* Sub-Header Context Bar (Menyatu di dalam kartu) */}
        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-stroke/40 text-xs text-ink-muted flex items-center justify-between flex-wrap gap-2">
          <span>
            {activeLokusTab === 'BOUND'
              ? 'Menampilkan unit lokus yang sudah ditautkan ke akun evaluasi MenPAN-RB.'
              : activeLokusTab === 'UNBOUND'
                ? 'Menampilkan unit lokus yang belum memiliki binding integrasi ke portal MenPAN-RB.'
                : activeLokusTab === 'PRIORITY'
                  ? 'Menampilkan unit lokus dengan status prioritas evaluasi pembinaan khusus.'
                  : 'Daftar seluruh unit pelayanan publik terdaftar di Pemerintah Kabupaten Kutai Barat.'}
          </span>
          <span className="font-semibold text-ink shrink-0 ml-auto">
            Total {total} Unit Terfilter ({tableUnits.length} ditampilkan)
          </span>
        </div>

        {/* Content Table / List */}
        {tableUnits.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2 rounded-xl border border-line bg-surface">
            <p className="text-xs text-ink-muted">
              {isLoadingMore
                ? 'Memuat data dari server...'
                : initialUnits.length === 0
                  ? 'Belum ada lokus. Klik tombol Tambah Lokus Baru di atas.'
                  : 'Tidak ada lokus yang cocok dengan pencarian atau filter aktif.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="divide-y divide-line">
              {tableUnits.map((u) => (
                <div
                  key={u.id}
                  className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-ink truncate">{u.name}</span>
                      <Badge variant="neutral" size="sm">
                        {u.category?.name || 'OPD'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {/* MenPAN Yearly Bindings Badges */}
                      {(() => {
                        const boundEvals = (u.evaluations || []).filter((e) => Boolean(e.menpanEvaluationId))
                        if (boundEvals.length > 0) {
                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-ink-muted font-normal flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-teal-600" />
                                <span>MenPAN:</span>
                              </span>
                              {boundEvals.map((ev) => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => {
                                    setBindingModalUnit(u)
                                    setIsBindingModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                                  title={`Tahun ${ev.year}: ${ev.menpanEvaluationName || ev.menpanEvaluationId} (Klik untuk detail)`}>
                                  <span>{ev.year}</span>
                                  {ev.isPriority && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />}
                                </button>
                              ))}
                            </div>
                          )
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setBindingModalUnit(u)
                              setIsBindingModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink transition-colors cursor-pointer"
                            title="Lihat riwayat atau status binding MenPAN lokus ini">
                            <Link2 className="w-3 h-3 text-ink-muted/60" />
                            <span>Belum ada binding MenPAN</span>
                          </button>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap pt-1 sm:pt-0 border-t sm:border-t-0 border-stroke/30">
                    <button
                      type="button"
                      onClick={() => {
                        setBindingModalUnit(u)
                        setIsBindingModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stroke/60 bg-surface-subtle hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-ink text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                      title="Lihat Rincian Binding MenPAN-RB Lintas Tahun">
                      <Link2 className="w-3.5 h-3.5 text-teal-600" />
                      <span className="hidden sm:inline">Rincian MenPAN</span>
                    </button>

                    <Link
                      href={`/admin/master-bukti?unitId=${u.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stroke/60 bg-surface-subtle hover:bg-brand hover:text-white text-ink text-xs font-medium transition-colors shadow-2xs"
                      title="Lihat Master Bukti Dukung (Living Document) Lokus Ini">
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Master Bukti</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
                      title="Edit Master Lokus">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeleteModal(u)}
                      className="w-8 h-8 rounded-full border border-stroke/60 bg-white flex items-center justify-center text-ink-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer"
                      title="Hapus Master Lokus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sentinel & Auto Load More Indicator (Server-Side Refetch) */}
            {hasMore && (
              <div ref={loadMoreRef} className="p-4 text-center border-t border-line bg-surface-subtle/30">
                <div className="inline-flex items-center gap-2 text-xs text-ink-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>
                    {isLoadingMore
                      ? 'Memuat lokus berikutnya dari server...'
                      : 'Memuat lokus berikutnya secara otomatis...'}
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Pagination Summary Bar */}
            <div className="px-5 py-3.5 bg-surface-subtle/40 border-t border-line flex items-center justify-between text-xs text-ink-muted flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>
                  Menampilkan <strong className="text-ink font-semibold">{tableUnits.length}</strong> dari{' '}
                  <strong className="text-ink font-semibold">{total}</strong> master lokus
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasMore ? (
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => loadMore()}
                    className="px-3 py-1 rounded-lg border border-line bg-surface hover:bg-surface-subtle text-ink font-semibold transition-colors cursor-pointer text-xs disabled:opacity-50">
                    {isLoadingMore ? 'Memuat...' : `+ Muat ${Math.min(BATCH_SIZE, total - tableUnits.length)} Lagi`}
                  </button>
                ) : (
                  total > BATCH_SIZE && (
                    <span className="text-[11px] text-ink-muted font-normal">
                      Menampilkan seluruh {total} master lokus
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* === BULK MODAL === */}
      <FormModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        maxWidth="xl"
        zIndex="z-[250]"
        noBodyPadding
        icon={<Users className="w-4.5 h-4.5" />}
        title="Kelola Master Lokus Massal"
        description="Tambah, ubah, atau hapus banyak unit lokus sekaligus."
        subHeader={
          <AdminTabs
            items={[
              { id: 'insert', label: 'Tambah Massal' },
              { id: 'edit', label: 'Edit Massal', count: dirtyEditIds.length > 0 ? dirtyEditIds.length : undefined },
              { id: 'delete', label: 'Hapus Massal', count: initialUnits.length }
            ]}
            activeId={bulkTab}
            onChange={(tab) => handleTabChange(tab as 'insert' | 'edit' | 'delete')}
            className="px-6 pt-3 bg-surface-subtle"
            bordered={true}
          />
        }
        footer={
          <>
            {bulkTab === 'insert' ? (
              <span className="text-[11px] font-mono text-ink-muted">
                {bulkEntries.length} nama siap ditambahkan
              </span>
            ) : bulkTab === 'edit' ? (
              <span className="text-[11px] font-mono text-ink-muted">
                <strong className="text-brand font-bold">{dirtyEditIds.length}</strong> dari {initialUnits.length} lokus diubah
              </span>
            ) : (
              <span className="text-[11px] font-mono text-ink-muted">
                Terpilih: <strong className="text-ink font-bold">{selectedIds.length}</strong> dari {filteredUnits.length} lokus
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkOpen(false)}
                disabled={bulkLoading}>
                Batal
              </Button>
              {bulkTab === 'insert' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleBulkInsert}
                  disabled={bulkEntries.length === 0 || bulkLoading}
                  isLoading={bulkLoading}>
                  Tambahkan ({bulkEntries.length})
                </Button>
              ) : bulkTab === 'edit' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveBulkEdit}
                  disabled={dirtyEditIds.length === 0 || bulkLoading}
                  isLoading={bulkLoading}
                  leftIcon={<Save className="w-3.5 h-3.5" />}>
                  Simpan Perubahan ({dirtyEditIds.length})
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  disabled={selectedIds.length === 0 || bulkLoading}
                  isLoading={bulkLoading}>
                  Hapus Massal ({selectedIds.length})
                </Button>
              )}
            </div>
          </>
        }>
        <div>
          {bulkTab === 'insert' ? (
            <div className="p-6 space-y-4">
              {/* Bulk Insert: Category selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Kategori (berlaku untuk semua)
                </label>
                <select
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-medium text-ink focus:outline-none focus:border-brand bg-card cursor-pointer shadow-2xs">
                  <option value="">- Pilih Kategori -</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Insert: Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Daftar Nama Lokus <span className="font-normal normal-case">(satu nama per baris)</span>
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  placeholder={
                    'Puskesmas Linggang Bigung\nPuskesmas Barong Tongkok\nRSUD Harapan Insan Sendawar\n...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand font-mono resize-none shadow-2xs"
                />
                {bulkEntries.length > 0 && (
                  <p className="text-[11px] text-ink-muted">
                    Preview: <strong className="text-brand font-mono">{bulkEntries.length}</strong> lokus akan
                    ditambahkan
                  </p>
                )}
              </div>
            </div>
          ) : bulkTab === 'edit' ? (
            <>
              {/* Bulk Edit: Search bar */}
              <div className="px-6 py-3 border-b border-line bg-surface-subtle flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type="text"
                    placeholder="Cari lokus untuk diedit..."
                    value={editSearchTerm}
                    onChange={(e) => setEditSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-card border border-line rounded-xl text-xs placeholder:text-ink-faint text-ink focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>
                {dirtyEditIds.length > 0 && (
                  <Badge variant="info" size="sm">
                    {dirtyEditIds.length} diubah
                  </Badge>
                )}
              </div>

              {/* Bulk Edit: Inline edit rows */}
              <div className="divide-y divide-line">
                {filteredEditUnits.map((u) => {
                  const draft = editDrafts[u.id] || { name: u.name, categoryId: u.category?.id || '' }
                  const isDirty = dirtyEditIds.includes(u.id)
                  return (
                    <div key={u.id} className={`px-6 py-3 flex items-center gap-3 transition-colors ${isDirty ? 'bg-pastel-blue/30' : 'hover:bg-surface-subtle'}`}>
                      {/* Dirty indicator */}
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDirty ? 'bg-sky-500' : 'bg-transparent'}`} />

                      {/* Name input */}
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setEditDrafts(prev => ({
                          ...prev,
                          [u.id]: { ...draft, name: e.target.value }
                        }))}
                        className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-medium text-ink focus:outline-none focus:border-brand transition-colors ${
                          isDirty ? 'border-pastel-blue-border bg-card' : 'border-line bg-transparent'
                        }`}
                      />

                      {/* Category dropdown */}
                      <select
                        value={draft.categoryId}
                        onChange={(e) => setEditDrafts(prev => ({
                          ...prev,
                          [u.id]: { ...draft, categoryId: e.target.value }
                        }))}
                        className={`w-36 shrink-0 px-2 py-1.5 rounded-lg border text-xs text-ink focus:outline-none focus:border-brand transition-colors cursor-pointer ${
                          isDirty ? 'border-pastel-blue-border bg-card' : 'border-line bg-transparent'
                        }`}>
                        <option value="">- Kategori -</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      {/* Reset button if dirty */}
                      {isDirty && (
                        <button
                          type="button"
                          onClick={() => setEditDrafts(prev => ({
                            ...prev,
                            [u.id]: { name: u.name, categoryId: u.category?.id || '' }
                          }))}
                          className="text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
                          title="Batalkan perubahan baris ini">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {filteredEditUnits.length === 0 && (
                  <div className="py-12 text-center text-xs text-ink-muted">Tidak ada lokus yang cocok.</div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Bulk Delete: Search + Select All */}
              <div className="px-6 py-3 border-b border-line bg-surface-subtle flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type="text"
                    placeholder="Cari lokus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-card border border-line rounded-xl text-xs placeholder:text-ink-faint text-ink focus:outline-none focus:border-brand shadow-2xs"
                  />
                </div>
                {filteredUnits.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleSelectAll}>
                    {selectedIds.length === filteredUnits.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </Button>
                )}
              </div>

              {/* Bulk Delete: Checklist */}
              <div className="p-6 divide-y divide-line">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((u) => {
                    const isChecked = selectedIds.includes(u.id)
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleUnit(u.id)}
                        className="flex items-center justify-between py-3 px-1 hover:bg-surface-subtle transition-colors cursor-pointer rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-brand w-4 h-4 rounded border-line"
                          />
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-ink">{u.name}</p>
                            <Badge variant="neutral" size="sm">
                              {u.category?.name || 'OPD'}
                            </Badge>
                          </div>
                        </div>
                        {isChecked && (
                          <Badge variant="danger" size="sm">
                            Terpilih
                          </Badge>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-ink-muted">Tidak ada lokus yang cocok.</div>
                )}
              </div>
            </>
          )}
        </div>
      </FormModal>

      {/* Form Modal for Creating Lokus */}
      <FormModal
        isOpen={isFormOpen}
        maxWidth="md"
        icon={<Building2 className="w-5 h-5" />}
        title="Tambah Master Lokus Baru"
        description="Daftarkan unit pelayanan publik baru ke dalam database master."
        onClose={() => setIsFormOpen(false)}>
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Nama Unit / Lokus <span className="text-pastel-rose-text">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Puskesmas Linggang Bigung"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stroke/70 bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 shadow-2xs transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Kategori Pelayanan
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stroke/70 bg-surface text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 shadow-2xs transition-all cursor-pointer appearance-none pr-9">
                <option value="">- Pilih Kategori -</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-ink-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stroke/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}>
              Simpan Lokus
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Form Modal for Editing Lokus */}
      <FormModal
        isOpen={isEditFormOpen}
        maxWidth="md"
        icon={<Pencil className="w-4.5 h-4.5" />}
        title="Edit Master Lokus"
        description={editingUnit?.name ? `Perbarui informasi untuk "${editingUnit.name}".` : "Perbarui detail nama unit pelayanan atau kategori."}
        onClose={() => {
          setIsEditFormOpen(false)
          setEditingUnit(null)
        }}>
        <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Nama Unit / Lokus <span className="text-pastel-rose-text">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Contoh: Puskesmas Linggang Bigung"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stroke/70 bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 shadow-2xs transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">
              Kategori Pelayanan
            </label>
            <div className="relative">
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stroke/70 bg-surface text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 shadow-2xs transition-all cursor-pointer appearance-none pr-9">
                <option value="">- Pilih Kategori -</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-ink-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stroke/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsEditFormOpen(false)
                setEditingUnit(null)
              }}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={loading}
              leftIcon={<Save className="w-3.5 h-3.5" />}>
              Perbarui Lokus
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Confirmation Modal for Creating single Lokus */}
      <ConfirmationModal
        isOpen={confirmOpen}
        title={`Tambahkan Unit "${name}"?`}
        description="Unit lokus ini akan didaftarkan ke Master Lokus dan dapat digunakan untuk tahun penilaian saat ini dan masa depan."
        confirmText="Ya, Tambahkan"
        cancelText="Batal"
        loading={loading}
        onConfirm={handleConfirmCreate}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Confirmation Modal for Deleting single Lokus */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={`Hapus Master Lokus "${deletingUnit?.name}"?`}
        description="Menghapus unit lokus ini akan menghapusnya dari Master Lokus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Master Lokus"
        cancelText="Batal"
        variant="danger"
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeletingUnit(null)
        }}
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        title="Hapus Master Lokus Massal?"
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} lokus dari Master Lokus? Semua data penilaian yang terkait juga akan ikut terhapus permanen.`}
        confirmText="Ya, Hapus Massal"
        cancelText="Batal"
        variant="danger"
        loading={bulkLoading}
        onConfirm={executeBulkDelete}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
      />

      {/* Modal Rincian Binding MenPAN-RB Lintas Tahun */}
      <FormModal
        isOpen={isBindingModalOpen}
        onClose={() => {
          setIsBindingModalOpen(false)
          setBindingModalUnit(null)
        }}
        title={`Rincian Binding MenPAN-RB: ${bindingModalUnit?.name || ''}`}
        description="Master Lokus bersifat permanen. Di bawah ini adalah rincian UUID dan nama evaluasi resmi portal MenPAN-RB yang terikat per tahun penilaian.">
        <div className="space-y-4 pt-1">
          {/* Unit summary badge */}
          <div className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-stroke/50">
            <div>
              <div className="text-xs font-bold text-ink">{bindingModalUnit?.name}</div>
              <div className="text-[10px] text-ink-muted">
                Kategori: {bindingModalUnit?.category?.name || 'Perangkat Daerah'} • ID Master: {bindingModalUnit?.id}
              </div>
            </div>
            <Link
              href="/admin/periode"
              className="px-2.5 py-1 text-[11px] font-semibold text-brand hover:text-brand-hover bg-brand/10 hover:bg-brand/20 rounded-lg transition-colors flex items-center gap-1">
              <span>Buka Periode</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Evaluations table */}
          {(!bindingModalUnit?.evaluations || bindingModalUnit.evaluations.length === 0) ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-stroke/70 rounded-xl">
              <CalendarDays className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-xs font-semibold text-ink">Belum Ada Riwayat Evaluasi</p>
              <p className="text-[11px] text-ink-muted max-w-sm mx-auto">
                Unit ini belum pernah diikutsertakan dalam periode tahun penilaian atau direkonsiliasi dengan portal MenPAN-RB.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/periode"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-2xs">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Daftarkan di Tahun Penilaian</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-stroke/50 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-stroke/40 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-center w-16">Tahun</th>
                    <th className="px-3 py-2">Nama Lokus di MenPAN-RB</th>
                    <th className="px-3 py-2">UUID MenPAN</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke/30">
                  {bindingModalUnit.evaluations.map((ev) => {
                    const isBound = Boolean(ev.menpanEvaluationId)
                    return (
                      <tr key={ev.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="px-3 py-2.5 text-center font-bold tabular-nums text-ink">
                          {ev.year}
                        </td>
                        <td className="px-3 py-2.5">
                          {isBound ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-ink flex items-center gap-1">
                                <span>{ev.menpanEvaluationName || bindingModalUnit.name}</span>
                                {ev.isPriority && (
                                  <span title="Prioritas">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              {ev.menpanFormSheetName && (
                                <div className="text-[10px] text-ink-muted">
                                  {ev.menpanFormSheetName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-ink-muted italic">
                              Belum terikat dengan lokus MenPAN
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-ink-muted">
                          {isBound ? (
                            <span className="bg-surface-subtle px-1.5 py-0.5 rounded border border-stroke/40" title={ev.menpanEvaluationId!}>
                              {ev.menpanEvaluationId!.slice(0, 8)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isBound ? (
                            <Badge variant="success" size="sm">
                              Terikat
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Non-Bind
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/periode/${ev.year}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-ink text-[10px] font-semibold transition-colors"
                              title={`Buka dashboard periode ${ev.year}`}>
                              <span>Periode</span>
                              <ExternalLink className="w-2.5 h-2.5 text-ink-muted" />
                            </Link>
                            {isBound && (
                              <button
                                type="button"
                                disabled={unbindingId === ev.id}
                                onClick={() => handleUnbindEvaluation(ev.id, ev.year)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                title="Lepaskan tautan binding tahun ini">
                                {unbindingId === ev.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Unlink className="w-2.5 h-2.5" />
                                )}
                                <span>Lepas</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-2 flex justify-end border-t border-line">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setIsBindingModalOpen(false)
                setBindingModalUnit(null)
              }}>
              Tutup
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
