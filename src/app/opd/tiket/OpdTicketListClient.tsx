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
  ExternalLink,
  Plus,
  Paperclip,
  FileText,
  Sparkles
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { FormModal } from '../../../components/ui/FormModal'
import { getOpdTicketsAction, createTicketAction } from '../../../actions/ticket-actions'
import type { UserSession } from '../../../actions/auth-actions'
import { toast } from 'sonner'

export interface UnitItem {
  id: string
  name: string
  code: string | null
  category: { name: string } | null
}

const CATEGORIES = [
  'Konsultasi Teknis & Regulasi/SOP',
  'Kendala Sistem & Portal PEKPPP',
  'Pelayanan Publik & Fasilitas Lokus',
  'Aspirasi & Inovasi Layanan',
  'Lainnya / Umum'
]

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
  initialStats,
  units = [],
  currentUser
}: {
  initialData: OpdTicketItem[]
  initialPagination: { page: number; limit: number; total: number; totalPages: number }
  initialStats: { total: number; open: number; inProgress: number; dispatched: number; resolved: number }
  units?: UnitItem[]
  currentUser?: UserSession | null
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

  // Create Ticket Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createCategory, setCreateCategory] = useState(CATEGORIES[0])
  const [createPriority, setCreatePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [createTargetUnitId, setCreateTargetUnitId] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createContact, setCreateContact] = useState('')
  const [createChannel, setCreateChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP')
  const [createAttachments, setCreateAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const reloadTickets = async () => {
    setIsFiltering(true)
    try {
      const res = await getOpdTicketsAction({
        page: 1,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter
      })
      if (res.success && res.items) {
        setItems(res.items as any)
        setPage(1)
        setTotal(res.pagination.total)
        if (res.stats) setStats(res.stats)
      }
    } catch (err) {
      console.error('Error reloading tickets:', err)
    } finally {
      setIsFiltering(false)
    }
  }

  const resetCreateForm = () => {
    setCreateTitle('')
    setCreateCategory(CATEGORIES[0])
    setCreatePriority('MEDIUM')
    setCreateTargetUnitId('')
    setCreateDescription('')
    setCreateContact('')
    setCreateChannel('WHATSAPP')
    setCreateAttachments([])
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) {
      toast.error('Judul tiket wajib diisi.')
      return
    }
    if (!createDescription.trim()) {
      toast.error('Uraian permasalahan wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', createTitle.trim())
      fd.append('category', createCategory)
      fd.append('priority', createPriority)
      fd.append('targetUnitId', createTargetUnitId.trim())
      fd.append('description', createDescription.trim())
      fd.append('isAnonymous', 'false') // Mode dashboard selalu berakun
      if (createContact.trim()) {
        fd.append('reporterContact', createContact.trim())
        fd.append('contactChannel', createChannel)
      }

      createAttachments.forEach((f) => fd.append('attachments', f))

      const res = await createTicketAction(fd)
      if (res.success) {
        toast.success(`Tiket #${res.ticketCode} berhasil diajukan!`)
        resetCreateForm()
        setIsCreateOpen(false)
        await reloadTickets()
      } else {
        toast.error(res.error || 'Gagal membuat tiket.')
      }
    } catch (err) {
      console.error('Error creating ticket from OPD:', err)
      toast.error('Terjadi gangguan saat membuat tiket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validFiles = newFiles.filter((f) => {
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`Berkas ${f.name} melebihi batas 10MB`)
          return false
        }
        return true
      })
      setCreateAttachments((prev) => [...prev, ...validFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setCreateAttachments((prev) => prev.filter((_, i) => i !== index))
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
        description="Pantau tindak lanjut laporan masyarakat, ajukan permohonan konsultasi teknis, serta kelola kendala standar pelayanan publik unit lokus Anda."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-white text-brand hover:bg-white/90 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0">
            <Plus className="w-4 h-4 text-brand shrink-0" />
            <span>Buat Tiket</span>
          </button>
        }
      />

      <div className="space-y-5">
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
                        {currentUser && t.author?.id === currentUser.id ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 font-semibold">
                            Diajukan Anda
                          </span>
                        ) : t.isAnonymous ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-subtle text-ink-muted border border-line">
                            Anonim
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Berakun
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

    {/* ── Modal Pembuatan Tiket Mode Dashboard OPD ── */}
    <FormModal
      isOpen={isCreateOpen}
      onClose={() => {
        if (!isSubmitting) setIsCreateOpen(false)
      }}
      title="Buat Tiket Layanan &amp; Konsultasi"
      description="Ajukan permohonan pendampingan, konsultasi teknis standar pelayanan, atau laporkan kendala sistem langsung dari akun unit kerja Anda."
      icon={<Plus className="w-5 h-5 text-brand" />}
      maxWidth="2xl">
      <form onSubmit={handleCreateTicket} className="p-5 sm:p-6 space-y-4 text-xs">
        {/* Banner Identitas Pelapor Resmi */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-ink truncate">
                {currentUser?.fullName || 'Akun OPD Terverifikasi'}
              </div>
              <div className="text-[11px] text-ink-muted truncate">
                Tiket terhubung ke unit lokus &amp; mendukung diskusi tindak lanjut interaktif.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            Resmi Unit
          </span>
        </div>

        {/* Judul Tiket */}
        <div className="space-y-1.5">
          <label className="font-semibold text-ink block">
            Judul Tiket / Pokok Bahasan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Contoh: Permohonan asistensi instrumen bukti Kebijakan Pelayanan F-01"
            className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand text-xs transition-colors"
          />
        </div>

        {/* Kategori & Prioritas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="font-semibold text-ink block">
              Kategori Laporan <span className="text-rose-500">*</span>
            </label>
            <select
              value={createCategory}
              onChange={(e) => setCreateCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-ink block">Tingkat Prioritas</label>
            <select
              value={createPriority}
              onChange={(e) => setCreatePriority(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs">
              <option value="LOW">Rendah (Biasa / Pertanyaan Umum)</option>
              <option value="MEDIUM">Sedang (Konsultasi Standar)</option>
              <option value="HIGH">Tinggi (Perlu Segera Ditelaah)</option>
              <option value="URGENT">Mendesak (Kendala Kritis / Batas Waktu)</option>
            </select>
          </div>
        </div>

        {/* Tujuan Disposisi / Sasaran Unit */}
        <div className="space-y-1.5">
          <label className="font-semibold text-ink block">
            Tujuan Disposisi / Unit Sasaran
          </label>
          <select
            value={createTargetUnitId}
            onChange={(e) => setCreateTargetUnitId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs">
            <option value="">
              Tim Pembina / Bagian Organisasi Setdakab (Pusat Kabupaten)
            </option>
            {units.length > 0 && (
              <optgroup label="Unit Lokus Pelayanan Publik">
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code ? `[${u.code}] ` : ''}{u.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="text-[11px] text-ink-muted">
            Pilih Pusat Setdakab untuk konsultasi teknis PEKPPP, atau pilih unit terkait bila pencatatan kendala lokus.
          </p>
        </div>

        {/* Deskripsi Uraian Permasalahan */}
        <div className="space-y-1.5">
          <label className="font-semibold text-ink block">
            Uraian Permasalahan &amp; Kebutuhan <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            placeholder="Jelaskan secara rinci kendala yang dihadapi, pertanyaan regulasi/SOP, atau permohonan asistensi standar pelayanan yang dibutuhkan..."
            className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand text-xs transition-colors resize-y"
          />
        </div>

        {/* Narahubung Opsional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="font-semibold text-ink block">
              Narahubung Petugas Lokus (Opsional)
            </label>
            <input
              type="text"
              value={createContact}
              onChange={(e) => setCreateContact(e.target.value)}
              placeholder="Nomor WhatsApp atau Email aktif untuk konfirmasi cepat"
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-ink block">Kanal Kontak</label>
            <select
              value={createChannel}
              onChange={(e) => setCreateChannel(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-brand text-xs">
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
        </div>

        {/* Unggah Lampiran Berkas Bukti Dukung */}
        <div className="space-y-2 pt-1 border-t border-line">
          <label className="font-semibold text-ink block">
            Lampiran Berkas / Screenshot Bukti Dukung (Opsional)
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface-subtle hover:bg-surface text-ink text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
              <Paperclip className="w-3.5 h-3.5 text-ink-muted" />
              <span>Pilih Berkas</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-ink-muted">
              Mendukung gambar, PDF, dokumen (Maks. 10MB per file)
            </span>
          </div>

          {/* List File Terpilih */}
          {createAttachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {createAttachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-line text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span className="font-medium text-ink truncate">{file.name}</span>
                    <span className="text-ink-muted shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 rounded text-ink-muted hover:text-rose-500 hover:bg-surface transition-colors cursor-pointer shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsCreateOpen(false)}
            className="px-4 py-2 rounded-xl border border-line hover:bg-surface-subtle text-ink font-semibold transition-colors cursor-pointer disabled:opacity-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50">
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengajukan Tiket...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kirim Tiket Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>
    </FormModal>
  </>
)
}