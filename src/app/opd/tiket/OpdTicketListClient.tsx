'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Phone,
  Mail,
  X,
  Loader2,
  Building,
  User,
  ShieldCheck,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { getOpdTicketsAction } from '../../../actions/ticket-actions'
import { toast } from 'sonner'

interface OpdTicketItem {
  id: string
  ticketCode: string
  title: string
  category: string
  priority: string
  status: string
  isAnonymous: boolean
  reporterName: string | null
  reporterContact: string | null
  contactChannel: string | null
  createdAt: Date
  targetUnit: { id: string; name: string } | null
  author: { id: string; fullName: string; email: string } | null
  _count: { messages: number }
}

const PAGE_SIZE = 15

export function OpdTicketListClient({
  initialData,
  initialPagination,
  initialStats
}: {
  initialData: OpdTicketItem[]
  initialPagination: { page: number; limit: number; total: number; totalPages: number }
  initialStats: { total: number; open: number; inProgress: number; dispatched: number; resolved: number }
}) {
  const [items, setItems] = useState<OpdTicketItem[]>(initialData)
  const [page, setPage] = useState(initialPagination.page || 1)
  const [total, setTotal] = useState(initialPagination.total || 0)
  const [stats, setStats] = useState(initialStats)

  // Status Load More & Filter
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  // Filter States
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const hasMore = items.length < total
  const remainingCount = Math.max(0, total - items.length)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Refetch saat filter berubah (Reset ke page 1)
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    let isCancelled = false
    setIsFiltering(true)

    getOpdTicketsAction({
      page: 1,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status: statusFilter,
      priority: priorityFilter,
      category: categoryFilter
    })
      .then((res) => {
        if (!isCancelled && res.success && res.items) {
          setItems(res.items as any)
          setPage(1)
          setTotal(res.pagination.total)
          if (res.stats) setStats(res.stats)
        }
      })
      .catch((err) => {
        console.error('Error filtering tickets:', err)
        toast.error('Gagal memfilter tiket.')
      })
      .finally(() => {
        if (!isCancelled) setIsFiltering(false)
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedSearch, statusFilter, priorityFilter, categoryFilter])

  // Fungsi Paginasi Load More (Murni append data, tanpa gimmick)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || isFiltering) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const res = await getOpdTicketsAction({
        page: nextPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter
      })

      if (res.success && res.items && res.items.length > 0) {
        setItems((prev) => [...prev, ...(res.items as any)])
        setPage(nextPage)
        setTotal(res.pagination.total)
        if (res.stats) setStats(res.stats)
      } else {
        toast.info('Seluruh tiket unit Anda telah dimuat.')
      }
    } catch (err) {
      console.error('Error loading more tickets:', err)
      toast.error('Gagal memuat tiket tambahan.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const resetAllFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
    setCategoryFilter('ALL')
  }

  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    categoryFilter !== 'ALL'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            Didisposisikan
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            Sedang Ditelaah
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Selesai Ditangani
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-subtle text-ink-muted border border-line">
            Ditutup Resmi
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-subtle text-ink border border-line">
            {status}
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Mendesak</span>
          </span>
        )
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Tinggi</span>
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Sedang</span>
          </span>
        )
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Rendah</span>
          </span>
        )
      default:
        return <span className="text-[11px] text-ink-muted">{priority}</span>
    }
  }

  const STATUS_TABS = [
    { key: 'ALL', label: 'Semua Tiket' },
    { key: 'DISPATCHED', label: 'Didisposisi' },
    { key: 'IN_PROGRESS', label: 'Ditelaah' },
    { key: 'RESOLVED', label: 'Selesai' },
    { key: 'CLOSED', label: 'Ditutup' }
  ]

  return (
    <>
      {/* ── Page Header (Sesuai Standar Admin) ── */}
      <PageHeader
        title="Tiket &amp; Pengaduan Layanan Unit"
        description="Pantau dan tindak lanjuti laporan masyarakat, kendala teknis standar pelayanan, serta konsultasi publik yang didisposisikan ke unit kerja lokus Anda."
        actions={
          <Link
            href="/lapor"
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 transition-all cursor-pointer shrink-0">
            <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Lihat Portal Lapor Publik</span>
          </Link>
        }
      />

      <div className="-mt-3.5 sm:-mt-6 lg:-mt-7 space-y-5">
        {/* ── Metric Bento Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Total Laporan Unit
          </span>
          <div className="text-2xl font-bold font-mono text-ink">
            {stats.total}
          </div>
          <div className="text-[11px] text-ink-muted">Tiket masuk ke unit Anda</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Didisposisikan
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {stats.dispatched + stats.open}
          </div>
          <div className="text-[11px] text-ink-muted">Menunggu tindak lanjut</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Sedang Ditelaah
          </span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-ink-muted">Proses penanganan lokus</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Telah Selesai
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-ink-muted">Tuntas ditindaklanjuti</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-3.5 p-5 rounded-2xl bg-surface border border-line shadow-subtle">
        {/* Row 1: Search + Segmented Status Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode tiket, pokok aduan, atau uraian laporan..."
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

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-surface-subtle border border-line text-xs overflow-x-auto shrink-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-surface text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-line text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-w-lg">
            {/* Prioritas Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface-subtle/30 text-xs text-ink focus:outline-none focus:border-brand">
                <option value="ALL">Semua Prioritas</option>
                <option value="URGENT">Mendesak (Urgent)</option>
                <option value="HIGH">Tinggi</option>
                <option value="MEDIUM">Sedang</option>
                <option value="LOW">Rendah</option>
              </select>
            </div>

            {/* Kategori Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface-subtle/30 text-xs text-ink focus:outline-none focus:border-brand">
                <option value="ALL">Semua Kategori</option>
                <option value="Pelayanan Publik & Fasilitas Lokus">Pelayanan Publik & Fasilitas Lokus</option>
                <option value="Konsultasi Teknis & Regulasi/SOP">Konsultasi Teknis & Regulasi/SOP</option>
                <option value="Kendala Sistem & Portal PEKPPP">Kendala Sistem & Portal PEKPPP</option>
                <option value="Aspirasi & Inovasi Layanan">Aspirasi & Inovasi Layanan</option>
                <option value="Lainnya / Umum">Lainnya / Umum</option>
              </select>
            </div>
          </div>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer self-start sm:self-center">
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ── High-Density Data Table ── */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Kode Tiket</th>
                <th className="py-3 px-4 min-w-[240px]">Pokok Laporan &amp; Kategori</th>
                <th className="py-3 px-4">Pelapor</th>
                <th className="py-3 px-3 text-center">Prioritas</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Tanggal Masuk</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isFiltering ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-muted">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand" />
                      <span>Memfilter data tiket...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-ink-muted">
                    Tidak ada tiket laporan yang cocok dengan kriteria pencarian unit Anda.
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    {/* Kode Tiket */}
                    <td className="py-3 px-4 font-mono font-bold text-brand whitespace-nowrap">
                      <Link
                        href={`/opd/tiket/${t.id}`}
                        className="hover:underline">
                        #{t.ticketCode}
                      </Link>
                    </td>

                    {/* Pokok Laporan & Kategori */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink line-clamp-1">{t.title}</div>
                      <div className="text-[11px] text-ink-muted flex items-center gap-2 mt-0.5">
                        <span>{t.category}</span>
                        {t._count.messages > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-brand font-medium">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t._count.messages}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pelapor & Kontak */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-ink flex items-center gap-1.5">
                        <span>{t.reporterName || 'Anonim'}</span>
                        {t.isAnonymous && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-subtle text-ink-muted border border-line">
                            Anonim
                          </span>
                        )}
                      </div>
                      {t.reporterContact && (
                        <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1">
                          {t.contactChannel === 'WHATSAPP' ? (
                            <Phone className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Mail className="w-3 h-3 text-brand" />
                          )}
                          <span className="font-mono">{t.reporterContact}</span>
                        </div>
                      )}
                    </td>

                    {/* Prioritas */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-ink-muted font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/opd/tiket/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line hover:bg-brand hover:border-brand hover:text-white text-ink text-xs font-semibold transition-colors shadow-2xs">
                        <span>Tindak Lanjut</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginasi Load More Tanpa Gimmick ── */}
        <div className="p-4 border-t border-line bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-ink-muted">
            Menampilkan <span className="font-semibold text-ink">{items.length}</span> dari{' '}
            <span className="font-semibold text-ink">{total}</span> total tiket
          </span>

          <div className="flex items-center gap-2">
            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-surface border border-line hover:bg-surface-subtle text-ink font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                    <span>Memuat {Math.min(PAGE_SIZE, remainingCount)} tiket berikutnya...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Muat Lebih Banyak ({remainingCount} tersisa)</span>
                  </>
                )}
              </button>
            ) : total > 0 ? (
              <span className="text-[11px] text-ink-muted italic">
                Semua tiket telah ditampilkan ({total} tiket)
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </>
)
}