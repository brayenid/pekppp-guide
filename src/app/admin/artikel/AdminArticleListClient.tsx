// src/app/admin/artikel/AdminArticleListClient.tsx
'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  Plus,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  TrendingUp,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  ArticleItem,
  getAdminArticlesAction,
  togglePublishArticleAction,
  deleteArticleAction
} from '../../../actions/article-actions'

function formatDateIndo(dateStr?: string | Date | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(d)
}

const PAGE_SIZE = 10

export function AdminArticleListClient({
  initialArticles,
  initialTotal,
  initialHasMore,
  initialMetrics,
  initialCategories
}: {
  initialArticles: ArticleItem[]
  initialTotal: number
  initialHasMore: boolean
  initialMetrics: {
    totalArticles: number
    totalPublished: number
    totalDraft: number
    totalViews: number
  }
  initialCategories: string[]
}) {
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [metrics, setMetrics] = useState(initialMetrics)
  const [categories, setCategories] = useState<string[]>(initialCategories)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Filter change refetch (reset to page 1)
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    let isCancelled = false
    setIsFiltering(true)

    getAdminArticlesAction({
      page: 1,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      category: selectedCategory,
      status: selectedStatus
    })
      .then((res) => {
        if (!isCancelled && res.success) {
          setArticles(res.items || [])
          setPage(1)
          setTotal(res.total || 0)
          setHasMore(Boolean(res.hasMore))
          if (res.metrics) setMetrics(res.metrics)
          if (res.availableCategories) setCategories(res.availableCategories)
        }
      })
      .catch((err) => {
        console.error('Error filtering articles:', err)
      })
      .finally(() => {
        if (!isCancelled) setIsFiltering(false)
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedSearch, selectedCategory, selectedStatus])

  // Load more next page (Infinite auto loadmore)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isFiltering) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const res = await getAdminArticlesAction({
        page: nextPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        category: selectedCategory,
        status: selectedStatus
      })

      if (res.success && res.items && res.items.length > 0) {
        setArticles((prev) => [...prev, ...res.items])
        setPage(nextPage)
        setTotal(res.total || 0)
        setHasMore(Boolean(res.hasMore))
        if (res.metrics) setMetrics(res.metrics)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more articles:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, isFiltering, page, debouncedSearch, selectedCategory, selectedStatus])

  // IntersectionObserver for auto scroll detection
  useEffect(() => {
    if (!hasMore || isLoadingMore || isFiltering) return
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
  }, [hasMore, isLoadingMore, isFiltering, loadMore])

  // Toggle publish
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      setTogglingId(id)
      const res = await togglePublishArticleAction(id, !currentStatus)
      if (res.success) {
        const nextStatus = res.isPublished ?? !currentStatus
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isPublished: nextStatus } : a))
        )
        if (res.metrics) {
          setMetrics(res.metrics)
        } else {
          setMetrics((prev) => {
            const pubChange = nextStatus ? 1 : -1
            return {
              ...prev,
              totalPublished: Math.max(0, prev.totalPublished + pubChange),
              totalDraft: Math.max(0, prev.totalDraft - pubChange)
            }
          })
        }
        toast.success(
          nextStatus ? 'Artikel berhasil dipublikasikan!' : 'Artikel diubah menjadi draf.'
        )
      } else {
        toast.error(res.error || 'Gagal mengubah status publikasi.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setTogglingId(null)
    }
  }

  // Delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      setIsDeletingId(id)
      const res = await deleteArticleAction(id)
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id))
        setTotal((prev) => Math.max(0, prev - 1))
        if (res.metrics) {
          setMetrics(res.metrics)
        } else {
          setMetrics((prev) => ({
            ...prev,
            totalArticles: Math.max(0, prev.totalArticles - 1)
          }))
        }
        toast.success('Artikel berhasil dihapus.')
      } else {
        toast.error(res.error || 'Gagal menghapus artikel.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus.')
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pengelolaan Artikel & Kabar Berita PEKPPP"
        description="Pusat publikasi berita, panduan praktis, tips evaluasi, dan inovasi pelayanan publik yang teroptimasi SEO untuk menjangkau lokus dan masyarakat."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/kabar"
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 transition-all cursor-pointer box-border shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Lihat Halaman Publik</span>
            </Link>

            <Link href="/admin/artikel/tulis">
              <Button
                variant="brand"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}>
                Tulis Artikel Baru
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Metric Bento Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Total Artikel
          </span>
          <div className="text-2xl font-bold font-mono text-ink">
            {Math.max(0, metrics.totalArticles)}
          </div>
          <div className="text-[11px] text-ink-muted">Artikel terdaftar</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Diterbitkan (Live)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {Math.max(0, metrics.totalPublished)}
          </div>
          <div className="text-[11px] text-ink-muted">Tampil di portal publik</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Draf / Tersimpan
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {Math.max(0, metrics.totalDraft)}
          </div>
          <div className="text-[11px] text-ink-muted">Belum dipublikasikan</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Total Pembaca
          </span>
          <div className="text-2xl font-bold font-mono text-brand flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-brand" />
            <span>{metrics.totalViews}</span>
          </div>
          <div className="text-[11px] text-ink-muted">Kunjungan pembaca publik</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-4 p-5 rounded-2xl bg-surface border border-line shadow-subtle">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan judul, ringkasan, slug, atau tag..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-line bg-surface-subtle/40 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
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
            {/* Status Filter */}
            <div className="flex items-center p-1 rounded-xl bg-surface-subtle border border-line text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'ALL'
                    ? 'bg-surface text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('PUBLISHED')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'PUBLISHED'
                    ? 'bg-surface text-emerald-600 font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                Live
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('DRAFT')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'DRAFT'
                    ? 'bg-surface text-amber-600 font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                Draf
              </button>
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-brand text-white font-medium shadow-xs'
                : 'bg-surface-subtle hover:bg-surface text-ink-muted border border-line'
            }`}>
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand text-white font-medium shadow-xs'
                  : 'bg-surface-subtle hover:bg-surface text-ink-muted border border-line'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table of Articles ── */}
      <div className="rounded-2xl bg-surface border border-line shadow-2xs overflow-hidden relative">
        {isFiltering && (
          <div className="absolute inset-0 bg-surface/60 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        )}

        {articles.length === 0 && !isFiltering ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-ink-muted mx-auto stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-ink">Tidak ada artikel ditemukan</h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              {debouncedSearch
                ? `Tidak ada artikel yang cocok dengan pencarian "${debouncedSearch}".`
                : 'Belum ada artikel yang ditambahkan. Buat artikel pertama Anda untuk mengisi halaman kabar.'}
            </p>
            {!debouncedSearch && (
              <Link href="/admin/artikel/tulis">
                <Button variant="brand" size="sm" className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
                  Tulis Artikel Sekarang
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle/70 border-b border-line text-ink-muted font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Artikel &amp; Ringkasan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Status &amp; Publikasi</th>
                  <th className="py-3 px-4 text-center">Pembaca</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {articles.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-subtle/40 transition-colors group">
                    {/* Judul & Cover */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-3">
                        {item.coverImageAsset?.fileUrl ? (
                          <div className="w-14 h-12 rounded-lg overflow-hidden border border-line shrink-0 bg-surface-subtle">
                            <img
                              src={
                                item.coverImageAsset.fileUrl.startsWith('http') ||
                                item.coverImageAsset.fileUrl.startsWith('/')
                                  ? item.coverImageAsset.fileUrl
                                  : `/api/media/${item.coverImageAsset.id}/preview`
                              }
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-12 rounded-lg border border-line shrink-0 bg-surface-subtle flex items-center justify-center text-ink-muted">
                            <FileText className="w-5 h-5 opacity-40" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                FEATURED
                              </span>
                            )}
                            <h4 className="font-semibold text-ink text-sm hover:text-brand transition-colors line-clamp-1">
                              <Link href={`/admin/artikel/${item.id}/edit`}>{item.title}</Link>
                            </h4>
                          </div>

                          <p className="text-[11px] text-ink-muted line-clamp-1 font-mono">
                            /kabar/{item.slug}
                          </p>

                          {item.excerpt && (
                            <p className="text-[11px] text-ink-secondary line-clamp-1">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand/10 text-brand border border-brand/20">
                        {item.category}
                      </span>
                    </td>

                    {/* Status Publikasi */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(item.id, item.isPublished)}
                          disabled={togglingId === item.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            item.isPublished
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          }`}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          <span>{item.isPublished ? 'Diterbitkan' : 'Draf'}</span>
                        </button>

                        <div className="text-[10px] text-ink-muted">
                          {item.publishedAt
                            ? `Rilis: ${formatDateIndo(item.publishedAt)}`
                            : `Update: ${formatDateIndo(item.updatedAt)}`}
                        </div>
                      </div>
                    </td>

                    {/* View Count */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="font-mono font-semibold text-ink">
                        {item.viewCount || 0}
                      </div>
                      <div className="text-[10px] text-ink-muted">{item.readingTime || 1} min baca</div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.isPublished && (
                          <Link
                            href={`/kabar/${item.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-ink-muted hover:text-brand hover:bg-surface-subtle transition-colors"
                            title="Pratinjau Halaman Publik">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}

                        <Link
                          href={`/admin/artikel/${item.id}/edit`}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                          title="Edit Artikel">
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          disabled={isDeletingId === item.id}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Artikel">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Auto LoadMore Intersection Anchor & Status Bar ── */}
        <div ref={loadMoreRef} className="p-4 border-t border-line text-center bg-surface-subtle/30">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-xs text-ink-muted py-1 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Memuat artikel berikutnya...</span>
            </div>
          ) : hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              className="text-xs text-brand hover:underline font-semibold py-1">
              Gulir ke bawah atau klik di sini untuk memuat lebih banyak artikel
            </button>
          ) : (
            <span className="text-xs text-ink-muted">
              Menampilkan {articles.length} dari {total} artikel
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
