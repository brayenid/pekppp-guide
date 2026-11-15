'use client'

import { useState, useTransition } from 'react'
import {
  getActivityLogsAction,
  getActivityLogStatsAction,
  purgeActivityLogsAction
} from '../../../actions/activity-log-actions'
import { ActivityCategory } from '@prisma/client'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { FormModal } from '../../../components/ui/FormModal'
import {
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Clock,
  User,
  Building,
  KeyRound,
  ArrowRightLeft,
  FileEdit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Database
} from 'lucide-react'
import { toast } from 'sonner'

export interface LogItem {
  id: string
  createdAt: string | Date
  userId: string | null
  userName: string
  userRole: string | null
  unitId: string | null
  unitName: string | null
  evaluationId: string | null
  category: ActivityCategory
  action: string
  description: string
  metadata: any
  ipAddress: string | null
  userAgent: string | null
}

export interface LogStats {
  total: number
  todayCount: number
  sevenDaysCount: number
  thirtyDaysCount: number
  oldestDate: string | null
  categoryCounts: Partial<Record<ActivityCategory, number>>
}

function formatWitaDateTime(dateVal: string | Date): string {
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '-'
    return (
      d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Makassar'
      }) + ' WITA'
    )
  } catch {
    return String(dateVal)
  }
}

function formatOldestDate(dateVal: string | Date): string {
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return 'Belum Ada'
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Makassar'
    })
  } catch {
    return String(dateVal)
  }
}

