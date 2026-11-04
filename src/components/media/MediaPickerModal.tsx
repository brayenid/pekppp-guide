// src/components/media/MediaPickerModal.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Check,
  Eye,
  X,
  Tag,
  Filter,
  Download,
  ExternalLink,
  Sparkles,
  Loader2,
  FolderOpen,
  UploadCloud,
  CheckCircle2,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  MediaAssetItem,
  MediaAssetMetadata,
  getMediaAssetsAction,
  uploadMediaAssetAction
} from '../../actions/media-actions'

export interface MediaPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: MediaAssetItem) => void | Promise<void>
  targetAspect?: string // e.g. "I", "II", etc.
  title?: string
  description?: string
  allowedFileTypes?: string[] // e.g. ['PDF', 'DOCUMENT', 'IMAGE']
  initialTab?: 'browse' | 'upload'
}

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

function cleanTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '')
  const stripped = base.replace(/^\d+[\s_-]*/, '')
  return stripped.replace(/[_-]+/g, ' ').trim() || fileName
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

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  targetAspect,
  title = 'Pilih dari Pustaka Media',
  description = 'Gunakan kembali format dokumen resmi, formulir, atau regulasi yang sudah tersedia di pustaka.',
  allowedFileTypes,
  initialTab = 'browse'
}: MediaPickerModalProps) {
  const [mounted, setMounted] = useState(false)
  const [assets, setAssets] = useState<MediaAssetItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSelecting, setIsSelecting] = useState<string | null>(null)

  // Active Tab ('browse' | 'upload')
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>(initialTab)

  // Filters for browse tab
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [onlyTargetAspect, setOnlyTargetAspect] = useState<boolean>(Boolean(targetAspect))

  // Preview submodal
  const [previewAsset, setPreviewAsset] = useState<MediaAssetItem | null>(null)

  // Direct Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState('Template Dokumen')
  const [uploadCustomCategory, setUploadCustomCategory] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadSource, setUploadSource] = useState('Bagian Organisasi')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadRelatedAspects, setUploadRelatedAspects] = useState<string[]>(
    targetAspect ? [targetAspect] : []
  )
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      if (targetAspect && !uploadRelatedAspects.includes(targetAspect)) {
        setUploadRelatedAspects([targetAspect])
      }
    }
  }, [isOpen, initialTab, targetAspect])

  // Load assets when modal is opened
  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setIsLoading(true)

    getMediaAssetsAction({ limit: 100 })
      .then((res) => {
        if (!cancelled && res.success && res.items) {
          setAssets(res.items)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Escape listener
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewAsset) {
          setPreviewAsset(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, previewAsset, onClose])

  // Dynamic categories
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES)
    assets.forEach((a) => {
      if (a.category) set.add(a.category)
    })
    return Array.from(set)
  }, [assets])

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Allowed file types restriction
      if (allowedFileTypes && allowedFileTypes.length > 0) {
        if (!allowedFileTypes.includes(asset.fileType)) return false
      }

      // Format filter
      if (selectedType !== 'ALL' && asset.fileType !== selectedType) return false

      // Category filter
      if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false

      // Target aspect filter
      if (targetAspect && onlyTargetAspect) {
        const meta = (asset.metadata as MediaAssetMetadata) || {}
        const aspects = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []
        if (!aspects.includes(targetAspect)) return false
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase()
        const meta = (asset.metadata as MediaAssetMetadata) || {}
        const matchesTitle = asset.title?.toLowerCase().includes(q)
        const matchesFile = asset.fileName?.toLowerCase().includes(q)
        const matchesDesc = asset.description?.toLowerCase().includes(q)
        const matchesCat = asset.category?.toLowerCase().includes(q)
        const matchesTags = Array.isArray(meta.tags) && meta.tags.some((t) => t.toLowerCase().includes(q))
        const matchesSource = meta.source?.toLowerCase().includes(q)
        const matchesAspects = Array.isArray(meta.relatedAspects) && meta.relatedAspects.some((a) => a.toLowerCase().includes(q))

        if (!matchesTitle && !matchesFile && !matchesDesc && !matchesCat && !matchesTags && !matchesSource && !matchesAspects) {
          return false
        }
      }

      return true
    })
  }, [assets, search, selectedCategory, selectedType, targetAspect, onlyTargetAspect, allowedFileTypes])

  const handleSelectAsset = async (asset: MediaAssetItem) => {
    try {
      setIsSelecting(asset.id)
      await onSelect(asset)
      onClose()
    } finally {
      setIsSelecting(null)
    }
  }

  // Handle direct file upload right inside the picker
  const handleDirectUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      toast.error('Silakan pilih berkas yang ingin diunggah.')
      return
    }

    const finalCategory =
      uploadCategory === 'CUSTOM' ? uploadCustomCategory.trim() : uploadCategory
    if (!finalCategory) {
      toast.error('Kategori dokumen wajib diisi.')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading(`Mengunggah "${uploadFile.name}" ke Pustaka Media...`)

    try {
      const metadata: MediaAssetMetadata = {
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        relatedAspects: uploadRelatedAspects,
        source: uploadSource.trim() || undefined,
        version: uploadVersion.trim() || undefined
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle.trim() || cleanTitleFromFilename(uploadFile.name))
      formData.append('description', uploadDesc.trim())
      formData.append('category', finalCategory)
      formData.append('metadata', JSON.stringify(metadata))
      formData.append('isPublic', 'true')

      const res = await uploadMediaAssetAction(formData)

      if (res.success && res.asset) {
        toast.success(`Berkas "${res.asset.title}" berhasil diunggah & langsung dipilih!`, { id: toastId })
        // Prepend to local asset list
        setAssets((prev) => [res.asset as MediaAssetItem, ...prev])
        // Reset form
        setUploadFile(null)
        setUploadTitle('')
        setUploadDesc('')
        setUploadTags('')
        // Immediately select the newly created asset
        await onSelect(res.asset as MediaAssetItem)
        onClose()
      } else {
        toast.error(res.error || 'Gagal mengunggah berkas.', { id: toastId })
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah berkas.', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-fade-in-content"
      onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden text-ink relative"
        onClick={(e) => e.stopPropagation()}>
        {/* Header with Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-3.5 border-b border-line bg-surface shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
              {activeTab === 'browse' ? <FolderOpen className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink tracking-tight truncate">
                {activeTab === 'browse' ? title : 'Unggah Berkas Baru ke Media Manager'}
              </h3>
              <p className="text-xs text-ink-muted truncate">
                {activeTab === 'browse'
                  ? description
                  : 'Unggah format dokumen langsung dari komputer dan otomatis gunakan berkas ini.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Tab Switcher Pills */}
            <div className="flex items-center p-1 bg-surface-subtle rounded-xl border border-line text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-surface text-brand shadow-xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                Pustaka Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Langsung</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TAB 1: BROWSE PUSTAKA MEDIA ── */}
        {activeTab === 'browse' ? (
          <>
            {/* Filter Controls Bar */}
            <div className="p-4 sm:px-6 border-b border-line bg-surface-subtle/40 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari berdasarkan judul, nama berkas, tag, atau instansi..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-line bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload Langsung Quick Button */}
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/25 transition-all cursor-pointer shrink-0">
                  <UploadCloud className="w-3.5 h-3.5 text-brand" />
                  <span>Upload Berkas Baru</span>
                </button>

                {/* Smart Aspect Toggle Pill (if targetAspect provided) */}
                {targetAspect && (
                  <button
                    type="button"
                    onClick={() => setOnlyTargetAspect((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 ${
                      onlyTargetAspect
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-surface text-ink-muted border-line hover:border-brand/40'
                    }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Khusus Aspek {targetAspect}</span>
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                      : 'bg-surface border-line text-ink-muted hover:text-ink'
                  }`}>
                  Semua Kategori ({assets.length})
                </button>
                {categories.map((cat) => {
                  const count = assets.filter((a) => a.category === cat).length
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                          : 'bg-surface border-line text-ink-muted hover:text-ink'
                      }`}>
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Asset Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-canvas min-h-[300px]">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-ink-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-brand" />
                  <p className="text-xs">Memuat berkas pustaka...</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-center p-6 border-2 border-dashed border-line rounded-2xl bg-surface/50">
                  <FileCode className="w-10 h-10 text-ink-muted/60" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-ink">Tidak ada berkas yang sesuai</h4>
                    <p className="text-xs text-ink-muted max-w-sm">
                      Dokumen belum ada di pustaka media? Anda dapat mengunggah berkas langsung sekarang.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(search || selectedCategory !== 'ALL' || onlyTargetAspect) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch('')
                          setSelectedCategory('ALL')
                          setOnlyTargetAspect(false)
                        }}>
                        Reset Filter
                      </Button>
                    )}
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => setActiveTab('upload')}
                      leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
                      Upload Berkas Sekarang
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredAssets.map((asset) => {
                    const badge = getFileTypeBadge(asset.fileType)
                    const meta = (asset.metadata as MediaAssetMetadata) || {}
                    const isItemSelecting = isSelecting === asset.id
                    const related = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []

                    return (
                      <div
                        key={asset.id}
                        className="p-4 rounded-xl border border-line bg-surface hover:border-brand/40 hover:shadow-subtle transition-all flex flex-col justify-between gap-3 group">
                        <div className="space-y-2">
                          {/* Top Bar: Category & Format Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider truncate">
                              {asset.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs sm:text-sm font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                            {asset.title}
                          </h4>

                          {/* File Info */}
                          <div className="text-[11px] text-ink-muted flex items-center gap-2 font-mono">
                            <span className="truncate max-w-[180px]">{asset.fileName}</span>
                            <span>•</span>
                            <span>{formatBytes(asset.fileSize)}</span>
                          </div>

                          {/* Description (if any) */}
                          {asset.description && (
                            <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                              {asset.description}
                            </p>
                          )}

                          {/* Related Aspects Pills */}
                          {related.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {related.map((asp) => (
                                <span
                                  key={asp}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    asp === targetAspect
                                      ? 'bg-brand/15 text-brand border border-brand/30'
                                      : 'bg-surface-subtle text-ink-muted border border-line'
                                  }`}>
                                  Aspek {asp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewAsset(asset)}
                            className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink p-1 rounded hover:bg-surface-subtle transition-colors cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Pratinjau</span>
                          </button>

                          <Button
                            type="button"
                            variant="brand"
                            size="sm"
                            disabled={Boolean(isSelecting)}
                            isLoading={isItemSelecting}
                            onClick={() => handleSelectAsset(asset)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}>
                            Pilih Dokumen
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-line bg-surface flex items-center justify-between text-xs text-ink-muted shrink-0">
              <span>Menampilkan {filteredAssets.length} dari {assets.length} berkas pustaka</span>
              <Button variant="outline" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </>
        ) : (
          /* ── TAB 2: UPLOAD BERKAS LANGSUNG ── */
          <form onSubmit={handleDirectUploadSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs bg-canvas">
            {/* File Dropzone */}
            <div className="space-y-1.5">
              <label className="font-semibold text-ink block text-xs">
                Pilih Berkas (.docx, .pdf, .xlsx, gambar) <span className="text-rose-500">*</span>
              </label>
              <div className="p-5 border-2 border-dashed border-line rounded-2xl text-center space-y-2 hover:border-brand transition-colors cursor-pointer relative bg-surface">
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setUploadFile(f)
                      if (!uploadTitle) {
                        setUploadTitle(cleanTitleFromFilename(f.name))
                      }
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-9 h-9 text-brand mx-auto" />
                {uploadFile ? (
                  <div className="font-mono text-ink font-semibold text-xs">
                    {uploadFile.name} ({formatBytes(uploadFile.size)})
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-ink font-semibold">Klik atau seret berkas ke sini</p>
                    <p className="text-[11px] text-ink-muted">Mendukung format Word (.docx), PDF (.pdf), Excel (.xlsx), atau Gambar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-semibold text-ink block text-xs">
                  Judul Berkas Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Format SK Standar Pelayanan & Maklumat 2026"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-ink block text-xs">
                  Kategori Dokumen <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs">
                  {categories.map((cat) => (
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
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-ink block text-xs">
                Petunjuk Penggunaan bagi Lokus (Opsional)
              </label>
              <textarea
                rows={2}
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Petunjuk singkat bagi lokus saat mengisi atau menggunakan template format ini..."
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs"
              />
            </div>

            {/* Metadata Detail Panel */}
            <div className="p-3.5 rounded-xl border border-line bg-surface space-y-3">
              <span className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand" />
                Metadata Tambahan (Opsional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-ink-muted block">Sumber / Instansi Penerbit</label>
                  <input
                    type="text"
                    value={uploadSource}
                    onChange={(e) => setUploadSource(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-ink-muted block">Versi Dokumen</label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="Contoh: Tahun 2026 / v1.0"
                    className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs"
                  />
                </div>
              </div>

              {/* Related Aspects Multi Checkboxes */}
              <div className="space-y-1 pt-1 border-t border-line">
                <label className="text-[11px] text-ink-muted block">Keterkaitan Aspek (Boleh dipilih):</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-0.5">
                  {['I', 'II', 'III', 'IV', 'V', 'VI'].map((asp) => {
                    const isChecked = uploadRelatedAspects.includes(asp)
                    return (
                      <label
                        key={asp}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                            : 'bg-surface border-line text-ink-muted hover:text-ink'
                        }`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUploadRelatedAspects((prev) => [...prev, asp])
                            } else {
                              setUploadRelatedAspects((prev) => prev.filter((a) => a !== asp))
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
            </div>

            {/* Upload Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('browse')}>
                Kembali ke Pustaka
              </Button>
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={isUploading || !uploadFile}
                isLoading={isUploading}
                leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
                {isUploading ? 'Mengunggah...' : 'Unggah & Pilih Berkas Ini'}
              </Button>
            </div>
          </form>
        )}

        {/* Inline Sub-Modal Preview */}
        {previewAsset && (
          <div
            className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewAsset(null)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-3xl w-full h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="text-sm font-semibold text-ink truncate">{previewAsset.title}</h4>
                  <span className="text-xs text-ink-muted font-mono">{previewAsset.fileName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    onClick={() => {
                      const cur = previewAsset
                      setPreviewAsset(null)
                      handleSelectAsset(cur)
                    }}
                    leftIcon={<Check className="w-3.5 h-3.5" />}>
                    Gunakan Dokumen Ini
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(null)}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-surface-subtle p-2 overflow-hidden flex items-center justify-center">
                {previewAsset.fileType === 'PDF' ? (
                  <iframe
                    src={`/api/media/${previewAsset.id}/preview`}
                    className="w-full h-full rounded-xl border border-line bg-white"
                    title="PDF Preview"
                  />
                ) : previewAsset.fileType === 'IMAGE' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/media/${previewAsset.id}/preview`}
                    alt={previewAsset.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow"
                  />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-12 h-12 text-ink-muted mx-auto" />
                    <p className="text-sm font-semibold text-ink">Pratinjau langsung tidak tersedia untuk format ini</p>
                    <p className="text-xs text-ink-muted">Silakan klik &quot;Gunakan Dokumen Ini&quot; atau unduh untuk membukanya secara lokal.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
