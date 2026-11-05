'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Bell,
  Send,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  Radio,
  Clock,
  RotateCw,
  Search,
  Filter,
  Check,
  History,
  Info,
  Sun,
  Moon,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  sendBroadcastNotificationAction,
  sendSelfTestPushAction,
  getRecentBroadcastHistoryAction,
  BroadcastNotificationInput
} from '../../../actions/push-actions'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { UnderlineTabs } from '../../../components/ui/Tabs'

interface UnitOption {
  id: string
  name: string
  code: string | null
}

export interface NotificationHistoryItem {
  id: string
  title: string
  message: string
  type: string
  roleTarget: 'SUPER_ADMIN' | 'OPD' | null
  unitId: string | null
  link: string | null
  createdAt: Date | string
}

interface AdminBroadcastClientProps {
  units: UnitOption[]
  stats: {
    total: number
    adminCount: number
    opdCount: number
    guestCount: number
  }
  initialHistory?: NotificationHistoryItem[]
  initialTotalCount?: number
  initialHasMore?: boolean
}

const NOTIFICATION_CATEGORIES = [
  { value: 'PENGUMUMAN', label: 'Pengumuman Resmi' },
  { value: 'REMINDER', label: 'Tenggat Waktu' },
  { value: 'F01_UPDATE', label: 'Pembaruan F01 OPD' },
  { value: 'F02_UPDATE', label: 'Penilaian Evaluator' },
  { value: 'PROOF_TRIGGER', label: 'Bukti Dukung' }
]