export function ActivityLogClient({
  initialLogs,
  initialTotal,
  initialTotalPages,
  initialCurrentPage,
  initialStats
}: {
  initialLogs: LogItem[]
  initialTotal: number
  initialTotalPages: number
  initialCurrentPage: number
  initialStats: LogStats
}) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs)
  const [total, setTotal] = useState<number>(initialTotal)
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage)
  const [stats, setStats] = useState<LogStats>(initialStats)

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'ALL'>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [isPending, startTransition] = useTransition()

  // Modal Detail State
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  // Modal Retensi Manual State
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false)
  const [retentionDays, setRetentionDays] = useState<number>(90)
  const [retentionCategory, setRetentionCategory] = useState<ActivityCategory | 'ALL'>('ALL')
  const [isPurging, setIsPurging] = useState(false)

  const fetchLogs = (page: number = 1) => {
    startTransition(async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          getActivityLogsAction({
            page,
            pageSize: 20,
            search,
            category: selectedCategory,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }),
          getActivityLogStatsAction()
        ])

        setLogs(logsRes.logs as any)
        setTotal(logsRes.total)
        setTotalPages(logsRes.totalPages)
        setCurrentPage(logsRes.currentPage)
        setStats(statsRes as any)
      } catch (err: any) {
        toast.error('Gagal memuat log aktivitas: ' + (err.message || 'Kesalahan jaringan'))
      }
    })
  }

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    fetchLogs(1)
  }

  const handleResetFilter = () => {
    setSearch('')
    setSelectedCategory('ALL')
    setStartDate('')
    setEndDate('')
    startTransition(async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          getActivityLogsAction({ page: 1, pageSize: 20 }),
          getActivityLogStatsAction()
        ])
        setLogs(logsRes.logs as any)
        setTotal(logsRes.total)
        setTotalPages(logsRes.totalPages)
        setCurrentPage(logsRes.currentPage)
        setStats(statsRes as any)
      } catch {
        toast.error('Gagal mereset filter.')
      }
    })
  }

  const handleExecutePurge = async () => {
    const confirmText = window.confirm(
      `Peringatan Retensi Manual:\n\n` +
        `Anda akan menghapus riwayat aktivitas yang lebih lama dari ${retentionDays} hari.\n` +
        `Data yang terhapus tidak dapat dipulihkan kembali.\n\n` +
        `Apakah Anda yakin ingin melanjutkan?`
    )
    if (!confirmText) return

    setIsPurging(true)
    try {
      const res = await purgeActivityLogsAction({
        olderThanDays: retentionDays,
        category: retentionCategory === 'ALL' ? undefined : retentionCategory
      })

      if (res.success) {
        toast.success(res.message)
        setIsRetentionModalOpen(false)
        fetchLogs(1)
      } else {
        toast.error('Gagal membersihkan log: ' + res.message)
      }
    } catch (err: any) {
      toast.error('Gagal mengeksekusi retensi log: ' + (err.message || 'Kesalahan sistem'))
    } finally {
      setIsPurging(false)
    }
  }

  const getCategoryBadge = (cat: ActivityCategory) => {
    switch (cat) {
      case 'AUTH':
        return {
          label: 'Autentikasi & Login',
          icon: KeyRound,
          style:
            'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
        }
      case 'EVALUATION':
        return {
          label: 'Formulir & Penilaian',
          icon: FileEdit,
          style:
            'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
        }
      case 'SYNC_MENPAN':
        return {
          label: 'Sync MenPAN-RB',
          icon: ArrowRightLeft,
          style:
            'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        }
      case 'USER_MGMT':
        return {
          label: 'Manajemen Akun',
          icon: User,
          style:
            'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
        }
      case 'SYSTEM':
      default:
        return {
          label: 'Sistem & Retensi',
          icon: Settings,
          style:
            'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
        }
    }
  }

  return (
    <div className="w-full pb-12 space-y-6">
      {/* 1. Header Resmi Standar Admin (Judul & Aksi Pindah ke Atas / Top Bar) */}
      <PageHeader
        icon={<ShieldAlert className="w-5 h-5 text-brand" />}
        title="Log Aktivitas & Audit Trail"
        description="Jejak audit seluruh perubahan formulir, penilaian evaluator, sinkronisasi MenPAN-RB, dan akun pengguna."
        speedDialItems={[
          {
            label: 'Kelola Retensi Log',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => setIsRetentionModalOpen(true),
            variant: 'danger'
          },
          {
            label: 'Segarkan Log',
            icon: <RefreshCw className="w-4 h-4" />,
            onClick: () => fetchLogs(currentPage),
            variant: 'secondary'
          }
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fetchLogs(currentPage)}
              disabled={isPending}
              isLoading={isPending}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-ink-muted" />}>
              Segarkan
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsRetentionModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              Kelola Retensi Log
            </Button>
          </div>
        }
      />

      {/* 2. Reusable StatCard Grid (Konsisten dengan Periode, Peserta, dan Dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Log Tersimpan"
          value={stats.total.toLocaleString('id-ID')}
          icon={<Database className="w-4 h-4 text-brand" />}
          sublabel="Entri tercatat di database"
        />

        <StatCard
          label="Hari Ini"
          value={stats.todayCount.toLocaleString('id-ID')}
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          sublabel="Aktivitas dalam 24 jam"
          valueClassName="text-emerald-700 dark:text-emerald-400"
        />

        <StatCard
          label="7 Hari Terakhir"
          value={stats.sevenDaysCount.toLocaleString('id-ID')}
          icon={<Calendar className="w-4 h-4 text-blue-600" />}
          sublabel="Aktivitas minggu ini"
          valueClassName="text-blue-700 dark:text-blue-400"
        />

        <StatCard
          label="Log Terlama"
          value={stats.oldestDate ? formatOldestDate(stats.oldestDate) : 'Belum Ada'}
          icon={<Layers className="w-4 h-4 text-amber-600" />}
          sublabel={stats.oldestDate ? formatWitaDateTime(stats.oldestDate) : 'Log masih kosong'}
        />
      </div>

      {/* 3. Reusable Card untuk Filter Toolbar */}
      <Card padding="sm" className="space-y-3">
        <form onSubmit={handleApplyFilter} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pencarian Teks */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari deskripsi, pelaku, atau lokus..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium"
              />
            </div>

            {/* Filter Kategori */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium">
                <option value="ALL">Semua Kategori Aktivitas</option>
                <option value="AUTH">Autentikasi &amp; Login</option>
                <option value="EVALUATION">Formulir (F01/F02/F03) &amp; Penilaian</option>
                <option value="SYNC_MENPAN">Sinkronisasi MenPAN-RB</option>
                <option value="USER_MGMT">Manajemen Akun &amp; Hak Akses</option>
                <option value="SYSTEM">Sistem &amp; Retensi</option>
              </select>
            </div>

            {/* Filter Tanggal Mulai */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium"
                title="Tanggal Mulai"
              />
            </div>

            {/* Filter Tanggal Selesai */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium"
                title="Tanggal Selesai"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-ink-muted font-medium">
              Menampilkan <span className="font-bold text-ink">{logs.length}</span> dari{' '}
              <span className="font-bold text-ink">{total}</span> aktivitas
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}>
                Reset
              </Button>

              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={isPending}
                isLoading={isPending}
                leftIcon={<Filter className="w-3.5 h-3.5" />}>
                Terapkan Filter
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 4. Reusable Card untuk Tabel Log Aktivitas */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink divide-y divide-stroke/50">
            <thead className="bg-surface-subtle/70 text-ink-muted font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WITA)</th>
                <th className="py-3 px-4">Pelaku / Aktor</th>
                <th className="py-3 px-4">Kategori &amp; Aksi</th>
                <th className="py-3 px-4">Lokus / Target</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke/40">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    <ShieldAlert className="w-8 h-8 text-ink-muted/50 mx-auto mb-2" />
                    <p className="font-medium text-xs">Belum ada riwayat aktivitas yang sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getCategoryBadge(log.category)
                  const BadgeIcon = badge.icon
                  return (
                    <tr key={log.id} className="hover:bg-surface-subtle/50 transition-colors">
                      {/* Waktu */}
                      <td className="py-3 px-4 whitespace-nowrap text-ink-secondary font-mono text-[11px]">
                        {formatWitaDateTime(log.createdAt)}
                      </td>

                      {/* Pelaku */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-ink">{log.userName}</div>
                        <div className="text-[10px] text-ink-muted">
                          {log.userRole === 'SUPER_ADMIN' ? (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Super Admin</span>
                          ) : log.userRole === 'OPD' ? (
                            <span className="text-blue-700 dark:text-blue-400 font-medium">Petugas OPD</span>
                          ) : (
                            <span>{log.userRole || 'Sistem'}</span>
                          )}
                        </div>
                      </td>

                      {/* Kategori & Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.style}`}>
                          <BadgeIcon className="w-3 h-3 shrink-0" />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* Lokus / Target */}
                      <td className="py-3 px-4 max-w-[180px] truncate text-ink-secondary">
                        {log.unitName ? (
                          <div className="flex items-center gap-1 truncate" title={log.unitName}>
                            <Building className="w-3 h-3 text-ink-muted shrink-0" />
                            <span className="truncate">{log.unitName}</span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3 px-4 text-ink leading-relaxed max-w-[340px]">
                        <p className="line-clamp-2" title={log.description}>
                          {log.description}
                        </p>
                      </td>

                      {/* Tombol Rincian */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          leftIcon={<Info className="w-3 h-3 text-brand" />}>
                          Detail
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-surface-subtle/40 border-t border-stroke/50 flex items-center justify-between text-xs">
            <span className="text-ink-muted">
              Halaman <span className="font-bold text-ink">{currentPage}</span> dari{' '}
              <span className="font-bold text-ink">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
                Sebelumnya
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= totalPages || isPending}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 5. MODAL DETAIL PAYLOAD AKTIVITAS */}
      {selectedLog && (
        <FormModal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          maxWidth="2xl"
          zIndex="z-[100000]"
          title="Rincian Audit Log Aktivitas"
          description={`ID Log: ${selectedLog.id}`}
          footer={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedLog(null)}>
              Tutup
            </Button>
          }>
          <div className="space-y-4 text-xs text-ink">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-subtle border border-stroke/50">
              <div>
                <span className="text-[11px] text-ink-muted block">Waktu Kejadian:</span>
                <span className="font-bold text-ink font-mono">{formatWitaDateTime(selectedLog.createdAt)}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Pelaku (Aktor):</span>
                <span className="font-bold text-ink">
                  {selectedLog.userName} ({selectedLog.userRole || 'Sistem'})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Kategori / Aksi:</span>
                <span className="font-semibold text-brand">
                  {selectedLog.category} · {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Lokus / Unit Terkait:</span>
                <span className="font-semibold text-ink">{selectedLog.unitName || '-'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">Deskripsi:</span>
              <p className="p-3 rounded-xl bg-surface border border-stroke/50 leading-relaxed font-medium">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                  Metadata Audit (JSON Payload):
                </span>
                <pre className="p-3 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[260px] leading-relaxed">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </FormModal>
      )}

      {/* 6. MODAL RETENSI MANUAL PEMBERSIHAN LOG */}
      {isRetentionModalOpen && (
        <FormModal
          isOpen={isRetentionModalOpen}
          onClose={() => setIsRetentionModalOpen(false)}
          maxWidth="lg"
          zIndex="z-[100000]"
          title="Manajemen Retensi Log Aktivitas"
          description="Bersihkan arsip log aktivitas lama untuk mengoptimalkan ruang penyimpanan dan performa database."
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsRetentionModalOpen(false)}
                disabled={isPurging}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleExecutePurge}
                disabled={isPurging}
                isLoading={isPurging}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Eksekusi Pembersihan
              </Button>
            </>
          }>
          <div className="space-y-4 text-xs text-ink">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Peringatan Kebijakan Retensi Manual</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Log aktivitas yang dihapus <strong>tidak dapat dipulihkan</strong> kembali. Namun, aktivitas
                pembersihan retensi ini sendiri akan dicatat secara permanen di baris log baru untuk keperluan audit
                pemeriksaan.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-xs text-ink block mb-1.5">
                  Batas Umur Log yang Akan Dihapus:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { days: 30, label: 'Lebih dari 30 Hari (1 Bulan)' },
                    { days: 60, label: 'Lebih dari 60 Hari (2 Bulan)' },
                    { days: 90, label: 'Lebih dari 90 Hari (3 Bulan - Disarankan)' },
                    { days: 180, label: 'Lebih dari 180 Hari (6 Bulan)' },
                    { days: 365, label: 'Lebih dari 365 Hari (1 Tahun)' }
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setRetentionDays(opt.days)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        retentionDays === opt.days
                          ? 'border-brand bg-brand-light/40 text-brand shadow-2xs'
                          : 'border-stroke/60 bg-surface text-ink hover:bg-surface-subtle'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {retentionDays === opt.days && <CheckCircle2 className="w-3.5 h-3.5 text-brand" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-ink block mb-1.5">Kategori Log Target:</label>
                <select
                  value={retentionCategory}
                  onChange={(e) => setRetentionCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium">
                  <option value="ALL">Semua Kategori Aktivitas</option>
                  <option value="AUTH">Hanya Log Autentikasi &amp; Login</option>
                  <option value="EVALUATION">Hanya Log Formulir &amp; Penilaian</option>
                  <option value="SYNC_MENPAN">Hanya Log Sinkronisasi MenPAN-RB</option>
                  <option value="USER_MGMT">Hanya Log Manajemen Akun</option>
                  <option value="SYSTEM">Hanya Log Sistem</option>
                </select>
              </div>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  )
}
