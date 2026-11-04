// src/components/admin/ArticleForm.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Globe,
  Share2,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle,
  X,
  Tag,
  Calendar,
  User,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/Button'
import { PageHeader } from '../ui/PageHeader'
import { Breadcrumb } from '../ui/Breadcrumb'
import { TiptapEditor } from '../editor/TiptapEditor'
import { MediaPickerModal } from '../media/MediaPickerModal'
import { MediaAssetItem } from '../../actions/media-actions'
import {
  ArticleItem,
  createArticleAction,
  updateArticleAction
} from '../../actions/article-actions'

const CATEGORY_OPTIONS = [
  'Kabar Kegiatan',
  'Tips & Trik',
  'Inovasi Lokus',
  'Siaran Pers',
  'Panduan Teknis',
  'Regulasi'
]

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function ArticleForm({
  initialArticle
}: {
  initialArticle?: ArticleItem | null
}) {
  const router = useRouter()
  const isEdit = Boolean(initialArticle?.id)

  // Form states
  const [title, setTitle] = useState(initialArticle?.title || '')
  const [slug, setSlug] = useState(initialArticle?.slug || '')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEdit)
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || '')
  const [content, setContent] = useState(initialArticle?.content || '')
  const [category, setCategory] = useState(initialArticle?.category || 'Kabar Kegiatan')
  const [tags, setTags] = useState(initialArticle?.tags || '')
  const [authorName, setAuthorName] = useState(initialArticle?.authorName || 'Bagian Organisasi')
  const [authorRole, setAuthorRole] = useState(
    initialArticle?.authorRole || 'Tim Pembina Pelayanan Publik'
  )
  const [isPublished, setIsPublished] = useState(initialArticle?.isPublished ?? true)
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured ?? false)

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle || '')
  const [seoDescription, setSeoDescription] = useState(initialArticle?.seoDescription || '')

  // Cover Image
  const [coverAsset, setCoverAsset] = useState<MediaAssetItem | null>(
    initialArticle?.coverImageAsset ? (initialArticle.coverImageAsset as any) : null
  )
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false)

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-slug from title if not manually edited
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val))
    }
  }

  // Cover image select
  const handleSelectCover = (asset: MediaAssetItem) => {
    setCoverAsset(asset)
    setIsCoverPickerOpen(false)
    toast.success('Foto sampul berhasil dipilih.')
  }

  // Submit
  const handleSubmit = async (publishState?: boolean) => {
    if (!title.trim()) {
      toast.error('Judul artikel wajib diisi.')
      return
    }
    if (!content.trim() || content === '<p></p>') {
      toast.error('Konten artikel tidak boleh kosong.')
      return
    }

    const targetPublish = publishState !== undefined ? publishState : isPublished

    try {
      setIsSubmitting(true)

      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        excerpt: excerpt.trim() || null,
        content,
        category,
        coverImageAssetId: coverAsset?.id || null,
        tags: tags.trim() || null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        authorName: authorName.trim() || 'Bagian Organisasi',
        authorRole: authorRole.trim() || 'Tim Pembina Pelayanan Publik',
        isPublished: targetPublish,
        isFeatured
      }

      if (isEdit && initialArticle?.id) {
        const res = await updateArticleAction(initialArticle.id, payload)
        if (res.success) {
          toast.success('Artikel berhasil diperbarui!')
          router.push('/admin/artikel')
          router.refresh()
        } else {
          toast.error(res.error || 'Gagal memperbarui artikel.')
        }
      } else {
        const res = await createArticleAction(payload)
        if (res.success) {
          toast.success('Artikel baru berhasil disimpan!')
          router.push('/admin/artikel')
          router.refresh()
        } else {
          toast.error(res.error || 'Gagal menyimpan artikel.')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan artikel.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Computed SEO previews
  const effectiveSeoTitle = seoTitle.trim() || title.trim() || 'Judul Artikel PEKPPP'
  const effectiveSeoDesc =
    seoDescription.trim() ||
    excerpt.trim() ||
    'Baca panduan, regulasi, dan kabar terkini mengenai Evaluasi Kinerja Penyelenggaraan Pelayanan Publik di Kutai Barat.'
  const coverUrl = coverAsset?.fileUrl
    ? coverAsset.fileUrl.startsWith('http') || coverAsset.fileUrl.startsWith('/')
      ? coverAsset.fileUrl
      : `/api/media/${coverAsset.id}/preview`
    : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* ── Breadcrumb Navigation ── */}
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Artikel & Kabar', href: '/admin/artikel' },
          { label: isEdit ? 'Edit Artikel' : 'Tulis Baru' }
        ]}
      />

      {/* ── Page Header ── */}
      <PageHeader
        title={isEdit ? `Edit Artikel: ${initialArticle?.title}` : 'Tulis Artikel & Kabar Baru'}
        description="Lengkapi artikel dengan konten kaya (WYSIWYG), foto dokumentasi, dan optimasi meta tag SEO untuk Google & media sosial."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT 2 COLS: Main Content Area ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Judul & Excerpt */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Judul Artikel <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-ink-muted">{title.length} karakter</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Misal: Sosialisasi Evaluasi Mandiri PEKPPP 2026 Dibuka untuk Seluruh OPD..."
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-surface text-ink text-xs sm:text-sm font-normal placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Slug URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Slug URL Web</span>
                <span className="text-[11px] text-ink-muted">Terisi otomatis dari judul</span>
              </label>
              <div className="flex items-center rounded-xl border border-line bg-surface-subtle/50 px-3 py-1.5 focus-within:border-brand focus-within:bg-surface">
                <span className="text-xs text-ink-muted font-mono select-none">/kabar/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="judul-artikel-anda"
                  className="flex-1 bg-transparent px-1 py-1 text-xs text-ink font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Ringkasan / Excerpt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Ringkasan / Excerpt Singkat</span>
                <span className="text-[11px] text-ink-muted">{excerpt.length} / 250 karakter</span>
              </label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={250}
                placeholder="Tulis ringkasan 1-2 kalimat pengantar artikel ini. Teks ini akan tampil di kartu berita dan meta deskripsi Google."
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-surface text-ink text-xs sm:text-sm placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 2. WYSIWYG Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <span>Isi Konten Artikel <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-ink-muted">
                Mendukung teks kaya, tabel, kutipan, dan foto
              </span>
            </div>

            <TiptapEditor
              value={content}
              onChange={setContent}
              placeholder="Tuliskan isi artikel, panduan, atau berita selengkapnya di sini. Klik 'Sisipkan Gambar' di toolbar atas untuk memasukkan foto..."
            />
          </div>

          {/* 3. SEO & SOCIAL SHARE LIVE PREVIEWS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand" />
                <span>Optimasi &amp; Pratinjau SEO Google</span>
              </label>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                SEO Ready
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-5">
              {/* Custom SEO Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink flex items-center justify-between">
                  <span>Meta Title Kustom (Opsional)</span>
                  <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-500' : 'text-ink-muted'}`}>
                    {seoTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'Default: Judul Artikel'}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink flex items-center justify-between">
                  <span>Meta Description Kustom (Opsional)</span>
                  <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-amber-500' : 'text-ink-muted'}`}>
                    {seoDescription.length}/160
                  </span>
                </label>
                <input
                  type="text"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={excerpt || 'Default: Ringkasan Artikel'}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Google Search Live Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Simulasi Tampilan Google Search:
              </span>
              <div className="p-4 rounded-xl bg-surface-subtle/50 border border-line space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">
                    P
                  </div>
                  <div className="text-[11px] text-ink-muted truncate font-mono">
                    pekppp.kutaibaratkab.go.id &gt; kabar &gt; {slug || 'artikel'}
                  </div>
                </div>
                <h4 className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline cursor-pointer line-clamp-1">
                  {effectiveSeoTitle} - PEKPPP Kutai Barat
                </h4>
                <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                  {effectiveSeoDesc}
                </p>
              </div>
            </div>

            {/* Social Share Card Live Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Simulasi Kartu Media Sosial (WhatsApp / Facebook / Twitter Card):
              </span>
              <div className="max-w-md rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
                {coverUrl ? (
                  <div className="w-full h-40 bg-surface-subtle overflow-hidden">
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center text-ink-muted text-xs">
                    <ImageIcon className="w-6 h-6 opacity-30 mr-2" />
                    Belum ada foto sampul
                  </div>
                )}
                <div className="p-3.5 space-y-1 bg-surface-subtle/30">
                  <span className="text-[10px] font-mono uppercase text-ink-muted">
                    pekppp.kutaibaratkab.go.id
                  </span>
                  <h5 className="text-xs font-semibold text-ink line-clamp-1">
                    {effectiveSeoTitle}
                  </h5>
                  <p className="text-[11px] text-ink-muted line-clamp-2 leading-snug">
                    {effectiveSeoDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT 1 COL: Metadata & Publishing Sidebar ── */}
        <div className="space-y-6">
          {/* 1. Status Publikasi Card */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-4">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Status Publikasi
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 rounded text-brand focus:ring-brand w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-ink block">
                    Publikasikan Langsung
                  </span>
                  <span className="text-[11px] text-ink-muted block leading-snug">
                    Artikel dapat dibaca secara publik di portal kabar.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 rounded text-brand focus:ring-brand w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-ink block">
                    Artikel Sorotan Utama (Featured)
                  </span>
                  <span className="text-[11px] text-ink-muted block leading-snug">
                    Dipasang pada banner hero utama di bagian paling atas.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-line space-y-2">
              <Button
                variant="brand"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={() => handleSubmit()}>
                {isEdit ? 'Perbarui Artikel' : 'Simpan & Publikasikan'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}>
                Simpan sebagai Draf
              </Button>
            </div>
          </div>

          {/* 2. Foto Sampul (Cover Image) */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                Foto Sampul Utama
              </h3>
              {coverAsset && (
                <button
                  type="button"
                  onClick={() => setCoverAsset(null)}
                  className="text-[11px] text-rose-500 hover:underline">
                  Hapus
                </button>
              )}
            </div>

            {coverAsset ? (
              <div className="space-y-2.5">
                <div className="w-full h-36 rounded-xl overflow-hidden border border-line bg-surface-subtle relative group">
                  <img
                    src={coverUrl || ''}
                    alt={coverAsset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCoverPickerOpen(true)}
                      className="px-3 py-1 rounded-full bg-white text-ink text-xs font-semibold shadow-sm hover:bg-white/90">
                      Ganti Foto
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-ink-muted truncate">
                  {coverAsset.title || coverAsset.fileName}
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsCoverPickerOpen(true)}
                className="w-full h-36 rounded-xl border-2 border-dashed border-line hover:border-brand/50 bg-surface-subtle/40 hover:bg-surface-subtle transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-ink-muted text-center p-4">
                <ImageIcon className="w-8 h-8 text-ink-muted stroke-[1.5]" />
                <div className="text-xs font-medium text-ink">Pilih Foto Sampul</div>
                <div className="text-[10px] text-ink-muted leading-tight">
                  Dari Pustaka Media atau upload langsung
                </div>
              </div>
            )}
          </div>

          {/* 3. Kategori & Penulis */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-4">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Kategori &amp; Penulis
            </h3>

            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Kategori Artikel</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-brand">
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Penulis */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Nama Penulis / Instansi</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Bagian Organisasi"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-brand"
              />
            </div>

            {/* Role Penulis */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Jabatan / Peran Penulis</label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Tim Pembina Pelayanan Publik"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-brand"
              />
            </div>

            {/* Tags / Kata Kunci SEO */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink flex items-center justify-between">
                <span>Tags / Kata Kunci SEO</span>
                <span className="text-[10px] text-ink-muted">Pisahkan dengan koma</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="PEKPPP, Pelayanan Publik, Kutai Barat, F-01"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Media Picker untuk Cover Image ── */}
      <MediaPickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={handleSelectCover}
        title="Pilih Foto Sampul Artikel"
        description="Pilih foto horizontal beresolusi baik dari Pustaka Media atau unggah foto dokumentasi baru."
        allowedFileTypes={['IMAGE']}
      />
    </div>
  )
}