const TARGET_OPTIONS = [
  { id: 'ALL', label: 'Semua Pengguna', desc: 'Seluruh perangkat yang telah mengaktifkan push' },
  { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Tim pembina dan evaluator pelayanan' },
  { id: 'OPD', label: 'Operator OPD', desc: 'Seluruh operator unit lokus evaluasi' },
  { id: 'UNIT', label: 'Unit Spesifik', desc: 'Kirim terarah ke satu unit lokus tertentu' }
]

export function AdminBroadcastClient({
  units,
  stats,
  initialHistory = [],
  initialTotalCount = 0,
  initialHasMore = false
}: AdminBroadcastClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 1. Tab synced with URL query (?tab=broadcast or ?tab=history)
  const currentTabParam = searchParams.get('tab')
  const activeTab = currentTabParam === 'history' ? 'history' : 'broadcast'

  const handleTabChange = (tab: 'broadcast' | 'history') => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'history') {
      params.set('tab', 'history')
    } else {
      params.delete('tab')
    }
    const queryString = params.toString()
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  // Form states
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'ALL' | 'SUPER_ADMIN' | 'OPD' | 'UNIT'>('ALL')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [notifType, setNotifType] = useState<string>('PENGUMUMAN')
  const [link, setLink] = useState<string>('/notifikasi')
  const [previewTheme, setPreviewTheme] = useState<'system' | 'dark' | 'light'>('system')

  // Real Server-Side History Pagination States
  const [historyItems, setHistoryItems] = useState<NotificationHistoryItem[]>(initialHistory)
  const [totalHistoryCount, setTotalHistoryCount] = useState<number>(initialTotalCount || initialHistory.length)
  const [historyPage, setHistoryPage] = useState<number>(1)
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [isFilterFetching, setIsFilterFetching] = useState<boolean>(false)
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false)
  const [historyFilter, setHistoryFilter] = useState<string>('ALL')
  const [historySearch, setHistorySearch] = useState<string>('')

  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const isFirstFilterMountRef = useRef<boolean>(true)

  const [isSending, setIsSending] = useState(false)
  const [isTestingSelf, setIsTestingSelf] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    timestamp: string
    stats?: any
  } | null>(null)

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !message.trim()) {
      toast.error('Judul dan konten notifikasi wajib diisi!')
      return
    }

    if (targetType === 'UNIT' && !selectedUnitId) {
      toast.error('Silakan pilih Unit Lokus tujuan!')
      return
    }

    setIsSending(true)
    try {
      const payload: BroadcastNotificationInput = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        unitId: targetType === 'UNIT' ? selectedUnitId : null,
        type: notifType,
        link: link.trim() || '/notifikasi'
      }

      const res = await sendBroadcastNotificationAction(payload)

      if (res.success) {
        toast.success(
          `Notifikasi berhasil dikirim! (${res.successCount} perangkat terkirim via Web Push & tersimpan di pusat notifikasi)`
        )
        setLastResult({
          success: true,
          message: `Berhasil dikirim ke ${res.successCount} perangkat push dan dicatat pada riwayat notifikasi in-app.`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          stats: res
        })
        // Reset form
        setTitle('')
        setMessage('')
      } else {
        toast.error(res.error || 'Gagal mengirim notifikasi')
        setLastResult({
          success: false,
          message: res.error || 'Terjadi kesalahan saat memproses pengiriman notifikasi.',
          timestamp: new Date().toLocaleTimeString('id-ID')
        })
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan jaringan/server.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSelfTest = async () => {
    setIsTestingSelf(true)
    try {
      const res = await sendSelfTestPushAction()
      if (res.success) {
        toast.success(`Uji coba push terkirim ke ${res.count} perangkat aktif akun Anda.`)
      } else {
        toast.error(res.error || 'Gagal mengirim push uji coba.')
      }
    } catch {
      toast.error('Gagal mengirim uji coba push.')
    } finally {
      setIsTestingSelf(false)
    }
  }

  // Real Server-Side Filter & Search Fetch with Debounce
  useEffect(() => {
    if (isFirstFilterMountRef.current) {
      isFirstFilterMountRef.current = false
      return
    }

    const timer = setTimeout(async () => {
      setIsFilterFetching(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '10')
        if (historySearch.trim()) params.set('search', historySearch.trim())
        if (historyFilter !== 'ALL') params.set('category', historyFilter)

        const res = await fetch(`/api/admin/notifikasi/history?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setHistoryItems(data.items || [])
            setTotalHistoryCount(data.totalCount || 0)
            setHistoryPage(1)
            setHasMoreHistory(Boolean(data.hasMore))
          }
        }
      } catch (err) {
        console.error('Error fetching broadcast history:', err)
      } finally {
        setIsFilterFetching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [historySearch, historyFilter])

  // Real Server-Side Load More
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreHistory || isFilterFetching) return
    setIsLoadingMore(true)

    try {
      const nextPage = historyPage + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '10')
      if (historySearch.trim()) params.set('search', historySearch.trim())
      if (historyFilter !== 'ALL') params.set('category', historyFilter)

      const res = await fetch(`/api/admin/notifikasi/history?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const newBatch: NotificationHistoryItem[] = data.items || []
          setHistoryItems((prev) => {
            const seen = new Set(prev.map((i) => i.id))
            const filteredNew = newBatch.filter((i) => !seen.has(i.id))
            return [...prev, ...filteredNew]
          })
          setHistoryPage(nextPage)
          setTotalHistoryCount(data.totalCount || 0)
          setHasMoreHistory(Boolean(data.hasMore))
        }
      }
    } catch (err) {
      console.error('Error loading more broadcast history:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [historyPage, hasMoreHistory, isLoadingMore, isFilterFetching, historySearch, historyFilter])

  // Infinite Scroll Trigger via IntersectionObserver
  useEffect(() => {
    if (activeTab !== 'history' || !hasMoreHistory || isLoadingMore || isFilterFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    const el = loadMoreTriggerRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [activeTab, hasMoreHistory, isLoadingMore, isFilterFetching, loadMore])

  const refreshHistory = async () => {
    setIsRefreshingHistory(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '10')
      if (historySearch.trim()) params.set('search', historySearch.trim())
      if (historyFilter !== 'ALL') params.set('category', historyFilter)

      const res = await fetch(`/api/admin/notifikasi/history?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setHistoryItems(data.items || [])
          setTotalHistoryCount(data.totalCount || 0)
          setHistoryPage(1)
          setHasMoreHistory(Boolean(data.hasMore))
          toast.success('Riwayat notifikasi berhasil dimuat ulang.')
        }
      }
    } catch {
      toast.error('Gagal memuat ulang riwayat.')
    } finally {
      setIsRefreshingHistory(false)
    }
  }

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'PENGUMUMAN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-500/20">Pengumuman</span>
      case 'REMINDER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-medium border border-amber-500/20">Tenggat Waktu</span>
      case 'F01_UPDATE':
      case 'F01_REVISION':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium border border-indigo-500/20">Formulir F01</span>
      case 'F02_UPDATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-500/20">Penilaian F02</span>
      case 'PROOF_TRIGGER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-medium border border-purple-500/20">Bukti Dukung</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted text-[10px] font-medium border border-stroke">Informasi</span>
    }
  }

  const getTargetBadge = (roleTarget: string | null, unitId: string | null) => {
    if (unitId) {
      const u = units.find((x) => x.id === unitId)
      return (
        <span className="text-[11px] text-ink-secondary truncate max-w-[200px]" title={u?.name || unitId}>
          Lokus: <strong className="font-medium text-ink">{u?.name || 'Unit Khusus'}</strong>
        </span>
      )
    }
    if (roleTarget === 'SUPER_ADMIN') {
      return <span className="text-[11px] text-ink-secondary">Target: <strong className="font-medium text-ink">Super Admin</strong></span>
    }
    if (roleTarget === 'OPD') {
      return <span className="text-[11px] text-ink-secondary">Target: <strong className="font-medium text-ink">Operator OPD</strong></span>
    }
    return <span className="text-[11px] text-ink-secondary">Target: <strong className="font-medium text-ink">Semua Pengguna</strong></span>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Halaman (Sesuai Konvensi Admin PEKPPP) */}
      <PageHeader
        title="Broadcast Notifikasi PWA"
        description="Pusat transmisi pesan resmi dan Web Push Notification berstandar PWA untuk seluruh operator dan evaluator Kabupaten Kutai Barat."
        icon={<Radio className="w-5 h-5 text-brand" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSelfTest}
              disabled={isTestingSelf}
              isLoading={isTestingSelf}
              leftIcon={<Smartphone className="w-4 h-4 text-brand" />}>
              Uji Coba Push ke Perangkat Saya
            </Button>
          </div>
        }
      />

      {/* Grid Status Langganan Perangkat (High Density Ledger Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-stroke/60 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Perangkat Aktif</span>
            <Smartphone className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink tracking-tight tabular-nums">
              {stats.total}
            </span>
            <span className="text-[11px] text-ink-muted">endpoint</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Browser terdaftar Web Push</p>
        </div>

        <div className="bg-surface border border-stroke/60 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Super Admin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink tracking-tight tabular-nums">
              {stats.adminCount}
            </span>
            <span className="text-[11px] text-ink-muted">perangkat</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Evaluator & Tim Pembina</p>
        </div>

        <div className="bg-surface border border-stroke/60 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Operator OPD</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink tracking-tight tabular-nums">
              {stats.opdCount}
            </span>
            <span className="text-[11px] text-ink-muted">perangkat</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Unit Lokus Pelayanan</p>
        </div>

        <div className="bg-surface border border-stroke/60 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tamu / Publik</span>
            <Laptop className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink tracking-tight tabular-nums">
              {stats.guestCount}
            </span>
            <span className="text-[11px] text-ink-muted">perangkat</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Perangkat umum terdaftar</p>
        </div>
      </div>

      {/* Navigasi Tab Internal: Buat Broadcast vs Riwayat Transmisi */}
      <UnderlineTabs<'broadcast' | 'history'>
        activeId={activeTab}
        onChange={handleTabChange}
        items={[
          {
            id: 'broadcast',
            label: 'Kirim Broadcast Baru',
            icon: <Send className="w-3.5 h-3.5" />
          },
          {
            id: 'history',
            label: 'Riwayat Transmisi',
            icon: <History className="w-3.5 h-3.5" />,
            count: totalHistoryCount
          }
        ]}
        rightContent={
          activeTab === 'history' ? (
            <button
              type="button"
              onClick={refreshHistory}
              disabled={isRefreshingHistory}
              className="text-xs text-ink-secondary hover:text-ink flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer">
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-brand' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          ) : undefined
        }
      />

      {/* TAB 1: FORMULIR BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-content">
          {/* Form Utama (7 Kolom) */}
          <div className="lg:col-span-7 bg-surface border border-stroke/60 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="border-b border-stroke/50 pb-4">
              <h2 className="text-sm font-semibold text-ink">Konfigurasi Pengiriman Pesan</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Pesan akan langsung dipancarkan ke Web Push Service dan diarsipkan pada tab notifikasi in-app.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Target Penerima */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink flex items-center justify-between">
                  <span>Sasaran Distribusi Notifikasi</span>
                  <span className="text-[11px] font-normal text-ink-muted">Wajib dipilih</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TARGET_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`relative flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                        targetType === opt.id
                          ? 'border-brand bg-brand-light/40 dark:bg-brand-light/10 text-brand ring-1 ring-brand'
                          : 'border-stroke/60 bg-surface hover:bg-surface-subtle text-ink-secondary'
                      }`}>
                      <input
                        type="radio"
                        name="targetType"
                        value={opt.id}
                        checked={targetType === opt.id}
                        onChange={() => setTargetType(opt.id as any)}
                        className="sr-only"
                      />
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-xs font-semibold text-ink">{opt.label}</div>
                        <div className="text-[11px] text-ink-muted leading-tight mt-0.5">{opt.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          targetType === opt.id
                            ? 'border-brand bg-brand text-white'
                            : 'border-stroke bg-surface'
                        }`}>
                        {targetType === opt.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selector Unit Spesifik jika Target == UNIT */}
              {targetType === 'UNIT' && (
                <div className="p-3.5 rounded-xl bg-surface-subtle/50 border border-stroke/60 space-y-1.5 animate-fade-in-content">
                  <label htmlFor="unitSelect" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-brand" />
                    <span>Tentukan Unit Kerja / Lokus Sasaran</span>
                  </label>
                  <select
                    id="unitSelect"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs">
                    <option value="">-- Pilih Unit Lokus Pelayanan --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.code ? `[${u.code}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Kategori Badge & Tautan Aksi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="kategoriNotif" className="text-xs font-semibold text-ink">Klasifikasi Notifikasi</label>
                  <select
                    id="kategoriNotif"
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs">
                    {NOTIFICATION_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tautanAksi" className="text-xs font-semibold text-ink">Tautan Aksi (Direct URL)</label>
                  <input
                    id="tautanAksi"
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/notifikasi atau /evaluasi/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Judul Notifikasi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="judulNotif" className="text-xs font-semibold text-ink">
                    Judul Notifikasi
                  </label>
                  <span className="text-[10px] text-ink-muted tabular-nums">{title.length}/100</span>
                </div>
                <input
                  id="judulNotif"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Batas Akhir Unggah Berkas Eviden PEKPPP 2026"
                  maxLength={100}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs font-medium"
                />
              </div>

              {/* Konten Notifikasi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="pesanNotif" className="text-xs font-semibold text-ink">
                    Isi Pesan Notifikasi
                  </label>
                  <span className="text-[10px] text-ink-muted tabular-nums">{message.length}/250</span>
                </div>
                <textarea
                  id="pesanNotif"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan petunjuk teknis atau ringkasan instruksi yang padat dan informatif..."
                  rows={3}
                  maxLength={250}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs resize-none"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stroke/40">
                <div className="text-[11px] text-ink-muted">
                  Transmisi instan terenkripsi AES-GCM via VAPID protokol.
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSending}
                  isLoading={isSending}
                  leftIcon={<Send className="w-4 h-4" />}>
                  Kirim Notifikasi & Push
                </Button>
              </div>
            </form>

            {/* Status Hasil Pengiriman */}
            {lastResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 animate-fade-in-content ${
                  lastResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-900 dark:text-rose-200'
                }`}>
                {lastResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span>{lastResult.success ? 'Transmisi Sukses' : 'Gagal Mengirimkan'}</span>
                    <span className="text-[10px] opacity-75 font-mono">{lastResult.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{lastResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Kolom Pratinjau Tampilan (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface border border-stroke/60 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stroke/50 pb-3">
                <span className="text-xs font-semibold text-ink">Pratinjau Hasil Tampilan</span>
                <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-stroke/50 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPreviewTheme('system')}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      previewTheme === 'system'
                        ? 'bg-surface text-ink font-semibold shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}>
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme('light')}
                    className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                      previewTheme === 'light'
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}>
                    <Sun className="w-2.5 h-2.5" />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme('dark')}
                    className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer ${
                      previewTheme === 'dark'
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}>
                    <Moon className="w-2.5 h-2.5" />
                    <span>Gelap</span>
                  </button>
                </div>
              </div>

              {/* Pratinjau OS Push Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="font-medium">1. Tampilan Banner Native OS (Windows / Android)</span>
                  <span className="text-[10px] font-mono">
                    {previewTheme === 'system' ? 'Mengikuti Tema Sistem' : previewTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                  </span>
                </div>

                {/* Banner Adaptive Container */}
                <div
                  className={`rounded-xl border p-3.5 shadow-soft-float space-y-2.5 font-sans transition-all duration-200 ${
                    previewTheme === 'dark'
                      ? 'bg-[#0F1420] text-white border-white/10'
                      : previewTheme === 'light'
                      ? 'bg-white text-slate-900 border-slate-200/90 shadow-soft-card'
                      : 'bg-white dark:bg-[#0F1420] text-slate-900 dark:text-white border-slate-200/90 dark:border-white/10 shadow-soft-card dark:shadow-soft-float'
                  }`}>
                  <div
                    className={`flex items-center justify-between text-[11px] pb-2 border-b ${
                      previewTheme === 'dark'
                        ? 'text-white/60 border-white/10'
                        : previewTheme === 'light'
                        ? 'text-slate-500 border-slate-100'
                        : 'text-slate-500 dark:text-white/60 border-slate-100 dark:border-white/10'
                    }`}>
                    <div className="flex items-center gap-2">
                      <img src="/kubar.png" alt="Kubar" className="w-4 h-4 object-contain shrink-0" />
                      <span
                        className={`font-semibold ${
                          previewTheme === 'dark'
                            ? 'text-white/90'
                            : previewTheme === 'light'
                            ? 'text-slate-900'
                            : 'text-slate-900 dark:text-white/90'
                        }`}>
                        PEKPPP Kutai Barat
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        previewTheme === 'dark'
                          ? 'text-white/50'
                          : previewTheme === 'light'
                          ? 'text-slate-400'
                          : 'text-slate-400 dark:text-white/50'
                      }`}>
                      Sekarang
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`text-xs font-semibold tracking-tight leading-snug ${
                        previewTheme === 'dark'
                          ? 'text-white'
                          : previewTheme === 'light'
                          ? 'text-slate-900'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                      {title.trim() || 'Judul Notifikasi Ditampilkan di Sini'}
                    </div>
                    <div
                      className={`text-[11px] leading-relaxed line-clamp-2 ${
                        previewTheme === 'dark'
                          ? 'text-white/75'
                          : previewTheme === 'light'
                          ? 'text-slate-600'
                          : 'text-slate-600 dark:text-white/75'
                      }`}>
                      {message.trim() ||
                        'Ringkasan teks notifikasi akan terbaca secara native pada pusat aksi atau lockscreen pengguna.'}
                    </div>
                  </div>

                  <div
                    className={`pt-2 flex items-center justify-between text-[10px] border-t ${
                      previewTheme === 'dark'
                        ? 'text-white/45 border-white/10'
                        : previewTheme === 'light'
                        ? 'text-slate-400 border-slate-100'
                        : 'text-slate-400 dark:text-white/45 border-slate-100 dark:border-white/10'
                    }`}>
                    <span className="truncate max-w-[220px]">Buka: {link || '/notifikasi'}</span>
                    <ExternalLink
                      className={`w-3 h-3 shrink-0 ${
                        previewTheme === 'dark'
                          ? 'text-white/50'
                          : previewTheme === 'light'
                          ? 'text-slate-400'
                          : 'text-slate-400 dark:text-white/50'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Pratinjau In-App List Card */}
              <div className="space-y-2 pt-2 border-t border-stroke/40">
                <div className="text-[11px] font-medium text-ink-muted">
                  2. Tampilan Kartu di Pusat Notifikasi (/notifikasi)
                </div>
                <div className="rounded-xl border border-brand/30 bg-surface-elevated p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(notifType)}
                    <span className="text-[10px] text-ink-muted">Baru saja</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-brand text-white text-[9px] font-semibold">
                      Baru
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-ink leading-snug">
                    {title.trim() || 'Judul Notifikasi'}
                  </div>
                  <div className="text-[11px] text-ink-secondary leading-relaxed line-clamp-2">
                    {message.trim() || 'Isi pesan akan tampil lengkap dalam riwayat notifikasi in-app.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan Standar Operasional */}
            <div className="p-4 rounded-2xl bg-surface border border-stroke/60 text-xs space-y-2 text-ink-muted">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <Info className="w-4 h-4 text-brand" />
                <span>Ketentuan Transmisi Web Push</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Pesan push dikirim melalui protokol standar W3C Push API. Endpoint yang sudah tidak aktif (browser di-uninstall atau izin dicabut) akan dibersihkan secara otomatis oleh sistem saat pengiriman berlangsung.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSMISI NOTIFIKASI */}
      {activeTab === 'history' && (
        <div className="bg-surface border border-stroke/60 rounded-2xl shadow-2xs overflow-hidden animate-fade-in-content">
          {/* Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-stroke/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari arsip notifikasi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stroke/80 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs">
                <option value="ALL">Semua Kategori</option>
                {NOTIFICATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / Ledger List */}
          {isFilterFetching ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
              <p className="text-xs text-ink-muted">Menyaring data notifikasi...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-ink-muted mx-auto opacity-30" />
              <h3 className="text-xs font-semibold text-ink">Tidak Ada Riwayat Notifikasi</h3>
              <p className="text-[11px] text-ink-muted">
                {historySearch || historyFilter !== 'ALL'
                  ? 'Tidak ada notifikasi yang sesuai dengan kriteria pencarian.'
                  : 'Belum ada catatan transmisi notifikasi di sistem.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-stroke/50">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-surface-subtle/40 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getCategoryBadge(item.type)}
                        {getTargetBadge(item.roleTarget, item.unitId)}
                        <span className="text-[10px] text-ink-muted font-mono">
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-ink leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="pt-0.5">
                          <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded border border-stroke/40 inline-flex items-center gap-1">
                            <span>Link:</span>
                            <span className="text-brand font-medium truncate max-w-[280px]">{item.link}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Real Server-Side Load More Trigger Area */}
              <div ref={loadMoreTriggerRef} className="p-4 border-t border-stroke/50 text-center">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-ink-muted py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    <span>Memuat arsip lebih lama...</span>
                  </div>
                ) : hasMoreHistory ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="px-4 py-2 text-xs font-semibold text-brand hover:text-brand-hover hover:bg-surface-subtle rounded-xl border border-stroke/80 transition-all cursor-pointer">
                    Muat Lebih Banyak ({historyItems.length} dari {totalHistoryCount})
                  </button>
                ) : historyItems.length > 0 ? (
                  <p className="text-[11px] text-ink-muted py-1 font-mono">
                    Menampilkan seluruh {totalHistoryCount} riwayat notifikasi.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}

