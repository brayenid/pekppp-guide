'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react'

export interface LeaderboardEvaluationItem {
  id: string
  year: number
  percentage: number
  isFinished: boolean
  f02Pct: number
  f03Pct: number
  hasF03: boolean
  isF03Qualified: boolean
  finalPct: number
  finalScale5: number
  unit: {
    name: string
    category: {
      name: string
    } | null
  }
}

const GRADE_CONFIG: Record<
  string,
  { label: string; badgeVariant: 'success' | 'info' | 'neutral' | 'warning' | 'danger' }
> = {
  A: { label: 'Sangat Baik', badgeVariant: 'success' },
  B: { label: 'Baik', badgeVariant: 'info' },
  C: { label: 'Cukup', badgeVariant: 'neutral' },
  D: { label: 'Kurang', badgeVariant: 'warning' },
  E: { label: 'Sangat Kurang', badgeVariant: 'danger' },
  F: { label: 'Tidak Ada Data', badgeVariant: 'neutral' }
}

function getGrade(pct: number) {
  if (pct >= 90) return 'A'
  if (pct >= 75) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 45) return 'D'
  if (pct > 0) return 'E'
  return 'F'
}

const PAGE_SIZE = 15

export function HasilLeaderboardClient({
  initialEvaluations,
  totalCount,
  year
}: {
  initialEvaluations: LeaderboardEvaluationItem[]
  totalCount: number
  year: number
}) {
  const [items, setItems] = useState<LeaderboardEvaluationItem[]>(initialEvaluations)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(initialEvaluations.length < totalCount)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset saat tahun penilaian berganti
  useEffect(() => {
    setItems(initialEvaluations)
    setPage(1)
    setHasMore(initialEvaluations.length < totalCount)
    setIsLoadingMore(false)
  }, [initialEvaluations, totalCount, year])

  // Refetch nyata dari server API ketika scroll mendekati dasar
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const res = await fetch(`/api/hasil?year=${year}&page=${nextPage}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error('Gagal memuat data evaluasi')

      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setItems((prev) => [...prev, ...data.items])
        setPage(nextPage)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error fetching next page of evaluations:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, page, year])

  // IntersectionObserver untuk auto refetch
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1
      }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  return (
    <div className="rounded-bento border border-stroke/50 bg-surface overflow-hidden shadow-soft-card">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-surface-subtle border-b border-stroke/50 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Unit / Lokus</div>
        <div className="col-span-2">Kategori</div>
        <div className="col-span-2 text-right">Skor IPP Final</div>
        <div className="col-span-3 text-right">Grade &amp; Rincian</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-stroke/40">
        {items.map((ev, idx) => {
          const grade = getGrade(ev.finalPct)
          const cfg = GRADE_CONFIG[grade]
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

          return (
            <div
              key={ev.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-surface-subtle/50 transition-colors animate-fade-in-content">
              <div className="col-span-1 text-sm font-semibold text-ink-muted font-mono">
                {medal ?? <span>{idx + 1}</span>}
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-ink">{ev.unit.name}</span>
                  {ev.isFinished ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Selesai
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Progres
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] font-mono text-ink-muted mt-0.5">Tahun {ev.year}</div>
              </div>

              <div className="col-span-2">
                <Badge variant="neutral" size="sm">
                  {ev.unit.category?.name || '-'}
                </Badge>
              </div>

              <div className="col-span-2 text-right">
                <span className="font-semibold text-sm text-ink font-mono tracking-tight tabular-nums">
                  {ev.finalPct.toFixed(1)}%
                </span>
                <div className="text-[10px] font-mono text-ink-muted tabular-nums">
                  Skala 5: {ev.finalScale5.toFixed(2)}
                </div>
                {ev.hasF03 && (
                  <div className="text-[10px] font-mono text-pastel-blue-text font-semibold">
                    F02: {ev.f02Pct.toFixed(0)}% · F03: {ev.f03Pct.toFixed(0)}%
                  </div>
                )}
              </div>

              <div className="col-span-3 text-right flex items-center justify-end gap-2">
                <Badge variant={cfg.badgeVariant} size="sm">
                  {grade} - {cfg.label}
                </Badge>
                <Link href={`/hasil/${ev.id}`}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
                    Detail
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sentinel & Auto Loadmore State Footer (Refetching from Server) */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="p-4 border-t border-stroke/40 bg-surface-subtle/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span>
              {isLoadingMore
                ? 'Memuat data berikutnya dari server...'
                : `Menampilkan ${items.length} dari ${totalCount} lokus`}
            </span>
          </div>

          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => loadMore()}
            className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer disabled:opacity-50">
            {isLoadingMore ? 'Memuat...' : `Muat lebih banyak (${Math.min(PAGE_SIZE, totalCount - items.length)} tersisa)`}
          </button>
        </div>
      )}

      {/* Footer saat semua data sudah dimuat */}
      {!hasMore && totalCount > PAGE_SIZE && (
        <div className="py-3 px-5 border-t border-stroke/40 bg-surface-subtle/20 text-center text-sm text-ink-muted font-normal">
          Menampilkan seluruh {totalCount} lokus evaluasi
        </div>
      )}
    </div>
  )
}
