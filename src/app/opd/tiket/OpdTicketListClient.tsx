'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  AlertCircle
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

export function OpdTicketListClient({
  initialData,
  pagination: initialPagination,
  stats
}: {
  initialData: OpdTicketItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  stats: { total: number; open: number; inProgress: number; dispatched: number; resolved: number }
}) {
  const [items, setItems] = useState<OpdTicketItem[]>(initialData)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const fetchTickets = async (page = 1) => {
    setLoading(true)
    try {
      const res = await getOpdTicketsAction({
        page,
        limit: pagination.limit,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        search
      })
      if (res.success && res.items) {
        setItems(res.items as any)
        setPagination(res.pagination)
      } else {
        toast.error(res.error || 'Gagal memuat data.')
      }
    } catch {
      toast.error('Terjadi gangguan saat memuat tiket.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTickets(1)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'DISPATCHED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">Didisposisikan</span>
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400">Ditelaah</span>
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Selesai</span>
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle text-ink-muted">Ditutup</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle text-ink">{status}</span>
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        tag="Unit Lokus"
        title="Tiket & Pengaduan Layanan Unit"
        description="Pantau dan tindak lanjuti laporan, keluhan, atau konsultasi layanan publik yang didisposisikan ke unit kerja Anda."
      />

      {/* ── Metric Summary Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-ink-muted block">Total Laporan Unit</span>
          <span className="text-xl font-bold text-ink">{stats.total}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 block">Menunggu Tindak Lanjut</span>
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.dispatched + stats.open}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">Sedang Ditelaah</span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">Telah Selesai</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-xl bg-surface border border-line shadow-2xs">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode tiket atau uraian laporan..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
            />
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
              <option value="ALL">Semua Status</option>
              <option value="DISPATCHED">Didisposisikan ke Unit</option>
              <option value="IN_PROGRESS">Sedang Ditelaah</option>
              <option value="RESOLVED">Selesai Ditindaklanjuti</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
              <option value="ALL">Semua Prioritas</option>
              <option value="URGENT">Mendesak</option>
              <option value="HIGH">Tinggi</option>
              <option value="MEDIUM">Sedang</option>
              <option value="LOW">Rendah</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center transition-all cursor-pointer">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Filter'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Table Tiket Lokus ── */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Kode Tiket</th>
                <th className="py-3 px-4">Pokok Laporan &amp; Kategori</th>
                <th className="py-3 px-4">Pelapor</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Tanggal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-ink-muted">
                    Tidak ada tiket pengaduan aktif untuk unit kerja Anda.
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-ink whitespace-nowrap">
                      {t.ticketCode}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-ink line-clamp-1">{t.title}</div>
                      <div className="text-[11px] text-ink-muted flex items-center gap-2 mt-0.5">
                        <span>{t.category}</span>
                        {t._count.messages > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-brand">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t._count.messages}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-ink flex items-center gap-1.5">
                        <span>{t.reporterName || 'Anonim'}</span>
                        {t.isAnonymous && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-subtle text-ink-muted border border-line">
                            Anonim
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-ink-muted font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/opd/tiket/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line hover:bg-brand hover:border-brand hover:text-white text-ink text-xs font-medium transition-colors shadow-2xs">
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

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-line flex items-center justify-between text-xs text-ink-muted bg-surface">
            <span>
              Menampilkan {items.length} dari {pagination.total} laporan
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
                className="px-2.5 py-1 rounded border border-line disabled:opacity-40 hover:bg-surface-subtle">
                Sebelumnya
              </button>
              <span className="px-2 font-mono text-ink">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTickets(pagination.page + 1)}
                className="px-2.5 py-1 rounded border border-line disabled:opacity-40 hover:bg-surface-subtle">
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
