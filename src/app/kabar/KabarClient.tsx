// src/app/kabar/KabarClient.tsx
'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Newspaper,
  Star,
  Loader2,
  X
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ArticleItem, getPublishedArticlesAction } from '../../actions/article-actions'

function formatDateIndo(dateStr?: string | Date | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

const PAGE_SIZE = 9

export function KabarClient({
  initialArticles,
  initialTotal,
  initialHasMore,
  categoryCounts = {}
}: {
  initialArticles: ArticleItem[]
  initialTotal: number
  initialHasMore: boolean
  categoryCounts: Record<string, number>
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

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Filter change: refetch real dari database page 1
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    let isCancelled = false
    setIsFiltering(true)

    getPublishedArticlesAction({
      page: 1,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      category: selectedCategory
    })
      .then((res) => {
        if (!isCancelled && res.success) {
          setArticles(res.items || [])
          setPage(1)
          setTotal(res.total || 0)
          setHasMore(Boolean(res.hasMore))
        }
      })
      .catch((err) => {
        console.error('Error fetching filtered public articles:', err)
      })
      .finally(() => {
        if (!isCancelled) setIsFiltering(false)
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedSearch, selectedCategory])

  // Real load more next page
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isFiltering) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const res = await getPublishedArticlesAction({
        page: nextPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        category: selectedCategory
      })

      if (res.success && res.items && res.items.length > 0) {
        setArticles((prev) => [...prev, ...res.items])
        setPage(nextPage)
        setTotal(res.total || 0)
        setHasMore(Boolean(res.hasMore))
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more public articles:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, isFiltering, page, debouncedSearch, selectedCategory])

  // IntersectionObserver untuk auto refetch saat scrolling
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

  // Kategori unik
  const categories = useMemo(() => {
    const list = Object.keys(categoryCounts)
    if (list.length > 0) return list
    const set = new Set<string>()
    articles.forEach((a) => set.add(a.category))
    return Array.from(set)
  }, [articles, categoryCounts])

  // Total artikel terhitung
  const totalAllCount = useMemo(() => {
    return Object.values(categoryCounts).reduce((acc, curr) => acc + curr, 0) || total
  }, [categoryCounts, total])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Kabar &amp; Artikel PEKPPP"
        description="Pusat publikasi resmi seputar pemantauan evaluasi pelayanan publik, kiat pemenuhan bukti dukung, inovasi unit lokus, dan informasi terkini di Kabupaten Kutai Barat."
      />

      {/* ── Full-Width Search Bar Tepat di Bawah Judul Halaman ── */}
      <div className="relative w-full">
        <Search className="w-5 h-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari artikel, panduan teknis, inovasi lokus, atau kata kunci..."
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-line bg-surface text-sm sm:text-base text-ink placeholder:text-ink-muted shadow-2xs focus:outline-none focus:border-brand transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded-full hover:bg-surface-subtle transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Categories Filter Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-brand text-white font-medium shadow-xs'
              : 'bg-surface hover:bg-surface-subtle text-ink-muted border border-line shadow-2xs'
          }`}>
          Semua ({totalAllCount})
        </button>
        {categories.map((cat) => {
          const count = categoryCounts[cat] || articles.filter((a) => a.category === cat).length
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand text-white font-medium shadow-xs'
                  : 'bg-surface hover:bg-surface-subtle text-ink-muted border border-line shadow-2xs'
              }`}>
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* ── Article Feed Grid Relative Container ── */}
      <div className="relative">
        {isFiltering && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-xs flex items-center justify-center z-10 min-h-[300px] rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {articles.length === 0 && !isFiltering ? (
          <div className="p-16 text-center space-y-3 rounded-2xl border border-line bg-surface">
            <Newspaper className="w-12 h-12 text-ink-muted mx-auto stroke-[1.3] opacity-40" />
            <h3 className="text-base font-semibold text-ink">Tidak ada artikel yang cocok</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {debouncedSearch
                ? `Tidak menemukan artikel dengan kata kunci "${debouncedSearch}". Silakan coba kata kunci lain.`
                : 'Belum ada artikel yang dipublikasikan dalam kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {articles.map((article) => {
              const coverUrl = article.coverImageAsset?.fileUrl
                ? article.coverImageAsset.fileUrl.startsWith('http') ||
                  article.coverImageAsset.fileUrl.startsWith('/')
                  ? article.coverImageAsset.fileUrl
                  : `/api/media/${article.coverImageAsset.id}/preview`
                : null

              return (
                <article
                  key={article.id}
                  className="flex flex-col rounded-2xl bg-surface border border-line shadow-2xs hover:shadow-subtle hover:border-brand/40 transition-all overflow-hidden group">
                  {/* Container Thumbnail dengan Padding Halus */}
                  <div className="p-2 sm:p-2.5 pb-0">
                    <Link
                      href={`/kabar/${article.slug}`}
                      className="relative aspect-video w-full rounded-xl bg-surface-subtle overflow-hidden block">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand/15 to-surface-subtle flex items-center justify-center text-ink-muted">
                          <Newspaper className="w-10 h-10 stroke-[1.2] opacity-30 text-brand" />
                        </div>
                      )}

                      {/* Pinned Star Icon Badge di Kanan Atas */}
                      {article.isFeatured && (
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-md bg-amber-500 text-white border border-amber-400"
                            style={{
                              backgroundColor: '#F59E0B',
                              color: '#FFFFFF',
                              borderColor: '#FBBF24',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.45)'
                            }}
                            title="Artikel Sorotan">
                            <Star
                              className="w-3 h-3 shrink-0"
                              style={{ fill: '#FFFFFF', stroke: '#FFFFFF', color: '#FFFFFF' }}
                            />
                            <span style={{ color: '#FFFFFF' }}>Sorotan</span>
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateIndo(article.publishedAt || article.createdAt)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{article.readingTime || 2} min baca</span>
                      </div>

                      <h3 className="text-base font-semibold text-ink line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                        <Link href={`/kabar/${article.slug}`}>{article.title}</Link>
                      </h3>

                      {article.excerpt && (
                        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Kategori sebagai hashtag di bawah snippet */}
                      <div className="pt-1">
                        <span
                          onClick={() => setSelectedCategory(article.category)}
                          className="inline-block text-[11px] font-medium text-brand hover:underline cursor-pointer">
                          #{article.category.replace(/\s+/g, '')}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                          {article.authorName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-medium text-ink-muted truncate">
                          {article.authorName}
                        </span>
                      </div>

                      <Link
                        href={`/kabar/${article.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline shrink-0">
                        <span>Baca</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── Auto LoadMore Intersection Observer Anchor & Status Bar ── */}
        <div ref={loadMoreRef} className="pt-10 pb-4 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-xs text-ink-muted py-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Memuat artikel lainnya...</span>
            </div>
          ) : hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              className="text-xs text-brand hover:underline font-semibold py-2">
              Gulir ke bawah atau klik di sini untuk memuat lebih banyak artikel
            </button>
          ) : articles.length > 0 ? (
            <span className="text-xs text-ink-muted">
              Menampilkan {articles.length} dari {total} artikel
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
