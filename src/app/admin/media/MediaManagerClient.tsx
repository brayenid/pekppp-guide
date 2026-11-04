// src/app/admin/media/MediaManagerClient.tsx
'use client'

import React, { useState, useTransition, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  UploadCloud,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Download,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Check,
  LayoutGrid,
  List,
  ExternalLink,
  X,
  Plus,
  Tag,
  Link2,
  Building,
  Calendar,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import {
  MediaAssetItem,
  MediaAssetMetadata,
  uploadMediaAssetAction,
  syncExistingMediaAction,
  updateMediaAssetAction,
  deleteMediaAssetAction
} from '../../../actions/media-actions'

const DEFAULT_CATEGORIES = [
  'Template Dokumen',
  'Formulir & Format',
  'Pedoman & Juknis',
  'Regulasi & SK',
  'Contoh Eviden',
  'Umum'
]

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getFileTypeBadge(fileType: string) {
  switch (fileType?.toUpperCase()) {
    case 'PDF':
      return { label: 'PDF', bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', icon: FileText }
    case 'DOCUMENT':
      return { label: 'DOCX', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', icon: FileText }
    case 'SPREADSHEET':
      return { label: 'XLSX', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', icon: FileSpreadsheet }
    case 'IMAGE':
      return { label: 'IMG', bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', icon: ImageIcon }
    default:
      return { label: 'FILE', bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20', icon: FileCode }
  }
}

export function MediaManagerClient({
  initialItems,
  totalCount: initialTotalCount,
  categoryCounts: initialCategoryCounts,
  fileTypeCounts: initialFileTypeCounts
}: {
  initialItems: MediaAssetItem[]
  totalCount: number
  categoryCounts: Record<string, number>
  fileTypeCounts: Record<string, number>
}) {
  const [items, setItems] = useState<MediaAssetItem[]>(initialItems)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialItems.length < initialTotalCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isFilterFetching, setIsFilterFetching] = useState(false)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedFileType, setSelectedFileType] = useState('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaAssetItem | null>(null)
  const [previewItem, setPreviewItem] = useState<MediaAssetItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Upload Form State (Agnostik)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('Template Dokumen')
  const [uploadCustomCategory, setUploadCustomCategory] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadRelatedAspects, setUploadRelatedAspects] = useState<string[]>([])
  const [uploadSource, setUploadSource] = useState('Bagian Organisasi')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadIsPublic, setUploadIsPublic] = useState(true)
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false)

  // Escape key listener untuk menutup modal aktif
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUploadOpen) setIsUploadOpen(false)
        if (editingItem) setEditingItem(null)
        if (previewItem) setPreviewItem(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUploadOpen, editingItem, previewItem])

  // List of all dynamic categories present in the system
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES)
    Object.keys(initialCategoryCounts).forEach((cat) => {
      if (cat !== 'ALL') set.add(cat)
    })
    items.forEach((it) => {
      if (it.category) set.add(it.category)
    })
    return Array.from(set)
  }, [items, initialCategoryCounts])

  // Server-Side Real Fetch on Filter / Search Change
  const isFirstMountRef = useRef(true)
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      return
    }

    const timer = setTimeout(async () => {
      setIsFilterFetching(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '18')
        if (search.trim()) params.set('search', search.trim())
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
        if (selectedFileType !== 'ALL') params.set('fileType', selectedFileType)

        const res = await fetch(`/api/admin/media?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setItems(data.items || [])
            setTotalCount(data.totalCount || 0)
            setPage(1)
            setHasMore((data.items?.length || 0) < (data.totalCount || 0))
          }
        }
      } catch (err) {
        console.error('Error fetching filtered media:', err)
      } finally {
        setIsFilterFetching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedFileType])

  // Real Server-Side Load More
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isFilterFetching) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '18')
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      if (selectedFileType !== 'ALL') params.set('fileType', selectedFileType)

      const res = await fetch(`/api/admin/media?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const newBatch: MediaAssetItem[] = data.items || []
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id))
            const filteredNew = newBatch.filter((i) => !seen.has(i.id))
            const updated = [...prev, ...filteredNew]
            setHasMore(updated.length < (data.totalCount || 0))
            return updated
          })
          setPage(nextPage)
          setTotalCount(data.totalCount || 0)
        }
      }
    } catch (err) {
      console.error('Error loading more media assets:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, isLoadingMore, hasMore, isFilterFetching, search, selectedCategory, selectedFileType])

  // IntersectionObserver for Infinite Scroll Auto-Loadmore
  useEffect(() => {
    const el = loadMoreTriggerRef.current
    if (!el || !hasMore || isFilterFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMore()
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isFilterFetching, loadMore])

  // Current items rendered directly from server state
  const filteredItems = items

  // Trigger sync of existing physical files
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await syncExistingMediaAction()
      if (res.success) {
        toast.success(
          `Sinkronisasi selesai! Berhasil memetakan berkas (${res.totalAssets} total aset terdaftar).`
        )
        window.location.reload()
      } else {
        toast.error(res.error || 'Gagal menyinkronkan berkas.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat sinkronisasi.')
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      toast.error('Silakan pilih berkas terlebih dahulu.')
      return
    }

    const finalCategory = uploadCategory === 'CUSTOM' ? uploadCustomCategory.trim() : uploadCategory
    if (!finalCategory) {
      toast.error('Kategori dokumen wajib diisi.')
      return
    }

    setIsSubmittingUpload(true)
    try {
      const metadata: MediaAssetMetadata = {
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        relatedAspects: uploadRelatedAspects,
        source: uploadSource.trim() || undefined,
        version: uploadVersion.trim() || undefined
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle)
      formData.append('description', uploadDesc)
      formData.append('category', finalCategory)
      formData.append('metadata', JSON.stringify(metadata))
      formData.append('isPublic', uploadIsPublic ? 'true' : 'false')

      const res = await uploadMediaAssetAction(formData)
      if (res.success && res.asset) {
        toast.success(`Berkas "${res.asset.title}" berhasil ditambahkan ke pustaka!`)
        setItems((prev) => [res.asset as MediaAssetItem, ...prev])
        setIsUploadOpen(false)
        // Reset form
        setUploadFile(null)
        setUploadTitle('')
        setUploadDesc('')
        setUploadCategory('Template Dokumen')
        setUploadCustomCategory('')
        setUploadTags('')
        setUploadRelatedAspects([])
        setUploadVersion('')
      } else {
        toast.error(res.error || 'Gagal mengunggah berkas.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah.')
    } finally {
      setIsSubmittingUpload(false)
    }
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const res = await updateMediaAssetAction(editingItem.id, {
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        metadata: editingItem.metadata,
        isPublic: editingItem.isPublic
      })

      if (res.success && res.asset) {
        toast.success('Metadata berkas berhasil diperbarui!')
        setItems((prev) =>
          prev.map((it) => (it.id === res.asset.id ? (res.asset as MediaAssetItem) : it))
        )
        setEditingItem(null)
      } else {
        toast.error(res.error || 'Gagal memperbarui berkas.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    }
  }

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const res = await deleteMediaAssetAction(deleteTarget.id, false)
      if (res.success) {
        toast.success(`Berkas "${deleteTarget.title}" dihapus dari katalog.`)
        setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        toast.error(res.error || 'Gagal menghapus berkas.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menghapus.')
    }
  }

  // Copy Download Link
  const handleCopyLink = (assetId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/api/media/${assetId}/download`
    navigator.clipboard.writeText(url)
    setCopiedId(assetId)
    toast.success('Tautan unduhan berhasil disalin!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Media Manager &amp; Pustaka Berkas"
        description="Pusat penyimpanan berkas agnostik: format template dokumen, formulir, dan bukti dukung dengan metadata keterkaitan yang fleksibel."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="!bg-white/15 hover:!bg-white/25 !text-white !border-white/25 shadow-none"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 !text-white ${isSyncing ? 'animate-spin' : ''}`} />}>
              <span className="!text-white">{isSyncing ? 'Memetakan Berkas...' : 'Sinkronisasi Berkas Lama'}</span>
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<UploadCloud className="w-4 h-4" />}>
              Unggah Berkas Baru
            </Button>
          </div>
        }
      />

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block">Total Aset Media</span>
          <div className="text-2xl font-bold font-mono text-ink">{items.length}</div>
          <div className="text-[11px] text-ink-muted">Berkas terdaftar di katalog</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Kategori Terdata</span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {dynamicCategories.length}
          </div>
          <div className="text-[11px] text-ink-muted">Klasifikasi dokumen aktif</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Format Template</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {items.filter((i) => i.category.toLowerCase().includes('template') || i.category.toLowerCase().includes('format')).length}
          </div>
          <div className="text-[11px] text-ink-muted">Siap diunduh oleh lokus</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-brand uppercase tracking-wider block">Total Unduhan</span>
          <div className="text-2xl font-bold font-mono text-brand">
            {items.reduce((sum, it) => sum + (it.downloadCount || 0), 0)}
          </div>
          <div className="text-[11px] text-ink-muted">Frekuensi akses berkas</div>
        </div>
      </div>

      {/* ── Search, Category & Layout Controls ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-4">
        {/* Row 1: Search & Format Dropdown & View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul berkas, nama file, kategori, atau metadata..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-line bg-surface-subtle/50 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Format File Dropdown */}
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-line bg-surface text-ink appearance-none cursor-pointer focus:outline-none focus:border-brand">
              <option value="ALL">Semua Format File</option>
              <option value="DOCUMENT">Word Document (.docx)</option>
              <option value="PDF">Dokumen PDF (.pdf)</option>
              <option value="SPREADSHEET">Excel / Spreadsheet (.xlsx)</option>
              <option value="IMAGE">Gambar &amp; Foto (.jpg, .png)</option>
            </select>

            {/* Toggle View Mode */}
            <div className="flex items-center border border-line rounded-xl p-0.5 bg-surface-subtle/40">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-surface shadow-2xs text-brand font-semibold' : 'text-ink-muted hover:text-ink'
                }`}
                title="Tampilan Grid">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-surface shadow-2xs text-brand font-semibold' : 'text-ink-muted hover:text-ink'
                }`}
                title="Tampilan Tabel">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Pills (Agnostik) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-brand text-white font-semibold shadow-2xs'
                : 'bg-surface-subtle border border-line text-ink-muted hover:text-ink'
            }`}>
            <span>Semua Kategori</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-surface text-ink-muted'
              }`}>
              {totalCount}
            </span>
          </button>

          {dynamicCategories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length
            if (count === 0 && selectedCategory !== cat) return null
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand text-white font-semibold shadow-2xs'
                    : 'bg-surface-subtle border border-line text-ink-muted hover:text-ink'
                }`}>
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface text-ink-muted'
                  }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content View ── */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-line flex items-center justify-center text-ink-muted mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-ink">Tidak ada berkas yang sesuai</h4>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Cobalah sesuaikan kata kunci pencarian atau ganti filter kategori dan format.
            </p>
          </div>
          {items.length === 0 && (
            <div className="pt-2">
              <Button variant="brand" size="sm" onClick={handleSync}>
                Jalankan Sinkronisasi Otomatis Sekarang
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((asset) => {
            const typeCfg = getFileTypeBadge(asset.fileType)
            const TypeIcon = typeCfg.icon
            const meta = asset.metadata || {}
            const tags = Array.isArray(meta.tags) ? meta.tags : []
            const aspects = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []

            return (
              <div
                key={asset.id}
                className="rounded-2xl border border-line bg-surface p-5 shadow-2xs flex flex-col justify-between hover:border-brand/40 transition-all group">
                <div className="space-y-3">
                  {/* Card Header: Type Badge & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono border ${typeCfg.bg}`}>
                      <TypeIcon className="w-3 h-3" />
                      {typeCfg.label}
                    </span>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-subtle border border-line text-ink-muted">
                      {asset.category}
                    </span>
                  </div>

                  {/* Document Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                      {asset.title}
                    </h4>
                    {asset.description && (
                      <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
                        {asset.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Keterkaitan Chips (Tags, Aspek Terkait, Sumber) */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    {/* Related Aspects if present in metadata */}
                    {aspects.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-light text-brand font-medium border border-brand/20">
                        <Link2 className="w-3 h-3" />
                        <span>Terkait Aspek {aspects.join(', ')}</span>
                      </span>
                    )}

                    {/* Source / Instansi if present */}
                    {meta.source && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-line">
                        <Building className="w-3 h-3" />
                        <span>{meta.source}</span>
                      </span>
                    )}

                    {/* Tags */}
                    {tags.slice(0, 3).map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-line">
                        #{tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-ink-muted text-[10px]">+{tags.length - 3}</span>
                    )}
                  </div>

                  {/* Meta Details: File Size & Downloads */}
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted font-mono">
                    <span>{formatBytes(asset.fileSize)}</span>
                    <span>{asset.downloadCount || 0}x diunduh</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-line/60 mt-4 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {(asset.fileType === 'PDF' || asset.fileType === 'IMAGE') && (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(asset)}
                        className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle transition-colors"
                        title="Pratinjau Berkas">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={`/api/media/${asset.id}/download`}
                      download
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle transition-colors inline-flex items-center"
                      title="Unduh Berkas">
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(asset.id)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle transition-colors"
                      title="Salin Tautan API Download">
                      {copiedId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingItem(asset)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                      title="Ubah Metadata &amp; Kategori">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Hapus dari Katalog">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-subtle border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <div className="col-span-1">Format</div>
            <div className="col-span-4">Judul &amp; Dokumen</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2">Metadata Keterkaitan</div>
            <div className="col-span-1 text-right">Ukuran</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          <div className="divide-y divide-line">
            {filteredItems.map((asset) => {
              const typeCfg = getFileTypeBadge(asset.fileType)
              const TypeIcon = typeCfg.icon
              const meta = asset.metadata || {}
              const aspects = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []

              return (
                <div
                  key={asset.id}
                  className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center hover:bg-surface-subtle/40 transition-colors">
                  <div className="sm:col-span-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${typeCfg.bg}`}>
                      <TypeIcon className="w-3 h-3" />
                      {typeCfg.label}
                    </span>
                  </div>

                  <div className="sm:col-span-4 space-y-0.5">
                    <div className="text-xs font-semibold text-ink hover:text-brand transition-colors">
                      {asset.title}
                    </div>
                    <div className="text-[10px] text-ink-muted truncate font-mono">
                      {asset.fileName}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-subtle border border-line text-ink-muted">
                      {asset.category}
                    </span>
                  </div>

                  <div className="sm:col-span-2 text-xs text-ink-muted truncate">
                    {aspects.length > 0 ? (
                      <span className="text-[11px] text-brand font-medium">Aspek {aspects.join(', ')}</span>
                    ) : meta.source ? (
                      <span className="text-[11px]">{meta.source}</span>
                    ) : (
                      <span className="text-[11px] text-ink-muted">-</span>
                    )}
                  </div>

                  <div className="sm:col-span-1 text-left sm:text-right font-mono text-xs text-ink-muted">
                    {formatBytes(asset.fileSize)}
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                    {(asset.fileType === 'PDF' || asset.fileType === 'IMAGE') && (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(asset)}
                        className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle"
                        title="Pratinjau">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={`/api/media/${asset.id}/download`}
                      download
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle"
                      title="Unduh">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(asset.id)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-brand hover:bg-surface-subtle"
                      title="Salin Tautan">
                      {copiedId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(asset)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-ink hover:bg-surface-subtle"
                      title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(asset)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Real Server-Side Infinite Scroll & Bottom Pagination Bar (Tanpa Card Container) ── */}
      {filteredItems.length > 0 && (
        <div className="pt-3 space-y-2">
          {/* Sentinel & Auto Load More Indicator */}
          {hasMore && (
            <div ref={loadMoreTriggerRef} className="py-2.5 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                <span>
                  {isLoadingMore
                    ? 'Memuat berkas media berikutnya dari server...'
                    : 'Memuat berkas media berikutnya secara otomatis...'}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Pagination Summary Bar Tanpa Container Box */}
          <div className="flex items-center justify-between text-xs text-ink-muted flex-wrap gap-2 pt-2 border-t border-line/50">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-ink font-semibold">{items.length}</strong> dari{' '}
                <strong className="text-ink font-semibold">{totalCount}</strong> berkas media
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasMore ? (
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => loadMore()}
                  className="px-3 py-1 rounded-lg border border-line bg-surface hover:bg-surface-subtle text-ink font-semibold transition-colors cursor-pointer text-xs disabled:opacity-50 shadow-2xs">
                  {isLoadingMore ? 'Memuat...' : `+ Muat ${Math.min(18, totalCount - items.length)} Lagi`}
                </button>
              ) : (
                totalCount > 18 && (
                  <span className="text-[11px] text-ink-muted font-normal">
                    Menampilkan seluruh {totalCount} berkas media
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Upload Modal (Agnostik dengan createPortal) ── */}
      {isUploadOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in-content"
            onClick={() => setIsUploadOpen(false)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-base font-semibold text-ink">Unggah Berkas Baru</h3>
                  <p className="text-xs text-ink-muted">Katalog agnostik untuk template, formulir, atau regulasi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-ink-muted hover:text-ink p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                {/* File Dropzone */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-ink block">Pilih Berkas (.docx, .pdf, .xlsx, gambar)</label>
                  <div className="p-4 border-2 border-dashed border-line rounded-xl text-center space-y-2 hover:border-brand transition-colors cursor-pointer relative bg-surface-subtle/30">
                    <input
                      type="file"
                      required
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          setUploadFile(f)
                          if (!uploadTitle) {
                            setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '))
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-8 h-8 text-brand mx-auto" />
                    {uploadFile ? (
                      <div className="font-mono text-ink font-semibold">{uploadFile.name} ({formatBytes(uploadFile.size)})</div>
                    ) : (
                      <div className="text-ink-muted">Klik atau seret berkas ke sini</div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Judul Berkas / Dokumen</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Contoh: Format SK Standar Pelayanan & Maklumat 2026"
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Kategori Dokumen</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand">
                    {dynamicCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Kategori Baru (Ketik Sendiri)...</option>
                  </select>

                  {uploadCategory === 'CUSTOM' && (
                    <input
                      type="text"
                      required
                      value={uploadCustomCategory}
                      onChange={(e) => setUploadCustomCategory(e.target.value)}
                      placeholder="Ketik nama kategori baru..."
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Keterangan / Petunjuk Penggunaan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Petunjuk singkat bagi lokus saat menggunakan template ini..."
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Metadata Keterkaitan (Opsional) */}
                <div className="p-3.5 rounded-xl border border-line bg-surface-subtle/30 space-y-3">
                  <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand" />
                    Metadata &amp; Keterkaitan (Opsional)
                  </span>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-muted block">Tag Pencarian (Dipisahkan Koma)</label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="SK, Maklumat, Format Word, Evaluasi Mandiri"
                      className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  {/* Related Aspects Multi-Checkboxes */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-muted block">Keterkaitan Aspek Evaluasi (Boleh dipilih beberapa / kosong)</label>
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map((asp) => {
                        const isChecked = uploadRelatedAspects.includes(asp)
                        return (
                          <label
                            key={asp}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                                : 'bg-surface border-line text-ink-muted hover:text-ink'
                            }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUploadRelatedAspects([...uploadRelatedAspects, asp])
                                } else {
                                  setUploadRelatedAspects(uploadRelatedAspects.filter((a) => a !== asp))
                                }
                              }}
                              className="rounded border-line text-brand focus:ring-0 w-3 h-3"
                            />
                            <span>Aspek {asp}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-ink-muted block">Sumber / Instansi</label>
                      <input
                        type="text"
                        value={uploadSource}
                        onChange={(e) => setUploadSource(e.target.value)}
                        placeholder="Bagian Organisasi"
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-ink-muted block">Versi Dokumen</label>
                      <input
                        type="text"
                        value={uploadVersion}
                        onChange={(e) => setUploadVersion(e.target.value)}
                        placeholder="Contoh: 2026 / v1.0"
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Public Visibility Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={uploadIsPublic}
                    onChange={(e) => setUploadIsPublic(e.target.checked)}
                    className="rounded border-line text-brand focus:ring-0"
                  />
                  <span className="text-ink">Dapat diunduh secara publik oleh seluruh lokus</span>
                </label>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    disabled={isSubmittingUpload}>
                    {isSubmittingUpload ? 'Mengunggah...' : 'Simpan ke Pustaka'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 2: Edit Metadata Modal (Agnostik dengan createPortal) ── */}
      {editingItem &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in-content"
            onClick={() => setEditingItem(null)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-base font-semibold text-ink">Ubah Metadata Berkas</h3>
                  <p className="text-xs text-ink-muted">Sesuaikan judul, kategori, dan keterkaitan dokumen</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-ink-muted hover:text-ink p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-surface-subtle/50 rounded-xl border border-line text-ink-muted font-mono flex items-center justify-between">
                  <span>Nama Berkas: {editingItem.fileName}</span>
                  <span>{formatBytes(editingItem.fileSize)}</span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Judul Berkas Resmi</label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Kategori</label>
                  <input
                    type="text"
                    required
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    placeholder="Contoh: Template Dokumen, Formulir, Juknis..."
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Keterangan / Petunjuk Penggunaan</label>
                  <textarea
                    rows={2}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Metadata Keterkaitan */}
                <div className="p-3.5 rounded-xl border border-line bg-surface-subtle/30 space-y-3">
                  <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand" />
                    Metadata &amp; Keterkaitan
                  </span>

                  {/* Related Aspects Multi-Checkboxes */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-muted block">Keterkaitan Aspek (Boleh dipilih beberapa / kosong)</label>
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map((asp) => {
                        const curMeta = (editingItem.metadata as MediaAssetMetadata) || {}
                        const curAspects = Array.isArray(curMeta.relatedAspects) ? curMeta.relatedAspects : []
                        const isChecked = curAspects.includes(asp)

                        return (
                          <label
                            key={asp}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                                : 'bg-surface border-line text-ink-muted hover:text-ink'
                            }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...curAspects, asp]
                                  : curAspects.filter((a) => a !== asp)
                                setEditingItem({
                                  ...editingItem,
                                  metadata: {
                                    ...curMeta,
                                    relatedAspects: next
                                  }
                                })
                              }}
                              className="rounded border-line text-brand focus:ring-0 w-3 h-3"
                            />
                            <span>Aspek {asp}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-muted block">Tag Pencarian</label>
                    <input
                      type="text"
                      value={
                        Array.isArray(editingItem.metadata?.tags)
                          ? editingItem.metadata.tags.join(', ')
                          : ''
                      }
                      onChange={(e) => {
                        const curMeta = (editingItem.metadata as MediaAssetMetadata) || {}
                        setEditingItem({
                          ...editingItem,
                          metadata: {
                            ...curMeta,
                            tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                          }
                        })
                      }}
                      placeholder="SK, Maklumat, Format Word"
                      className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-ink-muted block">Sumber / Instansi</label>
                      <input
                        type="text"
                        value={editingItem.metadata?.source || ''}
                        onChange={(e) => {
                          const curMeta = (editingItem.metadata as MediaAssetMetadata) || {}
                          setEditingItem({
                            ...editingItem,
                            metadata: { ...curMeta, source: e.target.value }
                          })
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-ink-muted block">Versi Dokumen</label>
                      <input
                        type="text"
                        value={editingItem.metadata?.version || ''}
                        onChange={(e) => {
                          const curMeta = (editingItem.metadata as MediaAssetMetadata) || {}
                          setEditingItem({
                            ...editingItem,
                            metadata: { ...curMeta, version: e.target.value }
                          })
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Public Visibility Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingItem.isPublic}
                    onChange={(e) => setEditingItem({ ...editingItem, isPublic: e.target.checked })}
                    className="rounded border-line text-brand focus:ring-0"
                  />
                  <span className="text-ink">Dapat diunduh secara publik oleh seluruh lokus</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(null)}>
                    Batal
                  </Button>
                  <Button type="submit" variant="brand" size="sm">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 3: Preview Modal (dengan createPortal) ── */}
      {previewItem &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in-content"
            onClick={() => setPreviewItem(null)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-ink">{previewItem.title}</h3>
                  <span className="text-xs text-ink-muted font-mono">{previewItem.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/media/${previewItem.id}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors">
                    <Download className="w-3.5 h-3.5" /> Unduh
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 text-ink-muted hover:text-ink rounded-lg border border-line">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-surface-subtle p-2 overflow-hidden flex items-center justify-center">
                {previewItem.fileType === 'PDF' ? (
                  <iframe
                    src={`/api/media/${previewItem.id}/preview`}
                    className="w-full h-full rounded-xl border border-line bg-white"
                    title="PDF Preview"
                  />
                ) : previewItem.fileType === 'IMAGE' ? (
                  <img
                    src={`/api/media/${previewItem.id}/preview`}
                    alt={previewItem.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow"
                  />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-12 h-12 text-ink-muted mx-auto" />
                    <p className="text-sm font-semibold text-ink">Pratinjau tidak tersedia untuk tipe berkas ini</p>
                    <p className="text-xs text-ink-muted">Silakan unduh dokumen untuk membukanya secara lokal.</p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── MODAL 4: Delete Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Berkas dari Katalog?"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}" dari Media Manager? Berkas tidak akan lagi tersedia di halaman Contoh Berkas Lokus.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  )
}
