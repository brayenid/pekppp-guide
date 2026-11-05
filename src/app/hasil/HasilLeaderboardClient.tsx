'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Loader2 } from 'lucide-react'

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
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
      {/* ── 1. Mobile Card Layout (< sm) ── */}
      <div className="sm:hidden divide-y divide-line">
        {items.map((ev, idx) => {
          const rank = idx + 1
          const grade = getGrade(ev.finalPct)
          const cfg = GRADE_CONFIG[grade]

          return (
            <div key={ev.id} className="p-4 space-y-3 hover:bg-surface-subtle/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-surface-subtle border border-line text-xs font-bold font-mono text-ink flex items-center justify-center shrink-0">
                    {rank}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-ink leading-snug truncate">{ev.unit.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-ink-muted mt-0.5">
                      <span>{ev.unit.category?.name || 'OPD'}</span>
                      <span>•</span>
                      <span>Tahun {ev.year}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={cfg.badgeVariant} size="sm" className="whitespace-nowrap shrink-0">
                  {grade} · {cfg.label}
                </Badge>
              </div>

              <div className="p-3 bg-surface-subtle/50 rounded-xl border border-line flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted block font-medium">Skor Akhir</span>
                  <span className="font-bold text-sm text-ink font-mono">
                    {ev.finalPct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-ink-muted ml-1.5 font-mono">
                    (Skala 5: {ev.finalScale5.toFixed(2)})
                  </span>
                </div>
                <Link href={`/hasil/${ev.id}`}>
                  <Button
                    type="button"
                    variant="brand"
                    size="sm">
                    Rapor Lengkap
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 2. Desktop Table Layout (≥ sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Desktop Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-subtle border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <div className="col-span-1">Peringkat</div>
            <div className="col-span-4">Unit Lokus Layanan</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2 text-right">Skor IPP Final</div>
            <div className="col-span-3 text-right">Predikat &amp; Aksi</div>
          </div>

          {/* Desktop Table Rows */}
          <div className="divide-y divide-line">
            {items.map((ev, idx) => {
              const rank = idx + 1
              const grade = getGrade(ev.finalPct)
              const cfg = GRADE_CONFIG[grade]

              return (
                <div
                  key={ev.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-subtle/40 transition-colors">
                  {/* Col 1: Rank */}
                  <div className="col-span-1">
                    {rank <= 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand/10 text-brand font-bold text-xs font-mono">
                        {rank}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-ink-muted pl-1.5">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Col 2: Unit */}
                  <div className="col-span-4 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-ink">{ev.unit.name}</span>
                      <Badge variant={ev.isFinished ? 'success' : 'neutral'} size="sm">
                        {ev.isFinished ? 'Selesai' : 'Progres'}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">Tahun Penilaian {ev.year}</div>
                  </div>

                  {/* Col 3: Kategori */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-ink-muted bg-surface-subtle border border-line">
                      {ev.unit.category?.name || 'Unit Layanan'}
                    </span>
                  </div>

                  {/* Col 4: Skor IPP Final */}
                  <div className="col-span-2 text-right whitespace-nowrap">
                    <span className="font-bold text-sm text-ink tracking-tight font-mono">
                      {ev.finalPct.toFixed(1)}%
                    </span>
                    <div className="text-[10px] text-ink-muted font-mono">
                      Skala 5: {ev.finalScale5.toFixed(2)}
                    </div>
                    {ev.hasF03 && (
                      <div className="text-[10px] text-brand font-medium font-mono mt-0.5">
                        F02: {ev.f02Pct.toFixed(0)}% · F03: {ev.f03Pct.toFixed(0)}%
                      </div>
                    )}
                  </div>

                  {/* Col 5: Grade & Action */}
                  <div className="col-span-3 text-right flex items-center justify-end gap-2.5 shrink-0">
                    <Badge variant={cfg.badgeVariant} size="sm" className="whitespace-nowrap shrink-0">
                      {grade} · {cfg.label}
                    </Badge>
                    <Link href={`/hasil/${ev.id}`} className="shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="whitespace-nowrap">
                        Rapor
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Auto Loadmore State Footer ── */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="p-4 border-t border-line bg-surface-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            <span>
              {isLoadingMore
                ? 'Memuat data lokus berikutnya...'
                : `Menampilkan ${items.length} dari ${totalCount} lokus`}
            </span>
          </div>

          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => loadMore()}
            className="text-xs font-semibold text-brand hover:underline cursor-pointer disabled:opacity-50">
            {isLoadingMore ? 'Memuat...' : `Muat lebih banyak (${Math.min(PAGE_SIZE, totalCount - items.length)} tersisa)`}
          </button>
        </div>
      )}

      {/* ── Footer when fully loaded ── */}
      {!hasMore && totalCount > PAGE_SIZE && (
        <div className="py-3 px-5 border-t border-line bg-surface-subtle/30 text-center text-xs text-ink-muted">
          Seluruh {totalCount} lokus evaluasi telah dimuat
        </div>
      )}
    </div>
  )
}
