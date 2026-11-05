// src/app/contoh-berkas/ContohBerkasClient.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  Copy,
  Check,
  ExternalLink,
  X,
  LayoutGrid,
  List,
  Tag,
  Filter,
  Sparkles,
  Building,
  Clock,
  Settings,
  FolderOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { CuratedContohBerkasItem } from '../../actions/contoh-berkas-actions'

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
      return {
        label: 'PDF',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
        iconBg: 'bg-rose-500/10 text-rose-600',
        icon: FileText
      }
    case 'DOCUMENT':
      return {
        label: 'DOCX',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        iconBg: 'bg-blue-500/10 text-blue-600',
        icon: FileText
      }
    case 'SPREADSHEET':
      return {
        label: 'XLSX',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        iconBg: 'bg-emerald-500/10 text-emerald-600',
        icon: FileSpreadsheet
      }
    case 'IMAGE':
      return {
        label: 'IMG',
        bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
        iconBg: 'bg-purple-500/10 text-purple-600',
        icon: ImageIcon
      }
    default:
      return {
        label: 'FILE',
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
        iconBg: 'bg-slate-500/10 text-slate-600',
        icon: FileCode
      }
  }
}

export function ContohBerkasClient({
  initialItems,
  totalCount,
  categoryCounts,
  fileTypeCounts,
  isAdmin = false
}: {
  initialItems: CuratedContohBerkasItem[]
  totalCount: number
  categoryCounts: Record<string, number>
  fileTypeCounts: Record<string, number>
  isAdmin?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<CuratedContohBerkasItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedFileType, setSelectedFileType] = useState('ALL')
  const [selectedAspect, setSelectedAspect] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [previewItem, setPreviewItem] = useState<CuratedContohBerkasItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic category list from curated items
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => {
      if (it.category) set.add(it.category)
    })
    return Array.from(set)
  }, [items])

  // Dynamic aspect tags from metadata of curated items
  const aspectsInUse = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => {
      const meta = (it.mediaAsset?.metadata as any) || {}
      if (Array.isArray(meta.relatedAspects)) {
        meta.relatedAspects.forEach((a: string) => set.add(a))
      }
    })
    return ['I', 'II', 'III', 'IV', 'V', 'VI'].filter((asp) => set.has(asp))
  }, [items])

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false
      if (selectedFileType !== 'ALL' && item.mediaAsset?.fileType !== selectedFileType) return false

      if (selectedAspect !== 'ALL') {
        const meta = (item.mediaAsset?.metadata as any) || {}
        const aspects = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []
        if (!aspects.includes(selectedAspect)) return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const meta = (item.mediaAsset?.metadata as any) || {}
        const matchesTitle = item.title?.toLowerCase().includes(q)
        const matchesDesc = item.description?.toLowerCase().includes(q)
        const matchesCat = item.category?.toLowerCase().includes(q)
        const matchesFileName = item.mediaAsset?.fileName?.toLowerCase().includes(q)
        const matchesTags = Array.isArray(meta.tags) && meta.tags.some((t: string) => t.toLowerCase().includes(q))
        const matchesSource = meta.source?.toLowerCase().includes(q)
        const matchesAspects = Array.isArray(meta.relatedAspects) && meta.relatedAspects.some((a: string) => a.toLowerCase().includes(q))

        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesFileName && !matchesTags && !matchesSource && !matchesAspects) {
          return false
        }
      }

      return true
    })
  }, [items, selectedCategory, selectedFileType, selectedAspect, search])

  // Total downloads count of curated files
  const totalDownloads = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.mediaAsset?.downloadCount || 0), 0)
  }, [items])

  // Copy download link
  const handleCopyLink = (assetId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/api/media/${assetId}/download`
    navigator.clipboard.writeText(url)
    setCopiedId(assetId)
    toast.success('Tautan unduhan berhasil disalin!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Format &amp; Contoh Berkas PEKPPP"
        description="Kumpulan format dokumen baku, template isian, regulasi resmi, dan panduan bukti dukung yang telah dikurasi oleh Bagian Organisasi untuk seluruh unit lokus pelayanan."
        actions={
          isAdmin ? (
            <Link
              href="/admin/contoh-berkas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-xs">
              <Settings className="w-3.5 h-3.5" />
              <span>Kelola Katalog Berkas (Admin)</span>
            </Link>
          ) : undefined
        }
      />

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4 p-5 rounded-2xl bg-surface border border-line shadow-subtle">
        {/* Search Bar + View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari format berkas, SK, formulir isian, atau kata kunci..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface-subtle rounded-xl border border-line shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-ink shadow-xs border border-line'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="Tampilan Kartu">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface text-ink shadow-xs border border-line'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="Tampilan Tabel">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {dynamicCategories.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Kategori Dokumen:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-brand text-white border-brand font-semibold shadow-xs'
                    : 'bg-surface border-line text-ink-muted hover:text-ink hover:border-brand/40'
                }`}>
                Semua Kategori ({items.length})
              </button>
              {dynamicCategories.map((cat) => {
                const count = items.filter((a) => a.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-brand text-white border-brand font-semibold shadow-xs'
                        : 'bg-surface border-line text-ink-muted hover:text-ink hover:border-brand/40'
                    }`}>
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Format & Optional Aspect Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line text-xs">
          {/* Format Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mr-1">
              Format:
            </span>
            {[
              { id: 'ALL', label: 'Semua Format' },
              { id: 'DOCUMENT', label: 'Word (.docx)' },
              { id: 'PDF', label: 'PDF (.pdf)' },
              { id: 'SPREADSHEET', label: 'Excel (.xlsx)' },
              { id: 'IMAGE', label: 'Gambar' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFileType(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  selectedFileType === f.id
                    ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                    : 'bg-surface border-line text-ink-muted hover:text-ink'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Optional Aspect Tag Filtering (Metadata-based) */}
          {aspectsInUse.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand" />
                Aspek Terkait:
              </span>
              <button
                type="button"
                onClick={() => setSelectedAspect('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  selectedAspect === 'ALL'
                    ? 'bg-brand/10 border-brand/30 text-brand font-semibold'
                    : 'bg-surface border-line text-ink-muted hover:text-ink'
                }`}>
                Semua
              </button>
              {aspectsInUse.map((asp) => (
                <button
                  key={asp}
                  type="button"
                  onClick={() => setSelectedAspect(selectedAspect === asp ? 'ALL' : asp)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                    selectedAspect === asp
                      ? 'bg-brand text-white border-brand font-semibold'
                      : 'bg-surface border-line text-ink-muted hover:text-ink'
                  }`}>
                  Aspek {asp}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Filter Summary & Result Count ── */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <div>
          Menampilkan <span className="font-semibold text-ink">{filteredItems.length}</span> berkas
          {selectedCategory !== 'ALL' && (
            <span> dalam kategori <span className="font-semibold text-ink">&quot;{selectedCategory}&quot;</span></span>
          )}
          {selectedAspect !== 'ALL' && (
            <span> terkait <span className="font-semibold text-ink">Aspek {selectedAspect}</span></span>
          )}
        </div>
        {(search || selectedCategory !== 'ALL' || selectedFileType !== 'ALL' || selectedAspect !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSelectedCategory('ALL')
              setSelectedFileType('ALL')
              setSelectedAspect('ALL')
            }}
            className="text-brand hover:underline font-semibold cursor-pointer">
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* ── Document Cards Grid / Table ── */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-line bg-surface space-y-3">
          <FolderOpen className="w-12 h-12 text-ink-muted/50 mx-auto" />
          <h3 className="text-base font-semibold text-ink">
            {items.length === 0
              ? 'Belum ada contoh berkas yang dikurasi'
              : 'Tidak ada berkas yang cocok'}
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            {items.length === 0
              ? 'Bagian Organisasi belum mempublikasikan format contoh berkas ke katalog ini. Berkas akan tampil setelah dikurasi dari Media Manager.'
              : 'Tidak ditemukan format berkas yang sesuai dengan kriteria pencarian. Coba sesuaikan kata kunci.'}
          </p>
          {items.length === 0 && isAdmin && (
            <Link
              href="/admin/contoh-berkas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-xs">
              <FolderOpen className="w-4 h-4" />
              <span>Pilih Berkas dari Media Manager (Admin)</span>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const badge = getFileTypeBadge(item.mediaAsset?.fileType || 'DOCUMENT')
            const meta = (item.mediaAsset?.metadata as any) || {}
            const related = Array.isArray(meta.relatedAspects) ? meta.relatedAspects : []
            const Icon = badge.icon

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-line bg-surface hover:border-brand/40 hover:shadow-subtle transition-all flex flex-col justify-between gap-4 group">
                <div className="space-y-3">
                  {/* Category Pill + Format Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider truncate">
                      {item.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${badge.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <div className="text-[11px] text-ink-muted font-mono mt-1 flex items-center gap-2">
                        <span className="truncate max-w-[140px]">{item.mediaAsset?.fileName}</span>
                        <span>•</span>
                        <span>{formatBytes(item.mediaAsset?.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description / Petunjuk Penggunaan bagi Lokus */}
                  {item.description && (
                    <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed font-normal bg-surface-subtle/40 p-2.5 rounded-xl border border-line/60">
                      {item.description}
                    </p>
                  )}

                  {/* Metadata Chips: Instansi, Versi & Keterkaitan Aspek */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    {meta.source && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-line">
                        <Building className="w-3 h-3 text-ink-muted" />
                        <span className="truncate max-w-[120px]">{meta.source}</span>
                      </span>
                    )}

                    {meta.version && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-line font-mono">
                        <Clock className="w-3 h-3 text-ink-muted" />
                        <span>{meta.version}</span>
                      </span>
                    )}

                    {related.map((asp: string) => (
                      <span
                        key={asp}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand border border-brand/20">
                        Aspek {asp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                      title="Lihat Pratinjau">
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.mediaAssetId)}
                      className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                      title="Salin Tautan Unduhan">
                      {copiedId === item.mediaAssetId ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <span className="text-[10px] text-ink-muted font-mono pl-1">
                      {item.mediaAsset?.downloadCount || 0}x unduh
                    </span>
                  </div>

                  {/* Primary Download Button */}
                  <a
                    href={`/api/media/${item.mediaAssetId}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-all shadow-xs cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-subtle">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-subtle/60 border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Dokumen Resmi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Sumber / Asal</th>
                <th className="py-3 px-4 text-center">Diunduh</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {filteredItems.map((item) => {
                const badge = getFileTypeBadge(item.mediaAsset?.fileType || 'DOCUMENT')
                const meta = (item.mediaAsset?.metadata as any) || {}
                const Icon = badge.icon

                return (
                  <tr key={item.id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${badge.iconBg} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="font-semibold text-ink hover:text-brand text-left truncate block max-w-md cursor-pointer">
                            {item.title}
                          </button>
                          <span className="text-[11px] text-ink-muted font-mono truncate block max-w-xs">
                            {item.mediaAsset?.fileName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-subtle border border-line">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-muted">
                      {formatBytes(item.mediaAsset?.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-ink-muted">
                      {meta.source || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-ink-muted">
                      {item.mediaAsset?.downloadCount || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer"
                          title="Pratinjau">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/api/media/${item.mediaAssetId}/download`}
                          download
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand text-white text-[11px] font-semibold hover:bg-brand-hover shadow-xs">
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Pratinjau Dokumen ── */}
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
                  <div className="text-xs text-ink-muted font-mono flex items-center gap-2 mt-0.5">
                    <span className="truncate max-w-[200px]">{previewItem.mediaAsset?.fileName}</span>
                    <span>•</span>
                    <span>{formatBytes(previewItem.mediaAsset?.fileSize)}</span>
                    <span>•</span>
                    <span>Kategori: {previewItem.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/media/${previewItem.mediaAssetId}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Dokumen</span>
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
                    title="Pratinjau PDF"
                  />
                ) : previewItem.mediaAsset?.fileType === 'IMAGE' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/media/${previewItem.mediaAssetId}/preview`}
                    alt={previewItem.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow"
                  />
                ) : (
                  <div className="text-center space-y-3 p-8 max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-ink">
                        Format Dokumen ({previewItem.mediaAsset?.fileName.split('.').pop()?.toUpperCase()})
                      </h4>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        Pratinjau langsung di peramban tidak didukung untuk format dokumen kantor ini. Silakan unduh dokumen untuk membuka dan menyunting format menggunakan Microsoft Word atau Excel.
                      </p>
                    </div>
                    {previewItem.description && (
                      <div className="p-3 rounded-xl bg-surface border border-line text-left text-xs text-ink space-y-1">
                        <span className="font-semibold text-brand block">Petunjuk Penggunaan:</span>
                        <p className="text-ink-muted">{previewItem.description}</p>
                      </div>
                    )}
                    <a
                      href={`/api/media/${previewItem.mediaAssetId}/download`}
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-hz-button">
                      <Download className="w-4 h-4" />
                      <span>Unduh Dokumen Sekarang</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
