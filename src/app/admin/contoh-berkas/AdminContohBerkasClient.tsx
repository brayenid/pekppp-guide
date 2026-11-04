// src/app/admin/contoh-berkas/AdminContohBerkasClient.tsx
'use client'

import React, { useState, useTransition, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Search,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Download,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Plus,
  Tag,
  Building,
  Sparkles,
  FolderOpen,
  UploadCloud,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { MediaPickerModal } from '../../../components/media/MediaPickerModal'
import { MediaAssetItem } from '../../../actions/media-actions'
import {
  CuratedContohBerkasItem,
  addMediaAssetToContohBerkasAction,
  updateContohBerkasAction,
  removeContohBerkasAction
} from '../../../actions/contoh-berkas-actions'

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

export function AdminContohBerkasClient({
  initialItems,
  totalCount,
  categoryCounts,
  fileTypeCounts
}: {
  initialItems: CuratedContohBerkasItem[]
  totalCount: number
  categoryCounts: Record<string, number>
  fileTypeCounts: Record<string, number>
}) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<CuratedContohBerkasItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isPending, startTransition] = useTransition()

  // Modals state
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerInitialTab, setPickerInitialTab] = useState<'browse' | 'upload'>('browse')
  const [editingItem, setEditingItem] = useState<CuratedContohBerkasItem | null>(null)
  const [previewItem, setPreviewItem] = useState<CuratedContohBerkasItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CuratedContohBerkasItem | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic category list
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => {
      if (it.category) set.add(it.category)
    })
    return Array.from(set)
  }, [items])

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesTitle = item.title?.toLowerCase().includes(q)
        const matchesDesc = item.description?.toLowerCase().includes(q)
        const matchesCat = item.category?.toLowerCase().includes(q)
        const matchesFile = item.mediaAsset?.fileName?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesFile) return false
      }
      return true
    })
  }, [items, selectedCategory, search])

  // Handle select from MediaPicker
  const handleSelectFromPicker = async (asset: MediaAssetItem) => {
    const toastId = toast.loading(`Menambahkan "${asset.title}" ke katalog Contoh Berkas...`)
    try {
      const res = await addMediaAssetToContohBerkasAction({
        mediaAssetId: asset.id,
        title: asset.title,
        description: asset.description || '',
        category: asset.category || 'Template Dokumen'
      })

      if (res.success && res.item) {
        toast.success(`"${res.item.title}" berhasil ditambahkan ke katalog Contoh Berkas!`, { id: toastId })
        setItems((prev) => [res.item!, ...prev])
      } else {
        toast.error(res.error || 'Gagal menambahkan berkas.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat menambahkan berkas.', { id: toastId })
    }
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const res = await updateContohBerkasAction(editingItem.id, {
        title: editingItem.title,
        description: editingItem.description || '',
        category: editingItem.category,
        orderIndex: editingItem.orderIndex,
        isActive: editingItem.isActive
      })

      if (res.success && res.item) {
        toast.success('Pengaturan contoh berkas berhasil diperbarui!')
        setItems((prev) =>
          prev.map((it) => (it.id === res.item!.id ? res.item! : it))
        )
        setEditingItem(null)
      } else {
        toast.error(res.error || 'Gagal memperbarui berkas.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    }
  }

  // Handle Toggle Active
  const handleToggleActive = async (item: CuratedContohBerkasItem) => {
    const nextActive = !item.isActive
    try {
      const res = await updateContohBerkasAction(item.id, { isActive: nextActive })
      if (res.success && res.item) {
        toast.success(nextActive ? 'Berkas kini ditampilkan ke lokus.' : 'Berkas disembunyikan dari lokus.')
        setItems((prev) =>
          prev.map((it) => (it.id === res.item!.id ? res.item! : it))
        )
      }
    } catch {
      toast.error('Gagal mengubah status aktif.')
    }
  }

  // Handle Delete / Remove from Curated
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      const res = await removeContohBerkasAction(deleteTarget.id)
      if (res.success) {
        toast.success(`"${deleteTarget.title}" dilepaskan dari katalog Contoh Berkas. Berkas di Media Manager tetap aman.`)
        setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        toast.error(res.error || 'Gagal melepaskan berkas.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat melepaskan berkas.')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pengelolaan Katalog Contoh Berkas"
        description="Kurasi format dokumen baku, template isian, dan regulasi resmi yang diambil dari Pustaka Media untuk disajikan ke seluruh unit lokus pelayanan."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/contoh-berkas"
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 transition-all cursor-pointer box-border shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Lihat Halaman Publik</span>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPickerInitialTab('browse')
                setIsPickerOpen(true)
              }}
              leftIcon={<FolderOpen className="w-4 h-4 text-brand" />}>
              Pilih dari Pustaka
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                setPickerInitialTab('upload')
                setIsPickerOpen(true)
              }}
              leftIcon={<UploadCloud className="w-4 h-4" />}>
              Upload Langsung
            </Button>
          </div>
        }
      />

      {/* ── Metric Summary Bento Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Total Contoh Berkas
          </span>
          <div className="text-2xl font-bold font-mono text-ink">{items.length}</div>
          <div className="text-[11px] text-ink-muted">Dokumen terkurasi untuk lokus</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Status Aktif Publik
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {items.filter((i) => i.isActive).length}
          </div>
          <div className="text-[11px] text-ink-muted">Tampil di halaman lokus</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Kategori Dokumen
          </span>
          <div className="text-2xl font-bold font-mono text-brand">
            {dynamicCategories.length}
          </div>
          <div className="text-[11px] text-ink-muted">Grup format baku</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Pustaka Sumber
          </span>
          <div className="text-sm font-semibold text-ink flex items-center gap-1.5 mt-2">
            <FolderOpen className="w-4 h-4 text-brand" />
            <Link href="/admin/media" className="text-brand hover:underline">
              Buka Media Manager →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-surface border border-line shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari contoh berkas yang terkurasi..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-line bg-surface-subtle/40 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPickerInitialTab('browse')
                setIsPickerOpen(true)
              }}
              leftIcon={<FolderOpen className="w-4 h-4 text-brand" />}>
              Pilih dari Pustaka
            </Button>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => {
                setPickerInitialTab('upload')
                setIsPickerOpen(true)
              }}
              leftIcon={<UploadCloud className="w-4 h-4" />}>
              Upload Langsung
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-line pt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'bg-surface border-line text-ink-muted hover:text-ink'
            }`}>
            Semua ({items.length})
          </button>
          {dynamicCategories.map((cat) => {
            const count = items.filter((a) => a.category === cat).length
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand/10 border-brand/30 text-brand'
                    : 'bg-surface border-line text-ink-muted hover:text-ink'
                }`}>
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Curated Items List ── */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-line bg-surface space-y-3">
          <FolderOpen className="w-12 h-12 text-ink-muted/50 mx-auto" />
          <h3 className="text-base font-semibold text-ink">Belum ada contoh berkas yang dikurasi</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Halaman Contoh Berkas lokus saat ini kosong. Klik tombol di bawah untuk memilih template atau format dokumen resmi dari Pustaka Media.
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPickerInitialTab('browse')
                setIsPickerOpen(true)
              }}
              leftIcon={<FolderOpen className="w-4 h-4 text-brand" />}>
              Pilih dari Pustaka Media
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                setPickerInitialTab('upload')
                setIsPickerOpen(true)
              }}
              leftIcon={<UploadCloud className="w-4 h-4" />}>
              Upload Berkas Langsung
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const badge = getFileTypeBadge(item.mediaAsset?.fileType || 'DOCUMENT')
            const Icon = badge.icon
            const meta = (item.mediaAsset?.metadata as any) || {}

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-line bg-surface hover:border-brand/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Order Index Pill */}
                  <span className="w-7 h-7 rounded-lg bg-surface-subtle border border-line text-xs font-mono font-bold text-ink-muted flex items-center justify-center shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>

                  {/* Format Icon */}
                  <div className={`p-2.5 rounded-xl ${badge.bg} border shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {!item.isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          Disembunyikan (Draft)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-semibold text-ink group-hover:text-brand transition-colors leading-snug">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="text-[11px] text-ink-muted font-mono flex items-center gap-2 pt-0.5">
                      <span className="truncate max-w-[200px]">{item.mediaAsset?.fileName}</span>
                      <span>•</span>
                      <span>{formatBytes(item.mediaAsset?.fileSize)}</span>
                      <span>•</span>
                      <span>{item.mediaAsset?.downloadCount || 0}x diunduh</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-line pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      item.isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-surface-subtle text-ink-muted border-line hover:text-ink'
                    }`}
                    title={item.isActive ? 'Klik untuk sembunyikan dari lokus' : 'Klik untuk tampilkan ke lokus'}>
                    {item.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Publik</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-ink-muted" />
                        <span>Draft</span>
                      </>
                    )}
                  </button>

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-subtle border border-line cursor-pointer"
                    title="Pratinjau Berkas">
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="p-2 rounded-xl text-ink-muted hover:text-brand hover:bg-brand/10 border border-line cursor-pointer"
                    title="Ubah Judul & Petunjuk Lokus">
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Remove from Curated List */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 border border-line cursor-pointer"
                    title="Lepaskan dari Contoh Berkas">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL 1: Media Picker (Pilih dari Media Manager) ── */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        initialTab={pickerInitialTab}
        title="Pilih Berkas untuk Halaman Contoh Berkas"
        description="Pilih template, formulir, atau regulasi dari Media Manager yang ingin ditampilkan secara resmi di halaman Contoh Berkas."
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectFromPicker}
      />

      {/* ── MODAL 2: Edit Contoh Berkas Metadata ── */}
      {editingItem &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in-content"
            onClick={() => setEditingItem(null)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-lg w-full p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-base font-semibold text-ink">Sesuaikan Tampilan Contoh Berkas</h3>
                  <p className="text-xs text-ink-muted">Atur judul dan petunjuk penggunaan bagi unit lokus pelayanan</p>
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
                  <span>Berkas Sumber: {editingItem.mediaAsset?.fileName}</span>
                  <span>{formatBytes(editingItem.mediaAsset?.fileSize)}</span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Judul Tampilan bagi Lokus</label>
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
                  <label className="font-semibold text-ink block">Kategori Tampilan</label>
                  <input
                    type="text"
                    required
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    placeholder="Contoh: Template Dokumen, Formulir &amp; Format..."
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Petunjuk Penggunaan bagi Lokus</label>
                  <textarea
                    rows={3}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Contoh: Format ini disesuaikan dengan kop surat unit kerja, ditandatangani kepala dinas, dan dilampirkan pada F01."
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Order Index */}
                <div className="space-y-1">
                  <label className="font-semibold text-ink block">Nomor Urutan Tampilan</label>
                  <input
                    type="number"
                    value={editingItem.orderIndex}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, orderIndex: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="rounded border-line text-brand focus:ring-0"
                  />
                  <span className="text-ink font-medium">Tampilkan dokumen ini ke lokus (Status Aktif)</span>
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

      {/* ── MODAL 3: Preview Modal ── */}
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
                <div className="min-w-0 pr-3">
                  <h3 className="text-sm font-semibold text-ink truncate">{previewItem.title}</h3>
                  <span className="text-xs text-ink-muted font-mono truncate block">
                    {previewItem.mediaAsset?.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/media/${previewItem.mediaAssetId}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover">
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
                {previewItem.mediaAsset?.fileType === 'PDF' ? (
                  <iframe
                    src={`/api/media/${previewItem.mediaAssetId}/preview`}
                    className="w-full h-full rounded-xl border border-line bg-white"
                    title="PDF Preview"
                  />
                ) : previewItem.mediaAsset?.fileType === 'IMAGE' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/media/${previewItem.mediaAssetId}/preview`}
                    alt={previewItem.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow"
                  />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-12 h-12 text-ink-muted mx-auto" />
                    <p className="text-sm font-semibold text-ink">
                      Format {previewItem.mediaAsset?.fileName.split('.').pop()?.toUpperCase()}
                    </p>
                    <p className="text-xs text-ink-muted">Unduh berkas untuk membukanya di aplikasi lokal.</p>
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
        title="Lepaskan dari Contoh Berkas?"
        description={`Apakah Anda yakin ingin melepaskan "${deleteTarget?.title}" dari katalog Contoh Berkas lokus? Berkas fisik di Media Manager akan tetap tersimpan aman.`}
        confirmText="Ya, Lepaskan"
        variant="danger"
      />
    </div>
  )
}
